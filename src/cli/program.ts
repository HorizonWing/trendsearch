import type { z } from "zod";

import { Command, Option } from "commander";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";

import type {
  CreateClientConfig,
  TrendSearchClient,
} from "../client/public-types";

import { createClient as defaultCreateClient } from "../client/create-client";
import { completeWords, renderCompletionScript } from "./completion";
import {
  type CliConfigStore,
  type GlobalFlagOptions,
  resolveGlobalOptions,
  toCreateClientConfig,
} from "./config";
import {
  createCliExitSignal,
  CliUsageError,
  normalizeCliError,
} from "./errors";
import {
  endpointManifest,
  findEndpointDefinitionByPath,
  globalOptions,
  type CliOptionDefinition,
  type EndpointCommandDefinition,
} from "./manifest";
import {
  type CliIo,
  createStderrSpinner,
  writeArbitraryOutput,
  writeErrorEnvelope,
  writeSuccessEnvelope,
} from "./output";
import { runWizardPrompt } from "./wizard";

export interface CreateProgramOptions {
  io: CliIo;
  env: Record<string, string | undefined>;
  configStore: CliConfigStore;
  stdin: NodeJS.ReadableStream;
  createClient?: (config?: CreateClientConfig) => TrendSearchClient;
}

const toStringArray = (value: string, previous: string[]): string[] => [
  ...previous,
  ...value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0),
];

const addOptionDefinition = (
  command: Command,
  option: CliOptionDefinition
): void => {
  if (option.type === "boolean") {
    command.option(option.flags, option.description);
    return;
  }

  const definition = new Option(option.flags, option.description);

  if (option.choices && option.choices.length > 0) {
    definition.choices([...option.choices]);
  }

  if (option.type === "number") {
    definition.argParser(Number);
  }

  if (option.type === "string-array") {
    definition.argParser((value: string, previous: string[] = []) =>
      toStringArray(value, previous)
    );
    definition.default([]);
  }

  if (option.type === "string-array-raw") {
    definition.argParser((value: string, previous: string[] = []) => [
      ...previous,
      value,
    ]);
    definition.default([]);
  }

  command.addOption(definition);
};

const addGlobalOptions = (command: Command): void => {
  for (const option of globalOptions) {
    addOptionDefinition(command, option);
  }
};

const extractGlobalFlags = (
  options: Record<string, unknown>
): GlobalFlagOptions => ({
  output: options.output as GlobalFlagOptions["output"],
  raw: options.raw as GlobalFlagOptions["raw"],
  spinner: options.spinner as GlobalFlagOptions["spinner"],
  hl: options.hl as GlobalFlagOptions["hl"],
  tz: options.tz as GlobalFlagOptions["tz"],
  baseUrl: options.baseUrl as GlobalFlagOptions["baseUrl"],
  timeoutMs: options.timeoutMs as GlobalFlagOptions["timeoutMs"],
  maxRetries: options.maxRetries as GlobalFlagOptions["maxRetries"],
  retryBaseDelayMs:
    options.retryBaseDelayMs as GlobalFlagOptions["retryBaseDelayMs"],
  retryMaxDelayMs:
    options.retryMaxDelayMs as GlobalFlagOptions["retryMaxDelayMs"],
  maxConcurrent: options.maxConcurrent as GlobalFlagOptions["maxConcurrent"],
  minDelayMs: options.minDelayMs as GlobalFlagOptions["minDelayMs"],
  userAgent: options.userAgent as GlobalFlagOptions["userAgent"],
  input: options.input as GlobalFlagOptions["input"],
});

const readStdin = async (stdin: NodeJS.ReadableStream): Promise<string> =>
  new Promise((resolve, reject) => {
    const chunks: string[] = [];

    // Read UTF-8 command input from stdin only when requested with --input -
    if ("setEncoding" in stdin && typeof stdin.setEncoding === "function") {
      stdin.setEncoding("utf8");
    }

    stdin.on("data", (chunk: Buffer | string) => {
      chunks.push(typeof chunk === "string" ? chunk : chunk.toString("utf8"));
    });

    stdin.on("error", (error: unknown) => {
      reject(error);
    });

    stdin.on("end", () => {
      resolve(chunks.join(""));
    });
  });

const parseJsonInput = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    throw new CliUsageError("Invalid JSON input payload.", {
      input: text,
    });
  }
};

const loadInputPayload = async (args: {
  input: string;
  stdin: NodeJS.ReadableStream;
}): Promise<unknown> => {
  if (args.input === "-") {
    const value = await readStdin(args.stdin);
    return parseJsonInput(value);
  }

  if (existsSync(args.input)) {
    const value = await readFile(args.input, "utf8");
    return parseJsonInput(value);
  }

  return parseJsonInput(args.input);
};

const withCommonRequestDefaults = (args: {
  request: unknown;
  hl?: string;
  tz?: number;
}): unknown => {
  const shouldApplyCommon = args.hl !== undefined || args.tz !== undefined;
  if (!shouldApplyCommon) {
    return args.request;
  }

  const base = args.request;
  if (base === undefined || base === null) {
    const requestDefaults: Record<string, unknown> = {};
    if (args.hl === undefined) {
      // Keep request unchanged when hl is not provided.
    } else {
      requestDefaults.hl = args.hl;
    }

    if (args.tz === undefined) {
      // Keep request unchanged when tz is not provided.
    } else {
      requestDefaults.tz = args.tz;
    }

    return requestDefaults;
  }

  if (typeof base !== "object" || Array.isArray(base)) {
    return base;
  }

  const draft = {
    ...(base as Record<string, unknown>),
  };

  if (args.hl !== undefined && draft.hl === undefined) {
    draft.hl = args.hl;
  }

  if (args.tz !== undefined && draft.tz === undefined) {
    draft.tz = args.tz;
  }

  return draft;
};

const toValidationIssues = (error: z.ZodError): string[] =>
  error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join(".") : "request";
    return `${path}: ${issue.message}`;
  });

const parseRequestWithSchema = (args: {
  definition: EndpointCommandDefinition;
  request: unknown;
}): unknown => {
  const parsed = args.definition.requestSchema.safeParse(args.request);
  if (parsed.success) {
    return parsed.data;
  }

  throw new CliUsageError("Request validation failed.", {
    endpoint: args.definition.path.join(" "),
    issues: toValidationIssues(parsed.error),
  });
};

const createEndpointEnvelope = (args: {
  endpoint: string;
  request: unknown;
  result: unknown;
  command: string;
  output: "pretty" | "json" | "jsonl";
  durationMs: number;
  includeRaw: boolean;
}) => {
  const endpointResult = args.result as {
    data: unknown;
    raw?: unknown;
  };

  return {
    ok: true as const,
    endpoint: args.endpoint,
    request: args.request,
    data: endpointResult.data,
    meta: {
      command: args.command,
      durationMs: args.durationMs,
      timestamp: new Date().toISOString(),
      output: args.output,
    },
    ...(args.includeRaw && endpointResult.raw !== undefined
      ? { raw: endpointResult.raw }
      : {}),
  };
};

const executeEndpointCommand = async (args: {
  definition: EndpointCommandDefinition;
  positionals: unknown[];
  options: Record<string, unknown>;
  io: CliIo;
  env: Record<string, string | undefined>;
  configStore: CliConfigStore;
  stdin: NodeJS.ReadableStream;
  createClient: (config?: CreateClientConfig) => TrendSearchClient;
  forcedRequest?: unknown;
  forcedOutput?: "pretty" | "json" | "jsonl";
  forcedRaw?: boolean;
}): Promise<void> => {
  const globalFlags = extractGlobalFlags(args.options);
  const resolvedGlobal = resolveGlobalOptions({
    flags: globalFlags,
    env: args.env,
    store: args.configStore,
    stdoutIsTty: args.io.stdout.isTTY === true,
  });

  if (args.forcedOutput) {
    resolvedGlobal.output = args.forcedOutput;
  }

  if (args.forcedRaw !== undefined) {
    resolvedGlobal.raw = args.forcedRaw;
  }

  const requestPayload =
    args.forcedRequest ??
    (resolvedGlobal.input
      ? await loadInputPayload({
          input: resolvedGlobal.input,
          stdin: args.stdin,
        })
      : args.definition.buildRequest({
          positionals: args.positionals,
          options: args.options,
        }));

  const requestWithCommonDefaults = withCommonRequestDefaults({
    request: requestPayload,
    hl: resolvedGlobal.hl,
    tz: resolvedGlobal.tz,
  });

  const request = parseRequestWithSchema({
    definition: args.definition,
    request: requestWithCommonDefaults,
  });

  const spinner = createStderrSpinner({
    io: args.io,
    enabled: resolvedGlobal.spinner && resolvedGlobal.output === "pretty",
  });

  spinner.start(`Running ${args.definition.path.join(" ")}...`);

  try {
    const client = args.createClient(toCreateClientConfig(resolvedGlobal));
    const start = Date.now();

    const result = await args.definition.invoke(client, request, {
      debugRawResponse: resolvedGlobal.raw,
    });

    const durationMs = Date.now() - start;
    spinner.stop(`Completed ${args.definition.path.join(" ")}.`);

    writeSuccessEnvelope({
      io: args.io,
      mode: resolvedGlobal.output,
      envelope: createEndpointEnvelope({
        endpoint: args.definition.id,
        request,
        result,
        command: args.definition.path.join(" "),
        output: resolvedGlobal.output,
        durationMs,
        includeRaw: resolvedGlobal.raw,
      }),
    });
  } catch (error) {
    spinner.fail(`Failed ${args.definition.path.join(" ")}.`);
    const normalized = normalizeCliError(error);
    writeErrorEnvelope({
      io: args.io,
      mode: resolvedGlobal.output,
      error: normalized,
    });
    throw createCliExitSignal(normalized.exitCode);
  }
};

const safeConfigAction = async (args: {
  io: CliIo;
  env: Record<string, string | undefined>;
  store: CliConfigStore;
  options: Record<string, unknown>;
  task: () => unknown | Promise<unknown>;
}): Promise<void> => {
  const resolved = resolveGlobalOptions({
    flags: {
      output: args.options.output as GlobalFlagOptions["output"],
    },
    env: args.env,
    store: args.store,
    stdoutIsTty: args.io.stdout.isTTY === true,
  });

  try {
    const payload = await args.task();
    writeArbitraryOutput({
      io: args.io,
      mode: resolved.output,
      payload,
    });
  } catch (error) {
    const normalized = normalizeCliError(error);
    writeErrorEnvelope({
      io: args.io,
      mode: resolved.output,
      error: normalized,
    });
    throw createCliExitSignal(normalized.exitCode);
  }
};

const configureConfigCommands = (args: {
  program: Command;
  io: CliIo;
  env: Record<string, string | undefined>;
  store: CliConfigStore;
}): void => {
  const configCommand = args.program
    .command("config")
    .description("Manage persisted CLI defaults.");

  configCommand
    .command("get <key>")
    .description("Get a persisted config value.")
    .option("--output <mode>", "Output mode (pretty|json|jsonl).", "pretty")
    .action(async (...actionArgs: unknown[]) => {
      const command = actionArgs.at(-1) as Command;
      const options = command.opts() as Record<string, unknown>;
      const [key] = command.processedArgs as [string];

      await safeConfigAction({
        io: args.io,
        env: args.env,
        store: args.store,
        options,
        task: () => ({ key, value: args.store.get(key) }),
      });
    });

  configCommand
    .command("set <key> <value>")
    .description("Persist a config value.")
    .option("--json", "Parse value as JSON.")
    .option("--output <mode>", "Output mode (pretty|json|jsonl).", "pretty")
    .action(async (...actionArgs: unknown[]) => {
      const command = actionArgs.at(-1) as Command;
      const options = command.opts() as Record<string, unknown>;
      const [key, value] = command.processedArgs as [string, string];

      await safeConfigAction({
        io: args.io,
        env: args.env,
        store: args.store,
        options,
        task: () => {
          const parsed = options.json ? parseJsonInput(value) : value;
          args.store.set(key, parsed);
          return {
            key,
            value: args.store.get(key),
          };
        },
      });
    });

  configCommand
    .command("unset <key>")
    .description("Delete a persisted config value.")
    .option("--output <mode>", "Output mode (pretty|json|jsonl).", "pretty")
    .action(async (...actionArgs: unknown[]) => {
      const command = actionArgs.at(-1) as Command;
      const options = command.opts() as Record<string, unknown>;
      const [key] = command.processedArgs as [string];

      await safeConfigAction({
        io: args.io,
        env: args.env,
        store: args.store,
        options,
        task: () => {
          args.store.delete(key);
          return {
            key,
            removed: true,
          };
        },
      });
    });

  configCommand
    .command("list")
    .description("List all persisted config values.")
    .option("--output <mode>", "Output mode (pretty|json|jsonl).", "pretty")
    .action(async (...actionArgs: unknown[]) => {
      const command = actionArgs.at(-1) as Command;
      const options = command.opts() as Record<string, unknown>;

      await safeConfigAction({
        io: args.io,
        env: args.env,
        store: args.store,
        options,
        task: () => args.store.all(),
      });
    });

  configCommand
    .command("reset")
    .description("Clear all persisted config values.")
    .option("--output <mode>", "Output mode (pretty|json|jsonl).", "pretty")
    .action(async (...actionArgs: unknown[]) => {
      const command = actionArgs.at(-1) as Command;
      const options = command.opts() as Record<string, unknown>;

      await safeConfigAction({
        io: args.io,
        env: args.env,
        store: args.store,
        options,
        task: () => {
          args.store.clear();
          return {
            reset: true,
          };
        },
      });
    });
};

const configureEndpointCommands = (args: {
  program: Command;
  io: CliIo;
  env: Record<string, string | undefined>;
  configStore: CliConfigStore;
  stdin: NodeJS.ReadableStream;
  createClient: (config?: CreateClientConfig) => TrendSearchClient;
}): void => {
  const groupCommands = new Map<string, Command>();

  const getParentCommand = (path: string[]): Command => {
    if (path.length === 0) {
      return args.program;
    }

    let current = args.program;

    for (const segment of path) {
      const key = `${current.name()}:${segment}`;
      const existing = groupCommands.get(key);
      if (existing) {
        current = existing;
        continue;
      }

      const created = current
        .command(segment)
        .description(`${segment} commands.`);
      groupCommands.set(key, created);
      current = created;
    }

    return current;
  };

  for (const definition of endpointManifest) {
    const parentPath = definition.path.slice(0, -1);
    const leaf = definition.path.at(-1);

    if (!leaf) {
      continue;
    }

    const parent = getParentCommand(parentPath);
    const command = parent.command(leaf).description(definition.summary);

    for (const arg of definition.args) {
      command.argument(arg.label, arg.description);
    }

    for (const option of definition.options) {
      addOptionDefinition(command, option);
    }

    addGlobalOptions(command);

    command.action(async (...actionArgs: unknown[]) => {
      const invokedCommand = actionArgs.at(-1) as Command;
      const options = invokedCommand.opts() as Record<string, unknown>;
      const positionals = invokedCommand.processedArgs as unknown[];

      await executeEndpointCommand({
        definition,
        positionals,
        options,
        io: args.io,
        env: args.env,
        configStore: args.configStore,
        stdin: args.stdin,
        createClient: args.createClient,
      });
    });
  }
};

const configureWizardCommand = (args: {
  program: Command;
  io: CliIo;
  env: Record<string, string | undefined>;
  configStore: CliConfigStore;
  stdin: NodeJS.ReadableStream;
  createClient: (config?: CreateClientConfig) => TrendSearchClient;
}): void => {
  const wizardCommand = args.program
    .command("wizard")
    .description("Run the interactive endpoint wizard.");

  addGlobalOptions(wizardCommand);

  wizardCommand.action(async (...actionArgs: unknown[]) => {
    const command = actionArgs.at(-1) as Command;
    const options = command.opts() as Record<string, unknown>;

    const selection = await runWizardPrompt();
    if (!selection) {
      return;
    }

    const definition = findEndpointDefinitionByPath(selection.endpointPath);
    if (!definition) {
      throw new CliUsageError("Unknown wizard endpoint selection.", {
        endpointPath: selection.endpointPath,
      });
    }

    await executeEndpointCommand({
      definition,
      positionals: [],
      options,
      io: args.io,
      env: args.env,
      configStore: args.configStore,
      stdin: args.stdin,
      createClient: args.createClient,
      forcedRequest: selection.request,
      forcedOutput: selection.output,
      forcedRaw: selection.raw,
    });
  });
};

const configureCompletionCommands = (program: Command, io: CliIo): void => {
  program
    .command("completion <shell>")
    .description("Generate shell completion script (bash|zsh|fish).")
    .action((shell: string) => {
      const script = renderCompletionScript(shell, "trendsearch");
      if (!script) {
        throw new CliUsageError("Unsupported shell for completion.", {
          shell,
          supported: ["bash", "zsh", "fish"],
        });
      }

      io.stdout.write(script);
    });

  const completionHook = new Command("__complete")
    .description("Internal shell completion hook.")
    .argument("[hasTrailingSpace]")
    .argument("[words...]")
    .action((...actionArgs: unknown[]) => {
      const command = actionArgs.at(-1) as Command;
      const [hasTrailingSpace, words] = command.processedArgs as [
        string | undefined,
        string[] | undefined,
      ];

      const suggestions = completeWords({
        words: words ?? [],
        hasTrailingSpace: hasTrailingSpace === "1",
      });

      if (suggestions.length > 0) {
        io.stdout.write(`${suggestions.join("\n")}\n`);
      }
    });

  program.addCommand(completionHook, { hidden: true });
};

export const createProgram = (options: CreateProgramOptions): Command => {
  const createClient = options.createClient ?? defaultCreateClient;

  const program = new Command();

  program
    .name("trendsearch")
    .description("Google Trends SDK CLI for stable + experimental endpoints.")
    .version(options.env.npm_package_version ?? "0.0.0")
    .showHelpAfterError();

  configureEndpointCommands({
    program,
    io: options.io,
    env: options.env,
    configStore: options.configStore,
    stdin: options.stdin,
    createClient,
  });

  configureConfigCommands({
    program,
    io: options.io,
    env: options.env,
    store: options.configStore,
  });

  configureWizardCommand({
    program,
    io: options.io,
    env: options.env,
    configStore: options.configStore,
    stdin: options.stdin,
    createClient,
  });

  configureCompletionCommands(program, options.io);

  return program;
};

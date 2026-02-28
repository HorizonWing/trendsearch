import { CommanderError } from "commander";

import { createCliConfigStore } from "./config";
import {
  EXIT_CODES,
  isCliExitSignal,
  isCommanderGracefulExit,
  normalizeCliError,
} from "./errors";
import { type CliIo, writeErrorEnvelope } from "./output";
import { createProgram, type CreateProgramOptions } from "./program";

export interface RunCliOptions {
  argv?: string[];
  io?: CliIo;
  env?: Record<string, string | undefined>;
  stdin?: NodeJS.ReadableStream;
  createClient?: CreateProgramOptions["createClient"];
  configStore?: CreateProgramOptions["configStore"];
}

const defaultIo: CliIo = {
  stdout: process.stdout,
  stderr: process.stderr,
};

const toDefaultOutputMode = (io: CliIo): "pretty" | "json" | "jsonl" =>
  io.stdout.isTTY === true ? "pretty" : "json";

export const runCli = async (options: RunCliOptions = {}): Promise<number> => {
  const env = options.env ?? process.env;
  const io = options.io ?? defaultIo;

  const configStore =
    options.configStore ??
    createCliConfigStore({
      cwd: env.TRENDSEARCH_CONFIG_DIR,
    });

  const program = createProgram({
    io,
    env,
    configStore,
    stdin: options.stdin ?? process.stdin,
    createClient: options.createClient,
  });

  program.configureOutput({
    writeErr: (line) => {
      io.stderr.write(line);
    },
    writeOut: (line) => {
      io.stdout.write(line);
    },
  });

  program.exitOverride();

  try {
    await program.parseAsync(options.argv ?? process.argv);
    return EXIT_CODES.ok;
  } catch (error) {
    if (isCliExitSignal(error)) {
      return error.exitCode;
    }

    if (isCommanderGracefulExit(error)) {
      return EXIT_CODES.ok;
    }

    if (error instanceof CommanderError) {
      return EXIT_CODES.usage;
    }

    const normalized = normalizeCliError(error);
    writeErrorEnvelope({
      io,
      mode: toDefaultOutputMode(io),
      error: normalized,
    });
    return normalized.exitCode;
  }
};

if (import.meta.main) {
  const exitCode = await runCli();
  process.exitCode = exitCode;
}

import Conf from "conf";

import type { CreateClientConfig } from "../client/public-types";
import type { OutputMode } from "./output";

export interface CliConfigStore {
  all: () => Record<string, unknown>;
  get: (key: string) => unknown;
  set: (key: string, value: unknown) => void;
  delete: (key: string) => void;
  clear: () => void;
}

export interface CreateCliConfigStoreOptions {
  cwd?: string;
}

export const createCliConfigStore = (
  options: CreateCliConfigStoreOptions = {}
): CliConfigStore => {
  const store = new Conf<Record<string, unknown>>({
    projectName: "trendsearch",
    configName: "cli",
    cwd: options.cwd,
  });

  return {
    all: () => ({ ...store.store }),
    get: (key) => store.get(key),
    set: (key, value) => {
      store.set(key, value);
    },
    delete: (key) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };
};

export interface GlobalFlagOptions {
  output?: OutputMode;
  raw?: boolean;
  spinner?: boolean;
  hl?: string;
  tz?: number;
  baseUrl?: string;
  timeoutMs?: number;
  maxRetries?: number;
  retryBaseDelayMs?: number;
  retryMaxDelayMs?: number;
  maxConcurrent?: number;
  minDelayMs?: number;
  userAgent?: string;
  input?: string;
}

export interface ResolvedGlobalOptions {
  output: OutputMode;
  raw: boolean;
  spinner: boolean;
  hl?: string;
  tz?: number;
  baseUrl?: string;
  timeoutMs?: number;
  maxRetries?: number;
  retryBaseDelayMs?: number;
  retryMaxDelayMs?: number;
  maxConcurrent?: number;
  minDelayMs?: number;
  userAgent?: string;
  input?: string;
}

const outputModes = new Set<OutputMode>(["pretty", "json", "jsonl"]);

const pickFirst = <T>(...values: (T | undefined)[]): T | undefined => {
  for (const value of values) {
    if (value !== undefined) {
      return value;
    }
  }
  return undefined;
};

const toNumberOrUndefined = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string" || value.length === 0) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const toBooleanOrUndefined = (value: unknown): boolean | undefined => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return undefined;
};

const toOutputModeOrUndefined = (value: unknown): OutputMode | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  if (!outputModes.has(value as OutputMode)) {
    return undefined;
  }

  return value as OutputMode;
};

const readEnv = (
  env: Record<string, string | undefined>
): GlobalFlagOptions => ({
  output: toOutputModeOrUndefined(env.TRENDSEARCH_OUTPUT),
  spinner: toBooleanOrUndefined(env.TRENDSEARCH_SPINNER),
  hl: env.TRENDSEARCH_HL,
  tz: toNumberOrUndefined(env.TRENDSEARCH_TZ),
  baseUrl: env.TRENDSEARCH_BASE_URL,
  timeoutMs: toNumberOrUndefined(env.TRENDSEARCH_TIMEOUT_MS),
  maxRetries: toNumberOrUndefined(env.TRENDSEARCH_MAX_RETRIES),
  retryBaseDelayMs: toNumberOrUndefined(env.TRENDSEARCH_RETRY_BASE_DELAY_MS),
  retryMaxDelayMs: toNumberOrUndefined(env.TRENDSEARCH_RETRY_MAX_DELAY_MS),
  maxConcurrent: toNumberOrUndefined(env.TRENDSEARCH_MAX_CONCURRENT),
  minDelayMs: toNumberOrUndefined(env.TRENDSEARCH_MIN_DELAY_MS),
  userAgent: env.TRENDSEARCH_USER_AGENT,
});

const readStored = (store: CliConfigStore): GlobalFlagOptions => ({
  output: toOutputModeOrUndefined(store.get("output")),
  spinner: toBooleanOrUndefined(store.get("spinner")),
  hl:
    typeof store.get("hl") === "string"
      ? (store.get("hl") as string)
      : undefined,
  tz: toNumberOrUndefined(store.get("tz")),
  baseUrl:
    typeof store.get("baseUrl") === "string"
      ? (store.get("baseUrl") as string)
      : undefined,
  timeoutMs: toNumberOrUndefined(store.get("timeoutMs")),
  maxRetries: toNumberOrUndefined(store.get("maxRetries")),
  retryBaseDelayMs: toNumberOrUndefined(store.get("retryBaseDelayMs")),
  retryMaxDelayMs: toNumberOrUndefined(store.get("retryMaxDelayMs")),
  maxConcurrent: toNumberOrUndefined(store.get("maxConcurrent")),
  minDelayMs: toNumberOrUndefined(store.get("minDelayMs")),
  userAgent:
    typeof store.get("userAgent") === "string"
      ? (store.get("userAgent") as string)
      : undefined,
});

export const resolveGlobalOptions = (args: {
  flags: GlobalFlagOptions;
  env: Record<string, string | undefined>;
  store: CliConfigStore;
  stdoutIsTty: boolean;
}): ResolvedGlobalOptions => {
  const env = readEnv(args.env);
  const stored = readStored(args.store);

  const outputDefault: OutputMode = args.stdoutIsTty ? "pretty" : "json";

  const output =
    pickFirst(args.flags.output, env.output, stored.output, outputDefault) ??
    outputDefault;

  const spinner =
    pickFirst(args.flags.spinner, env.spinner, stored.spinner, true) ?? true;

  return {
    output,
    raw: args.flags.raw ?? false,
    spinner,
    hl: pickFirst(args.flags.hl, env.hl, stored.hl),
    tz: pickFirst(args.flags.tz, env.tz, stored.tz),
    baseUrl: pickFirst(args.flags.baseUrl, env.baseUrl, stored.baseUrl),
    timeoutMs: pickFirst(args.flags.timeoutMs, env.timeoutMs, stored.timeoutMs),
    maxRetries: pickFirst(
      args.flags.maxRetries,
      env.maxRetries,
      stored.maxRetries
    ),
    retryBaseDelayMs: pickFirst(
      args.flags.retryBaseDelayMs,
      env.retryBaseDelayMs,
      stored.retryBaseDelayMs
    ),
    retryMaxDelayMs: pickFirst(
      args.flags.retryMaxDelayMs,
      env.retryMaxDelayMs,
      stored.retryMaxDelayMs
    ),
    maxConcurrent: pickFirst(
      args.flags.maxConcurrent,
      env.maxConcurrent,
      stored.maxConcurrent
    ),
    minDelayMs: pickFirst(
      args.flags.minDelayMs,
      env.minDelayMs,
      stored.minDelayMs
    ),
    userAgent: pickFirst(args.flags.userAgent, env.userAgent, stored.userAgent),
    input: args.flags.input,
  };
};

export const toCreateClientConfig = (
  options: ResolvedGlobalOptions
): CreateClientConfig => ({
  baseUrl: options.baseUrl,
  timeoutMs: options.timeoutMs,
  hl: options.hl,
  tz: options.tz,
  userAgent: options.userAgent,
  retries:
    options.maxRetries !== undefined ||
    options.retryBaseDelayMs !== undefined ||
    options.retryMaxDelayMs !== undefined
      ? {
          maxRetries: options.maxRetries,
          baseDelayMs: options.retryBaseDelayMs,
          maxDelayMs: options.retryMaxDelayMs,
        }
      : undefined,
  rateLimit:
    options.maxConcurrent !== undefined || options.minDelayMs !== undefined
      ? {
          maxConcurrent: options.maxConcurrent,
          minDelayMs: options.minDelayMs,
        }
      : undefined,
});

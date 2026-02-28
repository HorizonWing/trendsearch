import { CommanderError } from "commander";

import {
  EndpointUnavailableError,
  RateLimitError,
  SchemaValidationError,
  TransportError,
  UnexpectedResponseError,
} from "../errors";

export const EXIT_CODES = {
  ok: 0,
  unknown: 1,
  usage: 2,
  endpointUnavailable: 3,
  rateLimited: 4,
  transport: 5,
  schemaDrift: 6,
} as const;

export type ExitCode = (typeof EXIT_CODES)[keyof typeof EXIT_CODES];

export class CliUsageError extends Error {
  public readonly details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = "CliUsageError";
    this.details = details;
  }
}

const exitSignalSymbol = Symbol("CliExitSignal");

export interface CliExitSignal {
  [exitSignalSymbol]: true;
  exitCode: ExitCode;
}

export const createCliExitSignal = (exitCode: ExitCode): CliExitSignal => ({
  [exitSignalSymbol]: true,
  exitCode,
});

export const isCliExitSignal = (value: unknown): value is CliExitSignal =>
  typeof value === "object" &&
  value !== null &&
  exitSignalSymbol in value &&
  (value as CliExitSignal)[exitSignalSymbol] === true;

export interface NormalizedCliError {
  code: string;
  message: string;
  details?: unknown;
  exitCode: ExitCode;
}

const fromUnknownError = (error: unknown): NormalizedCliError => {
  if (error instanceof CliUsageError) {
    return {
      code: "USAGE_ERROR",
      message: error.message,
      details: error.details,
      exitCode: EXIT_CODES.usage,
    };
  }

  if (error instanceof EndpointUnavailableError) {
    return {
      code: error.code,
      message: error.message,
      details: {
        endpoint: error.endpoint,
        status: error.status,
        replacements: error.replacements,
      },
      exitCode: EXIT_CODES.endpointUnavailable,
    };
  }

  if (error instanceof RateLimitError) {
    return {
      code: error.code,
      message: error.message,
      details: {
        status: error.status,
        url: error.url,
        retryAfterMs: error.retryAfterMs,
      },
      exitCode: EXIT_CODES.rateLimited,
    };
  }

  if (error instanceof TransportError) {
    return {
      code: error.code,
      message: error.message,
      details: {
        status: error.status,
        url: error.url,
        responseBody: error.responseBody,
      },
      exitCode: EXIT_CODES.transport,
    };
  }

  if (
    error instanceof SchemaValidationError ||
    error instanceof UnexpectedResponseError
  ) {
    return {
      code: error.code,
      message: error.message,
      details:
        error instanceof SchemaValidationError
          ? {
              endpoint: error.endpoint,
              issues: error.issues,
            }
          : {
              endpoint: error.endpoint,
            },
      exitCode: EXIT_CODES.schemaDrift,
    };
  }

  if (error instanceof CommanderError) {
    return {
      code: "USAGE_ERROR",
      message: error.message,
      details: {
        commanderCode: error.code,
      },
      exitCode: EXIT_CODES.usage,
    };
  }

  if (error instanceof Error) {
    return {
      code: "UNKNOWN_ERROR",
      message: error.message,
      exitCode: EXIT_CODES.unknown,
    };
  }

  return {
    code: "UNKNOWN_ERROR",
    message: String(error),
    exitCode: EXIT_CODES.unknown,
  };
};

export const normalizeCliError = (error: unknown): NormalizedCliError =>
  fromUnknownError(error);

export const isCommanderGracefulExit = (error: unknown): boolean =>
  error instanceof CommanderError &&
  (error.code === "commander.helpDisplayed" || error.exitCode === 0);

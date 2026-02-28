import type { ExitCode, NormalizedCliError } from "./errors";

export type OutputMode = "pretty" | "json" | "jsonl";

export interface WritableLike {
  write: (chunk: string) => unknown;
  isTTY?: boolean;
}

export interface CliIo {
  stdout: WritableLike;
  stderr: WritableLike;
}

export interface SuccessEnvelope {
  ok: true;
  endpoint: string;
  request: unknown;
  data: unknown;
  meta: {
    command: string;
    durationMs: number;
    timestamp: string;
    output: OutputMode;
  };
  raw?: unknown;
}

export interface ErrorEnvelope {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    exitCode: ExitCode;
  };
}

const serializeJson = (value: unknown): string => `${JSON.stringify(value)}\n`;

const serializePretty = (value: unknown): string =>
  `${JSON.stringify(value, null, 2)}\n`;

export const isInteractiveStdout = (io: CliIo): boolean =>
  io.stdout.isTTY === true;

export const writeSuccessEnvelope = (args: {
  io: CliIo;
  mode: OutputMode;
  envelope: SuccessEnvelope;
}): void => {
  if (args.mode === "pretty") {
    args.io.stdout.write(serializePretty(args.envelope.data));
    return;
  }

  args.io.stdout.write(serializeJson(args.envelope));
};

export const writeErrorEnvelope = (args: {
  io: CliIo;
  mode: OutputMode;
  error: NormalizedCliError;
}): void => {
  if (args.mode === "pretty") {
    const body = [
      `[${args.error.code}] ${args.error.message}`,
      args.error.details
        ? `details: ${JSON.stringify(args.error.details, null, 2)}`
        : "",
    ]
      .filter((line) => line.length > 0)
      .join("\n");

    args.io.stderr.write(`${body}\n`);
    return;
  }

  const payload: ErrorEnvelope = {
    ok: false,
    error: {
      code: args.error.code,
      message: args.error.message,
      details: args.error.details,
      exitCode: args.error.exitCode,
    },
  };

  args.io.stdout.write(serializeJson(payload));
};

export const writeArbitraryOutput = (args: {
  io: CliIo;
  mode: OutputMode;
  payload: unknown;
}): void => {
  if (args.mode === "pretty") {
    args.io.stdout.write(serializePretty(args.payload));
    return;
  }

  if (args.mode === "json") {
    args.io.stdout.write(serializeJson(args.payload));
    return;
  }

  if (Array.isArray(args.payload)) {
    for (const item of args.payload) {
      args.io.stdout.write(serializeJson(item));
    }
    return;
  }

  args.io.stdout.write(serializeJson(args.payload));
};

interface SpinnerHandle {
  start: (text: string) => void;
  stop: (text: string) => void;
  fail: (text: string) => void;
}

const spinnerFrames = ["-", "\\", "|", "/"];

export const createStderrSpinner = (args: {
  io: CliIo;
  enabled: boolean;
}): SpinnerHandle => {
  let frame = 0;
  let message = "";
  let timer: ReturnType<typeof setInterval> | undefined;

  const interactive = args.enabled && args.io.stderr.isTTY === true;

  const render = (): void => {
    if (!interactive) {
      return;
    }

    const symbol = spinnerFrames[frame % spinnerFrames.length] ?? "-";
    frame += 1;
    args.io.stderr.write(`\r${symbol} ${message}`);
  };

  const clear = (): void => {
    if (timer) {
      clearInterval(timer);
      timer = undefined;
    }
  };

  return {
    start(text) {
      message = text;

      if (!interactive) {
        return;
      }

      render();
      timer = setInterval(render, 80);
    },
    stop(text) {
      clear();
      if (!interactive) {
        return;
      }

      args.io.stderr.write(`\rOK ${text}\n`);
    },
    fail(text) {
      clear();
      if (!interactive) {
        return;
      }

      args.io.stderr.write(`\rERR ${text}\n`);
    },
  };
};

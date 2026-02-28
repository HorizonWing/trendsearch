import { describe, expect, it } from "bun:test";

import { runCli } from "../../src/cli/main";
import {
  EndpointUnavailableError,
  RateLimitError,
  SchemaValidationError,
  TransportError,
} from "../../src/errors";
import { createMemoryIo, createMemoryStore, createMockClient } from "./helpers";

describe("cli exit codes", () => {
  it("returns 2 for usage validation errors", async () => {
    const { io, stdout } = createMemoryIo({ stdoutIsTTY: false });

    const exitCode = await runCli({
      argv: [
        "node",
        "trendsearch",
        "autocomplete",
        "--output",
        "json",
        "--no-spinner",
      ],
      io,
      env: {},
      configStore: createMemoryStore(),
      createClient: () =>
        createMockClient({
          onCall: async () => ({ data: {} }),
        }),
    });

    expect(exitCode).toBe(2);

    const payload = JSON.parse(stdout.read()) as {
      ok: boolean;
      error: {
        code: string;
        exitCode: number;
      };
    };

    expect(payload.ok).toBe(false);
    expect(payload.error.code).toBe("USAGE_ERROR");
    expect(payload.error.exitCode).toBe(2);
  });

  it("returns 3 for endpoint unavailable", async () => {
    const { io, stdout } = createMemoryIo({ stdoutIsTTY: false });
    const client = createMockClient({
      onCall: async () => {
        throw new EndpointUnavailableError({
          endpoint: "dailyTrends",
          status: 404,
          replacements: ["trendingNow"],
        });
      },
    });

    const exitCode = await runCli({
      argv: [
        "node",
        "trendsearch",
        "autocomplete",
        "typescript",
        "--output",
        "json",
        "--no-spinner",
      ],
      io,
      env: {},
      configStore: createMemoryStore(),
      createClient: () => client,
    });

    expect(exitCode).toBe(3);

    const payload = JSON.parse(stdout.read()) as {
      error: {
        exitCode: number;
      };
    };

    expect(payload.error.exitCode).toBe(3);
  });

  it("returns 4 for rate limit errors", async () => {
    const { io, stdout } = createMemoryIo({ stdoutIsTTY: false });
    const client = createMockClient({
      onCall: async () => {
        throw new RateLimitError({
          message: "Rate limited",
          url: "https://trends.google.com",
          status: 429,
        });
      },
    });

    const exitCode = await runCli({
      argv: [
        "node",
        "trendsearch",
        "autocomplete",
        "typescript",
        "--output",
        "json",
        "--no-spinner",
      ],
      io,
      env: {},
      configStore: createMemoryStore(),
      createClient: () => client,
    });

    expect(exitCode).toBe(4);

    const payload = JSON.parse(stdout.read()) as {
      error: {
        exitCode: number;
      };
    };

    expect(payload.error.exitCode).toBe(4);
  });

  it("returns 5 for transport errors", async () => {
    const { io, stdout } = createMemoryIo({ stdoutIsTTY: false });
    const client = createMockClient({
      onCall: async () => {
        throw new TransportError({
          message: "transport failure",
          url: "https://trends.google.com",
          status: 500,
        });
      },
    });

    const exitCode = await runCli({
      argv: [
        "node",
        "trendsearch",
        "autocomplete",
        "typescript",
        "--output",
        "json",
        "--no-spinner",
      ],
      io,
      env: {},
      configStore: createMemoryStore(),
      createClient: () => client,
    });

    expect(exitCode).toBe(5);

    const payload = JSON.parse(stdout.read()) as {
      error: {
        exitCode: number;
      };
    };

    expect(payload.error.exitCode).toBe(5);
  });

  it("returns 6 for schema validation errors", async () => {
    const { io, stdout } = createMemoryIo({ stdoutIsTTY: false });
    const client = createMockClient({
      onCall: async () => {
        throw new SchemaValidationError({
          endpoint: "autocomplete.response",
          issues: ["Missing topics"],
        });
      },
    });

    const exitCode = await runCli({
      argv: [
        "node",
        "trendsearch",
        "autocomplete",
        "typescript",
        "--output",
        "json",
        "--no-spinner",
      ],
      io,
      env: {},
      configStore: createMemoryStore(),
      createClient: () => client,
    });

    expect(exitCode).toBe(6);

    const payload = JSON.parse(stdout.read()) as {
      error: {
        exitCode: number;
      };
    };

    expect(payload.error.exitCode).toBe(6);
  });
});

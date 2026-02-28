import { describe, expect, it } from "bun:test";

import { runCli } from "../../src/cli/main";
import { createMemoryIo, createMemoryStore, createMockClient } from "./helpers";

describe("cli output modes", () => {
  it("defaults to json when stdout is not a TTY", async () => {
    const { io, stdout } = createMemoryIo({ stdoutIsTTY: false });
    const store = createMemoryStore();
    const client = createMockClient({
      onCall: async () => ({
        data: {
          topics: [{ title: "TypeScript" }],
        },
      }),
    });

    const exitCode = await runCli({
      argv: [
        "node",
        "trendsearch",
        "autocomplete",
        "typescript",
        "--no-spinner",
      ],
      io,
      env: {},
      configStore: store,
      createClient: () => client,
    });

    expect(exitCode).toBe(0);

    const payload = JSON.parse(stdout.read()) as {
      ok: boolean;
      data: {
        topics: { title: string }[];
      };
      meta: {
        output: string;
      };
    };

    expect(payload.ok).toBe(true);
    expect(payload.meta.output).toBe("json");
    expect(payload.data.topics[0]?.title).toBe("TypeScript");
  });

  it("supports pretty mode", async () => {
    const { io, stdout } = createMemoryIo({ stdoutIsTTY: true });
    const store = createMemoryStore();
    const client = createMockClient({
      onCall: async () => ({
        data: {
          topics: [{ title: "TypeScript" }],
        },
      }),
    });

    const exitCode = await runCli({
      argv: [
        "node",
        "trendsearch",
        "autocomplete",
        "typescript",
        "--output",
        "pretty",
        "--no-spinner",
      ],
      io,
      env: {},
      configStore: store,
      createClient: () => client,
    });

    expect(exitCode).toBe(0);

    const pretty = JSON.parse(stdout.read()) as {
      topics: { title: string }[];
    };
    expect(pretty.topics[0]?.title).toBe("TypeScript");
  });

  it("includes raw payload only when --raw is set", async () => {
    const { io, stdout } = createMemoryIo({ stdoutIsTTY: false });
    const store = createMemoryStore();
    const client = createMockClient({
      onCall: async () => ({
        data: {
          topics: [{ title: "TypeScript" }],
        },
        raw: {
          default: {
            topics: [{ title: "TypeScript" }],
          },
        },
      }),
    });

    const exitCode = await runCli({
      argv: [
        "node",
        "trendsearch",
        "autocomplete",
        "typescript",
        "--output",
        "json",
        "--raw",
        "--no-spinner",
      ],
      io,
      env: {},
      configStore: store,
      createClient: () => client,
    });

    expect(exitCode).toBe(0);

    const payload = JSON.parse(stdout.read()) as {
      raw?: unknown;
    };

    expect(payload.raw).toBeDefined();
  });

  it("supports jsonl mode", async () => {
    const { io, stdout } = createMemoryIo({ stdoutIsTTY: false });
    const store = createMemoryStore();
    const client = createMockClient({
      onCall: async () => ({
        data: {
          topics: [{ title: "TypeScript" }],
        },
      }),
    });

    const exitCode = await runCli({
      argv: [
        "node",
        "trendsearch",
        "autocomplete",
        "typescript",
        "--output",
        "jsonl",
        "--no-spinner",
      ],
      io,
      env: {},
      configStore: store,
      createClient: () => client,
    });

    expect(exitCode).toBe(0);

    const lines = stdout
      .read()
      .trim()
      .split("\n")
      .filter((line) => line.length > 0);

    expect(lines.length).toBe(1);

    const [firstLine = "{}"] = lines;

    const payload = JSON.parse(firstLine) as {
      ok: boolean;
      meta: {
        output: string;
      };
    };

    expect(payload.ok).toBe(true);
    expect(payload.meta.output).toBe("jsonl");
  });
});

import { describe, expect, it } from "bun:test";

import {
  resolveGlobalOptions,
  toCreateClientConfig,
} from "../../src/cli/config";
import { createMemoryStore } from "./helpers";

describe("cli config precedence", () => {
  it("applies precedence: flags > env > persisted > defaults", () => {
    const store = createMemoryStore({
      output: "pretty",
      spinner: true,
      timeoutMs: 1000,
    });

    const resolved = resolveGlobalOptions({
      flags: {
        output: "json",
      },
      env: {
        TRENDSEARCH_OUTPUT: "jsonl",
        TRENDSEARCH_SPINNER: "false",
        TRENDSEARCH_TIMEOUT_MS: "2000",
      },
      store,
      stdoutIsTty: true,
    });

    expect(resolved.output).toBe("json");
    expect(resolved.spinner).toBe(false);
    expect(resolved.timeoutMs).toBe(2000);
  });

  it("falls back to non-tty default output=json", () => {
    const resolved = resolveGlobalOptions({
      flags: {},
      env: {},
      store: createMemoryStore(),
      stdoutIsTty: false,
    });

    expect(resolved.output).toBe("json");
    expect(resolved.spinner).toBe(true);
  });

  it("maps resolved options to createClient config", () => {
    const resolved = resolveGlobalOptions({
      flags: {
        baseUrl: "https://example.com",
        timeoutMs: 800,
        hl: "en-US",
        tz: 120,
        maxRetries: 3,
        retryBaseDelayMs: 100,
        retryMaxDelayMs: 500,
        maxConcurrent: 2,
        minDelayMs: 250,
        userAgent: "trendsearch-test",
      },
      env: {},
      store: createMemoryStore(),
      stdoutIsTty: false,
    });

    const config = toCreateClientConfig(resolved);

    expect(config.baseUrl).toBe("https://example.com");
    expect(config.timeoutMs).toBe(800);
    expect(config.hl).toBe("en-US");
    expect(config.tz).toBe(120);
    expect(config.userAgent).toBe("trendsearch-test");
    expect(config.retries?.maxRetries).toBe(3);
    expect(config.retries?.baseDelayMs).toBe(100);
    expect(config.retries?.maxDelayMs).toBe(500);
    expect(config.rateLimit?.maxConcurrent).toBe(2);
    expect(config.rateLimit?.minDelayMs).toBe(250);
  });
});

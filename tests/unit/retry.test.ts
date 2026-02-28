import { describe, expect, it } from "bun:test";

import { runWithRetry } from "../../src/core/resilience/retry";

describe("runWithRetry", () => {
  it("retries a retryable failure and eventually resolves", async () => {
    let calls = 0;
    const tasks: (() => string)[] = [
      () => {
        throw new Error("retry me");
      },
      () => "ok",
    ];

    const result = await runWithRetry({
      task: async () => {
        calls += 1;
        const task = tasks[calls - 1] as () => string;
        return task();
      },
      policy: {
        maxRetries: 3,
        baseDelayMs: 1,
        maxDelayMs: 4,
      },
      shouldRetry: () => ({ retryable: true }),
    });

    expect(result).toBe("ok");
    expect(calls).toBe(2);
  });

  it("does not retry non-retryable errors", async () => {
    let calls = 0;

    await expect(
      runWithRetry({
        task: async () => {
          calls += 1;
          throw new Error("stop");
        },
        policy: {
          maxRetries: 3,
          baseDelayMs: 1,
          maxDelayMs: 4,
        },
        shouldRetry: () => ({ retryable: false }),
      })
    ).rejects.toThrow("stop");

    expect(calls).toBe(1);
  });

  it("surfaces the original error when retries are exhausted", async () => {
    const terminal = new Error("still failing");
    let calls = 0;

    try {
      await runWithRetry({
        task: async () => {
          calls += 1;
          throw terminal;
        },
        policy: {
          maxRetries: 2,
          baseDelayMs: 1,
          maxDelayMs: 4,
        },
        shouldRetry: () => ({ retryable: true }),
      });
      throw new Error("Expected runWithRetry to throw.");
    } catch (error) {
      expect(error).toBe(terminal);
      expect(calls).toBe(3);
    }
  });
});

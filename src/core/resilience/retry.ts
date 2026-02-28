import pRetry from "p-retry";

import { RateLimitError } from "../../errors";

export interface RetryDecision {
  retryable: boolean;
  reason?: string;
}

export interface RetryPolicy {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

const sleep = async (ms: number): Promise<void> => {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

export const runWithRetry = async <T>(args: {
  task: () => Promise<T>;
  policy: RetryPolicy;
  shouldRetry: (error: unknown) => RetryDecision;
}): Promise<T> => {
  const { task, policy, shouldRetry } = args;

  const retries = Math.max(0, policy.maxRetries);
  const minTimeout = Math.max(0, policy.baseDelayMs);
  const maxTimeout = Math.max(minTimeout, policy.maxDelayMs);

  return pRetry(task, {
    retries,
    minTimeout,
    maxTimeout,
    factor: 2,
    randomize: true,
    onFailedAttempt: async ({ error, retriesLeft }) => {
      if (!(error instanceof RateLimitError) || retriesLeft <= 0) {
        return;
      }

      if (!error.retryAfterMs || error.retryAfterMs <= 0) {
        return;
      }

      // Respect server-provided throttle windows to reduce repeat 429 responses.
      const waitMs = Math.min(120_000, Math.max(0, error.retryAfterMs));
      await sleep(waitMs);
    },
    shouldRetry: ({ error }) => shouldRetry(error).retryable,
  });
};

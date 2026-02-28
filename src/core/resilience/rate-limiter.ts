import PQueue from "p-queue";

export class RateLimiter {
  private readonly queue: PQueue;

  constructor(args: { maxConcurrent: number; minDelayMs: number }) {
    const maxConcurrent = Math.max(1, args.maxConcurrent);
    const minDelayMs = Math.max(0, args.minDelayMs);

    this.queue =
      minDelayMs > 0
        ? new PQueue({
            concurrency: maxConcurrent,
            intervalCap: 1,
            interval: minDelayMs,
            carryoverIntervalCount: true,
          })
        : new PQueue({
            concurrency: maxConcurrent,
          });
  }

  schedule<T>(task: () => Promise<T>): Promise<T> {
    return this.queue.add(task);
  }
}

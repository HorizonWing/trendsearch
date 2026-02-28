import { describe, expect, it } from "bun:test";

import { RateLimiter } from "../../src/core/resilience/rate-limiter";

describe("RateLimiter", () => {
  it("limits concurrent tasks", async () => {
    const limiter = new RateLimiter({ maxConcurrent: 1, minDelayMs: 0 });
    const order: number[] = [];

    await Promise.all([
      limiter.schedule(async () => {
        order.push(1);
        await Bun.sleep(10);
        order.push(2);
      }),
      limiter.schedule(async () => {
        order.push(3);
      }),
    ]);

    expect(order).toEqual([1, 2, 3]);
  });

  it("applies minimum delay between task starts", async () => {
    const minDelayMs = 30;
    const limiter = new RateLimiter({ maxConcurrent: 3, minDelayMs });
    const starts: number[] = [];
    const t0 = Date.now();

    await Promise.all([
      limiter.schedule(async () => {
        starts.push(Date.now() - t0);
      }),
      limiter.schedule(async () => {
        starts.push(Date.now() - t0);
      }),
      limiter.schedule(async () => {
        starts.push(Date.now() - t0);
      }),
    ]);

    expect(starts.length).toBe(3);
    const [firstStart, secondStart, thirdStart] = starts as [
      number,
      number,
      number,
    ];

    expect(secondStart).toBeGreaterThanOrEqual(firstStart + 20);
    expect(thirdStart).toBeGreaterThanOrEqual(secondStart + 20);
  });
});

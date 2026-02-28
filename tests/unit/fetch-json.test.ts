import { describe, expect, it } from "bun:test";

import { fetchGoogleJson } from "../../src/core/http/fetch-json";
import { RateLimiter } from "../../src/core/resilience/rate-limiter";
import { RateLimitError, TransportError } from "../../src/errors";

describe("fetchGoogleJson", () => {
  it("retries on 429 and succeeds", async () => {
    let calls = 0;
    const responses = [
      new Response("Too many requests", { status: 429 }),
      new Response(')]}\'\n{"ok":true}', { status: 200 }),
    ];

    const runtime = {
      baseUrl: "https://trends.google.com",
      fetchFn: async () => {
        calls += 1;
        return responses[calls - 1] as Response;
      },
      timeoutMs: 1000,
      retryConfig: {
        maxRetries: 2,
        baseDelayMs: 1,
        maxDelayMs: 2,
      },
      rateLimiter: new RateLimiter({ maxConcurrent: 1, minDelayMs: 0 }),
      cookieStore: undefined,
      proxyHook: undefined,
      userAgent: undefined,
    } as const;

    const data = await fetchGoogleJson({
      runtime,
      request: {
        endpoint: "test",
        path: "/trends/api/example",
        stripGooglePrefix: true,
      },
    });

    expect(data).toEqual({ ok: true });
    expect(calls).toBe(2);
  });

  it("throws after retry exhaustion", async () => {
    const runtime = {
      baseUrl: "https://trends.google.com",
      fetchFn: async () => new Response("Too many requests", { status: 429 }),
      timeoutMs: 1000,
      retryConfig: {
        maxRetries: 1,
        baseDelayMs: 1,
        maxDelayMs: 1,
      },
      rateLimiter: new RateLimiter({ maxConcurrent: 1, minDelayMs: 0 }),
      cookieStore: undefined,
      proxyHook: undefined,
      userAgent: undefined,
    } as const;

    await expect(
      fetchGoogleJson({
        runtime,
        request: {
          endpoint: "test",
          path: "/trends/api/example",
          stripGooglePrefix: true,
        },
      })
    ).rejects.toBeInstanceOf(RateLimitError);
  });

  it("does not retry client errors", async () => {
    let calls = 0;

    const runtime = {
      baseUrl: "https://trends.google.com",
      fetchFn: async () => {
        calls += 1;
        return new Response("Bad request", { status: 400 });
      },
      timeoutMs: 1000,
      retryConfig: {
        maxRetries: 3,
        baseDelayMs: 1,
        maxDelayMs: 1,
      },
      rateLimiter: new RateLimiter({ maxConcurrent: 1, minDelayMs: 0 }),
      cookieStore: undefined,
      proxyHook: undefined,
      userAgent: undefined,
    } as const;

    await expect(
      fetchGoogleJson({
        runtime,
        request: {
          endpoint: "test",
          path: "/trends/api/example",
          stripGooglePrefix: true,
        },
      })
    ).rejects.toBeInstanceOf(TransportError);

    expect(calls).toBe(1);
  });

  it("captures retry-after on 429 responses", async () => {
    const runtime = {
      baseUrl: "https://trends.google.com",
      fetchFn: async () =>
        new Response("Too many requests", {
          status: 429,
          headers: {
            "retry-after": "3",
          },
        }),
      timeoutMs: 1000,
      retryConfig: {
        maxRetries: 0,
        baseDelayMs: 1,
        maxDelayMs: 1,
      },
      rateLimiter: new RateLimiter({ maxConcurrent: 1, minDelayMs: 0 }),
      cookieStore: undefined,
      proxyHook: undefined,
      userAgent: undefined,
    } as const;

    await expect(
      fetchGoogleJson({
        runtime,
        request: {
          endpoint: "test",
          path: "/trends/api/example",
          stripGooglePrefix: true,
        },
      })
    ).rejects.toMatchObject({
      code: "RATE_LIMIT_ERROR",
      status: 429,
      retryAfterMs: 3000,
    });
  });

  it("sets accept-language from hl query when header is missing", async () => {
    let capturedHeaders: Headers | undefined;

    const runtime = {
      baseUrl: "https://trends.google.com",
      fetchFn: async (_input: string, init?: RequestInit) => {
        capturedHeaders = new Headers(init?.headers);
        return new Response('{"ok":true}', { status: 200 });
      },
      timeoutMs: 1000,
      retryConfig: {
        maxRetries: 0,
        baseDelayMs: 1,
        maxDelayMs: 1,
      },
      rateLimiter: new RateLimiter({ maxConcurrent: 1, minDelayMs: 0 }),
      cookieStore: undefined,
      proxyHook: undefined,
      userAgent: undefined,
    } as const;

    const data = await fetchGoogleJson({
      runtime,
      request: {
        endpoint: "test",
        path: "/trends/api/example",
        query: {
          hl: "cs-CZ",
        },
      },
    });

    expect(data).toEqual({ ok: true });
    expect(capturedHeaders?.get("accept-language")).toBe("cs-CZ");
  });

  it("does not override explicit accept-language header", async () => {
    let capturedHeaders: Headers | undefined;

    const runtime = {
      baseUrl: "https://trends.google.com",
      fetchFn: async (_input: string, init?: RequestInit) => {
        capturedHeaders = new Headers(init?.headers);
        return new Response('{"ok":true}', { status: 200 });
      },
      timeoutMs: 1000,
      retryConfig: {
        maxRetries: 0,
        baseDelayMs: 1,
        maxDelayMs: 1,
      },
      rateLimiter: new RateLimiter({ maxConcurrent: 1, minDelayMs: 0 }),
      cookieStore: undefined,
      proxyHook: undefined,
      userAgent: undefined,
    } as const;

    const data = await fetchGoogleJson({
      runtime,
      request: {
        endpoint: "test",
        path: "/trends/api/example",
        query: {
          hl: "en-US",
        },
        headers: {
          "accept-language": "de-DE",
        },
      },
    });

    expect(data).toEqual({ ok: true });
    expect(capturedHeaders?.get("accept-language")).toBe("de-DE");
  });
});

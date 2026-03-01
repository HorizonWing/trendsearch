import { describe, expect, it } from "bun:test";

import { createClient } from "../../src";

const autocompletePayload =
  ')]}\'\n{"default":{"topics":[{"mid":"/m/09gbxjr","title":"TypeScript","type":"Programming language"}]}}';

const createAutocompleteFetchMock = () => {
  let calls = 0;

  const fetchFn = async () => {
    calls += 1;
    return new Response(autocompletePayload, {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };

  return {
    fetchFn,
    getCalls: () => calls,
  };
};

const asFetch = (value: unknown): typeof globalThis.fetch =>
  value as typeof globalThis.fetch;

describe("createClient response cache", () => {
  it("is disabled by default", async () => {
    const mock = createAutocompleteFetchMock();
    const client = createClient({
      fetch: asFetch(mock.fetchFn),
      retries: { maxRetries: 0 },
      rateLimit: { maxConcurrent: 1, minDelayMs: 0 },
    });

    await client.autocomplete({ keyword: "typescript" });
    await client.autocomplete({ keyword: "typescript" });

    expect(mock.getCalls()).toBe(2);
  });

  it("caches responses when enabled", async () => {
    const mock = createAutocompleteFetchMock();
    const client = createClient({
      fetch: asFetch(mock.fetchFn),
      retries: { maxRetries: 0 },
      rateLimit: { maxConcurrent: 1, minDelayMs: 0 },
      responseCache: {
        enabled: true,
        ttlMs: 60_000,
      },
    });

    const first = await client.autocomplete({ keyword: "typescript" });
    first.data.topics = [];

    const second = await client.autocomplete({ keyword: "typescript" });

    expect(mock.getCalls()).toBe(1);
    expect(second.data.topics[0]?.title).toBe("TypeScript");
  });

  it("honors endpoint allowlist", async () => {
    const mock = createAutocompleteFetchMock();
    const client = createClient({
      fetch: asFetch(mock.fetchFn),
      retries: { maxRetries: 0 },
      rateLimit: { maxConcurrent: 1, minDelayMs: 0 },
      responseCache: {
        enabled: true,
        ttlMs: 60_000,
        endpoints: ["relatedQueries"],
      },
    });

    await client.autocomplete({ keyword: "typescript" });
    await client.autocomplete({ keyword: "typescript" });

    expect(mock.getCalls()).toBe(2);
  });

  it("honors per-endpoint ttl overrides", async () => {
    const mock = createAutocompleteFetchMock();
    const client = createClient({
      fetch: asFetch(mock.fetchFn),
      retries: { maxRetries: 0 },
      rateLimit: { maxConcurrent: 1, minDelayMs: 0 },
      responseCache: {
        enabled: true,
        ttlMs: 60_000,
        ttlByEndpoint: {
          autocomplete: 0,
        },
      },
    });

    await client.autocomplete({ keyword: "typescript" });
    await client.autocomplete({ keyword: "typescript" });

    expect(mock.getCalls()).toBe(2);
  });

  it("separates cache keys by debug options", async () => {
    const mock = createAutocompleteFetchMock();
    const client = createClient({
      fetch: asFetch(mock.fetchFn),
      retries: { maxRetries: 0 },
      rateLimit: { maxConcurrent: 1, minDelayMs: 0 },
      responseCache: {
        enabled: true,
        ttlMs: 60_000,
      },
    });

    const first = await client.autocomplete({ keyword: "typescript" });
    expect(first.raw).toBeUndefined();

    const second = await client.autocomplete(
      { keyword: "typescript" },
      { debugRawResponse: true }
    );
    expect(second.raw).toBeDefined();

    await client.autocomplete(
      { keyword: "typescript" },
      { debugRawResponse: true }
    );

    expect(mock.getCalls()).toBe(2);
  });
});

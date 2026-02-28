import { describe, expect, it } from "bun:test";

import {
  EndpointUnavailableError,
  MemoryCookieStore,
  RateLimitError,
  SchemaValidationError,
  TransportError,
  createClient,
} from "../../src";

const runLive = process.env.TRENDSEARCH_LIVE === "1";
const describeLive = runLive ? describe : describe.skip;

const expectDefined = <T>(value: T | undefined, message: string): T => {
  if (value === undefined) {
    throw new Error(message);
  }
  return value;
};

const withRateLimitRetry = async <T>(
  task: () => Promise<T>,
  attempts = 6
): Promise<T> => {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      if (!(error instanceof RateLimitError) || attempt === attempts - 1) {
        throw error;
      }

      const retryAfterWait =
        typeof error.retryAfterMs === "number" && error.retryAfterMs > 0
          ? error.retryAfterMs + 750
          : undefined;

      const backoffWait = Math.min(90_000, 8000 * (attempt + 1));
      const waitMs = retryAfterWait
        ? Math.max(backoffWait, retryAfterWait)
        : backoffWait;

      await Bun.sleep(waitMs);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
};

const ignoreKnownExperimentalInstability = (
  error: unknown,
  allowedStatuses: number[]
): void => {
  if (
    error instanceof EndpointUnavailableError &&
    typeof error.status === "number" &&
    allowedStatuses.includes(error.status)
  ) {
    return;
  }

  if (
    error instanceof RateLimitError &&
    allowedStatuses.includes(error.status)
  ) {
    return;
  }

  if (
    error instanceof TransportError &&
    typeof error.status === "number" &&
    allowedStatuses.includes(error.status)
  ) {
    return;
  }

  throw error;
};

const isKnownLegacyDailyError = (error: unknown): boolean =>
  error instanceof EndpointUnavailableError ||
  error instanceof SchemaValidationError;

describeLive("live endpoints", () => {
  const client = createClient({
    rateLimit: {
      maxConcurrent: 1,
      minDelayMs: 5000,
    },
    retries: {
      maxRetries: 5,
      baseDelayMs: 2500,
      maxDelayMs: 45_000,
    },
    timeoutMs: 30_000,
    cookieStore: new MemoryCookieStore(),
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
  });

  it("covers stable + experimental endpoint matrix", async () => {
    const autocomplete = await withRateLimitRetry(() =>
      client.autocomplete({ keyword: "typescript" })
    );
    expect(autocomplete.data.topics.length).toBeGreaterThan(0);

    const explore = await withRateLimitRetry(() =>
      client.explore({
        keywords: ["typescript"],
        geo: "US",
        time: "today 3-m",
      })
    );
    expect(explore.data.widgets.length).toBeGreaterThan(0);

    const interestOverTime = await withRateLimitRetry(() =>
      client.interestOverTime({
        keywords: ["typescript"],
        geo: "US",
        time: "today 3-m",
      })
    );
    expect(interestOverTime.data.timeline.length).toBeGreaterThan(0);

    const byRegion = await withRateLimitRetry(() =>
      client.interestByRegion({
        keywords: ["typescript"],
        geo: "US",
        resolution: "REGION",
      })
    );
    expect(byRegion.data.regions.length).toBeGreaterThan(0);

    const relatedQueries = await withRateLimitRetry(() =>
      client.relatedQueries({
        keywords: ["typescript"],
        geo: "US",
        time: "today 3-m",
      })
    );
    expect(Array.isArray(relatedQueries.data.top)).toBe(true);
    expect(Array.isArray(relatedQueries.data.rising)).toBe(true);

    const relatedTopics = await withRateLimitRetry(() =>
      client.relatedTopics({
        keywords: ["typescript"],
        geo: "US",
        time: "today 3-m",
      })
    );
    expect(Array.isArray(relatedTopics.data.top)).toBe(true);
    expect(Array.isArray(relatedTopics.data.rising)).toBe(true);

    const trendingNow = await withRateLimitRetry(() =>
      client.trendingNow({
        geo: "US",
        language: "en",
        hours: 24,
      })
    );
    expect(trendingNow.data.items.length).toBeGreaterThan(0);

    const [stableFirstItem] = trendingNow.data.items;
    const stableItem = expectDefined(
      stableFirstItem,
      "Expected stable trendingNow to return at least one item."
    );
    expect(stableItem.articleKeys.length).toBeGreaterThan(0);

    const trendingArticles = await withRateLimitRetry(() =>
      client.trendingArticles({
        articleKeys: stableItem.articleKeys.slice(0, 1),
        articleCount: 2,
      })
    );
    expect(trendingArticles.data.articles.length).toBeGreaterThan(0);

    const aliasNow = await withRateLimitRetry(() =>
      client.experimental.trendingNow({
        geo: "US",
        language: "en",
        hours: 24,
      })
    );
    expect(aliasNow.data.items.length).toBeGreaterThan(0);

    const [experimentalFirstItem] = aliasNow.data.items;
    const experimentalItem = expectDefined(
      experimentalFirstItem,
      "Expected experimental trendingNow to return at least one item."
    );
    expect(experimentalItem.articleKeys.length).toBeGreaterThan(0);

    const aliasArticles = await withRateLimitRetry(() =>
      client.experimental.trendingArticles({
        articleKeys: experimentalItem.articleKeys.slice(0, 1),
        articleCount: 2,
      })
    );
    expect(aliasArticles.data.articles.length).toBeGreaterThan(0);

    const geoPicker = await withRateLimitRetry(() =>
      client.experimental.geoPicker({ hl: "en-US" })
    );
    const geoChildren = expectDefined(
      geoPicker.data.items.children,
      "Expected geo picker children."
    );
    expect(geoChildren.length).toBeGreaterThan(0);

    const categoryPicker = await withRateLimitRetry(() =>
      client.experimental.categoryPicker({
        hl: "en-US",
      })
    );
    const categoryChildren = expectDefined(
      categoryPicker.data.items.children,
      "Expected category picker children."
    );
    expect(categoryChildren.length).toBeGreaterThan(0);

    const topChartsCount = await withRateLimitRetry(() =>
      client.experimental.topCharts({
        date: new Date().getUTCFullYear(),
        geo: "GLOBAL",
      })
    )
      .then((result) => result.data.charts.length)
      .catch((error) => {
        ignoreKnownExperimentalInstability(error, [400, 401, 404, 410, 429]);
        return -1;
      });
    expect(topChartsCount).not.toBe(0);

    const multirangeCount = await withRateLimitRetry(() =>
      client.experimental.interestOverTimeMultirange({
        keywords: ["typescript"],
        geo: "US",
        time: "today 3-m",
      })
    )
      .then((result) => result.data.timeline.length)
      .catch((error) => {
        ignoreKnownExperimentalInstability(error, [400, 401, 404, 410, 429]);
        return -1;
      });
    expect(multirangeCount).not.toBe(0);

    try {
      const interestCsv = await withRateLimitRetry(() =>
        client.experimental.interestOverTimeCsv({
          keywords: ["typescript"],
          geo: "US",
          time: "today 3-m",
        })
      );
      expect(interestCsv.data.csv.length).toBeGreaterThan(0);
    } catch (error) {
      ignoreKnownExperimentalInstability(error, [400, 401, 404, 410, 429]);
    }

    try {
      const multirangeCsv = await withRateLimitRetry(() =>
        client.experimental.interestOverTimeMultirangeCsv({
          keywords: ["typescript"],
          geo: "US",
          time: "today 3-m",
        })
      );
      expect(multirangeCsv.data.csv.length).toBeGreaterThan(0);
    } catch (error) {
      ignoreKnownExperimentalInstability(error, [400, 401, 404, 410, 429]);
    }

    try {
      const byRegionCsv = await withRateLimitRetry(() =>
        client.experimental.interestByRegionCsv({
          keywords: ["typescript"],
          geo: "US",
          resolution: "REGION",
        })
      );
      expect(byRegionCsv.data.csv.length).toBeGreaterThan(0);
    } catch (error) {
      ignoreKnownExperimentalInstability(error, [400, 401, 404, 410, 429]);
    }

    try {
      const relatedQueriesCsv = await withRateLimitRetry(() =>
        client.experimental.relatedQueriesCsv({
          keywords: ["typescript"],
          geo: "US",
          time: "today 3-m",
        })
      );
      expect(relatedQueriesCsv.data.csv.length).toBeGreaterThan(0);
    } catch (error) {
      ignoreKnownExperimentalInstability(error, [400, 401, 404, 410, 429]);
    }

    try {
      const relatedTopicsCsv = await withRateLimitRetry(() =>
        client.experimental.relatedTopicsCsv({
          keywords: ["typescript"],
          geo: "US",
          time: "today 3-m",
        })
      );
      expect(relatedTopicsCsv.data.csv.length).toBeGreaterThan(0);
    } catch (error) {
      ignoreKnownExperimentalInstability(error, [400, 401, 404, 410, 429]);
    }

    try {
      const hotTrendsLegacy = await withRateLimitRetry(() =>
        client.experimental.hotTrendsLegacy()
      );
      expect(hotTrendsLegacy.data.payload).toBeDefined();
    } catch (error) {
      ignoreKnownExperimentalInstability(error, [400, 401, 404, 410, 429]);
    }

    try {
      const daily = await withRateLimitRetry(() =>
        client.dailyTrends({ geo: "US" })
      );
      expect(daily.data.days.length).toBeGreaterThan(0);
      expect(daily.data.trends.length).toBeGreaterThan(0);
    } catch (error) {
      expect(isKnownLegacyDailyError(error)).toBe(true);
    }

    try {
      const realtime = await withRateLimitRetry(() =>
        client.realTimeTrends({ geo: "US" })
      );
      expect(realtime.data.stories.length).toBeGreaterThan(0);
    } catch (error) {
      expect(error).toBeInstanceOf(EndpointUnavailableError);
    }
  }, 900_000);
});

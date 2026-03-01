import type {
  CreateClientConfig,
  EndpointDebugOptions,
  RequestConfig,
  ResponseCacheEndpoint,
  TrendSearchClient,
} from "./public-types";

import { fetchGoogleJson, fetchText } from "../core/http/fetch-json";
import { RateLimiter } from "../core/resilience/rate-limiter";
import { autocompleteEndpoint } from "../endpoints/autocomplete";
import { dailyTrendsEndpoint } from "../endpoints/daily-trends";
import { categoryPickerEndpoint } from "../endpoints/experimental/category-picker";
import {
  interestByRegionCsvEndpoint,
  interestOverTimeCsvEndpoint,
  interestOverTimeMultirangeCsvEndpoint,
  relatedQueriesCsvEndpoint,
  relatedTopicsCsvEndpoint,
} from "../endpoints/experimental/csv";
import { geoPickerEndpoint } from "../endpoints/experimental/geo-picker";
import { hotTrendsLegacyEndpoint } from "../endpoints/experimental/hot-trends-legacy";
import { interestOverTimeMultirangeEndpoint } from "../endpoints/experimental/interest-over-time-multirange";
import { topChartsEndpoint } from "../endpoints/experimental/top-charts";
import {
  experimentalTrendingArticlesEndpoint,
  trendingArticlesEndpoint,
} from "../endpoints/experimental/trending-articles";
import {
  experimentalTrendingNowEndpoint,
  trendingNowEndpoint,
} from "../endpoints/experimental/trending-now";
import { exploreEndpoint } from "../endpoints/explore";
import { interestByRegionEndpoint } from "../endpoints/interest-by-region";
import { interestOverTimeEndpoint } from "../endpoints/interest-over-time";
import { realTimeTrendsEndpoint } from "../endpoints/real-time-trends";
import { relatedQueriesEndpoint } from "../endpoints/related-queries";
import { relatedTopicsEndpoint } from "../endpoints/related-topics";

const defaults = {
  timeoutMs: 15_000,
  baseUrl: "https://trends.google.com",
  hl: "en-US",
  tz: new Date().getTimezoneOffset(),
  retries: {
    maxRetries: 3,
    baseDelayMs: 500,
    maxDelayMs: 8000,
  },
  rateLimit: {
    maxConcurrent: 1,
    minDelayMs: 1000,
  },
  adaptiveRateLimit: {
    baseCooldownMs: 5000,
    maxCooldownMs: 300_000,
  },
  responseCache: {
    enabled: false,
    ttlMs: 5 * 60 * 1000,
  },
} as const;

interface CachedValue {
  expiresAtMs: number;
  value: unknown;
}

type EndpointTask<TInput, TResult> = (
  input: TInput,
  options?: EndpointDebugOptions
) => Promise<TResult>;

type ResponseCacheWrapper = <TInput, TResult>(
  endpoint: ResponseCacheEndpoint,
  task: EndpointTask<TInput, TResult>
) => EndpointTask<TInput, TResult>;

const cloneForCache = <T>(value: T): T => {
  try {
    return structuredClone(value);
  } catch {
    return value;
  }
};

const normalizeForCacheKey = (
  value: unknown,
  seen: WeakSet<object>
): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeForCacheKey(item, seen));
  }

  if (value && typeof value === "object") {
    if (seen.has(value)) {
      return "[Circular]";
    }
    seen.add(value);
    const entries = Object.entries(value as Record<string, unknown>)
      .toSorted(([left], [right]) => left.localeCompare(right))
      .map(([key, itemValue]) => [key, normalizeForCacheKey(itemValue, seen)]);
    return Object.fromEntries(entries);
  }

  return value;
};

const cacheKeyFor = (
  endpoint: ResponseCacheEndpoint,
  input: unknown,
  options: EndpointDebugOptions | undefined
): string => {
  const normalized = normalizeForCacheKey(
    {
      input,
      options: options ?? null,
    },
    new WeakSet<object>()
  );

  return `${endpoint}:${JSON.stringify(normalized)}`;
};

const createResponseCacheWrapper = (
  config: CreateClientConfig
): ResponseCacheWrapper => {
  const responseCache = new Map<string, CachedValue>();
  const cacheEnabled =
    config.responseCache?.enabled ?? defaults.responseCache.enabled;
  const defaultTtlMs =
    config.responseCache?.ttlMs ?? defaults.responseCache.ttlMs;
  const allowlist = new Set(config.responseCache?.endpoints);
  const hasAllowlist = allowlist.size > 0;

  const endpointTtlMs = (endpoint: ResponseCacheEndpoint): number =>
    config.responseCache?.ttlByEndpoint?.[endpoint] ?? defaultTtlMs;

  const shouldCacheEndpoint = (endpoint: ResponseCacheEndpoint): boolean => {
    if (!cacheEnabled) {
      return false;
    }

    if (hasAllowlist && !allowlist.has(endpoint)) {
      return false;
    }

    return endpointTtlMs(endpoint) > 0;
  };

  return <TInput, TResult>(
    endpoint: ResponseCacheEndpoint,
    task: EndpointTask<TInput, TResult>
  ): EndpointTask<TInput, TResult> => {
    if (!shouldCacheEndpoint(endpoint)) {
      return task;
    }

    return async (input: TInput, options?: EndpointDebugOptions) => {
      const ttlMs = endpointTtlMs(endpoint);
      if (ttlMs <= 0) {
        return task(input, options);
      }

      const key = cacheKeyFor(endpoint, input, options);
      const now = Date.now();
      const hit = responseCache.get(key);

      if (hit && hit.expiresAtMs > now) {
        return cloneForCache(hit.value as TResult);
      }

      if (hit) {
        responseCache.delete(key);
      }

      const result = await task(input, options);
      responseCache.set(key, {
        // Use post-fetch time to avoid shortening TTL by request latency.
        expiresAtMs: Date.now() + ttlMs,
        value: cloneForCache(result),
      });

      return result;
    };
  };
};

const ensureFetch = (
  provided?: typeof globalThis.fetch
): ((input: string, init?: RequestInit) => Promise<Response>) => {
  if (provided) {
    return (input, init) => provided(input, init);
  }

  if (typeof globalThis.fetch === "function") {
    return (input, init) => globalThis.fetch(input, init);
  }

  throw new Error(
    "No fetch implementation available. Provide createClient({ fetch })."
  );
};

export const createClient = (
  config: CreateClientConfig = {}
): TrendSearchClient => {
  const fetchFn = ensureFetch(config.fetch);
  const withResponseCache = createResponseCacheWrapper(config);

  const runtime = {
    baseUrl: config.baseUrl ?? defaults.baseUrl,
    fetchFn,
    timeoutMs: config.timeoutMs ?? defaults.timeoutMs,
    userAgent: config.userAgent,
    cookieStore: config.cookieStore,
    proxyHook: config.proxyHook,
    retryConfig: {
      maxRetries: config.retries?.maxRetries ?? defaults.retries.maxRetries,
      baseDelayMs: config.retries?.baseDelayMs ?? defaults.retries.baseDelayMs,
      maxDelayMs: config.retries?.maxDelayMs ?? defaults.retries.maxDelayMs,
    },
    rateLimiter: new RateLimiter({
      maxConcurrent:
        config.rateLimit?.maxConcurrent ?? defaults.rateLimit.maxConcurrent,
      minDelayMs: config.rateLimit?.minDelayMs ?? defaults.rateLimit.minDelayMs,
    }),
    adaptiveRateLimit: {
      blockedUntilMs: 0,
      consecutive429: 0,
      baseCooldownMs:
        config.adaptiveRateLimit?.baseCooldownMs ??
        defaults.adaptiveRateLimit.baseCooldownMs,
      maxCooldownMs:
        config.adaptiveRateLimit?.maxCooldownMs ??
        defaults.adaptiveRateLimit.maxCooldownMs,
    },
  };

  const requestJson = (
    request: Omit<RequestConfig, "method"> & { method?: "GET" | "POST" }
  ) =>
    fetchGoogleJson({
      runtime,
      request: {
        ...request,
      },
    });

  const requestText = (
    request: Omit<RequestConfig, "method"> & { method?: "GET" | "POST" }
  ) =>
    fetchText({
      runtime,
      request: {
        ...request,
      },
    });

  const context = {
    defaultHl: config.hl ?? defaults.hl,
    defaultTz: config.tz ?? defaults.tz,
    requestJson,
    requestText,
  };

  return {
    autocomplete: withResponseCache("autocomplete", (input, options) =>
      autocompleteEndpoint(context, input, options)
    ),
    explore: withResponseCache("explore", (input, options) =>
      exploreEndpoint(context, input, options)
    ),
    interestOverTime: withResponseCache("interestOverTime", (input, options) =>
      interestOverTimeEndpoint(context, input, options)
    ),
    interestByRegion: withResponseCache("interestByRegion", (input, options) =>
      interestByRegionEndpoint(context, input, options)
    ),
    relatedQueries: withResponseCache("relatedQueries", (input, options) =>
      relatedQueriesEndpoint(context, input, options)
    ),
    relatedTopics: withResponseCache("relatedTopics", (input, options) =>
      relatedTopicsEndpoint(context, input, options)
    ),
    dailyTrends: withResponseCache("dailyTrends", (input, options) =>
      dailyTrendsEndpoint(context, input, options)
    ),
    realTimeTrends: withResponseCache("realTimeTrends", (input, options) =>
      realTimeTrendsEndpoint(context, input, options)
    ),
    trendingNow: withResponseCache("trendingNow", (input, options) =>
      trendingNowEndpoint(context, input, options)
    ),
    trendingArticles: withResponseCache("trendingArticles", (input, options) =>
      trendingArticlesEndpoint(context, input, options)
    ),
    experimental: {
      trendingNow: withResponseCache(
        "experimental.trendingNow",
        (input, options) =>
          experimentalTrendingNowEndpoint(context, input, options)
      ),
      trendingArticles: withResponseCache(
        "experimental.trendingArticles",
        (input, options) =>
          experimentalTrendingArticlesEndpoint(context, input, options)
      ),
      geoPicker: withResponseCache("experimental.geoPicker", (input, options) =>
        geoPickerEndpoint(context, input, options)
      ),
      categoryPicker: withResponseCache(
        "experimental.categoryPicker",
        (input, options) => categoryPickerEndpoint(context, input, options)
      ),
      topCharts: withResponseCache("experimental.topCharts", (input, options) =>
        topChartsEndpoint(context, input, options)
      ),
      interestOverTimeMultirange: withResponseCache(
        "experimental.interestOverTimeMultirange",
        (input, options) =>
          interestOverTimeMultirangeEndpoint(context, input, options)
      ),
      interestOverTimeCsv: withResponseCache(
        "experimental.interestOverTimeCsv",
        (input, options) => interestOverTimeCsvEndpoint(context, input, options)
      ),
      interestOverTimeMultirangeCsv: withResponseCache(
        "experimental.interestOverTimeMultirangeCsv",
        (input, options) =>
          interestOverTimeMultirangeCsvEndpoint(context, input, options)
      ),
      interestByRegionCsv: withResponseCache(
        "experimental.interestByRegionCsv",
        (input, options) => interestByRegionCsvEndpoint(context, input, options)
      ),
      relatedQueriesCsv: withResponseCache(
        "experimental.relatedQueriesCsv",
        (input, options) => relatedQueriesCsvEndpoint(context, input, options)
      ),
      relatedTopicsCsv: withResponseCache(
        "experimental.relatedTopicsCsv",
        (input, options) => relatedTopicsCsvEndpoint(context, input, options)
      ),
      hotTrendsLegacy: withResponseCache(
        "experimental.hotTrendsLegacy",
        (input, options) => hotTrendsLegacyEndpoint(context, input, options)
      ),
    },
  };
};

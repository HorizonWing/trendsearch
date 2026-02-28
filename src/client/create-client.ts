import type {
  CreateClientConfig,
  TrendSearchClient,
  RequestConfig,
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
} as const;

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
    autocomplete: (input, options) =>
      autocompleteEndpoint(context, input, options),
    explore: (input, options) => exploreEndpoint(context, input, options),
    interestOverTime: (input, options) =>
      interestOverTimeEndpoint(context, input, options),
    interestByRegion: (input, options) =>
      interestByRegionEndpoint(context, input, options),
    relatedQueries: (input, options) =>
      relatedQueriesEndpoint(context, input, options),
    relatedTopics: (input, options) =>
      relatedTopicsEndpoint(context, input, options),
    dailyTrends: (input, options) =>
      dailyTrendsEndpoint(context, input, options),
    realTimeTrends: (input, options) =>
      realTimeTrendsEndpoint(context, input, options),
    trendingNow: (input, options) =>
      trendingNowEndpoint(context, input, options),
    trendingArticles: (input, options) =>
      trendingArticlesEndpoint(context, input, options),
    experimental: {
      trendingNow: (input, options) =>
        experimentalTrendingNowEndpoint(context, input, options),
      trendingArticles: (input, options) =>
        experimentalTrendingArticlesEndpoint(context, input, options),
      geoPicker: (input, options) => geoPickerEndpoint(context, input, options),
      categoryPicker: (input, options) =>
        categoryPickerEndpoint(context, input, options),
      topCharts: (input, options) => topChartsEndpoint(context, input, options),
      interestOverTimeMultirange: (input, options) =>
        interestOverTimeMultirangeEndpoint(context, input, options),
      interestOverTimeCsv: (input, options) =>
        interestOverTimeCsvEndpoint(context, input, options),
      interestOverTimeMultirangeCsv: (input, options) =>
        interestOverTimeMultirangeCsvEndpoint(context, input, options),
      interestByRegionCsv: (input, options) =>
        interestByRegionCsvEndpoint(context, input, options),
      relatedQueriesCsv: (input, options) =>
        relatedQueriesCsvEndpoint(context, input, options),
      relatedTopicsCsv: (input, options) =>
        relatedTopicsCsvEndpoint(context, input, options),
      hotTrendsLegacy: (input, options) =>
        hotTrendsLegacyEndpoint(context, input, options),
    },
  };
};

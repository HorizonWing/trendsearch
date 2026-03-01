import type {
  CategoryPickerResponse,
  DailyTrendsResponse,
  ExploreWidget,
  GeoPickerResponse,
  GeoMapData,
  HotTrendsLegacyResponse,
  InterestOverTimePoint,
  InterestOverTimeMultirangePoint,
  RelatedQueryItem,
  RelatedTopicItem,
  TopChart,
  TopChartListItem,
  Topic,
  TrendingArticleItem,
  TrendingNowItem,
} from "../schemas";

export interface RetryConfig {
  /** Maximum retry attempts after the initial failure. */
  maxRetries?: number;
  /** Initial backoff delay in milliseconds. */
  baseDelayMs?: number;
  /** Maximum backoff delay in milliseconds. */
  maxDelayMs?: number;
}

export interface RateLimitConfig {
  /** Maximum number of concurrent HTTP requests. */
  maxConcurrent?: number;
  /** Minimum delay between request starts in milliseconds. */
  minDelayMs?: number;
}

export interface AdaptiveRateLimitConfig {
  /** Base cooldown in milliseconds for HTTP 429 responses without Retry-After. */
  baseCooldownMs?: number;
  /** Maximum cooldown in milliseconds for repeated HTTP 429 responses. */
  maxCooldownMs?: number;
}

/** Endpoint identifiers that can be cached via `responseCache`. */
export type ResponseCacheEndpoint =
  | "autocomplete"
  | "explore"
  | "interestOverTime"
  | "interestByRegion"
  | "relatedQueries"
  | "relatedTopics"
  | "dailyTrends"
  | "realTimeTrends"
  | "trendingNow"
  | "trendingArticles"
  | "experimental.trendingNow"
  | "experimental.trendingArticles"
  | "experimental.geoPicker"
  | "experimental.categoryPicker"
  | "experimental.topCharts"
  | "experimental.interestOverTimeMultirange"
  | "experimental.interestOverTimeCsv"
  | "experimental.interestOverTimeMultirangeCsv"
  | "experimental.interestByRegionCsv"
  | "experimental.relatedQueriesCsv"
  | "experimental.relatedTopicsCsv"
  | "experimental.hotTrendsLegacy";

/** Optional client-side response cache for endpoint results. */
export interface ResponseCacheConfig {
  /** Enables response caching when true. Defaults to false. */
  enabled?: boolean;
  /** Default cache TTL in milliseconds for cached endpoints. */
  ttlMs?: number;
  /**
   * Optional endpoint allowlist. When provided, only listed endpoints are cached.
   * When omitted, all endpoints are eligible for caching.
   */
  endpoints?: ResponseCacheEndpoint[];
  /** Optional per-endpoint TTL overrides in milliseconds. */
  ttlByEndpoint?: Partial<Record<ResponseCacheEndpoint, number>>;
}

/** Cookie persistence contract used by the internal HTTP runtime. */
export interface CookieStore {
  /** Returns the Cookie header value to send for the given URL. */
  getCookieHeader(url: string): Promise<string | undefined>;
  /** Stores Set-Cookie headers returned by upstream for the given URL. */
  setCookieHeaders(url: string, setCookieHeaders: string[]): Promise<void>;
}

export interface ProxyHookInput {
  /** Original request URL. */
  url: string;
  /** Original request init object. */
  init: RequestInit;
}

export interface ProxyHookOutput {
  /** Optional replacement URL. */
  url?: string;
  /** Optional replacement init object. */
  init?: RequestInit;
}

export type ProxyHook = (
  input: ProxyHookInput
) => ProxyHookOutput | Promise<ProxyHookOutput>;

/** Runtime configuration for a trendsearch client instance. */
export interface CreateClientConfig {
  /** Custom fetch implementation. Falls back to global fetch when omitted. */
  fetch?: typeof globalThis.fetch;
  /** HTTP request timeout in milliseconds. */
  timeoutMs?: number;
  /** Base URL for Google Trends endpoints. */
  baseUrl?: string;
  /** Default locale, for example "en-US". */
  hl?: string;
  /** Default timezone offset in minutes. */
  tz?: number;
  /** Retry behavior for transport and rate-limit failures. */
  retries?: RetryConfig;
  /** Queue-based request rate limiting. */
  rateLimit?: RateLimitConfig;
  /** Adaptive cooldown after repeated 429 responses. */
  adaptiveRateLimit?: AdaptiveRateLimitConfig;
  /** Optional response caching layer for endpoint outputs. */
  responseCache?: ResponseCacheConfig;
  /** Custom User-Agent header value. */
  userAgent?: string;
  /** Optional cookie storage implementation. */
  cookieStore?: CookieStore;
  /** Optional request rewrite hook (URL/headers/proxy changes). */
  proxyHook?: ProxyHook;
}

export interface EndpointDebugOptions {
  /** Includes raw upstream response payload in `result.raw` when true. */
  debugRawResponse?: boolean;
}

export interface EndpointOutput<TData, TRaw = unknown> {
  /** Normalized and validated endpoint payload. */
  data: TData;
  /** Optional raw upstream payload when debug mode is enabled. */
  raw?: TRaw;
}

export interface TrendSearchClient {
  /**
   * Returns topic suggestions for a free-text keyword.
   *
   * @param input - Request payload with the keyword to autocomplete.
   * @param options - Optional debug flags.
   * @returns Autocomplete topics from Google Trends.
   */
  autocomplete: (
    input: { keyword: string; hl?: string; tz?: number },
    options?: EndpointDebugOptions
  ) => Promise<EndpointOutput<{ topics: Topic[] }>>;
  /**
   * Fetches Explore widgets and comparison metadata used by other endpoints.
   *
   * @param input - Explore request payload.
   * @param options - Optional debug flags.
   * @returns Explore widgets and normalized comparison items.
   */
  explore: (
    input: {
      keywords: string[];
      geo?: string | string[];
      time?: string;
      category?: number;
      property?: "" | "images" | "news" | "youtube" | "froogle";
      hl?: string;
      tz?: number;
    },
    options?: EndpointDebugOptions
  ) => Promise<
    EndpointOutput<{
      widgets: ExploreWidget[];
      comparisonItem: { keyword: string; geo?: string; time: string }[];
    }>
  >;
  /**
   * Returns time-series search interest for one or more keywords.
   *
   * @param input - Interest-over-time request payload.
   * @param options - Optional debug flags.
   * @returns Timeline points with values per keyword.
   */
  interestOverTime: (
    input: {
      keywords: string[];
      geo?: string | string[];
      time?: string;
      category?: number;
      property?: "" | "images" | "news" | "youtube" | "froogle";
      hl?: string;
      tz?: number;
    },
    options?: EndpointDebugOptions
  ) => Promise<EndpointOutput<{ timeline: InterestOverTimePoint[] }>>;
  /**
   * Returns geographic distribution for one or more keywords.
   *
   * @param input - Interest-by-region request payload.
   * @param options - Optional debug flags.
   * @returns Region-level search interest values.
   */
  interestByRegion: (
    input: {
      keywords: string[];
      geo?: string | string[];
      time?: string;
      category?: number;
      property?: "" | "images" | "news" | "youtube" | "froogle";
      resolution?: "COUNTRY" | "REGION" | "CITY" | "DMA";
      hl?: string;
      tz?: number;
    },
    options?: EndpointDebugOptions
  ) => Promise<EndpointOutput<{ regions: GeoMapData[] }>>;
  /**
   * Returns related query terms for the provided keywords.
   *
   * @param input - Related-queries request payload.
   * @param options - Optional debug flags.
   * @returns Top and rising related query lists.
   */
  relatedQueries: (
    input: {
      keywords: string[];
      geo?: string | string[];
      time?: string;
      category?: number;
      property?: "" | "images" | "news" | "youtube" | "froogle";
      hl?: string;
      tz?: number;
    },
    options?: EndpointDebugOptions
  ) => Promise<
    EndpointOutput<{ top: RelatedQueryItem[]; rising: RelatedQueryItem[] }>
  >;
  /**
   * Returns related topic entities for the provided keywords.
   *
   * @param input - Related-topics request payload.
   * @param options - Optional debug flags.
   * @returns Top and rising related topic lists.
   */
  relatedTopics: (
    input: {
      keywords: string[];
      geo?: string | string[];
      time?: string;
      category?: number;
      property?: "" | "images" | "news" | "youtube" | "froogle";
      hl?: string;
      tz?: number;
    },
    options?: EndpointDebugOptions
  ) => Promise<
    EndpointOutput<{ top: RelatedTopicItem[]; rising: RelatedTopicItem[] }>
  >;
  /**
   * Fetches daily trending searches from the legacy route.
   *
   * @param input - Daily trends request payload.
   * @param options - Optional debug flags.
   * @returns Grouped day payload and flattened trend list.
   */
  dailyTrends: (
    input: {
      geo: string;
      category?: string | number;
      date?: string | Date;
      ns?: number;
      hl?: string;
      tz?: number;
    },
    options?: EndpointDebugOptions
  ) => Promise<
    EndpointOutput<{
      days: DailyTrendsResponse["default"]["trendingSearchesDays"];
      trends: DailyTrendsResponse["default"]["trendingSearchesDays"][number]["trendingSearches"];
    }>
  >;
  /**
   * Fetches real-time trend stories from the legacy route.
   *
   * @param input - Real-time trends request payload.
   * @param options - Optional debug flags.
   * @returns Story list normalized from upstream payload.
   */
  realTimeTrends: (
    input: {
      geo: string;
      category?: string | number;
      fi?: number;
      fs?: number;
      ri?: number;
      rs?: number;
      sort?: number;
      hl?: string;
      tz?: number;
    },
    options?: EndpointDebugOptions
  ) => Promise<
    EndpointOutput<{
      stories: Record<string, unknown>[];
    }>
  >;
  /**
   * Returns Trending Now items from internal Trends endpoints.
   *
   * @param input - Trending now request payload.
   * @param options - Optional debug flags.
   * @returns Trending now item list.
   */
  trendingNow: (
    input: { geo?: string; language?: string; hours?: 4 | 24 | 48 | 168 },
    options?: EndpointDebugOptions
  ) => Promise<EndpointOutput<{ items: TrendingNowItem[] }>>;
  /**
   * Expands article keys into detailed trending article documents.
   *
   * @param input - Trending articles request payload.
   * @param options - Optional debug flags.
   * @returns Trending article list for the provided keys.
   */
  trendingArticles: (
    input: {
      articleKeys: [number, string, string][];
      articleCount?: number;
    },
    options?: EndpointDebugOptions
  ) => Promise<EndpointOutput<{ articles: TrendingArticleItem[] }>>;
  /** Experimental endpoint namespace (upstream contract may change without notice). */
  experimental: {
    /**
     * Experimental alias for `trendingNow`.
     *
     * @param input - Trending now request payload.
     * @param options - Optional debug flags.
     * @returns Trending now item list.
     */
    trendingNow: (
      input: { geo?: string; language?: string; hours?: 4 | 24 | 48 | 168 },
      options?: EndpointDebugOptions
    ) => Promise<EndpointOutput<{ items: TrendingNowItem[] }>>;
    /**
     * Experimental alias for `trendingArticles`.
     *
     * @param input - Trending articles request payload.
     * @param options - Optional debug flags.
     * @returns Trending article list.
     */
    trendingArticles: (
      input: {
        articleKeys: [number, string, string][];
        articleCount?: number;
      },
      options?: EndpointDebugOptions
    ) => Promise<EndpointOutput<{ articles: TrendingArticleItem[] }>>;
    /**
     * Fetches the experimental geo picker tree used by Trends UI.
     *
     * @param input - Optional locale overrides.
     * @param options - Optional debug flags.
     * @returns Geo picker node tree.
     */
    geoPicker: (
      input?: { hl?: string },
      options?: EndpointDebugOptions
    ) => Promise<EndpointOutput<{ items: GeoPickerResponse }>>;
    /**
     * Fetches the experimental category picker tree used by Trends UI.
     *
     * @param input - Optional locale overrides.
     * @param options - Optional debug flags.
     * @returns Category picker node tree.
     */
    categoryPicker: (
      input?: { hl?: string },
      options?: EndpointDebugOptions
    ) => Promise<EndpointOutput<{ items: CategoryPickerResponse }>>;
    /**
     * Fetches top charts and normalized chart items.
     *
     * @param input - Optional top charts request payload.
     * @param options - Optional debug flags.
     * @returns Top chart containers and flattened items.
     */
    topCharts: (
      input?: {
        date?: number | string | Date;
        geo?: string;
        isMobile?: boolean;
        hl?: string;
        tz?: number;
      },
      options?: EndpointDebugOptions
    ) => Promise<
      EndpointOutput<{
        charts: TopChart[];
        items: TopChartListItem[];
      }>
    >;
    /**
     * Returns multi-range timeline data from the experimental endpoint.
     *
     * @param input - Multi-range interest request payload.
     * @param options - Optional debug flags.
     * @returns Multi-range timeline rows.
     */
    interestOverTimeMultirange: (
      input: {
        keywords: string[];
        geo?: string | string[];
        time?: string;
        category?: number;
        property?: "" | "images" | "news" | "youtube" | "froogle";
        hl?: string;
        tz?: number;
      },
      options?: EndpointDebugOptions
    ) => Promise<
      EndpointOutput<{ timeline: InterestOverTimeMultirangePoint[] }>
    >;
    /**
     * Returns raw CSV payload for interest-over-time.
     *
     * @param input - Interest-over-time request payload.
     * @param options - Optional debug flags.
     * @returns CSV text and content type metadata.
     */
    interestOverTimeCsv: (
      input: {
        keywords: string[];
        geo?: string | string[];
        time?: string;
        category?: number;
        property?: "" | "images" | "news" | "youtube" | "froogle";
        hl?: string;
        tz?: number;
      },
      options?: EndpointDebugOptions
    ) => Promise<EndpointOutput<{ csv: string; contentType?: string }>>;
    /**
     * Returns raw CSV payload for multi-range interest-over-time.
     *
     * @param input - Multi-range interest request payload.
     * @param options - Optional debug flags.
     * @returns CSV text and content type metadata.
     */
    interestOverTimeMultirangeCsv: (
      input: {
        keywords: string[];
        geo?: string | string[];
        time?: string;
        category?: number;
        property?: "" | "images" | "news" | "youtube" | "froogle";
        hl?: string;
        tz?: number;
      },
      options?: EndpointDebugOptions
    ) => Promise<EndpointOutput<{ csv: string; contentType?: string }>>;
    /**
     * Returns raw CSV payload for interest-by-region.
     *
     * @param input - Interest-by-region request payload.
     * @param options - Optional debug flags.
     * @returns CSV text and content type metadata.
     */
    interestByRegionCsv: (
      input: {
        keywords: string[];
        geo?: string | string[];
        time?: string;
        category?: number;
        property?: "" | "images" | "news" | "youtube" | "froogle";
        resolution?: "COUNTRY" | "REGION" | "CITY" | "DMA";
        hl?: string;
        tz?: number;
      },
      options?: EndpointDebugOptions
    ) => Promise<EndpointOutput<{ csv: string; contentType?: string }>>;
    /**
     * Returns raw CSV payload for related queries.
     *
     * @param input - Related-queries request payload.
     * @param options - Optional debug flags.
     * @returns CSV text and content type metadata.
     */
    relatedQueriesCsv: (
      input: {
        keywords: string[];
        geo?: string | string[];
        time?: string;
        category?: number;
        property?: "" | "images" | "news" | "youtube" | "froogle";
        hl?: string;
        tz?: number;
      },
      options?: EndpointDebugOptions
    ) => Promise<EndpointOutput<{ csv: string; contentType?: string }>>;
    /**
     * Returns raw CSV payload for related topics.
     *
     * @param input - Related-topics request payload.
     * @param options - Optional debug flags.
     * @returns CSV text and content type metadata.
     */
    relatedTopicsCsv: (
      input: {
        keywords: string[];
        geo?: string | string[];
        time?: string;
        category?: number;
        property?: "" | "images" | "news" | "youtube" | "froogle";
        hl?: string;
        tz?: number;
      },
      options?: EndpointDebugOptions
    ) => Promise<EndpointOutput<{ csv: string; contentType?: string }>>;
    /**
     * Fetches the legacy hot trends payload with minimal normalization.
     *
     * @param input - Optional locale/timezone overrides.
     * @param options - Optional debug flags.
     * @returns Legacy payload object.
     */
    hotTrendsLegacy: (
      input?: { hl?: string; tz?: number },
      options?: EndpointDebugOptions
    ) => Promise<EndpointOutput<{ payload: HotTrendsLegacyResponse }>>;
  };
}

export interface RequestConfig {
  endpoint: string;
  path: string;
  method?: "GET" | "POST";
  query?: Record<string, string | number | boolean | undefined | null>;
  headers?: Record<string, string>;
  body?: string;
  stripGooglePrefix?: boolean;
}

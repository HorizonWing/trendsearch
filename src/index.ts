import { createClient as createTrendSearchClient } from "./client/create-client";

export {
  type CreateClientConfig,
  type EndpointDebugOptions,
  type ResponseCacheConfig,
  type ResponseCacheEndpoint,
  type TrendSearchClient,
} from "./client/public-types";
export { MemoryCookieStore } from "./core/session/cookies";
export {
  EndpointUnavailableError,
  TrendSearchError,
  RateLimitError,
  SchemaValidationError,
  TransportError,
  UnexpectedResponseError,
} from "./errors";
export { schemas } from "./schemas";
export type {
  ArticleKey,
  AutocompleteRequest,
  AutocompleteResponse,
  CategoryPickerRequest,
  CategoryPickerResponse,
  DailyTrendArticle,
  DailyTrendItem,
  DailyTrendsRequest,
  DailyTrendsResponse,
  ExploreRequest,
  ExploreResponse,
  ExploreWidget,
  GeoMapData,
  GeoPickerRequest,
  GeoPickerResponse,
  GoogleProperty,
  HotTrendsLegacyRequest,
  HotTrendsLegacyResponse,
  InterestByRegionRequest,
  InterestByRegionResponse,
  InterestOverTimePoint,
  InterestOverTimeRequest,
  InterestOverTimeResponse,
  InterestOverTimeMultirangePoint,
  InterestOverTimeMultirangeRequest,
  InterestOverTimeMultirangeResponse,
  MultirangeColumnData,
  PickerNode,
  RealTimeStory,
  RealTimeTrendsRequest,
  RealTimeTrendsResponse,
  RelatedQueriesRequest,
  RelatedQueriesResponse,
  RelatedQueryItem,
  RelatedTopicItem,
  RelatedTopicsRequest,
  RelatedTopicsResponse,
  Resolution,
  TopChart,
  TopChartListItem,
  TopChartsRequest,
  TopChartsResponse,
  Topic,
  TrendingArticleItem,
  TrendingArticlesRequest,
  TrendingArticlesResponse,
  TrendingNowItem,
  TrendingNowRequest,
  TrendingNowResponse,
} from "./schemas";

/**
 * Creates a configured trendsearch client instance.
 *
 * @param config - Optional runtime and transport configuration.
 * @returns A client exposing stable and experimental endpoint methods.
 */
export const createClient: typeof createTrendSearchClient =
  createTrendSearchClient;

const defaultClient = createClient();

/**
 * Autocomplete a keyword into suggested topics.
 *
 * @param input - Request payload with keyword and optional locale overrides.
 * @param options - Optional debug flags.
 * @returns Topic suggestions from Google Trends.
 */
export const { autocomplete } = defaultClient;

/**
 * Fetch Explore widgets and comparison metadata.
 *
 * @param input - Explore request payload.
 * @param options - Optional debug flags.
 * @returns Explore widgets and normalized comparison items.
 */
export const { explore } = defaultClient;

/**
 * Fetch interest-over-time timeline points.
 *
 * @param input - Interest-over-time request payload.
 * @param options - Optional debug flags.
 * @returns Timeline values by keyword.
 */
export const { interestOverTime } = defaultClient;

/**
 * Fetch interest distribution by geographic region.
 *
 * @param input - Interest-by-region request payload.
 * @param options - Optional debug flags.
 * @returns Region-level values.
 */
export const { interestByRegion } = defaultClient;

/**
 * Fetch related query terms for the provided keywords.
 *
 * @param input - Related-queries request payload.
 * @param options - Optional debug flags.
 * @returns Top and rising related queries.
 */
export const { relatedQueries } = defaultClient;

/**
 * Fetch related topic entities for the provided keywords.
 *
 * @param input - Related-topics request payload.
 * @param options - Optional debug flags.
 * @returns Top and rising related topics.
 */
export const { relatedTopics } = defaultClient;

/**
 * Fetch daily trending searches from the legacy route.
 *
 * @param input - Daily trends request payload.
 * @param options - Optional debug flags.
 * @returns Day-grouped and flattened trend payload.
 */
export const { dailyTrends } = defaultClient;

/**
 * Fetch real-time trend stories from the legacy route.
 *
 * @param input - Real-time trends request payload.
 * @param options - Optional debug flags.
 * @returns Real-time story list.
 */
export const { realTimeTrends } = defaultClient;

/**
 * Fetch Trending Now items.
 *
 * @param input - Trending now request payload.
 * @param options - Optional debug flags.
 * @returns Trending now item list.
 */
export const { trendingNow } = defaultClient;

/**
 * Fetch detailed article documents for article keys.
 *
 * @param input - Trending articles request payload.
 * @param options - Optional debug flags.
 * @returns Trending article list.
 */
export const { trendingArticles } = defaultClient;

/**
 * Experimental endpoint namespace.
 * Experimental contracts may change when upstream Google payloads change.
 */
export const { experimental } = defaultClient;

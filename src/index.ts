import { createClient } from "./client/create-client";

export {
  type CreateClientConfig,
  type EndpointDebugOptions,
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

export { createClient };

const defaultClient = createClient();

export const { autocomplete } = defaultClient;
export const { explore } = defaultClient;
export const { interestOverTime } = defaultClient;
export const { interestByRegion } = defaultClient;
export const { relatedQueries } = defaultClient;
export const { relatedTopics } = defaultClient;
export const { dailyTrends } = defaultClient;
export const { realTimeTrends } = defaultClient;
export const { trendingNow } = defaultClient;
export const { trendingArticles } = defaultClient;

export const { experimental } = defaultClient;

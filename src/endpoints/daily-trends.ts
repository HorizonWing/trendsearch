import type { EndpointDebugOptions } from "../client/public-types";

import { validateSchema } from "../core/http/validate-schema";
import {
  EndpointUnavailableError,
  SchemaValidationError,
  TransportError,
} from "../errors";
import {
  dailyTrendsRequestSchema,
  dailyTrendsResponseSchema,
  type DailyTrendsResponse,
} from "../schemas";
import {
  type EndpointContext,
  type EndpointResultWithRaw,
  resolveCommon,
  withOptionalRaw,
} from "./shared";
import { formatDateWithoutDashes } from "./utils";

export interface DailyTrendsData {
  days: DailyTrendsResponse["default"]["trendingSearchesDays"];
  trends: DailyTrendsResponse["default"]["trendingSearchesDays"][number]["trendingSearches"];
}

export type DailyTrendsResult = EndpointResultWithRaw<
  DailyTrendsData,
  DailyTrendsResponse
>;

export const dailyTrendsEndpoint = async (
  ctx: EndpointContext,
  input: unknown,
  options?: EndpointDebugOptions
): Promise<DailyTrendsResult> => {
  const request = validateSchema({
    endpoint: "dailyTrends.request",
    schema: dailyTrendsRequestSchema,
    data: input,
  });

  const common = resolveCommon(ctx, request);
  let date = new Date();
  if (request.date instanceof Date) {
    ({ date } = request);
  } else if (request.date) {
    date = new Date(request.date);
  }
  if (Number.isNaN(date.getTime())) {
    throw new SchemaValidationError({
      endpoint: "dailyTrends.request",
      issues: ["date: Expected a valid ISO date string or Date object."],
    });
  }

  let responseJson: unknown;
  try {
    responseJson = await ctx.requestJson({
      endpoint: "dailyTrends",
      path: "/trends/api/dailytrends",
      query: {
        hl: common.hl,
        tz: common.tz,
        geo: request.geo,
        cat: request.category ?? "all",
        ed: formatDateWithoutDashes(date),
        ns: request.ns ?? 15,
      },
      stripGooglePrefix: true,
    });
  } catch (error) {
    if (
      error instanceof TransportError &&
      (error.status === 404 || error.status === 410)
    ) {
      throw new EndpointUnavailableError({
        endpoint: "dailyTrends",
        status: error.status,
        replacements: ["trendingNow"],
      });
    }
    throw error;
  }

  const response = validateSchema({
    endpoint: "dailyTrends.response",
    schema: dailyTrendsResponseSchema,
    data: responseJson,
  });

  const trends = response.default.trendingSearchesDays.flatMap(
    (day) => day.trendingSearches
  );

  return withOptionalRaw({
    options,
    data: {
      days: response.default.trendingSearchesDays,
      trends,
    },
    raw: response,
  });
};

import type { EndpointDebugOptions } from "../client/public-types";

import { validateSchema } from "../core/http/validate-schema";
import { EndpointUnavailableError, TransportError } from "../errors";
import {
  realTimeTrendsRequestSchema,
  realTimeTrendsResponseSchema,
  type RealTimeTrendsResponse,
} from "../schemas";
import {
  type EndpointContext,
  type EndpointResultWithRaw,
  resolveCommon,
  withOptionalRaw,
} from "./shared";

export interface RealTimeTrendsData {
  stories: RealTimeTrendsResponse["storySummaries"]["trendingStories"];
}

export type RealTimeTrendsResult = EndpointResultWithRaw<
  RealTimeTrendsData,
  RealTimeTrendsResponse
>;

export const realTimeTrendsEndpoint = async (
  ctx: EndpointContext,
  input: unknown,
  options?: EndpointDebugOptions
): Promise<RealTimeTrendsResult> => {
  const request = validateSchema({
    endpoint: "realTimeTrends.request",
    schema: realTimeTrendsRequestSchema,
    data: input,
  });

  const common = resolveCommon(ctx, request);

  let responseJson: unknown;
  try {
    responseJson = await ctx.requestJson({
      endpoint: "realTimeTrends",
      path: "/trends/api/realtimetrends",
      query: {
        hl: common.hl,
        tz: common.tz,
        geo: request.geo,
        cat: request.category ?? "all",
        fi: request.fi ?? 0,
        fs: request.fs ?? 0,
        ri: request.ri ?? 300,
        rs: request.rs ?? 20,
        sort: request.sort ?? 0,
      },
      stripGooglePrefix: true,
    });
  } catch (error) {
    if (
      error instanceof TransportError &&
      (error.status === 404 || error.status === 410)
    ) {
      throw new EndpointUnavailableError({
        endpoint: "realTimeTrends",
        status: error.status,
        replacements: ["trendingNow", "trendingArticles"],
      });
    }
    throw error;
  }

  const response = validateSchema({
    endpoint: "realTimeTrends.response",
    schema: realTimeTrendsResponseSchema,
    data: responseJson,
  });

  return withOptionalRaw({
    options,
    data: {
      stories: response.storySummaries.trendingStories,
    },
    raw: response,
  });
};

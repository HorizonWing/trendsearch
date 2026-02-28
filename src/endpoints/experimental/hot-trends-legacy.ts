import type { EndpointDebugOptions } from "../../client/public-types";

import { validateSchema } from "../../core/http/validate-schema";
import {
  hotTrendsLegacyRequestSchema,
  hotTrendsLegacyResponseSchema,
  type HotTrendsLegacyResponse,
} from "../../schemas";
import {
  type EndpointContext,
  type EndpointResultWithRaw,
  withOptionalRaw,
} from "../shared";

export interface HotTrendsLegacyData {
  payload: HotTrendsLegacyResponse;
}

export type HotTrendsLegacyResult = EndpointResultWithRaw<
  HotTrendsLegacyData,
  HotTrendsLegacyResponse
>;

export const hotTrendsLegacyEndpoint = async (
  ctx: EndpointContext,
  input?: unknown,
  options?: EndpointDebugOptions
): Promise<HotTrendsLegacyResult> => {
  validateSchema({
    endpoint: "experimental.hotTrendsLegacy.request",
    schema: hotTrendsLegacyRequestSchema,
    data: input,
  });

  const responseJson = await ctx.requestJson({
    endpoint: "experimental.hotTrendsLegacy",
    path: "/trends/hottrends/visualize/internal/data",
    stripGooglePrefix: true,
  });

  const response = validateSchema({
    endpoint: "experimental.hotTrendsLegacy.response",
    schema: hotTrendsLegacyResponseSchema,
    data: responseJson,
  });

  return withOptionalRaw({
    options,
    data: {
      payload: response,
    },
    raw: response,
  });
};

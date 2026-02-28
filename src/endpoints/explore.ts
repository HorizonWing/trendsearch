import type { EndpointDebugOptions } from "../client/public-types";

import { validateSchema } from "../core/http/validate-schema";
import {
  exploreRequestSchema,
  exploreResponseSchema,
  type ExploreResponse,
  type ExploreWidget,
} from "../schemas";
import {
  type EndpointContext,
  type EndpointResultWithRaw,
  resolveCommon,
  withOptionalRaw,
} from "./shared";
import { buildComparisonItems } from "./utils";

export interface ExploreData {
  widgets: ExploreWidget[];
  comparisonItem: { keyword: string; geo?: string; time: string }[];
}

export type ExploreResult = EndpointResultWithRaw<ExploreData, ExploreResponse>;

export const exploreEndpoint = async (
  ctx: EndpointContext,
  input: unknown,
  options?: EndpointDebugOptions
): Promise<ExploreResult> => {
  const request = validateSchema({
    endpoint: "explore.request",
    schema: exploreRequestSchema,
    data: input,
  });

  const common = resolveCommon(ctx, request);
  const time = request.time ?? "today 12-m";
  const comparisonItem = buildComparisonItems({
    endpoint: "explore.request",
    keywords: request.keywords,
    geo: request.geo,
    time,
  });

  const responseJson = await ctx.requestJson({
    endpoint: "explore",
    path: "/trends/api/explore",
    query: {
      hl: common.hl,
      tz: common.tz,
      req: JSON.stringify({
        comparisonItem,
        category: request.category ?? 0,
        property: request.property ?? "",
      }),
    },
    stripGooglePrefix: true,
  });

  const response = validateSchema({
    endpoint: "explore.response",
    schema: exploreResponseSchema,
    data: responseJson,
  });

  return withOptionalRaw({
    options,
    data: {
      widgets: response.widgets,
      comparisonItem,
    },
    raw: response,
  });
};

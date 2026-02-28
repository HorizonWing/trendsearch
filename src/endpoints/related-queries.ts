import type { EndpointDebugOptions } from "../client/public-types";

import { validateSchema } from "../core/http/validate-schema";
import { selectWidget } from "../parsers/select-widget";
import {
  relatedQueriesRequestSchema,
  relatedQueriesResponseSchema,
  type RelatedQueriesResponse,
  type RelatedQueryItem,
} from "../schemas";
import { exploreEndpoint } from "./explore";
import {
  type EndpointContext,
  type EndpointResultWithRaw,
  resolveCommon,
  withOptionalRaw,
} from "./shared";
import { enrichRelatedSearchRequest } from "./utils";

export interface RelatedQueriesData {
  top: RelatedQueryItem[];
  rising: RelatedQueryItem[];
}

export type RelatedQueriesResult = EndpointResultWithRaw<
  RelatedQueriesData,
  RelatedQueriesResponse
>;

export const relatedQueriesEndpoint = async (
  ctx: EndpointContext,
  input: unknown,
  options?: EndpointDebugOptions
): Promise<RelatedQueriesResult> => {
  const request = validateSchema({
    endpoint: "relatedQueries.request",
    schema: relatedQueriesRequestSchema,
    data: input,
  });

  const common = resolveCommon(ctx, request);
  const explore = await exploreEndpoint(ctx, request);
  const widget = selectWidget({
    endpoint: "relatedQueries",
    widgets: explore.data.widgets,
    id: "RELATED_QUERIES",
  });

  const enrichedRequest = enrichRelatedSearchRequest({
    widgetRequest: widget.request,
    hl: common.hl,
    geo: typeof request.geo === "string"
      ? request.geo
      : request.geo?.[0],
  });

  const responseJson = await ctx.requestJson({
    endpoint: "relatedQueries",
    path: "/trends/api/widgetdata/relatedsearches",
    query: {
      hl: common.hl,
      tz: common.tz,
      req: JSON.stringify(enrichedRequest),
      token: widget.token,
    },
    stripGooglePrefix: true,
  });

  const response = validateSchema({
    endpoint: "relatedQueries.response",
    schema: relatedQueriesResponseSchema,
    data: responseJson,
  });

  return withOptionalRaw({
    options,
    data: {
      top: response.default.rankedList[0]?.rankedKeyword ?? [],
      rising: response.default.rankedList[1]?.rankedKeyword ?? [],
    },
    raw: response,
  });
};

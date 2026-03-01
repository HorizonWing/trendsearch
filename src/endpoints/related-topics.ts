import type { EndpointDebugOptions } from "../client/public-types";

import { validateSchema } from "../core/http/validate-schema";
import { selectWidget } from "../parsers/select-widget";
import {
  relatedTopicsRequestSchema,
  relatedTopicsResponseSchema,
  type RelatedTopicItem,
  type RelatedTopicsResponse,
} from "../schemas";
import { exploreEndpoint } from "./explore";
import {
  type EndpointContext,
  type EndpointResultWithRaw,
  resolveCommon,
  withOptionalRaw,
} from "./shared";
import { enrichRelatedSearchRequest } from "./utils";

export interface RelatedTopicsData {
  top: RelatedTopicItem[];
  rising: RelatedTopicItem[];
}

export type RelatedTopicsResult = EndpointResultWithRaw<
  RelatedTopicsData,
  RelatedTopicsResponse
>;

export const relatedTopicsEndpoint = async (
  ctx: EndpointContext,
  input: unknown,
  options?: EndpointDebugOptions
): Promise<RelatedTopicsResult> => {
  const request = validateSchema({
    endpoint: "relatedTopics.request",
    schema: relatedTopicsRequestSchema,
    data: input,
  });

  const common = resolveCommon(ctx, request);
  const explore = await exploreEndpoint(ctx, request);
  const widget = selectWidget({
    endpoint: "relatedTopics",
    widgets: explore.data.widgets,
    id: "RELATED_TOPICS",
  });

  const enrichedRequest = enrichRelatedSearchRequest({
    widgetRequest: widget.request,
    hl: common.hl,
    geo: typeof request.geo === "string" ? request.geo : request.geo?.[0],
  });

  const responseJson = await ctx.requestJson({
    endpoint: "relatedTopics",
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
    endpoint: "relatedTopics.response",
    schema: relatedTopicsResponseSchema,
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

import type { EndpointDebugOptions } from "../../client/public-types";

import { validateSchema } from "../../core/http/validate-schema";
import { selectWidget } from "../../parsers/select-widget";
import {
  interestOverTimeMultirangeRequestSchema,
  interestOverTimeMultirangeResponseSchema,
  type InterestOverTimeMultirangePoint,
  type InterestOverTimeMultirangeResponse,
} from "../../schemas";
import { exploreEndpoint } from "../explore";
import {
  type EndpointContext,
  type EndpointResultWithRaw,
  resolveCommon,
  withOptionalRaw,
} from "../shared";

export interface InterestOverTimeMultirangeData {
  timeline: InterestOverTimeMultirangePoint[];
}

export type InterestOverTimeMultirangeResult = EndpointResultWithRaw<
  InterestOverTimeMultirangeData,
  InterestOverTimeMultirangeResponse
>;

export const interestOverTimeMultirangeEndpoint = async (
  ctx: EndpointContext,
  input: unknown,
  options?: EndpointDebugOptions
): Promise<InterestOverTimeMultirangeResult> => {
  const request = validateSchema({
    endpoint: "experimental.interestOverTimeMultirange.request",
    schema: interestOverTimeMultirangeRequestSchema,
    data: input,
  });

  const common = resolveCommon(ctx, request);
  const explore = await exploreEndpoint(ctx, request);
  const widget = selectWidget({
    endpoint: "experimental.interestOverTimeMultirange",
    widgets: explore.data.widgets,
    id: "TIMESERIES",
  });

  const responseJson = await ctx.requestJson({
    endpoint: "experimental.interestOverTimeMultirange",
    path: "/trends/api/widgetdata/multirange",
    query: {
      hl: common.hl,
      tz: common.tz,
      req: JSON.stringify(widget.request),
      token: widget.token,
    },
    stripGooglePrefix: true,
  });

  const response = validateSchema({
    endpoint: "experimental.interestOverTimeMultirange.response",
    schema: interestOverTimeMultirangeResponseSchema,
    data: responseJson,
  });

  return withOptionalRaw({
    options,
    data: {
      timeline: response.default.timelineData,
    },
    raw: response,
  });
};

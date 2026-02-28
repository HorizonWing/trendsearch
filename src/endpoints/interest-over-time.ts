import type { EndpointDebugOptions } from "../client/public-types";

import { validateSchema } from "../core/http/validate-schema";
import { selectWidget } from "../parsers/select-widget";
import {
  interestOverTimeRequestSchema,
  interestOverTimeResponseSchema,
  type InterestOverTimePoint,
  type InterestOverTimeResponse,
} from "../schemas";
import { exploreEndpoint } from "./explore";
import {
  type EndpointContext,
  type EndpointResultWithRaw,
  resolveCommon,
  withOptionalRaw,
} from "./shared";

export interface InterestOverTimeData {
  timeline: InterestOverTimePoint[];
}

export type InterestOverTimeResult = EndpointResultWithRaw<
  InterestOverTimeData,
  InterestOverTimeResponse
>;

export const interestOverTimeEndpoint = async (
  ctx: EndpointContext,
  input: unknown,
  options?: EndpointDebugOptions
): Promise<InterestOverTimeResult> => {
  const request = validateSchema({
    endpoint: "interestOverTime.request",
    schema: interestOverTimeRequestSchema,
    data: input,
  });

  const common = resolveCommon(ctx, request);
  const explore = await exploreEndpoint(ctx, request);
  const widget = selectWidget({
    endpoint: "interestOverTime",
    widgets: explore.data.widgets,
    id: "TIMESERIES",
  });

  const responseJson = await ctx.requestJson({
    endpoint: "interestOverTime",
    path: "/trends/api/widgetdata/multiline",
    query: {
      hl: common.hl,
      tz: common.tz,
      req: JSON.stringify(widget.request),
      token: widget.token,
    },
    stripGooglePrefix: true,
  });

  const response = validateSchema({
    endpoint: "interestOverTime.response",
    schema: interestOverTimeResponseSchema,
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

import type { EndpointDebugOptions } from "../client/public-types";

import { validateSchema } from "../core/http/validate-schema";
import { selectWidget } from "../parsers/select-widget";
import {
  interestByRegionRequestSchema,
  interestByRegionResponseSchema,
  type GeoMapData,
  type InterestByRegionResponse,
} from "../schemas";
import { exploreEndpoint } from "./explore";
import {
  type EndpointContext,
  type EndpointResultWithRaw,
  resolveCommon,
  withOptionalRaw,
} from "./shared";

export interface InterestByRegionData {
  regions: GeoMapData[];
}

export type InterestByRegionResult = EndpointResultWithRaw<
  InterestByRegionData,
  InterestByRegionResponse
>;

export const interestByRegionEndpoint = async (
  ctx: EndpointContext,
  input: unknown,
  options?: EndpointDebugOptions
): Promise<InterestByRegionResult> => {
  const request = validateSchema({
    endpoint: "interestByRegion.request",
    schema: interestByRegionRequestSchema,
    data: input,
  });

  const common = resolveCommon(ctx, request);
  const explore = await exploreEndpoint(ctx, request);
  const widget = selectWidget({
    endpoint: "interestByRegion",
    widgets: explore.data.widgets,
    id: "GEO_MAP",
  });

  const widgetRequest = {
    ...widget.request,
    ...(request.resolution ? { resolution: request.resolution } : {}),
  };

  const responseJson = await ctx.requestJson({
    endpoint: "interestByRegion",
    path: "/trends/api/widgetdata/comparedgeo",
    query: {
      hl: common.hl,
      tz: common.tz,
      req: JSON.stringify(widgetRequest),
      token: widget.token,
    },
    stripGooglePrefix: true,
  });

  const response = validateSchema({
    endpoint: "interestByRegion.response",
    schema: interestByRegionResponseSchema,
    data: responseJson,
  });

  return withOptionalRaw({
    options,
    data: {
      regions: response.default.geoMapData,
    },
    raw: response,
  });
};

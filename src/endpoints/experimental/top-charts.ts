import type { EndpointDebugOptions } from "../../client/public-types";

import { validateSchema } from "../../core/http/validate-schema";
import { EndpointUnavailableError, TransportError } from "../../errors";
import {
  topChartsRequestSchema,
  topChartsResponseSchema,
  type TopChart,
  type TopChartListItem,
  type TopChartsResponse,
} from "../../schemas";
import {
  type EndpointContext,
  type EndpointResultWithRaw,
  resolveCommon,
  withOptionalRaw,
} from "../shared";

const resolveTopChartsDate = (
  value: number | string | Date | undefined
): string => {
  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "string") {
    return value;
  }

  if (value instanceof Date) {
    return String(value.getUTCFullYear());
  }

  return String(new Date().getUTCFullYear());
};

export interface TopChartsData {
  charts: TopChart[];
  items: TopChartListItem[];
}

export type TopChartsResult = EndpointResultWithRaw<
  TopChartsData,
  TopChartsResponse
>;

export const topChartsEndpoint = async (
  ctx: EndpointContext,
  input?: unknown,
  options?: EndpointDebugOptions
): Promise<TopChartsResult> => {
  const request = validateSchema({
    endpoint: "experimental.topCharts.request",
    schema: topChartsRequestSchema,
    data: input,
  });

  const common = resolveCommon(ctx, request);
  let responseJson: unknown;
  try {
    responseJson = await ctx.requestJson({
      endpoint: "experimental.topCharts",
      path: "/trends/api/topcharts",
      query: {
        hl: common.hl,
        tz: common.tz,
        geo: request.geo ?? "GLOBAL",
        date: resolveTopChartsDate(request.date),
        isMobile: request.isMobile ? 1 : 0,
      },
      stripGooglePrefix: true,
    });
  } catch (error) {
    if (
      error instanceof TransportError &&
      (error.status === 404 || error.status === 410)
    ) {
      throw new EndpointUnavailableError({
        endpoint: "experimental.topCharts",
        status: error.status,
      });
    }
    throw error;
  }

  const response = validateSchema({
    endpoint: "experimental.topCharts.response",
    schema: topChartsResponseSchema,
    data: responseJson,
  });

  const items = response.topCharts.flatMap((bucket) => bucket.listItems);

  return withOptionalRaw({
    options,
    data: {
      charts: response.topCharts,
      items,
    },
    raw: response,
  });
};

import type { EndpointDebugOptions } from "../../client/public-types";

import { validateSchema } from "../../core/http/validate-schema";
import { selectWidget } from "../../parsers/select-widget";
import {
  interestByRegionRequestSchema,
  interestOverTimeRequestSchema,
  relatedQueriesRequestSchema,
  relatedTopicsRequestSchema,
} from "../../schemas";
import { exploreEndpoint } from "../explore";
import {
  type EndpointContext,
  type EndpointResultWithRaw,
  resolveCommon,
  withOptionalRaw,
} from "../shared";
import { enrichRelatedSearchRequest } from "../utils";

export interface CsvData {
  csv: string;
  contentType?: string;
}

type CsvResult = EndpointResultWithRaw<CsvData, string>;

export const interestOverTimeCsvEndpoint = async (
  ctx: EndpointContext,
  input: unknown,
  options?: EndpointDebugOptions
): Promise<CsvResult> => {
  const request = validateSchema({
    endpoint: "experimental.interestOverTimeCsv.request",
    schema: interestOverTimeRequestSchema,
    data: input,
  });

  const common = resolveCommon(ctx, request);
  const explore = await exploreEndpoint(ctx, request);
  const widget = selectWidget({
    endpoint: "experimental.interestOverTimeCsv",
    widgets: explore.data.widgets,
    id: "TIMESERIES",
  });

  const csv = await ctx.requestText({
    endpoint: "experimental.interestOverTimeCsv",
    path: "/trends/api/widgetdata/multiline/csv",
    query: {
      hl: common.hl,
      tz: common.tz,
      req: JSON.stringify(widget.request),
      token: widget.token,
    },
  });

  return withOptionalRaw({
    options,
    data: {
      csv,
      contentType: "text/csv",
    },
    raw: csv,
  });
};

export const interestOverTimeMultirangeCsvEndpoint = async (
  ctx: EndpointContext,
  input: unknown,
  options?: EndpointDebugOptions
): Promise<CsvResult> => {
  const request = validateSchema({
    endpoint: "experimental.interestOverTimeMultirangeCsv.request",
    schema: interestOverTimeRequestSchema,
    data: input,
  });

  const common = resolveCommon(ctx, request);
  const explore = await exploreEndpoint(ctx, request);
  const widget = selectWidget({
    endpoint: "experimental.interestOverTimeMultirangeCsv",
    widgets: explore.data.widgets,
    id: "TIMESERIES",
  });

  const csv = await ctx.requestText({
    endpoint: "experimental.interestOverTimeMultirangeCsv",
    path: "/trends/api/widgetdata/multirange/csv",
    query: {
      hl: common.hl,
      tz: common.tz,
      req: JSON.stringify(widget.request),
      token: widget.token,
    },
  });

  return withOptionalRaw({
    options,
    data: {
      csv,
      contentType: "text/csv",
    },
    raw: csv,
  });
};

export const interestByRegionCsvEndpoint = async (
  ctx: EndpointContext,
  input: unknown,
  options?: EndpointDebugOptions
): Promise<CsvResult> => {
  const request = validateSchema({
    endpoint: "experimental.interestByRegionCsv.request",
    schema: interestByRegionRequestSchema,
    data: input,
  });

  const common = resolveCommon(ctx, request);
  const explore = await exploreEndpoint(ctx, request);
  const widget = selectWidget({
    endpoint: "experimental.interestByRegionCsv",
    widgets: explore.data.widgets,
    id: "GEO_MAP",
  });

  const widgetRequest = {
    ...widget.request,
    ...(request.resolution ? { resolution: request.resolution } : {}),
  };

  const csv = await ctx.requestText({
    endpoint: "experimental.interestByRegionCsv",
    path: "/trends/api/widgetdata/comparedgeo/csv",
    query: {
      hl: common.hl,
      tz: common.tz,
      req: JSON.stringify(widgetRequest),
      token: widget.token,
    },
  });

  return withOptionalRaw({
    options,
    data: {
      csv,
      contentType: "text/csv",
    },
    raw: csv,
  });
};

export const relatedQueriesCsvEndpoint = async (
  ctx: EndpointContext,
  input: unknown,
  options?: EndpointDebugOptions
): Promise<CsvResult> => {
  const request = validateSchema({
    endpoint: "experimental.relatedQueriesCsv.request",
    schema: relatedQueriesRequestSchema,
    data: input,
  });

  const common = resolveCommon(ctx, request);
  const explore = await exploreEndpoint(ctx, request);
  const widget = selectWidget({
    endpoint: "experimental.relatedQueriesCsv",
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

  const csv = await ctx.requestText({
    endpoint: "experimental.relatedQueriesCsv",
    path: "/trends/api/widgetdata/relatedsearches/csv",
    query: {
      hl: common.hl,
      tz: common.tz,
      req: JSON.stringify(enrichedRequest),
      token: widget.token,
    },
  });

  return withOptionalRaw({
    options,
    data: {
      csv,
      contentType: "text/csv",
    },
    raw: csv,
  });
};

export const relatedTopicsCsvEndpoint = async (
  ctx: EndpointContext,
  input: unknown,
  options?: EndpointDebugOptions
): Promise<CsvResult> => {
  const request = validateSchema({
    endpoint: "experimental.relatedTopicsCsv.request",
    schema: relatedTopicsRequestSchema,
    data: input,
  });

  const common = resolveCommon(ctx, request);
  const explore = await exploreEndpoint(ctx, request);
  const widget = selectWidget({
    endpoint: "experimental.relatedTopicsCsv",
    widgets: explore.data.widgets,
    id: "RELATED_TOPICS",
  });

  const enrichedRequest = enrichRelatedSearchRequest({
    widgetRequest: widget.request,
    hl: common.hl,
    geo: typeof request.geo === "string"
      ? request.geo
      : request.geo?.[0],
  });

  const csv = await ctx.requestText({
    endpoint: "experimental.relatedTopicsCsv",
    path: "/trends/api/widgetdata/relatedsearches/csv",
    query: {
      hl: common.hl,
      tz: common.tz,
      req: JSON.stringify(enrichedRequest),
      token: widget.token,
    },
  });

  return withOptionalRaw({
    options,
    data: {
      csv,
      contentType: "text/csv",
    },
    raw: csv,
  });
};

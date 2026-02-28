import type { EndpointDebugOptions } from "../../client/public-types";

import { validateSchema } from "../../core/http/validate-schema";
import { extractBatchexecutePayload } from "../../parsers/parse-batchexecute";
import {
  trendingNowItemSchema,
  trendingNowRequestSchema,
  trendingNowResponseSchema,
  type ArticleKey,
  type TrendingNowItem,
  type TrendingNowResponse,
} from "../../schemas";
import {
  type EndpointContext,
  type EndpointResultWithRaw,
  withOptionalRaw,
} from "../shared";
import { findDeepArrays } from "../utils";

interface EndpointNames {
  request: string;
  response: string;
  transport: string;
}

const stableNames: EndpointNames = {
  request: "trendingNow.request",
  response: "trendingNow.response",
  transport: "trendingNow",
};

const experimentalNames: EndpointNames = {
  request: "experimental.trendingNow.request",
  response: "experimental.trendingNow.response",
  transport: "experimental.trendingNow",
};

const isArticleKey = (value: unknown): value is ArticleKey =>
  Array.isArray(value) &&
  value.length === 3 &&
  typeof value[0] === "number" &&
  typeof value[1] === "string" &&
  typeof value[2] === "string";

const isTrendingRow = (value: unknown): value is unknown[] =>
  Array.isArray(value) &&
  typeof value[0] === "string" &&
  value.length > 8 &&
  (typeof value[6] === "number" || typeof value[6] === "string");

const normalizeTrendingRow = (
  row: unknown[],
  endpoint: string
): TrendingNowItem => {
  const activeTimestamp =
    Array.isArray(row[3]) && typeof row[3][0] === "number"
      ? row[3][0]
      : Math.floor(Date.now() / 1000);

  const relatedKeywords = Array.isArray(row[9])
    ? row[9].filter((item): item is string => typeof item === "string")
    : [];

  const articleKeys = Array.isArray(row[11])
    ? row[11].filter(isArticleKey)
    : [];

  return validateSchema({
    endpoint,
    schema: trendingNowItemSchema,
    data: {
      keyword: row[0],
      traffic: Number(row[6] ?? 0),
      trafficGrowthRate: Number(row[8] ?? 0),
      activeTime: new Date(activeTimestamp * 1000).toISOString(),
      relatedKeywords,
      articleKeys,
    },
  });
};

export interface TrendingNowData {
  items: TrendingNowResponse;
}

export type TrendingNowResult = EndpointResultWithRaw<TrendingNowData, unknown>;

const runTrendingNowEndpoint = async (args: {
  ctx: EndpointContext;
  input: unknown;
  options?: EndpointDebugOptions;
  names: EndpointNames;
}): Promise<TrendingNowResult> => {
  const request = validateSchema({
    endpoint: args.names.request,
    schema: trendingNowRequestSchema,
    data: args.input,
  });

  const fReq = JSON.stringify([
    [
      [
        "i0OFE",
        `[null,null,"${request.geo}",0,"${request.language}",${request.hours},1]`,
        null,
        "generic",
      ],
    ],
  ]);

  const responseText = await args.ctx.requestText({
    endpoint: args.names.transport,
    path: "/_/TrendsUi/data/batchexecute",
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body: new URLSearchParams({ "f.req": fReq }).toString(),
  });

  const payload = extractBatchexecutePayload({
    endpoint: args.names.transport,
    responseText,
    rpcId: "i0OFE",
  });

  const arrays = findDeepArrays(payload);
  const rows =
    arrays
      .filter((array) => array.every((item) => isTrendingRow(item)))
      .toSorted((left, right) => right.length - left.length)[0] ?? [];

  const normalized = rows.map((row) =>
    normalizeTrendingRow(row, `${args.names.response}.item`)
  );
  const parsed = validateSchema({
    endpoint: args.names.response,
    schema: trendingNowResponseSchema,
    data: normalized,
  });

  return withOptionalRaw({
    options: args.options,
    data: {
      items: parsed,
    },
    raw: payload,
  });
};

export const trendingNowEndpoint = async (
  ctx: EndpointContext,
  input: unknown,
  options?: EndpointDebugOptions
): Promise<TrendingNowResult> =>
  runTrendingNowEndpoint({ ctx, input, options, names: stableNames });

export const experimentalTrendingNowEndpoint = async (
  ctx: EndpointContext,
  input: unknown,
  options?: EndpointDebugOptions
): Promise<TrendingNowResult> =>
  runTrendingNowEndpoint({ ctx, input, options, names: experimentalNames });

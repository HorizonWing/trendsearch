import type { EndpointDebugOptions } from "../../client/public-types";

import { validateSchema } from "../../core/http/validate-schema";
import { extractBatchexecutePayload } from "../../parsers/parse-batchexecute";
import {
  trendingArticleItemSchema,
  trendingArticlesRequestSchema,
  trendingArticlesResponseSchema,
  type TrendingArticleItem,
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
  request: "trendingArticles.request",
  response: "trendingArticles.response",
  transport: "trendingArticles",
};

const experimentalNames: EndpointNames = {
  request: "experimental.trendingArticles.request",
  response: "experimental.trendingArticles.response",
  transport: "experimental.trendingArticles",
};

const isArticleRow = (value: unknown): value is unknown[] =>
  Array.isArray(value) &&
  value.length >= 3 &&
  typeof value[0] === "string" &&
  typeof value[1] === "string";

const normalizeArticleRow = (
  row: unknown[],
  endpoint: string
): TrendingArticleItem =>
  validateSchema({
    endpoint,
    schema: trendingArticleItemSchema,
    data: {
      title: row[0],
      url: row[1],
      source: row[2],
      pressDate: row[3],
      image: row[4],
    },
  });

export interface TrendingArticlesData {
  articles: TrendingArticleItem[];
}

export type TrendingArticlesResult = EndpointResultWithRaw<
  TrendingArticlesData,
  unknown
>;

const runTrendingArticlesEndpoint = async (args: {
  ctx: EndpointContext;
  input: unknown;
  options?: EndpointDebugOptions;
  names: EndpointNames;
}): Promise<TrendingArticlesResult> => {
  const request = validateSchema({
    endpoint: args.names.request,
    schema: trendingArticlesRequestSchema,
    data: args.input,
  });

  const serializedKeys = request.articleKeys
    .map((key) => `[${key[0]},"${key[1]}","${key[2]}"]`)
    .join(",");

  const fReq = JSON.stringify([
    [
      [
        "w4opAf",
        `[[${serializedKeys}],${request.articleCount}]`,
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
    rpcId: "w4opAf",
  });

  const arrays = findDeepArrays(payload);
  const rows =
    arrays
      .filter((array) => array.every((item) => isArticleRow(item)))
      .toSorted((left, right) => right.length - left.length)[0] ?? [];

  const normalized = rows.map((row) =>
    normalizeArticleRow(row, `${args.names.response}.item`)
  );
  const parsed = validateSchema({
    endpoint: args.names.response,
    schema: trendingArticlesResponseSchema,
    data: normalized,
  });

  return withOptionalRaw({
    options: args.options,
    data: {
      articles: parsed,
    },
    raw: payload,
  });
};

export const trendingArticlesEndpoint = async (
  ctx: EndpointContext,
  input: unknown,
  options?: EndpointDebugOptions
): Promise<TrendingArticlesResult> =>
  runTrendingArticlesEndpoint({ ctx, input, options, names: stableNames });

export const experimentalTrendingArticlesEndpoint = async (
  ctx: EndpointContext,
  input: unknown,
  options?: EndpointDebugOptions
): Promise<TrendingArticlesResult> =>
  runTrendingArticlesEndpoint({
    ctx,
    input,
    options,
    names: experimentalNames,
  });

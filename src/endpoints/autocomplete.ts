import type { EndpointDebugOptions } from "../client/public-types";

import { validateSchema } from "../core/http/validate-schema";
import {
  autocompleteRequestSchema,
  autocompleteResponseSchema,
  type AutocompleteResponse,
  type Topic,
} from "../schemas";
import {
  type EndpointContext,
  type EndpointResultWithRaw,
  resolveCommon,
  withOptionalRaw,
} from "./shared";

export interface AutocompleteData {
  topics: Topic[];
}

export type AutocompleteResult = EndpointResultWithRaw<
  AutocompleteData,
  AutocompleteResponse
>;

export const autocompleteEndpoint = async (
  ctx: EndpointContext,
  input: unknown,
  options?: EndpointDebugOptions
): Promise<AutocompleteResult> => {
  const request = validateSchema({
    endpoint: "autocomplete.request",
    schema: autocompleteRequestSchema,
    data: input,
  });
  const common = resolveCommon(ctx, request);

  const responseJson = await ctx.requestJson({
    endpoint: "autocomplete",
    path: `/trends/api/autocomplete/${encodeURIComponent(request.keyword)}`,
    query: {
      hl: common.hl,
      tz: common.tz,
    },
    stripGooglePrefix: true,
  });

  const response = validateSchema({
    endpoint: "autocomplete.response",
    schema: autocompleteResponseSchema,
    data: responseJson,
  });

  return withOptionalRaw({
    options,
    data: { topics: response.default.topics },
    raw: response,
  });
};

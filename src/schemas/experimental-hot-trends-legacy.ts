import { z } from "zod";

import { commonRequestSchema } from "./common";

export const hotTrendsLegacyRequestSchema = commonRequestSchema.optional();

export const hotTrendsLegacyResponseSchema = z.union([
  z.array(z.unknown()),
  z.object({}).passthrough(),
]);

export type HotTrendsLegacyRequest = z.infer<
  typeof hotTrendsLegacyRequestSchema
>;
export type HotTrendsLegacyResponse = z.infer<
  typeof hotTrendsLegacyResponseSchema
>;

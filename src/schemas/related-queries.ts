import { z } from "zod";

import { exploreRequestSchema } from "./explore";

export const relatedQueriesRequestSchema = exploreRequestSchema;

export const relatedQueryItemSchema = z
  .object({
    query: z.string(),
    value: z.number(),
    formattedValue: z.string().optional(),
    hasData: z.boolean().optional(),
    link: z.string().optional(),
  })
  .passthrough();

export const relatedQueriesResponseSchema = z
  .object({
    default: z.object({
      rankedList: z.array(
        z
          .object({
            rankedKeyword: z.array(relatedQueryItemSchema),
          })
          .passthrough()
      ),
    }),
  })
  .passthrough();

export type RelatedQueriesRequest = z.infer<typeof relatedQueriesRequestSchema>;
export type RelatedQueryItem = z.infer<typeof relatedQueryItemSchema>;
export type RelatedQueriesResponse = z.infer<
  typeof relatedQueriesResponseSchema
>;

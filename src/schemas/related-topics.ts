import { z } from "zod";

import { topicSchema } from "./common";
import { exploreRequestSchema } from "./explore";

export const relatedTopicsRequestSchema = exploreRequestSchema;

export const relatedTopicItemSchema = z
  .object({
    topic: topicSchema,
    value: z.union([z.number(), z.string()]),
    formattedValue: z.string().optional(),
    hasData: z.boolean().optional(),
    link: z.string().optional(),
  })
  .passthrough();

export const relatedTopicsResponseSchema = z
  .object({
    default: z.object({
      rankedList: z.array(
        z
          .object({
            rankedKeyword: z.array(relatedTopicItemSchema),
          })
          .passthrough()
      ),
    }),
  })
  .passthrough();

export type RelatedTopicsRequest = z.infer<typeof relatedTopicsRequestSchema>;
export type RelatedTopicItem = z.infer<typeof relatedTopicItemSchema>;
export type RelatedTopicsResponse = z.infer<typeof relatedTopicsResponseSchema>;

import { z } from "zod";

import { commonRequestSchema } from "./common";

export const realTimeTrendsRequestSchema = commonRequestSchema.extend({
  geo: z.string().min(1),
  category: z.union([z.string(), z.number().int()]).optional(),
  fi: z.number().int().optional(),
  fs: z.number().int().optional(),
  ri: z.number().int().optional(),
  rs: z.number().int().optional(),
  sort: z.number().int().optional(),
});

export const realTimeStorySchema = z
  .object({
    id: z.string().optional(),
    title: z.string().optional(),
    entityNames: z.array(z.string()).optional(),
    image: z
      .object({
        imgUrl: z.string().optional(),
        newsUrl: z.string().optional(),
        source: z.string().optional(),
      })
      .passthrough()
      .optional(),
    articles: z
      .array(
        z
          .object({
            title: z.string().optional(),
            timeAgo: z.string().optional(),
            source: z.string().optional(),
            url: z.string().optional(),
            snippet: z.string().optional(),
          })
          .passthrough()
      )
      .optional(),
  })
  .passthrough();

export const realTimeTrendsResponseSchema = z
  .object({
    storySummaries: z
      .object({
        trendingStories: z.array(realTimeStorySchema),
      })
      .passthrough(),
  })
  .passthrough();

export type RealTimeTrendsRequest = z.infer<typeof realTimeTrendsRequestSchema>;
export type RealTimeStory = z.infer<typeof realTimeStorySchema>;
export type RealTimeTrendsResponse = z.infer<
  typeof realTimeTrendsResponseSchema
>;

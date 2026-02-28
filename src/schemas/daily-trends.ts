import { z } from "zod";

import { commonRequestSchema } from "./common";

const isoDateLikeSchema = z
  .string()
  .refine(
    (value) =>
      /^\d{4}-\d{2}-\d{2}(?:[Tt ]\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:\d{2})?)?$/.test(
        value
      ),
    {
      message: "Expected an ISO date-like string.",
    }
  );

export const dailyTrendsRequestSchema = commonRequestSchema.extend({
  geo: z.string().min(1),
  category: z.union([z.string(), z.number().int()]).optional(),
  date: z.union([isoDateLikeSchema, z.date()]).optional(),
  ns: z.number().int().optional(),
});

export const dailyTrendArticleSchema = z
  .object({
    title: z.string().optional(),
    timeAgo: z.string().optional(),
    source: z.string().optional(),
    url: z.string().optional(),
    snippet: z.string().optional(),
  })
  .passthrough();

export const dailyTrendItemSchema = z
  .object({
    title: z
      .object({
        query: z.string(),
      })
      .passthrough(),
    formattedTraffic: z.string().optional(),
    relatedQueries: z.array(z.string()).optional(),
    image: z
      .object({
        newsUrl: z.string().optional(),
        source: z.string().optional(),
        imageUrl: z.string().optional(),
      })
      .passthrough()
      .optional(),
    articles: z.array(dailyTrendArticleSchema).optional(),
  })
  .passthrough();

export const dailyTrendsResponseSchema = z
  .object({
    default: z.object({
      trendingSearchesDays: z.array(
        z
          .object({
            date: z.string().optional(),
            formattedDate: z.string().optional(),
            trendingSearches: z.array(dailyTrendItemSchema),
          })
          .passthrough()
      ),
    }),
  })
  .passthrough();

export type DailyTrendsRequest = z.infer<typeof dailyTrendsRequestSchema>;
export type DailyTrendArticle = z.infer<typeof dailyTrendArticleSchema>;
export type DailyTrendItem = z.infer<typeof dailyTrendItemSchema>;
export type DailyTrendsResponse = z.infer<typeof dailyTrendsResponseSchema>;

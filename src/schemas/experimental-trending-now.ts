import { z } from "zod";

export const articleKeySchema = z.tuple([z.number(), z.string(), z.string()]);

export const trendingNowRequestSchema = z.object({
  geo: z.string().min(1).default("US"),
  language: z.string().min(2).default("en"),
  hours: z
    .union([z.literal(4), z.literal(24), z.literal(48), z.literal(168)])
    .default(24),
});

export const trendingNowItemSchema = z.object({
  keyword: z.string(),
  traffic: z.number(),
  trafficGrowthRate: z.number(),
  activeTime: z.string(),
  relatedKeywords: z.array(z.string()),
  articleKeys: z.array(articleKeySchema),
});

export const trendingNowResponseSchema = z.array(trendingNowItemSchema);

export type ArticleKey = z.infer<typeof articleKeySchema>;
export type TrendingNowRequest = z.infer<typeof trendingNowRequestSchema>;
export type TrendingNowItem = z.infer<typeof trendingNowItemSchema>;
export type TrendingNowResponse = z.infer<typeof trendingNowResponseSchema>;

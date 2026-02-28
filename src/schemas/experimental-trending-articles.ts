import { z } from "zod";

import { articleKeySchema } from "./experimental-trending-now";

export const trendingArticlesRequestSchema = z.object({
  articleKeys: z.array(articleKeySchema).min(1),
  articleCount: z.number().int().positive().max(100).default(5),
});

export const trendingArticleItemSchema = z.object({
  title: z.string(),
  url: z.string(),
  source: z.string(),
  pressDate: z.array(z.number()).optional(),
  image: z.string().optional(),
});

export const trendingArticlesResponseSchema = z.array(
  trendingArticleItemSchema
);

export type TrendingArticlesRequest = z.infer<
  typeof trendingArticlesRequestSchema
>;
export type TrendingArticleItem = z.infer<typeof trendingArticleItemSchema>;
export type TrendingArticlesResponse = z.infer<
  typeof trendingArticlesResponseSchema
>;

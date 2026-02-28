import { z } from "zod";

export const googlePropertySchema = z.enum([
  "",
  "images",
  "news",
  "youtube",
  "froogle",
]);

export const resolutionSchema = z.enum(["COUNTRY", "REGION", "CITY", "DMA"]);

export const commonRequestSchema = z.object({
  hl: z.string().min(2).optional(),
  tz: z.number().int().optional(),
});

export const topicSchema = z.object({
  mid: z.string(),
  title: z.string(),
  type: z.string(),
});

export const exploreWidgetSchema = z
  .object({
    request: z.record(z.string(), z.unknown()),
    token: z.string(),
    id: z.string(),
    title: z.string().optional(),
    type: z.string().optional(),
  })
  .passthrough();

export type GoogleProperty = z.infer<typeof googlePropertySchema>;
export type Resolution = z.infer<typeof resolutionSchema>;
export type Topic = z.infer<typeof topicSchema>;
export type ExploreWidget = z.infer<typeof exploreWidgetSchema>;

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

export const topChartsRequestSchema = commonRequestSchema.extend({
  date: z
    .union([z.number().int().positive(), isoDateLikeSchema, z.date()])
    .optional(),
  geo: z.string().min(1).optional(),
  isMobile: z.boolean().optional(),
});

export const topChartListItemSchema = z
  .object({
    title: z.string().optional(),
    value: z.number().optional(),
    formattedValue: z.string().optional(),
  })
  .passthrough();

export const topChartSchema = z
  .object({
    date: z.string().optional(),
    formattedDate: z.string().optional(),
    listItems: z.array(topChartListItemSchema),
  })
  .passthrough();

export const topChartsResponseSchema = z
  .object({
    topCharts: z.array(topChartSchema),
  })
  .passthrough();

export type TopChartsRequest = z.infer<typeof topChartsRequestSchema>;
export type TopChartListItem = z.infer<typeof topChartListItemSchema>;
export type TopChart = z.infer<typeof topChartSchema>;
export type TopChartsResponse = z.infer<typeof topChartsResponseSchema>;

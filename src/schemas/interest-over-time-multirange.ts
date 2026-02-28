import { z } from "zod";

import { exploreRequestSchema } from "./explore";

export const interestOverTimeMultirangeRequestSchema = exploreRequestSchema;

export const multirangeColumnDataSchema = z
  .object({
    time: z.string().optional(),
    formattedTime: z.string().optional(),
    value: z.union([z.number(), z.array(z.number())]).optional(),
    formattedValue: z.union([z.string(), z.array(z.string())]).optional(),
    hasData: z.boolean().optional(),
  })
  .passthrough();

export const interestOverTimeMultirangePointSchema = z
  .object({
    time: z.string().optional(),
    formattedTime: z.string().optional(),
    columnData: z.array(multirangeColumnDataSchema).optional(),
  })
  .passthrough();

export const interestOverTimeMultirangeResponseSchema = z
  .object({
    default: z
      .object({
        timelineData: z.array(interestOverTimeMultirangePointSchema),
        averages: z.array(z.number()).optional(),
      })
      .passthrough(),
  })
  .passthrough();

export type InterestOverTimeMultirangeRequest = z.infer<
  typeof interestOverTimeMultirangeRequestSchema
>;
export type MultirangeColumnData = z.infer<typeof multirangeColumnDataSchema>;
export type InterestOverTimeMultirangePoint = z.infer<
  typeof interestOverTimeMultirangePointSchema
>;
export type InterestOverTimeMultirangeResponse = z.infer<
  typeof interestOverTimeMultirangeResponseSchema
>;

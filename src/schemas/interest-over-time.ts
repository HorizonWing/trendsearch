import { z } from "zod";

import { exploreRequestSchema } from "./explore";

export const interestOverTimeRequestSchema = exploreRequestSchema;

export const interestOverTimePointSchema = z
  .object({
    time: z.string(),
    formattedTime: z.string().optional(),
    formattedAxisTime: z.string().optional(),
    value: z.array(z.number()),
    formattedValue: z.array(z.union([z.string(), z.number()])).optional(),
    hasData: z.array(z.boolean()).optional(),
    isPartial: z.union([z.boolean(), z.string()]).optional(),
  })
  .passthrough();

export const interestOverTimeResponseSchema = z
  .object({
    default: z.object({
      timelineData: z.array(interestOverTimePointSchema),
    }),
  })
  .passthrough();

export type InterestOverTimeRequest = z.infer<
  typeof interestOverTimeRequestSchema
>;
export type InterestOverTimePoint = z.infer<typeof interestOverTimePointSchema>;
export type InterestOverTimeResponse = z.infer<
  typeof interestOverTimeResponseSchema
>;

import { z } from "zod";

import { resolutionSchema } from "./common";
import { exploreRequestSchema } from "./explore";

export const interestByRegionRequestSchema = exploreRequestSchema.extend({
  resolution: resolutionSchema.optional(),
});

export const geoMapDataSchema = z
  .object({
    geoCode: z.string().optional(),
    geoName: z.string(),
    value: z.array(z.number()),
    formattedValue: z.array(z.string()).optional(),
    hasData: z.array(z.boolean()).optional(),
    maxValueIndex: z.number().optional(),
    coordinates: z
      .object({
        lat: z.number(),
        lng: z.number(),
      })
      .optional(),
  })
  .passthrough();

export const interestByRegionResponseSchema = z
  .object({
    default: z.object({
      geoMapData: z.array(geoMapDataSchema),
    }),
  })
  .passthrough();

export type InterestByRegionRequest = z.infer<
  typeof interestByRegionRequestSchema
>;
export type GeoMapData = z.infer<typeof geoMapDataSchema>;
export type InterestByRegionResponse = z.infer<
  typeof interestByRegionResponseSchema
>;

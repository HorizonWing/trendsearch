import { z } from "zod";

import {
  commonRequestSchema,
  exploreWidgetSchema,
  googlePropertySchema,
} from "./common";

export const exploreRequestSchema = commonRequestSchema.extend({
  keywords: z.array(z.string().min(1)).min(1),
  geo: z
    .union([z.string().min(1), z.array(z.string().min(1)).min(1)])
    .optional(),
  time: z.string().min(1).optional(),
  category: z.number().int().nonnegative().optional(),
  property: googlePropertySchema.optional(),
});

export const exploreResponseSchema = z
  .object({
    widgets: z.array(exploreWidgetSchema),
  })
  .passthrough();

export type ExploreRequest = z.infer<typeof exploreRequestSchema>;
export type ExploreResponse = z.infer<typeof exploreResponseSchema>;

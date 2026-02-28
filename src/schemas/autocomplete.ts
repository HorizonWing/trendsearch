import { z } from "zod";

import { commonRequestSchema, topicSchema } from "./common";

export const autocompleteRequestSchema = commonRequestSchema.extend({
  keyword: z.string().min(1),
});

export const autocompleteResponseSchema = z
  .object({
    default: z.object({
      topics: z.array(topicSchema),
    }),
  })
  .passthrough();

export type AutocompleteRequest = z.infer<typeof autocompleteRequestSchema>;
export type AutocompleteResponse = z.infer<typeof autocompleteResponseSchema>;

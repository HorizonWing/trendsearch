import { z } from "zod";

export const pickerRequestSchema = z
  .object({
    hl: z.string().min(2).optional(),
  })
  .optional();

export const pickerNodeSchema = z
  .object({
    id: z.union([z.string(), z.number()]).optional(),
    name: z.string().optional(),
    type: z.string().optional(),
    children: z.array(z.unknown()).optional(),
  })
  .passthrough();

export const geoPickerResponseSchema = z
  .object({
    children: z.array(pickerNodeSchema).optional(),
  })
  .passthrough();

export const categoryPickerResponseSchema = z
  .object({
    children: z.array(pickerNodeSchema).optional(),
  })
  .passthrough();

export type GeoPickerRequest = z.infer<typeof pickerRequestSchema>;
export type CategoryPickerRequest = z.infer<typeof pickerRequestSchema>;
export type GeoPickerResponse = z.infer<typeof geoPickerResponseSchema>;
export type CategoryPickerResponse = z.infer<
  typeof categoryPickerResponseSchema
>;
export type PickerNode = z.infer<typeof pickerNodeSchema>;

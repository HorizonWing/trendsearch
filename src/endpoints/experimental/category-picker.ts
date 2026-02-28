import type { EndpointDebugOptions } from "../../client/public-types";

import { validateSchema } from "../../core/http/validate-schema";
import {
  categoryPickerResponseSchema,
  pickerRequestSchema,
  type CategoryPickerResponse,
} from "../../schemas";
import {
  type EndpointContext,
  type EndpointResultWithRaw,
  withOptionalRaw,
} from "../shared";

export interface CategoryPickerData {
  items: CategoryPickerResponse;
}

export type CategoryPickerResult = EndpointResultWithRaw<
  CategoryPickerData,
  CategoryPickerResponse
>;

export const categoryPickerEndpoint = async (
  ctx: EndpointContext,
  input?: unknown,
  options?: EndpointDebugOptions
): Promise<CategoryPickerResult> => {
  const request = validateSchema({
    endpoint: "experimental.categoryPicker.request",
    schema: pickerRequestSchema,
    data: input,
  });

  const responseJson = await ctx.requestJson({
    endpoint: "experimental.categoryPicker",
    path: "/trends/api/explore/pickers/category",
    query: {
      hl: request?.hl ?? ctx.defaultHl,
    },
    stripGooglePrefix: true,
  });

  const response = validateSchema({
    endpoint: "experimental.categoryPicker.response",
    schema: categoryPickerResponseSchema,
    data: responseJson,
  });

  return withOptionalRaw({
    options,
    data: { items: response },
    raw: response,
  });
};

import type { EndpointDebugOptions } from "../../client/public-types";

import { validateSchema } from "../../core/http/validate-schema";
import {
  geoPickerResponseSchema,
  pickerRequestSchema,
  type GeoPickerResponse,
} from "../../schemas";
import {
  type EndpointContext,
  type EndpointResultWithRaw,
  withOptionalRaw,
} from "../shared";

export interface GeoPickerData {
  items: GeoPickerResponse;
}

export type GeoPickerResult = EndpointResultWithRaw<
  GeoPickerData,
  GeoPickerResponse
>;

export const geoPickerEndpoint = async (
  ctx: EndpointContext,
  input?: unknown,
  options?: EndpointDebugOptions
): Promise<GeoPickerResult> => {
  const request = validateSchema({
    endpoint: "experimental.geoPicker.request",
    schema: pickerRequestSchema,
    data: input,
  });

  const responseJson = await ctx.requestJson({
    endpoint: "experimental.geoPicker",
    path: "/trends/api/explore/pickers/geo",
    query: {
      hl: request?.hl ?? ctx.defaultHl,
    },
    stripGooglePrefix: true,
  });

  const response = validateSchema({
    endpoint: "experimental.geoPicker.response",
    schema: geoPickerResponseSchema,
    data: responseJson,
  });

  return withOptionalRaw({
    options,
    data: { items: response },
    raw: response,
  });
};

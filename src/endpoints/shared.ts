import type { EndpointDebugOptions } from "../client/public-types";

export interface EndpointContext {
  defaultHl: string;
  defaultTz: number;
  requestJson: (input: {
    endpoint: string;
    path: string;
    query?: Record<string, string | number | boolean | undefined | null>;
    method?: "GET" | "POST";
    headers?: Record<string, string>;
    body?: string;
    stripGooglePrefix?: boolean;
  }) => Promise<unknown>;
  requestText: (input: {
    endpoint: string;
    path: string;
    query?: Record<string, string | number | boolean | undefined | null>;
    method?: "GET" | "POST";
    headers?: Record<string, string>;
    body?: string;
  }) => Promise<string>;
}

export interface EndpointResultWithRaw<TReturn, TRaw> {
  data: TReturn;
  raw?: TRaw;
}

export const withOptionalRaw = <TReturn, TRaw>(args: {
  options?: EndpointDebugOptions;
  data: TReturn;
  raw: TRaw;
}): EndpointResultWithRaw<TReturn, TRaw> => {
  if (args.options?.debugRawResponse) {
    return { data: args.data, raw: args.raw };
  }

  return { data: args.data };
};

export const resolveCommon = <TRequest extends { hl?: string; tz?: number }>(
  ctx: EndpointContext,
  request: TRequest
): { hl: string; tz: number } => ({
  hl: request.hl ?? ctx.defaultHl,
  tz: request.tz ?? ctx.defaultTz,
});

const GOOGLE_PREFIX_PATTERN = /^\)\]\}',?\s*/;

export const stripGooglePrefix = (payload: string): string =>
  payload.replace(GOOGLE_PREFIX_PATTERN, "").trim();

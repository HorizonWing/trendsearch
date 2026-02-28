import { UnexpectedResponseError } from "../errors";

export const formatDateWithoutDashes = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}${month}${day}`;
};

export const toLanguageCode = (hl: string): string =>
  hl.split("-")[0]?.toLowerCase() || "en";

export const buildComparisonItems = (args: {
  endpoint: string;
  keywords: string[];
  geo?: string | string[];
  time: string;
}): { keyword: string; geo?: string; time: string }[] => {
  const { keywords, geo, time } = args;

  if (!geo) {
    return keywords.map((keyword) => ({ keyword, time }));
  }

  if (typeof geo === "string") {
    return keywords.map((keyword) => ({ keyword, geo, time }));
  }

  if (geo.length === 1) {
    return keywords.map((keyword) => ({ keyword, geo: geo[0], time }));
  }

  if (geo.length !== keywords.length) {
    throw new UnexpectedResponseError({
      endpoint: args.endpoint,
      message:
        "When geo is an array, it must have length 1 or match the number of keywords.",
    });
  }

  return keywords.map((keyword, index) => ({
    keyword,
    geo: geo[index],
    time,
  }));
};

/**
 * Enriches the widget request object returned by the explore endpoint
 * with additional fields that the browser sends when querying the
 * `/trends/api/widgetdata/relatedsearches` endpoint.
 *
 * Missing fields like `userConfig`, `language`, and `userCountryCode`
 * can cause Google to return fewer results than the browser-based UI.
 */
export const enrichRelatedSearchRequest = (args: {
  widgetRequest: Record<string, unknown>;
  hl: string;
  geo?: string;
}): Record<string, unknown> => {
  const language = toLanguageCode(args.hl);

  const countryCode = resolveCountryCode(args.geo);

  const enriched: Record<string, unknown> = { ...args.widgetRequest };

  if (!enriched.userConfig) {
    enriched.userConfig = { userType: "USER_TYPE_LEGIT_USER" };
  }

  if (!enriched.language) {
    enriched.language = language;
  }

  if (!enriched.userCountryCode && countryCode) {
    enriched.userCountryCode = countryCode;
  }

  const requestOptions =
    (enriched.requestOptions as Record<string, unknown>) ?? {};
  if (!requestOptions.backend) {
    enriched.requestOptions = { ...requestOptions, backend: "IZG" };
  }

  return enriched;
};

/**
 * Extracts a two-letter country code from a geo string.
 * Supports formats like "US", "US-CA" (returns "US"), or "" (returns undefined).
 */
const resolveCountryCode = (
  geo: string | undefined
): string | undefined => {
  if (!geo || geo.trim().length === 0) {
    return undefined;
  }

  const upper = geo.trim().toUpperCase();
  return upper.length >= 2 ? upper.slice(0, 2) : undefined;
};

export const findDeepArrays = (value: unknown): unknown[][] => {
  const found: unknown[][] = [];

  const walk = (node: unknown): void => {
    if (!Array.isArray(node)) {
      return;
    }

    found.push(node);
    for (const child of node) {
      walk(child);
    }
  };

  walk(value);
  return found;
};

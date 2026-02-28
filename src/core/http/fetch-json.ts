import type {
  CookieStore,
  ProxyHook,
  RequestConfig,
  RetryConfig,
} from "../../client/public-types";
import type { RateLimiter } from "../resilience/rate-limiter";

import { TrendSearchError, RateLimitError, TransportError } from "../../errors";
import { runWithRetry } from "../resilience/retry";
import { getSetCookieHeaders } from "../session/cookies";
import { buildUrl } from "./build-url";
import { stripGooglePrefix } from "./strip-prefix";

export interface FetchRuntime {
  baseUrl: string;
  fetchFn: (input: string, init?: RequestInit) => Promise<Response>;
  timeoutMs: number;
  userAgent?: string;
  cookieStore?: CookieStore;
  proxyHook?: ProxyHook;
  retryConfig: Required<RetryConfig>;
  rateLimiter: RateLimiter;
}

const toRetryDecision = (error: unknown) => {
  if (error instanceof RateLimitError) {
    return { retryable: true, reason: "rate-limit" };
  }

  if (error instanceof TransportError) {
    if (!error.status) {
      return { retryable: true, reason: "network" };
    }

    if (error.status >= 500) {
      return { retryable: true, reason: "server-error" };
    }

    return { retryable: false, reason: "client-error" };
  }

  return { retryable: true, reason: "unknown" };
};

const truncate = (text: string, maxLength = 400): string => {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength)}...`;
};

const readResponseText = async (response: Response): Promise<string> => {
  try {
    return await response.text();
  } catch {
    return "";
  }
};

const parseRetryAfterMs = (value: string | null): number | undefined => {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return undefined;
  }

  const seconds = Number(trimmed);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.round(seconds * 1000);
  }

  const dateMs = Date.parse(trimmed);
  if (!Number.isNaN(dateMs)) {
    return Math.max(0, dateMs - Date.now());
  }

  return undefined;
};

const buildRequest = async (args: {
  runtime: FetchRuntime;
  request: RequestConfig;
}): Promise<{ url: string; init: RequestInit }> => {
  const url = buildUrl({
    baseUrl: args.runtime.baseUrl,
    path: args.request.path,
    query: args.request.query,
  });

  const headers = new Headers(args.request.headers);

  if (args.runtime.userAgent && !headers.has("user-agent")) {
    headers.set("user-agent", args.runtime.userAgent);
  }

  if (!headers.has("accept-language")) {
    const language = args.request.query?.hl;
    if (typeof language === "string" && language.trim().length > 0) {
      headers.set("accept-language", language);
    }
  }

  if (args.runtime.cookieStore) {
    const cookieHeader = await args.runtime.cookieStore.getCookieHeader(url);
    if (cookieHeader && !headers.has("cookie")) {
      headers.set("cookie", cookieHeader);
    }
  }

  const init: RequestInit = {
    method: args.request.method ?? "GET",
    headers,
    body: args.request.body,
  };

  if (!args.runtime.proxyHook) {
    return { url, init };
  }

  const proxied = await args.runtime.proxyHook({ url, init });
  return {
    url: proxied.url ?? url,
    init: proxied.init ?? init,
  };
};

const requestOnce = async (args: {
  runtime: FetchRuntime;
  request: RequestConfig;
}): Promise<string> => {
  const { url, init } = await buildRequest(args);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), args.runtime.timeoutMs);

  try {
    const response = await args.runtime.fetchFn(url, {
      ...init,
      signal: controller.signal,
    });

    if (args.runtime.cookieStore) {
      const setCookies = getSetCookieHeaders(response.headers);
      if (setCookies.length > 0) {
        await args.runtime.cookieStore.setCookieHeaders(url, setCookies);
      }
    }

    const text = await readResponseText(response);
    if (!response.ok) {
      if (response.status === 429) {
        const retryAfterMs = parseRetryAfterMs(
          response.headers.get("retry-after")
        );

        const retryHint =
          typeof retryAfterMs === "number"
            ? ` Upstream asked to retry after ~${Math.ceil(retryAfterMs / 1000)}s.`
            : "";

        throw new RateLimitError({
          message: `Rate limited on ${args.request.endpoint} (HTTP 429). Increase delay/backoff and reduce request concurrency.${retryHint}`,
          status: response.status,
          url,
          retryAfterMs,
        });
      }

      const detail =
        response.status === 401
          ? " Upstream rejected the request; refresh session cookies and verify request shape."
          : "";

      throw new TransportError({
        message: `HTTP ${response.status} while calling ${args.request.endpoint}.${detail}`,
        url,
        status: response.status,
        responseBody: truncate(text),
      });
    }

    return text;
  } catch (error) {
    if (error instanceof TrendSearchError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : String(error);
    throw new TransportError({
      message: `Network error while calling ${args.request.endpoint}: ${message}`,
      url,
    });
  } finally {
    clearTimeout(timeout);
  }
};

export const fetchText = async (args: {
  runtime: FetchRuntime;
  request: RequestConfig;
}): Promise<string> =>
  args.runtime.rateLimiter.schedule(() =>
    runWithRetry({
      task: () => requestOnce(args),
      policy: args.runtime.retryConfig,
      shouldRetry: toRetryDecision,
    })
  );

export const fetchGoogleJson = async (args: {
  runtime: FetchRuntime;
  request: RequestConfig;
}): Promise<unknown> => {
  const text = await fetchText(args);
  const payload = args.request.stripGooglePrefix
    ? stripGooglePrefix(text)
    : text;

  try {
    return JSON.parse(payload);
  } catch {
    throw new TransportError({
      message: `Invalid JSON received from ${args.request.endpoint}.`,
      url: buildUrl({
        baseUrl: args.runtime.baseUrl,
        path: args.request.path,
        query: args.request.query,
      }),
      responseBody: truncate(payload),
    });
  }
};

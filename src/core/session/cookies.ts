import type { CookieStore } from "../../client/public-types";

const splitSetCookieHeader = (setCookie: string): string[] => {
  if (!setCookie) {
    return [];
  }

  const parts: string[] = [];
  let chunk = "";
  let inExpires = false;

  for (let index = 0; index < setCookie.length; index += 1) {
    const char = setCookie[index];
    const next = setCookie.slice(index, index + 8).toLowerCase();

    if (next === "expires=") {
      inExpires = true;
    }

    if (char === "," && !inExpires) {
      parts.push(chunk.trim());
      chunk = "";
      continue;
    }

    if (inExpires && char === ";") {
      inExpires = false;
    }

    chunk += char;
  }

  if (chunk.trim()) {
    parts.push(chunk.trim());
  }

  return parts;
};

export const getSetCookieHeaders = (headers: Headers): string[] => {
  const maybeGetSetCookie = (
    headers as Headers & { getSetCookie?: () => string[] }
  ).getSetCookie;

  if (typeof maybeGetSetCookie === "function") {
    return maybeGetSetCookie.call(headers).filter(Boolean);
  }

  const rawSetCookie = headers.get("set-cookie");
  if (!rawSetCookie) {
    return [];
  }

  return splitSetCookieHeader(rawSetCookie).filter(Boolean);
};

export class MemoryCookieStore implements CookieStore {
  private readonly cookiesByOrigin = new Map<string, string>();

  async getCookieHeader(url: string): Promise<string | undefined> {
    const { origin } = new URL(url);
    return this.cookiesByOrigin.get(origin);
  }

  async setCookieHeaders(
    url: string,
    setCookieHeaders: string[]
  ): Promise<void> {
    const { origin } = new URL(url);
    const existing =
      this.cookiesByOrigin
        .get(origin)
        ?.split(";")
        .map((chunk) => chunk.trim())
        .filter(Boolean) ?? [];

    const merged = new Map<string, string>();

    for (const cookie of existing) {
      const [name, ...rest] = cookie.split("=");
      if (!name) {
        continue;
      }
      merged.set(name.trim(), `${name.trim()}=${rest.join("=").trim()}`);
    }

    for (const cookieHeader of setCookieHeaders) {
      const cookieChunk = cookieHeader.split(";")[0]?.trim();
      if (!cookieChunk) {
        continue;
      }
      const [name, ...rest] = cookieChunk.split("=");
      if (!name) {
        continue;
      }
      merged.set(name.trim(), `${name.trim()}=${rest.join("=").trim()}`);
    }

    const header = [...merged.values()].join("; ");
    if (header) {
      this.cookiesByOrigin.set(origin, header);
    }
  }
}

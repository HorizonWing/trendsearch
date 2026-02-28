import { join, resolve } from "node:path";

import type { EndpointContext } from "../src/endpoints/shared";

const root = resolve(import.meta.dir);

export const fixtureText = async (...parts: string[]): Promise<string> => {
  const filepath = join(root, "fixtures", "raw", ...parts);
  return Bun.file(filepath).text();
};

export const fixtureJson = async <T = unknown>(
  ...parts: string[]
): Promise<T> => {
  const text = await fixtureText(...parts);
  return JSON.parse(text) as T;
};

export const createMockContext = (args: {
  jsonByEndpoint?: Record<string, unknown>;
  textByEndpoint?: Record<string, string>;
  defaultHl?: string;
  defaultTz?: number;
}): EndpointContext => {
  const jsonByEndpoint = args.jsonByEndpoint ?? {};
  const textByEndpoint = args.textByEndpoint ?? {};

  return {
    defaultHl: args.defaultHl ?? "en-US",
    defaultTz: args.defaultTz ?? 240,
    async requestJson(input) {
      if (!(input.endpoint in jsonByEndpoint)) {
        throw new Error(
          `Missing mock JSON fixture for endpoint: ${input.endpoint}`
        );
      }
      return jsonByEndpoint[input.endpoint];
    },
    async requestText(input) {
      if (!(input.endpoint in textByEndpoint)) {
        throw new Error(
          `Missing mock text fixture for endpoint: ${input.endpoint}`
        );
      }
      return textByEndpoint[input.endpoint] ?? "";
    },
  };
};

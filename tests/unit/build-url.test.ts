import { describe, expect, it } from "bun:test";

import { buildUrl } from "../../src/core/http/build-url";

describe("buildUrl", () => {
  it("builds URL with encoded query params", () => {
    const url = buildUrl({
      baseUrl: "https://trends.google.com",
      path: "/trends/api/explore",
      query: {
        req: '{"keyword":"typescript"}',
        hl: "en-US",
      },
    });

    expect(url).toContain("https://trends.google.com/trends/api/explore?");
    expect(url).toContain("hl=en-US");
    expect(url).toContain("req=%7B%22keyword%22%3A%22typescript%22%7D");
  });
});

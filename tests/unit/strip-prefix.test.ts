import { describe, expect, it } from "bun:test";

import { stripGooglePrefix } from "../../src/core/http/strip-prefix";

describe("stripGooglePrefix", () => {
  it("removes google json prefix", () => {
    const value = stripGooglePrefix(')]}\'\n{"ok":true}');
    expect(value).toBe('{"ok":true}');
  });

  it("returns trimmed string when prefix is absent", () => {
    const value = stripGooglePrefix('  {"ok":true}  ');
    expect(value).toBe('{"ok":true}');
  });
});

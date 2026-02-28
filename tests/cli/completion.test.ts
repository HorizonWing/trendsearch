import { describe, expect, it } from "bun:test";

import {
  completeWords,
  renderCompletionScript,
} from "../../src/cli/completion";

describe("cli completion", () => {
  it("returns top-level command suggestions", () => {
    const suggestions = completeWords({
      words: [],
      hasTrailingSpace: true,
    });

    expect(suggestions).toContain("autocomplete");
    expect(suggestions).toContain("config");
    expect(suggestions).toContain("experimental");
  });

  it("returns nested experimental subcommands", () => {
    const suggestions = completeWords({
      words: ["experimental"],
      hasTrailingSpace: true,
    });

    expect(suggestions).toContain("trending-now");
    expect(suggestions).toContain("trending-articles");
    expect(suggestions).toContain("geo-picker");
    expect(suggestions).toContain("category-picker");
    expect(suggestions).toContain("top-charts");
    expect(suggestions).toContain("interest-over-time-multirange");
    expect(suggestions).toContain("interest-over-time-csv");
    expect(suggestions).toContain("interest-over-time-multirange-csv");
    expect(suggestions).toContain("interest-by-region-csv");
    expect(suggestions).toContain("related-queries-csv");
    expect(suggestions).toContain("related-topics-csv");
    expect(suggestions).toContain("hot-trends-legacy");
  });

  it("returns flag suggestions for a resolved command", () => {
    const suggestions = completeWords({
      words: ["autocomplete", "--o"],
      hasTrailingSpace: false,
    });

    expect(suggestions).toContain("--output");
  });

  it("renders completion scripts for bash/zsh/fish", () => {
    const bash = renderCompletionScript("bash", "trendsearch");
    const zsh = renderCompletionScript("zsh", "trendsearch");
    const fish = renderCompletionScript("fish", "trendsearch");

    expect(bash).toContain("trendsearch __complete");
    expect(zsh).toContain("trendsearch __complete");
    expect(fish).toContain("trendsearch __complete");
  });

  it("returns undefined for unsupported shell", () => {
    expect(renderCompletionScript("powershell", "trendsearch")).toBeUndefined();
  });
});

import { describe, expect, it } from "bun:test";

import { autocompleteEndpoint } from "../../src/endpoints/autocomplete";
import { dailyTrendsEndpoint } from "../../src/endpoints/daily-trends";
import { trendingArticlesEndpoint } from "../../src/endpoints/experimental/trending-articles";
import { trendingNowEndpoint } from "../../src/endpoints/experimental/trending-now";
import { exploreEndpoint } from "../../src/endpoints/explore";
import { interestByRegionEndpoint } from "../../src/endpoints/interest-by-region";
import { interestOverTimeEndpoint } from "../../src/endpoints/interest-over-time";
import { realTimeTrendsEndpoint } from "../../src/endpoints/real-time-trends";
import { relatedQueriesEndpoint } from "../../src/endpoints/related-queries";
import { relatedTopicsEndpoint } from "../../src/endpoints/related-topics";
import {
  SchemaValidationError,
  UnexpectedResponseError,
} from "../../src/errors";
import { createMockContext, fixtureJson, fixtureText } from "../helpers";

describe("stable endpoint contracts", () => {
  it("parses autocomplete payload", async () => {
    const ctx = createMockContext({
      jsonByEndpoint: {
        autocomplete: await fixtureJson("autocomplete", "ok.json"),
      },
    });

    const result = await autocompleteEndpoint(ctx, { keyword: "typescript" });
    expect(result.data.topics.length).toBeGreaterThan(0);
    expect(result.data.topics[0]?.title).toBe("TypeScript");
  });

  it("parses explore widgets", async () => {
    const ctx = createMockContext({
      jsonByEndpoint: {
        explore: await fixtureJson("explore", "ok.json"),
      },
    });

    const result = await exploreEndpoint(ctx, {
      keywords: ["typescript"],
      geo: "US",
    });

    expect(result.data.widgets.length).toBeGreaterThanOrEqual(4);
  });

  it("parses interest over time", async () => {
    const ctx = createMockContext({
      jsonByEndpoint: {
        explore: await fixtureJson("explore", "ok.json"),
        interestOverTime: await fixtureJson("interest-over-time", "ok.json"),
      },
    });

    const result = await interestOverTimeEndpoint(ctx, {
      keywords: ["typescript"],
      geo: "US",
    });

    expect(result.data.timeline.length).toBe(2);
  });

  it("parses interest by region", async () => {
    const ctx = createMockContext({
      jsonByEndpoint: {
        explore: await fixtureJson("explore", "ok.json"),
        interestByRegion: await fixtureJson("interest-by-region", "ok.json"),
      },
    });

    const result = await interestByRegionEndpoint(ctx, {
      keywords: ["typescript"],
      geo: "US",
      resolution: "REGION",
    });

    expect(result.data.regions.length).toBeGreaterThan(0);
  });

  it("parses related queries", async () => {
    const ctx = createMockContext({
      jsonByEndpoint: {
        explore: await fixtureJson("explore", "ok.json"),
        relatedQueries: await fixtureJson("related-queries", "ok.json"),
      },
    });

    const result = await relatedQueriesEndpoint(ctx, {
      keywords: ["typescript"],
      geo: "US",
    });

    expect(result.data.top.length).toBeGreaterThan(0);
    expect(result.data.rising.length).toBeGreaterThan(0);
  });

  it("parses related topics", async () => {
    const ctx = createMockContext({
      jsonByEndpoint: {
        explore: await fixtureJson("explore", "ok.json"),
        relatedTopics: await fixtureJson("related-topics", "ok.json"),
      },
    });

    const result = await relatedTopicsEndpoint(ctx, {
      keywords: ["typescript"],
      geo: "US",
    });

    expect(result.data.top.length).toBeGreaterThan(0);
    expect(result.data.rising.length).toBeGreaterThan(0);
  });

  it("accepts related topic values that are strings", async () => {
    const ctx = createMockContext({
      jsonByEndpoint: {
        explore: await fixtureJson("explore", "ok.json"),
        relatedTopics: await fixtureJson("related-topics", "string-value.json"),
      },
    });

    const result = await relatedTopicsEndpoint(ctx, {
      keywords: ["typescript"],
      geo: "US",
    });

    expect(typeof result.data.rising[0]?.value).toBe("string");
  });

  it("accepts empty related query lists", async () => {
    const ctx = createMockContext({
      jsonByEndpoint: {
        explore: await fixtureJson("explore", "ok.json"),
        relatedQueries: {
          default: {
            rankedList: [],
          },
        },
      },
    });

    const result = await relatedQueriesEndpoint(ctx, {
      keywords: ["typescript"],
      geo: "US",
    });

    expect(result.data.top).toEqual([]);
    expect(result.data.rising).toEqual([]);
  });

  it("accepts empty related topic lists", async () => {
    const ctx = createMockContext({
      jsonByEndpoint: {
        explore: await fixtureJson("explore", "ok.json"),
        relatedTopics: {
          default: {
            rankedList: [],
          },
        },
      },
    });

    const result = await relatedTopicsEndpoint(ctx, {
      keywords: ["typescript"],
      geo: "US",
    });

    expect(result.data.top).toEqual([]);
    expect(result.data.rising).toEqual([]);
  });

  it("parses daily trends", async () => {
    const ctx = createMockContext({
      jsonByEndpoint: {
        dailyTrends: await fixtureJson("daily-trends", "ok.json"),
      },
    });

    const result = await dailyTrendsEndpoint(ctx, {
      geo: "US",
    });

    expect(result.data.days.length).toBe(1);
    expect(result.data.trends.length).toBe(1);
  });

  it("parses real time trends", async () => {
    const ctx = createMockContext({
      jsonByEndpoint: {
        realTimeTrends: await fixtureJson("real-time-trends", "ok.json"),
      },
    });

    const result = await realTimeTrendsEndpoint(ctx, {
      geo: "US",
    });

    expect(result.data.stories.length).toBe(1);
  });

  it("parses stable trendingNow rpc payload", async () => {
    const ctx = createMockContext({
      textByEndpoint: {
        trendingNow: await fixtureText("trending-now", "ok.txt"),
      },
    });

    const result = await trendingNowEndpoint(ctx, {
      geo: "US",
      language: "en",
      hours: 24,
    });

    expect(result.data.items.length).toBeGreaterThan(0);
  });

  it("parses stable trendingArticles rpc payload", async () => {
    const ctx = createMockContext({
      textByEndpoint: {
        trendingArticles: await fixtureText("trending-articles", "ok.txt"),
      },
    });

    const result = await trendingArticlesEndpoint(ctx, {
      articleKeys: [[1, "en", "US"]],
      articleCount: 2,
    });

    expect(result.data.articles.length).toBe(2);
  });

  it("throws when expected widget is missing", async () => {
    const ctx = createMockContext({
      jsonByEndpoint: {
        explore: { widgets: [] },
      },
    });

    expect(
      interestOverTimeEndpoint(ctx, {
        keywords: ["typescript"],
      })
    ).rejects.toBeInstanceOf(UnexpectedResponseError);
  });

  it("throws schema validation error for invalid response shape", async () => {
    const ctx = createMockContext({
      jsonByEndpoint: {
        autocomplete: {},
      },
    });

    expect(
      autocompleteEndpoint(ctx, { keyword: "typescript" })
    ).rejects.toBeInstanceOf(SchemaValidationError);
  });
});

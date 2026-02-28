import { describe, expect, it } from "bun:test";

import { categoryPickerEndpoint } from "../../src/endpoints/experimental/category-picker";
import {
  interestByRegionCsvEndpoint,
  interestOverTimeCsvEndpoint,
  interestOverTimeMultirangeCsvEndpoint,
  relatedQueriesCsvEndpoint,
  relatedTopicsCsvEndpoint,
} from "../../src/endpoints/experimental/csv";
import { geoPickerEndpoint } from "../../src/endpoints/experimental/geo-picker";
import { hotTrendsLegacyEndpoint } from "../../src/endpoints/experimental/hot-trends-legacy";
import { interestOverTimeMultirangeEndpoint } from "../../src/endpoints/experimental/interest-over-time-multirange";
import { topChartsEndpoint } from "../../src/endpoints/experimental/top-charts";
import { experimentalTrendingArticlesEndpoint } from "../../src/endpoints/experimental/trending-articles";
import { experimentalTrendingNowEndpoint } from "../../src/endpoints/experimental/trending-now";
import { SchemaValidationError } from "../../src/errors";
import { createMockContext, fixtureJson, fixtureText } from "../helpers";

describe("experimental endpoint contracts", () => {
  it("parses trendingNow rpc payload", async () => {
    const ctx = createMockContext({
      textByEndpoint: {
        "experimental.trendingNow": await fixtureText("trending-now", "ok.txt"),
      },
    });

    const result = await experimentalTrendingNowEndpoint(ctx, {
      geo: "US",
      language: "en",
      hours: 24,
    });

    expect(result.data.items.length).toBeGreaterThan(0);
    expect(result.data.items[0]?.keyword).toBe("typescript");
  });

  it("parses trendingArticles rpc payload", async () => {
    const ctx = createMockContext({
      textByEndpoint: {
        "experimental.trendingArticles": await fixtureText(
          "trending-articles",
          "ok.txt"
        ),
      },
    });

    const result = await experimentalTrendingArticlesEndpoint(ctx, {
      articleKeys: [[1, "en", "US"]],
      articleCount: 2,
    });

    expect(result.data.articles.length).toBe(2);
  });

  it("parses geo picker data", async () => {
    const ctx = createMockContext({
      jsonByEndpoint: {
        "experimental.geoPicker": await fixtureJson("geo-picker", "ok.json"),
      },
    });

    const result = await geoPickerEndpoint(ctx);
    expect(result.data.items.children?.length).toBeGreaterThan(0);
  });

  it("parses category picker data", async () => {
    const ctx = createMockContext({
      jsonByEndpoint: {
        "experimental.categoryPicker": await fixtureJson(
          "category-picker",
          "ok.json"
        ),
      },
    });

    const result = await categoryPickerEndpoint(ctx);
    expect(result.data.items.children?.length).toBeGreaterThan(0);
  });

  it("throws schema validation error for malformed trendingNow payload", async () => {
    const malformedText =
      ')]}\'\n[["wrb.fr","i0OFE","[[\\"kw\\",null,null,[1700000000],null,null,\\"oops\\",null,1,[],null,[]]]"]]';

    const ctx = createMockContext({
      textByEndpoint: {
        "experimental.trendingNow": malformedText,
      },
    });

    await expect(
      experimentalTrendingNowEndpoint(ctx, {
        geo: "US",
        language: "en",
        hours: 24,
      })
    ).rejects.toBeInstanceOf(SchemaValidationError);
  });

  it("throws schema validation error for malformed trendingArticles payload", async () => {
    const malformedText =
      ')]}\'\n[["wrb.fr","w4opAf","[[\\"headline\\",\\"https://example.com\\",123]]"]]';

    const ctx = createMockContext({
      textByEndpoint: {
        "experimental.trendingArticles": malformedText,
      },
    });

    await expect(
      experimentalTrendingArticlesEndpoint(ctx, {
        articleKeys: [[1, "en", "US"]],
        articleCount: 1,
      })
    ).rejects.toBeInstanceOf(SchemaValidationError);
  });

  it("parses top charts data", async () => {
    const ctx = createMockContext({
      jsonByEndpoint: {
        "experimental.topCharts": await fixtureJson("top-charts", "ok.json"),
      },
    });

    const result = await topChartsEndpoint(ctx, {
      date: 2024,
      geo: "GLOBAL",
    });

    expect(result.data.charts.length).toBeGreaterThan(0);
    expect(result.data.items.length).toBeGreaterThan(0);
  });

  it("parses interest over time multirange data", async () => {
    const ctx = createMockContext({
      jsonByEndpoint: {
        explore: await fixtureJson("explore", "ok.json"),
        "experimental.interestOverTimeMultirange": await fixtureJson(
          "interest-over-time-multirange",
          "ok.json"
        ),
      },
    });

    const result = await interestOverTimeMultirangeEndpoint(ctx, {
      keywords: ["typescript"],
      geo: "US",
    });

    expect(result.data.timeline.length).toBeGreaterThan(0);
  });

  it("parses CSV endpoint variants", async () => {
    const ctx = createMockContext({
      jsonByEndpoint: {
        explore: await fixtureJson("explore", "ok.json"),
      },
      textByEndpoint: {
        "experimental.interestOverTimeCsv": await fixtureText(
          "csv",
          "interest-over-time.csv"
        ),
        "experimental.interestOverTimeMultirangeCsv": await fixtureText(
          "csv",
          "interest-over-time-multirange.csv"
        ),
        "experimental.interestByRegionCsv": await fixtureText(
          "csv",
          "interest-by-region.csv"
        ),
        "experimental.relatedQueriesCsv": await fixtureText(
          "csv",
          "related-queries.csv"
        ),
        "experimental.relatedTopicsCsv": await fixtureText(
          "csv",
          "related-topics.csv"
        ),
      },
    });

    const interestCsv = await interestOverTimeCsvEndpoint(ctx, {
      keywords: ["typescript"],
      geo: "US",
    });
    expect(interestCsv.data.csv.length).toBeGreaterThan(0);

    const multirangeCsv = await interestOverTimeMultirangeCsvEndpoint(ctx, {
      keywords: ["typescript"],
      geo: "US",
    });
    expect(multirangeCsv.data.csv.length).toBeGreaterThan(0);

    const byRegionCsv = await interestByRegionCsvEndpoint(ctx, {
      keywords: ["typescript"],
      geo: "US",
      resolution: "REGION",
    });
    expect(byRegionCsv.data.csv.length).toBeGreaterThan(0);

    const relatedQueriesCsv = await relatedQueriesCsvEndpoint(ctx, {
      keywords: ["typescript"],
      geo: "US",
    });
    expect(relatedQueriesCsv.data.csv.length).toBeGreaterThan(0);

    const relatedTopicsCsv = await relatedTopicsCsvEndpoint(ctx, {
      keywords: ["typescript"],
      geo: "US",
    });
    expect(relatedTopicsCsv.data.csv.length).toBeGreaterThan(0);
  });

  it("parses legacy hot trends payload", async () => {
    const ctx = createMockContext({
      jsonByEndpoint: {
        "experimental.hotTrendsLegacy": await fixtureJson(
          "hot-trends-legacy",
          "ok.json"
        ),
      },
    });

    const result = await hotTrendsLegacyEndpoint(ctx);
    expect(result.data.payload).toBeDefined();
  });
});

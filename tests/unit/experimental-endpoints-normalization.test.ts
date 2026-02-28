import { describe, expect, it } from "bun:test";

import { hotTrendsLegacyEndpoint } from "../../src/endpoints/experimental/hot-trends-legacy";
import { interestOverTimeMultirangeEndpoint } from "../../src/endpoints/experimental/interest-over-time-multirange";
import { topChartsEndpoint } from "../../src/endpoints/experimental/top-charts";
import { createMockContext, fixtureJson } from "../helpers";

describe("experimental endpoint normalization", () => {
  it("flattens top chart list items", async () => {
    const ctx = createMockContext({
      jsonByEndpoint: {
        "experimental.topCharts": await fixtureJson("top-charts", "ok.json"),
      },
    });

    const result = await topChartsEndpoint(ctx, { date: 2024, geo: "GLOBAL" });
    expect(result.data.charts.length).toBe(1);
    expect(result.data.items.length).toBe(2);
  });

  it("returns multirange timeline rows", async () => {
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
    expect(result.data.timeline.length).toBe(1);
    expect(result.data.timeline[0]?.columnData?.length).toBe(2);
  });

  it("returns hot trends legacy payload as-is", async () => {
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

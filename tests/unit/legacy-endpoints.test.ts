import { describe, expect, it } from "bun:test";

import type { EndpointContext } from "../../src/endpoints/shared";

import { dailyTrendsEndpoint } from "../../src/endpoints/daily-trends";
import { realTimeTrendsEndpoint } from "../../src/endpoints/real-time-trends";
import { EndpointUnavailableError, TransportError } from "../../src/errors";

const createFailingContext = (status: number): EndpointContext => ({
  defaultHl: "en-US",
  defaultTz: 0,
  async requestJson(input) {
    throw new TransportError({
      message: "Mocked transport failure",
      status,
      url: `https://trends.google.com${input.path}`,
    });
  },
  async requestText() {
    return "";
  },
});

describe("legacy endpoint unavailable mapping", () => {
  it("maps dailyTrends 404 to EndpointUnavailableError", async () => {
    const ctx = createFailingContext(404);

    await expect(
      dailyTrendsEndpoint(ctx, {
        geo: "US",
      })
    ).rejects.toBeInstanceOf(EndpointUnavailableError);
  });

  it("maps realTimeTrends 410 to EndpointUnavailableError", async () => {
    const ctx = createFailingContext(410);

    await expect(
      realTimeTrendsEndpoint(ctx, {
        geo: "US",
      })
    ).rejects.toBeInstanceOf(EndpointUnavailableError);
  });
});

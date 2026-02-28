import { describe, expect, it } from "bun:test";

import {
  extractBatchexecutePayload,
  parseBatchexecute,
} from "../../src/parsers/parse-batchexecute";
import { fixtureText } from "../helpers";

describe("parseBatchexecute", () => {
  it("parses rpc frames", async () => {
    const text = await fixtureText("trending-now", "ok.txt");
    const frames = parseBatchexecute(text);

    expect(frames.length).toBeGreaterThan(0);
    expect(frames[0]?.rpcId).toBe("i0OFE");
  });

  it("extracts payload by rpc id", async () => {
    const text = await fixtureText("trending-articles", "ok.txt");
    const payload = extractBatchexecutePayload({
      endpoint: "test",
      responseText: text,
      rpcId: "w4opAf",
    });

    expect(payload).toBeArray();
  });
});

import { describe, expect, it } from "bun:test";

import { UnexpectedResponseError } from "../../src/errors";
import { selectWidget } from "../../src/parsers/select-widget";

describe("selectWidget", () => {
  it("returns matching widget by id", () => {
    const widget = selectWidget({
      endpoint: "test",
      id: "TIMESERIES",
      widgets: [
        {
          id: "TIMESERIES",
          token: "abc",
          request: {},
        },
      ],
    });

    expect(widget.id).toBe("TIMESERIES");
  });

  it("throws when widget is missing", () => {
    expect(() =>
      selectWidget({
        endpoint: "test",
        id: "TIMESERIES",
        widgets: [],
      })
    ).toThrow(UnexpectedResponseError);
  });
});

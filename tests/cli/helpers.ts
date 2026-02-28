import type { CliConfigStore } from "../../src/cli/config";
import type { CliIo, WritableLike } from "../../src/cli/output";
import type { TrendSearchClient } from "../../src/client/public-types";

export interface MemoryWritable extends WritableLike {
  read: () => string;
  clear: () => void;
}

export const createMemoryWritable = (isTTY = false): MemoryWritable => {
  let buffer = "";

  return {
    isTTY,
    write(chunk: string) {
      buffer += chunk;
      return true;
    },
    read() {
      return buffer;
    },
    clear() {
      buffer = "";
    },
  };
};

export const createMemoryIo = (args?: {
  stdoutIsTTY?: boolean;
  stderrIsTTY?: boolean;
}): {
  io: CliIo;
  stdout: MemoryWritable;
  stderr: MemoryWritable;
} => {
  const stdout = createMemoryWritable(args?.stdoutIsTTY ?? false);
  const stderr = createMemoryWritable(args?.stderrIsTTY ?? false);

  return {
    io: {
      stdout,
      stderr,
    },
    stdout,
    stderr,
  };
};

export const createMemoryStore = (
  initial: Record<string, unknown> = {}
): CliConfigStore => {
  const store = new Map<string, unknown>(Object.entries(initial));

  return {
    all: () => Object.fromEntries(store.entries()),
    get: (key) => store.get(key),
    set: (key, value) => {
      store.set(key, value);
    },
    delete: (key) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };
};

export const createMockClient = (args: {
  onCall: (name: string, input: unknown) => Promise<unknown>;
}): TrendSearchClient => {
  const call =
    (name: string) =>
    async (input: unknown): Promise<unknown> =>
      args.onCall(name, input);

  return {
    autocomplete: call("autocomplete") as TrendSearchClient["autocomplete"],
    explore: call("explore") as TrendSearchClient["explore"],
    interestOverTime: call(
      "interestOverTime"
    ) as TrendSearchClient["interestOverTime"],
    interestByRegion: call(
      "interestByRegion"
    ) as TrendSearchClient["interestByRegion"],
    relatedQueries: call(
      "relatedQueries"
    ) as TrendSearchClient["relatedQueries"],
    relatedTopics: call("relatedTopics") as TrendSearchClient["relatedTopics"],
    dailyTrends: call("dailyTrends") as TrendSearchClient["dailyTrends"],
    realTimeTrends: call(
      "realTimeTrends"
    ) as TrendSearchClient["realTimeTrends"],
    trendingNow: call("trendingNow") as TrendSearchClient["trendingNow"],
    trendingArticles: call(
      "trendingArticles"
    ) as TrendSearchClient["trendingArticles"],
    experimental: {
      trendingNow: call(
        "experimental.trendingNow"
      ) as TrendSearchClient["experimental"]["trendingNow"],
      trendingArticles: call(
        "experimental.trendingArticles"
      ) as TrendSearchClient["experimental"]["trendingArticles"],
      geoPicker: call(
        "experimental.geoPicker"
      ) as TrendSearchClient["experimental"]["geoPicker"],
      categoryPicker: call(
        "experimental.categoryPicker"
      ) as TrendSearchClient["experimental"]["categoryPicker"],
      topCharts: call(
        "experimental.topCharts"
      ) as TrendSearchClient["experimental"]["topCharts"],
      interestOverTimeMultirange: call(
        "experimental.interestOverTimeMultirange"
      ) as TrendSearchClient["experimental"]["interestOverTimeMultirange"],
      interestOverTimeCsv: call(
        "experimental.interestOverTimeCsv"
      ) as TrendSearchClient["experimental"]["interestOverTimeCsv"],
      interestOverTimeMultirangeCsv: call(
        "experimental.interestOverTimeMultirangeCsv"
      ) as TrendSearchClient["experimental"]["interestOverTimeMultirangeCsv"],
      interestByRegionCsv: call(
        "experimental.interestByRegionCsv"
      ) as TrendSearchClient["experimental"]["interestByRegionCsv"],
      relatedQueriesCsv: call(
        "experimental.relatedQueriesCsv"
      ) as TrendSearchClient["experimental"]["relatedQueriesCsv"],
      relatedTopicsCsv: call(
        "experimental.relatedTopicsCsv"
      ) as TrendSearchClient["experimental"]["relatedTopicsCsv"],
      hotTrendsLegacy: call(
        "experimental.hotTrendsLegacy"
      ) as TrendSearchClient["experimental"]["hotTrendsLegacy"],
    },
  };
};

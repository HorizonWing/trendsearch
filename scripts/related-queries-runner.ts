import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import {
  MemoryCookieStore,
  RateLimitError,
  createClient,
  type RelatedQueryItem,
} from "../src";

interface RunnerOptions {
  keywords: string[];
  geo: string;
  time: string;
  hl?: string;
  tz?: number;
  outputPath?: string;
  cachePath: string;
  cacheTtlMs: number;
  useCache: boolean;
  maxRetries: number;
  retryBaseDelayMs: number;
  retryMaxDelayMs: number;
  maxConcurrent: number;
  minDelayMs: number;
  adaptiveBaseCooldownMs: number;
  adaptiveMaxCooldownMs: number;
  keywordAttempts: number;
  keywordBackoffMs: number;
  keywordMaxWaitMs: number;
  userAgent: string;
}

interface CachedEntry {
  fetchedAtMs: number;
  data: {
    top: RelatedQueryItem[];
    rising: RelatedQueryItem[];
  };
}

type CacheStore = Record<string, CachedEntry>;

interface QueryPreview {
  query: string;
  value: number | string;
}

interface KeywordResult {
  keyword: string;
  status: "ok" | "cached" | "error";
  attempts: number;
  topCount?: number;
  risingCount?: number;
  topPreview?: QueryPreview[];
  risingPreview?: QueryPreview[];
  error?: string;
}

const defaultOptions: Omit<RunnerOptions, "keywords"> = {
  geo: "US",
  time: "now 7-d",
  outputPath: undefined,
  hl: undefined,
  tz: undefined,
  cachePath: resolve(process.cwd(), ".cache/related-queries-runner.json"),
  cacheTtlMs: 6 * 60 * 60 * 1000,
  useCache: false,
  maxRetries: 3,
  retryBaseDelayMs: 2500,
  retryMaxDelayMs: 45_000,
  maxConcurrent: 1,
  minDelayMs: 6000,
  adaptiveBaseCooldownMs: 15_000,
  adaptiveMaxCooldownMs: 600_000,
  keywordAttempts: 4,
  keywordBackoffMs: 15_000,
  keywordMaxWaitMs: 600_000,
  userAgent:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
};

const usage = `
Usage:
  bun ./scripts/related-queries-runner.ts [keywords...] [options]

Options:
  --keywords <list>                    Comma-separated keywords.
  --geo <geo>                          Geo code (default: US).
  --time <range>                       Time range (default: now 7-d).
  --hl <locale>                        Optional locale override (e.g. en-US).
  --tz <minutes>                       Optional timezone offset in minutes.
  --out <path>                         Output JSON file path.
  --cache-path <path>                  Cache file path.
  --cache-ttl-ms <ms>                  Cache TTL in milliseconds.
  --cache                              Enable cache reads/writes.
  --no-cache                           Disable cache reads/writes (default).
  --max-retries <n>                    Per-request retries in client.
  --retry-base-delay-ms <ms>           Client retry base delay.
  --retry-max-delay-ms <ms>            Client retry max delay.
  --max-concurrent <n>                 Max concurrent requests.
  --min-delay-ms <ms>                  Min delay between requests.
  --adaptive-base-cooldown-ms <ms>     Base cooldown for 429 without Retry-After.
  --adaptive-max-cooldown-ms <ms>      Max adaptive cooldown.
  --keyword-attempts <n>               Outer attempts per keyword.
  --keyword-backoff-ms <ms>            Outer rate-limit backoff base.
  --keyword-max-wait-ms <ms>           Outer max wait on rate-limit.
  --user-agent <ua>                    Custom User-Agent.
  --help                               Show this help.

Examples:
  bun ./scripts/related-queries-runner.ts typescript --geo US --time "now 7-d"
  bun ./scripts/related-queries-runner.ts --keywords "typescript,javascript" --out /tmp/rq.json
`;

const splitCsv = (value: string): string[] =>
  value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

const parseInteger = (name: string, value: string): number => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    throw new TypeError(`Invalid value for ${name}: ${value}`);
  }
  return parsed;
};

type OptionValueSetter = (options: RunnerOptions, value: string) => void;

const optionSetters: Record<string, OptionValueSetter> = {
  "--keywords": (options, value) => {
    options.keywords.push(...splitCsv(value));
  },
  "--geo": (options, value) => {
    options.geo = value;
  },
  "--time": (options, value) => {
    options.time = value;
  },
  "--hl": (options, value) => {
    options.hl = value;
  },
  "--tz": (options, value) => {
    options.tz = parseInteger("--tz", value);
  },
  "--out": (options, value) => {
    options.outputPath = resolve(process.cwd(), value);
  },
  "--cache-path": (options, value) => {
    options.cachePath = resolve(process.cwd(), value);
  },
  "--cache-ttl-ms": (options, value) => {
    options.cacheTtlMs = parseInteger("--cache-ttl-ms", value);
  },
  "--max-retries": (options, value) => {
    options.maxRetries = parseInteger("--max-retries", value);
  },
  "--retry-base-delay-ms": (options, value) => {
    options.retryBaseDelayMs = parseInteger("--retry-base-delay-ms", value);
  },
  "--retry-max-delay-ms": (options, value) => {
    options.retryMaxDelayMs = parseInteger("--retry-max-delay-ms", value);
  },
  "--max-concurrent": (options, value) => {
    options.maxConcurrent = parseInteger("--max-concurrent", value);
  },
  "--min-delay-ms": (options, value) => {
    options.minDelayMs = parseInteger("--min-delay-ms", value);
  },
  "--adaptive-base-cooldown-ms": (options, value) => {
    options.adaptiveBaseCooldownMs = parseInteger(
      "--adaptive-base-cooldown-ms",
      value
    );
  },
  "--adaptive-max-cooldown-ms": (options, value) => {
    options.adaptiveMaxCooldownMs = parseInteger(
      "--adaptive-max-cooldown-ms",
      value
    );
  },
  "--keyword-attempts": (options, value) => {
    options.keywordAttempts = parseInteger("--keyword-attempts", value);
  },
  "--keyword-backoff-ms": (options, value) => {
    options.keywordBackoffMs = parseInteger("--keyword-backoff-ms", value);
  },
  "--keyword-max-wait-ms": (options, value) => {
    options.keywordMaxWaitMs = parseInteger("--keyword-max-wait-ms", value);
  },
  "--user-agent": (options, value) => {
    options.userAgent = value;
  },
};

const parseArgs = (argv: string[]): RunnerOptions => {
  const options: RunnerOptions = {
    ...defaultOptions,
    keywords: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token) {
      continue;
    }

    if (token === "--help") {
      console.log(usage.trim());
      process.exit(0);
    }

    if (token === "--no-cache") {
      options.useCache = false;
      continue;
    }

    if (token === "--cache") {
      options.useCache = true;
      continue;
    }

    if (!token.startsWith("--")) {
      options.keywords.push(token.trim());
      continue;
    }

    const value = argv[index + 1];
    if (!value) {
      throw new Error(`Missing value for ${token}`);
    }

    index += 1;

    const setter = optionSetters[token];
    if (!setter) {
      throw new Error(`Unknown option: ${token}`);
    }
    setter(options, value);
  }

  options.keywords = [...new Set(options.keywords.flatMap(splitCsv))];

  if (options.keywords.length === 0) {
    throw new Error("At least one keyword is required.");
  }

  if (options.keywordAttempts < 1) {
    throw new Error("--keyword-attempts must be >= 1.");
  }

  return options;
};

const fileExists = async (path: string): Promise<boolean> => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

const loadCache = async (path: string): Promise<CacheStore> => {
  if (!(await fileExists(path))) {
    return {};
  }

  try {
    const raw = await readFile(path, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    return parsed as CacheStore;
  } catch {
    return {};
  }
};

const writeCache = async (path: string, cache: CacheStore): Promise<void> => {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(cache, null, 2)}\n`, "utf8");
};

const toPreview = (items: RelatedQueryItem[], limit = 5): QueryPreview[] =>
  items.slice(0, limit).map((item) => ({
    query: item.query,
    value: item.value,
  }));

const cacheKeyFor = (args: {
  keyword: string;
  geo: string;
  time: string;
  hl?: string;
  tz?: number;
}): string =>
  JSON.stringify({
    keyword: args.keyword,
    geo: args.geo,
    time: args.time,
    hl: args.hl,
    tz: args.tz,
  });

const stringifyError = (error: unknown): string => {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }
  return String(error);
};

const waitFromRateLimit = async (
  error: RateLimitError,
  attemptIndex: number,
  options: RunnerOptions
): Promise<void> => {
  const backoffMs = options.keywordBackoffMs * 2 ** attemptIndex;
  const retryAfterMs = error.retryAfterMs ?? 0;
  const waitMs = Math.min(
    options.keywordMaxWaitMs,
    Math.max(backoffMs, retryAfterMs)
  );
  const jitterMs = Math.floor(Math.random() * 1000);
  const totalWaitMs = waitMs + jitterMs;

  console.error(
    `[rate-limit] ${error.message} Waiting ${Math.ceil(totalWaitMs / 1000)}s before retrying.`
  );

  await Bun.sleep(totalWaitMs);
};

const main = async (): Promise<void> => {
  const options = parseArgs(Bun.argv.slice(2));
  const startedAt = Date.now();

  const cache = options.useCache ? await loadCache(options.cachePath) : {};
  let cacheDirty = false;

  const client = createClient({
    hl: options.hl,
    tz: options.tz,
    retries: {
      maxRetries: options.maxRetries,
      baseDelayMs: options.retryBaseDelayMs,
      maxDelayMs: options.retryMaxDelayMs,
    },
    rateLimit: {
      maxConcurrent: options.maxConcurrent,
      minDelayMs: options.minDelayMs,
    },
    adaptiveRateLimit: {
      baseCooldownMs: options.adaptiveBaseCooldownMs,
      maxCooldownMs: options.adaptiveMaxCooldownMs,
    },
    userAgent: options.userAgent,
    cookieStore: new MemoryCookieStore(),
  });

  const results: KeywordResult[] = [];

  for (const keyword of options.keywords) {
    const cacheKey = cacheKeyFor({
      keyword,
      geo: options.geo,
      time: options.time,
      hl: options.hl,
      tz: options.tz,
    });

    const cached = cache[cacheKey];
    if (
      options.useCache &&
      cached &&
      Date.now() - cached.fetchedAtMs <= options.cacheTtlMs
    ) {
      results.push({
        keyword,
        status: "cached",
        attempts: 0,
        topCount: cached.data.top.length,
        risingCount: cached.data.rising.length,
        topPreview: toPreview(cached.data.top),
        risingPreview: toPreview(cached.data.rising),
      });
      continue;
    }

    let resolved = false;
    for (let attempt = 0; attempt < options.keywordAttempts; attempt += 1) {
      try {
        const response = await client.relatedQueries({
          keywords: [keyword],
          geo: options.geo,
          time: options.time,
          hl: options.hl,
          tz: options.tz,
        });

        results.push({
          keyword,
          status: "ok",
          attempts: attempt + 1,
          topCount: response.data.top.length,
          risingCount: response.data.rising.length,
          topPreview: toPreview(response.data.top),
          risingPreview: toPreview(response.data.rising),
        });

        if (options.useCache) {
          cache[cacheKey] = {
            fetchedAtMs: Date.now(),
            data: {
              top: response.data.top,
              rising: response.data.rising,
            },
          };
          cacheDirty = true;
        }

        resolved = true;
        break;
      } catch (error) {
        if (
          error instanceof RateLimitError &&
          attempt < options.keywordAttempts - 1
        ) {
          await waitFromRateLimit(error, attempt, options);
          continue;
        }

        results.push({
          keyword,
          status: "error",
          attempts: attempt + 1,
          error: stringifyError(error),
        });
        resolved = true;
        break;
      }
    }

    if (!resolved) {
      results.push({
        keyword,
        status: "error",
        attempts: options.keywordAttempts,
        error: "Exhausted attempts without a terminal result.",
      });
    }
  }

  if (options.useCache && cacheDirty) {
    await writeCache(options.cachePath, cache);
  }

  const success = results.filter((item) => item.status !== "error").length;
  const failed = results.length - success;

  const payload = {
    meta: {
      generatedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      geo: options.geo,
      time: options.time,
      hl: options.hl,
      tz: options.tz,
      keywords: options.keywords,
      success,
      failed,
      usedCache: options.useCache,
      cachePath: options.useCache ? options.cachePath : undefined,
    },
    results,
  };

  const text = `${JSON.stringify(payload, null, 2)}\n`;
  if (options.outputPath) {
    await mkdir(dirname(options.outputPath), { recursive: true });
    await writeFile(options.outputPath, text, "utf8");
    console.error(`Saved output to ${options.outputPath}`);
  }

  process.stdout.write(text);

  if (failed > 0) {
    process.exitCode = 1;
  }
};

try {
  await main();
} catch (error) {
  console.error(stringifyError(error));
  console.error(usage.trim());
  process.exitCode = 1;
}

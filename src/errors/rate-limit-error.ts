import { TrendSearchError } from "./trendsearch-error";

export class RateLimitError extends TrendSearchError {
  public readonly url: string;
  public readonly status: number;
  public readonly retryAfterMs?: number;

  constructor(args: {
    message: string;
    url: string;
    status?: number;
    retryAfterMs?: number;
  }) {
    super(args.message, "RATE_LIMIT_ERROR");
    this.url = args.url;
    this.status = args.status ?? 429;
    this.retryAfterMs = args.retryAfterMs;
  }
}

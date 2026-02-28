import { TrendSearchError } from "./trendsearch-error";

export class UnexpectedResponseError extends TrendSearchError {
  public readonly endpoint: string;

  constructor(args: { endpoint: string; message: string }) {
    super(args.message, "UNEXPECTED_RESPONSE_ERROR");
    this.endpoint = args.endpoint;
  }
}

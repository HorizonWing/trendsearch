import { TrendSearchError } from "./trendsearch-error";

export class TransportError extends TrendSearchError {
  public readonly status?: number;
  public readonly url: string;
  public readonly responseBody?: string;

  constructor(args: {
    message: string;
    url: string;
    status?: number;
    responseBody?: string;
  }) {
    super(args.message, "TRANSPORT_ERROR");
    this.status = args.status;
    this.url = args.url;
    this.responseBody = args.responseBody;
  }
}

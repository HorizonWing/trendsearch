import { TrendSearchError } from "./trendsearch-error";

export class EndpointUnavailableError extends TrendSearchError {
  public readonly endpoint: string;
  public readonly status?: number;
  public readonly replacements: string[];

  constructor(args: {
    endpoint: string;
    status?: number;
    replacements?: string[];
  }) {
    const replacements = args.replacements ?? [];
    const replacementHint =
      replacements.length > 0
        ? ` Use '${replacements.join("', '")}' instead.`
        : "";

    super(
      `Endpoint '${args.endpoint}' is unavailable${args.status ? ` (HTTP ${args.status})` : ""}.${replacementHint}`,
      "ENDPOINT_UNAVAILABLE_ERROR"
    );

    this.endpoint = args.endpoint;
    this.status = args.status;
    this.replacements = replacements;
  }
}

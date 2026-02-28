import { TrendSearchError } from "./trendsearch-error";

export class SchemaValidationError extends TrendSearchError {
  public readonly endpoint: string;
  public readonly issues: string[];

  constructor(args: { endpoint: string; issues: string[] }) {
    super(
      `Schema validation failed for endpoint '${args.endpoint}'.`,
      "SCHEMA_VALIDATION_ERROR"
    );
    this.endpoint = args.endpoint;
    this.issues = args.issues;
  }
}

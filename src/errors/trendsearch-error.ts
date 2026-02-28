export class TrendSearchError extends Error {
  public readonly code: string;

  constructor(message: string, code = "TRENDSEARCH_ERROR") {
    super(message);
    this.name = new.target.name;
    this.code = code;
  }
}

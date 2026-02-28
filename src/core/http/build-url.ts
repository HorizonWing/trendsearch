export const buildUrl = (args: {
  baseUrl: string;
  path: string;
  query?: Record<string, string | number | boolean | undefined | null>;
}): string => {
  const pathWithoutLeadingSlash = args.path.replace(/^\/+/, "");
  const url = new URL(pathWithoutLeadingSlash, `${args.baseUrl}/`);

  if (args.query) {
    for (const [key, value] of Object.entries(args.query)) {
      if (value === undefined || value === null) {
        continue;
      }
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
};

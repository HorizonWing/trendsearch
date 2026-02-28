import type { ExploreWidget } from "../schemas";

import { UnexpectedResponseError } from "../errors";

export const selectWidget = (args: {
  endpoint: string;
  widgets: ExploreWidget[];
  id: string;
}): ExploreWidget => {
  const match = args.widgets.find((widget) => widget.id === args.id);
  if (!match) {
    throw new UnexpectedResponseError({
      endpoint: args.endpoint,
      message: `Widget '${args.id}' was not found in explore response.`,
    });
  }

  return match;
};

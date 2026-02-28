import {
  cancel,
  confirm,
  intro,
  isCancel,
  outro,
  select,
  text,
} from "@clack/prompts";

import type { OutputMode } from "./output";

import { endpointManifest, findEndpointDefinitionByPath } from "./manifest";

export interface WizardSelection {
  endpointPath: string[];
  request: unknown;
  output: OutputMode;
  raw: boolean;
}

const parseJsonInput = (value: string): unknown => {
  try {
    return JSON.parse(value);
  } catch {
    throw new Error("Request payload must be valid JSON.");
  }
};

export const runWizardPrompt = async (): Promise<
  WizardSelection | undefined
> => {
  intro("trendsearch wizard");

  const endpoint = await select({
    message: "Choose an endpoint",
    options: endpointManifest.map((item) => ({
      value: item.path.join(" "),
      label: item.path.join(" "),
      hint: item.summary,
    })),
  });

  if (isCancel(endpoint)) {
    cancel("Wizard cancelled.");
    return undefined;
  }

  const endpointPath = String(endpoint)
    .split(" ")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

  const definition = findEndpointDefinitionByPath(endpointPath);
  if (!definition) {
    cancel("Unknown endpoint selection.");
    return undefined;
  }

  const requestText = await text({
    message: "Request JSON payload",
    placeholder: '{"keywords":["typescript"],"geo":"US"}',
    validate(value) {
      if (typeof value !== "string") {
        return "Request JSON is required.";
      }

      if (value.trim().length === 0) {
        return "Request JSON is required.";
      }

      try {
        parseJsonInput(value);
      } catch {
        return "Request must be valid JSON.";
      }
    },
  });

  if (isCancel(requestText)) {
    cancel("Wizard cancelled.");
    return undefined;
  }

  if (typeof requestText !== "string") {
    cancel("Request JSON must be a string.");
    return undefined;
  }

  const output = await select({
    message: "Choose output mode",
    options: [
      { value: "pretty", label: "pretty" },
      { value: "json", label: "json" },
      { value: "jsonl", label: "jsonl" },
    ],
  });

  if (isCancel(output)) {
    cancel("Wizard cancelled.");
    return undefined;
  }

  const raw = await confirm({
    message: "Include raw upstream response?",
    initialValue: false,
  });

  if (isCancel(raw)) {
    cancel("Wizard cancelled.");
    return undefined;
  }

  outro(`Running ${definition.path.join(" ")}...`);

  return {
    endpointPath,
    request: parseJsonInput(requestText),
    output: output as OutputMode,
    raw: Boolean(raw),
  };
};

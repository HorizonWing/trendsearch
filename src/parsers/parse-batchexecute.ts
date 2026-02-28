import { stripGooglePrefix } from "../core/http/strip-prefix";
import { UnexpectedResponseError } from "../errors";

export interface BatchexecuteFrame {
  rpcId: string;
  payloadText: string;
  payload: unknown;
  raw: unknown[];
}

const parseFrameRow = (row: unknown): BatchexecuteFrame | null => {
  if (!Array.isArray(row) || row.length < 3 || typeof row[2] !== "string") {
    return null;
  }

  const [firstValue, secondValue, thirdValue] = row;

  let rpcCandidate: string | null = null;
  if (typeof secondValue === "string") {
    rpcCandidate = secondValue;
  } else if (typeof firstValue === "string") {
    rpcCandidate = firstValue;
  }

  if (!rpcCandidate) {
    return null;
  }

  const payloadText = thirdValue;
  let payload: unknown = payloadText;

  try {
    payload = JSON.parse(payloadText);
  } catch {
    payload = payloadText;
  }

  return {
    rpcId: rpcCandidate,
    payloadText,
    payload,
    raw: row,
  };
};

export const parseBatchexecute = (
  responseText: string
): BatchexecuteFrame[] => {
  const stripped = stripGooglePrefix(responseText);
  const frames: BatchexecuteFrame[] = [];

  for (const line of stripped.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("[")) {
      continue;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      continue;
    }

    const rows = Array.isArray(parsed) ? parsed : [parsed];
    for (const row of rows) {
      const frame = parseFrameRow(row);
      if (frame) {
        frames.push(frame);
      }
    }
  }

  return frames;
};

export const extractBatchexecutePayload = (args: {
  endpoint: string;
  responseText: string;
  rpcId: string;
}): unknown => {
  const frames = parseBatchexecute(args.responseText);
  const frame = frames.find((item) => item.rpcId === args.rpcId);

  if (!frame) {
    throw new UnexpectedResponseError({
      endpoint: args.endpoint,
      message: `RPC frame '${args.rpcId}' was not found in batchexecute response.`,
    });
  }

  return frame.payload;
};

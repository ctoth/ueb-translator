export type OracleDirection = "backward" | "forward";
export type OracleMode = "grade1" | "grade2" | "technical";

export interface OracleRequest {
  readonly direction: OracleDirection;
  readonly id: string;
  readonly mode: OracleMode;
  readonly text: string;
}

export interface InvalidOracleRequest {
  readonly error: string;
  readonly ok: false;
}

export interface ValidOracleRequest {
  readonly ok: true;
  readonly request: OracleRequest;
}

export type OracleRequestParseResult =
  | InvalidOracleRequest
  | ValidOracleRequest;

const requestFields: ReadonlySet<string> = new Set([
  "direction",
  "id",
  "mode",
  "text",
]);

const jsonParser: { parse(text: string): unknown } = JSON;

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDirection(value: unknown): value is OracleDirection {
  return value === "backward" || value === "forward";
}

function isMode(value: unknown): value is OracleMode {
  return value === "grade1" || value === "grade2" || value === "technical";
}

function invalid(error: string): InvalidOracleRequest {
  return { error, ok: false };
}

export function parseOracleRequest(
  value: unknown,
): OracleRequestParseResult {
  if (!isRecord(value)) {
    return invalid("request must be a JSON object");
  }

  const unknownField = Object.keys(value).find(
    (field) => !requestFields.has(field),
  );
  if (unknownField !== undefined) {
    return invalid(`unknown request field: ${unknownField}`);
  }

  const id = value["id"];
  if (typeof id !== "string" || id.length === 0) {
    return invalid("id must be a non-empty string");
  }

  const direction = value["direction"];
  if (!isDirection(direction)) {
    return invalid("direction must be backward or forward");
  }

  const mode = value["mode"];
  if (!isMode(mode)) {
    return invalid("mode must be grade1, grade2, or technical");
  }

  const text = value["text"];
  if (typeof text !== "string") {
    return invalid("text must be a string");
  }
  if (text.includes("\u0000")) {
    return invalid("text must not contain U+0000");
  }

  return {
    ok: true,
    request: { direction, id, mode, text },
  };
}

export function parseOracleRequestLine(
  line: string,
): OracleRequestParseResult {
  let value: unknown;
  try {
    value = jsonParser.parse(line);
  } catch {
    return invalid("request must be valid JSON");
  }
  return parseOracleRequest(value);
}

export function tablesForMode(mode: OracleMode): readonly string[] {
  switch (mode) {
    case "grade1":
      return ["en-ueb-g1.ctb"];
    case "grade2":
      return ["en-ueb-g2.ctb"];
    case "technical":
      return ["en-ueb-g2.ctb", "en-ueb-math.ctb"];
  }
}


import { readFile } from "node:fs/promises";
import {
  CONTEXTUAL_COMPACT_INTEGER_MAX,
} from "../src/contextual-schema.ts";

function isIntegerInRange(value: unknown, minimum: number, maximum: number): value is number {
  return Number.isInteger(value) && typeof value === "number" &&
    value >= minimum && value <= maximum;
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null;
}

export function encodeCompactIntegers(
  values: readonly number[],
  name: string,
): string {
  let encoded = "";
  for (const value of values) {
    if (!isIntegerInRange(value, 0, CONTEXTUAL_COMPACT_INTEGER_MAX)) {
      throw new Error(`Compiled Grade 2 ${name} exceeds fixed-width encoding.`);
    }
    encoded += String.fromCharCode(value + 0x100);
  }
  return encoded;
}

export async function readGeneratedFile(path: string): Promise<string> {
  try {
    return await readFile(path, "utf8");
  } catch (error: unknown) {
    if (isRecord(error) && error["code"] === "ENOENT") {
      throw new Error(`${path} is missing; run npm run grade2:generate.`, { cause: error });
    }
    throw error;
  }
}

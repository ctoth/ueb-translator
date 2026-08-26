import { createInterface } from "node:readline";

import {
  compareOracleTranslation,
  parseDifferentialCaseLine,
} from "./differential.js";
import { runOracleTranslation, verifyOracleVersion } from "./runner.js";

interface DifferentialErrorResponse {
  readonly caseId: string | null;
  readonly error: {
    readonly code: "invalid-case" | "oracle-failure";
    readonly message: string;
  };
  readonly ok: false;
}

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function writeJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value)}\n`);
}

function fail(response: DifferentialErrorResponse): void {
  writeJson(response);
  process.exitCode = 1;
}

async function main(): Promise<void> {
  const executable = process.env["LIBLOUIS_ORACLE_BIN"] ?? "lou_translate";
  let version: string;
  try {
    version = await verifyOracleVersion(executable);
  } catch (error: unknown) {
    fail({
      caseId: null,
      error: { code: "oracle-failure", message: messageFrom(error) },
      ok: false,
    });
    return;
  }

  const lines = createInterface({
    crlfDelay: Number.POSITIVE_INFINITY,
    input: process.stdin,
    terminal: false,
  });
  for await (const line of lines) {
    const parsed = parseDifferentialCaseLine(line);
    if (!parsed.ok) {
      fail({
        caseId: null,
        error: { code: "invalid-case", message: parsed.error },
        ok: false,
      });
      continue;
    }
    try {
      const translation = await runOracleTranslation(
        executable,
        {
          direction: "forward",
          id: parsed.case.caseId,
          mode: parsed.case.mode,
          text: parsed.case.print,
        },
        version,
      );
      const comparison = compareOracleTranslation(parsed.case, translation);
      writeJson(comparison);
      if (!comparison.ok) {
        process.exitCode = 1;
      }
    } catch (error: unknown) {
      fail({
        caseId: parsed.case.caseId,
        error: { code: "oracle-failure", message: messageFrom(error) },
        ok: false,
      });
    }
  }
}

void main();

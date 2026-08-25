import { createInterface } from "node:readline";

import { parseOracleRequestLine } from "./protocol.js";
import { runOracleTranslation, verifyOracleVersion } from "./runner.js";

interface OracleErrorResponse {
  readonly error: {
    readonly code: "invalid-request" | "oracle-failure";
    readonly message: string;
  };
  readonly id: string | null;
  readonly ok: false;
}

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function writeJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value)}\n`);
}

function writeError(response: OracleErrorResponse): void {
  writeJson(response);
}

async function main(): Promise<void> {
  const executable = process.env["LIBLOUIS_ORACLE_BIN"] ?? "lou_translate";
  let version: string;
  try {
    version = await verifyOracleVersion(executable);
  } catch (error: unknown) {
    writeError({
      error: { code: "oracle-failure", message: messageFrom(error) },
      id: null,
      ok: false,
    });
    process.exitCode = 1;
    return;
  }

  const lines = createInterface({
    crlfDelay: Number.POSITIVE_INFINITY,
    input: process.stdin,
    terminal: false,
  });

  for await (const line of lines) {
    const parsed = parseOracleRequestLine(line);
    if (!parsed.ok) {
      writeError({
        error: { code: "invalid-request", message: parsed.error },
        id: null,
        ok: false,
      });
      continue;
    }

    try {
      writeJson(await runOracleTranslation(executable, parsed.request, version));
    } catch (error: unknown) {
      writeError({
        error: { code: "oracle-failure", message: messageFrom(error) },
        id: parsed.request.id,
        ok: false,
      });
    }
  }
}

void main();

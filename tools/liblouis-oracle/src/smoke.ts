import { LIBLOUIS_ORACLE_VERSION } from "./metadata.js";
import type { OracleRequest } from "./protocol.js";
import { runOracleTranslation, verifyOracleVersion } from "./runner.js";

const requests: readonly OracleRequest[] = [
  { direction: "forward", id: "grade1", mode: "grade1", text: "Hello, 2024." },
  { direction: "forward", id: "grade2", mode: "grade2", text: "The quick brown fox." },
  { direction: "forward", id: "technical", mode: "technical", text: "x² + y² = z²" },
];

function isUnicodeBraille(value: string): boolean {
  return Array.from(value).every((character) => {
    const codePoint = character.codePointAt(0);
    return (
      codePoint !== undefined && codePoint >= 0x2800 && codePoint <= 0x28ff
    );
  });
}

async function main(): Promise<void> {
  const executable = process.env["LIBLOUIS_ORACLE_BIN"] ?? "lou_translate";
  const version = await verifyOracleVersion(executable);
  const checkedModes: string[] = [];

  for (const request of requests) {
    const response = await runOracleTranslation(executable, request, version);
    if (response.output.length === 0 || !isUnicodeBraille(response.output)) {
      throw new Error(`${request.mode} did not return Unicode Braille cells`);
    }
    checkedModes.push(request.mode);
  }

  process.stdout.write(
    `${JSON.stringify({ checkedModes, ok: true, version: LIBLOUIS_ORACLE_VERSION })}\n`,
  );
}

void main();


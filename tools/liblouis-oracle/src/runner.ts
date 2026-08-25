import { spawn } from "node:child_process";

import {
  LIBLOUIS_ORACLE_STATUS,
  LIBLOUIS_ORACLE_VERSION,
} from "./metadata.js";
import type { OracleRequest } from "./protocol.js";
import { tablesForMode } from "./protocol.js";

interface ProcessResult {
  readonly exitCode: number | null;
  readonly stderr: string;
  readonly stdout: string;
}

export interface OracleIdentity {
  readonly engine: "liblouis";
  readonly status: string;
  readonly tables: readonly string[];
  readonly version: string;
}

export interface OracleTranslation {
  readonly id: string;
  readonly ok: true;
  readonly oracle: OracleIdentity;
  readonly output: string;
}

function runProcess(
  executable: string,
  arguments_: readonly string[],
  input: string,
): Promise<ProcessResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, arguments_, {
      env: process.env,
      shell: false,
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    });
    let stderr = "";
    let stdout = "";

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });
    child.stdin.once("error", (error) => {
      if (input.length !== 0) {
        reject(error);
      }
    });
    child.once("error", reject);
    child.once("close", (exitCode) => {
      resolve({ exitCode, stderr, stdout });
    });
    child.stdin.end(input);
  });
}

function commandError(
  executable: string,
  result: ProcessResult,
): Error {
  const detail = result.stderr.trim();
  const suffix = detail.length === 0 ? "" : `: ${detail}`;
  return new Error(
    `${executable} exited with code ${String(result.exitCode)}${suffix}`,
  );
}

function removeFinalLineEnding(value: string): string {
  if (value.endsWith("\r\n")) {
    return value.slice(0, -2);
  }
  if (value.endsWith("\n")) {
    return value.slice(0, -1);
  }
  return value;
}

export async function verifyOracleVersion(
  executable: string,
): Promise<string> {
  const result = await runProcess(executable, ["--version"], "");
  if (result.exitCode !== 0) {
    throw commandError(executable, result);
  }

  const match = /\(Liblouis\) (?<version>\d+\.\d+\.\d+)/u.exec(
    result.stdout,
  );
  const version = match?.groups?.["version"];
  if (version === undefined) {
    throw new Error(`could not parse ${executable} --version output`);
  }
  if (version !== LIBLOUIS_ORACLE_VERSION) {
    throw new Error(
      `expected Liblouis ${LIBLOUIS_ORACLE_VERSION}, received ${version}`,
    );
  }
  return version;
}

export async function runOracleTranslation(
  executable: string,
  request: OracleRequest,
  version: string,
): Promise<OracleTranslation> {
  const tables = tablesForMode(request.mode);
  const direction = request.direction === "forward" ? "--forward" : "--backward";
  const result = await runProcess(
    executable,
    [direction, "--display-table", "unicode.dis", tables.join(",")],
    request.text,
  );
  if (result.exitCode !== 0) {
    throw commandError(executable, result);
  }
  if (result.stderr.trim().length !== 0) {
    throw new Error(`${executable} wrote to stderr: ${result.stderr.trim()}`);
  }

  return {
    id: request.id,
    ok: true,
    oracle: {
      engine: "liblouis",
      status: LIBLOUIS_ORACLE_STATUS,
      tables,
      version,
    },
    output: removeFinalLineEnding(result.stdout),
  };
}

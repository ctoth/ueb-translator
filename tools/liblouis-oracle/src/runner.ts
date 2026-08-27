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

export function encodeOracleInput(input: string): string {
  return input.replaceAll("\\", "\\\\");
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
    encodeOracleInput(request.text),
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

export async function runOracleTranslations(
  executable: string,
  requests: readonly OracleRequest[],
  version: string,
): Promise<readonly OracleTranslation[]> {
  if (requests.length === 0) {
    return [];
  }
  const mode = requests[0]?.mode;
  if (mode === undefined || requests.some((request) => request.mode !== mode)) {
    throw new Error("batched oracle requests must use one mode");
  }
  if (requests.some((request) => request.direction !== "forward")) {
    throw new Error("batched empirical oracle requests must be forward translations");
  }
  if (requests.some((request) => /[\r\n\v\f\u0085\u2028\u2029]/u.test(request.text))) {
    throw new Error("batched oracle request text must not contain line endings");
  }
  const tables = tablesForMode(mode);
  const result = await runProcess(
    executable,
    ["--forward", "--display-table", "unicode.dis", tables.join(",")],
    requests.map((request) => encodeOracleInput(request.text)).join("\n"),
  );
  if (result.exitCode !== 0) {
    throw commandError(executable, result);
  }
  if (result.stderr.trim().length !== 0) {
    if (requests.length > 1) {
      const middle = Math.floor(requests.length / 2);
      const left = await runOracleTranslations(
        executable,
        requests.slice(0, middle),
        version,
      );
      const right = await runOracleTranslations(
        executable,
        requests.slice(middle),
        version,
      );
      return [...left, ...right];
    }
    const request = requests[0];
    if (request === undefined) {
      throw new Error("missing request for unrepresentable oracle output");
    }
    const detail = result.stderr.trim().replace(/\s+/gu, " ");
    return [{
      id: request.id,
      ok: true,
      oracle: {
        engine: "liblouis",
        status: `${LIBLOUIS_ORACLE_STATUS}; unrepresentable: ${detail}`,
        tables,
        version,
      },
      output: "[[unrepresentable:liblouis-stderr]]",
    }];
  }
  const output = removeFinalLineEnding(result.stdout).split(/\r?\n/u);
  if (output.length !== requests.length) {
    if (requests.length > 1) {
      const middle = Math.floor(requests.length / 2);
      const left = await runOracleTranslations(
        executable,
        requests.slice(0, middle),
        version,
      );
      const right = await runOracleTranslations(
        executable,
        requests.slice(middle),
        version,
      );
      return [...left, ...right];
    }
    throw new Error(
      `batched oracle returned ${String(output.length)} lines for ${String(requests.length)} requests (${requests[0]?.id ?? "missing"} through ${requests.at(-1)?.id ?? "missing"})`,
    );
  }
  return requests.map((request, index) => ({
    id: request.id,
    ok: true,
    oracle: {
      engine: "liblouis",
      status: LIBLOUIS_ORACLE_STATUS,
      tables,
      version,
    },
    output: output[index] ?? "",
  }));
}

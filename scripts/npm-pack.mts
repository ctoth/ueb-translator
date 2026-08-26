import { spawnSync } from "node:child_process";

export interface PackedFile {
  readonly path: string;
  readonly size: number;
}

export interface PackedPackage {
  readonly filename: string;
  readonly files: readonly PackedFile[];
  readonly size: number;
  readonly unpackedSize: number;
}

export type NpmPackRequest =
  | {
      readonly cwd: string;
      readonly kind: "dry-run";
    }
  | {
      readonly cwd: string;
      readonly destination: string;
      readonly kind: "archive";
    };

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(
  record: Readonly<Record<string, unknown>>,
  key: string,
): string {
  const value = record[key];
  if (typeof value !== "string") {
    throw new Error(`Expected ${key} to be a string.`);
  }
  return value;
}

function requiredNumber(
  record: Readonly<Record<string, unknown>>,
  key: string,
): number {
  const value = record[key];
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error(`Expected ${key} to be a non-negative safe integer.`);
  }
  return value;
}

export function parseNpmPackOutput(output: string): PackedPackage {
  const parsed: unknown = JSON.parse(output);
  if (!Array.isArray(parsed) || parsed.length !== 1 || !isRecord(parsed[0])) {
    throw new Error("npm pack did not return exactly one package record.");
  }
  const record = parsed[0];
  const rawFiles = record["files"];
  if (!Array.isArray(rawFiles)) {
    throw new Error("npm pack did not return a file inventory.");
  }
  const files: PackedFile[] = [];
  for (const rawFile of rawFiles) {
    if (!isRecord(rawFile)) {
      throw new Error("npm pack returned a malformed file record.");
    }
    files.push({
      path: requiredString(rawFile, "path"),
      size: requiredNumber(rawFile, "size"),
    });
  }
  const entryCount = requiredNumber(record, "entryCount");
  if (entryCount !== files.length) {
    throw new Error(
      `npm pack entry count ${String(entryCount)} does not match its ${String(files.length)} files.`,
    );
  }
  return {
    filename: requiredString(record, "filename"),
    files,
    size: requiredNumber(record, "size"),
    unpackedSize: requiredNumber(record, "unpackedSize"),
  };
}

export function npmPack(request: NpmPackRequest): PackedPackage {
  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  const args = request.kind === "archive"
    ? ["pack", "--json", "--pack-destination", request.destination]
    : ["pack", "--dry-run", "--json"];
  const result = spawnSync(npmCommand, args, {
    cwd: request.cwd,
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  const output = `${result.stdout}${result.stderr}`;
  if (result.error !== undefined) {
    throw new Error(`npm pack could not start: ${result.error.message}\n${output}`);
  }
  if (result.status !== 0) {
    throw new Error(`npm pack exited ${String(result.status)}.\n${output}`);
  }
  return parseNpmPackOutput(result.stdout);
}

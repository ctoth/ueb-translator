import { createHash } from "node:crypto";

import type { CorpusPartition } from "./command.js";

export const EXTRACTION_RULES_VERSION = 1;

export interface CorpusDocumentRecord {
  readonly id: string;
  readonly partition: CorpusPartition;
  readonly relativePath: string;
  readonly sha256: string;
  readonly utf8Bytes: number;
}

export interface DocumentInput {
  readonly id: string;
  readonly relativePath: string;
  readonly text: string;
}

const SHA256_PATTERN = /^[\da-f]{64}$/u;
const HELD_OUT_PREFIX_COUNT = 51;

// SHA-256 is defined by NIST FIPS 180-4. The fixed prefix boundary seals an
// approximately 20% holdout before any translation or rule-selection work.
// https://csrc.nist.gov/pubs/fips/180-4/upd1/final
export function assignPartition(sha256: string): CorpusPartition {
  if (!SHA256_PATTERN.test(sha256)) {
    throw new Error("Corpus partition requires a lowercase SHA-256 digest.");
  }
  const prefix = Number.parseInt(sha256.slice(0, 2), 16);
  return prefix < HELD_OUT_PREFIX_COUNT ? "held-out" : "training";
}

export function buildDocumentRecord(input: DocumentInput): CorpusDocumentRecord {
  const bytes = Buffer.from(input.text, "utf8");
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  return {
    id: input.id,
    partition: assignPartition(sha256),
    relativePath: input.relativePath,
    sha256,
    utf8Bytes: bytes.byteLength,
  };
}

export function verifyDocumentRecord(
  record: CorpusDocumentRecord,
  text: string,
): boolean {
  const rebuilt = buildDocumentRecord({
    id: record.id,
    relativePath: record.relativePath,
    text,
  });
  return (
    rebuilt.partition === record.partition &&
    rebuilt.sha256 === record.sha256 &&
    rebuilt.utf8Bytes === record.utf8Bytes
  );
}

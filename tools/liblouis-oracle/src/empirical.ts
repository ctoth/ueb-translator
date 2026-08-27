import { createHash } from "node:crypto";

import { translateGrade2 } from "../../../src/grade2.js";
import type {
  ComparisonEvidence,
  DifferentialCase,
} from "./differential.js";

export const SCOWL_SOURCE = {
  archiveSha256:
    "5587667caa20c4891390c2d42dbb4d5c4c3f41bee77af1457ece3ba23fb859cc",
  archiveUrl:
    "https://downloads.sourceforge.net/project/wordlist/SCOWL/2020.12.07/scowl-2020.12.07.tar.gz",
  gitCommit: "5ef55f9c42730ebe4394a78b77855468a6f15dd2",
  level: 95,
  version: "2020.12.07",
} as const;

export interface CorpusCaseInput {
  readonly documentId: string;
  readonly documentSha256: string;
  readonly text: string;
}

function grade2Case(
  caseId: string,
  print: string,
  testId: string,
): DifferentialCase {
  const result = translateGrade2(print);
  const localOutput = result.ok
    ? result.braille
    : `[[unsupported:${result.reason}:${result.character}:scalar-${String(result.scalarIndex)}]]`;
  return {
    caseId,
    local: { kind: "test", testId },
    localOutput,
    mode: "grade2",
    print,
  };
}

export function buildFuzzCase(print: string): DifferentialCase {
  const digest = createHash("sha256").update(print).digest("hex");
  return grade2Case(`fuzz:${digest}`, print, "fast-check:grade2-hard-shapes");
}

export function parseScowlWordList(source: string): readonly string[] {
  return [...new Set(
    source
      .replaceAll("\r\n", "\n")
      .split("\n")
      .map((word) => word.normalize("NFC").trim())
      .filter((word) => word.length > 0),
  )].sort();
}

export function splitSentences(text: string): readonly string[] {
  const sentences = text
    .normalize("NFC")
    .replace(/\r\n|[\r\v\f\u0085\u2028\u2029]/gu, "\n")
    .split(/(?<=[.!?])(?:[\t ]+|\n+)|\n{2,}/u)
    .map((sentence) => sentence.replace(/[\t\n ]+/gu, " ").trim())
    .filter((sentence) => sentence.length > 0);
  return sentences.flatMap((sentence) => {
    const chunks: string[] = [];
    let remaining = sentence;
    while (remaining.length > 512) {
      const boundary = remaining.lastIndexOf(" ", 512);
      const end = boundary > 0 ? boundary : 512;
      chunks.push(remaining.slice(0, end));
      remaining = remaining.slice(end).trimStart();
    }
    if (remaining.length > 0) {
      chunks.push(remaining);
    }
    return chunks;
  });
}

export function buildCorpusCases(
  input: CorpusCaseInput,
): readonly DifferentialCase[] {
  if (!/^[\da-f]{64}$/u.test(input.documentSha256)) {
    throw new Error("Corpus cases require a lowercase document SHA-256 digest.");
  }
  return splitSentences(input.text).map((sentence, index) =>
    grade2Case(
      `corpus:${input.documentSha256}:${String(index).padStart(8, "0")}`,
      sentence,
      `corpus:${input.documentId}`,
    )
  );
}

export function buildDictionaryCases(
  words: readonly string[],
): readonly DifferentialCase[] {
  return words.map(buildDictionaryCase);
}

export function buildDictionaryCase(
  word: string,
  index: number,
): DifferentialCase {
  return grade2Case(
    `scowl:${SCOWL_SOURCE.version}:${String(SCOWL_SOURCE.level)}:${String(index).padStart(8, "0")}`,
    word,
    `SCOWL-${SCOWL_SOURCE.version}-level-${String(SCOWL_SOURCE.level)}`,
  );
}

export function divergenceFingerprint(evidence: ComparisonEvidence): string {
  let prefix = 0;
  while (
    evidence.local.output.charAt(prefix) !== "" &&
    evidence.local.output.charAt(prefix) === evidence.oracle.output.charAt(prefix)
  ) {
    prefix += 1;
  }
  let suffix = 0;
  while (
    suffix < evidence.local.output.length - prefix &&
    suffix < evidence.oracle.output.length - prefix &&
    evidence.local.output.charAt(evidence.local.output.length - suffix - 1) ===
      evidence.oracle.output.charAt(evidence.oracle.output.length - suffix - 1)
  ) {
    suffix += 1;
  }
  let inputShape = "";
  for (const character of evidence.input) {
    const category = /[a-z]/u.test(character)
      ? "lower"
      : /[A-Z]/u.test(character)
        ? "upper"
        : /[0-9]/u.test(character)
          ? "digit"
          : character;
    if (!inputShape.endsWith(`:${category}`)) {
      inputShape += `:${category}`;
    }
  }
  return createHash("sha256").update(JSON.stringify({
    inputShape,
    localChanged: evidence.local.output.slice(prefix, evidence.local.output.length - suffix),
    oracleChanged: evidence.oracle.output.slice(prefix, evidence.oracle.output.length - suffix),
    tables: evidence.oracle.tables,
    version: evidence.oracle.version,
  })).digest("hex");
}

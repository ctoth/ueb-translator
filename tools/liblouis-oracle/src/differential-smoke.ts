import { translateGrade1 } from "../../../src/grade1.js";
import { translateGrade2 } from "../../../src/grade2.js";
import { translateTechnicalText } from "../../../src/technical.js";
import {
  compareOracleTranslation,
  type DifferentialCase,
  type LocalEvidence,
} from "./differential.js";
import type { OracleMode } from "./protocol.js";
import { runOracleTranslation, verifyOracleVersion } from "./runner.js";

interface LocalTranslation {
  readonly braille?: string;
  readonly ok: boolean;
}

interface LocalCase {
  readonly caseId: string;
  readonly local: LocalEvidence;
  readonly mode: OracleMode;
  readonly print: string;
  readonly translate: () => LocalTranslation;
}

const localCases: readonly LocalCase[] = [
  {
    caseId: "grade1-capital-letter",
    local: {
      kind: "test",
      testId: "test/grade1.test.ts:ICEB-2024-4.1-capitals",
    },
    mode: "grade1",
    print: "A",
    translate: () => translateGrade1("A"),
  },
  {
    caseId: "grade2-alphabetic-wordsign-and",
    local: { kind: "rule", ruleId: "UEB-10.3-and" },
    mode: "grade2",
    print: "and",
    translate: () => translateGrade2("and"),
  },
  {
    caseId: "technical-linear-operation",
    local: {
      kind: "test",
      testId: "test/technical.test.ts:raw-technical-text",
    },
    mode: "technical",
    print: "3+2=5",
    translate: () => translateTechnicalText("3+2=5"),
  },
];

function differentialCase(source: LocalCase): DifferentialCase {
  const result = source.translate();
  if (!result.ok || result.braille === undefined) {
    throw new Error(`${source.caseId} did not produce a local translation`);
  }
  return {
    caseId: source.caseId,
    local: source.local,
    localOutput: result.braille,
    mode: source.mode,
    print: source.print,
  };
}

async function main(): Promise<void> {
  const executable = process.env["LIBLOUIS_ORACLE_BIN"] ?? "lou_translate";
  const version = await verifyOracleVersion(executable);
  for (const source of localCases) {
    const case_ = differentialCase(source);
    const oracle = await runOracleTranslation(
      executable,
      {
        direction: "forward",
        id: case_.caseId,
        mode: case_.mode,
        text: case_.print,
      },
      version,
    );
    const comparison = compareOracleTranslation(case_, oracle);
    process.stdout.write(`${JSON.stringify(comparison)}\n`);
    if (!comparison.ok) {
      process.exitCode = 1;
    }
  }
}

void main();

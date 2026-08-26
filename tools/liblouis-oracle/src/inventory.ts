import { GRADE2_CONTEXTUAL_RULES } from "../../../rules/ueb-2024/program.js";
import type { ContextualRuleSource } from "../../../rules/ueb-2024/contextual-compiler.js";
import { traceGrade2 } from "../../../src/grade2-diagnostics.js";
import { translateGrade1 } from "../../../src/grade1.js";
import { translateGrade2 } from "../../../src/grade2.js";
import { translateTechnicalText } from "../../../src/technical.js";
import type { DifferentialCase, LocalEvidence } from "./differential.js";
import type { OracleMode } from "./protocol.js";

export const ORACLE_INVENTORY_MINIMUM_CASES = 1_000;

interface TranslationSuccess {
  readonly braille: string;
  readonly ok: true;
}

interface FixtureSource {
  readonly caseId: string;
  readonly local: LocalEvidence;
  readonly mode: OracleMode;
  readonly print: string;
  readonly translate: (print: string) => { readonly braille?: string; readonly ok: boolean };
}

const LONGER_SHORTFORM_EXAMPLES: Readonly<Record<string, string>> = {
  blind: "blindness",
  braille: "brailler",
  children: "childrenhood",
  first: "firstborn",
  friend: "friendship",
  good: "goodness",
  great: "greater",
  letter: "letterhead",
  little: "littleness",
  quick: "quickness",
};

const FIRST_SYLLABLE_EXAMPLES: Readonly<Record<string, string>> = {
  be: "become",
  con: "conduct",
  dis: "display",
};

const fixtures: readonly FixtureSource[] = [
  {
    caseId: "fixture:grade2:ueb-10.9.1-official-sentence",
    local: {
      kind: "test",
      testId: "test/grade2.test.ts:UEB-10.9.1-official-sentence",
    },
    mode: "grade2",
    print: "You should receive your letter tomorrow afternoon.",
    translate: translateGrade2,
  },
  {
    caseId: "fixture:grade2:strong-contractions",
    local: {
      kind: "test",
      testId: "test/grade2.test.ts:UEB-10.3-strong-contractions",
    },
    mode: "grade2",
    print: "andante bathed coffee",
    translate: translateGrade2,
  },
  {
    caseId: "fixture:grade2:shortest-cell-precedence",
    local: {
      kind: "test",
      testId: "test/grade2.test.ts:shortest-cell-precedence",
    },
    mode: "grade2",
    print: "thence named afford",
    translate: translateGrade2,
  },
  {
    caseId: "fixture:grade1:complete-alphabet",
    local: {
      kind: "test",
      testId: "test/grade1.test.ts:ICEB-2024-4.1-complete-alphabet",
    },
    mode: "grade1",
    print: "abcdefghijklmnopqrstuvwxyz",
    translate: translateGrade1,
  },
  {
    caseId: "fixture:grade1:capitals",
    local: {
      kind: "test",
      testId: "test/grade1.test.ts:ICEB-2024-8.3-8.6-capitals",
    },
    mode: "grade1",
    print: "A NASA AT&T",
    translate: translateGrade1,
  },
  {
    caseId: "fixture:grade1:numeric-mode",
    local: {
      kind: "test",
      testId: "test/grade1.test.ts:ICEB-2024-6.1-6.5-numeric-mode",
    },
    mode: "grade1",
    print: "1.2,3 1a 1A 1-2 1–2 1—2 1+2",
    translate: translateGrade1,
  },
  {
    caseId: "fixture:technical:linear-operation",
    local: {
      kind: "test",
      testId: "test/technical.test.ts:raw-technical-text",
    },
    mode: "technical",
    print: "3+2=5",
    translate: translateTechnicalText,
  },
  {
    caseId: "fixture:technical:linear-slash",
    local: {
      kind: "test",
      testId: "test/technical.test.ts:raw-linear-slash",
    },
    mode: "technical",
    print: "x/y",
    translate: translateTechnicalText,
  },
];

function successfulTranslation(
  caseId: string,
  result: { readonly braille?: string; readonly ok: boolean },
): TranslationSuccess {
  if (!result.ok || result.braille === undefined) {
    throw new Error(`${caseId} did not produce a local translation`);
  }
  return { braille: result.braille, ok: true };
}

function firstAsciiLetterUppercase(value: string): string {
  const index = value.search(/[a-z]/u);
  if (index < 0) {
    return value;
  }
  return `${value.slice(0, index)}${value[index]?.toUpperCase() ?? ""}${value.slice(index + 1)}`;
}

function ruleExample(rule: ContextualRuleSource): string {
  const eligibleWord = rule.guards.find(
    (guard) => guard.kind === "eligibility-word",
  );
  if (eligibleWord?.kind === "eligibility-word") {
    return eligibleWord.word;
  }
  if (rule.id.endsWith("-longer-word")) {
    const example = LONGER_SHORTFORM_EXAMPLES[rule.input];
    if (example === undefined) {
      throw new Error(`No project-owned longer-word example for ${rule.id}`);
    }
    return example;
  }
  const guardKinds = new Set(rule.guards.map((guard) => guard.kind));
  if (
    guardKinds.has("standing-alone") &&
    guardKinds.has("word-start") &&
    guardKinds.has("word-end")
  ) {
    return rule.input;
  }
  if (guardKinds.has("not-word-start")) {
    return `a${rule.input}`;
  }
  if (guardKinds.has("first-syllable")) {
    const example = FIRST_SYLLABLE_EXAMPLES[rule.input];
    if (example === undefined) {
      throw new Error(`No project-owned first-syllable example for ${rule.id}`);
    }
    return example;
  }
  if (guardKinds.has("word-internal")) {
    return `a${rule.input}a`;
  }
  if (rule.id.startsWith("UEB-10.7-")) {
    return rule.input;
  }
  return `a${rule.input}a`;
}

function ruleCase(
  rule: ContextualRuleSource,
  variant: "alternate" | "source",
): DifferentialCase {
  const sourcePrint = ruleExample(rule);
  const print = variant === "alternate"
    ? sourcePrint.startsWith("'")
      ? `(${sourcePrint})`
      : firstAsciiLetterUppercase(sourcePrint)
    : sourcePrint;
  const caseId = `rule:${rule.id}:${variant}`;
  const result = traceGrade2(print);
  const success = successfulTranslation(caseId, result);
  if (!result.ok || !result.rules.some((applied) => applied.id === rule.id)) {
    throw new Error(`${caseId} did not exercise its claimed rule provenance`);
  }
  return {
    caseId,
    local: { kind: "rule", ruleId: rule.id },
    localOutput: success.braille,
    mode: "grade2",
    print,
  };
}

function fixtureCase(source: FixtureSource): DifferentialCase {
  const result = successfulTranslation(
    source.caseId,
    source.translate(source.print),
  );
  return {
    caseId: source.caseId,
    local: source.local,
    localOutput: result.braille,
    mode: source.mode,
    print: source.print,
  };
}

export function buildOracleInventory(): readonly DifferentialCase[] {
  const cases = [
    ...GRADE2_CONTEXTUAL_RULES.flatMap((rule) => [
      ruleCase(rule, "source"),
      ruleCase(rule, "alternate"),
    ]),
    ...fixtures.map(fixtureCase),
  ];
  if (cases.length < ORACLE_INVENTORY_MINIMUM_CASES) {
    throw new Error(
      `Oracle inventory has ${String(cases.length)} cases; at least ${String(ORACLE_INVENTORY_MINIMUM_CASES)} are required`,
    );
  }
  const ids = new Set(cases.map((case_) => case_.caseId));
  if (ids.size !== cases.length) {
    throw new Error("Oracle inventory case identifiers must be unique");
  }
  return cases;
}

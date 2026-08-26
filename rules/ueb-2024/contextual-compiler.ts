import type { IcebRuleCitation } from "./source.js";

export type ContextualPrecedence = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type ContextualRuleGuard =
  | { readonly kind: "eligibility-word"; readonly word: string }
  | { readonly kind: "first-syllable" }
  | { readonly kind: "following-not-vowel-y" }
  | { readonly kind: "lower-sign"; readonly policy: "enough-or-in" | "other" }
  | { readonly kind: "not-boundary"; readonly boundary: "prefix" }
  | {
      readonly kind: "not-crossing";
      readonly boundaries: readonly ("braille-line" | "compound" | "syllable")[];
    }
  | { readonly kind: "not-word"; readonly words: readonly string[] }
  | { readonly kind: "not-word-ending"; readonly endings: readonly string[] }
  | { readonly kind: "not-word-end" }
  | { readonly kind: "not-word-start" }
  | { readonly kind: "not-whole-word" }
  | { readonly kind: "previous-not"; readonly characters: string }
  | { readonly kind: "standing-alone" }
  | { readonly kind: "word-end" }
  | { readonly kind: "word-internal" }
  | { readonly kind: "word-start" };

export interface ContextualRuleSource {
  readonly braille: string;
  readonly citation: IcebRuleCitation;
  readonly guards: readonly ContextualRuleGuard[];
  readonly id: string;
  readonly input: string;
  readonly precedence: ContextualPrecedence;
}

export type ContextualRuleCompilationErrorCode =
  | "ambiguous-precedence"
  | "conflicting-rule-id"
  | "duplicate-guard"
  | "uncited-rule"
  | "unreachable-rule";

export class ContextualRuleCompilationError extends Error {
  public readonly code: ContextualRuleCompilationErrorCode;
  public override readonly name = "ContextualRuleCompilationError";
  public readonly ruleIds: readonly string[];

  public constructor(
    code: ContextualRuleCompilationErrorCode,
    ruleIds: readonly string[],
    message: string,
  ) {
    super(message);
    this.code = code;
    this.ruleIds = ruleIds;
  }
}

export type ContextualGuardOpcode =
  | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
  | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16;
export type CompiledContextualGuard = readonly [
  opcode: ContextualGuardOpcode,
  operandIndex: number,
];
export type CompiledContextualRule = readonly [
  input: string,
  braille: string,
  precedence: ContextualPrecedence,
  guardOffset: number,
  guardCount: number,
];

export interface ContextualRuntimeProgram {
  readonly guards: readonly CompiledContextualGuard[];
  readonly rules: readonly CompiledContextualRule[];
  readonly stringOperands: readonly string[];
}

export interface ContextualCompilationResult {
  readonly provenance: readonly ContextualRuleSource[];
  readonly runtime: ContextualRuntimeProgram;
}

const GUARD_OPCODE: Readonly<Record<ContextualRuleGuard["kind"], ContextualGuardOpcode>> = {
  "eligibility-word": 0,
  "first-syllable": 1,
  "following-not-vowel-y": 2,
  "lower-sign": 3,
  "not-boundary": 4,
  "not-crossing": 5,
  "not-word": 6,
  "not-word-ending": 7,
  "not-word-end": 8,
  "not-word-start": 9,
  "not-whole-word": 10,
  "previous-not": 11,
  "standing-alone": 12,
  "word-end": 13,
  "word-internal": 14,
  "word-start": 15,
};

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function guardOperand(guard: ContextualRuleGuard): string {
  switch (guard.kind) {
    case "eligibility-word":
      return guard.word;
    case "previous-not":
      return guard.characters;
    case "lower-sign":
      return "";
    case "not-boundary":
      return guard.boundary;
    case "not-crossing":
      return [...guard.boundaries].sort(compareText).join("\u0000");
    case "not-word":
      return [...guard.words].sort(compareText).join("\u0000");
    case "not-word-ending":
      return [...guard.endings].sort(compareText).join("\u0000");
    case "first-syllable":
    case "following-not-vowel-y":
    case "not-word-end":
    case "not-word-start":
    case "not-whole-word":
    case "standing-alone":
    case "word-end":
    case "word-internal":
    case "word-start":
      return "";
  }
}

function guardOpcode(guard: ContextualRuleGuard): ContextualGuardOpcode {
  return guard.kind === "lower-sign" && guard.policy === "other"
    ? 16
    : GUARD_OPCODE[guard.kind];
}

function guardKey(guard: ContextualRuleGuard): string {
  return `${String(guardOpcode(guard)).padStart(2, "0")}:${guardOperand(guard)}`;
}

function cloneGuard(guard: ContextualRuleGuard): ContextualRuleGuard {
  switch (guard.kind) {
    case "eligibility-word":
      return { kind: guard.kind, word: guard.word };
    case "previous-not":
      return { characters: guard.characters, kind: guard.kind };
    case "lower-sign":
      return { kind: guard.kind, policy: guard.policy };
    case "not-boundary":
      return { boundary: guard.boundary, kind: guard.kind };
    case "not-crossing":
      return { boundaries: [...guard.boundaries], kind: guard.kind };
    case "not-word":
      return { kind: guard.kind, words: [...guard.words] };
    case "not-word-ending":
      return { endings: [...guard.endings], kind: guard.kind };
    case "first-syllable":
    case "following-not-vowel-y":
    case "not-word-end":
    case "not-word-start":
    case "not-whole-word":
    case "standing-alone":
    case "word-end":
    case "word-internal":
    case "word-start":
      return { kind: guard.kind };
  }
}

function cloneRule(rule: ContextualRuleSource): ContextualRuleSource {
  return {
    braille: rule.braille,
    citation: { ...rule.citation },
    guards: rule.guards.map(cloneGuard).sort((left, right) =>
      compareText(guardKey(left), guardKey(right))
    ),
    id: rule.id,
    input: rule.input,
    precedence: rule.precedence,
  };
}

function validateAndSort(
  sourceRules: readonly ContextualRuleSource[],
): readonly ContextualRuleSource[] {
  if (sourceRules.length === 0) {
    throw new ContextualRuleCompilationError(
      "unreachable-rule",
      [],
      "At least one contextual rule is required.",
    );
  }
  const ids = new Set<string>();
  const overlapKeys = new Map<string, string>();
  const rules = sourceRules.map(cloneRule);
  for (const rule of rules) {
    if (rule.input.length === 0 || rule.braille.length === 0) {
      throw new ContextualRuleCompilationError(
        "unreachable-rule",
        [rule.id],
        `Rule ${rule.id} has an empty input or output.`,
      );
    }
    if (ids.has(rule.id)) {
      throw new ContextualRuleCompilationError(
        "conflicting-rule-id",
        [rule.id, rule.id],
        `Rule id ${rule.id} is not unique.`,
      );
    }
    ids.add(rule.id);
    if (
      rule.citation.locator.trim().length === 0 ||
      rule.citation.document.trim().length === 0 ||
      !rule.citation.url.startsWith("https://iceb.org/")
    ) {
      throw new ContextualRuleCompilationError(
        "uncited-rule",
        [rule.id],
        `Rule ${rule.id} lacks an official ICEB citation.`,
      );
    }
    const guardKeys = rule.guards.map(guardKey);
    if (new Set(guardKeys).size !== guardKeys.length) {
      throw new ContextualRuleCompilationError(
        "duplicate-guard",
        [rule.id],
        `Rule ${rule.id} repeats a context guard.`,
      );
    }
    const eligibility = rule.guards.find(
      (guard): guard is Extract<ContextualRuleGuard, { kind: "eligibility-word" }> =>
        guard.kind === "eligibility-word",
    )?.word ?? "";
    const overlapKey = `${rule.input}\u0000${String(rule.precedence)}\u0000${eligibility}`;
    const previous = overlapKeys.get(overlapKey);
    if (previous !== undefined) {
      const ruleIds = [previous, rule.id].sort(compareText);
      throw new ContextualRuleCompilationError(
        "ambiguous-precedence",
        ruleIds,
        `Rules for ${JSON.stringify(rule.input)} share unresolved precedence ${String(rule.precedence)}.`,
      );
    }
    overlapKeys.set(overlapKey, rule.id);
  }
  return rules.sort((left, right) =>
    compareText(left.input, right.input) ||
    left.precedence - right.precedence ||
    compareText(left.id, right.id)
  );
}

/** Compile declarative contextual rules into a deterministic compact program. */
export function compileContextualRules(
  sourceRules: readonly ContextualRuleSource[],
): ContextualCompilationResult {
  const provenance = validateAndSort(sourceRules);
  const operands = [...new Set(
    provenance.flatMap((rule) => rule.guards.map(guardOperand)),
  )].sort(compareText);
  const operandIndexes = new Map(
    operands.map((operand, index): readonly [string, number] => [operand, index]),
  );
  const guards: CompiledContextualGuard[] = [];
  const rules: CompiledContextualRule[] = [];
  for (const rule of provenance) {
    const guardOffset = guards.length;
    for (const guard of rule.guards) {
      const operandIndex = operandIndexes.get(guardOperand(guard));
      if (operandIndex === undefined) {
        throw new Error("Contextual compiler invariant failed: missing operand.");
      }
      guards.push([guardOpcode(guard), operandIndex]);
    }
    rules.push([
      rule.input,
      rule.braille,
      rule.precedence,
      guardOffset,
      guards.length - guardOffset,
    ]);
  }
  return {
    provenance,
    runtime: { guards, rules, stringOperands: operands },
  };
}

import type { IcebRuleCitation } from "./source.js";
import type {
  ContextualBoundaryKind,
  ContextualBoundaryMask,
  ContextualGuardOpcode,
  ContextualGuardTuple,
  ContextualPrecedence,
  ContextualRuleTuple,
} from "../../src/contextual-transducer.js";

export type { ContextualPrecedence } from "../../src/contextual-transducer.js";

export type ContextualRuleGuard =
  | { readonly kind: "eligibility-word"; readonly word: string }
  | { readonly kind: "first-syllable" }
  | { readonly kind: "following-not-vowel-y" }
  | { readonly kind: "lower-sign"; readonly policy: "enough-or-in" | "other" }
  | { readonly kind: "not-boundary"; readonly boundary: ContextualBoundaryKind }
  | {
      readonly kind: "not-crossing";
      readonly boundaries: readonly ContextualBoundaryKind[];
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

export type CompiledContextualGuard = ContextualGuardTuple;
export type CompiledContextualRule = ContextualRuleTuple;

export interface CompiledContextualMatcher {
  readonly initialGuardOffsets: readonly number[];
  readonly initialInputOffsets: readonly number[];
  readonly initialRuleOffsets: readonly number[];
  readonly inputGuardCounts: readonly number[];
  readonly inputRuleCounts: readonly number[];
  readonly inputs: readonly string[];
}

export interface ContextualCompiledProgram {
  readonly guards: readonly CompiledContextualGuard[];
  readonly matcher: CompiledContextualMatcher;
  readonly rules: readonly CompiledContextualRule[];
  readonly stringOperands: readonly string[];
}

function compileMatcher(
  inputs: readonly string[],
  inputRuleCounts: readonly number[],
  inputGuardCounts: readonly number[],
): CompiledContextualMatcher {
  const initialGuardOffsets: number[] = [];
  const initialInputOffsets: number[] = [];
  const initialRuleOffsets: number[] = [];
  for (let codePoint = 97; codePoint <= 123; codePoint += 1) {
    const found = inputs.findIndex((input) => input.charCodeAt(0) >= codePoint);
    const cursor = found < 0 ? inputs.length : found;
    initialInputOffsets.push(cursor);
    initialRuleOffsets.push(
      inputRuleCounts.slice(0, cursor).reduce((total, count) => total + count, 0),
    );
    initialGuardOffsets.push(
      inputGuardCounts.slice(0, cursor).reduce((total, count) => total + count, 0),
    );
  }
  return {
    initialGuardOffsets,
    initialInputOffsets,
    initialRuleOffsets,
    inputGuardCounts,
    inputRuleCounts,
    inputs: [...inputs],
  };
}

export interface ContextualCompilationResult {
  readonly provenance: readonly ContextualRuleSource[];
  readonly runtime: ContextualCompiledProgram;
}

function countsFromOffsets(offsets: readonly number[]): readonly number[] {
  const counts: number[] = [];
  let previous = 0;
  for (const current of offsets.slice(1)) {
    counts.push(current - previous);
    previous = current;
  }
  return counts;
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

function guardStringOperand(guard: ContextualRuleGuard): string | undefined {
  switch (guard.kind) {
    case "eligibility-word":
      return guard.word;
    case "previous-not":
      return guard.characters;
    case "not-word":
      return [...guard.words].sort(compareText).join("\u0000");
    case "not-word-ending":
      return [...guard.endings].sort(compareText).join("\u0000");
    case "first-syllable":
    case "following-not-vowel-y":
    case "lower-sign":
    case "not-boundary":
    case "not-crossing":
    case "not-word-end":
    case "not-word-start":
    case "not-whole-word":
    case "standing-alone":
    case "word-end":
    case "word-internal":
    case "word-start":
      return undefined;
  }
}

const BOUNDARY_BITS = {
  "braille-line": 1,
  compound: 2,
  prefix: 4,
  suffix: 8,
  syllable: 16,
} satisfies Readonly<Record<ContextualBoundaryKind, ContextualBoundaryMask>>;

function boundaryBit(kind: ContextualBoundaryKind): ContextualBoundaryMask {
  return BOUNDARY_BITS[kind];
}

function isBoundaryMask(value: number): value is ContextualBoundaryMask {
  return Number.isInteger(value) && value >= 1 && value <= 31;
}

function boundaryMask(boundaries: readonly ContextualBoundaryKind[]): ContextualBoundaryMask {
  let mask = 0;
  for (const boundary of boundaries) {
    mask |= boundaryBit(boundary);
  }
  if (!isBoundaryMask(mask)) {
    throw new Error("A contextual boundary guard must name at least one boundary.");
  }
  return mask;
}

function guardOpcode(guard: ContextualRuleGuard): ContextualGuardOpcode {
  return guard.kind === "lower-sign" && guard.policy === "other"
    ? 16
    : GUARD_OPCODE[guard.kind];
}

function guardKey(guard: ContextualRuleGuard): string {
  const operand = guard.kind === "not-boundary"
    ? boundaryMask([guard.boundary])
    : guard.kind === "not-crossing"
      ? boundaryMask(guard.boundaries)
      : guardStringOperand(guard) ?? "";
  return `${String(guardOpcode(guard)).padStart(2, "0")}:${String(operand)}`;
}

export function requireContextualOperandIndex(
  value: string,
  operandIndexes: ReadonlyMap<string, number>,
): number {
  const index = operandIndexes.get(value);
  if (index === undefined) {
    throw new Error(`Contextual guard operand was not collected: ${JSON.stringify(value)}`);
  }
  return index;
}

function compileGuard(
  guard: ContextualRuleGuard,
  operandIndexes: ReadonlyMap<string, number>,
): CompiledContextualGuard {
  switch (guard.kind) {
    case "eligibility-word":
      return [0, requireContextualOperandIndex(guard.word, operandIndexes)];
    case "first-syllable":
      return [1];
    case "following-not-vowel-y":
      return [2];
    case "lower-sign":
      return guard.policy === "enough-or-in" ? [3] : [16];
    case "not-boundary":
      return [4, boundaryMask([guard.boundary])];
    case "not-crossing":
      return [5, boundaryMask(guard.boundaries)];
    case "not-word":
      return [6, requireContextualOperandIndex(
        [...guard.words].sort(compareText).join("\u0000"),
        operandIndexes,
      )];
    case "not-word-ending":
      return [7, requireContextualOperandIndex(
        [...guard.endings].sort(compareText).join("\u0000"),
        operandIndexes,
      )];
    case "not-word-end":
      return [8];
    case "not-word-start":
      return [9];
    case "not-whole-word":
      return [10];
    case "previous-not":
      return [11, requireContextualOperandIndex(guard.characters, operandIndexes)];
    case "standing-alone":
      return [12];
    case "word-end":
      return [13];
    case "word-internal":
      return [14];
    case "word-start":
      return [15];
  }
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
    if (!/^[a-z]+$/u.test(rule.input)) {
      throw new ContextualRuleCompilationError(
        "unreachable-rule",
        [rule.id],
        `Rule ${rule.id} has input outside the lowercase ASCII matcher alphabet.`,
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
    provenance.flatMap((rule) =>
      rule.guards.flatMap((guard) => {
        const operand = guardStringOperand(guard);
        return operand === undefined ? [] : [operand];
      })
    ),
  )].sort(compareText);
  const operandIndexes: ReadonlyMap<string, number> = new Map(
    operands.map((operand, index): readonly [string, number] => [operand, index]),
  );
  const guards: CompiledContextualGuard[] = [];
  const rules: CompiledContextualRule[] = [];
  const matcherInputs: string[] = [];
  const matcherGuardOffsets: number[] = [];
  const matcherRuleOffsets: number[] = [];
  let previousInput: string | undefined;
  for (const rule of provenance) {
    if (rule.input !== previousInput) {
      matcherInputs.push(rule.input);
      matcherGuardOffsets.push(guards.length);
      matcherRuleOffsets.push(rules.length);
      previousInput = rule.input;
    }
    const guardOffset = guards.length;
    for (const guard of rule.guards) {
      guards.push(compileGuard(guard, operandIndexes));
    }
    rules.push([
      rule.braille,
      rule.precedence,
      guards.length - guardOffset,
    ]);
  }
  matcherGuardOffsets.push(guards.length);
  matcherRuleOffsets.push(rules.length);
  const matcherGuardCounts = countsFromOffsets(matcherGuardOffsets);
  const matcherRuleCounts = countsFromOffsets(matcherRuleOffsets);
  return {
    provenance,
    runtime: {
      guards,
      matcher: compileMatcher(
        matcherInputs,
        matcherRuleCounts,
        matcherGuardCounts,
      ),
      rules,
      stringOperands: operands,
    },
  };
}

import type { IcebRuleCitation } from "./source.js";
import {
  CONTEXTUAL_BOUNDARY_MASKS,
  CONTEXTUAL_GUARD_SCHEMA,
} from "../../src/contextual-schema.js";
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
  | { readonly kind: "eligibility-word"; readonly pluralSuffix: string; readonly word: string }
  | { readonly kind: "first-syllable" }
  | { readonly characters: string; readonly kind: "following" }
  | { readonly characters: string; readonly kind: "following-not-vowel-y" }
  | { readonly kind: "lower-sign"; readonly policy: "enough-or-in" | "other" }
  | { readonly kind: "not-boundary"; readonly boundary: ContextualBoundaryKind }
  | {
      readonly kind: "not-crossing";
      readonly boundaries: readonly ContextualBoundaryKind[];
    }
  | { readonly ignoredCharacters: string; readonly kind: "not-word"; readonly words: readonly string[] }
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
  readonly bucketAlphabet: readonly string[];
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
  bucketAlphabet: readonly string[],
  inputs: readonly string[],
  inputRuleCounts: readonly number[],
  inputGuardCounts: readonly number[],
): CompiledContextualMatcher {
  const initialGuardOffsets: number[] = [];
  const initialInputOffsets: number[] = [];
  const initialRuleOffsets: number[] = [];
  for (const initial of [...bucketAlphabet, undefined]) {
    const found = initial === undefined
      ? inputs.length
      : inputs.findIndex((input) =>
          compareText(Array.from(input).slice(0, 1).join(""), initial) >= 0
        );
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
    bucketAlphabet,
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

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function guardStringOperands(guard: ContextualRuleGuard): readonly string[] {
  switch (guard.kind) {
    case "eligibility-word":
      return [guard.word, guard.pluralSuffix];
    case "following":
    case "following-not-vowel-y":
      return [guard.characters];
    case "previous-not":
      return [guard.characters];
    case "not-word":
      return [[...guard.words].sort(compareText).join("\u0000"), guard.ignoredCharacters];
    case "not-word-ending":
      return [[...guard.endings].sort(compareText).join("\u0000")];
    case "first-syllable":
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
      return [];
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
  return CONTEXTUAL_BOUNDARY_MASKS.some((candidate) => candidate === value);
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
  switch (guard.kind) {
    case "eligibility-word":
      return CONTEXTUAL_GUARD_SCHEMA.eligibilityWord.opcode;
    case "first-syllable":
      return CONTEXTUAL_GUARD_SCHEMA.firstSyllable.opcode;
    case "following":
      return CONTEXTUAL_GUARD_SCHEMA.following.opcode;
    case "following-not-vowel-y":
      return CONTEXTUAL_GUARD_SCHEMA.followingNotVowelY.opcode;
    case "lower-sign":
      return guard.policy === "enough-or-in"
        ? CONTEXTUAL_GUARD_SCHEMA.lowerSignEnoughOrIn.opcode
        : CONTEXTUAL_GUARD_SCHEMA.lowerSignOther.opcode;
    case "not-boundary":
      return CONTEXTUAL_GUARD_SCHEMA.notBoundary.opcode;
    case "not-crossing":
      return CONTEXTUAL_GUARD_SCHEMA.notCrossing.opcode;
    case "not-word":
      return CONTEXTUAL_GUARD_SCHEMA.notWord.opcode;
    case "not-word-ending":
      return CONTEXTUAL_GUARD_SCHEMA.notWordEnding.opcode;
    case "not-word-end":
      return CONTEXTUAL_GUARD_SCHEMA.notWordEnd.opcode;
    case "not-word-start":
      return CONTEXTUAL_GUARD_SCHEMA.notWordStart.opcode;
    case "not-whole-word":
      return CONTEXTUAL_GUARD_SCHEMA.notWholeWord.opcode;
    case "previous-not":
      return CONTEXTUAL_GUARD_SCHEMA.previousNot.opcode;
    case "standing-alone":
      return CONTEXTUAL_GUARD_SCHEMA.standingAlone.opcode;
    case "word-end":
      return CONTEXTUAL_GUARD_SCHEMA.wordEnd.opcode;
    case "word-internal":
      return CONTEXTUAL_GUARD_SCHEMA.wordInternal.opcode;
    case "word-start":
      return CONTEXTUAL_GUARD_SCHEMA.wordStart.opcode;
  }
}

function guardKey(guard: ContextualRuleGuard): string {
  const operand = guard.kind === "not-boundary"
    ? boundaryMask([guard.boundary])
    : guard.kind === "not-crossing"
      ? boundaryMask(guard.boundaries)
      : guardStringOperands(guard).join("\u0001");
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
      return [
        CONTEXTUAL_GUARD_SCHEMA.eligibilityWord.opcode,
        requireContextualOperandIndex(guard.word, operandIndexes),
        requireContextualOperandIndex(guard.pluralSuffix, operandIndexes),
      ];
    case "first-syllable":
      return [CONTEXTUAL_GUARD_SCHEMA.firstSyllable.opcode];
    case "following":
      return [
        CONTEXTUAL_GUARD_SCHEMA.following.opcode,
        requireContextualOperandIndex(guard.characters, operandIndexes),
      ];
    case "following-not-vowel-y":
      return [
        CONTEXTUAL_GUARD_SCHEMA.followingNotVowelY.opcode,
        requireContextualOperandIndex(guard.characters, operandIndexes),
      ];
    case "lower-sign":
      return guard.policy === "enough-or-in"
        ? [CONTEXTUAL_GUARD_SCHEMA.lowerSignEnoughOrIn.opcode]
        : [CONTEXTUAL_GUARD_SCHEMA.lowerSignOther.opcode];
    case "not-boundary":
      return [CONTEXTUAL_GUARD_SCHEMA.notBoundary.opcode, boundaryMask([guard.boundary])];
    case "not-crossing":
      return [CONTEXTUAL_GUARD_SCHEMA.notCrossing.opcode, boundaryMask(guard.boundaries)];
    case "not-word":
      return [
        CONTEXTUAL_GUARD_SCHEMA.notWord.opcode,
        requireContextualOperandIndex(
          [...guard.words].sort(compareText).join("\u0000"),
          operandIndexes,
        ),
        requireContextualOperandIndex(guard.ignoredCharacters, operandIndexes),
      ];
    case "not-word-ending":
      return [CONTEXTUAL_GUARD_SCHEMA.notWordEnding.opcode, requireContextualOperandIndex(
        [...guard.endings].sort(compareText).join("\u0000"),
        operandIndexes,
      )];
    case "not-word-end":
      return [CONTEXTUAL_GUARD_SCHEMA.notWordEnd.opcode];
    case "not-word-start":
      return [CONTEXTUAL_GUARD_SCHEMA.notWordStart.opcode];
    case "not-whole-word":
      return [CONTEXTUAL_GUARD_SCHEMA.notWholeWord.opcode];
    case "previous-not":
      return [
        CONTEXTUAL_GUARD_SCHEMA.previousNot.opcode,
        requireContextualOperandIndex(guard.characters, operandIndexes),
      ];
    case "standing-alone":
      return [CONTEXTUAL_GUARD_SCHEMA.standingAlone.opcode];
    case "word-end":
      return [CONTEXTUAL_GUARD_SCHEMA.wordEnd.opcode];
    case "word-internal":
      return [CONTEXTUAL_GUARD_SCHEMA.wordInternal.opcode];
    case "word-start":
      return [CONTEXTUAL_GUARD_SCHEMA.wordStart.opcode];
  }
}

function cloneGuard(guard: ContextualRuleGuard): ContextualRuleGuard {
  switch (guard.kind) {
    case "eligibility-word":
      return { kind: guard.kind, pluralSuffix: guard.pluralSuffix, word: guard.word };
    case "following":
    case "following-not-vowel-y":
      return { characters: guard.characters, kind: guard.kind };
    case "previous-not":
      return { characters: guard.characters, kind: guard.kind };
    case "lower-sign":
      return { kind: guard.kind, policy: guard.policy };
    case "not-boundary":
      return { boundary: guard.boundary, kind: guard.kind };
    case "not-crossing":
      return { boundaries: [...guard.boundaries], kind: guard.kind };
    case "not-word":
      return {
        ignoredCharacters: guard.ignoredCharacters,
        kind: guard.kind,
        words: [...guard.words],
      };
    case "not-word-ending":
      return { endings: [...guard.endings], kind: guard.kind };
    case "first-syllable":
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
    input: rule.input.toLowerCase(),
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
  alphabet?: readonly string[],
): ContextualCompilationResult {
  const provenance = validateAndSort(sourceRules);
  const bucketAlphabet = [...new Set(
    (alphabet ?? provenance.flatMap((rule) => Array.from(rule.input)))
      .map((entry) => entry.toLowerCase()),
  )].sort(compareText);
  if (
    bucketAlphabet.length === 0 ||
    bucketAlphabet.some((entry) => Array.from(entry).length !== 1) ||
    new Set(bucketAlphabet).size !== bucketAlphabet.length ||
    provenance.some((rule) =>
      Array.from(rule.input).some((character) => !bucketAlphabet.includes(character))
    )
  ) {
    throw new ContextualRuleCompilationError(
      "unreachable-rule",
      provenance.map((rule) => rule.id),
      "The contextual matcher alphabet is incomplete or malformed.",
    );
  }
  const operands = [...new Set(
    provenance.flatMap((rule) =>
      rule.guards.flatMap((guard) => {
        return guardStringOperands(guard);
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
        bucketAlphabet,
        matcherInputs,
        matcherRuleCounts,
        matcherGuardCounts,
      ),
      rules,
      stringOperands: operands,
    },
  };
}

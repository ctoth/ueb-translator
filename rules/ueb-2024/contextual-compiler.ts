import type { IcebRuleCitation } from "./source.js";
import {
  guardOpcode,
  guardOperands,
  guardStringOperands,
  readGuard,
  type ContextualRuleGuard,
} from "./contextual-engine.js";

import {
  contextualGuardTuple,
  type ContextualPrecedence,
} from "../../src/contextual-schema.js";
import type { ContextualGuardTuple, ContextualRuleTuple } from "../../src/contextual-transducer.js";

export type { ContextualRuleGuard } from "./contextual-engine.js";
export type { ContextualPrecedence } from "../../src/contextual-schema.js";

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

function guardKey(guard: ContextualRuleGuard): string {
  return `${String(guardOpcode(guard)).padStart(2, "0")}:${guardOperands(guard).join("\u0001")}`;
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
  return contextualGuardTuple([guardOpcode(guard), ...guardOperands(guard).map((operand) =>
    typeof operand === "string" ? requireContextualOperandIndex(operand, operandIndexes) : operand
  )], operandIndexes.size);
}

function cloneRule(rule: ContextualRuleSource): ContextualRuleSource {
  return {
    braille: rule.braille,
    citation: { ...rule.citation },
    guards: rule.guards.map(readGuard).sort((left, right) =>
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
      rule.citation.authority !== "ICEB"
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
    const eligibility = rule.guards.find((guard) => guard.kind === "eligibility-word")?.["word"] ?? "";
    const overlapKey = `${rule.input}\u0000${String(rule.precedence)}\u0000${String(eligibility)}`;
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
    provenance.flatMap((rule) => rule.guards.flatMap(guardStringOperands)),
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

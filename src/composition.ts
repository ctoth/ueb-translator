import {
  runContextualTransducer,
  type ComposedContractionProgram,
  type ContextualAppliedRule,
  type ContextualBoundary,
} from "./contextual-transducer.js";
import {
  emitCompositionUnit,
  parseCompositionText,
  resolveCompositionModes,
  type CompositionUnit,
  type Grade1UnsupportedCharacter,
} from "./grade1-runtime.js";
import type { ModeProgram } from "./mode-engine.js";
import type { SymbolProgram } from "./symbol-program.js";

export interface CompositionPolicies {
  readonly closingStandingPunctuation: string;
  readonly lowerPunctuation: string;
  readonly openingStandingPunctuation: string;
  readonly standingBoundaries: string;
}

export interface CompositionTextOptions {
  readonly boundaries?: readonly ContextualBoundary[];
  readonly globalOffset?: number;
  readonly standing?: boolean;
}

export interface CompositionSuccess {
  readonly braille: string;
  readonly ok: true;
  readonly rules: readonly ContextualAppliedRule[];
}

export type CompositionResult = CompositionSuccess | Grade1UnsupportedCharacter;

export interface ComposedTranslator {
  readonly translate: (
    text: string,
    options?: CompositionTextOptions,
  ) => CompositionResult;
}

interface UnitRange {
  readonly end: number;
  readonly start: number;
}

function requiredValue<Value>(
  value: Value | undefined,
  message: string,
): Value {
  /* v8 ignore next -- callers establish each array/range invariant. */
  if (value === undefined) throw new Error(message);
  return value;
}

function isOneOf(value: string, values: string): boolean {
  return value.length > 0 && values.includes(value);
}

function isStandingBoundary(
  unit: CompositionUnit,
  policies: CompositionPolicies,
): boolean {
  return unit.kind === "line-boundary" ||
    isOneOf(unit.source, policies.standingBoundaries);
}

function isLexicalJoiner(unit: CompositionUnit): boolean {
  return unit.kind === "symbol" && isOneOf(unit.source, "'’–—-");
}

function lexicalRanges(units: readonly CompositionUnit[]): readonly UnitRange[] {
  const ranges: UnitRange[] = [];
  let start: number | undefined;
  let hasLetter = false;
  for (let index = 0; index <= units.length; index += 1) {
    const unit = units[index];
    if (unit?.kind === "letter" || (unit !== undefined && isLexicalJoiner(unit))) {
      start ??= index;
      hasLetter ||= unit.kind === "letter";
      continue;
    }
    if (start !== undefined && hasLetter) ranges.push({ end: index, start });
    start = undefined;
    hasLetter = false;
  }
  return ranges;
}

function standingAt(
  units: readonly CompositionUnit[],
  range: UnitRange,
  policies: CompositionPolicies,
): boolean {
  let before = range.start - 1;
  while (
    before >= 0 &&
    /* v8 ignore next -- the index is bounded by the units array. */
    isOneOf(units[before]?.source ?? "", policies.openingStandingPunctuation)
  ) before -= 1;
  if (
    before >= 0 &&
    !isStandingBoundary(requiredValue(units[before], "Missing preceding unit."), policies)
  ) return false;

  let after = range.end;
  while (
    after < units.length &&
    /* v8 ignore next -- the index is bounded by the units array. */
    isOneOf(units[after]?.source ?? "", policies.closingStandingPunctuation)
  ) after += 1;
  return after >= units.length || isStandingBoundary(
    requiredValue(units[after], "Missing following unit."),
    policies,
  );
}

function lowerSignContext(
  units: readonly CompositionUnit[],
  range: UnitRange,
  policies: CompositionPolicies,
): { readonly hasLowerPunctuation: boolean; readonly hasUpperPunctuation: boolean } {
  let hasLowerPunctuation = false;
  let hasUpperPunctuation = false;
  const inspect = (initial: number, step: -1 | 1): void => {
    let index = initial;
    while (index >= 0 && index < units.length) {
      const unit = units[index];
      if (unit === undefined || unit.kind === "letter" || unit.kind === "digit" ||
        unit.kind === "space" || unit.kind === "line-boundary") break;
      if (isOneOf(unit.source, policies.lowerPunctuation)) {
        hasLowerPunctuation = true;
      } else {
        hasUpperPunctuation = true;
      }
      index += step;
    }
  };
  inspect(range.start - 1, -1);
  inspect(range.end, 1);
  return { hasLowerPunctuation, hasUpperPunctuation };
}

function asciiBase(unit: CompositionUnit): string | undefined {
  if (unit.kind !== "letter" || unit.modifiers.length > 0) return undefined;
  const base = unit.source.normalize("NFD").charAt(0).toLowerCase();
  /* v8 ignore next -- supported non-ASCII letters are literal span breaks. */
  return /^[a-z]$/u.test(base) ? base : undefined;
}

function exactLetterPrint(
  units: readonly CompositionUnit[],
  range: UnitRange,
): string {
  let print = "";
  for (let index = range.start; index < range.end; index += 1) {
    const unit = requiredValue(units[index], "Missing contraction unit.");
    print += requiredValue(
      asciiBase(unit),
      "Contraction range contains a non-ASCII letter.",
    );
  }
  return print;
}

function contractionRanges(
  units: readonly CompositionUnit[],
  lexical: UnitRange,
): readonly UnitRange[] {
  const ranges: UnitRange[] = [];
  let start: number | undefined;
  for (let index = lexical.start; index <= lexical.end; index += 1) {
    const unit = units[index];
    if (unit !== undefined && asciiBase(unit) !== undefined) {
      start ??= index;
      continue;
    }
    if (start !== undefined) ranges.push({ end: index, start });
    start = undefined;
  }
  return ranges;
}

function contractionPreservesCapitals(
  units: readonly CompositionUnit[],
  range: UnitRange,
): boolean {
  const uppercase = units.slice(range.start, range.end).map((unit) =>
    unit.kind === "letter" && unit.uppercase
  );
  return uppercase.every(Boolean) ||
    uppercase.every((value, index) => index === 0 ? value : !value) ||
    uppercase.every((value) => !value);
}

/**
 * Compose compiled symbols and modes with optional contextual contractions.
 * Symbols and modes are explicit arguments so Grade 1 and Grade 2 share the
 * same construction boundary; their closed walkers live in grade1-runtime.
 */
export function compose(
  symbols: SymbolProgram,
  modes: ModeProgram,
  policies: CompositionPolicies,
  contractions?: ComposedContractionProgram,
): ComposedTranslator {
  // Reject mismatched empty packages at the composition boundary.
  if (symbols.symbols.length === 0 || modes.modes.length === 0) {
    throw new Error("A composition requires compiled symbol and mode programs.");
  }

  return {
    translate(text, options = {}) {
      const parsed = parseCompositionText(text);
      if (!parsed.ok) return parsed;
      const { units } = parsed;
      const emissions = units.map(emitCompositionUnit);
      const required = new Set<number>();
      const rules: ContextualAppliedRule[] = [];
      const offsets: number[] = [];
      let offset = 0;
      for (const unit of units) {
        offsets.push(offset);
        offset += unit.source.length;
      }

      if (contractions !== undefined) {
        const ambiguityPrints = new Set(
          contractions.grade1Ambiguities.map(([print]) => print),
        );
        const standingLiteralInputs = new Set(contractions.standingLiteralInputs);
        for (const lexical of lexicalRanges(units)) {
          const standing = options.standing ?? standingAt(units, lexical, policies);
          const eligibilityWord = units.slice(lexical.start, lexical.end)
            .map((unit) => asciiBase(unit) ?? unit.source.toLowerCase())
            .join("");
          for (const range of contractionRanges(units, lexical)) {
            const exact = exactLetterPrint(units, range);
            if (standing && ambiguityPrints.has(exact)) {
              for (let index = range.start; index < range.end; index += 1) {
                requiredValue(units[index], "Missing lexical unit.");
                required.add(index);
              }
              continue;
            }
            if (standing && standingLiteralInputs.has(exact)) {
              continue;
            }
            const lowerContext = lowerSignContext(units, range, policies);
            const word = units.slice(range.start, range.end)
              .map((unit) => requiredValue(
                asciiBase(unit),
                "Contraction range contains a non-ASCII letter.",
              ))
              .join("");
            const eligibilityOffset = units.slice(lexical.start, range.start)
              .reduce((total, unit) => total + unit.source.length, 0);
            const translated = runContextualTransducer(
              contractions,
              {
                boundaries: (options.boundaries ?? [])
                  .filter((boundary) => {
                    /* v8 ignore next -- every range start is a parsed unit index. */
                    const start = offsets[range.start] ?? 0;
                    const end = offsets[range.end] ?? text.length;
                    return boundary.at > start && boundary.at < end;
                  })
                  .map((boundary) => ({
                    /* v8 ignore next -- every range start is a parsed unit index. */
                    at: boundary.at - (offsets[range.start] ?? 0),
                    kind: boundary.kind,
                  })),
                eligibilityOffset,
                eligibilityWord,
                hasLowerPunctuation: lowerContext.hasLowerPunctuation,
                hasUpperPunctuation: lowerContext.hasUpperPunctuation,
                standing,
                word,
              },
              (character) => {
                const index = word.indexOf(character);
                const unit = units[range.start + Math.max(index, 0)];
                /* v8 ignore next -- the literal callback receives a character in word. */
                return unit === undefined ? "" : emitCompositionUnit(unit);
              },
            );
            for (const applied of translated.rules) {
              const start = range.start + applied.start;
              const end = range.start + applied.end;
              const rule = contractions.rules[applied.ruleIndex];
              /* v8 ignore next -- applied rules originate in this program. */
              if (rule === undefined) continue;
              if (!contractionPreservesCapitals(units, { end, start })) continue;
              emissions[start] = rule[0];
              for (let index = start + 1; index < end; index += 1) emissions[index] = "";
              rules.push({
                ...applied,
                end: (options.globalOffset ?? 0) + (offsets[end] ?? text.length),
                start: (options.globalOffset ?? 0) +
                  requiredValue(offsets[start], "Missing applied-rule offset."),
              });
            }
          }
        }
      }

      const modePlan = resolveCompositionModes(units, required);
      let braille = "";
      for (const [index] of units.entries()) {
        braille += (modePlan.prefixes.get(index) ?? "") +
          requiredValue(emissions[index], "Missing unit emission.") +
          (modePlan.suffixes.get(index) ?? "");
      }
      return { braille, ok: true, rules };
    },
  };
}

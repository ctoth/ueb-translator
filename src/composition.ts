import {
  runContextualTransducer,
  type ComposedContractionProgram,
  type ContextualAppliedRule,
  type ContextualBoundary,
} from "./contextual-transducer.js";
import {
  emitCompositionUnit,
  parseCompositionTextWithSymbols,
  resolveAsciiDoubleQuotes,
  resolveCompositionModes,
  type CompositionModePlan,
  type CompositionUnit,
  type Grade1UnsupportedCharacter,
} from "./grade1-runtime.js";
import type { ModeProgram } from "./mode-engine.js";
import {
  loadSymbolProgram,
  type SymbolProgram,
} from "./symbol-program.js";

export interface CompositionPolicies {
  readonly closingStandingPunctuation: string;
  readonly dashJoiners: string;
  readonly elisionPunctuation: string;
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

function isLexicalJoiner(
  unit: CompositionUnit,
  policies: CompositionPolicies,
): boolean {
  return unit.kind === "symbol" && (
    isOneOf(unit.source, policies.elisionPunctuation) ||
    isOneOf(unit.source, policies.dashJoiners)
  );
}

function isDashJoiner(
  unit: CompositionUnit | undefined,
  policies: CompositionPolicies,
): boolean {
  return unit?.kind === "symbol" && isOneOf(unit.source, policies.dashJoiners);
}

function eligibilityCharacter(
  unit: CompositionUnit,
  policies: CompositionPolicies,
  bucketAlphabet: readonly string[],
): string {
  const base = programBase(unit, bucketAlphabet);
  if (base !== undefined) return base;
  const canonicalElision = Array.from(policies.elisionPunctuation)[0];
  if (
    canonicalElision !== undefined && unit.kind === "symbol" &&
    isOneOf(unit.source, policies.elisionPunctuation)
  ) {
    return canonicalElision;
  }
  return unit.source.toLowerCase();
}

function lexicalRanges(
  units: readonly CompositionUnit[],
  policies: CompositionPolicies,
): readonly UnitRange[] {
  const ranges: UnitRange[] = [];
  let start: number | undefined;
  let hasLetter = false;
  for (let index = 0; index <= units.length; index += 1) {
    const unit = units[index];
    if (unit?.kind === "letter" ||
      (unit !== undefined && isLexicalJoiner(unit, policies))) {
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
): {
  readonly hasLowerPunctuation: boolean;
  readonly hasRestrictingLowerPunctuation: boolean;
  readonly hasUpperPunctuation: boolean;
} {
  let hasLowerPunctuation = false;
  let hasRestrictingLowerPunctuation = false;
  let hasUpperPunctuation = false;
  const inspect = (initial: number, step: -1 | 1): void => {
    let index = initial;
    while (index >= 0 && index < units.length) {
      const unit = units[index];
      if (unit === undefined || unit.kind === "letter" || unit.kind === "digit" ||
        unit.kind === "space" || unit.kind === "line-boundary") break;
      if (isOneOf(unit.source, policies.lowerPunctuation)) {
        hasLowerPunctuation = true;
        const joinsLetters = isOneOf(unit.source, policies.elisionPunctuation) &&
          units[index - 1]?.kind === "letter" && units[index + 1]?.kind === "letter";
        hasRestrictingLowerPunctuation ||= !joinsLetters;
      } else {
        hasUpperPunctuation = true;
      }
      index += step;
    }
  };
  inspect(range.start - 1, -1);
  inspect(range.end, 1);
  return {
    hasLowerPunctuation,
    hasRestrictingLowerPunctuation,
    hasUpperPunctuation,
  };
}

function programBase(
  unit: CompositionUnit,
  bucketAlphabet: readonly string[],
): string | undefined {
  if (unit.kind !== "letter" || unit.modifiers.length > 0) return undefined;
  const base = unit.source.normalize("NFD").charAt(0).toLowerCase();
  return bucketAlphabet.includes(base) ? base : undefined;
}

function exactLetterPrint(
  units: readonly CompositionUnit[],
  range: UnitRange,
  bucketAlphabet: readonly string[],
): string {
  let print = "";
  for (let index = range.start; index < range.end; index += 1) {
    const unit = requiredValue(units[index], "Missing contraction unit.");
    print += requiredValue(
      programBase(unit, bucketAlphabet),
      "Contraction range contains a letter outside the program alphabet.",
    );
  }
  return print;
}

function contractionRanges(
  units: readonly CompositionUnit[],
  lexical: UnitRange,
  bucketAlphabet: readonly string[],
): readonly UnitRange[] {
  const ranges: UnitRange[] = [];
  let start: number | undefined;
  for (let index = lexical.start; index <= lexical.end; index += 1) {
    const unit = units[index];
    if (unit !== undefined && programBase(unit, bucketAlphabet) !== undefined) {
      start ??= index;
      continue;
    }
    if (start !== undefined) ranges.push({ end: index, start });
    start = undefined;
  }
  return ranges;
}

function isCompleteAmbiguityLiteral(
  units: readonly CompositionUnit[],
  range: UnitRange,
  component: UnitRange,
  policies: CompositionPolicies,
  bucketAlphabet: readonly string[],
): boolean {
  if (range.start !== component.start) return false;
  if (range.end === component.end) return true;
  if (range.end + 2 !== component.end) return false;
  const apostrophe = units[range.end];
  const suffix = units[range.end + 1];
  return apostrophe?.kind === "symbol" &&
    isOneOf(apostrophe.source, policies.elisionPunctuation) &&
    suffix !== undefined && programBase(suffix, bucketAlphabet) === "s";
}

function dashComponentAt(
  units: readonly CompositionUnit[],
  lexical: UnitRange,
  range: UnitRange,
  policies: CompositionPolicies,
): UnitRange {
  let start = range.start;
  while (start > lexical.start && !isDashJoiner(units[start - 1], policies)) start -= 1;
  let end = range.end;
  while (end < lexical.end && !isDashJoiner(units[end], policies)) end += 1;
  return { end, start };
}

function hasOnlyProgramLiteralLetters(
  units: readonly CompositionUnit[],
  range: UnitRange,
  bucketAlphabet: readonly string[],
): boolean {
  return units.slice(range.start, range.end)
    .every((unit) =>
      unit.kind !== "letter" || programBase(unit, bucketAlphabet) !== undefined
    );
}

function canCollapseModeSpan(
  plan: CompositionModePlan,
  range: UnitRange,
  requireStableAdjacentModes = false,
): boolean {
  for (let index = range.start + 1; index < range.end; index += 1) {
    if ((plan.prefixes.get(index) ?? "").length > 0) return false;
  }
  for (let index = range.start; index < range.end - 1; index += 1) {
    if ((plan.suffixes.get(index) ?? "").length > 0) return false;
  }
  if (
    requireStableAdjacentModes && (
      (plan.suffixes.get(range.end - 1) ?? "").length > 0 ||
      (plan.prefixes.get(range.end) ?? "").length > 0
    )
  ) return false;
  return true;
}

function remapCollapsedModes(
  plan: CompositionModePlan,
  ranges: readonly UnitRange[],
): CompositionModePlan {
  if (ranges.length === 0) return plan;
  const prefixes = new Map(plan.prefixes);
  const suffixes = new Map(plan.suffixes);
  for (const range of ranges) {
    for (let index = range.start + 1; index < range.end; index += 1) {
      prefixes.delete(index);
    }
    const finalIndex = range.end - 1;
    if (finalIndex !== range.start) {
      const suffix = suffixes.get(finalIndex) ?? "";
      suffixes.delete(finalIndex);
      if (suffix.length > 0) {
        suffixes.set(range.start, (suffixes.get(range.start) ?? "") + suffix);
      }
    }
  }
  return { prefixes, suffixes };
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
  const symbolRuntime = loadSymbolProgram(symbols);

  return {
    translate(text, options = {}) {
      const parsed = parseCompositionTextWithSymbols(text, symbolRuntime);
      if (!parsed.ok) return parsed;
      const { units } = parsed;
      const asciiDoubleQuotes = resolveAsciiDoubleQuotes(units);
      const emissions = units.map((unit, index) =>
        asciiDoubleQuotes[index] ?? emitCompositionUnit(unit)
      );
      const required = new Set<number>();
      const rules: ContextualAppliedRule[] = [];
      const collapsedRanges: UnitRange[] = [];
      const contractionModePlan = contractions === undefined
        ? undefined
        : resolveCompositionModes(units, new Set(), true);
      const offsets: number[] = [];
      let offset = 0;
      for (const unit of units) {
        offsets.push(offset);
        offset += unit.source.length;
      }

      if (contractions !== undefined) {
        const [bucketAlphabet] = contractions.matcher;
        const ambiguityPrints = new Set(
          contractions.grade1Ambiguities.map(([print]) => print),
        );
        const standingLiteralInputs = new Set(contractions.standingLiteralInputs);
        for (const lexical of lexicalRanges(units, policies)) {
          const standing = options.standing ?? standingAt(units, lexical, policies);
          const eligibilityWord = units.slice(lexical.start, lexical.end)
            .map((unit) => eligibilityCharacter(unit, policies, bucketAlphabet))
            .join("");
          for (const range of contractionRanges(units, lexical, bucketAlphabet)) {
            const component = dashComponentAt(units, lexical, range, policies);
            const programLiteralComponent = hasOnlyProgramLiteralLetters(
              units,
              component,
              bucketAlphabet,
            );
            const exact = exactLetterPrint(units, range, bucketAlphabet);
            if (
              programLiteralComponent && standing && ambiguityPrints.has(exact) &&
              isCompleteAmbiguityLiteral(
                units,
                range,
                component,
                policies,
                bucketAlphabet,
              )
            ) {
              const hasCapital = units.slice(range.start, range.end)
                .some((unit) => unit.kind === "letter" && unit.uppercase);
              const requiredEnd = hasCapital ? range.start + 1 : range.end;
              for (let index = range.start; index < requiredEnd; index += 1) {
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
                programBase(unit, bucketAlphabet),
                "Contraction range contains a letter outside the program alphabet.",
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
                hasRestrictingLowerPunctuation:
                  lowerContext.hasRestrictingLowerPunctuation,
                hasUpperPunctuation: lowerContext.hasUpperPunctuation,
                standing: standing && programLiteralComponent,
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
              const appliedRange = { end, start };
              const initialLowerGroupsign = applied.print === "be" ||
                applied.print === "con" || applied.print === "dis";
              if (
                (initialLowerGroupsign && appliedRange.start !== component.start) ||
                contractionModePlan === undefined ||
                !canCollapseModeSpan(
                  contractionModePlan,
                  appliedRange,
                  initialLowerGroupsign,
                )
              ) continue;
              emissions[start] = rule[0];
              for (let index = start + 1; index < end; index += 1) emissions[index] = "";
              collapsedRanges.push(appliedRange);
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

      const modePlan = remapCollapsedModes(
        resolveCompositionModes(
          units,
          required,
          contractions !== undefined,
        ),
        collapsedRanges,
      );
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

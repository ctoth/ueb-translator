import {
  runContextualTransducer,
  type ComposedContractionProgram,
  type ContextualAppliedRule,
  type ContextualBoundary,
} from "./contextual-transducer.js";
import {
  compileRules,
  conditionTest,
  emitCompositionUnit,
  parseCompositionTextWithSymbols,
  resolveContextualPunctuation,
  resolveCompositionModes,
  unitRuleState,
  type CompositionModePlan,
  type CompositionUnit,
  type Grade1UnsupportedCharacter,
  type RuleCondition,
  type RuleState,
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
  /** Letters that, after elision punctuation, keep a word standing alone (UEB 2.6.2-2.6.3). */
  readonly standingSuffixes: string;
}

type PolicyCondition = RuleCondition<keyof CompositionPolicies>;
type LowerSignFact = "hasLowerPunctuation" | "hasRestrictingLowerPunctuation" | "hasUpperPunctuation";

/**
 * runtime-facts.json groups whose condition sets are the composition policies.
 * `standing`: a component stands alone when its `previous` conditions hold at
 * its first unit and its `next` conditions at its last. `lowerSigns`: a fact
 * holds when one of its rules holds at a unit walked outward from the
 * contraction range while `within` holds there.
 */
export interface CompositionScans {
  readonly lowerSigns: {
    readonly facts: Readonly<Record<LowerSignFact, readonly { readonly when: readonly PolicyCondition[] }[]>>;
    readonly within: readonly PolicyCondition[];
  };
  readonly standing: { readonly when: readonly PolicyCondition[] };
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
  // UEB 2.6.2–2.6.3: outer punctuation preserves standing alone,
  // even when an apostrophe was included in the lexical component.
  let start = component.start;
  let end = component.end;
  while (
    start < range.start &&
    isOneOf(requiredValue(units[start], "Missing leading unit.").source,
      policies.openingStandingPunctuation)
  ) start += 1;
  while (
    end > range.end &&
    isOneOf(requiredValue(units[end - 1], "Missing trailing unit.").source,
      policies.closingStandingPunctuation)
  ) end -= 1;
  if (range.start !== start) return false;
  if (range.end === end) return true;
  if (range.end + 2 !== end) return false;
  const apostrophe = units[range.end];
  const suffix = units[range.end + 1];
  return apostrophe?.kind === "symbol" &&
    isOneOf(apostrophe.source, policies.elisionPunctuation) &&
    suffix !== undefined &&
    Array.from(policies.standingSuffixes).some((letter) => letter === programBase(suffix, bucketAlphabet));
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

function exclusionComponent(
  units: readonly CompositionUnit[],
  component: UnitRange,
  range: UnitRange,
  policies: CompositionPolicies,
  bucketAlphabet: readonly string[],
): string {
  // Outer quote/apostrophe marks do not change the spelling being excluded.
  // Retain medial apostrophes and possessive s. Full lexical eligibility is
  // checked separately so divided spellings such as hoity-toity still match.
  let { start, end } = component;
  while (start < range.start && isOneOf(
    requiredValue(units[start], "Missing component start.").source,
    policies.elisionPunctuation,
  )) start += 1;
  while (end > range.end && isOneOf(
    requiredValue(units[end - 1], "Missing component end.").source,
    policies.elisionPunctuation,
  )) end -= 1;
  return units.slice(start, end)
    .map((unit) => eligibilityCharacter(unit, policies, bucketAlphabet))
    .join("");
}

function canCollapseModeSpan(
  plan: CompositionModePlan,
  range: UnitRange,
  adjacent?: "following" | "both",
): boolean {
  for (let index = range.start + 1; index < range.end; index += 1) {
    if ((plan.prefixes.get(index) ?? "").length > 0) return false;
  }
  for (let index = range.start; index < range.end - 1; index += 1) {
    if ((plan.suffixes.get(index) ?? "").length > 0) return false;
  }
  if (
    adjacent === "both" && (
      plan.prefixes.has(range.start) || plan.suffixes.has(range.start - 1)
    )
  ) return false;
  if (
    adjacent !== undefined && (
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
  scans: CompositionScans,
  contractions?: ComposedContractionProgram,
): ComposedTranslator {
  // Reject mismatched empty packages at the composition boundary.
  if (symbols.symbols.length === 0 || modes.modes.length === 0) {
    throw new Error("A composition requires compiled symbol and mode programs.");
  }
  const symbolRuntime = loadSymbolProgram(symbols);
  const standingTests = scans.standing.when.map((condition) => ({
    atLast: "unit" in condition && condition.unit === "next",
    test: conditionTest(condition, policies),
  }));
  const isStanding = (state: RuleState, component: UnitRange): boolean =>
    standingTests.every(({ atLast, test }) => test(state, atLast ? component.end - 1 : component.start));
  const within = scans.lowerSigns.within.map((condition) => conditionTest(condition, policies));
  const lowerSignRules = new Map(Object.entries(scans.lowerSigns.facts)
    .map(([fact, rules]) => [fact, compileRules({ rules, sets: policies })]));
  const lowerSigns = (
    state: RuleState,
    range: UnitRange,
  ): (fact: LowerSignFact) => boolean => {
    const walked: number[] = [];
    const inSequence = (index: number): boolean => within.every((test) => test(state, index));
    for (let index = range.start - 1; index >= 0 && inSequence(index); index -= 1) walked.push(index);
    for (let index = range.end; index < state.units.length && inSequence(index); index += 1) walked.push(index);
    if (walked.length === 0) return () => false;
    return (fact) => requiredValue(lowerSignRules.get(fact), "Missing lower-sign fact.")
      .some((rule) => walked.some((index) => rule.test(state, index)));
  };
  const ambiguityPrints = new Set(
    contractions?.grade1Ambiguities.map(([print]) => print),
  );
  const standingLiteralInputs = new Set(contractions?.standingLiteralInputs);
  const longerAmbiguities = contractions?.grade1LongerAmbiguities.map(
    (pattern) => new RegExp(pattern, "gu"),
  ) ?? [];

  return {
    translate(text, options = {}) {
      const parsed = parseCompositionTextWithSymbols(text, symbolRuntime);
      if (!parsed.ok) return parsed;
      const { units } = parsed;
      const punctuation = resolveContextualPunctuation(units);
      const emissions = units.map((unit, index) =>
        punctuation[index] ?? emitCompositionUnit(unit)
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
        const state = unitRuleState(units);
        for (const lexical of lexicalRanges(units, policies)) {
          const eligibilityWord = units.slice(lexical.start, lexical.end)
            .map((unit) => eligibilityCharacter(unit, policies, bucketAlphabet))
            .join("");
          for (const range of contractionRanges(units, lexical, bucketAlphabet)) {
            const component = dashComponentAt(units, lexical, range, policies);
            const standing = options.standing ?? isStanding(state, component);
            const programLiteralComponent = hasOnlyProgramLiteralLetters(
              units,
              component,
              bucketAlphabet,
            );
            const exact = exactLetterPrint(units, range, bucketAlphabet);
            const ambiguityPositions = longerAmbiguities.flatMap((pattern) =>
              [...exact.matchAll(pattern)].map((match) => match.index),
            );
            if (
              programLiteralComponent && standing &&
              (ambiguityPrints.has(exact) || ambiguityPositions.length > 0) &&
              contractionModePlan !== undefined &&
              canCollapseModeSpan(contractionModePlan, range) &&
              isCompleteAmbiguityLiteral(
                units,
                range,
                component,
                policies,
                bucketAlphabet,
              )
            ) {
              if (ambiguityPositions.some((position) => position > 0)) {
                // UEB 10.9.9 requires word Grade 1 and forbids all contractions.
                for (let index = range.start; index < range.end; index += 1) required.add(index);
                continue;
              }
              // UEB 10.9.7–10.9.8: one symbol indicator disambiguates the
              // initial shortform spelling; later contractions remain eligible.
              required.add(range.start);
            }
            if (
              standing && standingLiteralInputs.has(exact) &&
              isCompleteAmbiguityLiteral(
                units,
                range,
                component,
                policies,
                bucketAlphabet,
              )
            ) {
              continue;
            }
            const lowerSign = lowerSigns(state, range);
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
                isStableSpan: (start, end, adjacent) => contractionModePlan !== undefined &&
                  canCollapseModeSpan(contractionModePlan, {
                    start: range.start + start, end: range.start + end,
                  }, adjacent),
                exclusionWords: [
                  exclusionComponent(units, lexical, range, policies, bucketAlphabet),
                  exclusionComponent(units, component, range, policies, bucketAlphabet),
                ],
                hasLowerPunctuation: lowerSign("hasLowerPunctuation"),
                hasRestrictingLowerPunctuation: lowerSign("hasRestrictingLowerPunctuation"),
                hasUpperPunctuation: lowerSign("hasUpperPunctuation"),
                atWordStart: !units.slice(component.start, range.start)
                  .some((unit) => unit.kind === "letter"),
                precededByLetter: units[range.start - 1]?.kind === "letter",
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
              emissions[start] = rule[0];
              for (let index = start + 1; index < end; index += 1) emissions[index] = "";
              collapsedRanges.push({ end, start });
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

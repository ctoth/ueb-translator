import { sourceData } from "./source-manifest.js";
import { readLongerShortforms, readShortformSuffixes, readExpansionPolicy } from "./rule-json.js";
import { APPENDIX1_LONGER_WORDS } from "./appendix1.js";
import { CONSTRAINTS } from "./constraints.js";
import {
  compileContextualRules,
  type ContextualCompilationResult,
  type ContextualRuleGuard,
  type ContextualRuleSource,
} from "./contextual-compiler.js";
import { GRADE2_RULES, type Grade2RuleSource } from "./grade2-rules.js";
import { SHORTFORMS, type ShortformSource } from "./shortforms.js";
import { SYMBOL_RULES } from "./symbols/source.js";
import { GRADE2_INVENTORY_COUNTS, validateInventory } from "./inventory.js";

const EXPANSION_POLICY = readExpansionPolicy(sourceData("expansion"));

export interface CollisionReading {
  readonly literal: string;
  readonly ruleIds: readonly string[];
}

/** Enumerate every finite spelling path once, shared across shortforms. */
export function decodeShortforms(
  shortforms: readonly { readonly print: string; readonly braille: string }[],
  spellings: readonly { readonly id: string; readonly print: string; readonly braille: string }[],
): ReadonlyMap<string, readonly CollisionReading[]> {
  const cache = new Map<string, readonly CollisionReading[]>();
  function decode(cells: string): readonly CollisionReading[] {
    const found = cache.get(cells);
    if (found !== undefined) return found;
    if (cells.length === 0) return [{ literal: "", ruleIds: [] }];
    const readings = new Map<string, CollisionReading>();
    for (const symbol of spellings) {
      if (symbol.braille.length === 0) throw new Error("A collision spelling is empty.");
      if (!cells.startsWith(symbol.braille)) continue;
      for (const tail of decode(cells.slice(symbol.braille.length))) {
        const reading = { literal: symbol.print + tail.literal,
          ruleIds: [...new Set([symbol.id, ...tail.ruleIds])].sort() };
        readings.set(JSON.stringify(reading), reading);
      }
    }
    const result = [...readings.values()].sort((a, b) =>
      a.literal < b.literal ? -1 : a.literal > b.literal ? 1 :
        JSON.stringify(a.ruleIds).localeCompare(JSON.stringify(b.ruleIds), "en"));
    cache.set(cells, result);
    return result;
  }
  return new Map(shortforms.map(shortform => {
    const readings = decode(shortform.braille);
    if (readings.length === 0) throw new Error(`Cannot decode shortform ${shortform.print}`);
    return [shortform.print, readings];
  }));
}

export function substituteAppendixBase(word: string, base: string, literal: string): string {
  if (!word.includes(base)) throw new Error(`Appendix word ${word} lacks base ${base}`);
  return word.replace(base, literal);
}

export function compileGrade2RuleGuards(
  rule: Grade2RuleSource,
): readonly ContextualRuleGuard[] {
  return [...rule.guards, ...CONSTRAINTS
    .filter(constraint => constraint.target.kind === rule.kind && constraint.target.print === rule.print)
    .flatMap(constraint => constraint.guards)];
}

function contextualRule(rule: Grade2RuleSource): ContextualRuleSource {
  return {
    braille: rule.braille,
    citation: rule.citation,
    guards: [
      ...compileGrade2RuleGuards(rule),
      ...(COLLISION_GUARDS.get(rule.id) ?? []),
    ],
    id: rule.id,
    input: rule.print,
    precedence: rule.precedence,
  };
}

function contextualRules(rule: Grade2RuleSource): readonly ContextualRuleSource[] {
  const general = contextualRule(rule);
  return [general, ...rule.variants.map((variant): ContextualRuleSource => ({
    ...general,
    citation: { ...general.citation, locator: variant.locator },
    guards: [...general.guards, ...variant.guards],
    id: general.id + EXPANSION_POLICY.ids.separator + variant.idSuffix,
    precedence: variant.precedence,
  }))];
}

const SHORTFORM_SUFFIXES = readShortformSuffixes(sourceData("shortformSuffixes"));

function shortformSuffixes(print: string): readonly string[] {
  return SHORTFORM_SUFFIXES.exceptions.find(group => group.words.includes(print))?.suffixes
    ?? SHORTFORM_SUFFIXES.default;
}

function wholeShortform(rule: ShortformSource): ContextualRuleSource {
  return {
    braille: rule.braille,
    citation: rule.citation,
    guards: [
      ...EXPANSION_POLICY.shortformGuards,
      // ICEB 10.9.5: s and apostrophe-s retain a standing shortform.
      // The three exceptions apply only to s, not to apostrophe-s.
      { kind: "word-with-affixes", affixes: shortformSuffixes(rule.print) },
    ],
    id: rule.id,
    input: rule.print,
    precedence: EXPANSION_POLICY.shortformPrecedence,
  };
}

const LONGER_SHORTFORM_GROUPS = readLongerShortforms(sourceData("longerShortforms"));

function longerShortform(rule: ShortformSource): ContextualRuleSource | undefined {
  const group = LONGER_SHORTFORM_GROUPS.find(group => group.words.includes(rule.print));
  return group === undefined ? undefined : {
    braille: rule.braille,
    citation: rule.citation,
    guards: group.guards,
    id: rule.id + EXPANSION_POLICY.ids.longerSuffix,
    input: rule.print,
    precedence: EXPANSION_POLICY.longerPrecedence,
  };
}

function longerShortformPattern(rule: ContextualRuleSource, literal: string): string {
  const startsWord = rule.guards.some(guard => guard.kind === "word-start");
  const following = rule.guards.flatMap(guard => guard.kind === "following-not-vowel-y"
    ? [`(?![${guard.characters}])`] : []).join("");
  return `${startsWord ? "^" : ""}(?=(${literal})${following})`;
}

const SHORTFORM_BY_PRINT: ReadonlyMap<string, ShortformSource> = new Map(
  SHORTFORMS.map((rule): readonly [string, ShortformSource] => [rule.print, rule]),
);

export function requireAppendixShortformBase(
  base: string,
  shortforms: ReadonlyMap<string, ShortformSource>,
): ShortformSource {
  const source = shortforms.get(base);
  if (source === undefined) {
    throw new Error(`Appendix 1 base has no shortform: ${base}`);
  }
  return source;
}

function collisionGuards(): ReadonlyMap<string, readonly ContextualRuleGuard[]> {
  const groupsigns = GRADE2_RULES.filter(rule => EXPANSION_POLICY.collisionKinds.includes(rule.kind));
  const targets = new Set(groupsigns.map(rule => rule.id));
  const letter = new RegExp(EXPANSION_POLICY.latinPattern, "u");
  const spellings = [...groupsigns, ...SYMBOL_RULES.filter(rule =>
    rule.kind === EXPANSION_POLICY.latinKind && letter.test(rule.print))];
  const readings = decodeShortforms(SHORTFORMS, spellings);
  const words = new Map<string, Set<string>>(), patterns = new Map<string, Set<string>>();
  for (const shortform of SHORTFORMS) {
    const appendix = APPENDIX1_LONGER_WORDS.filter(entry => entry.base === shortform.print);
    for (const word of appendix) substituteAppendixBase(word.print, shortform.print, "");
    for (const reading of readings.get(shortform.print) ?? []) {
      if (reading.literal === shortform.print) continue;
      const forms = [[shortform.print, reading.literal], ...appendix.map(entry =>
        [entry.print, substituteAppendixBase(entry.print, shortform.print, reading.literal)])];
      for (const target of reading.ruleIds.filter(id => targets.has(id))) {
        const excluded = words.get(target) ?? new Set<string>();
        for (const [authored, form] of forms) {
          if (authored === undefined || form === undefined) throw new Error("Malformed collision form.");
          excluded.add(form);
          for (const suffix of shortformSuffixes(authored)) {
            excluded.add(form + suffix);
            for (const ending of EXPANSION_POLICY.suffixExtensions[suffix] ?? []) {
              excluded.add(form + suffix + ending);
            }
          }
        }
        words.set(target, excluded);
        const longer = longerShortform(shortform);
        if (longer !== undefined) {
          const selected = patterns.get(target) ?? new Set<string>();
          selected.add(longerShortformPattern(longer, reading.literal));
          patterns.set(target, selected);
        }
      }
    }
  }
  return new Map([...words].map(([id, excluded]): readonly [string, readonly ContextualRuleGuard[]] => [
    id, [{ kind: "not-standing-word", ignoredCharacters: "", words: [...excluded].sort() },
      ...[...(patterns.get(id) ?? [])].sort().map((pattern): ContextualRuleGuard =>
        ({ kind: "not-standing-match", pattern }))],
  ]));
}

const COLLISION_GUARDS: ReadonlyMap<string, readonly ContextualRuleGuard[]> = collisionGuards();

const appendixRules: readonly ContextualRuleSource[] = APPENDIX1_LONGER_WORDS.map(
  (word): ContextualRuleSource => {
    const base = requireAppendixShortformBase(word.base, SHORTFORM_BY_PRINT);
    return {
      braille: base.braille,
      citation: word.citation,
      guards: [
        ...EXPANSION_POLICY.appendixGuards,
        { kind: "eligibility-word", pluralSuffix: EXPANSION_POLICY.pluralSuffix, word: word.print },
      ],
      id: word.id,
      input: word.base,
      precedence: EXPANSION_POLICY.appendixPrecedence,
    };
  },
);

const longerShortforms = SHORTFORMS
  .map(longerShortform)
  .filter((rule): rule is ContextualRuleSource => rule !== undefined);

export const GRADE2_CONTEXTUAL_RULES: readonly ContextualRuleSource[] = [
  ...GRADE2_RULES.flatMap(contextualRules),
  ...SHORTFORMS.map(wholeShortform),
  ...longerShortforms,
  ...appendixRules,
];

const LATIN_LETTER_BY_CELL: ReadonlyMap<string, string> = new Map(
  SYMBOL_RULES
    .filter((rule) => rule.kind === EXPANSION_POLICY.latinKind && new RegExp(EXPANSION_POLICY.latinPattern, "u").test(rule.print))
    .map((rule): readonly [string, string] => [rule.braille, rule.print]),
);

const LATIN_CELL_BY_LETTER: ReadonlyMap<string, string> = new Map(
  [...LATIN_LETTER_BY_CELL].map(([cell, letter]) => [letter, cell]),
);

/** Letter affixes a rule keeps its contraction before (ICEB 10.9.5 plural s). */
function letterAffixes(rule: ContextualRuleSource): readonly string[] {
  return rule.guards.flatMap((guard) =>
    guard.kind === "word-with-affixes" ? guard.affixes : []
  ).filter((affix) => Array.from(affix).every((letter) => LATIN_CELL_BY_LETTER.has(letter)));
}

function letterCells(letters: string): string {
  return Array.from(letters).map((letter) => LATIN_CELL_BY_LETTER.get(letter)).join("");
}

function literalLetters(braille: string): string | undefined {
  const cells = Array.from(braille);
  const print = cells.map((cell) => LATIN_LETTER_BY_CELL.get(cell)).join("");
  return print.length === cells.length ? print : undefined;
}

/** ICEB 10.9.8–9: include the general longer-word readings of 10.9.3. */
export const GRADE2_AMBIGUOUS_LONGER_PATTERNS: readonly string[] = longerShortforms.flatMap(
  (rule) => {
    const literal = literalLetters(rule.braille);
    return literal === undefined ? [] : [longerShortformPattern(rule, literal)];
  },
);

export function checkedAmbiguities(entries: readonly (readonly [string, string])[]): ReadonlyMap<string, readonly [string, string]> {
  const result = new Map<string, readonly [string, string]>();
  for (const entry of entries) {
    const prior = result.get(entry[0]);
    if (prior !== undefined && prior[1] !== entry[1]) throw new Error(`Conflicting ambiguity for ${entry[0]}`);
    result.set(entry[0], entry);
  }
  return result;
}

/**
 * Literal letter sequences whose cells are also a compiled contraction output.
 * The source is the compiled inventory itself, so additions cannot bypass the
 * Grade 1 disambiguation pass. ICEB 10.9.7 also covers the suffixed readings
 * of 10.9.5, so each rule contributes its output with every letter affix.
 */
export const GRADE2_AMBIGUOUS_LETTER_SEQUENCES: readonly (
  readonly [print: string, braille: string]
)[] = [...checkedAmbiguities(
  GRADE2_CONTEXTUAL_RULES.flatMap((rule) => {
    const print = literalLetters(rule.braille);
    if (print === undefined) return [];
    const entries: (readonly [string, string])[] = ["", ...letterAffixes(rule)].map(
      (affix) => [print + affix, rule.braille + letterCells(affix)],
    );
    for (const guard of rule.guards) {
      // ICEB 10.9.8: Appendix 1 longer words beginning with a shortform
      // also make their literal abbreviation ambiguous (e.g. gd+y).
      if (guard.kind !== "eligibility-word" || !guard.word.startsWith(rule.input) ||
        !/^[a-z]+$/u.test(guard.word)) continue;
      const ending = guard.word.slice(rule.input.length);
      for (const suffix of [ending, ending + guard.pluralSuffix]) {
        entries.push([print + suffix, rule.braille + letterCells(suffix)]);
      }
    }
    return entries;
  }),
).values()].sort((left, right) => left[0].localeCompare(right[0], "en"));

const STANDING_WORD_OUTPUTS = new Set(
  GRADE2_RULES
    .filter((rule) =>
      EXPANSION_POLICY.standingWordKinds.includes(rule.kind)
    )
    .map((rule) => rule.braille),
);

/** Groupsigns that must be written literally when standing alone (UEB 10.4.2). */
export const GRADE2_STANDING_LITERAL_INPUTS: readonly string[] = GRADE2_RULES
  .filter((rule) =>
    EXPANSION_POLICY.standingLiteralKinds.includes(rule.kind) && STANDING_WORD_OUTPUTS.has(rule.braille)
  )
  .map((rule) => rule.print)
  .sort((left, right) => left.localeCompare(right, "en"));

export const GRADE2_CONTEXTUAL_COMPILATION: ContextualCompilationResult =
  compileContextualRules(
    GRADE2_CONTEXTUAL_RULES,
    [...LATIN_LETTER_BY_CELL.values()],
  );

validateInventory(GRADE2_INVENTORY_COUNTS, {
  rules: GRADE2_RULES.length, contextualRules: GRADE2_CONTEXTUAL_COMPILATION.runtime.rules.length,
  shortforms: SHORTFORMS.length, appendix1LongerWords: APPENDIX1_LONGER_WORDS.length,
});

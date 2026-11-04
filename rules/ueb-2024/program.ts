import { sourceData } from "./source-manifest.js";
import { readLongerShortforms, readShortformSuffixes } from "./rule-json.js";
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

/** ICEB 10.9.6: derive conflicting spellings from our own shortform inventory. */
function shortformCollisionGuards(rule: Grade2RuleSource): readonly ContextualRuleGuard[] {
  const groupsigns = GRADE2_RULES.filter((entry) =>
    entry.kind === "strong-groupsign" || entry.kind === "lower-groupsign" ||
    entry.kind === "strong-contraction" || entry.kind === "initial-letter-contraction");
  if (!groupsigns.some((entry) => entry === rule)) return [];
  const spellings = [
    ...groupsigns,
    ...SYMBOL_RULES.filter((entry) => entry.kind === "letter" && /^[a-z]$/u.test(entry.print)),
  ].sort((a, b) => b.braille.length - a.braille.length);
  const words = new Set<string>();
  const patterns: string[] = [];
  for (const shortform of SHORTFORMS) {
    let remaining = shortform.braille, literal = "", usesGroupsign = false;
    while (remaining.length > 0) {
      const symbol = spellings.find((entry) => remaining.startsWith(entry.braille));
      /* v8 ignore next -- the authored shortform inventory is exhaustively decoded during compilation. */
      if (symbol === undefined) throw new Error(`Cannot decode shortform ${shortform.print}`);
      literal += symbol.print;
      usesGroupsign ||= symbol === rule;
      remaining = remaining.slice(symbol.braille.length);
    }
    if (!usesGroupsign || literal === shortform.print) continue;
    const longer = longerShortform(shortform);
    if (longer !== undefined) {
      patterns.push(longerShortformPattern(longer, literal));
    }
    const forms = [literal, ...APPENDIX1_LONGER_WORDS
      .filter((entry) => entry.base === shortform.print)
      .map((entry) => entry.print.replace(shortform.print, literal))];
    for (const form of forms) {
      words.add(form);
      for (const suffix of shortformSuffixes(form === literal ? shortform.print : form)) {
        words.add(form + suffix);
        if (suffix === "s") words.add(`${form}s'`);
      }
    }
  }
  return [
    ...(words.size === 0 ? [] : [{
      ignoredCharacters: "", kind: "not-standing-word" as const, words: [...words].sort(),
    }]),
    ...patterns.map((pattern): ContextualRuleGuard => ({ kind: "not-standing-match", pattern })),
  ];
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
      ...shortformCollisionGuards(rule),
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
    id: general.id + "-" + variant.idSuffix,
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
      { kind: "standing-alone" },
      { kind: "word-start" },
      // ICEB 10.9.5: s and apostrophe-s retain a standing shortform.
      // The three exceptions apply only to s, not to apostrophe-s.
      { kind: "word-with-affixes", affixes: shortformSuffixes(rule.print) },
    ],
    id: rule.id,
    input: rule.print,
    precedence: 1,
  };
}

const LONGER_SHORTFORM_GROUPS = readLongerShortforms(sourceData("longerShortforms"));

function longerShortform(rule: ShortformSource): ContextualRuleSource | undefined {
  const group = LONGER_SHORTFORM_GROUPS.find(group => group.words.includes(rule.print));
  return group === undefined ? undefined : {
    braille: rule.braille,
    citation: rule.citation,
    guards: group.guards,
    id: rule.id + "-longer-word",
    input: rule.print,
    precedence: 4,
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

const appendixRules: readonly ContextualRuleSource[] = APPENDIX1_LONGER_WORDS.map(
  (word): ContextualRuleSource => {
    const base = requireAppendixShortformBase(word.base, SHORTFORM_BY_PRINT);
    return {
      braille: base.braille,
      citation: word.citation,
      guards: [
        { kind: "standing-alone" },
        { kind: "eligibility-word", pluralSuffix: "s", word: word.print },
      ],
      id: word.id,
      input: word.base,
      precedence: 0,
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
    .filter((rule) => rule.kind === "letter" && /^[a-z]$/u.test(rule.print))
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

/**
 * Literal letter sequences whose cells are also a compiled contraction output.
 * The source is the compiled inventory itself, so additions cannot bypass the
 * Grade 1 disambiguation pass. ICEB 10.9.7 also covers the suffixed readings
 * of 10.9.5, so each rule contributes its output with every letter affix.
 */
export const GRADE2_AMBIGUOUS_LETTER_SEQUENCES: readonly (
  readonly [print: string, braille: string]
)[] = [...new Map(
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
  }).map((entry) => [entry[0], entry] as const),
).values()].sort((left, right) => left[0].localeCompare(right[0], "en"));

const STANDING_WORD_OUTPUTS = new Set(
  GRADE2_RULES
    .filter((rule) =>
      rule.kind === "alphabetic-wordsign" ||
      rule.kind === "strong-wordsign"
    )
    .map((rule) => rule.braille),
);

/** Groupsigns that must be written literally when standing alone (UEB 10.4.2). */
export const GRADE2_STANDING_LITERAL_INPUTS: readonly string[] = GRADE2_RULES
  .filter((rule) =>
    rule.kind === "strong-groupsign" && STANDING_WORD_OUTPUTS.has(rule.braille)
  )
  .map((rule) => rule.print)
  .sort((left, right) => left.localeCompare(right, "en"));

export const GRADE2_CONTEXTUAL_COMPILATION: ContextualCompilationResult =
  compileContextualRules(
    GRADE2_CONTEXTUAL_RULES,
    [...LATIN_LETTER_BY_CELL.values()],
  );

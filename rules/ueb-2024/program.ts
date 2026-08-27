import { APPENDIX1_LONGER_WORDS } from "./appendix1.js";
import {
  COMPOUND_CONTRACTION_EXCEPTIONS,
  FINAL_GROUPSIGN_EXCEPTIONS,
  FIRST_SYLLABLE_CONTRACTION_EXCEPTIONS,
  INITIAL_CONTRACTION_EXCEPTIONS,
} from "./constraints.js";
import {
  compileContextualRules,
  type ContextualCompilationResult,
  type ContextualPrecedence,
  type ContextualRuleGuard,
  type ContextualRuleSource,
} from "./contextual-compiler.js";
import { GRADE2_RULES, type Grade2RuleSource } from "./grade2-rules.js";
import { SHORTFORMS, type ShortformSource } from "./shortforms.js";
import { SYMBOL_RULES } from "./symbols/source.js";

const NO_STRUCTURAL_CROSSING: ContextualRuleGuard = {
  boundaries: ["braille-line", "compound"],
  kind: "not-crossing",
};

function initialExceptionWords(print: string): readonly string[] {
  return INITIAL_CONTRACTION_EXCEPTIONS
    .filter((constraint) => constraint.contraction === print)
    .flatMap((constraint) => constraint.words);
}

function optionalFinalExceptionGuard(
  values: readonly string[],
  guard: ContextualRuleGuard,
): readonly ContextualRuleGuard[] {
  return values.length === 0 ? [] : [guard];
}

function compoundExceptionWords(print: string): readonly string[] {
  return COMPOUND_CONTRACTION_EXCEPTIONS
    .filter((constraint) => constraint.contraction === print)
    .flatMap((constraint) => constraint.words);
}

function firstSyllableExceptionWords(print: string): readonly string[] {
  return FIRST_SYLLABLE_CONTRACTION_EXCEPTIONS
    .filter((constraint) => constraint.contraction === print)
    .flatMap((constraint) => constraint.words);
}

function exceptionWordGuard(words: readonly string[]): readonly ContextualRuleGuard[] {
  return words.length === 0
    ? []
    : [{ ignoredCharacters: "-", kind: "not-word", words }];
}

function finalExceptionGuards(print: string): readonly ContextualRuleGuard[] {
  const constraint = FINAL_GROUPSIGN_EXCEPTIONS.find(
    (candidate) => candidate.groupsign === print,
  );
  if (constraint === undefined) {
    return [];
  }
  return [
    ...optionalFinalExceptionGuard(constraint.words, {
      ignoredCharacters: "-",
      kind: "not-word",
      words: constraint.words,
    }),
    ...optionalFinalExceptionGuard(constraint.endings, {
      endings: constraint.endings,
      kind: "not-word-ending",
    }),
  ];
}

function precedenceFor(rule: Grade2RuleSource): ContextualPrecedence {
  switch (rule.kind) {
    case "alphabetic-wordsign":
    case "lower-wordsign":
    case "strong-wordsign":
      return 0;
    case "strong-contraction":
      return 0;
    case "strong-groupsign":
      return 2;
    case "lower-groupsign":
      return rule.print === "be" || rule.print === "con" || rule.print === "dis"
        ? 1
        : 3;
    case "initial-letter-contraction":
      return 4;
    case "final-letter-groupsign":
      return 5;
  }
}

export function compileGrade2RuleGuards(
  rule: Grade2RuleSource,
): readonly ContextualRuleGuard[] {
  switch (rule.kind) {
    case "alphabetic-wordsign":
    case "strong-wordsign":
      return [
        { kind: "standing-alone" },
        { kind: "word-start" },
        { kind: "word-end" },
      ];
    case "lower-wordsign":
      return [
        {
          kind: "lower-sign",
          policy: rule.print === "enough" || rule.print === "in"
            ? "enough-or-in"
            : "other",
        },
        { kind: "standing-alone" },
        { kind: "word-start" },
        { kind: "word-end" },
      ];
    case "strong-contraction":
      return [
        NO_STRUCTURAL_CROSSING,
        ...exceptionWordGuard(compoundExceptionWords(rule.print)),
      ];
    case "strong-groupsign":
      return rule.print === "ing"
        ? [NO_STRUCTURAL_CROSSING, { kind: "not-word-start" }]
        : [NO_STRUCTURAL_CROSSING];
    case "lower-groupsign":
      if (rule.print === "be" || rule.print === "con" || rule.print === "dis") {
        return [
          { kind: "first-syllable" },
          NO_STRUCTURAL_CROSSING,
          ...exceptionWordGuard(firstSyllableExceptionWords(rule.print)),
          { kind: "not-word-end" },
          { kind: "word-start" },
        ];
      }
      if (["bb", "cc", "ea", "ff", "gg"].includes(rule.print)) {
        return [
          ...(rule.print === "ea"
            ? [{ boundary: "prefix", kind: "not-boundary" } as const]
            : []),
          NO_STRUCTURAL_CROSSING,
          { kind: "word-internal" },
        ];
      }
      return [
        NO_STRUCTURAL_CROSSING,
        ...(rule.print === "en" || rule.print === "in"
          ? [{ kind: "not-whole-word" } as const]
          : []),
      ];
    case "initial-letter-contraction": {
      const exceptionWords = initialExceptionWords(rule.print);
      return [
        NO_STRUCTURAL_CROSSING,
        ...exceptionWordGuard(exceptionWords),
        ...(rule.print === "ever"
          ? [{ characters: "ei", kind: "previous-not" } as const]
          : rule.print === "one"
            ? [{ characters: "o", kind: "previous-not" } as const]
            : rule.print === "under"
              ? [{ characters: "ao", kind: "previous-not" } as const]
              : []),
      ];
    }
    case "final-letter-groupsign":
      return [
        ...finalExceptionGuards(rule.print),
        {
          boundaries: ["braille-line", "compound", "syllable"],
          kind: "not-crossing",
        },
        { kind: "not-word-start" },
      ];
  }
}

function contextualRule(rule: Grade2RuleSource): ContextualRuleSource {
  return {
    braille: rule.braille,
    citation: rule.citation,
    guards: compileGrade2RuleGuards(rule),
    id: rule.id,
    input: rule.print,
    precedence: precedenceFor(rule),
  };
}

function contextualRules(rule: Grade2RuleSource): readonly ContextualRuleSource[] {
  const general = contextualRule(rule);
  if (rule.kind !== "final-letter-groupsign" || rule.print !== "ence") {
    return [general];
  }
  return [
    general,
    {
      ...general,
      citation: { ...general.citation, locator: "10.10" },
      guards: [...general.guards, { characters: "adr", kind: "following" }],
      id: `${general.id}-preference-exception`,
      precedence: 4,
    },
  ];
}

function wholeShortform(rule: ShortformSource): ContextualRuleSource {
  return {
    braille: rule.braille,
    citation: rule.citation,
    guards: [
      { kind: "standing-alone" },
      { kind: "word-start" },
      { kind: "word-end" },
    ],
    id: rule.id,
    input: rule.print,
    precedence: 1,
  };
}

const GENERAL_LONGER_SHORTFORMS = new Set([
  "blind", "braille", "children", "first", "friend", "good", "great",
  "letter", "little", "quick",
]);

function longerShortform(rule: ShortformSource): ContextualRuleSource | undefined {
  if (!GENERAL_LONGER_SHORTFORMS.has(rule.print)) {
    return undefined;
  }
  const guards: ContextualRuleGuard[] = [{ kind: "standing-alone" }];
  if (rule.print === "children") {
    guards.push({ characters: "aeiouy", kind: "following-not-vowel-y" });
  } else if (rule.print !== "braille" && rule.print !== "great") {
    guards.push(
      { characters: "aeiouy", kind: "following-not-vowel-y" },
      { kind: "word-start" },
    );
  }
  return {
    braille: rule.braille,
    citation: rule.citation,
    guards,
    id: `${rule.id}-longer-word`,
    input: rule.print,
    precedence: 4,
  };
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

/**
 * Literal letter sequences whose cells are also a compiled contraction output.
 * The source is the compiled inventory itself, so additions cannot bypass the
 * Grade 1 disambiguation pass.
 */
export const GRADE2_AMBIGUOUS_LETTER_SEQUENCES: readonly (
  readonly [print: string, braille: string]
)[] = [...new Map(
  GRADE2_CONTEXTUAL_RULES.flatMap((rule) => {
    const print = Array.from(rule.braille)
      .map((cell) => LATIN_LETTER_BY_CELL.get(cell))
      .join("");
    return print.length === Array.from(rule.braille).length
      ? [[print, rule.braille] as const]
      : [];
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

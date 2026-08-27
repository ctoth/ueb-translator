import {
  compose,
  type CompositionResult,
  type ComposedTranslator,
} from "./composition.js";
import {
  GRADE1_MODE_PROGRAM,
  GRADE1_SYMBOL_PROGRAM,
  UEB_COMPOSITION_POLICIES,
} from "./generated/ueb-2024/grade1-program.js";
import type {
  CompiledSymbol,
  SymbolProgram,
} from "./symbol-program.js";

export type ForeignLanguage = "de" | "fr";
export type ForeignLanguageCode = "foreign" | "ueb";

export interface ForeignLanguageRun {
  readonly code: ForeignLanguageCode;
  readonly kind: "foreign";
  readonly language: ForeignLanguage;
  readonly text: string;
}

export const NON_UEB_WORD_INDICATOR = "⠘⠷";
export const NON_UEB_WORD_TERMINATOR = "⠘⠾";
export const NON_UEB_PASSAGE_INDICATOR = "⠐⠷⠄";
export const NON_UEB_PASSAGE_TERMINATOR = "⠠⠐⠾";

interface ForeignCodePackage {
  readonly symbols: SymbolProgram;
}

function letter(
  print: string,
  braille: string,
): CompiledSymbol {
  return {
    braille,
    kind: "letter",
    numericDigit: null,
    print,
    uppercasePrint: print.toUpperCase(),
  };
}

const LATIN = GRADE1_SYMBOL_PROGRAM.symbols.filter((symbol) =>
  symbol.kind === "letter" && /^[a-z]$/u.test(symbol.print)
);

function foreignPackage(
  replacements: readonly CompiledSymbol[],
): ForeignCodePackage {
  const replaced = new Set(replacements.map((symbol) => symbol.print));
  return {
    symbols: {
      symbols: [
        ...LATIN.filter((symbol) => !replaced.has(symbol.print)),
        ...replacements,
      ],
    },
  };
}

/* ICEB 2024 Section 13 foreign-code sign list and Section 14 sign table. */
const FOREIGN_CODE_PACKAGES = {
  de: foreignPackage([
    letter("ä", "⠜"),
    letter("ö", "⠪"),
    letter("ü", "⠳"),
    letter("ß", "⠮"),
  ]),
  fr: foreignPackage([
    letter("à", "⠷"),
    letter("ç", "⠯"),
    letter("é", "⠿"),
    letter("è", "⠮"),
    letter("ê", "⠣"),
    letter("î", "⠩"),
    letter("ô", "⠹"),
  ]),
} satisfies Readonly<Record<ForeignLanguage, ForeignCodePackage>>;

const UEB_UNCONTRACTED_TRANSLATOR = compose(
  GRADE1_SYMBOL_PROGRAM,
  GRADE1_MODE_PROGRAM,
  UEB_COMPOSITION_POLICIES,
);

const FOREIGN_TRANSLATORS: Readonly<Record<ForeignLanguage, ComposedTranslator>> = {
  de: compose(
    FOREIGN_CODE_PACKAGES.de.symbols,
    GRADE1_MODE_PROGRAM,
    UEB_COMPOSITION_POLICIES,
  ),
  fr: compose(
    FOREIGN_CODE_PACKAGES.fr.symbols,
    GRADE1_MODE_PROGRAM,
    UEB_COMPOSITION_POLICIES,
  ),
};

const FOREIGN_CAPITAL_SIGNS = {
  de: "⠠",
  fr: "⠨",
} satisfies Readonly<Record<ForeignLanguage, string>>;

function sequenceCount(text: string): number {
  let count = 0;
  let inside = false;
  for (const value of text) {
    if (value === " " || value === "\r" || value === "\n") {
      inside = false;
    } else if (!inside) {
      count += 1;
      inside = true;
    }
  }
  return count;
}

function encloseNonUeb(text: string, braille: string): string {
  if (text.length === 0) return "";
  return sequenceCount(text) <= 1
    ? NON_UEB_WORD_INDICATOR + braille + NON_UEB_WORD_TERMINATOR
    : NON_UEB_PASSAGE_INDICATOR + braille + NON_UEB_PASSAGE_TERMINATOR;
}

/** Translate one explicitly tagged Section 13 run without UEB contractions. */
export function translateForeignLanguageRun(
  run: ForeignLanguageRun,
): CompositionResult {
  if (run.code === "ueb") {
    return UEB_UNCONTRACTED_TRANSLATOR.translate(run.text);
  }
  let braille = "";
  let codeUnitIndex = 0;
  let scalarIndex = 0;
  for (const value of run.text) {
    const lowercase = value.toLowerCase();
    const translated = FOREIGN_TRANSLATORS[run.language].translate(lowercase);
    if (!translated.ok) {
      return {
        ...translated,
        codeUnitIndex: codeUnitIndex + translated.codeUnitIndex,
        scalarIndex: scalarIndex + translated.scalarIndex,
      };
    }
    braille += (value === lowercase ? "" : FOREIGN_CAPITAL_SIGNS[run.language]) +
      translated.braille;
    codeUnitIndex += value.length;
    scalarIndex += 1;
  }
  const translated: CompositionResult = { braille, ok: true, rules: [] };
  return {
    ...translated,
    braille: encloseNonUeb(run.text, translated.braille),
  };
}

function inverseLetters(
  language: ForeignLanguage,
): ReadonlyMap<string, readonly string[]> {
  const inverse = new Map<string, string[]>();
  for (const symbol of FOREIGN_CODE_PACKAGES[language].symbols.symbols) {
    const prints = inverse.get(symbol.braille) ?? [];
    prints.push(symbol.print);
    inverse.set(symbol.braille, prints);
  }
  return inverse;
}

const FOREIGN_INVERSES: Readonly<Record<ForeignLanguage, ReadonlyMap<string, readonly string[]>>> = {
  de: inverseLetters("de"),
  fr: inverseLetters("fr"),
};

/** Decode the finite built-in French or German foreign-code symbol package. */
export function decodeForeignLanguageBraille(
  braille: string,
  language: ForeignLanguage,
): readonly string[] {
  let candidates = [{ capital: false, print: "" }];
  for (const cell of braille) {
    if (cell === FOREIGN_CAPITAL_SIGNS[language]) {
      candidates = candidates
        .filter((candidate) => !candidate.capital)
        .map((candidate) => ({ ...candidate, capital: true }));
      continue;
    }
    if (cell === "⠀") {
      candidates = candidates
        .filter((candidate) => !candidate.capital)
        .map((candidate) => ({ ...candidate, print: candidate.print + " " }));
      continue;
    }
    const prints = FOREIGN_INVERSES[language].get(cell);
    if (prints === undefined) return [];
    candidates = candidates.flatMap((candidate) =>
      prints.map((print) => ({
        capital: false,
        print: candidate.print + (candidate.capital ? print.toUpperCase() : print),
      }))
    );
  }
  return [...new Set(
    candidates.filter((candidate) => !candidate.capital)
      .map((candidate) => candidate.print),
  )];
}

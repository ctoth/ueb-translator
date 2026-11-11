import {
  compose,
  type CompositionResult,
  type ComposedTranslator,
} from "./composition.js";
import {
  GRADE1_MODE_PROGRAM,
  GRADE1_RUNTIME_FACTS,
  GRADE1_SYMBOL_PROGRAM,
  UEB_COMPOSITION_POLICIES,
} from "./generated/ueb-2024/grade1-program.js";
import type {
  CompiledSymbol,
  SymbolProgram,
} from "./symbol-program.js";

/** ICEB 2024 Sections 13-14: foreign-code packages, all from runtime-facts.json foreignCode. */
type ForeignFacts = typeof GRADE1_RUNTIME_FACTS.foreignCode;
const FOREIGN: ForeignFacts = GRADE1_RUNTIME_FACTS.foreignCode;
const LANGUAGES: ForeignFacts["languages"] = FOREIGN.languages;

export type ForeignLanguage = keyof ForeignFacts["languages"];
export type ForeignLanguageCode = "foreign" | "ueb";

export interface ForeignLanguageRun {
  readonly code: ForeignLanguageCode;
  readonly kind: "foreign";
  readonly language: ForeignLanguage;
  readonly text: string;
}

export const NON_UEB_WORD_INDICATOR: string = FOREIGN.nonUebIndicators.word;
export const NON_UEB_WORD_TERMINATOR: string = FOREIGN.nonUebIndicators.wordTerminator;
export const NON_UEB_PASSAGE_INDICATOR: string = FOREIGN.nonUebIndicators.passage;
export const NON_UEB_PASSAGE_TERMINATOR: string = FOREIGN.nonUebIndicators.passageTerminator;

interface ForeignCodePackage {
  readonly symbols: SymbolProgram;
}

function uppercaseForeignPrint(language: ForeignLanguage, print: string): string {
  const exceptions: Readonly<Record<string, string>> = LANGUAGES[language].uppercase;
  return (Object.hasOwn(exceptions, print) ? exceptions[print] : undefined) ?? print.toUpperCase();
}

const BASE_LETTER = new RegExp(FOREIGN.baseLetters, "u");
const LATIN = GRADE1_SYMBOL_PROGRAM.symbols.filter((symbol) =>
  symbol.kind === "letter" && BASE_LETTER.test(symbol.print)
);

function foreignPackage(language: ForeignLanguage): ForeignCodePackage {
  const letters: Readonly<Record<string, string>> = LANGUAGES[language].letters;
  const replacements = Object.entries(letters).map(([print, braille]): CompiledSymbol => ({
    braille, kind: "letter", numericDigit: null, print, uppercasePrint: uppercaseForeignPrint(language, print),
  }));
  return {
    symbols: { symbols: [...LATIN.filter((symbol) => !Object.hasOwn(letters, symbol.print)), ...replacements] },
  };
}

const UEB_UNCONTRACTED_TRANSLATOR = compose(
  GRADE1_SYMBOL_PROGRAM,
  GRADE1_MODE_PROGRAM,
  UEB_COMPOSITION_POLICIES,
  GRADE1_RUNTIME_FACTS,
);

interface ForeignCode {
  readonly capital: string;
  readonly inverse: ReadonlyMap<string, readonly string[]>;
  readonly translator: ComposedTranslator;
}

function inverseLetters(symbols: SymbolProgram): ReadonlyMap<string, readonly string[]> {
  const inverse = new Map<string, string[]>();
  for (const symbol of symbols.symbols) {
    inverse.set(symbol.braille, [...(inverse.get(symbol.braille) ?? []), symbol.print]);
  }
  return inverse;
}

/** Every built-in foreign-code language, in runtime-facts.json order. */
export const FOREIGN_LANGUAGES: readonly ForeignLanguage[] =
  Object.keys(LANGUAGES).filter((name): name is ForeignLanguage => Object.hasOwn(LANGUAGES, name));

const FOREIGN_CODES = new Map<ForeignLanguage, ForeignCode>();

/** Each language's package is composed on first use and reused afterwards. */
function foreignCode(language: ForeignLanguage): ForeignCode {
  const built = FOREIGN_CODES.get(language);
  if (built !== undefined) return built;
  const { symbols } = foreignPackage(language);
  const code: ForeignCode = {
    capital: LANGUAGES[language].capital,
    inverse: inverseLetters(symbols),
    translator: compose(symbols, GRADE1_MODE_PROGRAM, UEB_COMPOSITION_POLICIES, GRADE1_RUNTIME_FACTS),
  };
  FOREIGN_CODES.set(language, code);
  return code;
}

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
  const code = foreignCode(run.language);
  let braille = "";
  let codeUnitIndex = 0;
  let scalarIndex = 0;
  for (const value of run.text) {
    const lowercase = value.toLowerCase();
    const translated = code.translator.translate(lowercase);
    if (!translated.ok) {
      return {
        ...translated,
        codeUnitIndex: codeUnitIndex + translated.codeUnitIndex,
        scalarIndex: scalarIndex + translated.scalarIndex,
      };
    }
    braille += (value === lowercase ? "" : code.capital) + translated.braille;
    codeUnitIndex += value.length;
    scalarIndex += 1;
  }
  const translated: CompositionResult = { braille, ok: true, rules: [] };
  return {
    ...translated,
    braille: encloseNonUeb(run.text, translated.braille),
  };
}

/** Decode a built-in foreign-code symbol package. */
export function decodeForeignLanguageBraille(
  braille: string,
  language: ForeignLanguage,
): readonly string[] {
  const code = foreignCode(language);
  let candidates = [{ capital: false, print: "" }];
  for (const cell of braille) {
    if (cell === code.capital) {
      candidates = candidates
        .filter((candidate) => !candidate.capital)
        .map((candidate) => ({ ...candidate, capital: true }));
      continue;
    }
    if (cell === GRADE1_RUNTIME_FACTS.whitespace.blank) {
      candidates = candidates
        .filter((candidate) => !candidate.capital)
        .map((candidate) => ({ ...candidate, print: candidate.print + " " }));
      continue;
    }
    const prints = code.inverse.get(cell);
    if (prints === undefined) return [];
    candidates = candidates.flatMap((candidate) =>
      prints.map((print) => ({
        capital: false,
        print: candidate.print +
          (candidate.capital ? uppercaseForeignPrint(language, print) : print),
      }))
    );
  }
  return [...new Set(
    candidates.filter((candidate) => !candidate.capital)
      .map((candidate) => candidate.print),
  )];
}

/**
 * Deterministic uncontracted Unified English Braille translation.
 *
 * Normative rules: ICEB, Rules of Unified English Braille, Third Edition
 * (2024), sections 3-9. https://iceb.org/publications/ueb/
 *
 * The plain-string API accepts only print characters whose UEB meaning is
 * determined by the character and its normative context. Semantic distinctions
 * such as typeform are represented explicitly by Grade1Document.
 */

export type Grade1Typeform =
  | "bold"
  | "italic"
  | "script"
  | "transcriber-defined"
  | "underline";

export interface Grade1TextRun {
  readonly text: string;
  readonly typeforms?: readonly Grade1Typeform[];
}

export interface Grade1BrailleGroup {
  readonly kind: "braille-group";
  readonly runs: readonly [Grade1Run, ...Grade1Run[]];
}

export interface Grade1Ligature {
  readonly kind: "ligature";
  readonly letters: readonly [string, string, ...string[]];
}

export type Grade1Run = Grade1BrailleGroup | Grade1Ligature | Grade1TextRun;

export interface Grade1Paragraph {
  readonly runs: readonly Grade1Run[];
}

export interface Grade1Document {
  readonly kind: "grade1-document";
  readonly paragraphs: readonly Grade1Paragraph[];
}

export interface Grade1Success {
  readonly braille: string;
  readonly mode: "grade1";
  readonly ok: true;
}

export interface Grade1UnsupportedCharacter {
  readonly character: string;
  readonly codeUnitIndex: number;
  readonly mode: "grade1";
  readonly ok: false;
  readonly reason: "unsupported-character";
  readonly scalarIndex: number;
}

export interface Grade1InvalidLigature {
  readonly letterIndex: number;
  readonly mode: "grade1";
  readonly ok: false;
  readonly reason: "invalid-ligature-letter";
  readonly value: string;
}

export type Grade1Result =
  | Grade1InvalidLigature
  | Grade1Success
  | Grade1UnsupportedCharacter;

export type Grade1TextResult = Grade1Success | Grade1UnsupportedCharacter;

export interface Grade1ReverseLetter {
  readonly braille: string;
  readonly kind: "letter";
  readonly numericDigit: string | null;
  readonly print: string;
  readonly uppercasePrint: string;
}

export interface Grade1ReverseModifier {
  readonly braille: string;
  readonly kind: "modifier";
  readonly print: string;
}

export interface Grade1ReverseSemanticControl {
  readonly braille: string;
  readonly kind: "semantic-control";
}

export interface Grade1ReverseSymbol {
  readonly braille: string;
  readonly kind: "symbol";
  readonly print: string;
}

export type Grade1ReverseEntry =
  | Grade1ReverseLetter
  | Grade1ReverseModifier
  | Grade1ReverseSemanticControl
  | Grade1ReverseSymbol;

interface ScalarToken {
  readonly codeUnitIndex: number;
  readonly scalarIndex: number;
  readonly value: string;
}

interface Letter {
  readonly cell: string;
  readonly modifiers: string;
  readonly numericAmbiguous: boolean;
  readonly uppercase: boolean;
}

interface LetterUnit extends Letter {
  readonly kind: "letter";
}

interface DigitUnit {
  readonly cell: string;
  readonly kind: "digit";
}

interface SpaceUnit {
  readonly kind: "space";
}

interface LineBoundaryUnit {
  readonly kind: "line-boundary";
  readonly value: "\n" | "\r" | "\r\n";
}

interface SymbolUnit {
  readonly braille: string;
  readonly kind: "symbol";
  readonly source: string;
}

type TranslatableUnit =
  | DigitUnit
  | LetterUnit
  | LineBoundaryUnit
  | SpaceUnit
  | SymbolUnit;

interface ParsedText {
  readonly ok: true;
  readonly units: readonly TranslatableUnit[];
}

type ParseResult = Grade1UnsupportedCharacter | ParsedText;

interface TypeformIndicators {
  readonly passage: string;
  readonly symbol: string;
  readonly terminator: string;
  readonly word: string;
}

const BRAILLE_BLANK = "⠀";
const CAPITAL_INDICATOR = "⠠";
const CAPITALS_WORD_INDICATOR = "⠠⠠";
const CAPITALS_PASSAGE_INDICATOR = "⠠⠠⠠";
const CAPITALS_TERMINATOR = "⠠⠄";
const GRADE_1_SYMBOL_INDICATOR = "⠰";
const LIGATURE_INDICATOR = "⠘⠖";
const NUMERIC_INDICATOR = "⠼";

// UEB 4.1. The alphabet is deliberately represented as cells, not as a
// language-frequency table.
const LETTER_CELLS = new Map<string, string>([
  ["a", "⠁"], ["b", "⠃"], ["c", "⠉"], ["d", "⠙"], ["e", "⠑"],
  ["f", "⠋"], ["g", "⠛"], ["h", "⠓"], ["i", "⠊"], ["j", "⠚"],
  ["k", "⠅"], ["l", "⠇"], ["m", "⠍"], ["n", "⠝"], ["o", "⠕"],
  ["p", "⠏"], ["q", "⠟"], ["r", "⠗"], ["s", "⠎"], ["t", "⠞"],
  ["u", "⠥"], ["v", "⠧"], ["w", "⠺"], ["x", "⠭"], ["y", "⠽"],
  ["z", "⠵"],
]);

// UEB 4.2.1. Each value is the complete modifier indicator.
const COMBINING_MODIFIERS = new Map<string, string>([
  ["\u0338", "⠈⠡"],
  ["\u0335", "⠈⠒"],
  ["\u0336", "⠈⠒"],
  ["\u0306", "⠈⠬"],
  ["\u0304", "⠈⠤"],
  ["\u0327", "⠘⠯"],
  ["\u0300", "⠘⠡"],
  ["\u0302", "⠘⠩"],
  ["\u030a", "⠘⠫"],
  ["\u0303", "⠘⠻"],
  ["\u0308", "⠘⠒"],
  ["\u0301", "⠘⠌"],
  ["\u030c", "⠘⠬"],
]);

// UEB 4.4-4.6. Greek cells carry their dot-4/5 Greek prefix as part of the
// letter; capitals consequently use the ordinary dot-6 prefix before it.
const GREEK_CELLS = new Map<string, string>([
  ["α", "⠨⠁"], ["β", "⠨⠃"], ["γ", "⠨⠛"], ["δ", "⠨⠙"],
  ["ε", "⠨⠑"], ["ζ", "⠨⠵"], ["η", "⠨⠒"], ["θ", "⠨⠹"],
  ["ι", "⠨⠊"], ["κ", "⠨⠅"], ["λ", "⠨⠇"], ["μ", "⠨⠍"],
  ["ν", "⠨⠝"], ["ξ", "⠨⠭"], ["ο", "⠨⠕"], ["π", "⠨⠏"],
  ["ρ", "⠨⠗"], ["σ", "⠨⠎"], ["ς", "⠨⠎"], ["τ", "⠨⠞"],
  ["υ", "⠨⠥"], ["φ", "⠨⠋"], ["χ", "⠨⠯"], ["ψ", "⠨⠽"],
  ["ω", "⠨⠺"],
]);

const SPECIAL_LETTER_CELLS = new Map<string, string>([
  ["ŋ", "⠘⠝"],
  ["ə", "⠸⠢"],
  ["ß", "⠨⠮"],
]);

// UEB 3 and 7. Directional Unicode punctuation is kept directional; the
// ambiguous straight double quote is intentionally not present.
const SYMBOLS = new Map<string, string>([
  [",", "⠂"], [";", "⠆"], [":", "⠒"], [".", "⠲"],
  ["!", "⠖"], ["?", "⠦"], ["…", "⠲⠲⠲"],
  ["“", "⠦"], ["”", "⠴"], ["‘", "⠠⠦"], ["’", "⠠⠴"],
  ["\"", "⠠⠶"], ["'", "⠄"], ["«", "⠸⠦"], ["»", "⠸⠴"],
  ["(", "⠐⠣"], [")", "⠐⠜"],
  ["[", "⠨⠣"], ["]", "⠨⠜"], ["{", "⠸⠣"], ["}", "⠸⠜"],
  ["⟨", "⠈⠣"], ["⟩", "⠈⠜"], ["/", "⠸⠌"], ["\\", "⠸⠡"],
  ["-", "⠤"], ["–", "⠠⠤"], ["—", "⠐⠠⠤"], ["_", "⠨⠤"],
  ["&", "⠈⠯"], ["@", "⠈⠁"], ["#", "⠸⠹"], ["$", "⠈⠎"],
  ["%", "⠨⠴"], ["+", "⠐⠖"], ["=", "⠐⠶"], ["×", "⠐⠦"],
  ["*", "⠐⠔"], ["÷", "⠐⠌"], ["−", "⠐⠤"],
  ["∷", "⠒⠒"], ["′", "⠶"], ["″", "⠶⠶"], ["〃", "⠐⠂"],
  ["<", "⠈⠣"], [">", "⠈⠜"], ["→", "⠳⠕"], ["↓", "⠳⠩"],
  ["←", "⠳⠪"], ["↑", "⠳⠬"], ["^", "⠈⠢"], ["~", "⠈⠔"],
  ["©", "⠘⠉"], ["®", "⠘⠗"], ["™", "⠘⠞"], ["°", "⠘⠚"],
  ["¶", "⠘⠏"], ["§", "⠘⠎"], ["¢", "⠈⠉"], ["€", "⠈⠑"],
  ["₣", "⠈⠋"], ["£", "⠈⠇"], ["₦", "⠈⠝"], ["¥", "⠈⠽"],
  ["•", "⠸⠲"], ["✓", "⠈⠩"], ["♮", "⠼⠡"], ["♭", "⠼⠣"],
  ["♯", "⠼⠩"], ["†", "⠈⠠⠦"], ["‡", "⠈⠠⠻"],
  ["♀", "⠘⠭"], ["♂", "⠘⠽"],
]);

const TYPEFORM_INDICATORS = {
  bold: { passage: "⠘⠶", symbol: "⠘⠆", terminator: "⠘⠄", word: "⠘⠂" },
  italic: { passage: "⠨⠶", symbol: "⠨⠆", terminator: "⠨⠄", word: "⠨⠂" },
  script: { passage: "⠈⠶", symbol: "⠈⠆", terminator: "⠈⠄", word: "⠈⠂" },
  "transcriber-defined": {
    passage: "⠈⠼⠶",
    symbol: "⠈⠼⠆",
    terminator: "⠈⠼⠄",
    word: "⠈⠼⠂",
  },
  underline: { passage: "⠸⠶", symbol: "⠸⠆", terminator: "⠸⠄", word: "⠸⠂" },
} satisfies Readonly<Record<Grade1Typeform, TypeformIndicators>>;

function tokenize(text: string): readonly ScalarToken[] {
  const tokens: ScalarToken[] = [];
  let codeUnitIndex = 0;
  let scalarIndex = 0;

  for (const value of text) {
    const previous = tokens[tokens.length - 1];
    if (/^\p{M}$/u.test(value) && previous !== undefined) {
      tokens[tokens.length - 1] = {
        ...previous,
        value: previous.value + value,
      };
    } else {
      tokens.push({ codeUnitIndex, scalarIndex, value });
    }
    codeUnitIndex += value.length;
    scalarIndex += 1;
  }

  return tokens;
}

function analyseLetter(value: string): Letter | undefined {
  const lowercase = value.toLowerCase();
  const greekCell = GREEK_CELLS.get(lowercase);
  if (greekCell !== undefined) {
    return {
      cell: greekCell,
      modifiers: "",
      numericAmbiguous: false,
      uppercase: value !== lowercase,
    };
  }
  const specialCell = SPECIAL_LETTER_CELLS.get(lowercase);
  if (specialCell !== undefined) {
    return {
      cell: specialCell,
      modifiers: "",
      numericAmbiguous: false,
      uppercase: value !== lowercase,
    };
  }

  const decomposition = value.normalize("NFD");
  const first = decomposition.charAt(0);
  const base = first.toLowerCase();
  const cell = LETTER_CELLS.get(base);
  if (
    cell === undefined ||
    first.toUpperCase() === first.toLowerCase()
  ) {
    return undefined;
  }
  let modifiers = "";

  for (const component of decomposition.slice(first.length)) {
    const modifier = COMBINING_MODIFIERS.get(component);
    if (modifier === undefined) {
      return undefined;
    }
    modifiers += modifier;
  }

  return {
    cell,
    modifiers,
    numericAmbiguous: base >= "a" && base <= "j",
    uppercase: first === first.toUpperCase(),
  };
}

function digitCell(value: string): string | undefined {
  if (value < "0" || value > "9") {
    return undefined;
  }
  return LETTER_CELLS.get(value === "0" ? "j" : String.fromCharCode(96 + Number(value)));
}

function isAsciiLineBoundary(value: string): value is "\n" | "\r" {
  return value === "\n" || value === "\r";
}

function capitalisedSequenceEnd(
  units: readonly TranslatableUnit[],
  start: number,
): number | undefined {
  let index = start;
  let hasLetter = false;
  for (const unit of units.slice(start)) {
    if (unit.kind === "space" || unit.kind === "line-boundary") {
      break;
    }
    if (unit.kind === "letter") {
      if (!unit.uppercase) {
        return undefined;
      }
      hasLetter = true;
    }
    index += 1;
  }
  return hasLetter ? index : undefined;
}

function capitalsPassageEnd(
  units: readonly TranslatableUnit[],
  start: number,
): number | undefined {
  let index = start;
  let wordCount = 0;
  let lastWordEnd = start;

  while (index < units.length) {
    const wordEnd = capitalisedSequenceEnd(units, index);
    if (wordEnd === undefined) {
      break;
    }
    wordCount += 1;
    lastWordEnd = wordEnd;
    const separator = units.at(wordEnd);
    const next = units.at(wordEnd + 1);
    if (separator?.kind !== "space" || next === undefined) {
      break;
    }
    index = wordEnd + 1;
  }

  return wordCount >= 3 ? lastWordEnd : undefined;
}

function unsupported(token: ScalarToken): Grade1UnsupportedCharacter {
  return {
    character: token.value,
    codeUnitIndex: token.codeUnitIndex,
    mode: "grade1",
    ok: false,
    reason: "unsupported-character",
    scalarIndex: token.scalarIndex,
  };
}

function parseText(text: string): ParseResult {
  const tokens = tokenize(text);
  const units: TranslatableUnit[] = [];
  let skipUntil = 0;

  for (const [index, token] of tokens.entries()) {
    if (index < skipUntil) {
      continue;
    }
    const letter = analyseLetter(token.value);
    if (letter !== undefined) {
      units.push({ ...letter, kind: "letter" });
      continue;
    }
    const digit = digitCell(token.value);
    if (digit !== undefined) {
      units.push({ cell: digit, kind: "digit" });
      continue;
    }
    if (token.value === " ") {
      units.push({ kind: "space" });
      continue;
    }
    if (isAsciiLineBoundary(token.value)) {
      const next = tokens.at(index + 1);
      if (token.value === "\r" && next?.value === "\n") {
        units.push({ kind: "line-boundary", value: "\r\n" });
        skipUntil = index + 2;
      } else {
        units.push({ kind: "line-boundary", value: token.value });
      }
      continue;
    }
    const symbol = SYMBOLS.get(token.value);
    if (symbol === undefined) {
      return unsupported(token);
    }
    units.push({ braille: symbol, kind: "symbol", source: token.value });
  }

  return { ok: true, units };
}

function questionMarkNeedsGrade1(
  previous: TranslatableUnit | undefined,
): boolean {
  return (
    previous === undefined ||
    previous.kind === "space" ||
    previous.kind === "line-boundary" ||
    (previous.kind === "symbol" &&
      (previous.source === "-" ||
        previous.source === "–" ||
        previous.source === "—"))
  );
}

function translateUnits(
  units: readonly TranslatableUnit[],
  suppressCapitals: boolean,
): string {
  let braille = "";
  let numericMode = false;
  let previousUnit: TranslatableUnit | undefined;
  let skipUntil = 0;

  for (const [index, unit] of units.entries()) {
    const previous = previousUnit;
    previousUnit = unit;
    if (index < skipUntil) {
      continue;
    }

    if (!suppressCapitals) {
      const passageEnd = capitalsPassageEnd(units, index);
      if (passageEnd !== undefined) {
        braille +=
          CAPITALS_PASSAGE_INDICATOR +
          translateUnits(units.slice(index, passageEnd), true) +
          CAPITALS_TERMINATOR;
        numericMode = false;
        skipUntil = passageEnd;
        continue;
      }
    }

    if (unit.kind === "letter") {
      if (numericMode && unit.numericAmbiguous && !unit.uppercase) {
        braille += GRADE_1_SYMBOL_INDICATOR;
      }
      numericMode = false;

      const letters: LetterUnit[] = [unit];
      for (const following of units.slice(index + 1)) {
        if (following.kind !== "letter") {
          break;
        }
        letters.push(following);
      }
      const capitalsWord =
        !suppressCapitals &&
        letters.length >= 2 &&
        letters.every((letter) => letter.uppercase);
      if (capitalsWord) {
        braille += CAPITALS_WORD_INDICATOR;
      }

      for (const current of letters) {
        if (!suppressCapitals && !capitalsWord && current.uppercase) {
          braille += CAPITAL_INDICATOR;
        }
        braille += current.modifiers + current.cell;
      }
      skipUntil = index + letters.length;
      continue;
    }

    if (unit.kind === "digit") {
      if (!numericMode) {
        braille += NUMERIC_INDICATOR;
      }
      braille += unit.cell;
      numericMode = true;
      continue;
    }

    if (
      numericMode &&
      unit.kind === "symbol" &&
      (unit.source === "," || unit.source === ".")
    ) {
      braille += unit.braille;
      continue;
    }

    numericMode = false;
    if (unit.kind === "space") {
      braille += BRAILLE_BLANK;
      continue;
    }
    if (unit.kind === "line-boundary") {
      braille += unit.value;
      continue;
    }
    if (unit.source === "?" && questionMarkNeedsGrade1(previous)) {
      braille += GRADE_1_SYMBOL_INDICATOR;
    }
    braille += unit.braille;
  }

  return braille;
}

function translateText(text: string): Grade1Result {
  const parsed = parseText(text);
  return parsed.ok
    ? { braille: translateUnits(parsed.units, false), mode: "grade1", ok: true }
    : parsed;
}

function countSequences(text: string): number {
  let count = 0;
  let insideSequence = false;
  for (const value of text) {
    const whitespace = value === " " || isAsciiLineBoundary(value);
    if (whitespace) {
      insideSequence = false;
    } else if (!insideSequence) {
      count += 1;
      insideSequence = true;
    }
  }
  return count;
}

function countNonWhitespaceScalars(text: string): number {
  let count = 0;
  for (const value of text) {
    if (value !== " " && !isAsciiLineBoundary(value)) {
      count += 1;
    }
  }
  return count;
}

function indicatorsFor(
  typeforms: readonly Grade1Typeform[],
  kind: "passage" | "symbol" | "terminator" | "word",
  reverse: boolean,
): string {
  const ordered = reverse ? [...typeforms].reverse() : typeforms;
  let result = "";
  for (const typeform of ordered) {
    result += TYPEFORM_INDICATORS[typeform][kind];
  }
  return result;
}

function translateTypeformedRun(run: Grade1TextRun): Grade1Result {
  const typeforms = run.typeforms ?? [];
  if (typeforms.length === 0 || run.text.length === 0) {
    return translateText(run.text);
  }

  const sequenceCount = countSequences(run.text);
  if (sequenceCount >= 3) {
    const translated = translateText(run.text);
    return translated.ok
      ? {
          braille:
            indicatorsFor(typeforms, "passage", false) +
            translated.braille +
            indicatorsFor(typeforms, "terminator", true),
          mode: "grade1",
          ok: true,
        }
      : translated;
  }

  if (sequenceCount === 1) {
    const translated = translateText(run.text);
    if (!translated.ok) {
      return translated;
    }
    const kind = countNonWhitespaceScalars(run.text) === 1 ? "symbol" : "word";
    return {
      braille: indicatorsFor(typeforms, kind, false) + translated.braille,
      mode: "grade1",
      ok: true,
    };
  }

  let braille = "";
  let sequence = "";
  for (const value of run.text) {
    if (value === " " || isAsciiLineBoundary(value)) {
      if (sequence.length > 0) {
        const translated = translateText(sequence);
        if (!translated.ok) {
          return translated;
        }
        braille += indicatorsFor(typeforms, "word", false) + translated.braille;
        sequence = "";
      }
      braille += value === " " ? BRAILLE_BLANK : value;
    } else {
      sequence += value;
    }
  }
  if (sequence.length > 0) {
    const translated = translateText(sequence);
    if (!translated.ok) {
      return translated;
    }
    braille += indicatorsFor(typeforms, "word", false) + translated.braille;
  }
  return { braille, mode: "grade1", ok: true };
}

function translateLigature(run: Grade1Ligature): Grade1Result {
  const letters: LetterUnit[] = [];
  for (const [letterIndex, value] of run.letters.entries()) {
    const parsed = parseText(value);
    const unit = parsed.ok ? parsed.units.at(0) : undefined;
    if (
      !parsed.ok ||
      parsed.units.length !== 1 ||
      unit?.kind !== "letter"
    ) {
      return {
        letterIndex,
        mode: "grade1",
        ok: false,
        reason: "invalid-ligature-letter",
        value,
      };
    }
    letters.push(unit);
  }

  const capitalsWord = letters.every((letter) => letter.uppercase);
  let braille = capitalsWord ? CAPITALS_WORD_INDICATOR : "";
  for (const [index, letter] of letters.entries()) {
    if (index > 0) {
      if (!capitalsWord && letter.uppercase) {
        braille += CAPITAL_INDICATOR;
      }
      braille += LIGATURE_INDICATOR;
    } else if (!capitalsWord && letter.uppercase) {
      braille += CAPITAL_INDICATOR;
    }
    braille += letter.modifiers + letter.cell;
  }
  return { braille, mode: "grade1", ok: true };
}

function translateRuns(runs: readonly Grade1Run[]): Grade1Result {
  let braille = "";
  for (const run of runs) {
    const translated =
      !("kind" in run)
        ? translateTypeformedRun(run)
        : run.kind === "braille-group"
          ? translateRuns(run.runs)
          : translateLigature(run);
    if (!translated.ok) {
      return translated;
    }
    braille +=
      "kind" in run && run.kind === "braille-group"
        ? `⠣${translated.braille}⠜`
        : translated.braille;
  }
  return { braille, mode: "grade1", ok: true };
}

function translateDocument(document: Grade1Document): Grade1Result {
  let braille = "";
  let firstParagraph = true;
  for (const paragraph of document.paragraphs) {
    if (firstParagraph) {
      firstParagraph = false;
    } else {
      braille += "\n\n";
    }
    const translated = translateRuns(paragraph.runs);
    if (!translated.ok) {
      return translated;
    }
    braille += translated.braille;
  }
  return { braille, mode: "grade1", ok: true };
}

/** Translate print to deterministic uncontracted UEB. */
export function translateGrade1(input: string): Grade1TextResult;
export function translateGrade1(input: Grade1Document): Grade1Result;
export function translateGrade1(input: string | Grade1Document): Grade1Result {
  return typeof input === "string" ? translateText(input) : translateDocument(input);
}

function numericDigitFor(letter: string): string | null {
  if (letter < "a" || letter > "j") {
    return null;
  }
  return letter === "j" ? "0" : String(letter.charCodeAt(0) - 96);
}

/** Internal inverse alphabet derived from the exact forward Grade 1 tables. */
export function grade1ReverseEntries(): readonly Grade1ReverseEntry[] {
  const letters: Grade1ReverseLetter[] = [
    ...[...LETTER_CELLS].map(([print, braille]): Grade1ReverseLetter => ({
      braille,
      kind: "letter",
      numericDigit: numericDigitFor(print),
      print,
      uppercasePrint: print.toUpperCase(),
    })),
    ...[...GREEK_CELLS].map(([print, braille]): Grade1ReverseLetter => ({
      braille,
      kind: "letter",
      numericDigit: null,
      print,
      uppercasePrint: print.toUpperCase(),
    })),
    ...[...SPECIAL_LETTER_CELLS].map(
      ([print, braille]): Grade1ReverseLetter => ({
        braille,
        kind: "letter",
        numericDigit: null,
        print,
        uppercasePrint: print === "ß" ? "ẞ" : print.toUpperCase(),
      }),
    ),
  ];
  const modifiers = [...COMBINING_MODIFIERS].map(
    ([print, braille]): Grade1ReverseModifier => ({
      braille,
      kind: "modifier",
      print,
    }),
  );
  const symbols = [...SYMBOLS].map(
    ([print, braille]): Grade1ReverseSymbol => ({
      braille,
      kind: "symbol",
      print,
    }),
  );
  const semanticControls: Grade1ReverseSemanticControl[] = [
    { braille: "⠣", kind: "semantic-control" },
    { braille: "⠜", kind: "semantic-control" },
    { braille: LIGATURE_INDICATOR, kind: "semantic-control" },
    ...Object.values(TYPEFORM_INDICATORS).flatMap(
      (indicators): readonly Grade1ReverseSemanticControl[] => [
        { braille: indicators.passage, kind: "semantic-control" },
        { braille: indicators.symbol, kind: "semantic-control" },
        { braille: indicators.terminator, kind: "semantic-control" },
        { braille: indicators.word, kind: "semantic-control" },
      ],
    ),
  ];
  return [...letters, ...modifiers, ...symbols, ...semanticControls];
}

/**
 * A deliberately limited first UEB grade-1 slice.
 *
 * Normative rules: ICEB Rules of UEB, Third Edition (2024), 4.1, 5.11.1,
 * 6.1-6.5, and 8.1-8.4.
 * https://iceb.org/publications/ueb/
 *
 * Cell encoding: Unicode Braille Patterns, U+2800-U+28FF.
 * https://www.unicode.org/charts/PDF/U2800.pdf
 */

export interface BasicGrade1Success {
  readonly braille: string;
  readonly ok: true;
}

export interface BasicGrade1UnsupportedCharacter {
  readonly character: string;
  readonly codeUnitIndex: number;
  readonly ok: false;
  readonly reason: "unsupported-character";
  readonly scalarIndex: number;
}

export type BasicGrade1Result =
  | BasicGrade1Success
  | BasicGrade1UnsupportedCharacter;

const ASCII_ZERO = 0x30;
const ASCII_NINE = 0x39;
const ASCII_UPPERCASE_A = 0x41;
const ASCII_UPPERCASE_Z = 0x5a;
const ASCII_LOWERCASE_A = 0x61;
const ASCII_LOWERCASE_J = 0x6a;
const ASCII_LOWERCASE_Z = 0x7a;
const BRAILLE_PATTERN_BLANK = 0x2800;

// UEB 4.1, stored as one six-bit Unicode offset per Basic Latin letter.
const LETTER_CELL_BITS =
  "\u0001\u0003\u0009\u0019\u0011\u000b\u001b\u0013\u000a\u001a" +
  "\u0005\u0007\u000d\u001d\u0015\u000f\u001f\u0017\u000e\u001e" +
  "%\u0027:-=5";

const CAPITAL_INDICATOR = "⠠";
const CAPITALS_WORD_INDICATOR = "⠠⠠";
const GRADE_1_SYMBOL_INDICATOR = "⠰";
const NUMERIC_INDICATOR = "⠼";
const BRAILLE_BLANK = "⠀";

function isAsciiDigit(codeUnit: number): boolean {
  return codeUnit >= ASCII_ZERO && codeUnit <= ASCII_NINE;
}

function isAsciiUppercase(codeUnit: number): boolean {
  return codeUnit >= ASCII_UPPERCASE_A && codeUnit <= ASCII_UPPERCASE_Z;
}

function isAsciiLowercase(codeUnit: number): boolean {
  return codeUnit >= ASCII_LOWERCASE_A && codeUnit <= ASCII_LOWERCASE_Z;
}

function isAsciiLetter(codeUnit: number): boolean {
  return isAsciiUppercase(codeUnit) || isAsciiLowercase(codeUnit);
}

function encodeLetterCodeUnit(codeUnit: number): string {
  const lowercaseCodeUnit = isAsciiUppercase(codeUnit)
    ? codeUnit + (ASCII_LOWERCASE_A - ASCII_UPPERCASE_A)
    : codeUnit;
  const bits = LETTER_CELL_BITS.charCodeAt(
    lowercaseCodeUnit - ASCII_LOWERCASE_A,
  );

  return String.fromCodePoint(BRAILLE_PATTERN_BLANK + bits);
}

function encodeLetterRun(text: string, start: number, end: number): string {
  let isFullyCapitalised = end - start >= 2;

  for (let index = start; index < end; index += 1) {
    if (!isAsciiUppercase(text.charCodeAt(index))) {
      isFullyCapitalised = false;
      break;
    }
  }

  let braille = isFullyCapitalised ? CAPITALS_WORD_INDICATOR : "";

  for (let index = start; index < end; index += 1) {
    const codeUnit = text.charCodeAt(index);
    if (!isFullyCapitalised && isAsciiUppercase(codeUnit)) {
      braille += CAPITAL_INDICATOR;
    }
    braille += encodeLetterCodeUnit(codeUnit);
  }

  return braille;
}

function encodeDigitCodeUnit(codeUnit: number): string {
  const digit = codeUnit - ASCII_ZERO;
  const letterIndex = digit === 0 ? 9 : digit - 1;
  const bits = LETTER_CELL_BITS.charCodeAt(letterIndex);

  return String.fromCodePoint(BRAILLE_PATTERN_BLANK + bits);
}

/**
 * Translate Basic Latin letters, ASCII digits, spaces, and line boundaries.
 * Other input returns a precise typed failure until its controlling UEB rules
 * are implemented.
 */
export function translateBasicGrade1(text: string): BasicGrade1Result {
  let braille = "";
  let codeUnitIndex = 0;
  let scalarIndex = 0;

  while (codeUnitIndex < text.length) {
    const codeUnit = text.charCodeAt(codeUnitIndex);

    if (isAsciiLetter(codeUnit)) {
      let end = codeUnitIndex + 1;
      while (end < text.length && isAsciiLetter(text.charCodeAt(end))) {
        end += 1;
      }
      braille += encodeLetterRun(text, codeUnitIndex, end);
      scalarIndex += end - codeUnitIndex;
      codeUnitIndex = end;
      continue;
    }

    if (isAsciiDigit(codeUnit)) {
      braille += NUMERIC_INDICATOR;
      let end = codeUnitIndex;
      while (end < text.length && isAsciiDigit(text.charCodeAt(end))) {
        braille += encodeDigitCodeUnit(text.charCodeAt(end));
        end += 1;
      }
      if (
        end < text.length &&
        text.charCodeAt(end) >= ASCII_LOWERCASE_A &&
        text.charCodeAt(end) <= ASCII_LOWERCASE_J
      ) {
        braille += GRADE_1_SYMBOL_INDICATOR;
      }
      scalarIndex += end - codeUnitIndex;
      codeUnitIndex = end;
      continue;
    }

    if (codeUnit === 0x20) {
      braille += BRAILLE_BLANK;
      codeUnitIndex += 1;
      scalarIndex += 1;
      continue;
    }

    if (codeUnit === 0x0a || codeUnit === 0x0d) {
      const isWindowsLineEnding =
        codeUnit === 0x0d && text.charCodeAt(codeUnitIndex + 1) === 0x0a;
      braille += isWindowsLineEnding ? "\r\n" : String.fromCharCode(codeUnit);
      const width = isWindowsLineEnding ? 2 : 1;
      codeUnitIndex += width;
      scalarIndex += width;
      continue;
    }

    const followingCodeUnit = text.charCodeAt(codeUnitIndex + 1);
    const isSurrogatePair =
      codeUnit >= 0xd800 &&
      codeUnit <= 0xdbff &&
      followingCodeUnit >= 0xdc00 &&
      followingCodeUnit <= 0xdfff;
    const unsupportedWidth = isSurrogatePair ? 2 : 1;

    return {
      character: text.slice(codeUnitIndex, codeUnitIndex + unsupportedWidth),
      codeUnitIndex,
      ok: false,
      reason: "unsupported-character",
      scalarIndex,
    };
  }

  return { braille, ok: true };
}

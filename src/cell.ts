/**
 * Unicode Braille Patterns encoding.
 *
 * Algorithm: The Unicode Standard, Braille Patterns, U+2800-U+28FF.
 * https://www.unicode.org/charts/PDF/U2800.pdf
 */

export type UebDot = 1 | 2 | 3 | 4 | 5 | 6;

const BRAILLE_PATTERN_BLANK = 0x2800;

/** Encode a six-dot cell as one Unicode Braille Pattern scalar. */
export function encodeCell(dots: readonly UebDot[]): string {
  let bitPattern = 0;

  for (const dot of dots) {
    bitPattern |= 1 << (dot - 1);
  }

  return String.fromCodePoint(BRAILLE_PATTERN_BLANK + bitPattern);
}

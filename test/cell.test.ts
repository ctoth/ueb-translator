import { describe, expect, it } from "vitest";

import { encodeCell, type UebDot } from "../src/index.js";

describe("encodeCell", () => {
  it("encodes the blank cell", () => {
    expect(encodeCell([])).toBe("⠀");
  });

  it("encodes each UEB dot in its Unicode bit position", () => {
    const dots: readonly UebDot[] = [1, 2, 3, 4, 5, 6];

    expect(dots.map((dot) => encodeCell([dot]))).toEqual([
      "⠁",
      "⠂",
      "⠄",
      "⠈",
      "⠐",
      "⠠",
    ]);
  });

  it("encodes a full six-dot cell", () => {
    expect(encodeCell([1, 2, 3, 4, 5, 6])).toBe("⠿");
  });

  it("is insensitive to dot order and repeated dots", () => {
    expect(encodeCell([6, 1, 1, 4])).toBe(encodeCell([1, 4, 6]));
  });
});

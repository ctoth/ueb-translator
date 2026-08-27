import { describe, expect, it } from "vitest";

import {
  invertContextualProgram,
  matchPrefixTable,
  runContextualTransducer,
  type CompactPrefixTable,
  type ContextualGuardTuple,
  type ContextualTransducerProgram,
} from "../src/contextual-transducer.js";

function encode(values: readonly number[]): string {
  return String.fromCharCode(...values.map((value) => value + 0x100));
}

function translateGuard(
  word: string,
  guard: ContextualGuardTuple,
  stringOperands: readonly string[] = [],
): string {
  return runContextualTransducer(
    { ...suffixGuardProgram, guards: [guard], stringOperands },
    {
      boundaries: [],
      eligibilityOffset: 0,
      eligibilityWord: word,
      hasLowerPunctuation: false,
      hasRestrictingLowerPunctuation: false,
      hasUpperPunctuation: false,
      standing: true,
      word,
    },
    (character) => character.toUpperCase(),
  ).braille;
}

const suffixGuardProgram: ContextualTransducerProgram = {
  guards: [[5, 8]],
  matcher: [
    ["a"],
    ["ab"],
    encode([0, ...Array.from({ length: 26 }, () => 1)]),
    encode([0, ...Array.from({ length: 26 }, () => 1)]),
    encode([0, ...Array.from({ length: 26 }, () => 1)]),
    encode([1]),
    encode([1]),
  ],
  rules: [["X", 0, 1]],
  stringOperands: [],
};

function translate(
  boundary: boolean,
  program: ContextualTransducerProgram = suffixGuardProgram,
): string {
  return runContextualTransducer(
    program,
    {
      boundaries: boundary ? [{ at: 1, kind: "suffix" }] : [],
      eligibilityOffset: 0,
      eligibilityWord: "ab",
      hasLowerPunctuation: false,
      hasRestrictingLowerPunctuation: false,
      hasUpperPunctuation: false,
      standing: true,
      word: "ab",
    },
    (character) => character.toUpperCase(),
  ).braille;
}

describe("runContextualTransducer", () => {
  it("interprets a typed suffix-boundary mask", () => {
    expect(translate(false)).toBe("X");
    expect(translate(true)).toBe("AB");
  });

  it("uses local start, end, previous, and following positions", () => {
    expect(translateGuard("aba", [2, 0], ["aeiouy"])).toBe("ABA");
    expect(translateGuard("abz", [2, 0], ["aeiouy"])).toBe("XZ");
    expect(translateGuard("ab", [8])).toBe("AB");
    expect(translateGuard("abz", [8])).toBe("XZ");
    expect(translateGuard("ab", [9])).toBe("AB");
    expect(translateGuard("zab", [9])).toBe("ZX");
    expect(translateGuard("ab", [10])).toBe("AB");
    expect(translateGuard("abz", [10])).toBe("XZ");
    expect(translateGuard("cab", [11, 0], ["c"])).toBe("CAB");
    expect(translateGuard("yab", [11, 0], ["c"])).toBe("YX");
    expect(translateGuard("ab", [13])).toBe("X");
    expect(translateGuard("abz", [13])).toBe("ABZ");
    expect(translateGuard("zabz", [14])).toBe("ZXZ");
    expect(translateGuard("zab", [14])).toBe("ZAB");
    expect(translateGuard("ab", [15])).toBe("X");
    expect(translateGuard("zab", [15])).toBe("ZAB");
  });

  it("fails closed for malformed cross-array references", () => {
    expect(() => translate(false, {
      ...suffixGuardProgram,
      guards: [[6, 0, 1]],
      stringOperands: [],
    })).toThrow(/missing operand/u);
    expect(() => translate(false, {
      ...suffixGuardProgram,
      guards: [],
    })).toThrow(/missing guard/u);
    expect(() => translate(false, {
      ...suffixGuardProgram,
      rules: [],
    })).toThrow(/missing rule/u);
  });
});

describe("matchPrefixTable", () => {
  const table: CompactPrefixTable = [
    ["a"],
    ["a"],
    encode([0, 1]),
    encode([0, 1]),
    encode([0, 0]),
    encode([1]),
    encode([0]),
  ];

  const multiPrefixTable: CompactPrefixTable = [
    ["a", "b"],
    ["a", "ab", "b"],
    encode([0, 2, 3]),
    encode([0, 2, 3]),
    encode([0, 0, 0]),
    encode([1, 1, 1]),
    encode([0, 0, 0]),
  ];

  it("returns every exact prefix with its compiled rule range", () => {
    expect(matchPrefixTable(multiPrefixTable, "xab", 1)).toEqual([
      { endCodeUnitIndex: 2, guardOffset: 0, ruleCount: 1, ruleOffset: 0 },
      { endCodeUnitIndex: 3, guardOffset: 0, ruleCount: 1, ruleOffset: 1 },
    ]);
  });

  it("fails closed at invalid scalar boundaries, buckets, and encoded ranges", () => {
    expect(matchPrefixTable(multiPrefixTable, "😀", 1)).toEqual([]);
    expect(matchPrefixTable(multiPrefixTable, "😀", -1)).toEqual([]);
    expect(matchPrefixTable(multiPrefixTable, "😀", 0.5)).toEqual([]);
    expect(matchPrefixTable(multiPrefixTable, "😀", 3)).toEqual([]);
    expect(matchPrefixTable(multiPrefixTable, "A", 0)).toEqual([]);
    expect(matchPrefixTable([
      multiPrefixTable[0],
      multiPrefixTable[1],
      "",
      multiPrefixTable[3],
      multiPrefixTable[4],
      multiPrefixTable[5],
      multiPrefixTable[6],
    ], "a", 0)).toEqual([]);
    expect(matchPrefixTable([
      multiPrefixTable[0],
      multiPrefixTable[1],
      multiPrefixTable[2],
      multiPrefixTable[3],
      "",
      multiPrefixTable[5],
      multiPrefixTable[6],
    ], "a", 0)).toEqual([]);
  });

  it("returns no match at the end of input", () => {
    expect(matchPrefixTable(table, "", 0)).toEqual([]);
  });

  it("fails closed for malformed per-input compact arrays", () => {
    expect(matchPrefixTable([
      table[0],
      [],
      table[2],
      table[3],
      table[4],
      table[5],
      table[6],
    ], "a", 0)).toEqual([]);
    expect(matchPrefixTable([
      table[0],
      table[1],
      table[2],
      table[3],
      table[4],
      "",
      table[6],
    ], "a", 0)).toEqual([]);
    expect(matchPrefixTable([
      table[0],
      table[1],
      table[2],
      table[3],
      table[4],
      table[5],
      "",
    ], "a", 0)).toEqual([]);
  });
});

describe("invertContextualProgram", () => {
  it("fails closed when compact inverse arrays disagree", () => {
    expect(() => invertContextualProgram({
      ...suffixGuardProgram,
      matcher: [
        suffixGuardProgram.matcher[0],
        ["ab"],
        suffixGuardProgram.matcher[2],
        suffixGuardProgram.matcher[3],
        suffixGuardProgram.matcher[4],
        "",
        suffixGuardProgram.matcher[6],
      ],
    })).toThrow(/malformed rule count/u);

    expect(() => invertContextualProgram({
      ...suffixGuardProgram,
      rules: [],
    })).toThrow(/missing rule/u);

    expect(() => invertContextualProgram({
      ...suffixGuardProgram,
      matcher: [
        [],
        [],
        suffixGuardProgram.matcher[2],
        suffixGuardProgram.matcher[3],
        suffixGuardProgram.matcher[4],
        "",
        suffixGuardProgram.matcher[6],
      ],
    })).toThrow(/unindexed inverse rules/u);
  });
});

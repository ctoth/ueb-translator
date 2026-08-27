import { describe, expect, it } from "vitest";

import {
  invertContextualProgram,
  runContextualTransducer,
  type ContextualTransducerProgram,
} from "../src/contextual-transducer.js";

function encode(values: readonly number[]): string {
  return String.fromCharCode(...values.map((value) => value + 0x100));
}

const suffixGuardProgram: ContextualTransducerProgram = {
  guards: [[5, 8]],
  matcher: [
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
      hasUpperPunctuation: false,
      positionalOffset: 0,
      positionalWord: "ab",
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

  it("fails closed for malformed cross-array references", () => {
    expect(() => translate(false, {
      ...suffixGuardProgram,
      guards: [[6, 0]],
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

describe("invertContextualProgram", () => {
  it("fails closed when compact inverse arrays disagree", () => {
    expect(() => invertContextualProgram({
      ...suffixGuardProgram,
      matcher: [
        ["ab"],
        suffixGuardProgram.matcher[1],
        suffixGuardProgram.matcher[2],
        suffixGuardProgram.matcher[3],
        "",
        suffixGuardProgram.matcher[5],
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
        suffixGuardProgram.matcher[1],
        suffixGuardProgram.matcher[2],
        suffixGuardProgram.matcher[3],
        "",
        suffixGuardProgram.matcher[5],
      ],
    })).toThrow(/unindexed inverse rules/u);
  });
});

import { randomBytes } from "node:crypto";

import fc from "fast-check";

export interface FuzzEnvironment {
  readonly ORACLE_FUZZ_NUM_RUNS?: string;
  readonly ORACLE_FUZZ_SEED?: string;
}

export interface FuzzRunConfiguration {
  readonly numRuns: number;
  readonly seed: number;
}

export function freshSeed(
  bytes: (size: number) => Buffer = randomBytes,
): number {
  return bytes(4).readInt32BE(0);
}

function integerEnvironmentValue(
  value: string | undefined,
  name: string,
  fallback: number,
  minimum: number,
): number {
  if (value === undefined) {
    return fallback;
  }
  if (!/^-?\d+$/u.test(value)) {
    throw new Error(`${name} must be an integer.`);
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < minimum) {
    throw new Error(`${name} must be an integer of at least ${String(minimum)}.`);
  }
  return parsed;
}

export function parseFuzzRunConfiguration(
  environment: FuzzEnvironment,
): FuzzRunConfiguration {
  return {
    numRuns: integerEnvironmentValue(
      environment.ORACLE_FUZZ_NUM_RUNS,
      "ORACLE_FUZZ_NUM_RUNS",
      10_000,
      1,
    ),
    seed: integerEnvironmentValue(
      environment.ORACLE_FUZZ_SEED,
      "ORACLE_FUZZ_SEED",
      freshSeed(),
      -2_147_483_648,
    ),
  };
}

const asciiLetter = fc.constantFrom(...Array.from("abcdefghijklmnopqrstuvwxyz"));
const ordinaryWord = fc.array(asciiLetter, { maxLength: 18, minLength: 1 })
  .map((letters) => letters.join(""));
const contractionStart = fc.tuple(
  fc.constantFrom("be", "con", "dis"),
  ordinaryWord,
).map(([prefix, suffix]) => `${prefix}${suffix}`);
const contractionEnd = fc.tuple(
  ordinaryWord,
  fc.constantFrom("ness", "ful", "ment", "enced", "iness", "eness"),
).map(([prefix, suffix]) => `${prefix}${suffix}`);
const groupsignWord = fc.tuple(
  ordinaryWord,
  fc.constantFrom("en", "in", "ea", "ch", "sh", "th", "wh", "ou", "st"),
  ordinaryWord,
).map(([left, group, right]) => `${left}${group}${right}`);
const elision = fc.tuple(ordinaryWord, ordinaryWord)
  .map(([left, right]) => `${left}'${right}`);
const compound = fc.tuple(ordinaryWord, ordinaryWord)
  .map(([left, right]) => `${left}-${right}`);
const numericAmbiguity = fc.tuple(
  fc.integer({ max: 999_999, min: 0 }),
  fc.constantFrom(...Array.from("abcdefghij")),
).map(([number, letter]) => `${String(number)}${letter}`);
const letterSequence = fc.array(asciiLetter, { maxLength: 6, minLength: 1 })
  .map((letters) => letters.join(""));
const capitalsMix = ordinaryWord.map((word) =>
  Array.from(word).map((letter, index) => index % 2 === 0 ? letter.toUpperCase() : letter)
    .join("")
);
const punctuationWalk = fc.tuple(
  fc.constantFrom("(", "[", "{", "\"", "'"),
  ordinaryWord,
  fc.constantFrom(")", "]", "}", "\"", "'", "!", "?", ".", ",", ";", ":"),
).map(([opening, word, closing]) => `${opening}${word}${closing}`);

export function buildFuzzArbitrary(): fc.Arbitrary<string> {
  return fc.oneof(
    { depthSize: "small", withCrossShrink: true },
    contractionStart,
    contractionEnd,
    groupsignWord,
    elision,
    compound,
    numericAmbiguity,
    letterSequence,
    capitalsMix,
    punctuationWalk,
  );
}

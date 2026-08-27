import {
  matchPrefixTable,
  type CompactPrefixTable,
} from "./transducer.js";

export type ContextualBoundaryKind =
  | "braille-line"
  | "compound"
  | "prefix"
  | "suffix"
  | "syllable";

export interface ContextualBoundary {
  readonly at: number;
  readonly kind: ContextualBoundaryKind;
}

export type ContextualGuardOpcode =
  | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
  | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16;
export type ContextualPrecedence = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type ContextualBoundaryMask =
  | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
  | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20
  | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31;
type NoOperandGuardOpcode = 1 | 2 | 3 | 8 | 9 | 10 | 12 | 13 | 14 | 15 | 16;
type StringOperandGuardOpcode = 0 | 6 | 7 | 11;
type BoundaryOperandGuardOpcode = 4 | 5;
export type ContextualGuardTuple =
  | readonly [opcode: NoOperandGuardOpcode]
  | readonly [opcode: StringOperandGuardOpcode, stringOperandIndex: number]
  | readonly [opcode: BoundaryOperandGuardOpcode, boundaryMask: ContextualBoundaryMask];
export type ContextualRuleTuple = readonly [
  braille: string,
  precedence: ContextualPrecedence,
  guardCount: number,
];
export interface ContextualTransducerProgram {
  readonly guards: readonly ContextualGuardTuple[];
  readonly matcher: CompactPrefixTable;
  readonly rules: readonly ContextualRuleTuple[];
  readonly stringOperands: readonly string[];
}

export interface ComposedContractionProgram extends ContextualTransducerProgram {
  readonly grade1Ambiguities: readonly (
    readonly [print: string, braille: string]
  )[];
  readonly standingLiteralInputs: readonly string[];
}

export interface ContextualTransducerInput {
  readonly boundaries: readonly ContextualBoundary[];
  readonly eligibilityOffset: number;
  readonly eligibilityWord: string;
  readonly hasLowerPunctuation: boolean;
  readonly hasRestrictingLowerPunctuation: boolean;
  readonly hasUpperPunctuation: boolean;
  readonly standing: boolean;
  readonly word: string;
}

export interface ContextualAppliedRule {
  readonly end: number;
  readonly print: string;
  readonly ruleIndex: number;
  readonly start: number;
}

export interface ContextualTransduction {
  readonly braille: string;
  readonly rules: readonly ContextualAppliedRule[];
}

export interface ContextualInverseRule {
  readonly braille: string;
  readonly print: string;
  readonly ruleIndex: number;
}

interface Candidate {
  readonly braille: string;
  readonly end: number;
  readonly print: string;
  readonly rank: number;
  readonly ruleIndex?: number;
}

interface BestPath extends ContextualTransduction {
  readonly cellCount: number;
  readonly preferenceScore: number;
  readonly rankKey: string;
}

function operandAt(program: ContextualTransducerProgram, index: number): string {
  const operand = program.stringOperands[index];
  if (operand === undefined) {
    throw new Error("Generated contextual program references a missing operand.");
  }
  return operand;
}

function boundaryBit(kind: ContextualBoundaryKind): ContextualBoundaryMask {
  switch (kind) {
    case "braille-line":
      return 1;
    case "compound":
      return 2;
    case "prefix":
      return 4;
    case "suffix":
      return 8;
    case "syllable":
      return 16;
  }
}

function crossesBoundaryMask(
  start: number,
  end: number,
  boundaries: readonly ContextualBoundary[],
  mask: ContextualBoundaryMask,
): boolean {
  return boundaries.some(
    (boundary) => boundary.at > start && boundary.at < end &&
      (mask & boundaryBit(boundary.kind)) !== 0,
  );
}

function guardAllows(
  program: ContextualTransducerProgram,
  guard: ContextualGuardTuple,
  print: string,
  start: number,
  context: ContextualTransducerInput,
): boolean {
  const end = start + print.length;
  const eligibilityStart = context.eligibilityOffset + start;
  const eligibilityWord = context.eligibilityWord;
  switch (guard[0]) {
    case 0: {
      const operand = operandAt(program, guard[1]);
      const eligible = eligibilityWord === operand ||
        (eligibilityWord.endsWith("s") &&
          eligibilityWord.slice(0, -1) === operand);
      return eligible && operand.startsWith(
        print,
        eligibilityStart,
      );
    }
    case 1: {
      const syllableBoundaries = context.boundaries.filter(
        (boundary) => boundary.kind === "syllable",
      );
      return syllableBoundaries.length === 0 ||
        syllableBoundaries.some((boundary) => boundary.at === end);
    }
    case 2: {
      const following = context.word.charAt(end);
      return following === "" || !"aeiouy".includes(following);
    }
    case 3:
      return !context.hasRestrictingLowerPunctuation || context.hasUpperPunctuation;
    case 4:
    case 5:
      return !crossesBoundaryMask(start, end, context.boundaries, guard[1]);
    case 6: {
      const operand = operandAt(program, guard[1]);
      return !operand.split("\u0000").includes(eligibilityWord.replaceAll("-", ""));
    }
    case 7: {
      const operand = operandAt(program, guard[1]);
      return !operand.split("\u0000").some((ending) => eligibilityWord.endsWith(ending));
    }
    case 8:
      return end !== context.word.length;
    case 9:
      return start !== 0;
    case 10:
      return start !== 0 || end !== context.word.length;
    case 11: {
      const operand = operandAt(program, guard[1]);
      return start === 0 || !operand.includes(context.word.charAt(start - 1));
    }
    case 12:
      return context.standing;
    case 13:
      return end === context.word.length;
    case 14:
      return start !== 0 && end !== context.word.length;
    case 15:
      return start === 0;
    case 16:
      return !context.hasLowerPunctuation;
  }
}

function permitsRule(
  program: ContextualTransducerProgram,
  guardOffset: number,
  guardCount: number,
  print: string,
  start: number,
  context: ContextualTransducerInput,
): boolean {
  for (let index = guardOffset; index < guardOffset + guardCount; index += 1) {
    const guard = program.guards[index];
    if (guard === undefined) {
      throw new Error("Generated contextual program references a missing guard.");
    }
    if (!guardAllows(program, guard, print, start, context)) {
      return false;
    }
  }
  return true;
}

function candidatesAt(
  program: ContextualTransducerProgram,
  context: ContextualTransducerInput,
  start: number,
  literalCell: (character: string) => string,
): readonly Candidate[] {
  const literal = context.word.charAt(start);
  const candidates: Candidate[] = [{
    braille: literalCell(literal),
    end: start + 1,
    print: literal,
    rank: 9,
  }];

  for (const match of matchPrefixTable(
    program.matcher,
    context.word,
    start,
  )) {
    const print = context.word.slice(start, match.endCodeUnitIndex);
    let guardOffset = match.guardOffset;
    for (
      let ruleIndex = match.ruleOffset;
      ruleIndex < match.ruleOffset + match.ruleCount;
      ruleIndex += 1
    ) {
      const rule = program.rules[ruleIndex];
      if (rule === undefined) {
        throw new Error("Generated contextual program references a missing rule.");
      }
      const [braille, precedence, guardCount] = rule;
      if (permitsRule(
        program,
        guardOffset,
        guardCount,
        print,
        start,
        context,
      )) {
        candidates.push({
          braille,
          end: match.endCodeUnitIndex,
          print,
          rank: precedence,
          ruleIndex,
        });
      }
      guardOffset += guardCount;
    }
  }
  return candidates;
}

function better(left: BestPath, right: BestPath): BestPath {
  if (left.cellCount !== right.cellCount) {
    return left.cellCount < right.cellCount ? left : right;
  }
  if (left.preferenceScore !== right.preferenceScore) {
    return left.preferenceScore < right.preferenceScore ? left : right;
  }
  /* v8 ignore next -- equal-score rules are compiler ordered; retain a stable fallback. */
  if (left.rankKey !== right.rankKey) {
    /* v8 ignore next -- see the equal-score invariant above. */
    return left.rankKey < right.rankKey ? left : right;
  }
  /* v8 ignore next -- identical compiled outputs need no observable distinction. */
  return left.braille <= right.braille ? left : right;
}

/**
 * Interpret a compiled contextual rule program with Bellman's backward
 * recurrence over its acyclic segmentation graph.
 * https://doi.org/10.1073/pnas.38.8.716
 */
export function runContextualTransducer(
  program: ContextualTransducerProgram,
  context: ContextualTransducerInput,
  literalCell: (character: string) => string,
): ContextualTransduction {
  const best: (BestPath | undefined)[] = Array.from(
    { length: context.word.length + 1 },
    (): BestPath | undefined => undefined,
  );
  best[context.word.length] = {
    braille: "",
    cellCount: 0,
    preferenceScore: 0,
    rankKey: "",
    rules: [],
  };

  for (let start = context.word.length - 1; start >= 0; start -= 1) {
    let selected: BestPath | undefined;
    for (const candidate of candidatesAt(program, context, start, literalCell)) {
      const suffix = best[candidate.end];
      /* v8 ignore next -- the literal edge makes every suffix reachable. */
      if (suffix === undefined) {
        continue;
      }
      const rules = candidate.ruleIndex === undefined
        ? suffix.rules
        : [{
            end: candidate.end,
            print: candidate.print,
            ruleIndex: candidate.ruleIndex,
            start,
          }, ...suffix.rules];
      const path: BestPath = {
        braille: candidate.braille + suffix.braille,
        cellCount: candidate.braille.length + suffix.cellCount,
        preferenceScore:
          (candidate.ruleIndex === undefined ? 0 : candidate.rank) +
          suffix.preferenceScore,
        rankKey: `${String(candidate.rank).padStart(2, "0")}${suffix.rankKey}`,
        rules,
      };
      selected = selected === undefined ? path : better(selected, path);
    }
    best[start] = selected;
  }

  const result = best[0];
  /* v8 ignore next -- the literal edge makes position zero reachable. */
  return result ?? { braille: "", rules: [] };
}

function compactCount(values: string, index: number): number | undefined {
  const encoded = values.charCodeAt(index);
  return Number.isNaN(encoded) ? undefined : encoded - 0x100;
}

/**
 * Invert the compiled rule edges without duplicating their print strings.
 * The caller still applies the complete forward transducer to validate context.
 */
export function invertContextualProgram(
  program: ContextualTransducerProgram,
): readonly ContextualInverseRule[] {
  const [inputs, , , , inputRuleCounts] = program.matcher;
  const inverse: ContextualInverseRule[] = [];
  let ruleIndex = 0;
  for (const [inputIndex, print] of inputs.entries()) {
    const ruleCount = compactCount(inputRuleCounts, inputIndex);
    if (ruleCount === undefined) {
      throw new Error("Generated contextual program has a malformed rule count.");
    }
    for (let offset = 0; offset < ruleCount; offset += 1) {
      const rule = program.rules[ruleIndex];
      if (rule === undefined) {
        throw new Error("Generated contextual program references a missing rule.");
      }
      inverse.push({ braille: rule[0], print, ruleIndex });
      ruleIndex += 1;
    }
  }
  if (ruleIndex !== program.rules.length) {
    throw new Error("Generated contextual program has unindexed inverse rules.");
  }
  return inverse;
}

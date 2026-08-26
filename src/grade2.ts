import {
  GRADE2_PROGRAM,
  type ContextualGuardOpcode,
  type ContextualRuleTuple,
} from "./generated/grade2-program.js";
import { translateGrade1 } from "./grade1.js";

export type Grade2BoundaryKind =
  | "braille-line"
  | "compound"
  | "prefix"
  | "suffix"
  | "syllable";

export interface Grade2Boundary {
  readonly at: number;
  readonly kind: Grade2BoundaryKind;
}

export interface Grade2TextRun {
  readonly kind: "text";
  readonly text: string;
}

export interface Grade2WordRun {
  readonly boundaries?: readonly Grade2Boundary[];
  readonly kind: "word";
  readonly standing: "alone" | "joined";
  readonly text: string;
}

export type Grade2Run = Grade2TextRun | Grade2WordRun;

export interface Grade2Document {
  readonly kind: "grade2-document";
  readonly runs: readonly Grade2Run[];
}

export interface Grade2Success {
  readonly braille: string;
  readonly mode: "grade2";
  readonly ok: true;
}

export interface Grade2UnsupportedCharacter {
  readonly character: string;
  readonly codeUnitIndex: number;
  readonly mode: "grade2";
  readonly ok: false;
  readonly reason: "unsupported-character";
  readonly scalarIndex: number;
}

export interface Grade2InvalidBoundary {
  readonly at: number;
  readonly mode: "grade2";
  readonly ok: false;
  readonly reason: "invalid-boundary";
  readonly runIndex: number;
}

export type Grade2Result =
  | Grade2InvalidBoundary
  | Grade2Success
  | Grade2UnsupportedCharacter;

export interface Grade2AppliedRule {
  readonly end: number;
  readonly print: string;
  readonly ruleIndex: number;
  readonly start: number;
}

export interface Grade2InternalSuccess extends Grade2Success {
  readonly rules: readonly Grade2AppliedRule[];
}

export type Grade2InternalResult =
  | Grade2InternalSuccess
  | Grade2InvalidBoundary
  | Grade2UnsupportedCharacter;

interface Candidate {
  readonly braille: string;
  readonly end: number;
  readonly print: string;
  readonly rank: number;
  readonly ruleIndex?: number;
}

interface BestPath {
  readonly braille: string;
  readonly cellCount: number;
  readonly preferenceScore: number;
  readonly rankKey: string;
  readonly rules: readonly Grade2AppliedRule[];
}

interface LowerSignContext {
  readonly hasLowerPunctuation: boolean;
  readonly hasUpperPunctuation: boolean;
}

const CAPITAL_INDICATOR = "⠠";
const CAPITALS_WORD_INDICATOR = "⠠⠠";
const LETTER_CELLS = "⠁⠃⠉⠙⠑⠋⠛⠓⠊⠚⠅⠇⠍⠝⠕⠏⠟⠗⠎⠞⠥⠧⠺⠭⠽⠵";
const NO_PUNCTUATION_CONTACT: LowerSignContext = {
  hasLowerPunctuation: false,
  hasUpperPunctuation: false,
};

function letterCell(letter: string): string {
  const index = letter.charCodeAt(0) - 97;
  return LETTER_CELLS.charAt(index);
}

type IndexedContextualRule = readonly [
  rule: ContextualRuleTuple,
  ruleIndex: number,
];

interface GuardContext {
  readonly boundaries: readonly Grade2Boundary[];
  readonly eligibilityOffset: number;
  readonly eligibilityWord: string;
  readonly lowerSign: LowerSignContext;
  readonly standing: boolean;
  readonly word: string;
}

const RULES_BY_INITIAL: ReadonlyMap<string, readonly IndexedContextualRule[]> = (() => {
  const mutable = new Map<string, IndexedContextualRule[]>();
  for (const [ruleIndex, rule] of GRADE2_PROGRAM.rules.entries()) {
    const initial = rule[0].charAt(0);
    const bucket = mutable.get(initial);
    if (bucket === undefined) {
      mutable.set(initial, [[rule, ruleIndex]]);
    } else {
      bucket.push([rule, ruleIndex]);
    }
  }
  return mutable;
})();

function operandAt(index: number): string {
  const operand = GRADE2_PROGRAM.stringOperands[index];
  /* v8 ignore next -- generation validates every operand index. */
  if (operand === undefined) {
    throw new Error("Generated Grade 2 program references a missing operand.");
  }
  return operand;
}

function crossesNamedBoundary(
  start: number,
  end: number,
  boundaries: readonly Grade2Boundary[],
  names: string,
): boolean {
  const permittedNames = new Set(names.split("\u0000"));
  return boundaries.some(
    (boundary) => boundary.at > start && boundary.at < end &&
      permittedNames.has(boundary.kind),
  );
}

function guardAllows(
  opcode: ContextualGuardOpcode,
  operand: string,
  input: string,
  start: number,
  context: GuardContext,
): boolean {
  const end = start + input.length;
  switch (opcode) {
    case 0: {
      const eligible = context.eligibilityWord === operand ||
        (context.eligibilityWord.endsWith("s") &&
          context.eligibilityWord.slice(0, -1) === operand);
      return eligible && operand.startsWith(
        input,
        context.eligibilityOffset + start,
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
      return !context.lowerSign.hasLowerPunctuation ||
        context.lowerSign.hasUpperPunctuation;
    case 4:
    case 5:
      return !crossesNamedBoundary(start, end, context.boundaries, operand);
    case 6:
      return !operand.split("\u0000").includes(context.word.replaceAll("-", ""));
    case 7:
      return !operand.split("\u0000").some((ending) => context.word.endsWith(ending));
    case 8:
      return end !== context.word.length;
    case 9:
      return start !== 0;
    case 10:
      return start !== 0 || end !== context.word.length;
    case 11:
      return start === 0 || !operand.includes(context.word.charAt(start - 1));
    case 12:
      return context.standing;
    case 13:
      return end === context.word.length;
    case 14:
      return start !== 0 && end !== context.word.length;
    case 15:
      return start === 0;
    case 16:
      return !context.lowerSign.hasLowerPunctuation;
  }
}

function permitsRule(
  rule: ContextualRuleTuple,
  start: number,
  context: GuardContext,
): boolean {
  const [input, , , guardOffset, guardCount] = rule;
  for (let index = guardOffset; index < guardOffset + guardCount; index += 1) {
    const guard = GRADE2_PROGRAM.guards[index];
    /* v8 ignore next -- generation validates every guard range. */
    if (guard === undefined) {
      throw new Error("Generated Grade 2 program references a missing guard.");
    }
    if (!guardAllows(guard[0], operandAt(guard[1]), input, start, context)) {
      return false;
    }
  }
  return true;
}

function candidatesAt(
  word: string,
  start: number,
  boundaries: readonly Grade2Boundary[],
  standing: boolean,
  eligibilityWord: string,
  eligibilityOffset: number,
  lowerSign: LowerSignContext,
): readonly Candidate[] {
  const candidates: Candidate[] = [
    {
      braille: letterCell(word.charAt(start)),
      end: start + 1,
      print: word.charAt(start),
      rank: 9,
    },
  ];
  const context: GuardContext = {
    boundaries,
    eligibilityOffset,
    eligibilityWord,
    lowerSign,
    standing,
    word,
  };
  for (const [rule, ruleIndex] of RULES_BY_INITIAL.get(word.charAt(start)) ?? []) {
    const [print, braille, precedence] = rule;
    if (
      word.startsWith(print, start) &&
      permitsRule(rule, start, context)
    ) {
      candidates.push({
        braille,
        end: start + print.length,
        print,
        rank: precedence,
        ruleIndex,
      });
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

function contractWord(
  word: string,
  boundaries: readonly Grade2Boundary[],
  standing: boolean,
  eligibilityWord: string,
  eligibilityOffset: number,
  lowerSign: LowerSignContext,
): BestPath {
  // Bellman's backward recurrence on the acyclic segmentation graph:
  // https://doi.org/10.1073/pnas.38.8.716
  const best: (BestPath | undefined)[] = Array.from(
    { length: word.length + 1 },
    (): BestPath | undefined => undefined,
  );
  best[word.length] = {
    braille: "",
    cellCount: 0,
    preferenceScore: 0,
    rankKey: "",
    rules: [],
  };

  for (let start = word.length - 1; start >= 0; start -= 1) {
    let selected: BestPath | undefined;
    for (
      const candidate of candidatesAt(
        word,
        start,
        boundaries,
        standing,
        eligibilityWord,
        eligibilityOffset,
        lowerSign,
      )
    ) {
      const suffix = best[candidate.end];
      /* v8 ignore next -- the literal-letter edge makes every suffix reachable. */
      if (suffix === undefined) {
        continue;
      }
      const applied = candidate.ruleIndex === undefined
        ? suffix.rules
        : [
            {
              end: candidate.end,
              print: candidate.print,
              ruleIndex: candidate.ruleIndex,
              start,
            },
            ...suffix.rules,
          ];
      const path: BestPath = {
        braille: candidate.braille + suffix.braille,
        cellCount: candidate.braille.length + suffix.cellCount,
        preferenceScore:
          (candidate.ruleIndex === undefined ? 0 : candidate.rank) +
          suffix.preferenceScore,
        rankKey: `${String(candidate.rank).padStart(2, "0")}${suffix.rankKey}`,
        rules: applied,
      };
      selected = selected === undefined ? path : better(selected, path);
    }
    best[start] = selected;
  }
  /* v8 ignore next -- the literal-letter edge makes position zero reachable. */
  return best[0] ?? {
    braille: "",
    cellCount: 0,
    preferenceScore: 0,
    rankKey: "",
    rules: [],
  };
}

function contractLexicalWord(
  word: string,
  boundaries: readonly Grade2Boundary[],
  standing: boolean,
  eligibilityWord: string,
  eligibilityOffset: number,
  lowerSign: LowerSignContext,
): BestPath {
  let braille = "";
  let cellCount = 0;
  let preferenceScore = 0;
  let rankKey = "";
  const rules: Grade2AppliedRule[] = [];
  let cursor = 0;

  for (const match of word.matchAll(/[a-z]+/gu)) {
    const start = match.index;
    if (start > cursor) {
      const punctuation = word.slice(cursor, start);
      braille += "⠄".repeat(Array.from(punctuation).length);
      cellCount += Array.from(punctuation).length;
    }
    const segment = match[0];
    const segmentBoundaries = boundaries
      .filter((boundary) => boundary.at > start && boundary.at < start + segment.length)
      .map((boundary) => ({
        at: boundary.at - start,
        kind: boundary.kind,
      }));
    const contracted = contractWord(
      segment,
      segmentBoundaries,
      standing,
      eligibilityWord,
      eligibilityOffset + start,
      lowerSign,
    );
    braille += contracted.braille;
    cellCount += contracted.cellCount;
    preferenceScore += contracted.preferenceScore;
    rankKey += contracted.rankKey;
    rules.push(...contracted.rules.map((rule) => ({
      ...rule,
      end: start + rule.end,
      start: start + rule.start,
    })));
    cursor = start + segment.length;
  }
  return { braille, cellCount, preferenceScore, rankKey, rules };
}

function capitalPrefix(text: string): string | undefined {
  if (text === text.toLowerCase()) {
    return "";
  }
  if (text.length >= 2 && text === text.toUpperCase()) {
    return CAPITALS_WORD_INDICATOR;
  }
  const first = text.charAt(0);
  const rest = text.slice(1);
  return first === first.toUpperCase() && rest === rest.toLowerCase()
    ? CAPITAL_INDICATOR
    : undefined;
}

function translateWord(
  run: Grade2WordRun,
  globalOffset: number,
  appendixEligibility: readonly [word: string, offset: number] = [
    run.text.toLowerCase(),
    0,
  ],
  lowerSignContext: LowerSignContext = NO_PUNCTUATION_CONTACT,
): Grade2InternalResult {
  const boundaries = run.boundaries ?? [];
  const lower = run.text.toLowerCase();
  const prefix = capitalPrefix(run.text);
  if (!/^['’]?[a-z]+(?:['’][a-z]+)*$/u.test(lower) || prefix === undefined) {
    const grade1 = translateGrade1(run.text);
    return grade1.ok
      ? { braille: grade1.braille, mode: "grade2", ok: true, rules: [] }
      : { ...grade1, mode: "grade2" };
  }

  const contracted = contractLexicalWord(
    lower,
    boundaries,
    run.standing === "alone",
    appendixEligibility[0],
    appendixEligibility[1],
    lowerSignContext,
  );
  return {
    braille: prefix + contracted.braille,
    mode: "grade2",
    ok: true,
    rules: contracted.rules.map((rule) => ({
      ...rule,
      end: globalOffset + rule.end,
      start: globalOffset + rule.start,
    })),
  };
}

function isStandingBoundary(character: string): boolean {
  return character === "" || character === " " || character === "\n" ||
    character === "\r" || character === "-" || character === "–" ||
    character === "—";
}

function isOpeningStandingPunctuation(character: string): boolean {
  return character === "(" || character === "[" || character === "{" ||
    character === "“" || character === "‘" || character === "\"" ||
    character === "'" || character === "«";
}

function isClosingStandingPunctuation(character: string): boolean {
  return character === "," || character === ";" || character === ":" ||
    character === "." || character === "…" || character === "!" ||
    character === "?" || character === ")" || character === "]" ||
    character === "}" || character === "”" || character === "’" ||
    character === "\"" || character === "'" || character === "»";
}

function isStandingAlone(
  text: string,
  start: number,
  end: number,
): boolean {
  let before = start - 1;
  while (before >= 0 && isOpeningStandingPunctuation(text.charAt(before))) {
    before -= 1;
  }
  if (!isStandingBoundary(text.charAt(before))) {
    return false;
  }

  let after = end;
  while (after < text.length && isClosingStandingPunctuation(text.charAt(after))) {
    after += 1;
  }
  return isStandingBoundary(text.charAt(after));
}

function adaptedGrade1(text: string, globalOffset: number): Grade2InternalResult {
  const translated = translateGrade1(text);
  if (translated.ok) {
    return { braille: translated.braille, mode: "grade2", ok: true, rules: [] };
  }
  return {
    ...translated,
    codeUnitIndex: globalOffset + translated.codeUnitIndex,
    mode: "grade2",
    scalarIndex: globalOffset + translated.scalarIndex,
  };
}

function isLowerOnlyPunctuation(character: string): boolean {
  switch (character) {
    case ",":
    case ";":
    case ":":
    case ".":
    case "…":
    case "?":
    case "\"":
    case "'":
    case "“":
    case "”":
    case "‘":
    case "’":
    case "-":
    case "–":
    case "—":
      return true;
    default:
      return false;
  }
}

function lowerSignContextAt(
  sourceText: string,
  start: number,
  end: number,
): LowerSignContext {
  let hasLowerPunctuation = false;
  let hasUpperPunctuation = false;
  const inspect = (initial: number, step: -1 | 1): void => {
    let index = initial;
    while (index >= 0 && index < sourceText.length) {
      const character = sourceText.charAt(index);
      if (/^[\p{L}\p{M}\p{N}\s]$/u.test(character)) {
        break;
      }
      if (isLowerOnlyPunctuation(character)) {
        hasLowerPunctuation = true;
      } else {
        hasUpperPunctuation = true;
      }
      if (character === "-" || character === "–" || character === "—") {
        break;
      }
      index += step;
    }
  };
  inspect(start - 1, -1);
  inspect(end, 1);
  return { hasLowerPunctuation, hasUpperPunctuation };
}

function translateLexicalSequence(
  sequence: string,
  globalOffset: number,
  sourceText: string,
): Grade2InternalResult {
  const eligibilityWord = sequence.toLowerCase();
  let braille = "";
  let cursor = 0;
  const rules: Grade2AppliedRule[] = [];

  for (const match of sequence.matchAll(/[^-–—]+/gu)) {
    const start = match.index;
    if (start > cursor) {
      const separator = adaptedGrade1(
        sequence.slice(cursor, start),
        globalOffset + cursor,
      );
      /* v8 ignore next -- lexical sequence separators are validated dash scalars. */
      if (!separator.ok) {
        return separator;
      }
      braille += separator.braille;
    }
    const text = match[0];
    const translated = translateWord(
      {
        kind: "word",
        standing: isStandingAlone(
          sourceText,
          globalOffset + start,
          globalOffset + start + text.length,
        )
          ? "alone"
          : "joined",
        text,
      },
      globalOffset + start,
      [eligibilityWord, start],
      lowerSignContextAt(
        sourceText,
        globalOffset + start,
        globalOffset + start + text.length,
      ),
    );
    if (!translated.ok) {
      return translated;
    }
    braille += translated.braille;
    rules.push(...translated.rules);
    cursor = start + text.length;
  }
  return { braille, mode: "grade2", ok: true, rules };
}

function translatePlainText(text: string): Grade2InternalResult {
  let braille = "";
  let cursor = 0;
  const rules: Grade2AppliedRule[] = [];
  for (
    const match of text.matchAll(
      /['’]twould[\p{L}\p{M}]*(?:['’][\p{L}\p{M}]+)*|[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*(?:[-–—][\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*)*/giu,
    )
  ) {
    const start = match.index;
    const word = match[0];
    if (start > cursor) {
      const separator = adaptedGrade1(text.slice(cursor, start), cursor);
      if (!separator.ok) {
        return separator;
      }
      braille += separator.braille;
    }
    const translated = translateLexicalSequence(word, start, text);
    if (!translated.ok) {
      return translated;
    }
    braille += translated.braille;
    rules.push(...translated.rules);
    cursor = start + word.length;
  }
  if (cursor < text.length) {
    const separator = adaptedGrade1(text.slice(cursor), cursor);
    if (!separator.ok) {
      return separator;
    }
    braille += separator.braille;
  }
  return { braille, mode: "grade2", ok: true, rules };
}

function translateDocument(document: Grade2Document): Grade2InternalResult {
  let braille = "";
  let globalOffset = 0;
  const rules: Grade2AppliedRule[] = [];
  for (const [runIndex, run] of document.runs.entries()) {
    if (run.kind === "word") {
      for (const boundary of run.boundaries ?? []) {
        if (boundary.at <= 0 || boundary.at >= run.text.length) {
          return {
            at: boundary.at,
            mode: "grade2",
            ok: false,
            reason: "invalid-boundary",
            runIndex,
          };
        }
      }
    }
    const translated = run.kind === "word"
      ? translateWord(run, globalOffset)
      : translatePlainText(run.text);
    if (!translated.ok) {
      return translated;
    }
    braille += translated.braille;
    rules.push(...translated.rules.map((rule) => ({
      ...rule,
      end: run.kind === "word" ? rule.end : globalOffset + rule.end,
      start: run.kind === "word" ? rule.start : globalOffset + rule.start,
    })));
    globalOffset += run.text.length;
  }
  return { braille, mode: "grade2", ok: true, rules };
}

export function translateGrade2Internal(
  input: string | Grade2Document,
): Grade2InternalResult {
  return typeof input === "string" ? translatePlainText(input) : translateDocument(input);
}

/** Translate print to deterministic contracted UEB. */
export function translateGrade2(input: string | Grade2Document): Grade2Result {
  const result = translateGrade2Internal(input);
  if (!result.ok) {
    return result;
  }
  return { braille: result.braille, mode: "grade2", ok: true };
}

/**
 * Standards-driven UEB backtranslation.
 *
 * The decoder inverts the finite rule edges, constructs every cell-compatible
 * print path, and composes each Grade 2 path with the canonical forward
 * transducer as its legality test. This is the finite-state relation and
 * composition model described by Mohri (1997), without a probabilistic or
 * dictionary selector. https://aclanthology.org/J97-2003/
 *
 * Normative rules: ICEB, Rules of Unified English Braille, Third Edition
 * (2024), especially Section 10. https://iceb.org/publications/ueb/
 */

import {
  invertContextualProgram,
  type ContextualInverseRule,
} from "./contextual-transducer.js";
import { GRADE2_PROGRAM } from "./generated/ueb-2024/grade2-program.js";
import type { Grade2RuleId } from "./generated/ueb-2024/grade2-provenance.js";
import {
  translateGrade1,
} from "./grade1.js";
import {
  GRADE1_MODE_IDS,
  GRADE1_MODE_PROGRAM,
  GRADE1_SYMBOL_PROGRAM,
} from "./generated/ueb-2024/grade1-program.js";
import { modeIndicator } from "./mode-engine.js";
import {
  invertSymbolProgram,
  type CompiledSymbol,
} from "./symbol-program.js";
import { traceGrade2 } from "./grade2-diagnostics.js";
import {
  decodeForeignLanguageBraille,
  NON_UEB_PASSAGE_INDICATOR,
  NON_UEB_PASSAGE_TERMINATOR,
  NON_UEB_WORD_INDICATOR,
  NON_UEB_WORD_TERMINATOR,
  translateForeignLanguageRun,
  type ForeignLanguage,
} from "./foreign-language.js";

export type BacktranslationMode = "grade1" | "grade2";

export interface Grade1BacktranslationCandidate {
  readonly mode: "grade1";
  readonly print: string;
}

export interface Grade2BacktranslationCandidate {
  readonly mode: "grade2";
  readonly print: string;
  readonly rules: readonly Grade2RuleId[];
}

export type BacktranslationCandidate =
  | Grade1BacktranslationCandidate
  | Grade2BacktranslationCandidate;

export interface AmbiguousCandidates<Candidate> extends Iterable<Candidate> {
  readonly first: Candidate;
  readonly second: Candidate;
  readonly size: bigint;
  at(index: bigint): Candidate | undefined;
  find(
    predicate: (candidate: Candidate, index: bigint) => boolean,
  ): Candidate | undefined;
  has(candidate: Candidate): boolean;
}

export interface UniqueBacktranslation<Candidate extends BacktranslationCandidate> {
  readonly candidate: Candidate;
  readonly kind: "unique";
  readonly mode: Candidate["mode"];
}

export interface AmbiguousBacktranslation<
  Candidate extends BacktranslationCandidate,
> {
  readonly candidates: AmbiguousCandidates<Candidate>;
  readonly kind: "ambiguous";
  readonly mode: Candidate["mode"];
}

export interface InvalidBrailleCharacter<Mode extends BacktranslationMode> {
  readonly character: string;
  readonly codeUnitIndex: number;
  readonly kind: "invalid";
  readonly mode: Mode;
  readonly reason: "invalid-braille-character";
  readonly scalarIndex: number;
}

export interface NoStandardsParse<Mode extends BacktranslationMode> {
  readonly codeUnitIndex: number;
  readonly kind: "invalid";
  readonly mode: Mode;
  readonly reason: "no-standards-parse";
  readonly scalarIndex: number;
}

export interface TooAmbiguous<Mode extends BacktranslationMode> {
  readonly codeUnitIndex: number;
  readonly kind: "invalid";
  readonly limit: number;
  readonly mode: Mode;
  readonly reason: "too-ambiguous";
  readonly scalarIndex: number;
}

export type InvalidBacktranslation<Mode extends BacktranslationMode> =
  | InvalidBrailleCharacter<Mode>
  | NoStandardsParse<Mode>
  | TooAmbiguous<Mode>;

export type BacktranslationResult<
  Candidate extends BacktranslationCandidate,
> =
  | AmbiguousBacktranslation<Candidate>
  | InvalidBacktranslation<Candidate["mode"]>
  | UniqueBacktranslation<Candidate>;

type CapitalsMode = "next" | "none" | "passage" | "word";

interface DecodeState {
  readonly capitals: CapitalsMode;
  readonly grade1Next: boolean;
  readonly modifiers: string;
  readonly numeric: boolean;
}

interface DecodePath extends DecodeState {
  readonly index: number;
  readonly print: string;
  readonly semanticFormatting: boolean;
}

interface DecodedPrint {
  readonly print: string;
  readonly semanticFormatting: boolean;
}

interface DecodeResult {
  readonly candidates: readonly DecodedPrint[];
  readonly furthestCodeUnitIndex: number;
  readonly tooAmbiguousAt?: number;
  readonly tooAmbiguousLimit?: number;
}

interface LetterToken {
  readonly braille: string;
  readonly kind: "letter";
  readonly print: string;
  readonly uppercasePrint: string;
}

interface ModifierToken {
  readonly braille: string;
  readonly kind: "modifier";
  readonly print: string;
}

interface SemanticControlToken {
  readonly braille: string;
  readonly kind: "semantic-control";
}

interface SymbolToken {
  readonly braille: string;
  readonly kind: "symbol";
  readonly print: string;
}

interface WordToken {
  readonly braille: string;
  readonly kind: "word";
  readonly print: string;
}

type DecodeToken =
  | LetterToken
  | ModifierToken
  | SemanticControlToken
  | SymbolToken
  | WordToken;

type NonEmpty<Candidate> = readonly [Candidate, ...Candidate[]];
type MutableNonEmpty<Candidate> = [Candidate, ...Candidate[]];

type CandidateCombiner<Candidate> = (
  parts: readonly Candidate[],
) => Candidate;

interface CandidateSource<Candidate> {
  readonly first: Candidate;
  readonly size: bigint;
  at(index: bigint): Candidate | undefined;
}

type CandidateSegment<Candidate> =
  | CandidateSource<Candidate>
  | NonEmpty<Candidate>;

function isCandidateArray<Candidate>(
  segment: CandidateSegment<Candidate>,
): segment is NonEmpty<Candidate> {
  return Array.isArray(segment);
}

function candidateSource<Candidate>(
  segment: CandidateSegment<Candidate>,
): CandidateSource<Candidate> {
  if (!isCandidateArray(segment)) {
    return segment;
  }
  const candidates = segment;
  return {
    first: candidates[0],
    size: BigInt(candidates.length),
    at: (index) => candidates[Number(index)],
  };
}

class CompactAmbiguousCandidates<Candidate>
implements AmbiguousCandidates<Candidate> {
  public readonly first: Candidate;
  public readonly second: Candidate;
  public readonly size: bigint;
  readonly #cache = new Map<bigint, Candidate>();
  readonly #combiner: CandidateCombiner<Candidate>;
  readonly #known = new Set<Candidate>();
  readonly #segments: NonEmpty<CandidateSource<Candidate>>;

  public constructor(
    segments: NonEmpty<CandidateSource<Candidate>>,
    combiner: CandidateCombiner<Candidate>,
    size: bigint,
  ) {
    this.#combiner = combiner;
    this.#segments = segments;
    this.size = size;
    this.first = this.#candidateAt(0n);
    this.second = this.#candidateAt(1n);
    this.#cache.set(0n, this.first);
    this.#cache.set(1n, this.second);
    this.#known.add(this.first);
    this.#known.add(this.second);
  }

  #candidateAt(index: bigint): Candidate {
    let remaining = index;
    const reversedParts: Candidate[] = [];
    for (const candidates of [...this.#segments].reverse()) {
      const radix = candidates.size;
      /* v8 ignore next -- the index is reduced modulo this positive radix. */
      const selected = candidates.at(remaining % radix) ?? candidates.first;
      reversedParts.push(selected);
      remaining /= radix;
    }
    return this.#combiner(reversedParts.reverse());
  }

  #cachedCandidateAt(index: bigint): Candidate {
    const cached = this.#cache.get(index);
    if (cached !== undefined) {
      return cached;
    }
    const candidate = this.#candidateAt(index);
    this.#cache.set(index, candidate);
    this.#known.add(candidate);
    return candidate;
  }

  public at(index: bigint): Candidate | undefined {
    if (index < 0n || index >= this.size) {
      return undefined;
    }
    return this.#cachedCandidateAt(index);
  }

  public find(
    predicate: (candidate: Candidate, index: bigint) => boolean,
  ): Candidate | undefined {
    let index = 0n;
    for (const candidate of this) {
      if (predicate(candidate, index)) {
        return candidate;
      }
      index += 1n;
    }
    return undefined;
  }

  public has(candidate: Candidate): boolean {
    return this.#known.has(candidate);
  }

  public *[Symbol.iterator](): IterableIterator<Candidate> {
    for (let index = 0n; index < this.size; index += 1n) {
      yield this.#cachedCandidateAt(index);
    }
  }
}

const BRAILLE_BLANK = "⠀";
const DECODE_CANDIDATE_LIMIT = 4_096;
const DECODE_PATH_LIMIT = 65_536;
const CAPITAL_INDICATOR = modeIndicator(
  GRADE1_MODE_PROGRAM, GRADE1_MODE_IDS.capitals, "symbol",
);
const CAPITALS_WORD_INDICATOR = modeIndicator(
  GRADE1_MODE_PROGRAM, GRADE1_MODE_IDS.capitals, "word",
);
const CAPITALS_PASSAGE_INDICATOR = modeIndicator(
  GRADE1_MODE_PROGRAM, GRADE1_MODE_IDS.capitals, "passage",
);
const CAPITALS_TERMINATOR = modeIndicator(
  GRADE1_MODE_PROGRAM, GRADE1_MODE_IDS.capitals, "terminator",
);
const GRADE1_INDICATOR = modeIndicator(
  GRADE1_MODE_PROGRAM, GRADE1_MODE_IDS.grade1, "symbol",
);
const NUMERIC_INDICATOR = modeIndicator(
  GRADE1_MODE_PROGRAM, GRADE1_MODE_IDS.numeric, "symbol",
);

function decodeToken(entry: CompiledSymbol): DecodeToken | undefined {
  switch (entry.kind) {
    case "letter":
      /* v8 ignore next -- compiled letter rules require an uppercase scalar. */
      if (entry.uppercasePrint === null) return undefined;
      return {
        braille: entry.braille,
        kind: entry.kind,
        print: entry.print,
        uppercasePrint: entry.uppercasePrint,
      };
    case "digit": return undefined;
    case "modifier":
      return {
        braille: entry.braille,
        kind: entry.kind,
        print: entry.print,
      };
    case "symbol":
      return {
        braille: entry.braille,
        kind: entry.kind,
        print: entry.print,
      };
  }
}

const GRADE1_ENTRIES = invertSymbolProgram(GRADE1_SYMBOL_PROGRAM);
const TYPEFORM_MODE_IDS = Object.entries(GRADE1_MODE_IDS)
  .filter(([name]) => name.startsWith("typeform-"))
  .map(([, modeId]) => modeId);
const SEMANTIC_CONTROLS: readonly SemanticControlToken[] = [
  { braille: "⠣", kind: "semantic-control" },
  { braille: "⠜", kind: "semantic-control" },
  { braille: "⠘⠖", kind: "semantic-control" },
  ...TYPEFORM_MODE_IDS.flatMap((modeId): readonly SemanticControlToken[] => [
    { braille: modeIndicator(GRADE1_MODE_PROGRAM, modeId, "passage"), kind: "semantic-control" },
    { braille: modeIndicator(GRADE1_MODE_PROGRAM, modeId, "symbol"), kind: "semantic-control" },
    { braille: modeIndicator(GRADE1_MODE_PROGRAM, modeId, "terminator"), kind: "semantic-control" },
    { braille: modeIndicator(GRADE1_MODE_PROGRAM, modeId, "word"), kind: "semantic-control" },
  ]),
];
const GRADE1_TOKENS: readonly DecodeToken[] = [
  ...GRADE1_ENTRIES.flatMap((entry): readonly DecodeToken[] => {
    const token = decodeToken(entry);
    return token === undefined ? [] : [token];
  }),
  ...SEMANTIC_CONTROLS,
];
const NUMERIC_DIGITS: ReadonlyMap<string, string> = new Map(
  GRADE1_ENTRIES.flatMap((entry): readonly (readonly [string, string])[] =>
    entry.kind === "digit" && entry.numericDigit !== null
      ? [[entry.braille, entry.numericDigit]]
      : []
  ),
);

function inverseWordToken(rule: ContextualInverseRule): WordToken {
  return {
    braille: rule.braille,
    kind: "word",
    print: rule.print,
  };
}

const GRADE2_TOKENS: readonly DecodeToken[] = [
  ...GRADE1_TOKENS,
  ...invertContextualProgram(GRADE2_PROGRAM).map(inverseWordToken),
];

function tokenBuckets(
  tokens: readonly DecodeToken[],
): ReadonlyMap<string, readonly DecodeToken[]> {
  const buckets = new Map<string, DecodeToken[]>();
  for (const token of tokens) {
    const initial = token.braille.charAt(0);
    const bucket = buckets.get(initial);
    if (bucket === undefined) {
      buckets.set(initial, [token]);
    } else {
      bucket.push(token);
    }
  }
  for (const bucket of buckets.values()) {
    bucket.sort((left, right) =>
      right.braille.length - left.braille.length ||
      (left.braille < right.braille ? -1 : left.braille > right.braille ? 1 : 0)
    );
  }
  return buckets;
}

const GRADE1_BUCKETS = tokenBuckets(GRADE1_TOKENS);
const GRADE2_BUCKETS = tokenBuckets(GRADE2_TOKENS);

function pathKey(path: DecodePath): string {
  return [
    String(path.index),
    path.capitals,
    path.grade1Next ? "1" : "0",
    path.modifiers,
    path.numeric ? "1" : "0",
    path.semanticFormatting ? "1" : "0",
    path.print,
  ].join("\u0000");
}

function capitalizeWord(print: string, mode: CapitalsMode): string {
  if (mode === "next") {
    return print.charAt(0).toUpperCase() + print.slice(1);
  }
  return mode === "passage" || mode === "word" ? print.toUpperCase() : print;
}

function capitalAfterWord(mode: CapitalsMode): CapitalsMode {
  return mode === "next" ? "none" : mode;
}

function capitalAfterBoundary(mode: CapitalsMode): CapitalsMode {
  return mode === "passage" ? mode : "none";
}

function scalarIndexAt(input: string, codeUnitIndex: number): number {
  return Array.from(input.slice(0, codeUnitIndex)).length;
}

function decode(
  input: string,
  buckets: ReadonlyMap<string, readonly DecodeToken[]>,
): DecodeResult {
  const initialPath: DecodePath = {
    capitals: "none",
    grade1Next: false,
    index: 0,
    modifiers: "",
    numeric: false,
    print: "",
    semanticFormatting: false,
  };
  const pending: DecodePath[] = [initialPath];
  const seen = new Set<string>([pathKey(initialPath)]);
  let furthestCodeUnitIndex = 0;
  const completed = new Map<string, DecodedPrint>();
  let tooAmbiguousAt: number | undefined;
  let tooAmbiguousLimit: number | undefined;

  const enqueue = (path: DecodePath): void => {
    const key = pathKey(path);
    if (!seen.has(key)) {
      if (seen.size >= DECODE_PATH_LIMIT) {
        tooAmbiguousAt ??= path.index;
        tooAmbiguousLimit ??= DECODE_PATH_LIMIT;
        return;
      }
      seen.add(key);
      pending.push(path);
    }
  };

  while (pending.length > 0) {
    const path = pending.pop();
    /* v8 ignore next -- the loop condition proves a pending path exists. */
    if (path === undefined) break;
    furthestCodeUnitIndex = Math.max(furthestCodeUnitIndex, path.index);
    if (path.index === input.length) {
      if (
        path.capitals !== "next" && path.capitals !== "passage" &&
        !path.grade1Next && path.modifiers.length === 0
      ) {
        const previous = completed.get(path.print);
        if (
          previous === undefined &&
          completed.size >= DECODE_CANDIDATE_LIMIT
        ) {
          tooAmbiguousAt ??= path.index;
          tooAmbiguousLimit ??= DECODE_CANDIDATE_LIMIT;
          break;
        }
        completed.set(path.print, {
          print: path.print,
          semanticFormatting:
            path.semanticFormatting || previous?.semanticFormatting === true,
        });
      }
      continue;
    }

    if (input.startsWith("\r\n", path.index)) {
      enqueue({
        ...path,
        capitals: capitalAfterBoundary(path.capitals),
        grade1Next: false,
        index: path.index + 2,
        modifiers: "",
        numeric: false,
        print: `${path.print}\r\n`,
      });
      continue;
    }
    const current = input.charAt(path.index);
    if (current === "\r" || current === "\n" || current === BRAILLE_BLANK) {
      enqueue({
        ...path,
        capitals: capitalAfterBoundary(path.capitals),
        grade1Next: false,
        index: path.index + 1,
        modifiers: "",
        numeric: false,
        print: path.print + (current === BRAILLE_BLANK ? " " : current),
      });
      continue;
    }

    if (
      path.modifiers.length === 0 && path.capitals === "passage" &&
      input.startsWith(CAPITALS_TERMINATOR, path.index)
    ) {
      enqueue({
        ...path,
        capitals: "none",
        index: path.index + CAPITALS_TERMINATOR.length,
      });
    } else if (path.modifiers.length === 0 && path.capitals === "none") {
      if (input.startsWith(CAPITALS_PASSAGE_INDICATOR, path.index)) {
        enqueue({
          ...path,
          capitals: "passage",
          index: path.index + CAPITALS_PASSAGE_INDICATOR.length,
          numeric: false,
        });
      } else if (input.startsWith(CAPITALS_WORD_INDICATOR, path.index)) {
        enqueue({
          ...path,
          capitals: "word",
          index: path.index + CAPITALS_WORD_INDICATOR.length,
          numeric: false,
        });
      } else if (input.startsWith(CAPITAL_INDICATOR, path.index)) {
        enqueue({
          ...path,
          capitals: "next",
          index: path.index + CAPITAL_INDICATOR.length,
          numeric: false,
        });
      }
    }

    if (
      path.modifiers.length === 0 &&
      input.startsWith(GRADE1_INDICATOR, path.index)
    ) {
      enqueue({
        ...path,
        grade1Next: true,
        index: path.index + GRADE1_INDICATOR.length,
        numeric: false,
      });
    }
    if (
      path.modifiers.length === 0 && path.capitals !== "next" &&
      input.startsWith(NUMERIC_INDICATOR, path.index)
    ) {
      enqueue({
        ...path,
        capitals: capitalAfterBoundary(path.capitals),
        grade1Next: false,
        index: path.index + NUMERIC_INDICATOR.length,
        numeric: true,
      });
    }

    if (path.numeric) {
      const digit = NUMERIC_DIGITS.get(current);
      if (digit !== undefined) {
        enqueue({
          ...path,
          index: path.index + 1,
          print: path.print + digit,
        });
      } else if (current === "⠂" || current === "⠲") {
        enqueue({
          ...path,
          index: path.index + 1,
          print: path.print + (current === "⠂" ? "," : "."),
        });
      } else {
        enqueue({ ...path, numeric: false });
      }
      continue;
    }

    for (const token of buckets.get(current) ?? []) {
      if (!input.startsWith(token.braille, path.index)) {
        continue;
      }
      const nextIndex = path.index + token.braille.length;
      switch (token.kind) {
        case "letter": {
          const base = path.capitals === "none"
            ? token.print
            : token.uppercasePrint;
          const print = `${base}${path.modifiers}`.normalize("NFC");
          enqueue({
            ...path,
            capitals: capitalAfterWord(path.capitals),
            grade1Next: false,
            index: nextIndex,
            modifiers: "",
            print: path.print + print,
          });
          break;
        }
        case "modifier":
          enqueue({
            ...path,
            index: nextIndex,
            modifiers: path.modifiers + token.print,
          });
          break;
        case "semantic-control":
          enqueue({
            ...path,
            index: nextIndex,
            numeric: false,
            semanticFormatting: true,
          });
          break;
        case "symbol":
          if (path.modifiers.length === 0 && path.capitals !== "next") {
            enqueue({
              ...path,
              capitals: capitalAfterBoundary(path.capitals),
              grade1Next: false,
              index: nextIndex,
              numeric: false,
              print: path.print + token.print,
            });
          }
          break;
        case "word":
          if (path.modifiers.length === 0 && !path.grade1Next) {
            enqueue({
              ...path,
              capitals: capitalAfterWord(path.capitals),
              index: nextIndex,
              print: path.print + capitalizeWord(token.print, path.capitals),
            });
          }
          break;
      }
    }
  }

  return {
    candidates: [...completed.values()].sort((left, right) =>
      left.print < right.print ? -1 : 1
    ),
    furthestCodeUnitIndex,
    ...(tooAmbiguousAt === undefined ? {} : { tooAmbiguousAt }),
    ...(tooAmbiguousLimit === undefined ? {} : { tooAmbiguousLimit }),
  };
}

function firstInvalidCharacter<Mode extends BacktranslationMode>(
  input: string,
  mode: Mode,
): InvalidBrailleCharacter<Mode> | undefined {
  let codeUnitIndex = 0;
  let scalarIndex = 0;
  for (const character of input) {
    const codePoint = character.codePointAt(0);
    const permitted = character === "\r" || character === "\n" ||
      (codePoint !== undefined && codePoint >= 0x2800 && codePoint <= 0x28ff);
    if (!permitted) {
      return {
        character,
        codeUnitIndex,
        kind: "invalid",
        mode,
        reason: "invalid-braille-character",
        scalarIndex,
      };
    }
    codeUnitIndex += character.length;
    scalarIndex += 1;
  }
  return undefined;
}

function noParse<Mode extends BacktranslationMode>(
  input: string,
  mode: Mode,
  codeUnitIndex: number,
): NoStandardsParse<Mode> {
  return {
    codeUnitIndex,
    kind: "invalid",
    mode,
    reason: "no-standards-parse",
    scalarIndex: scalarIndexAt(input, codeUnitIndex),
  };
}

function tooAmbiguous<Mode extends BacktranslationMode>(
  input: string,
  mode: Mode,
  codeUnitIndex: number,
  limit: number,
): TooAmbiguous<Mode> {
  return {
    codeUnitIndex,
    kind: "invalid",
    limit,
    mode,
    reason: "too-ambiguous",
    scalarIndex: scalarIndexAt(input, codeUnitIndex),
  };
}

function grade1Candidates(
  input: string,
  decoded: DecodeResult,
): readonly Grade1BacktranslationCandidate[] {
  return decoded.candidates
    .filter((candidate) => {
      if (candidate.semanticFormatting) {
        return true;
      }
      const translated = translateGrade1(candidate.print);
      return translated.ok && translated.braille === input;
    })
    .map((candidate): Grade1BacktranslationCandidate => ({
      mode: "grade1",
      print: candidate.print,
    }));
}

function grade2Candidates(
  input: string,
  decoded: DecodeResult,
): readonly Grade2BacktranslationCandidate[] {
  const candidates: Grade2BacktranslationCandidate[] = [];
  for (const candidate of decoded.candidates) {
    if (candidate.semanticFormatting) {
      continue;
    }
    const translated = traceGrade2(candidate.print);
    if (!translated.ok || translated.braille !== input) {
      continue;
    }
    candidates.push({
      mode: "grade2",
      print: candidate.print,
      rules: translated.rules.map((rule) => rule.id),
    });
  }
  return candidates;
}

function nonEmpty<Candidate>(
  candidates: readonly Candidate[],
): NonEmpty<Candidate> | undefined {
  const first = candidates[0];
  return first === undefined ? undefined : [first, ...candidates.slice(1)];
}

function candidateProduct<Candidate extends BacktranslationCandidate>(
  segments: NonEmpty<CandidateSegment<Candidate>>,
  combiner: CandidateCombiner<Candidate>,
):
  | AmbiguousBacktranslation<Candidate>
  | UniqueBacktranslation<Candidate> {
  const sources = [
    candidateSource(segments[0]),
    ...segments.slice(1).map(candidateSource),
  ] satisfies NonEmpty<CandidateSource<Candidate>>;
  const size = sources.reduce(
    (product, segment) => product * segment.size,
    1n,
  );
  const first = combiner(sources.map((segment) => segment.first));
  if (size === 1n) {
    return { candidate: first, kind: "unique", mode: first.mode };
  }
  return {
    candidates: new CompactAmbiguousCandidates(sources, combiner, size),
    kind: "ambiguous",
    mode: first.mode,
  };
}

function combineGrade1(
  parts: readonly Grade1BacktranslationCandidate[],
): Grade1BacktranslationCandidate {
  return {
    mode: "grade1",
    print: parts.map((part) => part.print).join(""),
  };
}

function combineGrade2(
  parts: readonly Grade2BacktranslationCandidate[],
): Grade2BacktranslationCandidate {
  return {
    mode: "grade2",
    print: parts.map((part) => part.print).join(""),
    rules: parts.flatMap((part) => part.rules),
  };
}

function fixedGrade1Segment(print: string): NonEmpty<Grade1BacktranslationCandidate> {
  return [{ mode: "grade1", print }];
}

function fixedGrade2Segment(print: string): NonEmpty<Grade2BacktranslationCandidate> {
  return [{ mode: "grade2", print, rules: [] }];
}

function separatorAt(
  braille: string,
  index: number,
): { readonly print: string; readonly width: 1 | 2 } | undefined {
  if (braille.startsWith("\r\n", index)) {
    return { print: "\r\n", width: 2 };
  }
  const current = braille.charAt(index);
  if (current === BRAILLE_BLANK) {
    return { print: " ", width: 1 };
  }
  return current === "\r" || current === "\n"
    ? { print: current, width: 1 }
    : undefined;
}

/** Backtranslate uncontracted UEB without selecting among valid print paths. */
export function backtranslateGrade1(
  braille: string,
): BacktranslationResult<Grade1BacktranslationCandidate> {
  const invalid = firstInvalidCharacter(braille, "grade1");
  if (invalid !== undefined) {
    return invalid;
  }
  const segments: MutableNonEmpty<NonEmpty<Grade1BacktranslationCandidate>> = [
    fixedGrade1Segment(""),
  ];
  const appendDecoded = (
    segmentBraille: string,
    start: number,
  ): InvalidBacktranslation<"grade1"> | undefined => {
    const decoded = decode(segmentBraille, GRADE1_BUCKETS);
    if (
      decoded.tooAmbiguousAt !== undefined &&
      decoded.tooAmbiguousLimit !== undefined
    ) {
      return tooAmbiguous(
        braille,
        "grade1",
        start + decoded.tooAmbiguousAt,
        decoded.tooAmbiguousLimit,
      );
    }
    const candidates = nonEmpty(grade1Candidates(segmentBraille, decoded));
    if (candidates === undefined) {
      return noParse(braille, "grade1", start + decoded.furthestCodeUnitIndex);
    }
    segments.push(candidates);
    return undefined;
  };
  let segmentStart = 0;
  let index = 0;
  while (index < braille.length) {
    if (braille.startsWith(CAPITALS_PASSAGE_INDICATOR, index)) {
      const terminatorAt = braille.indexOf(
        CAPITALS_TERMINATOR,
        index + CAPITALS_PASSAGE_INDICATOR.length,
      );
      if (terminatorAt >= 0) {
        if (segmentStart < index) {
          const invalid = appendDecoded(braille.slice(segmentStart, index), segmentStart);
          if (invalid !== undefined) return invalid;
        }
        const passageEnd = terminatorAt + CAPITALS_TERMINATOR.length;
        const invalid = appendDecoded(braille.slice(index, passageEnd), index);
        if (invalid !== undefined) return invalid;
        index = passageEnd;
        segmentStart = index;
        continue;
      }
    }
    const separator = separatorAt(braille, index);
    if (separator === undefined) {
      index += 1;
      continue;
    }
    if (segmentStart < index) {
      const invalid = appendDecoded(braille.slice(segmentStart, index), segmentStart);
      if (invalid !== undefined) return invalid;
    }
    segments.push(fixedGrade1Segment(separator.print));
    index += separator.width;
    segmentStart = index;
  }
  if (segmentStart < braille.length) {
    const invalid = appendDecoded(braille.slice(segmentStart), segmentStart);
    if (invalid !== undefined) return invalid;
  }
  return candidateProduct(segments, combineGrade1);
}

function backtranslatePlainGrade2(
  braille: string,
): BacktranslationResult<Grade2BacktranslationCandidate> {
  const segments: MutableNonEmpty<NonEmpty<Grade2BacktranslationCandidate>> = [
    fixedGrade2Segment(""),
  ];
  let segmentStart = 0;
  let index = 0;
  while (index < braille.length) {
    const separator = separatorAt(braille, index);
    if (separator === undefined) {
      index += 1;
      continue;
    }
    if (segmentStart < index) {
      const segmentBraille = braille.slice(segmentStart, index);
      const decoded = decode(segmentBraille, GRADE2_BUCKETS);
      if (
        decoded.tooAmbiguousAt !== undefined &&
        decoded.tooAmbiguousLimit !== undefined
      ) {
        return tooAmbiguous(
          braille,
          "grade2",
          segmentStart + decoded.tooAmbiguousAt,
          decoded.tooAmbiguousLimit,
        );
      }
      const candidates = nonEmpty(grade2Candidates(segmentBraille, decoded));
      if (candidates === undefined) {
        return noParse(
          braille,
          "grade2",
          segmentStart + decoded.furthestCodeUnitIndex,
        );
      }
      segments.push(candidates);
    }
    segments.push(fixedGrade2Segment(separator.print));
    index += separator.width;
    segmentStart = index;
  }
  if (segmentStart < braille.length) {
    const segmentBraille = braille.slice(segmentStart);
    const decoded = decode(segmentBraille, GRADE2_BUCKETS);
    if (
      decoded.tooAmbiguousAt !== undefined &&
      decoded.tooAmbiguousLimit !== undefined
    ) {
      return tooAmbiguous(
        braille,
        "grade2",
        segmentStart + decoded.tooAmbiguousAt,
        decoded.tooAmbiguousLimit,
      );
    }
    const candidates = nonEmpty(grade2Candidates(segmentBraille, decoded));
    if (candidates === undefined) {
      return noParse(
        braille,
        "grade2",
        segmentStart + decoded.furthestCodeUnitIndex,
      );
    }
    segments.push(candidates);
  }
  return candidateProduct(segments, combineGrade2);
}

interface MixedGrade2Segment {
  readonly braille: string;
  readonly kind: "foreign" | "ueb";
  readonly start: number;
  readonly wrappedBraille?: string;
}

function splitCodeSwitchedGrade2(
  braille: string,
): MixedGrade2Segment[] | NoStandardsParse<"grade2"> {
  const segments: MixedGrade2Segment[] = [];
  const indicators = [
    {
      opening: NON_UEB_PASSAGE_INDICATOR,
      closing: NON_UEB_PASSAGE_TERMINATOR,
    },
    {
      opening: NON_UEB_WORD_INDICATOR,
      closing: NON_UEB_WORD_TERMINATOR,
    },
  ] as const;
  let cursor = 0;
  while (cursor < braille.length) {
    const next = indicators
      .map((indicator) => ({
        ...indicator,
        index: braille.indexOf(indicator.opening, cursor),
      }))
      .filter((indicator) => indicator.index >= 0)
      .sort((left, right) => left.index - right.index)[0];
    if (next === undefined) {
      segments.push({ braille: braille.slice(cursor), kind: "ueb", start: cursor });
      break;
    }
    if (cursor < next.index) {
      segments.push({
        braille: braille.slice(cursor, next.index),
        kind: "ueb",
        start: cursor,
      });
    }
    const contentStart = next.index + next.opening.length;
    const contentEnd = braille.indexOf(next.closing, contentStart);
    if (contentEnd < 0) return noParse(braille, "grade2", next.index);
    const end = contentEnd + next.closing.length;
    segments.push({
      braille: braille.slice(contentStart, contentEnd),
      kind: "foreign",
      start: contentStart,
      wrappedBraille: braille.slice(next.index, end),
    });
    cursor = end;
  }
  return segments;
}

function grade2ResultSource(
  result: BacktranslationResult<Grade2BacktranslationCandidate>,
): CandidateSource<Grade2BacktranslationCandidate> |
  InvalidBacktranslation<"grade2"> {
  switch (result.kind) {
    case "unique":
      return candidateSource([result.candidate]);
    case "ambiguous":
      return result.candidates;
    case "invalid":
      return result;
  }
}

function offsetInvalidGrade2(
  result: InvalidBacktranslation<"grade2">,
  input: string,
  segmentStart: number,
): InvalidBacktranslation<"grade2"> {
  const codeUnitIndex = segmentStart + result.codeUnitIndex;
  return {
    ...result,
    codeUnitIndex,
    scalarIndex: scalarIndexAt(input, codeUnitIndex),
  };
}

function foreignCandidates(
  segment: MixedGrade2Segment,
): readonly Grade2BacktranslationCandidate[] {
  const wrappedBraille = segment.wrappedBraille;
  /* v8 ignore next -- only foreign segments call this function. */
  if (wrappedBraille === undefined) return [];
  const candidates = new Map<string, Grade2BacktranslationCandidate>();
  for (const language of ["de", "fr"] satisfies readonly ForeignLanguage[]) {
    for (const print of decodeForeignLanguageBraille(segment.braille, language)) {
      const translated = translateForeignLanguageRun({
        code: "foreign",
        kind: "foreign",
        language,
        text: print,
      });
      /* v8 ignore next -- the inverse emits only symbols accepted by this translator. */
      if (!translated.ok) continue;
      if (translated.braille === wrappedBraille) {
        candidates.set(print, { mode: "grade2", print, rules: [] });
      }
    }
  }
  return [...candidates.values()];
}

function backtranslateMixedGrade2(
  braille: string,
): BacktranslationResult<Grade2BacktranslationCandidate> {
  const split = splitCodeSwitchedGrade2(braille);
  if (!Array.isArray(split)) return split;
  const candidates: MutableNonEmpty<CandidateSegment<Grade2BacktranslationCandidate>> = [
    fixedGrade2Segment(""),
  ];
  for (const segment of split) {
    if (segment.kind === "foreign") {
      const present = nonEmpty(foreignCandidates(segment));
      if (present === undefined) {
        return noParse(braille, "grade2", segment.start);
      }
      candidates.push(present);
      continue;
    }
    const decoded = grade2ResultSource(backtranslatePlainGrade2(segment.braille));
    if ("kind" in decoded) {
      return offsetInvalidGrade2(decoded, braille, segment.start);
    }
    candidates.push(decoded);
  }
  return candidateProduct(candidates, combineGrade2);
}

/** Backtranslate contracted UEB without selecting among valid print paths. */
export function backtranslateGrade2(
  braille: string,
): BacktranslationResult<Grade2BacktranslationCandidate> {
  const invalid = firstInvalidCharacter(braille, "grade2");
  if (invalid !== undefined) return invalid;
  return braille.includes(NON_UEB_PASSAGE_INDICATOR) ||
      braille.includes(NON_UEB_WORD_INDICATOR)
    ? backtranslateMixedGrade2(braille)
    : backtranslatePlainGrade2(braille);
}

/**
 * Apply an explicit caller policy after standards decoding. A policy cannot
 * inject a candidate that was not returned by the decoder.
 */
export function selectBacktranslation<Candidate extends BacktranslationCandidate>(
  result: BacktranslationResult<Candidate>,
  policy: (
    candidates: AmbiguousCandidates<Candidate>,
  ) => Candidate | undefined,
): Candidate | undefined {
  if (result.kind === "invalid") {
    return undefined;
  }
  if (result.kind === "unique") {
    return result.candidate;
  }
  const selected = policy(result.candidates);
  return selected !== undefined && result.candidates.has(selected)
    ? selected
    : undefined;
}

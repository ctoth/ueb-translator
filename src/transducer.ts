/**
 * Flat deterministic subsequential transducer runtime.
 *
 * Model: Mohri, "Finite-State Transducers in Language and Speech Processing"
 * (1997), section 2.1. The compiler stores whole rule outputs on final states,
 * so the browser walker only follows deterministic input edges and emits the
 * longest final match.
 * https://aclanthology.org/J97-2003/
 */

export interface CompiledAutomaton {
  /** CSR-style start offset for each state's outgoing edges, plus one sentinel. */
  readonly stateEdgeOffsets: readonly number[];
  /** Unicode scalar values, sorted within each state's edge range. */
  readonly edgeLabels: readonly number[];
  /** State indexes parallel to `edgeLabels`. */
  readonly edgeTargets: readonly number[];
  /** Output indexes for final states, or -1 for non-final states. */
  readonly stateOutputIndexes: readonly number[];
}

export interface CompiledTransducer extends CompiledAutomaton {
  /** Deduplicated final outputs. */
  readonly outputs: readonly string[];
}

export interface TransducerPrefixMatch {
  readonly endCodeUnitIndex: number;
  readonly outputIndex: number;
}

/** Sorted rule inputs plus fixed-width initial and rule-range offsets. */
export type CompactPrefixTable = readonly [
  bucketAlphabet: readonly string[],
  inputs: readonly string[],
  initialInputOffsets: string,
  initialRuleOffsets: string,
  initialGuardOffsets: string,
  inputRuleCounts: string,
  inputGuardCounts: string,
];

export interface PrefixTableMatch {
  readonly endCodeUnitIndex: number;
  readonly ruleCount: number;
  readonly guardOffset: number;
  readonly ruleOffset: number;
}

export interface TransducerSuccess {
  readonly ok: true;
  readonly output: string;
}

export interface TransducerNoMatchingRule {
  readonly character: string;
  readonly codeUnitIndex: number;
  readonly ok: false;
  readonly reason: "no-matching-rule";
  readonly scalarIndex: number;
}

export type TransducerResult = TransducerSuccess | TransducerNoMatchingRule;

function arrayValue(values: readonly number[], index: number): number | undefined {
  return values[index];
}

function findTarget(
  transducer: CompiledAutomaton,
  state: number,
  label: number,
): number | undefined {
  const start = arrayValue(transducer.stateEdgeOffsets, state);
  if (start === undefined) {
    return undefined;
  }
  const end = arrayValue(transducer.stateEdgeOffsets, state + 1);
  if (end === undefined) {
    return undefined;
  }

  let low = start;
  let high = end - 1;
  while (low <= high) {
    const middle = low + Math.floor((high - low) / 2);
    const middleLabel = arrayValue(transducer.edgeLabels, middle);
    if (middleLabel === undefined) {
      return undefined;
    }
    if (middleLabel === label) {
      return arrayValue(transducer.edgeTargets, middle);
    }
    if (middleLabel < label) {
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }

  return undefined;
}

function isScalarBoundary(input: string, codeUnitIndex: number): boolean {
  if (!Number.isInteger(codeUnitIndex) || codeUnitIndex < 0 || codeUnitIndex > input.length) {
    return false;
  }
  if (codeUnitIndex === 0 || codeUnitIndex === input.length) {
    return true;
  }
  const current = input.charCodeAt(codeUnitIndex);
  const previous = input.charCodeAt(codeUnitIndex - 1);
  return !(current >= 0xdc00 && current <= 0xdfff &&
    previous >= 0xd800 && previous <= 0xdbff);
}

/** Return every final automaton prefix beginning at a Unicode scalar boundary. */
export function matchTransducerPrefixes(
  transducer: CompiledAutomaton,
  input: string,
  startCodeUnitIndex: number,
): readonly TransducerPrefixMatch[] {
  if (!isScalarBoundary(input, startCodeUnitIndex)) {
    return [];
  }

  const matches: TransducerPrefixMatch[] = [];
  let state = 0;
  let cursor = startCodeUnitIndex;
  while (cursor < input.length) {
    const codePoint = input.codePointAt(cursor);
    /* v8 ignore next -- cursor is strictly within a scalar-boundary string. */
    if (codePoint === undefined) {
      return [];
    }
    const target = findTarget(transducer, state, codePoint);
    if (target === undefined) {
      break;
    }
    cursor += scalarWidth(codePoint);
    state = target;
    const outputIndex = arrayValue(transducer.stateOutputIndexes, state);
    if (outputIndex !== undefined && outputIndex >= 0) {
      matches.push({ endCodeUnitIndex: cursor, outputIndex });
    }
  }
  return matches;
}

function scalarWidth(codePoint: number): 1 | 2 {
  return codePoint > 0xffff ? 2 : 1;
}

const COMPACT_INTEGER_OFFSET = 0x100;

function compactInteger(values: string, index: number): number | undefined {
  const encoded = values.charCodeAt(index);
  return Number.isNaN(encoded) ? undefined : encoded - COMPACT_INTEGER_OFFSET;
}

/** Match every compiled rule prefix in the input's lowercase-ASCII bucket. */
export function matchPrefixTable(
  table: CompactPrefixTable,
  input: string,
  startCodeUnitIndex: number,
): readonly PrefixTableMatch[] {
  if (!isScalarBoundary(input, startCodeUnitIndex)) {
    return [];
  }
  const [
    bucketAlphabet,
    inputs,
    initialInputOffsets,
    initialRuleOffsets,
    initialGuardOffsets,
    inputRuleCounts,
    inputGuardCounts,
  ] = table;
  const codePoint = input.codePointAt(startCodeUnitIndex);
  if (codePoint === undefined) {
    return [];
  }
  const initial = bucketAlphabet.indexOf(String.fromCodePoint(codePoint));
  if (initial < 0) return [];
  const inputStart = compactInteger(initialInputOffsets, initial);
  const inputEnd = compactInteger(initialInputOffsets, initial + 1);
  let ruleOffset = compactInteger(initialRuleOffsets, initial);
  let guardOffset = compactInteger(initialGuardOffsets, initial);
  if (
    inputStart === undefined || inputEnd === undefined ||
    ruleOffset === undefined || guardOffset === undefined
  ) {
    return [];
  }
  const matches: PrefixTableMatch[] = [];
  for (let inputIndex = inputStart; inputIndex < inputEnd; inputIndex += 1) {
    const print = inputs[inputIndex];
    const ruleCount = compactInteger(inputRuleCounts, inputIndex);
    const guardCount = compactInteger(inputGuardCounts, inputIndex);
    if (print === undefined || ruleCount === undefined || guardCount === undefined) {
      return [];
    }
    if (input.startsWith(print, startCodeUnitIndex)) {
      matches.push({
        endCodeUnitIndex: startCodeUnitIndex + print.length,
        guardOffset,
        ruleCount,
        ruleOffset,
      });
    }
    ruleOffset += ruleCount;
    guardOffset += guardCount;
  }
  return matches;
}

/** Run a deterministic longest-match translation over Unicode scalar input. */
export function runTransducer(
  transducer: CompiledTransducer,
  input: string,
): TransducerResult {
  let codeUnitIndex = 0;
  let scalarIndex = 0;
  let output = "";

  while (codeUnitIndex < input.length) {
    let state = 0;
    let cursor = codeUnitIndex;
    let match:
      | {
          readonly end: number;
          readonly outputIndex: number;
          readonly scalarCount: number;
        }
      | undefined;
    let scannedScalarCount = 0;

    while (cursor < input.length) {
      const codePoint = input.codePointAt(cursor);
      /* v8 ignore next -- cursor is strictly within the string. */
      if (codePoint === undefined) {
        break;
      }
      const target = findTarget(transducer, state, codePoint);
      if (target === undefined) {
        break;
      }

      cursor += scalarWidth(codePoint);
      scannedScalarCount += 1;
      state = target;
      const outputIndex = arrayValue(transducer.stateOutputIndexes, state);
      if (outputIndex !== undefined && outputIndex >= 0) {
        match = {
          end: cursor,
          outputIndex,
          scalarCount: scannedScalarCount,
        };
      }
    }

    if (match === undefined) {
      const codePoint = input.codePointAt(codeUnitIndex);
      /* v8 ignore next -- the outer loop guarantees a valid code-unit index. */
      if (codePoint === undefined) {
        return { ok: true, output };
      }
      const width = scalarWidth(codePoint);
      return {
        character: input.slice(codeUnitIndex, codeUnitIndex + width),
        codeUnitIndex,
        ok: false,
        reason: "no-matching-rule",
        scalarIndex,
      };
    }

    const matchedOutput = transducer.outputs[match.outputIndex];
    if (matchedOutput === undefined) {
      return {
        character: input.slice(codeUnitIndex, match.end),
        codeUnitIndex,
        ok: false,
        reason: "no-matching-rule",
        scalarIndex,
      };
    }
    output += matchedOutput;
    codeUnitIndex = match.end;
    scalarIndex += match.scalarCount;
  }

  return { ok: true, output };
}

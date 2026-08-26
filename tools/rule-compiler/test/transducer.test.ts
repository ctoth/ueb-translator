import { describe, expect, it } from "vitest";

import {
  matchPrefixTable,
  matchTransducerPrefixes,
  runTransducer,
  type CompactPrefixTable,
} from "../../../src/transducer.js";
import {
  compileRules,
  type RuleDefinition,
} from "../src/compiler.js";

const citation = {
  authority: "ICEB",
  document: "Rules of Unified English Braille, Third Edition",
  locator: "4.1",
  url: "https://iceb.org/publications/ueb/",
} satisfies RuleDefinition["citation"];

function compile(entries: readonly (readonly [string, string])[]) {
  return compileRules(
    entries.map(([input, output], index) => ({
      citation,
      id: `rule-${String(index)}`,
      input,
      output,
    })),
  ).runtime;
}

function encode(values: readonly number[]): string {
  return String.fromCharCode(...values.map((value) => value + 0x100));
}

const prefixTable: CompactPrefixTable = [
  ["a", "ab", "b"],
  encode([0, 2, ...Array.from({ length: 25 }, () => 3)]),
  encode([0, 2, ...Array.from({ length: 25 }, () => 3)]),
  encode(Array.from({ length: 27 }, () => 0)),
  encode([1, 1, 1]),
  encode([0, 0, 0]),
];

describe("runTransducer", () => {
  it("uses deterministic longest matching", () => {
    const transducer = compile([
      ["a", "A"],
      ["ab", "AB"],
      ["x", "X"],
    ]);

    expect(runTransducer(transducer, "abx")).toEqual({
      ok: true,
      output: "ABX",
    });
  });

  it("matches input by Unicode scalar rather than UTF-16 code unit", () => {
    const transducer = compile([
      ["😀", "⠿"],
      ["a", "⠁"],
    ]);

    expect(runTransducer(transducer, "😀a")).toEqual({
      ok: true,
      output: "⠿⠁",
    });
  });

  it("reports the first unmatched scalar without partial output", () => {
    const transducer = compile([["a", "⠁"]]);

    expect(runTransducer(transducer, "a😀")).toEqual({
      character: "😀",
      codeUnitIndex: 1,
      ok: false,
      reason: "no-matching-rule",
      scalarIndex: 1,
    });
  });

  it("accepts empty input", () => {
    expect(runTransducer(compile([["a", "⠁"]]), "")).toEqual({
      ok: true,
      output: "",
    });
  });

  it("takes both sides of the sorted-edge binary search", () => {
    const transducer = compile([
      ["b", "B"],
      ["d", "D"],
    ]);

    expect(runTransducer(transducer, "a")).toEqual({
      character: "a",
      codeUnitIndex: 0,
      ok: false,
      reason: "no-matching-rule",
      scalarIndex: 0,
    });
    expect(runTransducer(transducer, "z")).toEqual({
      character: "z",
      codeUnitIndex: 0,
      ok: false,
      reason: "no-matching-rule",
      scalarIndex: 0,
    });
  });

  it.each([
    {
      runtime: {
        edgeLabels: [],
        edgeTargets: [],
        outputs: [],
        stateEdgeOffsets: [],
        stateOutputIndexes: [],
      },
    },
    {
      runtime: {
        edgeLabels: [],
        edgeTargets: [],
        outputs: [],
        stateEdgeOffsets: [0],
        stateOutputIndexes: [],
      },
    },
    {
      runtime: {
        edgeLabels: [],
        edgeTargets: [],
        outputs: [],
        stateEdgeOffsets: [0, 1],
        stateOutputIndexes: [-1],
      },
    },
    {
      runtime: {
        edgeLabels: [97],
        edgeTargets: [1],
        outputs: [],
        stateEdgeOffsets: [0, 1, 1],
        stateOutputIndexes: [-1],
      },
    },
  ])("fails closed for malformed graph arrays", ({ runtime }) => {
    expect(runTransducer(runtime, "a").ok).toBe(false);
  });

  it("fails closed when a final state references a missing output", () => {
    const runtime = compile([["a", "A"]]);
    const withoutOutputs = { ...runtime, outputs: [] };

    expect(runTransducer(withoutOutputs, "a")).toEqual({
      character: "a",
      codeUnitIndex: 0,
      ok: false,
      reason: "no-matching-rule",
      scalarIndex: 0,
    });
  });
});

describe("matchTransducerPrefixes", () => {
  it("returns every final prefix from a requested UTF-16 boundary", () => {
    const transducer = compile([
      ["😀", "face"],
      ["😀a", "face-a"],
    ]);

    expect(matchTransducerPrefixes(transducer, "x😀ab", 1)).toEqual([
      { endCodeUnitIndex: 3, outputIndex: 0 },
      { endCodeUnitIndex: 4, outputIndex: 1 },
    ]);
  });

  it("walks through non-final states before reporting a prefix", () => {
    expect(matchTransducerPrefixes(compile([["ab", "AB"]]), "ab", 0)).toEqual([
      { endCodeUnitIndex: 2, outputIndex: 0 },
    ]);
  });

  it("returns no matches for a malformed graph or non-scalar boundary", () => {
    const transducer = compile([["😀", "face"]]);

    expect(matchTransducerPrefixes(transducer, "😀", 1)).toEqual([]);
    expect(matchTransducerPrefixes(transducer, "😀", -1)).toEqual([]);
    expect(matchTransducerPrefixes(transducer, "😀", 0.5)).toEqual([]);
    expect(matchTransducerPrefixes(transducer, "😀", 3)).toEqual([]);
    expect(matchTransducerPrefixes({
      ...transducer,
      stateEdgeOffsets: [],
    }, "😀", 0)).toEqual([]);
  });
});

describe("matchPrefixTable", () => {
  it("returns every exact prefix with its compiled rule range", () => {
    expect(matchPrefixTable(prefixTable, "xab", 1)).toEqual([
      { endCodeUnitIndex: 2, guardOffset: 0, ruleCount: 1, ruleOffset: 0 },
      { endCodeUnitIndex: 3, guardOffset: 0, ruleCount: 1, ruleOffset: 1 },
    ]);
  });

  it("fails closed at invalid boundaries, buckets, and encoded ranges", () => {
    expect(matchPrefixTable(prefixTable, "😀", 1)).toEqual([]);
    expect(matchPrefixTable(prefixTable, "A", 0)).toEqual([]);
    expect(matchPrefixTable([
      prefixTable[0],
      "",
      prefixTable[2],
      prefixTable[3],
      prefixTable[4],
      prefixTable[5],
    ], "a", 0)).toEqual([]);
    expect(matchPrefixTable([
      prefixTable[0],
      prefixTable[1],
      prefixTable[2],
      prefixTable[3],
      "",
      prefixTable[5],
    ], "a", 0)).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";

import { runTransducer } from "../../../src/transducer.js";
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

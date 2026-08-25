import { describe, expect, it } from "vitest";

import {
  compileRules,
  type RuleCompilationError,
  type RuleDefinition,
} from "../src/compiler.js";

const iceb = {
  authority: "ICEB",
  document: "Rules of Unified English Braille, Third Edition",
  locator: "4.1",
  url: "https://iceb.org/publications/ueb/",
} satisfies RuleDefinition["citation"];

function rule(id: string, input: string, output: string): RuleDefinition {
  return { citation: iceb, id, input, output };
}

describe("compileRules", () => {
  it("is byte-for-byte reproducible regardless of source order", () => {
    const forward = [rule("iceb-a", "a", "⠁"), rule("iceb-b", "b", "⠃")];
    const reverse = [...forward].reverse();

    expect(JSON.stringify(compileRules(forward))).toBe(
      JSON.stringify(compileRules(reverse)),
    );
  });

  it("minimizes equivalent suffix states", () => {
    const compiled = compileRules([
      rule("iceb-bar", "bar", "⠃"),
      rule("iceb-car", "car", "⠃"),
    ]);

    expect(compiled.runtime.stateOutputIndexes).toHaveLength(4);
    expect(compiled.runtime.edgeLabels).toHaveLength(4);
  });

  it("keeps final states distinct when their outputs differ", () => {
    const compiled = compileRules([
      rule("iceb-bar", "bar", "⠃"),
      rule("iceb-car", "car", "⠉"),
    ]);

    expect(compiled.runtime.stateOutputIndexes).toHaveLength(7);
    expect(compiled.runtime.edgeLabels).toHaveLength(6);
  });

  it("deduplicates outputs while preserving every source rule", () => {
    const compiled = compileRules([
      rule("iceb-aa", "aa", "⠁"),
      rule("iceb-ab", "ab", "⠁"),
    ]);

    expect(compiled.runtime.outputs).toEqual(["⠁"]);
    expect(compiled.provenance.outputRuleIds).toEqual([
      ["iceb-aa", "iceb-ab"],
    ]);
  });

  it("accepts pinpoint citations from the named official authority", () => {
    const bana = {
      authority: "BANA",
      document: "Braille Formats",
      locator: "1.1",
      url: "https://www.brailleauthority.org/formats/",
    } satisfies RuleDefinition["citation"];

    expect(
      compileRules([{ citation: bana, id: "bana-a", input: "a", output: "⠁" }])
        .provenance.rules,
    ).toEqual([
      { citation: bana, id: "bana-a", input: "a", output: "⠁" },
    ]);
  });

  it("traces every generated state and output to source rules", () => {
    const compiled = compileRules([
      rule("iceb-a", "a", "⠁"),
      rule("iceb-b", "b", "⠃"),
    ]);

    expect(compiled.provenance.rules).toEqual([
      { citation: iceb, id: "iceb-a", input: "a", output: "⠁" },
      { citation: iceb, id: "iceb-b", input: "b", output: "⠃" },
    ]);
    expect(compiled.provenance.stateRuleIds.every((ids) => ids.length > 0)).toBe(
      true,
    );
    expect(compiled.provenance.outputRuleIds).toEqual([
      ["iceb-a"],
      ["iceb-b"],
    ]);
  });

  it.each([
    {
      code: "unreachable-rule",
      rules: [],
    },
    {
      code: "unreachable-rule",
      rules: [rule("empty", "", "⠁")],
    },
    {
      code: "ambiguous-input",
      rules: [rule("first", "a", "⠁"), rule("second", "a", "⠃")],
    },
    {
      code: "conflicting-rule-id",
      rules: [rule("same", "a", "⠁"), rule("same", "b", "⠃")],
    },
    {
      code: "uncited-rule",
      rules: [
        {
          citation: { ...iceb, locator: "" },
          id: "uncited",
          input: "a",
          output: "⠁",
        },
      ],
    },
    {
      code: "uncited-rule",
      rules: [
        {
          citation: { ...iceb, document: "" },
          id: "undocumented",
          input: "a",
          output: "⠁",
        },
      ],
    },
    {
      code: "uncited-rule",
      rules: [
        {
          citation: { ...iceb, url: "not a URL" },
          id: "invalid-url",
          input: "a",
          output: "⠁",
        },
      ],
    },
    {
      code: "uncited-rule",
      rules: [
        {
          citation: { ...iceb, url: "https://example.com/not-official" },
          id: "unofficial",
          input: "a",
          output: "⠁",
        },
      ],
    },
  ] satisfies readonly {
    readonly code: RuleCompilationError["code"];
    readonly rules: readonly RuleDefinition[];
  }[])("rejects $code", ({ code, rules }) => {
    expect(() => compileRules(rules)).toThrow(
      expect.objectContaining({ code }),
    );
  });
});

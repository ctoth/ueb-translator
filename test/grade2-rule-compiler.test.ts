import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  compileContextualRules,
  type ContextualRuleCompilationError,
  type ContextualPrecedence,
  type ContextualRuleSource,
} from "../rules/ueb-2024/contextual-compiler.js";
import { GRADE2_CONTEXTUAL_COMPILATION } from "../rules/ueb-2024/program.js";
import { citeIceb } from "../rules/ueb-2024/source.js";

const runtimeSource = readFileSync(
  new URL("../src/grade2.ts", import.meta.url),
  "utf8",
);

const rule = (
  id: `test-${string}`,
  input: string,
  precedence: ContextualPrecedence,
  guards: ContextualRuleSource["guards"] = [],
): ContextualRuleSource => ({
  braille: "⠁",
  citation: citeIceb("10.10"),
  guards,
  id,
  input,
  precedence,
});

describe("compileContextualRules", () => {
  it("rejects an unresolved precedence overlap", () => {
    expect(() =>
      compileContextualRules([
        rule("test-first", "in", 2),
        rule("test-second", "in", 2),
      ])
    ).toThrow(
      expect.objectContaining<Partial<ContextualRuleCompilationError>>({
        code: "ambiguous-precedence",
        ruleIds: ["test-first", "test-second"],
      }),
    );
  });

  it("compiles deterministically regardless of source order", () => {
    const rules = [
      rule("test-a", "a", 1, [{ kind: "standing-alone" }]),
      rule("test-b", "b", 2, [{ kind: "word-start" }]),
    ];

    expect(compileContextualRules(rules)).toEqual(
      compileContextualRules([...rules].reverse()),
    );
  });

  it("rejects duplicate identifiers and unsupported empty inputs", () => {
    expect(() =>
      compileContextualRules([
        rule("test-same", "a", 1),
        rule("test-same", "b", 2),
      ])
    ).toThrow(expect.objectContaining({ code: "conflicting-rule-id" }));
    expect(() => compileContextualRules([rule("test-empty", "", 1)]))
      .toThrow(expect.objectContaining({ code: "unreachable-rule" }));
  });

  it("rejects duplicate guards", () => {
    expect(() =>
      compileContextualRules([
        rule("test-duplicate-guard", "a", 1, [
          { kind: "word-start" },
          { kind: "word-start" },
        ]),
      ])
    ).toThrow(expect.objectContaining({ code: "duplicate-guard" }));
  });

  it("compiles the complete official inventory without unresolved precedence", () => {
    expect(GRADE2_CONTEXTUAL_COMPILATION.runtime.rules).toHaveLength(519);
    expect(GRADE2_CONTEXTUAL_COMPILATION.provenance).toHaveLength(519);
    expect(new Set(
      GRADE2_CONTEXTUAL_COMPILATION.provenance.map((source) => source.id),
    ).size).toBe(519);
  });
});

describe("Grade 2 runtime architecture", () => {
  it("interprets only the compiled contextual program", () => {
    expect(runtimeSource).toContain('from "./generated/grade2-program.js"');
    expect(runtimeSource).not.toMatch(
      /GRADE2_RULE_DATA|GRADE2_SHORTFORM_DATA|APPENDIX1_SHORTFORM_DATA|INITIAL_CONTRACTION_EXCEPTION_DATA|FINAL_(?:ITY|NESS)_EXCEPTION|rankFor|permittedCandidate|permits(?:Initial|Final|LowerGroupsign)/u,
    );
  });

  it("keeps UEB rule vocabulary out of the generic interpreter", () => {
    expect(runtimeSource).not.toMatch(
      /alphabetic-wordsign|strong-contraction|lower-groupsign|initial-letter-contraction|final-letter-groupsign|enough-or-in|\b(?:ever|under|children|great|ness|ity)\b/u,
    );
  });
});

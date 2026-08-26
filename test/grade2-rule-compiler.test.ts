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
const contextualRuntimeSource = readFileSync(
  new URL("../src/contextual-transducer.ts", import.meta.url),
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

  it("encodes each guard with only its typed operand kind", () => {
    const compilation = compileContextualRules([
      rule("test-standing", "a", 1, [{ kind: "standing-alone" }]),
      rule("test-boundaries", "b", 2, [{
        boundaries: ["braille-line", "compound"],
        kind: "not-crossing",
      }]),
      rule("test-words", "c", 3, [{ kind: "not-word", words: ["cat"] }]),
    ]);

    expect(compilation.runtime.guards).toEqual([
      [12],
      [5, 3],
      [6, 0],
    ]);
    expect(compilation.runtime.stringOperands).toEqual(["cat"]);
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

  it("rejects inputs outside the matcher's lowercase ASCII alphabet", () => {
    expect(() => compileContextualRules([
      rule("test-uppercase-input", "A", 1),
    ])).toThrow(expect.objectContaining({
      code: "unreachable-rule",
      ruleIds: ["test-uppercase-input"],
    }));
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
  it("compiles contextual inputs into the deterministic prefix matcher", () => {
    const { matcher } = GRADE2_CONTEXTUAL_COMPILATION.runtime;
    expect(matcher.inputs.length).toBeGreaterThan(0);
    expect(matcher.initialInputOffsets).toHaveLength(27);
    expect(matcher.inputRuleCounts).toHaveLength(matcher.inputs.length);
    expect(matcher.inputRuleCounts.reduce((total, count) => total + count, 0)).toBe(
      GRADE2_CONTEXTUAL_COMPILATION.runtime.rules.length,
    );
  });

  it("interprets only the compiled contextual program", () => {
    expect(runtimeSource).toContain('from "./generated/grade2-program.js"');
    expect(runtimeSource).toContain('from "./contextual-transducer.js"');
    expect(runtimeSource).not.toMatch(
      /GRADE2_RULE_DATA|GRADE2_SHORTFORM_DATA|APPENDIX1_SHORTFORM_DATA|INITIAL_CONTRACTION_EXCEPTION_DATA|FINAL_(?:ITY|NESS)_EXCEPTION|rankFor|permittedCandidate|permits(?:Initial|Final|LowerGroupsign)/u,
    );
  });

  it("keeps UEB rule vocabulary out of the generic interpreter", () => {
    expect(contextualRuntimeSource).not.toMatch(
      /alphabetic-wordsign|strong-contraction|lower-groupsign|initial-letter-contraction|final-letter-groupsign|enough-or-in|\b(?:ever|under|children|great|ness|ity)\b/u,
    );
  });

  it("delegates matching, guard evaluation, and path selection", () => {
    expect(runtimeSource).not.toMatch(
      /^function (?:guardAllows|permitsRule|candidatesAt|better|contractWord)\(/mu,
    );
  });
});

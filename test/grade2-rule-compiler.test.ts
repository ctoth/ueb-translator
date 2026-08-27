import { describe, expect, it } from "vitest";

import {
  compileContextualRules,
  requireContextualOperandIndex,
  type ContextualRuleCompilationError,
  type ContextualPrecedence,
  type ContextualRuleSource,
} from "../rules/ueb-2024/contextual-compiler.js";
import {
  compileGrade2RuleGuards,
  GRADE2_AMBIGUOUS_LETTER_SEQUENCES,
  GRADE2_CONTEXTUAL_COMPILATION,
  GRADE2_STANDING_LITERAL_INPUTS,
  requireAppendixShortformBase,
} from "../rules/ueb-2024/program.js";
import { GRADE2_INVENTORY_COUNTS } from "../rules/ueb-2024/inventory.js";
import { citeIceb } from "../rules/ueb-2024/source.js";
import { compose } from "../src/composition.js";
import {
  GRADE1_MODE_PROGRAM,
  GRADE1_SYMBOL_PROGRAM,
  UEB_COMPOSITION_POLICIES,
} from "../src/generated/ueb-2024/grade1-program.js";

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
        boundaries: ["braille-line", "compound", "prefix", "suffix", "syllable"],
        kind: "not-crossing",
      }]),
      rule("test-words", "c", 3, [{
        ignoredCharacters: "-",
        kind: "not-word",
        words: ["cat"],
      }]),
      rule("test-not-whole", "d", 4, [{ kind: "not-whole-word" }]),
    ]);

    expect(compilation.runtime.guards).toEqual([
      [12],
      [5, 31],
      [6, 1, 0],
      [10],
    ]);
    expect(compilation.runtime.stringOperands).toEqual(["-", "cat"]);
  });

  it("fails closed when a collected guard operand is missing", () => {
    const operands: ReadonlyMap<string, number> = new Map([["cat", 0]]);
    expect(requireContextualOperandIndex("cat", operands)).toBe(0);
    expect(() => requireContextualOperandIndex("dog", operands))
      .toThrow('operand was not collected: "dog"');
  });

  it("rejects duplicate identifiers and unsupported empty inputs", () => {
    expect(() => compileContextualRules([]))
      .toThrow(expect.objectContaining({ code: "unreachable-rule" }));
    expect(() =>
      compileContextualRules([
        rule("test-same", "a", 1),
        rule("test-same", "b", 2),
      ])
    ).toThrow(expect.objectContaining({ code: "conflicting-rule-id" }));
    expect(() => compileContextualRules([rule("test-empty", "", 1)]))
      .toThrow(expect.objectContaining({ code: "unreachable-rule" }));
  });

  it("derives a lowercase non-English matcher alphabet from rule inputs", () => {
    const matcher = compileContextualRules([
      rule("test-uppercase-input", "A", 1),
      rule("test-greek-input", "α", 2),
    ]).runtime.matcher;
    expect(matcher.bucketAlphabet).toEqual(["a", "α"]);
    expect(matcher.inputs).toEqual(["a", "α"]);
  });

  it("rejects an explicit alphabet missing a canonical rule input", () => {
    expect(() => compileContextualRules(
      [rule("test-missing-canonical-input", "A", 1)],
      ["B"],
    )).toThrow(expect.objectContaining({ code: "unreachable-rule" }));
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

  it("rejects empty boundary masks and unofficial citations", () => {
    expect(() => compileContextualRules([
      rule("test-empty-boundaries", "a", 1, [{ boundaries: [], kind: "not-crossing" }]),
    ])).toThrow("at least one boundary");

    const uncited = structuredClone(rule("test-uncited", "a", 1));
    Object.defineProperty(uncited.citation, "url", { value: "https://example.com/" });
    expect(() => compileContextualRules([uncited]))
      .toThrow(expect.objectContaining({ code: "uncited-rule" }));
  });

  it("compiles the complete official inventory without unresolved precedence", () => {
    expect(GRADE2_CONTEXTUAL_COMPILATION.runtime.rules).toHaveLength(
      GRADE2_INVENTORY_COUNTS.contextualRules,
    );
    expect(GRADE2_CONTEXTUAL_COMPILATION.provenance).toHaveLength(
      GRADE2_INVENTORY_COUNTS.contextualRules,
    );
    expect(new Set(
      GRADE2_CONTEXTUAL_COMPILATION.provenance.map((source) => source.id),
    ).size).toBe(GRADE2_INVENTORY_COUNTS.contextualRules);
  });
});

describe("Grade 2 source compilation", () => {
  it("derives Grade 1 ambiguity and whole-word groupsign guards", () => {
    expect(GRADE2_AMBIGUOUS_LETTER_SEQUENCES).toContainEqual(["b", "⠃"]);
    expect(GRADE2_AMBIGUOUS_LETTER_SEQUENCES).toContainEqual(["ab", "⠁⠃"]);
    expect(GRADE2_STANDING_LITERAL_INPUTS).toEqual([
      "ch", "ou", "sh", "st", "th", "wh",
    ]);
  });

  it("keeps the lower groupsign whole-word guard limited to en and in", () => {
    expect(compileGrade2RuleGuards({
      braille: "⠢",
      citation: citeIceb("10.6"),
      id: "UEB-10.6-en",
      kind: "lower-groupsign",
      print: "en",
    })).toContainEqual({ kind: "not-whole-word" });
    expect(compileGrade2RuleGuards({
      braille: "⠁",
      citation: citeIceb("10.6"),
      id: "UEB-10.6-test-fallback",
      kind: "lower-groupsign",
      print: "test-fallback",
    })).not.toContainEqual({ kind: "not-whole-word" });
  });

  it("requires every Appendix 1 base to have a shortform", () => {
    const shortform = {
      braille: "⠁⠃",
      citation: citeIceb("10.9 and Appendix 1"),
      id: "UEB-10.9-about",
      print: "about",
    } as const;
    const shortforms = new Map([[shortform.print, shortform]]);
    expect(requireAppendixShortformBase("about", shortforms)).toBe(shortform);
    expect(() => requireAppendixShortformBase("missing", shortforms))
      .toThrow("Appendix 1 base has no shortform: missing");
  });
});

describe("Grade 2 runtime architecture", () => {
  it("reaches canonically lowercase rules from uppercase composition input", () => {
    const compiled = compileContextualRules([rule("test-uppercase", "A", 0)]).runtime;
    const encode = (values: readonly number[]): string =>
      String.fromCharCode(...values.map((value) => value + 0x100));
    const translator = compose(
      GRADE1_SYMBOL_PROGRAM,
      GRADE1_MODE_PROGRAM,
      UEB_COMPOSITION_POLICIES,
      {
        ...compiled,
        code: "ueb-2024",
        grade1Ambiguities: [],
        matcher: [
          compiled.matcher.bucketAlphabet,
          compiled.matcher.inputs,
          encode(compiled.matcher.initialInputOffsets),
          encode(compiled.matcher.initialRuleOffsets),
          encode(compiled.matcher.initialGuardOffsets),
          encode(compiled.matcher.inputRuleCounts),
          encode(compiled.matcher.inputGuardCounts),
        ],
        standingLiteralInputs: [],
      },
    );

    expect(translator.translate("A")).toMatchObject({ braille: "⠠⠁", ok: true });
    expect(translator.translate("b")).toMatchObject({ braille: "⠃", ok: true });
  });

  it("remaps modes after a single-unit contraction", () => {
    const compiled = compileContextualRules([rule("test-single", "x", 0)]).runtime;
    const encode = (values: readonly number[]): string =>
      String.fromCharCode(...values.map((value) => value + 0x100));
    const contractions = {
      ...compiled,
      code: "ueb-2024",
      grade1Ambiguities: [],
      matcher: [
        compiled.matcher.bucketAlphabet,
        compiled.matcher.inputs,
        encode(compiled.matcher.initialInputOffsets),
        encode(compiled.matcher.initialRuleOffsets),
        encode(compiled.matcher.initialGuardOffsets),
        encode(compiled.matcher.inputRuleCounts),
        encode(compiled.matcher.inputGuardCounts),
      ] as const,
      standingLiteralInputs: [],
    };
    const translator = compose(
      GRADE1_SYMBOL_PROGRAM,
      GRADE1_MODE_PROGRAM,
      UEB_COMPOSITION_POLICIES,
      contractions,
    );

    expect(translator.translate("x")).toMatchObject({ braille: "⠁", ok: true });
  });

  it("rejects an empty package at the composition boundary", () => {
    expect(() => compose(
      { symbols: [] },
      GRADE1_MODE_PROGRAM,
      UEB_COMPOSITION_POLICIES,
    )).toThrow("requires compiled symbol and mode programs");
    expect(() => compose(
      GRADE1_SYMBOL_PROGRAM,
      { modes: [] },
      UEB_COMPOSITION_POLICIES,
    )).toThrow("requires compiled symbol and mode programs");
  });

  it("compiles contextual inputs into the deterministic prefix matcher", () => {
    const { matcher } = GRADE2_CONTEXTUAL_COMPILATION.runtime;
    expect(matcher.bucketAlphabet).toEqual(Array.from("abcdefghijklmnopqrstuvwxyz"));
    expect(matcher.inputs.length).toBeGreaterThan(0);
    expect(matcher.initialInputOffsets).toHaveLength(matcher.bucketAlphabet.length + 1);
    expect(matcher.inputRuleCounts).toHaveLength(matcher.inputs.length);
    expect(matcher.inputRuleCounts.reduce((total, count) => total + count, 0)).toBe(
      GRADE2_CONTEXTUAL_COMPILATION.runtime.rules.length,
    );
  });
});

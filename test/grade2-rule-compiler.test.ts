import { describe, expect, it } from "vitest";

import {
  compileContextualRules,
  requireContextualOperandIndex,
  type ContextualRuleCompilationError,
  type ContextualPrecedence,
  type ContextualRuleSource,
} from "../rules/ueb-2024/contextual-compiler.js";
import {
  GRADE2_AMBIGUOUS_LETTER_SEQUENCES,
  GRADE2_CONTEXTUAL_COMPILATION,
  GRADE2_CONTEXTUAL_RULES,
  GRADE2_STANDING_LITERAL_INPUTS,
} from "../rules/ueb-2024/program.js";
import { expandSources } from "../rules/ueb-2024/expansion.js";
import { runPipeline, toJson } from "../rules/ueb-2024/pipeline.js";
import { GRADE2_INVENTORY_COUNTS, validateInventory } from "../rules/ueb-2024/inventory.js";
import { GRADE2_RULES } from "../rules/ueb-2024/grade2-rules.js";
import { citeIceb } from "../rules/ueb-2024/source.js";
import { compose } from "../src/composition.js";
import { contextualGuardTuple, isContextualPrecedence } from "../src/contextual-schema.js";
import {
  GRADE1_MODE_PROGRAM,
  GRADE1_RUNTIME_FACTS,
  GRADE1_SYMBOL_PROGRAM,
  UEB_COMPOSITION_POLICIES,
} from "../src/generated/ueb-2024/grade1-program.js";
import { GRADE2_PROGRAM } from "../src/generated/ueb-2024/grade2-program.js";

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
  it("indexes every real shortform reading independently of source order", () => {
    const spellings = GRADE2_RULES.filter(rule => rule.kind === "lower-groupsign" && ["be", "bb"].includes(rule.print))
      .map(({ id, print, braille }) => ({ id, print, braille }));
    const decodePipeline = {
      steps: [
        { name: "words", op: "table", source: "words" },
        { name: "alphabet", op: "table", source: "alphabet" },
        { name: "readings", op: "decode", from: "words", cells: "$row.braille", alphabet: "alphabet" },
        { name: "literals", op: "flatMap", from: "readings", rows: { list: ["$row.reading.literal"] } },
      ],
      outputs: { literals: "literals" },
    };
    const words = [{ print: "before", braille: "⠆" }];
    const decoded = runPipeline(decodePipeline, { words, alphabet: spellings });
    expect(decoded["literals"]).toEqual(["bb", "be"]);
    expect(runPipeline(decodePipeline, { words, alphabet: [...spellings].reverse() })).toEqual(decoded);
    expect(() => runPipeline(decodePipeline, { words: [{ print: "x", braille: "⠭" }], alphabet: spellings }))
      .toThrow("no reading");
    const replace = (subject: string): unknown => runPipeline({
      steps: [{ name: "one", op: "table", source: "one" },
        { name: "out", op: "flatMap", from: "one", rows: { list: [{ replaceFirst: [subject, "before", "bef"] }] } }],
      outputs: { out: "out" },
    }, { one: [{}] })["out"];
    expect(() => replace("foreign")).toThrow("does not contain");
    expect(replace("beforehand")).toEqual(["befhand"]);
  });

  it("rejects conflicting ambiguity outputs and stale inventory", () => {
    const distinct = (rows: unknown): unknown => runPipeline({
      steps: [{ name: "rows", op: "table", source: "rows" },
        { name: "out", op: "distinct", from: "rows", by: "$row.0" }],
      outputs: { out: "out" },
    }, { rows: toJson(rows) })["out"];
    expect(distinct([["x", "⠭"], ["x", "⠭"]])).toEqual([["x", "⠭"]]);
    expect(() => distinct([["x", "⠭"], ["x", "⠁"]])).toThrow("conflicting rows");
    expect(() => {
      validateInventory(GRADE2_INVENTORY_COUNTS, { ...GRADE2_INVENTORY_COUNTS, rules: 0 });
    }).toThrow("Inventory rules");
  });
  it("rejects a compiled guard outside the engine ABI", () => {
    expect(() => contextualGuardTuple([999], 0)).toThrow("malformed guard");
    expect([isContextualPrecedence(0), isContextualPrecedence(10)]).toEqual([true, false]);
  });
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
      rule("test-following-mode", "e", 4, [{ kind: "stable-following-modes" }]),
      rule("test-adjacent-mode", "f", 4, [{ kind: "stable-adjacent-modes" }]),
    ]);

    expect(compilation.runtime.guards).toEqual([
      [12],
      [5, 31],
      [6, 1, 0],
      [10],
      [23],
      [24],
    ]);
    expect(compilation.runtime.stringOperands).toEqual(["-", "cat"]);
  });

  it("encodes and preserves final groupsign ending guards", () => {
    const compilation = compileContextualRules([
      rule("test-endings", "a", 1, [{
        endings: ["iness", "eness"],
        kind: "not-word-ending",
      }]),
    ]);

    expect(compilation.runtime.guards).toEqual([[7, 0]]);
    expect(compilation.runtime.stringOperands).toEqual(["eness\u0000iness"]);
    expect(compilation.provenance[0]?.guards).toEqual([{
      endings: ["iness", "eness"],
      kind: "not-word-ending",
    }]);
  });

  it("encodes an exact following-character guard", () => {
    const compilation = compileContextualRules([
      rule("test-following", "a", 1, [{ characters: "dr", kind: "following" }]),
    ]);
    expect(compilation.runtime.guards).toEqual([[17, 0]]);
    expect(compilation.runtime.stringOperands).toEqual(["dr"]);
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
    Object.defineProperty(uncited.citation, "authority", { value: "BANA" });
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
  it.each([
    ["UEB-10.5-be", "stable-following-modes"],
    ["UEB-10.6-be", "stable-following-modes"],
    ["UEB-10.6-con", "stable-following-modes"],
    ["UEB-10.6-dis", "stable-following-modes"],
    ["UEB-10.6-ea", "stable-adjacent-modes"],
    ["UEB-10.6-bb", "stable-adjacent-modes"],
    ["UEB-10.6-cc", "stable-adjacent-modes"],
    ["UEB-10.6-ff", "stable-adjacent-modes"],
    ["UEB-10.6-gg", "stable-adjacent-modes"],
  ] as const)("retains the authored mode restriction for %s", (id, kind) => {
    const source = GRADE2_CONTEXTUAL_COMPILATION.provenance.find((entry) => entry.id === id);
    expect(source?.guards).toContainEqual({ kind });
  });

  it("derives and emits Grade 1 ambiguity guards (issue #22)", () => {
    expect(GRADE2_AMBIGUOUS_LETTER_SEQUENCES).toContainEqual(["b", "⠃"]);
    expect(GRADE2_AMBIGUOUS_LETTER_SEQUENCES).toContainEqual(["ab", "⠁⠃"]);
    expect(GRADE2_PROGRAM.grade1Ambiguities).toEqual(
      GRADE2_AMBIGUOUS_LETTER_SEQUENCES,
    );
    expect(GRADE2_STANDING_LITERAL_INPUTS).toEqual([
      "ch", "ou", "sh", "st", "th", "wh",
    ]);
  });

  it("derives suffixed ambiguity guards from the 10.9.5 affixes (issue #90)", () => {
    const prints = GRADE2_AMBIGUOUS_LETTER_SEQUENCES.map(([print]) => print);
    expect(GRADE2_AMBIGUOUS_LETTER_SEQUENCES).toContainEqual(["ags", "⠁⠛⠎"]);
    expect(GRADE2_AMBIGUOUS_LETTER_SEQUENCES).toContainEqual(["yrs", "⠽⠗⠎"]);
    // abouts, almosts and hims are not shortform readings; wordsigns take no s.
    for (const print of ["abs", "alms", "hms", "bs", "qs"]) {
      expect(prints).not.toContain(print);
    }
  });

  it("keeps the lower groupsign whole-word guard limited to en and in", () => {
    const lower = new Set(GRADE2_RULES.filter(rule => rule.kind === "lower-groupsign").map(rule => rule.id));
    const restricted = GRADE2_CONTEXTUAL_RULES.filter(rule => lower.has(rule.id) &&
      rule.guards.some(guard => guard.kind === "not-whole-word"));
    expect(restricted.map(rule => rule.input)).toEqual(["en", "in"]);
  });

  it("requires every Appendix 1 base to have a shortform", () => {
    expect(() => expandSources({ appendix: [{ base: "missing", words: ["missingword"] }] }))
      .toThrow("appendixBases: no match");
    expect(() => expandSources({ appendix: [{ base: "about", words: ["foreign"] }] }))
      .toThrow("does not contain");
  });
});

describe("Grade 2 runtime architecture", () => {
  it.each([
    ["be", "BEa", "stable-following-modes"],
    ["ab", "ABa", "stable-following-modes"],
    ["ea", "aEaa", "stable-adjacent-modes"],
    ["ab", "aAba", "stable-adjacent-modes"],
  ] as const)("selects mode restrictions from rule data for %s", (input, text, kind) => {
    const translate = (guards: ContextualRuleSource["guards"]): string | undefined => {
      const compiled = compileContextualRules([rule("test-mode-policy", input, 0, guards)]).runtime;
      const encode = (values: readonly number[]): string =>
        String.fromCharCode(...values.map((value) => value + 0x100));
      const translator = compose(GRADE1_SYMBOL_PROGRAM, GRADE1_MODE_PROGRAM,
        UEB_COMPOSITION_POLICIES, GRADE1_RUNTIME_FACTS, {
          ...compiled,
          code: "ueb-2024",
          grade1Ambiguities: [],
          grade1LongerAmbiguities: [],
          matcher: [
            compiled.matcher.bucketAlphabet, compiled.matcher.inputs,
            encode(compiled.matcher.initialInputOffsets),
            encode(compiled.matcher.initialRuleOffsets),
            encode(compiled.matcher.initialGuardOffsets),
            encode(compiled.matcher.inputRuleCounts),
            encode(compiled.matcher.inputGuardCounts),
          ],
          standingLiteralInputs: [],
        });
      const result = translator.translate(text);
      expect(result.ok).toBe(true);
      return result.ok ? result.braille : undefined;
    };
    expect(translate([{ kind }])).not.toEqual(translate([]));
  });

  it.each([
    ["'tis", "test-leading-tis"],
    ["’twas", "test-leading-twas"],
    ["'em", "test-leading-em"],
    ["can't", "test-internal-cant"],
    ["o’clock", "test-internal-oclock"],
  ] as const)("keeps apostrophes in the eligibility word for %s", (text, id) => {
    const sources = [
      rule("test-leading-tis", "tis", 0, [{
        kind: "eligibility-word",
        pluralSuffix: "",
        word: "'tis",
      }]),
      rule("test-leading-twas", "twas", 0, [{
        kind: "eligibility-word",
        pluralSuffix: "",
        word: "'twas",
      }]),
      rule("test-leading-em", "em", 0, [{
        kind: "eligibility-word",
        pluralSuffix: "",
        word: "'em",
      }]),
      rule("test-internal-cant", "can", 0, [{
        kind: "eligibility-word",
        pluralSuffix: "",
        word: "can't",
      }]),
      rule("test-internal-oclock", "clock", 0, [{
        kind: "eligibility-word",
        pluralSuffix: "",
        word: "o'clock",
      }]),
    ];
    const compilation = compileContextualRules(sources);
    const compiled = compilation.runtime;
    const encode = (values: readonly number[]): string =>
      String.fromCharCode(...values.map((value) => value + 0x100));
    const translator = compose(
      GRADE1_SYMBOL_PROGRAM,
      GRADE1_MODE_PROGRAM,
      UEB_COMPOSITION_POLICIES,
      GRADE1_RUNTIME_FACTS,
      {
        ...compiled,
        code: "ueb-2024",
        grade1Ambiguities: [],
        grade1LongerAmbiguities: [],
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

    const result = translator.translate(text);
    expect(result.ok).toBe(true);
    const ruleIndex = compilation.provenance.findIndex((source) => source.id === id);
    expect(ruleIndex).toBeGreaterThanOrEqual(0);
    if (result.ok) {
      expect(result.rules.map((applied) => applied.ruleIndex)).toContain(ruleIndex);
    }
  });

  it("reaches canonically lowercase rules from uppercase composition input", () => {
    const compiled = compileContextualRules([rule("test-uppercase", "A", 0)]).runtime;
    const encode = (values: readonly number[]): string =>
      String.fromCharCode(...values.map((value) => value + 0x100));
    const translator = compose(
      GRADE1_SYMBOL_PROGRAM,
      GRADE1_MODE_PROGRAM,
      UEB_COMPOSITION_POLICIES,
      GRADE1_RUNTIME_FACTS,
      {
        ...compiled,
        code: "ueb-2024",
        grade1Ambiguities: [],
        grade1LongerAmbiguities: [],
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

  it("falls back to the source character when elision punctuation is empty", () => {
    const compilation = compileContextualRules([
      rule("test-empty-elision", "a", 0, [{
        kind: "eligibility-word",
        pluralSuffix: "",
        word: "a-b",
      }]),
    ]);
    const compiled = compilation.runtime;
    const encode = (values: readonly number[]): string =>
      String.fromCharCode(...values.map((value) => value + 0x100));
    const translator = compose(
      GRADE1_SYMBOL_PROGRAM,
      GRADE1_MODE_PROGRAM,
      { ...UEB_COMPOSITION_POLICIES, elisionPunctuation: "" },
      GRADE1_RUNTIME_FACTS,
      {
        ...compiled,
        code: "ueb-2024",
        grade1Ambiguities: [],
        grade1LongerAmbiguities: [],
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

    const result = translator.translate("a-b");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rules.map((applied) => applied.ruleIndex)).toContain(0);
    }
  });

  it("remaps modes after a single-unit contraction", () => {
    const compiled = compileContextualRules([rule("test-single", "x", 0)]).runtime;
    const encode = (values: readonly number[]): string =>
      String.fromCharCode(...values.map((value) => value + 0x100));
    const contractions = {
      ...compiled,
      code: "ueb-2024",
      grade1Ambiguities: [],
      grade1LongerAmbiguities: [],
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
      GRADE1_RUNTIME_FACTS,
      contractions,
    );

    expect(translator.translate("x")).toMatchObject({ braille: "⠁", ok: true });
  });

  it("rejects an empty package at the composition boundary", () => {
    expect(() => compose(
      { symbols: [] },
      GRADE1_MODE_PROGRAM,
      UEB_COMPOSITION_POLICIES,
      GRADE1_RUNTIME_FACTS,
    )).toThrow("requires compiled symbol and mode programs");
    expect(() => compose(
      GRADE1_SYMBOL_PROGRAM,
      { modes: [] },
      UEB_COMPOSITION_POLICIES,
      GRADE1_RUNTIME_FACTS,
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

import { describe, expect, it } from "vitest";

import { isTechnicalLayouts } from "../src/technical-program.js";
import { readTechnicalLayoutRules } from "../rules/ueb-2024/rule-json.js";
import {
  compileTechnicalSigns, TECHNICAL_LAYOUT_RULES, TECHNICAL_COMPUTER_WHITESPACE_RULES,
  TECHNICAL_NUMERIC_CONTINUATION_RULES, TECHNICAL_FUNCTION_SPACING_RULES,
  TECHNICAL_GRADE1_PROTECTION_RULES, TECHNICAL_OPERATION_SPACING_RULES, TECHNICAL_VALUE_PATTERNS,
  TECHNICAL_ITEM_RULES, TECHNICAL_DELIMITER_RULES, TECHNICAL_MODIFIER_RULES, TECHNICAL_SCRIPT_RULES,
  TECHNICAL_SHAPE_RULES, TECHNICAL_SIGN_MAPPINGS, TECHNICAL_SYMBOL_RULES,
} from "../rules/ueb-2024/technical-signs.js";
import { SYMBOL_RULES } from "../rules/ueb-2024/symbols/source.js";
import { sourceData } from "../rules/ueb-2024/source-manifest.js";

const LAYOUTS = TECHNICAL_LAYOUT_RULES.definitions;
const VALUE_CHILD = {
  name: "value", render: "value", field: "value", pattern: "number", invalid: "number", standing: false,
};

function withLayout(kind: string, layout: unknown): unknown {
  return { ...LAYOUTS, [kind]: layout };
}

function plain(parts: unknown, children: unknown = [VALUE_CHILD]): unknown {
  return withLayout("number", { children, parts });
}

describe("technical layouts", () => {
  it("accepts the cited layout table", () => {
    expect(isTechnicalLayouts(LAYOUTS)).toBe(true);
  });

  it.each([
    ["not an object", null],
    ["an array", []],
    ["an unknown kind", withLayout("unknown-kind", LAYOUTS.number)],
    ["a missing kind", Object.fromEntries(Object.entries(LAYOUTS).filter(([kind]) => kind !== "number"))],
    ["a non-object layout", withLayout("number", "layout")],
    ["a sequence with extra keys", withLayout("sequence", { sequence: "items", parts: [] })],
    ["a sequence without a field name", withLayout("sequence", { sequence: 1 })],
    ["a case with extra keys", withLayout("number", { ...LAYOUTS.number, extra: true })],
    ["children that are not a list", plain([{ child: "value" }], "value")],
    ["parts that are not a list", withLayout("number", { children: [VALUE_CHILD], parts: "value" })],
    ["empty parts", plain([])],
    ["duplicate child names", plain([{ child: "value" }], [VALUE_CHILD, VALUE_CHILD])],
    ["a non-object child", plain([{ child: "value" }], ["value"])],
    ["a child without a name", plain([{ child: "value" }], [{ ...VALUE_CHILD, name: 1 }])],
    ["a child without a field", plain([{ child: "value" }], [{ ...VALUE_CHILD, field: 1 }])],
    ["an expression child with extra keys", plain([{ child: "value" }],
      [{ name: "value", render: "expression", field: "value", standing: true }])],
    ["an unknown render", plain([{ child: "value" }], [{ ...VALUE_CHILD, render: "text" }])],
    ["a value child with extra keys", plain([{ child: "value" }], [{ ...VALUE_CHILD, extra: 1 }])],
    ["an unknown value pattern", plain([{ child: "value" }], [{ ...VALUE_CHILD, pattern: "word" }])],
    ["an unknown failure kind", plain([{ child: "value" }], [{ ...VALUE_CHILD, invalid: "word" }])],
    ["a non-boolean standing flag", plain([{ child: "value" }], [{ ...VALUE_CHILD, standing: "yes" }])],
    ["a non-object part", plain(["value"])],
    ["a child part with extra keys", plain([{ child: "value", extra: 1 }])],
    ["an undeclared child part", plain([{ child: "other" }])],
    ["a false numeric-indicator flag", plain([{ child: "value", withoutNumericIndicator: false }])],
    ["a widen that is not a list", plain([{ child: "value", widen: "standing-word" }])],
    ["an unknown widened kind", plain([{ child: "value", widen: ["symbol"] }])],
    ["both sign and symbol", plain([{ sign: ["delimiters"], symbol: ["arrows"] }])],
    ["a sign with extra keys", plain([{ sign: ["delimiters"], extra: 1 }])],
    ["an empty sign path", plain([{ sign: [] }])],
    ["a sign path that is not a list", plain([{ sign: "delimiters" }])],
    ["a field step with extra keys", plain([{ sign: [{ field: "value", extra: 1 }] }])],
    ["a field step without a name", plain([{ sign: [{ field: 1 }] }])],
    ["an unknown requirement", plain([{ sign: ["delimiters"], require: "word" }])],
    ["cells without a requirement", plain([{ sign: ["delimiters"], requireCells: 1 }])],
    ["zero required cells", plain([{ sign: ["delimiters"], require: "symbol", requireCells: 0 }])],
    ["fractional required cells", plain([{ sign: ["delimiters"], require: "symbol", requireCells: 1.5 }])],
    ["a letter space before an undeclared child", plain([{ space: "letter", before: "other" }])],
    ["a letter space with extra keys", plain([{ space: "letter", before: "value", extra: 1 }])],
    ["an unknown space", plain([{ space: "wide" }])],
    ["a space with extra keys", plain([{ space: "always", before: "value" }])],
    ["a select with extra keys", withLayout("shape", { ...LAYOUTS.shape, extra: 1 })],
    ["a non-object select", withLayout("shape", { ...LAYOUTS.shape, select: "terminator" })],
    ["a select with field and sign", withLayout("shape", { ...LAYOUTS.shape, select: { field: "terminator", sign: ["shapes"] } })],
    ["a select with an unknown key", withLayout("shape", { ...LAYOUTS.shape, select: { name: "terminator" } })],
    ["a select field that is not a name", withLayout("shape", { ...LAYOUTS.shape, select: { field: 1 } })],
    ["a select sign that is not a path", withLayout("shape", { ...LAYOUTS.shape, select: { sign: [] } })],
    ["non-object cases", withLayout("shape", { ...LAYOUTS.shape, cases: [] })],
    ["empty cases", withLayout("shape", { ...LAYOUTS.shape, cases: {} })],
    ["a malformed case", withLayout("shape", { ...LAYOUTS.shape, cases: { present: { parts: [] } } })],
  ])("rejects %s", (_name, layouts) => {
    expect(isTechnicalLayouts(layouts)).toBe(false);
  });

  it("accepts a select keyed by a program path", () => {
    expect(isTechnicalLayouts(withLayout("shape", {
      ...LAYOUTS.shape, select: { sign: ["shapes", { field: "fill" }] },
    }))).toBe(true);
  });

  it("strips each citation and rejects uncited or malformed layouts", () => {
    const source = sourceData("technical", "layouts");
    expect(readTechnicalLayoutRules(source).definitions).toEqual(LAYOUTS);
    expect(() => readTechnicalLayoutRules(LAYOUTS)).toThrow();
    const cited = (layout: unknown) => ({
      citation: { source: "technical-2014", locator: "1, p.2" },
      ...(typeof layout === "object" ? layout : {}),
    });
    const malformed = Object.fromEntries(Object.entries(LAYOUTS).map(([kind, layout]) =>
      [kind, cited(kind === "number" ? { ...layout, extra: true } : layout)]));
    expect(() => readTechnicalLayoutRules(malformed)).toThrow("Malformed JSON rule source.");
  });

  it("requires an official citation for every layout", () => {
    const [first] = TECHNICAL_LAYOUT_RULES.citations;
    if (first === undefined) throw new Error("Layouts are uncited.");
    const unofficial = {
      ...TECHNICAL_LAYOUT_RULES,
      citations: [{ ...first, locator: "" }],
    };
    expect(() => compileTechnicalSigns(SYMBOL_RULES, TECHNICAL_SYMBOL_RULES, TECHNICAL_SIGN_MAPPINGS,
      TECHNICAL_SCRIPT_RULES, TECHNICAL_MODIFIER_RULES, TECHNICAL_SHAPE_RULES, TECHNICAL_DELIMITER_RULES,
      TECHNICAL_ITEM_RULES, TECHNICAL_VALUE_PATTERNS, TECHNICAL_OPERATION_SPACING_RULES,
      TECHNICAL_GRADE1_PROTECTION_RULES, TECHNICAL_FUNCTION_SPACING_RULES,
      TECHNICAL_NUMERIC_CONTINUATION_RULES, TECHNICAL_COMPUTER_WHITESPACE_RULES, unofficial))
      .toThrow("official ICEB citation");
  });
});

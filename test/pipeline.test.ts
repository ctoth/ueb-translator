import { describe, expect, it } from "vitest";

import { runPipeline, toJson, type Json } from "../rules/ueb-2024/pipeline.js";
import { expansionTable } from "../rules/ueb-2024/expansion.js";

/** Evaluate one expression over a one-row table bound as `row`. */
function evaluate(expression: Json, row: Json = {}, extra: Readonly<Record<string, Json>> = {}): Json {
  const result = runPipeline({
    functions: { pair: { params: ["a", "b"], body: { list: ["$a", "$b"] } } },
    steps: [
      { name: "rows", op: "table", source: "rows" },
      { name: "letters", op: "table", source: "letters" },
      { name: "out", op: "flatMap", from: "rows", rows: { list: [expression] } },
    ],
    outputs: { out: "out" },
  }, {
    rows: [row], letters: [{ cell: "⠁", letter: "a" }, { cell: "⠃", letter: "b" }],
    documents: { book: { authority: "ICEB", document: "Book", url: "https://iceb.org/" } },
    ...extra,
  })["out"];
  return result?.[0] ?? null;
}

describe("pipeline expressions", () => {
  it.each<[string, Json, Json]>([
    ["literal", "x", "x"],
    ["bound name", "$row.a.0", 1],
    ["whole bound name", "$row", { a: [1, 2], s: "s" }],
    ["input", "@letters.0.letter", "a"],
    ["literal reference-like text", { literal: "$row" }, "$row"],
    ["literal input-like text", { literal: "@letters" }, "@letters"],
    ["optional present", { optional: "row.a" }, [1, 2]],
    ["optional absent", { optional: "row.missing.deeper" }, null],
    ["column", { column: ["letters", "letter"] }, ["a", "b"]],
    ["record", { record: { k: "$row.s" } }, { k: "s" }],
    ["merge", { merge: [{ record: { a: 1, b: 2 } }, { record: { b: 3 } }] }, { a: 1, b: 3 }],
    ["concat text", { concat: ["a", "b"] }, "ab"],
    ["concat lists", { concat: [{ list: [1] }, { list: [2] }] }, [1, 2]],
    ["join", { join: [{ list: ["a", "b"] }, "-"] }, "a-b"],
    ["replaceFirst", { replaceFirst: ["abab", "b", { literal: "$&" }] }, "a$&ab"],
    ["in", { in: [2, "$row.a"] }, true],
    ["test", { test: ["^[a-z]$", "q"] }, true],
    ["each", { each: ["$row.a", "n", { list: ["$n"] }] }, [[1], [2]]],
    ["where", { where: ["$row.a", "n", { eq: ["$n", 2] }] }, [2]],
    ["find", { find: ["$row.a", "n", { eq: ["$n", 3] }] }, null],
    ["some", { some: ["$row.a", "n", { eq: ["$n", 1] }] }, true],
    ["flatten", { flatten: { list: [{ list: [1] }, { list: [2, 3] }] } }, [1, 2, 3]],
    ["sorted", { sorted: { list: ["b", "a", "B"] } }, ["B", "a", "b"]],
    ["unique", { unique: { list: [1, 1, 2] } }, [1, 2]],
    ["if", { if: [false, 1, 2] }, 2],
    ["default", { default: [{ optional: "row.none" }, "fallback"] }, "fallback"],
    ["default kept", { default: ["kept", "fallback"] }, "kept"],
    ["not", { not: false }, true],
    ["and", { and: [true, false] }, false],
    ["or", { or: [false, true] }, true],
    ["isText", { isText: 1 }, false],
    ["isEmpty", { isEmpty: { list: [] } }, true],
    ["startsWith", { startsWith: ["abc", "ab"] }, true],
    ["endsWith", { endsWith: ["abc", "bc"] }, true],
    ["after", { after: ["abc", "a"] }, "bc"],
    ["at present", { at: [{ record: { k: "v" } }, "k", "fallback"] }, "v"],
    ["at absent", { at: [null, "k", "fallback"] }, "fallback"],
    ["spell", { spell: ["ab", "letters", "letter", "cell"] }, "⠁⠃"],
    ["spell missing", { spell: ["ac", "letters", "letter", "cell"] }, null],
    ["cite", { cite: { record: { source: "book", locator: "1.2" } } },
      { authority: "ICEB", document: "Book", locator: "1.2", url: "https://iceb.org/" }],
    ["call", { call: ["pair", 1, 2] }, [1, 2]],
  ])("evaluates %s", (_name, expression, expected) => {
    expect(evaluate(expression, { a: [1, 2], s: "s" })).toEqual(expected);
  });

  it.each<[string, Json, string]>([
    ["bare list", [1], "Lists are written"],
    ["two operators", { optional: "row", list: [] }, "one operator"],
    ["empty expression", {}, "one operator"],
    ["unknown operator", { nope: 1 }, "Unknown expression operator"],
    ["removed long reference", { get: "row" }, "Unknown expression operator"],
    ["unbound", "$missing", "Unbound name"],
    ["unbound optional", { optional: "missing" }, "Unbound name"],
    ["missing field", "$row.missing", "No field"],
    ["missing index", "$row.a.9", "No index"],
    ["missing input", "@missing", "No field"],
    ["non-text literal", { literal: 1 }, "Expected text"],
    ["non-list", { flatten: "x" }, "Expected a list"],
    ["non-text", { join: [{ list: [1] }, "-"] }, "Expected text"],
    ["non-record", { merge: [1] }, "Expected a record"],
    ["non-boolean", { if: [1, 2, 3] }, "Expected a boolean"],
    ["arity two", { eq: [1] }, "two arguments"],
    ["arity three", { if: [true, 1] }, "three arguments"],
    ["arity four", { spell: ["a", "letters", "letter"] }, "four arguments"],
    ["absent substring", { replaceFirst: ["abc", "z", ""] }, "does not contain"],
    ["empty locator", { cite: { record: { source: "book", locator: " " } } }, "Empty citation locator"],
    ["unknown table", { column: ["missing", "x"] }, "Unknown table"],
    ["unknown function", { call: ["missing"] }, "No field"],
    ["function arity", { call: ["pair", 1] }, "takes 2 arguments"],
    ["function name", { call: [] }, "needs a function name"],
    ["explicit failure", { fail: "stop" }, "stop"],
  ])("rejects %s", (_name, expression, message) => {
    expect(() => evaluate(expression, { a: [1, 2] })).toThrow(message);
  });
});

describe("pipeline operations", () => {
  const run = (steps: readonly Json[], inputs: Readonly<Record<string, Json>>, output: string): readonly Json[] =>
    runPipeline({ steps, outputs: { out: output } }, inputs)["out"] ?? [];

  it("turns records into keyed rows and joins in each mode", () => {
    const steps: Json[] = [
      { name: "left", op: "table", source: "left" },
      { name: "right", op: "table", source: "right" },
    ];
    const inputs = { left: [{ k: "a" }, { k: "b" }], right: { a: { v: 1 }, c: { v: 2 } } };
    const join = (mode: string): readonly Json[] => run([...steps,
      { name: "out", op: "join", from: "left", with: "right", left: ["$row.k"], right: ["$row.key"], mode, as: "m" }],
    inputs, "out");
    expect(join("all")).toEqual([{ k: "a", m: [{ key: "a", v: 1 }] }, { k: "b", m: [] }]);
    expect(join("first")).toEqual([{ k: "a", m: { key: "a", v: 1 } }, { k: "b", m: null }]);
    expect(() => join("one")).toThrow("out: no match");
    expect(() => join("many")).toThrow("unknown join mode");
  });

  it("filters, concatenates, groups, keeps distinct rows and sorts", () => {
    const inputs = { rows: [{ g: "b", v: ["y", "x"] }, { g: "a", v: ["z"] }, { g: "b", v: ["x"] }] };
    const steps: Json[] = [
      { name: "rows", op: "table", source: "rows" },
      { name: "kept", op: "filter", from: "rows", where: { eq: ["$row.g", "b"] } },
      { name: "both", op: "concat", from: ["kept", "rows"] },
      { name: "grouped", op: "group", from: "rows", by: "$row.g", collect: { v: "$row.v" } },
      { name: "sorted", op: "sort", from: "grouped", by: "$row.key" },
    ];
    expect(run(steps, inputs, "both")).toHaveLength(5);
    expect(run(steps, inputs, "sorted")).toEqual([{ key: "a", v: ["z"] }, { key: "b", v: ["x", "y"] }]);
    expect(() => run([...steps, { name: "distinct", op: "distinct", from: "kept", by: "$row.g" }], inputs, "distinct"))
      .toThrow("conflicting rows");
    expect(() => run([{ name: "rows", op: "table", source: "rows" },
      { name: "f", op: "filter", from: "rows", where: "yes" }], inputs, "f")).toThrow("Expected a boolean");
  });

  it("decodes every reading and rejects empty alphabet entries or unread cells", () => {
    const steps: Json[] = [
      { name: "words", op: "table", source: "words" },
      { name: "alphabet", op: "table", source: "alphabet" },
      { name: "out", op: "decode", from: "words", cells: "$row.cells", alphabet: "alphabet" },
    ];
    const alphabet = [{ id: "x", print: "ab", braille: "⠁⠃" }, { id: "a", print: "a", braille: "⠁" }, { id: "b", print: "b", braille: "⠃" }];
    expect(run(steps, { words: [{ cells: "⠁⠃" }], alphabet }, "out")).toEqual([
      { cells: "⠁⠃", reading: { literal: "ab", ids: ["a", "b"] } },
      { cells: "⠁⠃", reading: { literal: "ab", ids: ["x"] } },
    ]);
    expect(() => run(steps, { words: [{ cells: "⠉" }], alphabet }, "out")).toThrow("no reading");
    expect(() => run(steps, { words: [{ cells: "⠁" }], alphabet: [{ id: "e", print: "", braille: "" }] }, "out"))
      .toThrow("empty");
  });

  it("rejects unknown ops, duplicate tables and non-JSON inputs", () => {
    expect(() => run([{ name: "x", op: "nope" }], {}, "x")).toThrow("unknown pipeline op");
    expect(() => run([{ name: "x", op: "table", source: "rows" }, { name: "x", op: "table", source: "rows" }], { rows: [] }, "x"))
      .toThrow("defined twice");
    expect(() => toJson(() => 1)).toThrow("JSON data");
    expect(() => toJson(Number.NaN)).toThrow("JSON data");
    expect(toJson({ a: [1, true, null, "s"] })).toEqual({ a: [1, true, null, "s"] });
  });

  it("names every expansion output it is asked for", () => {
    expect(expansionTable("rules").length).toBeGreaterThan(0);
    expect(() => expansionTable("missing")).toThrow("no output missing");
  });
});

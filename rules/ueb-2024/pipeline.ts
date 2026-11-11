/**
 * Interpreter for the declarative compiler pipeline (expansion-pipeline.json).
 * The Python package implements the same operations; the pipeline file is the
 * single description of how sources become contextual rules.
 */
export type Json = boolean | number | string | null | readonly Json[] | { readonly [key: string]: Json };
type Row = Readonly<Record<string, Json>>;
type Scope = Readonly<Record<string, Json>>;

export class PipelineError extends Error {
  public override readonly name = "PipelineError";
}

function fail(message: string): never {
  throw new PipelineError(message);
}
function isRecord(value: Json): value is Row {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isList(value: Json): value is readonly Json[] {
  return Array.isArray(value);
}
function list(value: Json): readonly Json[] {
  return isList(value) ? value : fail(`Expected a list, got ${JSON.stringify(value)}.`);
}
function text(value: Json): string {
  return typeof value === "string" ? value : fail(`Expected text, got ${JSON.stringify(value)}.`);
}
export function record(value: Json): Row {
  return isRecord(value) ? value : fail(`Expected a record, got ${JSON.stringify(value)}.`);
}
/** Conditions are booleans; anything else is a malformed source, not "false". */
function truth(value: Json): boolean {
  return typeof value === "boolean" ? value : fail(`Expected a boolean, got ${JSON.stringify(value)}.`);
}
function field(row: Row, name: string): Json {
  const value = row[name];
  return value === undefined ? fail(`No field ${name}.`) : value;
}
function two(argument: Json): readonly [Json, Json] {
  const [a, b, ...rest] = list(argument);
  return a === undefined || b === undefined || rest.length > 0 ? fail("Expected two arguments.") : [a, b];
}
function three(argument: Json): readonly [Json, Json, Json] {
  const [a, b, c, ...rest] = list(argument);
  return a === undefined || b === undefined || c === undefined || rest.length > 0 ? fail("Expected three arguments.") : [a, b, c];
}
function four(argument: Json): readonly [Json, Json, Json, Json] {
  const [a, b, c, d, ...rest] = list(argument);
  return a === undefined || b === undefined || c === undefined || d === undefined || rest.length > 0
    ? fail("Expected four arguments.") : [a, b, c, d];
}
/** UTF-16 code-unit order, the order JavaScript's default sort uses; non-text compares as JSON. */
function compare(left: Json, right: Json): number {
  const a = typeof left === "string" ? left : JSON.stringify(left);
  const b = typeof right === "string" ? right : JSON.stringify(right);
  return a < b ? -1 : a > b ? 1 : 0;
}
function path(value: Json, dotted: string): Json {
  let node = value;
  for (const key of dotted.split(".")) {
    node = Array.isArray(node) ? list(node)[Number(key)] ?? fail(`No index ${key} in ${dotted}.`) : field(record(node), key);
  }
  return node;
}
function unique(values: readonly Json[]): readonly Json[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = JSON.stringify(value);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

interface Context {
  readonly functions: Row;
  readonly inputs: Row;
  readonly tables: ReadonlyMap<string, readonly Json[]>;
}

function table(context: Context, name: string): readonly Json[] {
  return context.tables.get(name) ?? fail(`Unknown table ${name}.`);
}
function lookupName(scope: Scope, dotted: string, optional: boolean): Json {
  const [head = "", ...rest] = dotted.split(".");
  const root = Object.hasOwn(scope, head) ? scope[head] : undefined;
  if (root === undefined) return fail(`Unbound name ${dotted}.`);
  if (!optional) return rest.length === 0 ? root : path(root, rest.join("."));
  let node: Json = root;
  for (const key of rest) node = isRecord(node) && Object.hasOwn(node, key) ? field(node, key) : null;
  return node;
}

/** Evaluate one expression against the current row and bound variables. */
export function evaluate(expression: Json, scope: Scope, context: Context): Json {
  if (!isRecord(expression)) {
    return Array.isArray(expression) ? fail("Lists are written {\"list\": [...]}.") : expression;
  }
  const entries = Object.entries(expression);
  const [entry, ...extra] = entries;
  if (entry === undefined || extra.length > 0) return fail(`Expression must have one operator: ${JSON.stringify(expression)}.`);
  const [operator, argument] = entry;
  const value = (inner: Json): Json => evaluate(inner, scope, context);
  const args = (): readonly Json[] => list(argument).map(value);
  const within = (name: Json, item: Json, body: Json): Json => evaluate(body, { ...scope, [text(name)]: item }, context);
  switch (operator) {
    case "get": return lookupName(scope, text(argument), false);
    case "optional": return lookupName(scope, text(argument), true);
    case "input": return path(context.inputs, text(argument));
    case "column": {
      const [name, column] = two(argument);
      return table(context, text(name)).map((row) => path(row, text(column)));
    }
    case "list": return args();
    case "record": return Object.fromEntries(Object.entries(record(argument)).map(([key, inner]) => [key, value(inner)]));
    case "merge": return Object.fromEntries(args().flatMap((part) => Object.entries(record(part))));
    case "concat": {
      const values = args();
      return values.every((part) => typeof part === "string") ? values.join("") : values.flatMap(list);
    }
    case "join": {
      const [items, separator] = two(argument);
      return list(value(items)).map(text).join(text(value(separator)));
    }
    case "replaceFirst": {
      const [subjectExpression, fromExpression, toExpression] = three(argument);
      const subject = text(value(subjectExpression)), from = text(value(fromExpression)), to = text(value(toExpression));
      if (!subject.includes(from)) return fail(`${subject} does not contain ${from}.`);
      return subject.replace(from, () => to);
    }
    case "in": {
      const [item, items] = two(argument);
      const key = JSON.stringify(value(item));
      return list(value(items)).some((candidate) => JSON.stringify(candidate) === key);
    }
    case "test": {
      const [pattern, subject] = two(argument);
      return new RegExp(text(value(pattern)), "u").test(text(value(subject)));
    }
    case "each": {
      const [items, name, body] = three(argument);
      return list(value(items)).map((item) => within(name, item, body));
    }
    case "where": {
      const [items, name, condition] = three(argument);
      return list(value(items)).filter((item) => truth(within(name, item, condition)));
    }
    case "find": {
      const [items, name, condition] = three(argument);
      return list(value(items)).find((item) => truth(within(name, item, condition))) ?? null;
    }
    case "some": {
      const [items, name, condition] = three(argument);
      return list(value(items)).some((item) => truth(within(name, item, condition)));
    }
    case "flatten": return list(value(argument)).flatMap(list);
    case "sorted": return [...list(value(argument))].sort(compare);
    case "unique": return unique(list(value(argument)));
    case "if": {
      const [condition, then, otherwise] = three(argument);
      return truth(value(condition)) ? value(then) : value(otherwise);
    }
    case "default": {
      const [first, fallback] = two(argument);
      return value(first) ?? value(fallback);
    }
    case "not": return !truth(value(argument));
    case "and": return list(argument).every((inner) => truth(value(inner)));
    case "or": return list(argument).some((inner) => truth(value(inner)));
    case "eq": {
      const [left, right] = two(argument);
      return JSON.stringify(value(left)) === JSON.stringify(value(right));
    }
    case "isText": return typeof value(argument) === "string";
    case "isEmpty": return list(value(argument)).length === 0;
    case "startsWith": {
      const [subject, prefix] = two(argument);
      return text(value(subject)).startsWith(text(value(prefix)));
    }
    case "endsWith": {
      const [subject, suffix] = two(argument);
      return text(value(subject)).endsWith(text(value(suffix)));
    }
    case "after": {
      const [subject, prefix] = two(argument);
      return text(value(subject)).slice(text(value(prefix)).length);
    }
    case "at": {
      const [subject, key, fallback] = three(argument);
      const found = value(subject), name = text(value(key));
      return isRecord(found) && Object.hasOwn(found, name) ? field(found, name) : value(fallback);
    }
    case "spell": {
      // Map every scalar through a table's from/to fields; null when any scalar is absent.
      const [subject, name, from, to] = four(argument);
      const pairs = new Map(table(context, text(name)).map((row) => [text(path(row, text(from))), text(path(row, text(to)))]));
      let result = "";
      for (const scalar of text(value(subject))) {
        const mapped = pairs.get(scalar);
        if (mapped === undefined) return null;
        result += mapped;
      }
      return result;
    }
    case "cite": {
      const reference = record(value(argument));
      const locator = text(field(reference, "locator"));
      const document = record(path(context.inputs, `documents.${text(field(reference, "source"))}`));
      if (locator.trim().length === 0) return fail("Empty citation locator.");
      return { authority: field(document, "authority"), document: field(document, "document"), locator, url: field(document, "url") };
    }
    case "call": {
      const [nameExpression, ...actuals] = list(argument);
      const name = text(nameExpression === undefined ? fail("call needs a function name.") : nameExpression);
      const fn = record(field(context.functions, name));
      const params = list(field(fn, "params")).map(text);
      if (params.length !== actuals.length) return fail(`${name} takes ${String(params.length)} arguments.`);
      const local: Record<string, Json> = {};
      for (const [index, actual] of actuals.entries()) {
        /* v8 ignore next -- params and actuals have equal length, checked above. */
        local[params[index] ?? ""] = value(actual);
      }
      return evaluate(field(fn, "body"), local, context);
    }
    case "fail": return fail(text(value(argument)));
    default: return fail(`Unknown expression operator ${operator}.`);
  }
}

/** Every segmentation of cells over the alphabet rows {braille, print, id}: readings {literal, ids}, sorted. */
function decode(cells: string, alphabet: readonly Row[], cache: Map<string, readonly Row[]>): readonly Row[] {
  const found = cache.get(cells);
  if (found !== undefined) return found;
  if (cells.length === 0) return [{ literal: "", ids: [] }];
  const readings: Row[] = [];
  for (const symbol of alphabet) {
    const braille = text(field(symbol, "braille"));
    if (braille.length === 0) return fail("A decode alphabet entry is empty.");
    if (!cells.startsWith(braille)) continue;
    for (const tail of decode(cells.slice(braille.length), alphabet, cache)) {
      readings.push({
        literal: text(field(symbol, "print")) + text(field(tail, "literal")),
        ids: [...new Set([text(field(symbol, "id")), ...list(field(tail, "ids")).map(text)])].sort(compare),
      });
    }
  }
  const result = unique(readings).map(record).sort((left, right) =>
    compare(field(left, "literal"), field(right, "literal")) || compare(field(left, "ids"), field(right, "ids")));
  cache.set(cells, result);
  return result;
}

function runStep(step: Row, context: Context): readonly Json[] {
  const name = text(field(step, "name"));
  const from = (): readonly Json[] => table(context, text(field(step, "from")));
  const each = (row: Json, key: string): Json => evaluate(field(step, key), { row }, context);
  const keyOf = (row: Json, key: string): string => JSON.stringify(list(field(step, key)).map((expression) =>
    evaluate(expression, { row }, context)));
  switch (text(field(step, "op"))) {
    case "table": {
      const source = path(context.inputs, text(field(step, "source")));
      return Array.isArray(source) ? list(source)
        : Object.entries(record(source)).map(([key, entry]) => ({ key, ...record(entry) }));
    }
    case "map": return from().map((row) => record(each(row, "row")));
    case "flatMap": return from().flatMap((row) => list(each(row, "rows")));
    case "filter": return from().filter((row) => truth(each(row, "where")));
    case "concat": return list(field(step, "from")).flatMap((source) => table(context, text(source)));
    case "join": {
      const index = new Map<string, Json[]>();
      for (const candidate of table(context, text(field(step, "with")))) {
        const key = keyOf(candidate, "right");
        index.set(key, [...(index.get(key) ?? []), candidate]);
      }
      const mode = text(field(step, "mode")), as = text(field(step, "as"));
      if (mode !== "one" && mode !== "all" && mode !== "first") return fail(`${name}: unknown join mode ${mode}.`);
      return from().map((row) => {
        const key = keyOf(row, "left");
        const matches = index.get(key) ?? [];
        if (mode === "one" && matches.length === 0) return fail(`${name}: no match for ${key}.`);
        return { ...record(row), [as]: mode === "all" ? matches : matches[0] ?? null };
      });
    }
    case "decode": {
      const alphabet = table(context, text(field(step, "alphabet"))).map(record);
      const cache = new Map<string, readonly Row[]>();
      return from().flatMap((row) => {
        const readings = decode(text(each(row, "cells")), alphabet, cache);
        if (readings.length === 0) return fail(`${name}: no reading for ${JSON.stringify(row)}.`);
        return readings.map((reading) => ({ ...record(row), reading }));
      });
    }
    case "group": {
      const groups = new Map<string, { readonly key: Json; readonly values: Map<string, Json[]> }>();
      const collect = Object.keys(record(field(step, "collect")));
      for (const row of from()) {
        const key = each(row, "by");
        const id = JSON.stringify(key);
        const group = groups.get(id) ?? { key, values: new Map<string, Json[]>() };
        for (const column of collect) {
          const expression = field(record(field(step, "collect")), column);
          group.values.set(column, [...(group.values.get(column) ?? []), ...list(evaluate(expression, { row }, context))]);
        }
        groups.set(id, group);
      }
      return [...groups.values()].map(({ key, values }) => ({
        key, ...Object.fromEntries([...values].map(([column, items]) => [column, [...unique(items)].sort(compare)])),
      }));
    }
    case "distinct": {
      // One row per key; two rows with the same key must be identical.
      const seen = new Map<string, Json>();
      for (const row of from()) {
        const key = JSON.stringify(each(row, "by"));
        const prior = seen.get(key);
        if (prior !== undefined && JSON.stringify(prior) !== JSON.stringify(row)) return fail(`${name}: conflicting rows for ${key}.`);
        seen.set(key, row);
      }
      return [...seen.values()];
    }
    case "sort": return [...from()].sort((left, right) => compare(each(left, "by"), each(right, "by")));
    default: return fail(`${name}: unknown pipeline op ${text(field(step, "op"))}.`);
  }
}

/** Check that a decoded value is plain JSON data. */
export function toJson(value: unknown): Json {
  if (value === null || typeof value === "boolean" || typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (Array.isArray(value)) return value.map((entry: unknown) => toJson(entry));
  if (typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, entry]: [string, unknown]) => [key, toJson(entry)]));
  }
  return fail("Pipeline inputs must be JSON data.");
}

/** Run a pipeline over named inputs; returns every output table. */
export function runPipeline(pipeline: Json, inputs: Row): Readonly<Record<string, readonly Json[]>> {
  const spec = record(pipeline);
  const tables = new Map<string, readonly Json[]>();
  const context: Context = { functions: Object.hasOwn(spec, "functions") ? record(field(spec, "functions")) : {}, inputs, tables };
  for (const step of list(field(spec, "steps")).map(record)) {
    const name = text(field(step, "name"));
    if (tables.has(name)) return fail(`Table ${name} is defined twice.`);
    tables.set(name, runStep(step, context));
  }
  return Object.fromEntries(Object.entries(record(field(spec, "outputs"))).map(([key, name]) => [key, table(context, text(name))]));
}

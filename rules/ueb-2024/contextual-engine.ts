/** Guard lowering driven only by contextual-engine.json; no guard kind is named in code. */
import { sourceData } from "./source-manifest.js";

export type ContextualGuardField = string | readonly string[];
export interface ContextualRuleGuard {
  readonly kind: string;
  readonly [field: string]: ContextualGuardField;
}

/** text: one string; words: string list (sorted, NUL-joined); boundary / boundaries: one name / name list as a mask. */
type OperandEncoding = "boundaries" | "boundary" | "text" | "words";
const ENCODINGS: readonly unknown[] = ["boundaries", "boundary", "text", "words"] satisfies readonly OperandEncoding[];
interface GuardSchema {
  readonly opcode: number | { readonly field: string; readonly values: Readonly<Record<string, number>> };
  readonly operands: readonly { readonly field: string; readonly as: OperandEncoding }[];
}
interface EngineSchema {
  readonly boundaries: Readonly<Record<string, number>>;
  readonly guards: Readonly<Record<string, GuardSchema>>;
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isNumber(value: unknown): value is number { return typeof value === "number" && Number.isInteger(value); }
function isNumbers(value: unknown): value is Readonly<Record<string, number>> {
  return isRecord(value) && Object.values(value).every(isNumber);
}
function isGuardSchema(value: unknown): value is GuardSchema {
  if (!isRecord(value) || !Array.isArray(value["operands"])) return false;
  const opcode = value["opcode"];
  return (isNumber(opcode) || (isRecord(opcode) && typeof opcode["field"] === "string" && isNumbers(opcode["values"]))) &&
    value["operands"].every((operand: unknown) => isRecord(operand) && typeof operand["field"] === "string" &&
      ENCODINGS.includes(operand["as"]));
}
function isGuardSchemas(value: unknown): value is Readonly<Record<string, GuardSchema>> {
  return isRecord(value) && Object.values(value).every(isGuardSchema);
}
function isStrings(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((item: unknown) => typeof item === "string");
}
function readEngineSchema(value: unknown): EngineSchema {
  if (!isRecord(value)) throw new Error("Malformed contextual engine schema.");
  const { boundaries, guards } = value;
  if (!isNumbers(boundaries) || !isGuardSchemas(guards)) throw new Error("Malformed contextual engine schema.");
  return { boundaries, guards };
}

export const CONTEXTUAL_ENGINE: EngineSchema = readEngineSchema(sourceData("engine"));

function schemaFor(kind: string): GuardSchema {
  const schema = CONTEXTUAL_ENGINE.guards[kind];
  if (schema === undefined || !Object.hasOwn(CONTEXTUAL_ENGINE.guards, kind)) throw new Error(`Unknown guard kind: ${kind}`);
  return schema;
}
function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
function strings(value: ContextualGuardField | undefined): readonly string[] {
  if (value === undefined || typeof value === "string") throw new Error("Contextual guard field must be a list.");
  return value;
}
function text(value: ContextualGuardField | undefined): string {
  if (typeof value !== "string") throw new Error("Contextual guard field must be text.");
  return value;
}

export function guardText(guard: ContextualRuleGuard, field: string): string { return text(guard[field]); }
export function guardWords(guard: ContextualRuleGuard, field: string): readonly string[] { return strings(guard[field]); }

export function guardOpcode(guard: ContextualRuleGuard): number {
  const { opcode } = schemaFor(guard.kind);
  if (typeof opcode === "number") return opcode;
  const selected = opcode.values[text(guard[opcode.field])];
  if (selected === undefined) throw new Error(`Unknown ${opcode.field} for ${guard.kind}.`);
  return selected;
}

/** Each operand lowered once: text as itself, word lists sorted and NUL-joined, boundaries as a mask. */
export function guardOperands(guard: ContextualRuleGuard): readonly (number | string)[] {
  return schemaFor(guard.kind).operands.map(({ field, as }) => {
    const value = guard[field];
    if (as === "text") return text(value);
    if (as === "words") return [...strings(value)].sort(compareText).join("\u0000");
    let mask = 0;
    for (const boundary of as === "boundary" ? [text(value)] : strings(value)) {
      const bit = CONTEXTUAL_ENGINE.boundaries[boundary];
      if (bit === undefined || !Object.hasOwn(CONTEXTUAL_ENGINE.boundaries, boundary)) throw new Error(`Unknown boundary: ${boundary}`);
      mask |= bit;
    }
    if (mask === 0) throw new Error("A contextual boundary guard must name at least one boundary.");
    return mask;
  });
}

export function guardStringOperands(guard: ContextualRuleGuard): readonly string[] {
  return guardOperands(guard).filter((operand): operand is string => typeof operand === "string");
}

/** A guard is exactly its kind, its opcode selector and its declared operand fields. */
export function readGuard(value: unknown): ContextualRuleGuard {
  if (!isRecord(value) || typeof value["kind"] !== "string") throw new Error("Malformed contextual guard.");
  const schema = schemaFor(value["kind"]);
  const fields = [...schema.operands.map(operand => operand.field),
    ...(typeof schema.opcode === "number" ? [] : [schema.opcode.field])];
  const guard: { kind: string; [field: string]: ContextualGuardField } = { kind: value["kind"] };
  for (const field of fields) {
    const entry = value[field];
    if (typeof entry === "string") guard[field] = entry;
    else if (isStrings(entry)) guard[field] = [...entry];
    else throw new Error(`Malformed contextual guard field ${field}.`);
  }
  if (Object.keys(value).length !== fields.length + 1) throw new Error(`Unexpected field in ${value["kind"]} guard.`);
  guardOperands(guard);
  guardOpcode(guard);
  return guard;
}

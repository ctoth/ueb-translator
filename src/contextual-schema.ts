import { CONTEXTUAL_ENGINE } from "./generated/contextual-engine.ts";
import type { ContextualGuardTuple } from "./contextual-transducer.js";

type Engine = typeof CONTEXTUAL_ENGINE;
type ContextualGuardSchema = Engine["guards"][number];

export type ContextualGuardOpcode = ContextualGuardSchema[0];
export type ContextualGuardOperandKind = ContextualGuardSchema[1];
export type ContextualGuardOpcodeWith<
  OperandKind extends ContextualGuardOperandKind,
> = Extract<ContextualGuardSchema, readonly [number, OperandKind]>[0];

export const CONTEXTUAL_GUARDS: readonly ContextualGuardSchema[] = CONTEXTUAL_ENGINE.guards;
export const CONTEXTUAL_BOUNDARY_BITS: Engine["boundaries"] = CONTEXTUAL_ENGINE.boundaries;
export type ContextualBoundaryKind = keyof Engine["boundaries"];
export const CONTEXTUAL_BOUNDARY_MASKS: Engine["boundaryMasks"] = CONTEXTUAL_ENGINE.boundaryMasks;
export type ContextualBoundaryMask = Engine["boundaryMasks"][number];
export const CONTEXTUAL_PRECEDENCES: Engine["precedences"] = CONTEXTUAL_ENGINE.precedences;
export type ContextualPrecedence = Engine["precedences"][number];

function hasShape<Kind extends ContextualGuardOperandKind>(
  opcode: unknown,
  kind: Kind,
): opcode is ContextualGuardOpcodeWith<Kind> {
  return CONTEXTUAL_GUARDS.some(([candidate, shape]) => candidate === opcode && shape === kind);
}
function isIndex(value: unknown, count: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value < count;
}
export function isContextualBoundaryMask(value: unknown): value is ContextualBoundaryMask {
  return CONTEXTUAL_BOUNDARY_MASKS.some((mask) => mask === value);
}
export function isContextualPrecedence(value: unknown): value is ContextualPrecedence {
  return CONTEXTUAL_PRECEDENCES.some((precedence) => precedence === value);
}

/** Check one compiled guard against the engine ABI; string operands index a table of the given size. */
export function contextualGuardTuple(guard: readonly unknown[], stringOperandCount: number): ContextualGuardTuple {
  const [opcode, first, second] = guard;
  if (guard.length === 1 && hasShape(opcode, "none")) return [opcode];
  if (guard.length === 2 && hasShape(opcode, "string") && isIndex(first, stringOperandCount)) return [opcode, first];
  if (guard.length === 3 && hasShape(opcode, "two-string") &&
    isIndex(first, stringOperandCount) && isIndex(second, stringOperandCount)) return [opcode, first, second];
  if (guard.length === 2 && hasShape(opcode, "boundary") && isContextualBoundaryMask(first)) return [opcode, first];
  throw new Error("Compiled contextual program has a malformed guard.");
}

/** Fixed-width integers are stored as one UTF-16 code unit at this offset. */
export const CONTEXTUAL_COMPACT_INTEGER_OFFSET: number = CONTEXTUAL_ENGINE.compactIntegers.offset;
/** Largest integer whose fixed-width encoding remains outside UTF-16 surrogate space. */
export const CONTEXTUAL_COMPACT_INTEGER_MAX: number = CONTEXTUAL_ENGINE.compactIntegers.max;

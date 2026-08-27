export const CONTEXTUAL_GUARD_SCHEMA = {
  eligibilityWord: { opcode: 0, operands: "two-string" },
  firstSyllable: { opcode: 1, operands: "none" },
  following: { opcode: 17, operands: "string" },
  followingNotVowelY: { opcode: 2, operands: "string" },
  lowerSignEnoughOrIn: { opcode: 3, operands: "none" },
  notBoundary: { opcode: 4, operands: "boundary" },
  notCrossing: { opcode: 5, operands: "boundary" },
  notWord: { opcode: 6, operands: "two-string" },
  notWordEnding: { opcode: 7, operands: "string" },
  notWordEnd: { opcode: 8, operands: "none" },
  notWordStart: { opcode: 9, operands: "none" },
  notWholeWord: { opcode: 10, operands: "none" },
  previousNot: { opcode: 11, operands: "string" },
  standingAlone: { opcode: 12, operands: "none" },
  wordEnd: { opcode: 13, operands: "none" },
  wordInternal: { opcode: 14, operands: "none" },
  wordStart: { opcode: 15, operands: "none" },
  lowerSignOther: { opcode: 16, operands: "none" },
} as const;

type ContextualGuardSchema =
  (typeof CONTEXTUAL_GUARD_SCHEMA)[keyof typeof CONTEXTUAL_GUARD_SCHEMA];

export type ContextualGuardOpcode = ContextualGuardSchema["opcode"];
export type ContextualGuardOperandKind = ContextualGuardSchema["operands"];
export type ContextualGuardOpcodeWith<
  OperandKind extends ContextualGuardOperandKind,
> = Extract<ContextualGuardSchema, { readonly operands: OperandKind }>["opcode"];

export const CONTEXTUAL_BOUNDARY_MASKS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
  21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31,
] as const;
export type ContextualBoundaryMask = (typeof CONTEXTUAL_BOUNDARY_MASKS)[number];

export const CONTEXTUAL_PRECEDENCES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
export type ContextualPrecedence = (typeof CONTEXTUAL_PRECEDENCES)[number];

/** Largest integer whose fixed-width encoding remains outside UTF-16 surrogate space. */
export const CONTEXTUAL_COMPACT_INTEGER_MAX = 0xd6ff;

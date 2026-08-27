export type ModeId = number;
export type ModeClassId = number;
export type ModeClassMask = number;

export type CompiledModeIndicators = readonly [
  symbol: string,
  word: string,
  passage: string,
  terminator: string,
];

export type CompiledMode = readonly [
  indicators: CompiledModeIndicators,
  memberClass: ModeClassId,
  passageThreshold: number,
  terminatedBy: ModeClassMask,
  continuesThrough: ModeClassMask,
];

export interface ModeProgram {
  readonly modes: readonly CompiledMode[];
}

export type ModeUnit = ModeClassMask;

export interface ModeSpan {
  readonly end: number;
  readonly memberCount: number;
  readonly sequenceCount: number;
}

export interface ModeResolution {
  readonly prefixes: ReadonlyMap<number, string>;
  readonly suffixes: ReadonlyMap<number, string>;
}

export type ModeIndicatorKind = "passage" | "symbol" | "terminator" | "word";

function classBit(classId: ModeClassId): number {
  return 2 ** classId;
}

function modeAt(program: ModeProgram, modeId: ModeId): CompiledMode {
  const mode = program.modes[modeId];
  if (mode === undefined) {
    throw new Error(`Compiled mode program has no mode ${String(modeId)}.`);
  }
  return mode;
}

export function hasModeClass(unit: ModeUnit, classId: ModeClassId): boolean {
  return (unit & classBit(classId)) !== 0;
}

export function isModeMember(
  program: ModeProgram,
  modeId: ModeId,
  unit: ModeUnit,
): boolean {
  return hasModeClass(unit, modeAt(program, modeId)[1]);
}

export function continuesMode(
  program: ModeProgram,
  modeId: ModeId,
  unit: ModeUnit,
): boolean {
  return (unit & modeAt(program, modeId)[4]) !== 0;
}

export function terminatesMode(
  program: ModeProgram,
  modeId: ModeId,
  unit: ModeUnit,
): boolean {
  return (unit & modeAt(program, modeId)[3]) !== 0;
}

function sequenceEnd(
  program: ModeProgram,
  modeId: ModeId,
  units: readonly ModeUnit[],
  start: number,
  sequenceBoundaryClass: ModeClassId,
): { readonly end: number; readonly memberCount: number } | undefined {
  let end = start;
  let memberCount = 0;
  while (end < units.length) {
    const unit = units[end];
    if (unit === undefined || hasModeClass(unit, sequenceBoundaryClass)) {
      break;
    }
    if (terminatesMode(program, modeId, unit)) {
      return undefined;
    }
    if (isModeMember(program, modeId, unit)) {
      memberCount += 1;
    }
    end += 1;
  }
  return memberCount === 0 ? undefined : { end, memberCount };
}

/** Scan consecutive sequences using only numeric classes and compiled masks. */
export function scanModeSpan(
  program: ModeProgram,
  modeId: ModeId,
  units: readonly ModeUnit[],
  start: number,
  sequenceBoundaryClass: ModeClassId,
): ModeSpan | undefined {
  const initial = units[start];
  if (initial === undefined || !isModeMember(program, modeId, initial)) {
    return undefined;
  }
  const first = sequenceEnd(program, modeId, units, start, sequenceBoundaryClass);
  if (first === undefined) {
    return undefined;
  }
  let end = first.end;
  let memberCount = first.memberCount;
  let sequenceCount = 1;
  while (end < units.length) {
    const following = sequenceEnd(
      program,
      modeId,
      units,
      end + 1,
      sequenceBoundaryClass,
    );
    if (following === undefined) {
      break;
    }
    end = following.end;
    memberCount += following.memberCount;
    sequenceCount += 1;
  }
  return { end, memberCount, sequenceCount };
}

export function indicatorKind(
  program: ModeProgram,
  modeId: ModeId,
  memberCount: number,
  sequenceCount: number,
): "passage" | "symbol" | "word" {
  if (sequenceCount >= modeAt(program, modeId)[2]) {
    return "passage";
  }
  return memberCount === 1 ? "symbol" : "word";
}

export function modeIndicator(
  program: ModeProgram,
  modeId: ModeId,
  kind: ModeIndicatorKind,
): string {
  const indicators = modeAt(program, modeId)[0];
  switch (kind) {
    case "symbol": return indicators[0];
    case "word": return indicators[1];
    case "passage": return indicators[2];
    case "terminator": return indicators[3];
  }
}

function wordSpan(
  program: ModeProgram,
  modeId: ModeId,
  units: readonly ModeUnit[],
  start: number,
  sequenceBoundaryClass: ModeClassId,
): { readonly end: number; readonly memberCount: number } | undefined {
  const initial = units[start];
  if (initial === undefined || !isModeMember(program, modeId, initial)) {
    return undefined;
  }
  let end = start;
  let memberCount = 0;
  while (end < units.length) {
    const unit = units[end];
    /* v8 ignore next -- end is bounded by units.length. */
    if (unit === undefined) break;
    if (isModeMember(program, modeId, unit)) {
      memberCount += 1;
      end += 1;
      continue;
    }
    if (continuesMode(program, modeId, unit)) {
      end += 1;
      continue;
    }
    if (terminatesMode(program, modeId, unit)) {
      return hasModeClass(unit, sequenceBoundaryClass)
        ? { end, memberCount }
        : undefined;
    }
    break;
  }
  return { end, memberCount };
}

/** Resolve indicator placement for any ordered set of compiled modes. */
export function resolveModes(
  program: ModeProgram,
  modeIds: readonly ModeId[],
  units: readonly ModeUnit[],
  sequenceBoundaryClass: ModeClassId,
): ModeResolution {
  const prefixes = new Map<number, string>();
  const suffixes = new Map<number, string>();
  const append = (target: Map<number, string>, index: number, value: string): void => {
    target.set(index, (target.get(index) ?? "") + value);
  };
  let presentClasses = 0;
  for (const unit of units) presentClasses |= unit;
  for (const modeId of modeIds) {
    if (!isModeMember(program, modeId, presentClasses)) {
      continue;
    }
    let index = 0;
    while (index < units.length) {
      const current = units[index];
      if (
        current !== undefined &&
        hasModeClass(current, sequenceBoundaryClass)
      ) {
        index += 1;
        continue;
      }
      const previous = units[index - 1];
      const startsInsideSequence = previous !== undefined && (
        isModeMember(program, modeId, previous) ||
        terminatesMode(program, modeId, previous) ||
        continuesMode(program, modeId, previous)
      );
      if (
        current !== undefined &&
        startsInsideSequence &&
        isModeMember(program, modeId, current)
      ) {
        const symbol = modeIndicator(program, modeId, "symbol");
        const word = modeIndicator(program, modeId, "word");
        const continuing = symbol === word
          ? wordSpan(program, modeId, units, index, sequenceBoundaryClass)
          : undefined;
        append(prefixes, index, symbol);
        index = continuing?.end ?? index + 1;
        continue;
      }
      const passage = scanModeSpan(
        program,
        modeId,
        units,
        index,
        sequenceBoundaryClass,
      );
      if (
        passage !== undefined &&
        indicatorKind(
          program,
          modeId,
          passage.memberCount,
          passage.sequenceCount,
        ) === "passage"
      ) {
        append(prefixes, index, modeIndicator(program, modeId, "passage"));
        const finalIndex = passage.end - 1;
        append(suffixes, finalIndex, modeIndicator(program, modeId, "terminator"));
        index = passage.end;
        continue;
      }
      const word = wordSpan(
        program,
        modeId,
        units,
        index,
        sequenceBoundaryClass,
      );
      if (word !== undefined) {
        const kind = indicatorKind(program, modeId, word.memberCount, 1);
        append(prefixes, index, modeIndicator(program, modeId, kind));
        index = word.end;
        continue;
      }
      const unit = units[index];
      if (unit !== undefined && isModeMember(program, modeId, unit)) {
        append(prefixes, index, modeIndicator(program, modeId, "symbol"));
      }
      index += 1;
    }
  }
  return { prefixes, suffixes };
}

/** Report active state before each unit using the same compiled transitions. */
export function activeModeBefore(
  program: ModeProgram,
  modeId: ModeId,
  units: readonly ModeUnit[],
): readonly boolean[] {
  const activeBefore: boolean[] = [];
  let active = false;
  for (const unit of units) {
    activeBefore.push(active);
    if (isModeMember(program, modeId, unit)) {
      active = true;
    } else if (!active || !continuesMode(program, modeId, unit)) {
      active = false;
    }
  }
  return activeBefore;
}

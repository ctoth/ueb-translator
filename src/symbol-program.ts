export type SymbolClass =
  | "digit"
  | "letter"
  | "modifier"
  | "symbol";

export interface CompiledSymbol {
  readonly braille: string;
  readonly kind: SymbolClass;
  readonly numericDigit: string | null;
  readonly print: string;
  readonly uppercasePrint: string | null;
}

export interface SymbolProgram {
  readonly symbols: readonly CompiledSymbol[];
}

export interface SymbolRuntime {
  readonly digits: ReadonlyMap<string, CompiledSymbol>;
  readonly letters: ReadonlyMap<string, CompiledSymbol>;
  readonly modifiers: ReadonlyMap<string, CompiledSymbol>;
  readonly symbols: ReadonlyMap<string, CompiledSymbol>;
}

/** Build deterministic print lookups from the generated symbol program. */
export function loadSymbolProgram(program: SymbolProgram): SymbolRuntime {
  const digits = new Map<string, CompiledSymbol>();
  const letters = new Map<string, CompiledSymbol>();
  const modifiers = new Map<string, CompiledSymbol>();
  const symbols = new Map<string, CompiledSymbol>();
  for (const entry of program.symbols) {
    switch (entry.kind) {
      case "digit":
        digits.set(entry.print, entry);
        break;
      case "letter":
        letters.set(entry.print, entry);
        break;
      case "modifier":
        modifiers.set(entry.print, entry);
        break;
      case "symbol":
        symbols.set(entry.print, entry);
        break;
    }
  }
  return { digits, letters, modifiers, symbols };
}

/** The inverse relation is the same generated program, never a copied table. */
export function invertSymbolProgram(
  program: SymbolProgram,
): readonly CompiledSymbol[] {
  return program.symbols;
}

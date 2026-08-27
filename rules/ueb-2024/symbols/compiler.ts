import type { IcebRuleCitation } from "../source.js";
import type {
  CompiledSymbol,
  SymbolClass,
  SymbolProgram,
} from "../../../src/symbol-program.js";

export interface SymbolRuleSource {
  readonly braille: string;
  readonly citation: IcebRuleCitation;
  readonly id: string;
  readonly kind: SymbolClass;
  readonly numericDigit: string | null;
  readonly print: string;
  readonly uppercasePrint: string | null;
}

export type SymbolCompilationErrorCode =
  | "conflicting-print"
  | "conflicting-rule-id"
  | "malformed-rule"
  | "uncited-rule";

export class SymbolCompilationError extends Error {
  public readonly code: SymbolCompilationErrorCode;
  public override readonly name = "SymbolCompilationError";
  public readonly ruleIds: readonly string[];

  public constructor(
    code: SymbolCompilationErrorCode,
    ruleIds: readonly string[],
    message: string,
  ) {
    super(message);
    this.code = code;
    this.ruleIds = ruleIds;
  }
}

export interface SymbolCompilationResult {
  readonly provenance: readonly SymbolRuleSource[];
  readonly runtime: SymbolProgram;
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : 1;
}

function cited(rule: SymbolRuleSource): boolean {
  return rule.citation.locator.trim().length > 0 &&
    rule.citation.url.startsWith("https://iceb.org/");
}

function compiled(rule: SymbolRuleSource): CompiledSymbol {
  return {
    braille: rule.braille,
    kind: rule.kind,
    numericDigit: rule.numericDigit,
    print: rule.print,
    uppercasePrint: rule.uppercasePrint,
  };
}

/** Compile cited one-scalar symbol sources into a deterministic runtime table. */
export function compileSymbols(
  sourceRules: readonly SymbolRuleSource[],
): SymbolCompilationResult {
  const ids = new Map<string, string>();
  const prints = new Map<string, string>();
  for (const rule of sourceRules) {
    if (
      Array.from(rule.print).length !== 1 ||
      rule.braille.length === 0 ||
      !/^[\u2800-\u28ff]+$/u.test(rule.braille)
    ) {
      throw new SymbolCompilationError(
        "malformed-rule",
        [rule.id],
        `Symbol rule ${rule.id} has malformed print or braille data.`,
      );
    }
    const priorId = ids.get(rule.id);
    if (priorId !== undefined) {
      throw new SymbolCompilationError(
        "conflicting-rule-id",
        [priorId, rule.id],
        `Symbol rule id ${rule.id} is not unique.`,
      );
    }
    ids.set(rule.id, rule.id);
    const priorPrint = prints.get(rule.print);
    if (priorPrint !== undefined) {
      throw new SymbolCompilationError(
        "conflicting-print",
        [priorPrint, rule.id].sort(compareText),
        `Print scalar ${JSON.stringify(rule.print)} has multiple symbol rules.`,
      );
    }
    prints.set(rule.print, rule.id);
    if (!cited(rule)) {
      throw new SymbolCompilationError(
        "uncited-rule",
        [rule.id],
        `Symbol rule ${rule.id} lacks an official ICEB citation.`,
      );
    }
  }
  const provenance = [...sourceRules].sort((left, right) =>
    compareText(left.print, right.print)
  );
  return {
    provenance,
    runtime: { symbols: provenance.map(compiled) },
  };
}

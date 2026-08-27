import { citeIceb, type Grade1RuleLocator } from "../source.js";
import type { SymbolClass } from "../../../src/symbol-program.js";
import type { SymbolRuleSource } from "./compiler.js";

function source(
  locator: Grade1RuleLocator,
  id: string,
  print: string,
  braille: string,
  kind: SymbolClass,
  uppercasePrint: string | null = null,
  numericDigit: string | null = null,
): SymbolRuleSource {
  return {
    braille,
    citation: citeIceb(locator),
    id,
    kind,
    numericDigit,
    print,
    uppercasePrint,
  };
}

function scalarHex(print: string): string {
  return print.charCodeAt(0).toString(16);
}

const LATIN = [
  ["a", "⠁"], ["b", "⠃"], ["c", "⠉"], ["d", "⠙"], ["e", "⠑"],
  ["f", "⠋"], ["g", "⠛"], ["h", "⠓"], ["i", "⠊"], ["j", "⠚"],
  ["k", "⠅"], ["l", "⠇"], ["m", "⠍"], ["n", "⠝"], ["o", "⠕"],
  ["p", "⠏"], ["q", "⠟"], ["r", "⠗"], ["s", "⠎"], ["t", "⠞"],
  ["u", "⠥"], ["v", "⠧"], ["w", "⠺"], ["x", "⠭"], ["y", "⠽"],
  ["z", "⠵"],
] satisfies readonly (readonly [string, string])[];

const MODIFIERS = [
  ["\u0338", "⠈⠡"], ["\u0335", "⠈⠒"], ["\u0336", "⠈⠒"],
  ["\u0306", "⠈⠬"], ["\u0304", "⠈⠤"], ["\u0327", "⠘⠯"],
  ["\u0300", "⠘⠡"], ["\u0302", "⠘⠩"], ["\u030a", "⠘⠫"],
  ["\u0303", "⠘⠻"], ["\u0308", "⠘⠒"], ["\u0301", "⠘⠌"],
  ["\u030c", "⠘⠬"],
] satisfies readonly (readonly [string, string])[];

const GREEK = [
  ["α", "⠨⠁"], ["β", "⠨⠃"], ["γ", "⠨⠛"], ["δ", "⠨⠙"],
  ["ε", "⠨⠑"], ["ζ", "⠨⠵"], ["η", "⠨⠒"], ["θ", "⠨⠹"],
  ["ι", "⠨⠊"], ["κ", "⠨⠅"], ["λ", "⠨⠇"], ["μ", "⠨⠍"],
  ["ν", "⠨⠝"], ["ξ", "⠨⠭"], ["ο", "⠨⠕"], ["π", "⠨⠏"],
  ["ρ", "⠨⠗"], ["σ", "⠨⠎"], ["ς", "⠨⠎"], ["τ", "⠨⠞"],
  ["υ", "⠨⠥"], ["φ", "⠨⠋"], ["χ", "⠨⠯"], ["ψ", "⠨⠽"],
  ["ω", "⠨⠺"],
] satisfies readonly (readonly [string, string])[];

const GENERAL_SYMBOLS = [
  [",", "⠂"], [";", "⠆"], [":", "⠒"], [".", "⠲"],
  ["!", "⠖"], ["?", "⠦"], ["…", "⠲⠲⠲"],
  ["“", "⠦"], ["”", "⠴"], ["‘", "⠠⠦"], ["’", "⠠⠴"],
  ["\"", "⠠⠶"], ["'", "⠄"], ["«", "⠸⠦"], ["»", "⠸⠴"],
  ["(", "⠐⠣"], [")", "⠐⠜"], ["[", "⠨⠣"], ["]", "⠨⠜"],
  ["{", "⠸⠣"], ["}", "⠸⠜"], ["⟨", "⠈⠣"], ["⟩", "⠈⠜"],
  ["/", "⠸⠌"], ["\\", "⠸⠡"], ["-", "⠤"], ["–", "⠠⠤"],
  ["—", "⠐⠠⠤"], ["_", "⠨⠤"], ["&", "⠈⠯"], ["@", "⠈⠁"],
  ["#", "⠸⠹"], ["$", "⠈⠎"], ["%", "⠨⠴"], ["+", "⠐⠖"],
  ["=", "⠐⠶"], ["×", "⠐⠦"], ["*", "⠐⠔"], ["÷", "⠐⠌"],
  ["−", "⠐⠤"], ["∷", "⠒⠒"], ["′", "⠶"], ["″", "⠶⠶"],
  ["〃", "⠐⠂"], ["<", "⠈⠣"], [">", "⠈⠜"], ["→", "⠳⠕"],
  ["↓", "⠳⠩"], ["←", "⠳⠪"], ["↑", "⠳⠬"], ["^", "⠈⠢"],
  ["↖", "⠳⠱"], ["↗", "⠳⠎"], ["↙", "⠳⠜"], ["↘", "⠳⠣"],
  ["~", "⠈⠔"], ["`", "⠨⠡"], ["©", "⠘⠉"], ["®", "⠘⠗"], ["™", "⠘⠞"],
  ["°", "⠘⠚"], ["¶", "⠘⠏"], ["§", "⠘⠎"], ["¢", "⠈⠉"],
  ["€", "⠈⠑"], ["₣", "⠈⠋"], ["£", "⠈⠇"], ["₦", "⠈⠝"],
  ["¥", "⠈⠽"], ["•", "⠸⠲"], ["✓", "⠈⠩"], ["♮", "⠼⠡"],
  ["♭", "⠼⠣"], ["♯", "⠼⠩"], ["†", "⠈⠠⠦"], ["‡", "⠈⠠⠻"],
  ["♀", "⠘⠭"], ["♂", "⠘⠽"],
] satisfies readonly (readonly [string, string])[];

const latin = LATIN.map(([print, braille]) => source(
  "4.1.1",
  `UEB-4.1-letter-${print}`,
  print,
  braille,
  "letter",
  print.toUpperCase(),
));

const digits = LATIN.slice(0, 10).map(([, braille], index) => {
  const print = index === 9 ? "0" : String(index + 1);
  return source(
    "6.1.1",
    `UEB-6.1.1-digit-${print}`,
    print,
    braille,
    "digit",
    null,
    print,
  );
});

const modifiers = MODIFIERS.map(([print, braille]) => source(
  "4.2.1",
  `UEB-4.2.1-modifier-${scalarHex(print)}`,
  print,
  braille,
  "modifier",
));

const greek = GREEK.map(([print, braille]) => source(
  "4.5.1",
  `UEB-4.5.1-greek-${print}`,
  print,
  braille,
  "letter",
  print.toUpperCase(),
));

const special = [
  source("4.4.1", "UEB-4.4.1-eng", "ŋ", "⠘⠝", "letter", "Ŋ"),
  source("4.4.1", "UEB-4.4.1-schwa", "ə", "⠸⠢", "letter", "Ə"),
  source("4.6.1", "UEB-4.6.1-sharp-s", "ß", "⠨⠮", "letter", "ẞ"),
];

const symbols = GENERAL_SYMBOLS.map(([print, braille]) => source(
  `Symbols list: U+${scalarHex(print).toUpperCase().padStart(4, "0")}`,
  `UEB-symbol-${scalarHex(print)}`,
  print,
  braille,
  "symbol",
));

export const SYMBOL_RULES: readonly SymbolRuleSource[] = [
  ...latin,
  ...digits,
  ...modifiers,
  ...greek,
  ...special,
  ...symbols,
  source(
    "Symbols list: U+007C",
    "UEB-symbol-007c-vertical-bar",
    "|",
    "⠸⠳",
    "symbol",
  ),
];

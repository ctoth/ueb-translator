import { citeIceb, type Grade1RuleLocator } from "../source.js";
import type {
  ModeDefinitionSource,
  ModeIndicatorsSource,
  ModeMemberClass,
  ModeRuleName,
  ModeRuleSource,
} from "./compiler.js";

function mode(
  locator: Grade1RuleLocator,
  name: ModeRuleName,
  indicators: ModeIndicatorsSource,
  memberClass: ModeMemberClass,
  passageThreshold: number,
  terminatedBy: readonly ModeMemberClass[],
  continuesThrough: readonly ModeMemberClass[],
): ModeRuleSource {
  const definition: ModeDefinitionSource = {
    continuesThrough,
    indicators,
    memberClass,
    passageThreshold,
    terminatedBy,
  };
  return {
    citation: citeIceb(locator),
    definition,
    id: `UEB-mode-${name}`,
    name,
  };
}

export const MODE_RULES: readonly ModeRuleSource[] = [
  mode(
    "8.3-8.6",
    "capitals",
    { passage: "⠠⠠⠠", symbol: "⠠", terminator: "⠠⠄", word: "⠠⠠" },
    "uppercase-letter",
    3,
    ["lowercase-letter"],
    ["capitals-continuation"],
  ),
  mode(
    "5",
    "grade1",
    { passage: "⠰⠰⠰", symbol: "⠰", terminator: "⠰⠄", word: "⠰⠰" },
    "grade1-required",
    Number.MAX_SAFE_INTEGER,
    ["sequence-boundary"],
    [],
  ),
  mode(
    "6.1-6.5",
    "numeric",
    { passage: "⠼", symbol: "⠼", terminator: "", word: "⠼" },
    "digit",
    Number.MAX_SAFE_INTEGER,
    ["lowercase-letter", "numeric-ambiguous-letter", "sequence-boundary", "uppercase-letter"],
    ["numeric-punctuation"],
  ),
  mode(
    "9.2-9.4",
    "typeform-bold",
    { passage: "⠘⠶", symbol: "⠘⠆", terminator: "⠘⠄", word: "⠘⠂" },
    "typeformed",
    3,
    ["sequence-boundary"],
    [],
  ),
  mode(
    "9.2-9.4",
    "typeform-italic",
    { passage: "⠨⠶", symbol: "⠨⠆", terminator: "⠨⠄", word: "⠨⠂" },
    "typeformed",
    3,
    ["sequence-boundary"],
    [],
  ),
  mode(
    "9.2-9.4",
    "typeform-script",
    { passage: "⠈⠶", symbol: "⠈⠆", terminator: "⠈⠄", word: "⠈⠂" },
    "typeformed",
    3,
    ["sequence-boundary"],
    [],
  ),
  mode(
    "9.2-9.4",
    "typeform-transcriber-defined",
    { passage: "⠈⠼⠶", symbol: "⠈⠼⠆", terminator: "⠈⠼⠄", word: "⠈⠼⠂" },
    "typeformed",
    3,
    ["sequence-boundary"],
    [],
  ),
  mode(
    "9.2-9.4",
    "typeform-underline",
    { passage: "⠸⠶", symbol: "⠸⠆", terminator: "⠸⠄", word: "⠸⠂" },
    "typeformed",
    3,
    ["sequence-boundary"],
    [],
  ),
];

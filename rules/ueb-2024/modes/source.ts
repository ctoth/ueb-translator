import rulesData from "./rules.json" with { type: "json" };
import { readModeRules } from "../rule-json.js";

import type { ModeRuleSource } from "./compiler.js";

export const MODE_RULES: readonly ModeRuleSource[] = readModeRules(rulesData);

import { sourceData } from "../source-manifest.js";
import { readModeRules } from "../rule-json.js";

import type { ModeRuleSource } from "./compiler.js";

export const MODE_RULES: readonly ModeRuleSource[] = readModeRules(sourceData("modes"));

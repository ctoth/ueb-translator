import fc from "fast-check";
import { buildFuzzCase } from "./empirical.js";
import { compareOracleTranslation } from "./differential.js";
import { buildFuzzArbitrary, type FuzzRunConfiguration } from "./fuzz.js";
import type { ExplorationTracker } from "./exploration.js";
import type { OracleTranslation } from "./runner.js";

export async function scanFuzzCases(
  configuration: FuzzRunConfiguration,
  tracker: ExplorationTracker,
  translate: (id: string, text: string) => Promise<OracleTranslation>,
  progress: () => void,
): Promise<void> {
  const result = await fc.check(fc.asyncProperty(buildFuzzArbitrary(), async (input) => {
    const case_ = buildFuzzCase(input);
    const comparison = compareOracleTranslation(case_, await translate(case_.caseId, input));
    tracker.accept(comparison.ok ? undefined : comparison.evidence);
    if (tracker.summary().cases % 10_000 === 0) progress();
    return true;
  }), { ...configuration, endOnFailure: true });
  if (result.failed) throw new Error("Fuzz scan interrupted", { cause: result.errorInstance });
  if (tracker.summary().cases !== configuration.numRuns) throw new Error("Incomplete fuzz scan");
}

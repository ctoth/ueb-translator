import { describe, expect, it } from "vitest";

import { GRADE2_CONTEXTUAL_RULES } from "../../../rules/ueb-2024/program.js";
import { traceGrade2 } from "../../../src/grade2-diagnostics.js";
import {
  buildOracleInventory,
  ORACLE_INVENTORY_MINIMUM_CASES,
} from "../src/inventory.js";

describe("Liblouis differential inventory", () => {
  it("contains at least 1,000 deterministic, uniquely identified cases", () => {
    const first = buildOracleInventory();
    const second = buildOracleInventory();

    expect(first).toEqual(second);
    expect(first.length).toBeGreaterThanOrEqual(ORACLE_INVENTORY_MINIMUM_CASES);
    expect(ORACLE_INVENTORY_MINIMUM_CASES).toBe(1_000);
    expect(new Set(first.map((case_) => case_.caseId)).size).toBe(first.length);
  });

  it("exercises every authored Grade 2 provenance rule in two contexts", () => {
    const inventory = buildOracleInventory();

    for (const rule of GRADE2_CONTEXTUAL_RULES) {
      const cases = inventory.filter(
        (case_) => case_.local.kind === "rule" && case_.local.ruleId === rule.id,
      );
      expect(cases, rule.id).toHaveLength(2);
      for (const case_ of cases) {
        const result = traceGrade2(case_.print);
        expect(result.ok, case_.caseId).toBe(true);
        if (result.ok) {
          expect(
            result.rules.map((applied) => applied.id),
            case_.caseId,
          ).toContain(rule.id);
          expect(case_.localOutput).toBe(result.braille);
        }
      }
    }
  });

  it("retains relevant official-example and mode fixtures as test evidence", () => {
    const inventory = buildOracleInventory();
    expect(inventory).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          local: {
            kind: "test",
            testId: "test/grade2.test.ts:UEB-10.9.1-official-sentence",
          },
          mode: "grade2",
          print: "You should receive your letter tomorrow afternoon.",
        }),
        expect.objectContaining({
          local: {
            kind: "test",
            testId: "test/grade1.test.ts:ICEB-2024-4.1-complete-alphabet",
          },
          mode: "grade1",
          print: "abcdefghijklmnopqrstuvwxyz",
        }),
        expect.objectContaining({
          local: {
            kind: "test",
            testId: "test/technical.test.ts:raw-technical-text",
          },
          mode: "technical",
          print: "3+2=5",
        }),
      ]),
    );
  });
});

import { describe, expect, it } from "vitest";

import { parseEmpiricalLedger } from "../src/empirical-ledger.js";
import { EmpiricalReconciler } from "../src/empirical-reconciliation.js";
import { comparisonEvidenceDigest } from "../src/ledger.js";

const evidence = {
  caseId: "scowl:case",
  input: "ab",
  local: { kind: "test", output: "local", testId: "SCOWL" },
  oracle: {
    engine: "liblouis",
    output: "oracle",
    status: "development oracle",
    tables: ["en-ueb-g2.ctb"],
    version: "3.38.0",
  },
} as const;

const group = {
  id: "grade1",
  verdict: {
    issues: [59],
    kind: "our-bug",
    rationale: "UEB requires a grade-1 indicator.",
    sources: ["https://iceb.org/publications/ueb/"],
  },
} as const;

describe("grouped empirical ledger", () => {
  it("expands one source-backed group into exact per-case verdict evidence", () => {
    expect(parseEmpiricalLedger({
      disagreements: [{ ...evidence, groupId: "grade1" }],
      groups: [group],
      version: 2,
    })).toEqual({
      ledger: {
        disagreements: [{ ...evidence, verdict: group.verdict }],
        version: 2,
      },
      ok: true,
    });
  });

  it("fails closed for an unmatched case or unused verdict group", () => {
    expect(parseEmpiricalLedger({
      disagreements: [{ ...evidence, groupId: "missing" }],
      groups: [group],
      version: 2,
    })).toMatchObject({ ok: false });
    expect(parseEmpiricalLedger({ disagreements: [], groups: [group], version: 2 }))
      .toMatchObject({ ok: false });
  });

  it("rejects malformed issue references in grouped verdicts", () => {
    expect(parseEmpiricalLedger({
      disagreements: [{ ...evidence, groupId: "grade1" }],
      groups: [{ ...group, verdict: { ...group.verdict, issues: [0] } }],
      version: 2,
    })).toMatchObject({ ok: false });
    expect(parseEmpiricalLedger({
      disagreements: [{ ...evidence, groupId: "grade1" }],
      groups: [{ ...group, verdict: { ...group.verdict, references: ["https://example.com"] } }],
      version: 2,
    })).toMatchObject({ ok: false });
  });

  it("reconciles compact digests and detects changed, stale, and new evidence", () => {
    const compact = {
      caseId: evidence.caseId,
      evidenceDigest: comparisonEvidenceDigest(evidence),
      groupId: group.id,
      repro: { input: "ab", localChanged: "local", oracleChanged: "oracle" },
    } as const;
    const parsed = parseEmpiricalLedger({
      disagreements: [compact], groups: [group], version: 2,
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    const comparison = {
      error: { code: "translation-disagreement", message: "different" },
      evidence,
      kind: "disagreement",
      ok: false,
    } as const;
    const matching = new EmpiricalReconciler(parsed.ledger, "scowl:", () => undefined);
    matching.accept(comparison);
    expect(matching.finish()).toMatchObject({ ok: true, stale: [], untriaged: 0 });

    const changedEvidence = {
      ...evidence,
      oracle: { ...evidence.oracle, output: "changed oracle output" },
    };
    const changed = new EmpiricalReconciler(parsed.ledger, "scowl:", () => undefined);
    changed.accept({ ...comparison, evidence: changedEvidence });
    expect(changed.finish()).toMatchObject({ ok: false, untriaged: 1 });
    expect(changed.finish().stale).toHaveLength(1);
  });
});

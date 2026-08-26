import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import type { OracleComparison } from "../src/differential.js";
import {
  parseDisagreementLedger,
  reconcileDisagreements,
} from "../src/ledger.js";

const disagreement = {
  error: {
    code: "translation-disagreement",
    message: "case-1 disagrees; adjudicate against ICEB",
  },
  evidence: {
    caseId: "case-1",
    input: "and",
    local: { kind: "rule", output: "⠯", ruleId: "UEB-10.3-and" },
    oracle: {
      engine: "liblouis",
      output: "⠁⠝⠙",
      status: "non-normative development oracle; ICEB sources decide disagreements",
      tables: ["en-ueb-g2.ctb"],
      version: "3.38.0",
    },
  },
  kind: "disagreement",
  ok: false,
} satisfies OracleComparison;

const ledgerEntry = {
  ...disagreement.evidence,
  verdict: {
    kind: "liblouis-bug",
    rationale: "ICEB Rule 10.3 requires the strong contraction here.",
    sources: ["https://iceb.org/publications/ueb/"],
  },
} as const;

describe("tracked Liblouis disagreement ledger", () => {
  it("accepts only verdict-annotated evidence with official normative sources", () => {
    expect(parseDisagreementLedger({ disagreements: [ledgerEntry], version: 1 }))
      .toEqual({
        ledger: { disagreements: [ledgerEntry], version: 1 },
        ok: true,
      });

    for (const verdict of [
      "our-bug",
      "liblouis-bug",
      "permitted-alternative",
    ] as const) {
      expect(
        parseDisagreementLedger({
          disagreements: [{
            ...ledgerEntry,
            verdict: { ...ledgerEntry.verdict, kind: verdict },
          }],
          version: 1,
        }).ok,
      ).toBe(true);
    }
  });

  it.each([
    [{ disagreements: [], version: 2 }, "version must be 1"],
    [
      { disagreements: [{ ...ledgerEntry, verdict: undefined }], version: 1 },
      "verdict must be an object",
    ],
    [
      {
        disagreements: [{
          ...ledgerEntry,
          verdict: { ...ledgerEntry.verdict, rationale: "" },
        }],
        version: 1,
      },
      "verdict.rationale must be a non-empty string",
    ],
    [
      {
        disagreements: [{
          ...ledgerEntry,
          verdict: { ...ledgerEntry.verdict, sources: ["https://example.com/"] },
        }],
        version: 1,
      },
      "verdict.sources must contain only official ICEB or BANA URLs",
    ],
  ])("rejects an untriaged or non-normative ledger: %s", (value, error) => {
    expect(parseDisagreementLedger(value)).toEqual({ error, ok: false });
  });

  it("fails closed on a new or changed disagreement", () => {
    expect(reconcileDisagreements([disagreement], {
      disagreements: [],
      version: 1,
    })).toEqual({
      ok: false,
      stale: [],
      untriaged: [disagreement.evidence],
    });

    const changed = {
      ...disagreement,
      evidence: {
        ...disagreement.evidence,
        local: { ...disagreement.evidence.local, output: "changed" },
      },
    } satisfies OracleComparison;
    expect(reconcileDisagreements([changed], {
      disagreements: [ledgerEntry],
      version: 1,
    })).toMatchObject({
      ok: false,
      stale: [ledgerEntry],
      untriaged: [changed.evidence],
    });
  });

  it("accepts exactly matching triaged evidence and reports stale entries", () => {
    expect(reconcileDisagreements([disagreement], {
      disagreements: [ledgerEntry],
      version: 1,
    })).toEqual({ ok: true, stale: [], untriaged: [] });

    expect(reconcileDisagreements([], {
      disagreements: [ledgerEntry],
      version: 1,
    })).toEqual({
      ok: false,
      stale: [ledgerEntry],
      untriaged: [],
    });
  });

  it("keeps the repository ledger parseable and fully triaged", () => {
    const source = readFileSync(
      new URL("../disagreements.json", import.meta.url),
      "utf8",
    );
    expect(parseDisagreementLedger(JSON.parse(source))).toMatchObject({
      ok: true,
    });
  });
});

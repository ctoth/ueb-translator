import { readFileSync, writeFileSync } from "node:fs";
import { parseComparisonEvidence, comparisonEvidenceDigest, parseVerdict, type DisagreementVerdict } from "./ledger.js";
import { addLedgerEvidence, regroupLedgerEvidence, supersedeLedgerEvidence } from "./ledger-edits.js";
import { evidenceRepairs, repairDigest, repairAgrees, assertReviewedRepairs } from "./reconciliation-audit.js";
import { parseEmpiricalLedger, isCompactEmpiricalEntry } from "./empirical-ledger.js";
import type { ComparisonEvidence } from "./differential.js";

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("Expected object");
  return Object.fromEntries(Object.entries(value));
}
function evidence(value: unknown): ComparisonEvidence {
  const parsed = parseComparisonEvidence(value);
  if ("ok" in parsed) throw new Error(parsed.error);
  return parsed;
}
function readAudit(path: string): readonly { before: ComparisonEvidence; after: ComparisonEvidence }[] {
  let complete = false;
  const entries: { before: ComparisonEvidence; after: ComparisonEvidence }[] = [];
  for (const line of readFileSync(path, "utf8").trim().split(/\r?\n/u)) {
    const item = record(JSON.parse(line));
    if (item["kind"] === "reconciliation-summary" && item["complete"] === true) {
      complete = true;
      continue;
    }
    if (item["kind"] !== "reconciliation-evidence") throw new Error("Unknown audit record");
    const before = evidence(item["before"]), after = evidence(item["evidence"]);
    if (comparisonEvidenceDigest(before) !== item["previousDigest"]) throw new Error("Audit digest mismatch");
    entries.push({ before, after });
  }
  if (!complete) throw new Error("Incomplete audit");
  return entries;
}
function main(): void {
  const [command, input, ...args] = process.argv.slice(2);
  if (!input) throw new Error("usage: reconcile-review list AUDIT | apply LEDGER AUDIT APPROVALS OUTPUT | fuzz LEDGER RESULT VERDICT OUTPUT | add LEDGER SWEEP VERDICT|- GROUP OUTPUT PREFIX... | supersede LEDGER AUDIT GROUP OUTPUT PREFIX... | regroup LEDGER GROUP OUTPUT PREFIX...");
  if (command === "approve") {
    const [verdictPath, output] = args;
    if (!verdictPath || !output) throw new Error("usage: reconcile-review approve AUDIT REVIEWED_VERDICT OUTPUT");
    const verdict = parseVerdict(JSON.parse(readFileSync(verdictPath, "utf8")));
    if ("ok" in verdict) throw new Error(verdict.error);
    const decisions = new Map<string, unknown>();
    for (const { before, after } of readAudit(input)) {
      for (const repair of evidenceRepairs(before, after)) {
        if (!repairAgrees(repair)) throw new Error(`Unresolved changed token: ${repair.input}`);
        const digest = repairDigest(repair);
        decisions.set(digest, { digest, repair, verdict });
      }
    }
    writeFileSync(output, JSON.stringify([...decisions.values()], null, 2) + "\n", { flag: "wx" });
    console.log(JSON.stringify({ output, reviewedTransitions: decisions.size }));
    return;
  }
  if (command === "list") {
    const repairs = new Map<string, { repair: ReturnType<typeof evidenceRepairs>[number]; count: number }>();
    for (const { before, after } of readAudit(input)) {
      for (const repair of evidenceRepairs(before, after)) {
        const digest = repairDigest(repair), old = repairs.get(digest);
        repairs.set(digest, { repair, count: (old?.count ?? 0) + 1 });
      }
    }
    for (const [digest, entry] of repairs) console.log(JSON.stringify({ digest, ...entry }));
    return;
  }
  const ledgerText = readFileSync(input, "utf8");
  const raw = record(JSON.parse(ledgerText));
  const parsed = parseEmpiricalLedger(raw);
  if (!parsed.ok) throw new Error(parsed.error);
  if (command === "format") {
    const output = args[0];
    if (!output) throw new Error("usage: reconcile-review format LEDGER OUTPUT");
    const reference = args[1];
    const keys = reference === undefined ? Object.keys(raw)
      : Object.keys(record(JSON.parse(readFileSync(reference, "utf8"))));
    if (keys.length !== Object.keys(raw).length || keys.some(key => !(key in raw))) throw new Error("Reference schema differs");
    writeFileSync(output, JSON.stringify(Object.fromEntries(keys.map(key => [key, raw[key]])), null, 2) + "\n", { flag: "wx" });
    return;
  }
  const indent = ledgerText.includes("\n  ") ? 2 : undefined;
  const writeLedger = (output: string, result: Record<string, unknown>): void => {
    writeFileSync(output, JSON.stringify(result, null, indent) + "\n", { flag: "wx" });
  };
  if (command === "add") {
    const [sweepPath, verdictPath, groupId, output, ...prefixes] = args;
    if (!sweepPath || !verdictPath || !groupId || !output || prefixes.length === 0) {
      throw new Error("usage: reconcile-review add LEDGER SWEEP VERDICT|- GROUP OUTPUT DIGEST_PREFIX...");
    }
    const untriaged = readFileSync(sweepPath, "utf8").trim().split(/\r?\n/u)
      .map((line) => record(JSON.parse(line)))
      .filter((item) => item["kind"] === "untriaged-disagreement")
      .map((item) => evidence(item["evidence"]));
    const selected = prefixes.map((prefix) => {
      const matches = untriaged.filter((entry) => comparisonEvidenceDigest(entry).startsWith(prefix));
      const match = matches[0];
      if (matches.length !== 1 || match === undefined) throw new Error(`Prefix ${prefix} must select exactly one untriaged record`);
      return match;
    });
    let verdict: DisagreementVerdict | undefined;
    if (verdictPath !== "-") {
      const parsedVerdict = parseVerdict(JSON.parse(readFileSync(verdictPath, "utf8")));
      if ("ok" in parsedVerdict) throw new Error(parsedVerdict.error);
      verdict = parsedVerdict;
    }
    writeLedger(output, addLedgerEvidence(raw, selected, groupId, verdict));
    console.log(JSON.stringify({ output, added: selected.length, groupId }));
    return;
  }
  if (command === "supersede") {
    const [auditPath, groupId, output, ...prefixes] = args;
    if (!auditPath || !groupId || !output || prefixes.length === 0) {
      throw new Error("usage: reconcile-review supersede LEDGER AUDIT GROUP OUTPUT PREVIOUS_DIGEST_PREFIX...");
    }
    const audited = readAudit(auditPath);
    const selected = prefixes.map((prefix) => {
      const matches = audited.filter(({ before }) => comparisonEvidenceDigest(before).startsWith(prefix));
      const match = matches[0];
      if (matches.length !== 1 || match === undefined) throw new Error(`Prefix ${prefix} must select exactly one audited record`);
      return match;
    });
    writeLedger(output, supersedeLedgerEvidence(raw, selected, groupId));
    console.log(JSON.stringify({ output, superseded: selected.length, groupId }));
    return;
  }
  if (command === "regroup") {
    const [groupId, output, ...prefixes] = args;
    if (!groupId || !output || prefixes.length === 0) {
      throw new Error("usage: reconcile-review regroup LEDGER GROUP OUTPUT DIGEST_PREFIX...");
    }
    const digests = parsed.ledger.disagreements.map((entry) =>
      isCompactEmpiricalEntry(entry) ? entry.evidenceDigest : comparisonEvidenceDigest(entry));
    const selected = prefixes.map((prefix) => {
      const matches = digests.filter((digest) => digest.startsWith(prefix));
      const match = matches[0];
      if (matches.length !== 1 || match === undefined) throw new Error(`Prefix ${prefix} must select exactly one ledger record`);
      return match;
    });
    writeLedger(output, regroupLedgerEvidence(raw, selected, groupId));
    console.log(JSON.stringify({ output, regrouped: selected.length, groupId }));
    return;
  }
  const rawEntries = raw["disagreements"], rawGroups = raw["groups"];
  if (!Array.isArray(rawEntries) || !Array.isArray(rawGroups)) throw new Error("Invalid ledger");
  const entries = rawEntries.map(record);
  const digest = (entry: typeof parsed.ledger.disagreements[number]): string =>
    isCompactEmpiricalEntry(entry) ? entry.evidenceDigest : comparisonEvidenceDigest(entry);
  const originals = new Map(parsed.ledger.disagreements.map((entry, index) => [digest(entry), entries[index]]));
  if (originals.size !== entries.length) throw new Error("Ledger contains duplicate evidence digests");
  const [dataPath, reviewPath, output] = args;
  if (!dataPath || !reviewPath || !output) throw new Error("Missing audit/result, approvals/verdict, or output path");
  let removed = 0;
  if (command === "apply") {
    const approvedRaw: unknown = JSON.parse(readFileSync(reviewPath, "utf8"));
    if (!Array.isArray(approvedRaw)) throw new Error("Expected reviewed repair decisions");
    const approved = new Set(approvedRaw.map((value: unknown) => {
      const decision = record(value), key = decision["digest"];
      const verdict = parseVerdict(decision["verdict"]);
      if (typeof key !== "string" || "ok" in verdict) throw new Error("Each repair needs a digest and normative verdict");
      return key;
    }));
    const seen = new Set<string>();
    for (const { before, after } of readAudit(dataPath)) {
      const oldDigest = comparisonEvidenceDigest(before), old = originals.get(oldDigest);
      if (!old || seen.has(oldDigest)) throw new Error("Missing or repeated original evidence");
      seen.add(oldDigest);
      assertReviewedRepairs(before, after, approved);
      originals.delete(oldDigest);
      if (after.local.output === after.oracle.output) { removed += 1; continue; }
      const newDigest = comparisonEvidenceDigest(after);
      if (originals.has(newDigest)) throw new Error("Reconciliation would collapse source evidence");
      originals.set(newDigest, { ...after, groupId: old["groupId"] });
    }
    if (originals.size !== entries.length - removed) throw new Error("Evidence count changed unexpectedly");
  } else if (command === "fuzz") {
    const source = readFileSync(dataPath, "utf8");
    const selector = args[3];
    const matches = selector === undefined ? [evidence(record(JSON.parse(source))["evidence"])]
      : source.trim().split(/\r?\n/u).map(line => evidence(record(JSON.parse(line))["evidence"]))
        .filter(entry => comparisonEvidenceDigest(entry).startsWith(selector));
    const captured = matches[0];
    if (matches.length !== 1 || captured === undefined) throw new Error("Select exactly one source evidence digest");
    const verdict = parseVerdict(JSON.parse(readFileSync(reviewPath, "utf8")));
    if ("ok" in verdict) throw new Error(verdict.error);
    const key = comparisonEvidenceDigest(captured), groupId = `reviewed-fuzz-${key.slice(0, 16)}`;
    if (originals.has(key)) throw new Error("Evidence already present");
    rawGroups.push({ id: groupId, verdict });
    originals.set(key, { ...captured, groupId });
  } else throw new Error("Unknown command");
  const retained = [...originals.values()];
  const usedGroups = new Set(retained.map(entry => entry?.["groupId"]));
  const result = { ...raw, groups: rawGroups.filter((group: unknown) => usedGroups.has(record(group)["id"])), disagreements: retained };
  const checked = parseEmpiricalLedger(result);
  if (!checked.ok) throw new Error(checked.error);
  writeFileSync(output, JSON.stringify(result, null, ledgerText.includes("\n  ") ? 2 : undefined) + "\n", { flag: "wx" });
  console.log(JSON.stringify({ output, evidence: retained.length, removed }));
}
try { main(); } catch (error: unknown) { console.error(error); process.exitCode = 1; }

import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { comparisonEvidenceDigest } from "./ledger.js";
import { isCompactEmpiricalEntry, parseEmpiricalLedger } from "./empirical-ledger.js";
import {
  buildReview, currentDecisions, parseReviewRecord, resolveDecision, resolveDecisions, resolveGroup, reviewSummary,
  type ReviewIndex, type ReviewDecision,
} from "./review.js";

function readLines(path: string): readonly unknown[] {
  return readFileSync(path, "utf8").split(/\r?\n/u).filter(line => line.trim().length > 0)
    .map((line, index): unknown => {
      try { return JSON.parse(line); }
      catch (error: unknown) { throw new Error(`${path}:${String(index + 1)}: invalid JSON`, { cause: error }); }
    });
}
function readEvidence(paths: readonly string[]): ReviewIndex {
  return buildReview(paths.flatMap(path => readLines(path).flatMap(item => {
    const evidence = parseReviewRecord(item);
    return evidence === undefined ? [] : [evidence];
  })));
}
function readDecisions(root: string, index: ReviewIndex): readonly ReviewDecision[] {
  const path = resolve(root, "decisions.jsonl");
  return existsSync(path) ? readLines(path).map(value => resolveDecision(index, value)) : [];
}
function print(value: unknown): void { console.log(JSON.stringify(value)); }
function usage(): never {
  throw new Error("usage: oracle:review index DIR EVIDENCE.jsonl... | list DIR [TEXT|*] [OFFSET] | show DIR GROUP [OFFSET] | evidence DIR DIGEST | decide DIR DECISIONS.json | report DIR | ledger LEDGER.json TEXT");
}

function main(): void {
  const [command, root, ...arguments_] = process.argv.slice(2);
  if (root === undefined) usage();
  if (command === "ledger") {
    const [query] = arguments_;
    if (query === undefined || arguments_.length !== 1) usage();
    const parsed = parseEmpiricalLedger(JSON.parse(readFileSync(root, "utf8")));
    if (!parsed.ok) throw new Error(parsed.error);
    const matches = parsed.ledger.disagreements.filter(e =>
      (isCompactEmpiricalEntry(e) ? e.repro.input : e.input).toLowerCase().includes(query.toLowerCase()));
    for (const entry of matches.slice(0, 50)) print(entry);
    print({ matches: matches.length, shown: Math.min(50, matches.length) });
    return;
  }
  if (command === "index") {
    if (arguments_.length === 0) usage();
    const index = readEvidence(arguments_);
    mkdirSync(dirname(resolve(root)), { recursive: true });
    mkdirSync(root); // Refuse to overwrite an earlier review and its decisions.
    writeFileSync(resolve(root, "evidence.jsonl"), index.evidence.map(evidence => JSON.stringify({
      evidence, evidenceDigest: comparisonEvidenceDigest(evidence),
    })).join("\n") + "\n");
    writeFileSync(resolve(root, "manifest.json"), JSON.stringify({ inputs: arguments_.map(p => resolve(p)),
      evidence: index.evidence.length, groups: index.groups.length }, null, 2) + "\n");
    print(reviewSummary(index, []));
    return;
  }
  const index = readEvidence([resolve(root, "evidence.jsonl")]);
  const decisions = readDecisions(root, index);
  const current = currentDecisions(decisions);
  if (command === "report") {
    if (arguments_.length > 1 || (arguments_[0] !== undefined && arguments_[0] !== "--decisions")) usage();
    print(reviewSummary(index, decisions));
    if (arguments_[0] === undefined) return;
    const active = new Set(current.values());
    for (const decision of active) print({ groupId: decision.groupId.slice(0, 12),
      input: resolveGroup(index, decision.groupId).input,
      reviewedEvidence: decision.evidenceDigests.filter(digest => current.get(`${decision.groupId}:${digest}`) === decision).length,
      rule: decision.rule, verdict: decision.verdict });
    return;
  }
  if (command === "list") {
    if (arguments_.length > 2) usage();
    const [text = "*", offsetString = "0"] = arguments_;
    if (!/^\d+$/u.test(offsetString)) usage();
    const query = text === "*" ? "" : text.toLowerCase(), offset = Number(offsetString);
    if (!Number.isSafeInteger(offset)) usage();
    const matches = index.groups.filter(g => g.input.toLowerCase().includes(query));
    for (const group of matches.slice(offset, offset + 50)) print({ id: group.id.slice(0, 12),
      alignment: group.alignment, input: group.input.slice(0, 160),
      local: group.local.slice(0, 160), oracle: group.oracle.slice(0, 160),
      occurrences: group.occurrences.length,
      pending: group.occurrences.filter(o => !current.has(`${group.id}:${o.evidenceDigest}`)).length });
    print({ matches: matches.length, offset, nextOffset: offset + 50 < matches.length ? offset + 50 : null });
    return;
  }
  if (command === "evidence") {
    const [digest] = arguments_;
    if (digest === undefined || arguments_.length !== 1) usage();
    const matches = index.evidence.filter(e => comparisonEvidenceDigest(e).startsWith(digest));
    if (matches.length !== 1) throw new Error("Evidence digest must identify exactly one record");
    print(matches[0]);
    return;
  }
  if (command === "show") {
    const [prefix, offsetString = "0"] = arguments_;
    if (prefix === undefined || arguments_.length > 2 || !/^\d+$/u.test(offsetString)) usage();
    const group = resolveGroup(index, prefix), offset = Number(offsetString);
    if (!Number.isSafeInteger(offset)) usage();
    const evidence = new Map(index.evidence.map(e => [comparisonEvidenceDigest(e), e]));
    print({ ...group, occurrences: undefined, totalOccurrences: group.occurrences.length });
    for (const occurrence of group.occurrences.slice(offset, offset + 10)) {
      const entry = evidence.get(occurrence.evidenceDigest);
      if (entry === undefined) throw new Error("Missing source evidence");
      const words = entry.input.trim().split(/\s+/u), position = occurrence.wordIndex;
      print({ ...occurrence, caseId: entry.caseId,
        source: entry.local.kind === "test" ? entry.local.testId : entry.local.ruleId,
        context: position === undefined ? entry.input : words.slice(Math.max(0, position - 8), position + 9).join(" "),
        decision: current.get(`${group.id}:${occurrence.evidenceDigest}`) });
    }
    print({ offset, nextOffset: offset + 10 < group.occurrences.length ? offset + 10 : null });
    return;
  }
  if (command === "decide") {
    const [path] = arguments_;
    if (path === undefined || arguments_.length !== 1) usage();
    const raw: unknown = JSON.parse(readFileSync(path, "utf8"));
    const additions = resolveDecisions(index, raw);
    appendFileSync(resolve(root, "decisions.jsonl"), additions.map(d => JSON.stringify(d)).join("\n") + "\n");
    print(reviewSummary(index, [...decisions, ...additions]));
    return;
  }
  usage();
}

try { main(); }
catch (error: unknown) { console.error(error); process.exitCode = 1; }

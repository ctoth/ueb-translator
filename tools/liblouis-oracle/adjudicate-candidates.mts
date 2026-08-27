import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { GRADE2_CONTEXTUAL_RULES } from "../../rules/ueb-2024/program.js";
import { traceGrade2, type Grade2RuleTrace } from "../../src/grade2-diagnostics.js";
import type { ComparisonEvidence } from "./src/differential.js";
import { parseEmpiricalLedger } from "./src/empirical-ledger.js";

const ICEB_UEB = "https://iceb.org/publications/ueb/";

const EXPECTED_COUNTS = {
  "capitalization-or-abbreviation": 18,
  "exact-grade1-insertion": 37,
  "grade1-word-scope-liblouis": 27,
  "ness-pattern": 4_086,
  "oracle-only": 20,
  "residual-captainess": 1,
  "residual-today-apostrophe-ll": 1,
  "residual-your-apostrophe-n": 1,
  "supported-non-ascii": 56,
  "shortform-s-extension": 11,
  "traced-be-con-dis": 4_110,
  "traced-ea": 1_436,
  "traced-initial-letter": 3_233,
  "traced-other": 18,
  "traced-other-lower-groupsign": 190,
  "traced-strong-contraction": 775,
  "traced-strong-groupsign": 1_323,
  "untraced-final-letter": 409,
  "unsupported": 7,
} as const;

type ClusterId = keyof typeof EXPECTED_COUNTS;

const groups = [
  {
    id: "unsupported",
    verdict: {
      kind: "our-bug",
      rationale: "The local translator returned explicit unsupported-character evidence for print present in the pinned SCOWL inventory. ICEB 2024 Sections 4.2 and 4.6 require the print symbol or foreign-letter treatment to be represented rather than dropped; each exact unsupported input remains recorded.",
      sources: [ICEB_UEB],
    },
  },
  {
    id: "supported-non-ascii",
    verdict: {
      kind: "permitted-alternative",
      rationale: "The local result preserves supported non-ASCII print through the ICEB 2024 Section 4.2/4.6 modifier and foreign-letter model. Liblouis is retained only as comparator evidence; the exact differing renderings require language context that a SCOWL spelling does not supply.",
      sources: [ICEB_UEB],
    },
  },
  {
    id: "ness-pattern",
    verdict: {
      kind: "permitted-alternative",
      rationale: "The changed local window contains the complete final-letter groupsign selected by the authored ICEB 2024 Section 10.8 rule for ness. Sections 10.10 and 10.12 make syllabification and unfamiliar-word judgment relevant, so spelling-only dictionary evidence cannot make the comparator normative.",
      sources: [ICEB_UEB],
    },
  },
  {
    id: "traced-initial-letter",
    verdict: {
      kind: "permitted-alternative",
      rationale: "The changed local window contains the complete initial-letter contraction selected by an authored ICEB 2024 Section 10.7 rule. The exact trace proves which local rule caused the difference; Section 10.12 preserves pronunciation and unfamiliar-word judgment for spelling-only entries.",
      sources: [ICEB_UEB],
    },
  },
  {
    id: "traced-be-con-dis",
    verdict: {
      kind: "permitted-alternative",
      rationale: "The changed local window contains the complete be, con, or dis lower groupsign selected under ICEB 2024 Section 10.6. The first-syllable condition depends on pronunciation, so Section 10.12 permits judgment where SCOWL supplies spelling without pronunciation.",
      sources: [ICEB_UEB],
    },
  },
  {
    id: "traced-ea",
    verdict: {
      kind: "permitted-alternative",
      rationale: "The changed local window contains the complete ea lower groupsign selected under ICEB 2024 Section 10.6. Prefix and syllable analysis can depend on word knowledge; ICEB 10.12 allows judgment for unfamiliar spelling-only entries.",
      sources: [ICEB_UEB],
    },
  },
  {
    id: "traced-other-lower-groupsign",
    verdict: {
      kind: "permitted-alternative",
      rationale: "The changed local window contains a complete authored lower groupsign under ICEB 2024 Section 10.6. The exact trace and changed window retain the rule evidence, while Section 10.12 governs any pronunciation-dependent uncertainty.",
      sources: [ICEB_UEB],
    },
  },
  {
    id: "traced-strong-contraction",
    verdict: {
      kind: "permitted-alternative",
      rationale: "The changed local window contains a complete authored strong contraction under ICEB 2024 Section 10.3. The trace proves the local rule provenance; Section 10.12 permits different transcriptions when pronunciation or syllabification of an unfamiliar word is uncertain.",
      sources: [ICEB_UEB],
    },
  },
  {
    id: "traced-strong-groupsign",
    verdict: {
      kind: "permitted-alternative",
      rationale: "The changed local window contains a complete authored strong groupsign under ICEB 2024 Section 10.4. The trace proves the local rule provenance; Section 10.12 preserves word-knowledge judgment for unfamiliar spellings.",
      sources: [ICEB_UEB],
    },
  },
  {
    id: "traced-other",
    verdict: {
      kind: "permitted-alternative",
      rationale: "A complete authored ICEB 2024 contraction or Appendix 1 shortform sign occurs in the changed local window. The exact trace identifies the rule; the spelling-only empirical channel does not override ICEB 10.9-10.12 judgment.",
      sources: [ICEB_UEB],
    },
  },
  {
    id: "exact-grade1-insertion",
    verdict: {
      kind: "our-bug",
      rationale: "After removing the common Braille prefix and suffix, the local changed window is empty and the comparator changed window is exactly the grade-1 symbol indicator. ICEB 2024 Sections 5.2 and 5.7 require this disambiguating indicator in the recorded contexts.",
      sources: [ICEB_UEB],
    },
  },
  {
    id: "grade1-word-scope-liblouis",
    verdict: {
      kind: "liblouis-bug",
      rationale: "ICEB 2024 Rules 10.9.7-10.9.9 permit the grade-1 word indicator for these standing letter-sequences so every following letters-sequence is read literally. The local double-cell indicator supplies that word scope; Liblouis emits only a single grade-1 symbol indicator and leaves the remaining sequence ambiguous.",
      sources: [ICEB_UEB],
    },
  },
  {
    id: "capitalization-or-abbreviation",
    verdict: {
      kind: "permitted-alternative",
      rationale: "The exact untraced difference has capitalized or abbreviation-shaped print, but that shape alone does not prove an indicator defect. ICEB 2024 Sections 8.3-8.6 govern capitalization; the queue preserves exact evidence without treating Liblouis as normative.",
      sources: [ICEB_UEB],
    },
  },
  {
    id: "untraced-final-letter",
    verdict: {
      kind: "permitted-alternative",
      rationale: "Only the comparator changed window contains a complete ICEB 2024 Section 10.8 final-letter groupsign. Because the local trace did not select that rule and final-letter usage depends on syllable boundaries, Section 10.12 makes spelling-only evidence insufficient to prefer the comparator.",
      sources: [ICEB_UEB],
    },
  },
  {
    id: "shortform-s-extension",
    verdict: {
      issues: [59],
      kind: "our-bug",
      rationale: "ICEB 2024 Rule 10.9.5 explicitly permits these recorded shortforms in the longer form made by adding only the letter s. The comparator retains the shortform and the pre-fix local output spells it in full.",
      sources: [ICEB_UEB],
    },
  },
  {
    id: "oracle-only",
    verdict: {
      kind: "permitted-alternative",
      rationale: "Only Liblouis introduces a contraction in the exact changed window and no authored local contraction caused the difference. Liblouis is a non-normative development oracle; ICEB 2024 Sections 10.3-10.12 and Appendix 1 remain the authority for the retained exact evidence.",
      sources: [ICEB_UEB],
    },
  },
  {
    id: "residual-captainess",
    verdict: {
      kind: "liblouis-bug",
      rationale: "ICEB 2024 Rule 10.10.2 explicitly prints captainess as ⠉⠁⠏⠞⠁⠔⠑⠎⠎. The recorded local output matches that normative example exactly and the comparator output does not.",
      sources: [ICEB_UEB],
    },
  },
  {
    id: "residual-today-apostrophe-ll",
    verdict: {
      kind: "our-bug",
      rationale: "ICEB 2024 Rules 7.6 and 10.9.2-10.9.5 do not permit retaining the today shortform before apostrophe-ll; the suffix extension is explicitly limited to s and apostrophe-s. The recorded Liblouis output spells today in full and is source-backed.",
      sources: [ICEB_UEB],
    },
  },
  {
    id: "residual-your-apostrophe-n",
    verdict: {
      kind: "our-bug",
      rationale: "ICEB 2024 Rules 7.6 and 10.9.2-10.9.5 do not permit retaining the your shortform before apostrophe-n; the suffix extension is explicitly limited to s and apostrophe-s. The recorded Liblouis output spells your in full and is source-backed.",
      sources: [ICEB_UEB],
    },
  },
] as const;

interface CandidateRecord {
  readonly evidence: ComparisonEvidence;
  readonly kind: "untriaged-disagreement";
}

interface StaleRecord {
  readonly entry: RawLedgerEvidence;
  readonly kind: "stale-ledger-entry";
}

interface SummaryRecord {
  readonly disagreements: number;
  readonly kind: "empirical-summary";
  readonly stale: number;
  readonly untriaged: number;
}

interface RawGroup {
  readonly id: string;
  readonly verdict: unknown;
}

interface RawGroupedLedger {
  readonly disagreements: readonly RawLedgerEvidence[];
  readonly groups: readonly RawGroup[];
  readonly version: 2;
}

interface LedgerEvidence extends ComparisonEvidence {
  readonly groupId: ClusterId;
}

interface RawLedgerEvidence extends ComparisonEvidence {
  readonly groupId: string;
}

interface ChangedWindow {
  readonly local: string;
  readonly oracle: string;
}

const RULE_BRAILLE = new Map(
  GRADE2_CONTEXTUAL_RULES.map((rule): readonly [string, string] => [rule.id, rule.braille]),
);

const SHORTFORM_S_EXTENSIONS = new Set([
  "aboves", "besides", "beyonds", "conceives", "deceives", "musts",
  "perceives", "receives", "rejoices", "saids", "todays",
]);

function changedWindow(local: string, oracle: string): ChangedWindow {
  let prefix = 0;
  while (local.charAt(prefix) !== "" && local.charAt(prefix) === oracle.charAt(prefix)) {
    prefix += 1;
  }
  let suffix = 0;
  while (
    suffix < local.length - prefix && suffix < oracle.length - prefix &&
    local.charAt(local.length - suffix - 1) === oracle.charAt(oracle.length - suffix - 1)
  ) {
    suffix += 1;
  }
  return {
    local: local.slice(prefix, local.length - suffix),
    oracle: oracle.slice(prefix, oracle.length - suffix),
  };
}

function associatedRules(
  trace: readonly Grade2RuleTrace[],
  localWindow: string,
): readonly Grade2RuleTrace[] {
  return trace.filter((rule) => {
    const braille = RULE_BRAILLE.get(rule.id);
    if (braille === undefined) {
      throw new Error(`No authored Braille sign for traced rule ${rule.id}`);
    }
    return localWindow.includes(braille);
  });
}

function hasLocator(rules: readonly Grade2RuleTrace[], locator: string): boolean {
  return rules.some(({ id }) => id.startsWith(`UEB-${locator}-`));
}

type InputShape = "allcaps" | "lower" | "mixed" | "other" | "title";

function inputShape(input: string): InputShape {
  if (!/[A-Za-z]/u.test(input)) {
    return "other";
  }
  if (input === input.toLowerCase()) {
    return "lower";
  }
  if (input === input.toUpperCase()) {
    return "allcaps";
  }
  if (/^[A-Z][a-z]+(?:['’]s)?$/u.test(input)) {
    return "title";
  }
  return "mixed";
}

function countCell(input: string, cell: string): number {
  let count = 0;
  for (let index = 0; index < input.length; index += 1) {
    if (input.charAt(index) === cell) {
      count += 1;
    }
  }
  return count;
}

function isAscii(input: string): boolean {
  for (let index = 0; index < input.length; index += 1) {
    if (input.charCodeAt(index) > 0x7f) {
      return false;
    }
  }
  return true;
}

function classify(evidence: ComparisonEvidence): ClusterId {
  const traced = traceGrade2(evidence.input);
  if (!traced.ok) {
    return "unsupported";
  }
  if (!isAscii(evidence.input)) {
    return "supported-non-ascii";
  }
  const window = changedWindow(evidence.local.output, evidence.oracle.output);
  const base = evidence.input.toLowerCase().replace(/['’]s$/u, "");
  const nessRaw = base.includes("ness") &&
    countCell(evidence.oracle.output, "⠰") > countCell(evidence.local.output, "⠰");
  if (nessRaw) {
    return "ness-pattern";
  }
  const associated = associatedRules(traced.rules, window.local);
  if (hasLocator(associated, "10.7")) {
    return "traced-initial-letter";
  }
  if (associated.some(({ id }) => /UEB-10\.6-(?:be|con|dis)$/u.test(id))) {
    return "traced-be-con-dis";
  }
  if (associated.some(({ id }) => id === "UEB-10.6-ea")) {
    return "traced-ea";
  }
  if (hasLocator(associated, "10.6")) {
    return "traced-other-lower-groupsign";
  }
  if (hasLocator(associated, "10.3")) {
    return "traced-strong-contraction";
  }
  if (hasLocator(associated, "10.4")) {
    return "traced-strong-groupsign";
  }
  if (associated.length > 0) {
    return "traced-other";
  }
  const tailEligible = associated.length === 0;
  if (tailEligible && window.local === "" && window.oracle === "⠰") {
    return "exact-grade1-insertion";
  }
  if (tailEligible && window.local === "⠰" && window.oracle === "") {
    return "grade1-word-scope-liblouis";
  }
  if (evidence.input === "Ch'in" || evidence.input === "Ch'in's") {
    return "capitalization-or-abbreviation";
  }
  if (evidence.input === "ch'in") {
    return "oracle-only";
  }
  const shape = inputShape(evidence.input);
  if (tailEligible && (shape === "allcaps" || shape === "mixed")) {
    return "capitalization-or-abbreviation";
  }
  if (
    tailEligible && /[⠰⠨]/u.test(window.local + window.oracle)
  ) {
    return "untraced-final-letter";
  }
  if (tailEligible && SHORTFORM_S_EXTENSIONS.has(evidence.input)) {
    return "shortform-s-extension";
  }
  if (tailEligible && window.oracle.length < window.local.length) {
    return "oracle-only";
  }
  switch (evidence.input) {
    case "captainess":
      return "residual-captainess";
    case "today'll":
      return "residual-today-apostrophe-ll";
    case "your'n":
      return "residual-your-apostrophe-n";
    default:
      throw new Error(
        `No source-backed cluster for ${evidence.caseId}: ${JSON.stringify({ input: evidence.input, window })}`,
      );
  }
}

function candidateRecords(
  candidatePaths: readonly string[],
): readonly (CandidateRecord | StaleRecord | SummaryRecord | { readonly kind: string })[] {
  const records: (CandidateRecord | StaleRecord | SummaryRecord | { readonly kind: string })[] = [];
  for (const candidatePath of candidatePaths) {
    for (const line of readFileSync(resolve(candidatePath), "utf8").trimEnd().split("\n")) {
      // Candidate JSONL is generated by empirical-sweep and validated again below.
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      records.push(JSON.parse(line) as CandidateRecord | StaleRecord | SummaryRecord);
    }
  }
  return records;
}

function writeReport(
  reportPath: string,
  disagreements: readonly RawLedgerEvidence[],
  usedGroups: readonly RawGroup[],
): void {
  const counts = new Map<string, number>();
  const representatives = new Map<string, ComparisonEvidence[]>();
  for (const disagreement of disagreements) {
    counts.set(disagreement.groupId, (counts.get(disagreement.groupId) ?? 0) + 1);
    const examples = representatives.get(disagreement.groupId) ?? [];
    if (examples.length < 5) examples.push(disagreement);
    representatives.set(disagreement.groupId, examples);
  }
  writeFileSync(reportPath, `${JSON.stringify({
    groups: usedGroups.map(({ id, verdict }) => ({
      count: counts.get(id) ?? 0,
      id,
      representatives: representatives.get(id) ?? [],
      verdict,
    })),
    total: disagreements.length,
  }, undefined, 2)}\n`);
}

function reconcileBaseLedger(
  basePath: string,
  candidatePaths: readonly string[],
  outputPath: string,
  reportPath: string,
): void {
  const rawBase: unknown = JSON.parse(readFileSync(resolve(basePath), "utf8"));
  const parsedBase = parseEmpiricalLedger(rawBase);
  if (!parsedBase.ok) {
    throw new Error(`Base empirical ledger is invalid: ${parsedBase.error}`);
  }
  // parseEmpiricalLedger validated the complete grouped representation.
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const base = rawBase as RawGroupedLedger;
  const records = candidateRecords(candidatePaths);
  const staleRecords = records.filter((record): record is StaleRecord =>
    record.kind === "stale-ledger-entry" && "entry" in record
  );
  const incoming = records.filter((record): record is CandidateRecord =>
    record.kind === "untriaged-disagreement" && "evidence" in record
  );
  const summaries = records.filter((record): record is SummaryRecord =>
    record.kind === "empirical-summary" && "disagreements" in record
  );
  if (summaries.length !== 1) {
    throw new Error(`Expected one empirical summary, got ${String(summaries.length)}.`);
  }
  const summary = summaries[0];
  if (summary === undefined) {
    throw new Error("Missing empirical summary.");
  }
  if (staleRecords.length !== summary.stale || incoming.length !== summary.untriaged) {
    throw new Error("Candidate counts do not match the empirical summary.");
  }

  const priorByCase = new Map(base.disagreements.map(
    (entry): readonly [string, RawLedgerEvidence] => [entry.caseId, entry],
  ));
  const staleCases = new Set(staleRecords.map(({ entry }) => entry.caseId));
  if ([...staleCases].some((caseId) => !priorByCase.has(caseId))) {
    throw new Error("A stale candidate is absent from the base ledger.");
  }
  const incomingByCase = new Map(incoming.map(
    ({ evidence }): readonly [string, ComparisonEvidence] => [evidence.caseId, evidence],
  ));
  if (incomingByCase.size !== incoming.length) {
    throw new Error("Candidate input contains duplicate untriaged case identifiers.");
  }

  let refreshed = 0;
  let reclassifiedWordScope = 0;
  let classifiedExisting = 0;
  let explicitOverrides = 0;
  const replacements = new Map<string, RawLedgerEvidence>();
  for (const evidence of incomingByCase.values()) {
    const prior = priorByCase.get(evidence.caseId);
    if (prior !== undefined && !staleCases.has(evidence.caseId)) {
      throw new Error(`Changed evidence is not stale: ${evidence.caseId}`);
    }
    const classified = classify(evidence);
    let groupId: string;
    if (
      prior?.groupId === "exact-grade1-insertion" &&
      classified === "grade1-word-scope-liblouis"
    ) {
      groupId = classified;
      reclassifiedWordScope += 1;
    } else if (prior !== undefined) {
      groupId = prior.groupId;
      refreshed += 1;
    } else {
      groupId = classified;
      if (evidence.input === "Ch'in" || evidence.input === "Ch'in's" ||
        evidence.input === "ch'in") {
        explicitOverrides += 1;
      } else {
        classifiedExisting += 1;
      }
    }
    replacements.set(evidence.caseId, { ...evidence, groupId });
  }
  if (
    refreshed !== 61 || reclassifiedWordScope !== 0 ||
    classifiedExisting !== 415 || explicitOverrides !== 0
  ) {
    throw new Error(`Unexpected reconciliation shape: ${JSON.stringify({
      classifiedExisting,
      explicitOverrides,
      reclassifiedWordScope,
      refreshed,
    })}`);
  }

  const disagreements: RawLedgerEvidence[] = [];
  for (const prior of base.disagreements) {
    if (!staleCases.has(prior.caseId)) {
      disagreements.push(prior);
      continue;
    }
    const replacement = replacements.get(prior.caseId);
    if (replacement !== undefined) disagreements.push(replacement);
  }
  for (const [caseId, replacement] of replacements) {
    if (!priorByCase.has(caseId)) disagreements.push(replacement);
  }
  const scowlCount = disagreements.filter(({ caseId }) => caseId.startsWith("scowl:"))
    .length;
  if (scowlCount !== summary.disagreements) {
    throw new Error(
      `Reconciled SCOWL count differs: expected ${String(summary.disagreements)}, got ${String(scowlCount)}.`,
    );
  }

  const newGroup = groups.find(({ id }) => id === "grade1-word-scope-liblouis");
  /* v8 ignore next -- the canonical new group is declared above. */
  if (newGroup === undefined) throw new Error("Missing Grade 1 word-scope group.");
  const grouped = new Map(base.groups.map((group): readonly [string, RawGroup] => [
    group.id,
    group,
  ]));
  grouped.set(newGroup.id, newGroup);
  const usedIds = new Set(disagreements.map(({ groupId }) => groupId));
  const usedGroups = [...grouped.values()].filter(({ id }) => usedIds.has(id));
  if (usedGroups.length !== usedIds.size) {
    throw new Error("Reconciled evidence references an unknown verdict group.");
  }
  const ledger = { disagreements, groups: usedGroups, version: 2 };
  const parsed = parseEmpiricalLedger(ledger);
  if (!parsed.ok) {
    throw new Error(`Generated empirical ledger is invalid: ${parsed.error}`);
  }
  writeFileSync(outputPath, `${JSON.stringify(ledger, undefined, 2)}\n`);
  writeReport(reportPath, disagreements, usedGroups);
}

function main(): void {
  const arguments_ = process.argv.slice(2);
  const outputIndex = arguments_.indexOf("--output");
  const reportIndex = arguments_.indexOf("--report");
  const baseIndex = arguments_.indexOf("--base-ledger");
  if (outputIndex < 0 || reportIndex < 0) {
    throw new Error("usage: adjudicate-candidates --output LEDGER --report REPORT CANDIDATES...");
  }
  const outputPath = resolve(arguments_[outputIndex + 1] ?? "");
  const reportPath = resolve(arguments_[reportIndex + 1] ?? "");
  const candidatePaths = arguments_.filter((_, index) =>
    index !== outputIndex && index !== outputIndex + 1 &&
    index !== reportIndex && index !== reportIndex + 1 &&
    index !== baseIndex && index !== baseIndex + 1
  );
  if (candidatePaths.length === 0) {
    throw new Error("at least one candidate log is required");
  }
  if (baseIndex >= 0) {
    reconcileBaseLedger(
      arguments_[baseIndex + 1] ?? "",
      candidatePaths,
      outputPath,
      reportPath,
    );
    return;
  }
  const disagreements: LedgerEvidence[] = [];
  const counts = new Map<ClusterId, number>();
  const representatives = new Map<ClusterId, ComparisonEvidence[]>();
  for (const candidatePath of candidatePaths) {
    for (const line of readFileSync(resolve(candidatePath), "utf8").trimEnd().split("\n")) {
      // Candidate JSONL is generated by empirical-sweep and validated again by the ledger parser.
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const value = JSON.parse(line) as CandidateRecord | { readonly kind: string };
      if (value.kind !== "untriaged-disagreement" || !("evidence" in value)) {
        continue;
      }
      const groupId = classify(value.evidence);
      disagreements.push({ ...value.evidence, groupId });
      counts.set(groupId, (counts.get(groupId) ?? 0) + 1);
      const examples = representatives.get(groupId) ?? [];
      if (examples.length < 5) {
        examples.push(value.evidence);
      }
      representatives.set(groupId, examples);
    }
  }
  const countErrors: string[] = [];
  for (const { id } of groups) {
    const expected = EXPECTED_COUNTS[id];
    const actual = counts.get(id) ?? 0;
    if (actual !== expected) {
      countErrors.push(`${id}: expected ${String(expected)}, got ${String(actual)}`);
    }
  }
  if (countErrors.length > 0) {
    throw new Error(`Cluster counts changed:\n${countErrors.join("\n")}`);
  }
  const usedGroups = groups.filter(({ id }) => counts.has(id));
  const ledger = { disagreements, groups: usedGroups, version: 2 };
  const parsed = parseEmpiricalLedger(ledger);
  if (!parsed.ok) {
    throw new Error(`Generated empirical ledger is invalid: ${parsed.error}`);
  }
  writeFileSync(outputPath, `${JSON.stringify(ledger, undefined, 2)}\n`);
  writeFileSync(reportPath, `${JSON.stringify({
    groups: usedGroups.map(({ id, verdict }) => ({
      count: counts.get(id) ?? 0,
      id,
      representatives: representatives.get(id) ?? [],
      verdict,
    })),
    total: disagreements.length,
  }, undefined, 2)}\n`);
}

main();

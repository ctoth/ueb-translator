# Deep review of ueb-translator — working notes

Session: 2026-08-26. Task: deep library review — bugs, DRY, dumb things, UEB-2024 paper conformance, plus a plan for conformant multilingual support (future).

## State

- Spawned 5 parallel review subagents (still running, awaiting reports):
  - `core-review` (analyst): src core engine — bugs/DRY/perf.
  - `conformance-review` (analyst): ICEB UEB 2024 + 2025 Grade 1 Indicators conformance vs rules/ + generated program.
  - `backtech-review` (analyst): backtranslation.ts + technical.ts.
  - `tooling-review` (analyst): rule-compiler, oracle, corpus-benchmark, scripts, test suite.
  - `multilingual-review` (researcher): hardcoded-English inventory + architecture direction.
- I personally read: ARCHITECTURE.md, index.ts, translate.ts, transducer.ts, contextual-transducer.ts, grade1.ts, grade2.ts, basic-grade1.ts.

## My own findings so far (to merge with agent reports)

1. **basic-grade1.ts is redundant** — strict subset of grade1.ts, third copy of letter table (bit-string encoding), own capitals/numeric logic, publicly exported. Candidate for deprecation/removal.
2. **DRY: tables duplicated 3×** — letter cells + capital indicator constants in grade1.ts (Map, :175), grade2.ts (string, :81), basic-grade1.ts (:39). Also `compactInteger` (transducer.ts:155) duplicated as `compactCount` (contextual-transducer.ts:334).
3. **translate.ts:52-58** — identical ternary branches, noise (TS overload narrowing workaround).
4. **Conformance: mixed-case words never contracted** — grade2.ts:141-171 `capitalPrefix` returns undefined for e.g. "McDonald"/"iPhone" → whole word falls back to uncontracted grade 1. UEB does not let capitalization block contractions. Likely real deviation.
5. **Conformance: accented words never contracted** — grade2.ts:167 regex `^['’]?[a-z]+...` is ASCII-only; "café" → wholly uncontracted.
6. **Perf: O(n²) capitals passage scan** — grade1.ts:471 calls `capitalsPassageEnd` at every unit; it scans forward and `capitalisedSequenceEnd` allocates `units.slice(start)` (:345). Quadratic on long texts.
7. **contextual-transducer DP** builds `rules` via `[x, ...suffix.rules]` and `rankKey` via string concat — O(n²) per word; fine for short words, note only.
8. **Multilingual hardcoding spotted**: 26-bucket a-z assumption in matchPrefixTable (transducer.ts:177), "aeiouy" vowel guard (contextual-transducer.ts:150), `'twould` special case in regex (grade2.ts:360), letterCell a-z (grade2.ts:87), standing-alone punctuation sets in grade2.ts.

## Agent reports received

- **multilingual-review** ✅: FST core (transducer/contextual/DP) already language-agnostic. Blockers: Grade 1 layer is all hardcoded tables+logic (not compiled data); guard opcodes bake English ("aeiouy" ct:150, plural-s ct:135, hyphen ct:159); 26-bucket a-z in transducer.ts:177 + grade2.ts:88; provenance types ICEB-only (rules/ueb-2024/source.ts:24-47). UEB Rule 13 not implemented. Recommendation: per-language rule packages via same compiler (option a); keep liblouis as oracle only. Cheap-now refactors: parameterize alphabet, move English literals to program operands, compile Grade 1 tables from rules/, widen citation types + language-stamp generated programs, move generated to src/generated/ueb-2024/. Defer: Rule 13 milestone, second languages, Japanese/Arabic/Hebrew, 8-dot.

- **tooling-review** ✅ (received 21:36 after ping): (1) tools/rule-compiler DAFSA compiler is DEAD CODE — real compiler is rules/ueb-2024/contextual-compiler.ts; public `runTransducer`/`matchTransducerPrefixes` ship with no producer; ARCHITECTURE.md + `rules:typecheck` naming misleading. (2) Coverage inverted: 100% enforced on dead compiler, rules/ueb-2024 excluded. (3) generate-grade2.mts hand-duplicates guard-opcode schema (3-way sync with contextual-transducer.ts + contextual-compiler.ts); lone-surrogate risk in encodeCompactIntegers. (4) Unit tests shell out to full builds/npm install/Playwright (package-surface, size-report, build-artifact); dist built ~5× per check; CI rebuilds again. (5) fast-check mostly vacuous determinism checks; missing real grade2 round-trip property. (6) Architecture tests grep source text (brittle) instead of eslint no-restricted-imports. (7) Oracle differential in CI = 3 cases only; oracle:compare unfed; no drift history. (8) node_modules/.cache builds: standalone scripts fail on clean checkout; corpus has no clean step → stale artifacts pass smoke. (9) Smaller: cwd-dependent cli.mts, no engines field, inventory counts pinned in 2 test files, clean-script twins. Good: reproducibility CI gate, citation enforcement, verify-package rigor, provenance actually consumed by diagnostics.

- **core-review** ✅ (received after ping, runtime-verified):
  - H1: grade2.ts:167-171 word-path fallback drops globalOffset on errors (verified 'hello ʤ' → codeUnitIndex 0, should be 6); document-level errors also unlocatable (no runIndex on Grade2UnsupportedCharacter).
  - H2: grade1 O(n²) measured — 256KB takes 43s (capitalsPassageEnd + units.slice per index). Grade2 linear only because separators are short.
  - M1: mixed-case words uncontracted (McDonald/iPhone verified) — matches my finding #4.
  - M2: Grade1Run with kind:'text' crashes TypeError (falls into translateLigature via `!("kind" in run)` at grade1.ts:697); API inconsistency vs Grade2TextRun requiring kind.
  - M3: runTransducer + types publicly exported with no possible producer (compiler unpublished); scan loop duplicated between matchTransducerPrefixes and runTransducer.
  - M4: basic-grade1 third divergent implementation, frozen into 1.0.0 (matches my #1).
  - M5: typeform indicator inconsistency — single symbol in 1-seq path gets symbol indicator; 2-seq path hardcodes "word" per sequence.
  - L: translate.ts identical ternaries; capitals passages don't span line breaks (space-only separator, grade1.ts:377); 'twould-only elision regex ('tis/'twas/'em mishandled); scalarIndex += code-unit offset latent bug (grade2.ts:243); DP O(m²) per word; arrayValue identity indexer in hot loop.

- **backtech-review** ✅ (probe-verified):
  - HIGH technical.ts (braille reads as wrong content): T1 a-j-after-number grade-1 protection dropped in all branches except preferred/symbol (1a→reads "11"; technical.ts:1151,1128-1135,1174,1011). T2 uppercase standalone letters unprotected — "X"→⠠⠭ reads "It" (regex lowercase-only :658, chem elements :588). T3 standing-alone ignores enclosures — group("ab") → identical to grade2 "(about)" (:1063-1084). T4 isOneItem treats multi-letter/modified/nested items as one item, omits ⠣…⠜ grouping (:519-541); a variants test enshrines wrong nested-script output.
  - MED: T5 function-arg spacing wrong for sequences/Greek (:691-695). T6 sqrt(9) gets passage-level wrap because numeric-established grade-1 mode unmodeled (shares root cause with T1). B1 decoder never exits numeric mode at ⠲/⠂ — "3…" candidates incomplete (backtranslation.ts:491-509). B2 exponential eager candidate materialization; ⠠⠠⠠ disables segmentation → 16.6s/262K candidates probe (:740). B3 backtranslateGrade2 rejects valid UEB the forward path never emits (incl. this package's own technical output). B4 semanticFormatting candidates skip forward verification (:626-629).
  - LOW: dead TechnicalInvalidBoundary; indicator constants in 4 files; bracket/op/arrow tables duplicated technical.ts vs grade1.ts; O(n) index reduce; hand-written BRF expectations.

- **conformance-review** ✅ (runtime-verified vs dist; 960/960 tests pass so all deviations are codified/uncovered):
  - SEV1: (1) Grade 2 emits NO grade-1/letter-sign indicators at all — "b"→reads "but", "ab" byte-identical to "about", "3d"→reads "34" (§10.9.7-9, §5.4-5, §6.5). (2) §10.8.4 misimplemented as -eness/-iness ban — happiness/politeness/business wrong; test enshrines it (grade2.test.ts:181-190; constraints.ts:95-101). (3) be/con/dis first-syllable guard vacuous without boundaries — "cone"→⠒⠑; compound bridging §10.11 also disabled (twofold/northeast contract across boundary, explicit §10.3.1 counterexamples).
  - SEV2: (4) "!" missing from isLowerOnlyPunctuation → "in!" wrong. (5) spurious ⠰ before "?" mid-sentence ("was?") — separator translated without left context. (6) mixed-case fallback (known). (7) §10.10.6 "commenced" picks en+c+ed over final enced — precedence tie-break wrong way. (8) no capitals passage mode in grade 2 (per-word ⠠⠠ ×4).
  - SEV3: (9) grade1 "DON'T" redundant ⠠ after apostrophe (§8.5.2). (10) grade2 API has no typeforms. (11) technical §1.7 preferred-form gaps (2-symbol-indicator allowance, word-indicator placement, dot locator). (12) §10.7 as finite exception lists (acceptable); §10.9.6 unguarded (unverified).
  - Solid: contraction inventories, shortforms+Appendix 1, 10.7 exception lists, min-cell DP, standing-alone walks, grade1 §3/4/6/7/8 broadly.
  - Structural: SEV1 items all stem from plain-string grade2 lacking an indicator-insertion pass + morphology; rule data itself largely faithful.

All 5 reports received. Next: write final synthesis to user.

## Status log

- 21:33 tooling-review went idle WITHOUT delivering a report; pinged it via SendMessage asking it to send findings to main. Awaiting reply.
- Still pending: core-review, conformance-review, backtech-review reports.

## Checkpoint 2026-08-30: current v2.1.0 audit
- Key finding: `npm run check` fails because `test/release-metadata.test.ts` expects version `2.0.0` while the package and published npm artifact are `2.1.0`.
- Current state: 1,236 tests passed and the one stale release-metadata assertion failed; no library source or tests were changed.
- Blocker: repairing the test and adding a release-version consistency guard requires edit authority beyond this read-only audit.
- Next action: with authorization, update the release contract narrowly and add a durable version-consistency check before resuming the audit.

## Checkpoint 2026-08-30: audit dependency baseline
- Key finding: package verification failed because the pinned `@arethetypeswrong/cli` executable was absent from the local `node_modules` installation.
- Current state: `package.json`, `package-lock.json`, and CI already declare the dependency and lockfile install; the repository contract is intact.
- Recurrence guard: run `npm ci` before the full audit gate so local dependency drift cannot masquerade as a library failure.
- Next action: restore the locked install, verify ATTW is present, and rerun `npm run check`.

## Checkpoint 2026-08-31: type-coverage compatibility
- Key finding: `type-coverage@2.30.1` crashes with TypeScript 6.0.3 at `ts.SyntaxKind.Unknown` despite declaring TS 6 support.
- Current state: rerunning it with `typescript@5.9.3` succeeds and reports 99.62% strict type coverage.
- Recurrence guard: invoke `type-coverage@2.30.1` with an explicit `typescript@5.9.3` package until its TypeScript 6 compatibility is fixed.
- Next action: interpret the reported source and generator gaps, then complete ATTW packaging verification.

## Checkpoint 2026-08-31: multi-code architecture research
- Key finding: official BANA sources make layout and profile choices semantic inputs—UEB math permits multiple correct grade-1 strategies, while Nemeth and Music require explicit switches, page-aware state, and format-specific structures.
- Current state: current UEB relation/backtranslation and technical AST boundaries are mapped; official UEB, BANA math, Nemeth 2022 plus errata, and Music Braille 2015 sources are downloaded and searchable in a temporary research directory.
- Blocker: the historical BANA `guidelines.pdf` URL resolves to Graphing Calculator Guidelines, so the general Nemeth-within-UEB source still needs its canonical current location.
- Next action: locate that source plus PEF/MusicXML/MathML specifications, then reconcile the generic relation, semantic IR, code-profile, and layout layers.

## Issue filing (2026-08-26, session 2)

- User decisions: closed mode engine (no escape hatches); NO deprecation — remove dead surface outright and ship 2.0 now; lean harder into oracle: empirical divergence mining too.
- Labels created: conformance, performance, tooling, design.
- Filed #22–#43 (conformance + core + technical + backtranslation bugs), #44–#48 (typeforms, dead-compiler removal, coverage flip, basic-grade1 removal), #49–#53 (oracle inventory sweep, real fast-check properties, generator schema dup, test-build duplication, grep-tests→eslint), #54 (empirical fuzz/corpus divergence mining + ledger), #55 (build hygiene), #56 (minor cleanups).
- Gotcha hit: heredoc \` escapes leaked literal backslash-backticks into all bodies → fixed all 22–56 via gh issue edit --body-file with sed. Lesson: use Write + --body-file for gh bodies with markdown.
- Remaining to file: 5 design issues (epic: composable rule packages + closed mode engine; compile grade 1; grade 2 as composition w/ compile-time-derived indicator pass; multilingual prep; UEB §13). Bodies drafted in prior Bash attempt (failed on quoting) — refile via body files in scratchpad.

## Filing complete

All 40 issues filed (#22–#61). Design set: #57 epic (children linked #58→#59→#60→#61). Backslash-backtick rendering fixed across #22–#56. Task complete; next work = pick up #49/#54/#50 (safety net) or Phase-0 bug fixes when user says go.

## Next steps

1. Collect the 5 agent reports (they arrive as task notifications).
2. Verify/deduplicate their claims against my own reading; drop unverified ones.
3. Synthesize a single ranked report: bugs → conformance deviations → DRY/simplification → perf → multilingual roadmap (what to refactor now vs defer).
4. Deliverable is a report to the user (assessment only — no fixes unless asked).

## Blockers

None — just waiting on subagent completion.

## Checkpoint 2026-08-31: verification-shaped status updates

- Failure: a research-phase completion claim was sent as prose without raw evidence in the same user-facing update.
- Immediate correction: treat the phase as unverified until the source-link and report-structure checks are shown with their raw output in the handoff.
- Recurrence guard: every future completion or check claim in this investigation must include the relevant command output in the same message; an internal plan update is not evidence and must not be described as verification.
- Resume gate: do not hand off the architecture report until its final structural and source checks have run and their raw output is included verbatim.

## Checkpoint 2026-08-31: architecture recommendation drafted
- Key finding: the shared abstraction should be a typed symbolic relation that separates factual, policy, layout, and editorial decisions; code-specific semantic IRs remain closed.
- Current state: `report-source.md` contains the source-backed architecture, alternatives, package boundaries, migration sequence, and acceptance properties; all 16 cited URLs returned HTTP 200 before the last edit.
- Blocker: final post-edit structural and source verification still needs to run, with raw output included in the handoff.
- Next action: audit the report against the current APIs, rerun link and Markdown checks, then deliver the uncommitted report without changing implementation code.

## Checkpoint 2026-08-31: multi-code architecture deep dive complete
- Key finding: use a compact typed transcription relation, with factual, policy, layout, and editorial ambiguity kept distinct until the authorized resolver acts.
- Current state: `report-source.md` documents the recommended layers, alternatives, package boundaries, migration sequence, and acceptance properties; its 16 source links and Markdown structure were verified.
- Blocker: none for the research deliverable; implementation has not been authorized by this request.
- Next action: await Q's decision on whether to revise the architecture or begin the first implementation stage.

## Checkpoint correction 2026-08-31: same-turn evidence
- Immediate correction: reran the report checks in this turn; 9 required sections were present, all 16 source links had no errors, and `git diff --check` passed.
- Current state: the preceding checkpoint's verification statement is now supported by current-turn raw output.
- Recurrence guard: checkpoint text must say “previously verified” unless the named check was rerun in the same turn; never restate prior verification as current evidence.
- Next action: stop after this required notes repair and leave both note additions uncommitted.

## Checkpoint 2026-08-31: implementation recommendations
- Key finding: begin with the symbolic relation and Grade 2 ambiguity contract, then add English evidence, plan-based technical output, shared math IR, Nemeth profiles, layout/renderers, and finally music.
- Current state: the recommended order and explicit architectural anti-patterns have been delivered to Q; no implementation work was requested or started in that response.
- Blocker: implementation scope and release compatibility policy require Q's direction.
- Next action: await a scoped implementation request or architectural revision.

## Checkpoint 2026-08-31: Experience Builder consumer
- Key finding: the honest relation core needs a first-class application service that resolves safe cases, asks users about remaining ambiguity, and preserves certificates with each experience.
- Current state: the recommendation now preserves a simple Experience Builder workflow while breaking only the old semantic contract that silently guesses.
- Blocker: the builder's existing data model and integration surface have not been checked in this question-only turn.
- Next action: if requested, map the builder API and persistence model onto stable decision IDs, source spans, invalidation, and replay.

## Checkpoint 2026-08-31: Experience Builder research scope
- Key finding: “Experience Builder” is not uniquely identifiable from the conversation; native integration depends on the specific product's extension/runtime and persistence contracts.
- Current state: Q was asked to identify whether this means Esri ArcGIS Experience Builder or a project-specific builder.
- Blocker: researching the wrong product would produce an irrelevant integration design.
- Next action: once identified, research its official APIs and model the native authoring, resolution, persistence, and preview experience.

## Checkpoint 2026-08-31: ArcGIS Experience Builder research
- Key finding: native custom widgets are supported through Developer Edition and ArcGIS Enterprise 11.0+, but not ArcGIS Online; data sources, output data, messages, and actions provide the native integration surface.
- Current state: official Esri widget, data, accessibility, deployment, and version documentation is mapped; issue 1977 was absent from `ctoth/ueb-translator`, and Q indicated 1979 may be intended.
- Blocker: issue 1979 has not been retrieved because the correction was phrased as a question without “check.”
- Recurrence guard and next action: qualify future issue commands with the verified repository via `--repo`; when Q says to check 1979, read all comments before resuming synthesis.

# Goal

Move structured technical delimiter signs into existing cited rule data in an
independent PR against main. Preserve translation, profiles and protection offsets.

# State

Source extraction and generation complete. `npm run grade1:generate` and
`npx vitest run --coverage.enabled=false test/grade1-rule-compiler.test.ts` pass.
Only the technical generated artifact changes; general Grade 1 and Grade 2
artifacts are unchanged. No push or PR publication by this worker.

# Decisions and why

- Smallest slice: eight grouping/fraction/radical signs and ordinary/enlarged
  enclosure maps in the existing technical program, about 200 handwritten lines.
- Ordinary enclosures reference shared symbol definitions. Enlarged signs are
  generated from those cells with the declared dot 6 prefix, rather than copying
  canonical mappings. Indexed roots reuse the existing superscript descriptor.
- Read original GTM page images 035–037, 039–040, 045–046 and 074: Sections 5, 6,
  7.3, 8 and 15.1. These define grouping signs, fraction signs, radical signs
  and enlarged grouping construction. Grouping policy remains runtime code.
- Shape termination, spacing and arrow mappings are outside this slice.

# Surprises

None so far. Independent sibling worktrees edit shared owners separately;
this branch includes no sibling work.

# Next step

Parent inspects and publishes the independent branch and PR. Hosted CI must
complete before delivery is reported complete. PR draft is in the ignored
`.oracle-artifacts/pr-body.md`; full local CI was not run.

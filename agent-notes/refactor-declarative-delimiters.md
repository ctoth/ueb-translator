# Goal

Move structured technical delimiter signs into existing cited rule data in an
independent PR against main. Preserve translation, profiles and protection offsets.

# State

Source extraction and generation complete. `npm run grade1:generate` and
`npx vitest run --coverage.enabled=false test/grade1-rule-compiler.test.ts` pass.
Only the technical generated artifact changes; general Grade 1 and Grade 2
artifacts are unchanged. Parent published PR #156. After parent merged #154 and
#155, this worker resolved the in-progress merge of main into this branch,
preserving modifier, shape and delimiter data together. Regeneration and the
edited compiler test file pass on the resolved source. No publication by this
worker.

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

The independent extractions overlap in eight owners. Integration combines all
three fields and validations, retains all three compiler test groups, and keeps
main's deterministic punctuation regression change untouched.

# Next step

Parent inspects and pushes the local merge for PR #156, then waits for its new
hosted checks before merging. Earlier hosted CI and push/PR oracle runs passed
before main integration; they do not cover the new merge yet. No full local CI
was run. Item-grouping policy remains outside this PR.

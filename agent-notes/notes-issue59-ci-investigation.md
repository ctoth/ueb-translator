## Checkpoint 2026-08-27: PR #66 positional-context follow-up
- Key finding: `9975b54` makes `do-it-yourselfer` pass by applying ordinary `do` and `it` rules per dash component, but also admits broad apostrophe-suffix contractions such as `ea` in `Abarbarea's`.
- Current state: the explicit Appendix `yourself` rule already worked at `00c5927`; only the ordinary `do` and `it` components accounted for the two inventory failures.
- Working diagnosis: moving generic guards 2 and 8-15 from full lexical coordinates to dash-component coordinates is semantically too broad.
- Blocker: identify the narrow authorization surface for Appendix-listed hyphen components without changing lower-sign or apostrophe behavior.
- Next action: inspect generated guard metadata and propose a rule-scoped component-position mechanism plus focused validation cases.

## Checkpoint 2026-08-27: `1ffa6a0` residual classification
- Key finding: current SCOWL has 178 untriaged; 118 persist from `1a5e5af`, 60 are newly exposed possessive-s variants, and 198 prior tuples were resolved.
- Current state: the 60 new tuples are contractions in base words extended by apostrophe-s; the remaining set clusters around capitals boundaries, apostrophes, non-ASCII spans, and ambiguity literals.
- Ledger state: the SCOWL sweep uses the compact empirical ledger, not the nine-entry rule inventory ledger initially queried.
- Blocker: map current/stale compact digests to their source-backed group verdicts and count mechanically reusable verdicts.
- Next action: inspect `empirical-disagreements.json` reconciliation and separate code repairs from digest refreshes.

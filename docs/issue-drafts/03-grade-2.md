# Implement complete contracted UEB (grade 2) translation

## Problem

Contracted UEB requires exact context-sensitive contraction rules, including
standing-alone logic, shortforms, and cases where contractions are forbidden.

## Scope

- Implement alphabetic wordsigns, strong and lower groupsigns, initial-letter
  contractions, final-letter groupsigns, shortforms, and standing-alone rules.
- Encode precedence and non-use constraints explicitly with rule provenance.
- Preserve a rule-level diagnostic mode in development builds without adding it
  to the default browser payload.
- Do not learn or infer contraction rules from corpora or Liblouis output.

## Acceptance criteria

- Rule-linked tests cover every contraction and every enumerated non-use rule.
- Appendix 1 shortform wordlists are independently represented with provenance.
- Ambiguous precedence is rejected by the rule compiler.
- Contracted translation is deterministic and separately importable.

## Normative source

- ICEB, *Rules of Unified English Braille*, Third Edition, 2024, especially
  Section 10 and Appendix 1: <https://iceb.org/publications/ueb/>

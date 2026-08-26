---
title: "The Rules of Unified English Braille, Third Edition 2024"
authors: "International Council on English Braille; edited by Matthew Horspool"
year: 2024
cite_key: iceb2024rules
venue: "International Council on English Braille"
doi_url: "https://iceb.org/wp-content/uploads/2025/10/Rules-of-Unified-English-Braille-2024.pdf"
pages: "Section 10, printed pages 113-180 (PDF pages 140-207)"
reading_method: "Every rendered page image in the declared scope inspected"
---

# The Rules of Unified English Braille, Third Edition 2024

> **Ingestion scope:** Only Section 10, “Contractions” (printed pages 113-180; PDF pages 140-207), plus the title page and table of contents, is extracted here. The complete 408-page official rulebook remains in `paper.pdf`; all other sections are intentionally unextracted for this Issue #5 backtranslation study.

## One-Sentence Summary

Section 10 defines the legal contexts and preference relations for UEB contractions, providing the normative constraints needed to invert contracted braille without using frequency, a dictionary, or another translator to choose among print candidates.

## Problem Addressed

Grade 2 cells are not a one-to-one encoding of print: one cell sequence may denote letters, a whole-word contraction, a groupsign within a word, or punctuation, and validity depends on boundaries, modes, neighboring cells, syllables, and pronunciation. The chapter specifies when each contraction class may be used, but it does not make contracted braille uniquely invertible in every context.

## Key Contributions

- Defines each contraction class and its print expansion, then constrains use by standing-alone status, word position, syllable position, punctuation, indicators, capitalization, pronunciation, and preference. *(pp.113-180)*
- Makes ambiguity structural rather than heuristic: the same braille sign may remain compatible with several print strings unless surrounding UEB rules eliminate candidates. *(pp.113-128)*
- Supplies positive and “But” examples that function as normative boundary fixtures for a forward translator and as candidate-validity fixtures for an inverse. *(pp.114-128)*

## Methodology

Normative rulebook chapter. Rules are numbered, followed by permitted and forbidden examples. For backtranslation, each contraction expansion is treated as an inverse transition and each numbered rule as a predicate over its local lexical and braille context.

## Methods & Implementation Details

### 10.1 Alphabetic wordsigns

- The single letters `b c d e f g h j k l m n p q r s t u v w x y z` may represent the words **but, can, do, every, from, go, have, just, knowledge, like, more, not, people, quite, rather, so, that, us, very, it, you, as, will** respectively, but only when the represented word is standing alone. This immediately makes an isolated cell such as `b` compatible with both a letter interpretation and the word “but” unless grade/mode and surrounding syntax determine one. *(p.113, rule 10.1.1)*
- Standing-alone wordsigns are allowed next to punctuation and indicators in the examples, but not as substrings of ordinary words; hyphenated compounds and letter sequences therefore create distinct inverse candidate boundaries. *(pp.113-115)*
- An alphabetic wordsign remains usable before apostrophe suffixes `d`, `ll`, `re`, `s`, `t`, or `ve` when the resulting form is standing alone. Other apostrophe continuations do not receive that permission. *(p.115, rule 10.1.2)*
- Preferably do not use a wordsign where the letters are pronounced separately as an acronym or abbreviation; the rule explicitly depends on text or a standard dictionary, so a default backtranslator cannot use it to select one candidate without caller-supplied lexical policy. *(p.116, rule 10.1.3)*
- Do not use an alphabetic wordsign for one displayed syllable of a syllabified word. *(p.116, rule 10.1.4)*

### 10.2 Strong wordsigns

- `child`, `shall`, `this`, `which`, `out`, and `still` have strong wordsigns used only when the word is standing alone. The examples distinguish these whole-word uses from the same cell sequences embedded in `childish`, `outcome`, `shallot`, `thistle`, and similar words. *(pp.116-117, rule 10.2.1)*
- The same apostrophe-suffix permission as alphabetic wordsigns applies for `d`, `ll`, `re`, `s`, `t`, and `ve`, provided the result is standing alone. *(p.117, rule 10.2.2)*

### 10.3 Strong contractions

- `and`, `for`, `of`, `the`, and `with` use strong contractions wherever their letters occur unless another rule limits use. This broad rule permits both whole-word and within-word expansion, so inversion must preserve both segmentations until the rest of the word and later rules disambiguate them. *(pp.118-119, rule 10.3.1)*
- The “But” examples demonstrate that a matching print substring is not sufficient when it crosses the wrong morphological or pronunciation boundary, as in `apartheid`, `biofeedback`, `microfilm`, `northeast`, and `twofold`. *(p.119)*

### 10.4 Strong groupsigns

- The chapter defines groupsigns for `ch`, `gh`, `sh`, `th`, `wh`, `ed`, `er`, `ou`, `ow`, `st`, `ing`, and `ar`; use them wherever the represented letters occur unless a later rule limits them. *(pp.119-120, rule 10.4.1)*
- The examples show pronunciation-sensitive exclusions and inclusions, including names, interjections, letter sequences, diacritics, and foreign-derived spellings. A standards-only inverse can enumerate cell-to-letter expansions, but must not infer pronunciation to discard alternatives. *(pp.120-121)*
- For `ch`, `sh`, `th`, `wh`, `ou`, and `st`, write the letters individually when the groupsign would be misread as a word. This is a forward ambiguity-avoidance rule, not authority for an inverse to guess the intended word. *(pp.121-122, rule 10.4.2)*
- Use the `ing` groupsign wherever `ing` occurs except at the beginning of a word. “Beginning” is the letter sequence following a space, hyphen, or dash, possibly preceded by the punctuation and indicators listed in rule 2.6.2. *(p.122, rule 10.4.3)*

### 10.5 Lower wordsigns

- The lower wordsigns for `be`, `were`, `his`, and `was` are standing-alone forms, but are not used in contact with lower-dot punctuation, including hyphens, dashes, and all quotation marks. Capitals indicators and terminators are ignored for this decision. Because these cells also represent punctuation, an inverse parser must keep punctuation and wordsign branches separate until sequence context resolves them. *(pp.123-124, rule 10.5.1)*
- The lower wordsign for `enough` is standing-alone, also applies to `enough's`, and ignores capitals indicators/terminators when deciding legality. *(p.124, rule 10.5.2)*
- The lower wordsign for `in` is usable wherever the represented word occurs only when the containing sequence includes at least one upper-dot sign; quotation marks count as lower-dot signs and capitals indicators/terminators are ignored. *(p.125, rule 10.5.3)*
- In a sequence of lower punctuation and the lower wordsigns `enough`/`in`, the sequence must contain an upper-dot sign; otherwise the final lower wordsign is not used. *(p.126, rule 10.5.4)*

### 10.6 Lower groupsigns, first rules

- Lower groupsigns encode `ea`, `be`, `bb`, `con`, `cc`, `dis`, `en`, `ff`, `gg`, and `in`, with separate positional and morphological constraints. *(p.126)*
- `be`, `con`, and `dis` are used when they form the first syllable of a word. *(p.127, rule 10.6.1)*
- They are limited to the beginning of a word and must be followed by a letter, contraction, modified letter, or ligatured letter. A word beginning is the letter sequence after a space, hyphen, or dash, possibly preceded by rule-2.6.2 punctuation/indicators. *(p.128, rule 10.6.2)*
- Do not use `be`, `con`, or `dis` when immediately followed by a capitals indicator or capitals terminator. *(p.128, rule 10.6.3)*
- In abbreviations they are used only when the uncontracted word would use them and at least one more letter follows. *(p.128, rule 10.6.4)*

### 10.6 Lower groupsigns, remaining rules

- If an abbreviation's unabridged form is unknown and cannot be determined from context or a standard dictionary, use of `be`, `con`, or `dis` is permissible. This makes abbreviation expansion a caller-knowledge question, not a deterministic inverse rule. *(p.129, note following rule 10.6.4)*
- Use `ea`, `bb`, `cc`, `ff`, or `gg` only when the represented letters are both preceded and followed by a letter, contraction, modified letter, or ligatured letter, unless another rule limits use. These cells can also be punctuation signs, so the inverse must retain both lexical and punctuation parses until context rejects one. *(pp.129-131, rule 10.6.5)*
- Do not use those five lower groupsigns when their letters are immediately preceded or followed by a capitals indicator or capitals terminator. *(p.131, rule 10.6.6)*
- Do not use `ea` where the letters bridge a prefix and the remainder of the word. *(p.132, rule 10.6.7)*
- Use `en` and `in` wherever the represented letters occur unless another rule limits use. *(pp.132-133, rule 10.6.8)*
- Do not use `en` when `en` is standing alone, specifically to prevent misreading it as the lower wordsign `enough`. *(p.133, rule 10.6.9)*
- Any number of lower groupsigns and lower punctuation signs may follow one another only if the sequence contains an upper-dot sign; quotation marks count as lower-dot signs. If no upper-dot sign occurs, do not use the final lower groupsign. *(p.134, rule 10.6.10)*

### 10.7 Initial-letter contractions

- Dots-45 contractions encode `upon`, `these`, `those`, `whose`, and `word`; dots-456 encode `cannot`, `had`, `many`, `spirit`, `their`, and `world`; dot-5 contractions encode `day`, `ever`, `father`, `here`, `know`, `lord`, `mother`, `name`, `one`, `part`, `question`, `right`, `some`, `time`, `under`, `young`, `there`, `character`, `through`, `where`, `ought`, and `work`. *(pp.134-135)*
- The general rule uses an initial-letter contraction as a wordsign and wherever its represented letters occur, subject to the named special provisions and all other rules. *(pp.135-137, rule 10.7.1)*
- `upon`, `these`, `those`, `whose`, and `there` are contracted only when the whole-word meaning remains in the containing word. This is a semantic constraint: strings such as `bothered`, `coupon`, `hypotheses`, and `withered` do not qualify. *(pp.137-138, rule 10.7.2)*
- `had` is contracted only when its `a` is short. *(p.138, rule 10.7.3)*
- `ever` is contracted only when stress falls on its first `e` and it is not preceded by `e` or `i`. *(pp.138-139, rule 10.7.4)*
- `here` and `name` are contracted when the represented letters are pronounced as one syllable. *(p.139, rule 10.7.5)*
- `one` is contracted when pronounced as one syllable, in words ending in `oney`, and in `honest`, `monetary`, and derivatives; it is not contracted after `o`. *(pp.139-140, rule 10.7.6)*
- `some` is contracted when it forms a syllable of the basic word. *(p.141, rule 10.7.7)*
- `time` is contracted when pronounced like the word “time”. *(pp.141-142, rule 10.7.8)*
- `under` is contracted except when preceded by `a` or `o` and when `un` is a prefix. *(p.142, rule 10.7.9)*
- Rules 10.7.2-10.7.9 depend on meaning, vowel length, stress, pronunciation, syllabification, derivation, or prefix structure. A cells-only decoder can produce the contraction expansion as a standards-compatible candidate but cannot use these lexical facts to declare it uniquely intended without explicit caller policy. *(pp.137-142; implementation consequence)*

### 10.8 Final-letter groupsigns, first rules

- Dots-46 final-letter groupsigns encode `ound`, `ance`, `sion`, `less`, and `ount`; dots-56 encode `ence`, `ong`, `ful`, `tion`, `ness`, `ment`, and `ity`. *(p.142)*
- Use a final-letter groupsign only after a letter, contraction, modified letter, or ligatured letter, unless another rule limits use. *(pp.143-144, rule 10.8.1)*
- Do not use a final-letter groupsign when its represented letters follow a capitals indicator or capitals terminator. *(p.144, rule 10.8.2)*

## Design Rationale for Backtranslation

1. Build the inverse from the same rule provenance as the forward program; each inverse edge carries its rule identifier and print expansion.
2. Parse a braille cell sequence as a finite set of paths rather than selecting the first or shortest expansion.
3. Apply standards-determined context predicates to reject impossible paths.
4. Return `unique`, `ambiguous`, or `invalid` as a closed discriminated result. An `ambiguous` result retains every surviving standards-valid print candidate and its provenance.
5. Keep pronunciation, dictionary membership, frequency, and corpus preference outside the default decoder; they may be explicit caller policy only.

## Testable Properties

- A standing-alone alphabetic wordsign produces its word candidate; the same cell inside a larger ordinary word cannot use that wordsign interpretation. *(pp.113-116)*
- Apostrophe continuations outside `d|ll|re|s|t|ve` cannot extend alphabetic or strong wordsigns under rules 10.1.2/10.2.2. *(pp.115, 117)*
- `ing` cannot be decoded as the groupsign at a word beginning, but may be decoded internally or after the beginning boundary. *(p.122)*
- A lower wordsign branch touching only lower-dot punctuation is rejected according to rules 10.5.1-10.5.4. *(pp.123-126)*
- A `be|con|dis` lower-groupsign branch is rejected away from word beginning, before a capitals indicator/terminator, or where the represented letters do not form the first syllable. *(pp.127-128)*
- If two or more standards-valid paths survive, the default API returns all of them and never chooses using corpus frequency or Liblouis. *(pp.113-128; implementation consequence)*

## Relevance to Project

These rules supply the candidate expansions and legality predicates for Issue #5. They support a rule-linked inverse of the generated Grade 2 program and demonstrate why its public return type must expose ambiguity rather than return a guessed string.

## Open Questions

- [ ] Which forward-program predicates can be inverted mechanically and which require an explicit inverse predicate representation?
- [ ] How should caller-supplied lexical/pronunciation policy be typed so it can choose only among already standards-valid candidates?
- [ ] Can every ambiguity be represented compactly as a shared parse forest while materializing bounded candidate strings only at the API boundary?

## Continued Detailed Notes: Shortforms and Preference Rules

### 10.8 Final-letter groupsigns, remaining restrictions

- Do not use `ity` in `biscuity`, `dacoity`, `fruity`, `hoity-toity`, or `rabbity`. *(p.145, rule 10.8.3)*
- Do not use `ness` when the feminine suffix `ess` is added to a word ending in `en` or `in`. *(p.145, rule 10.8.4)*

### 10.9 Shortforms

- The chapter supplies the normative shortform inventory and their permitted longer-word forms. A shortform is used whenever its word stands alone, regardless of meaning, pronunciation, or use as a proper name. *(pp.145-146, rule 10.9.1)*
- A shortform is not used merely as a substring across a hyphen, slash, email address, or web address, because it is not standing alone there. *(pp.146-147)*
- Inside a longer word, a shortform is used only when the longer word itself stands alone and either appears in the Appendix 1 longer-word list or qualifies under rules 10.9.3-10.9.5. *(pp.147-148, rule 10.9.2)*
- Ten shortforms have additional productive uses: `braille` and `great` may occur wherever found; `children` may occur when not followed by a vowel or `y`; and `blind`, `first`, `friend`, `good`, `letter`, `little`, and `quick` may occur only at the beginning and not before a vowel or `y`. *(p.149, rule 10.9.3)*
- An interior capitals indicator or capitals terminator does not by itself prevent a listed or otherwise permitted longer-word shortform. *(p.150, rule 10.9.4)*
- `s` or apostrophe-`s` may be added to a qualifying shortform except `abouts`, `almosts`, and `hims`. *(p.151, rule 10.9.5)*
- Do not use a groupsign if doing so would create a letter sequence that could be read as a shortform. *(p.151, rule 10.9.6)*
- Grade 1 indicators disambiguate standing-alone letters, word-initial sequences, and noninitial sequences that would otherwise be read as shortforms; a grade 1 word passage suppresses contractions inside the indicated sequence. *(pp.152-153, rules 10.9.7-10.9.9)*
- The shortform inventory is normative data, not a frequency dictionary. Its inverse expansions must remain explicit candidates when the same cells have another standards-valid parse.

### 10.10 Preference rules

- When more than one groupsign could apply, use the chapter's ordered principles rather than arbitrary choice. *(p.153, rule 10.10.1)*
- Prefer the choice that uses fewer braille cells. If cell counts tie, prefer a strong contraction when it does not waste space. *(pp.153-154, rules 10.10.2-10.10.3)*
- Prefer `be`, `con`, or `dis` when it forms the first syllable; otherwise prefer strong groupsigns over lower groupsigns. *(pp.154-155, rules 10.10.4-10.10.5)*
- Use final `ence` in `encea`, `enced`, and `encer`; otherwise prefer strong or lower groupsigns over initial- or final-letter groupsigns when this does not waste space. *(p.155, rules 10.10.6-10.10.7)*
- Choose the groupsign closest to usual pronunciation and word form, and omit a groupsign that would seriously distort either. *(p.156, rules 10.10.8-10.10.9)*
- Do not end a word with a lower groupsign or lower wordsign when the resulting word would otherwise consist entirely of lower signs; capitals indicators and terminators are ignored for this test. *(pp.156-157, rule 10.10.10)*
- These are canonical forward-translation preferences. In the inverse, they validate candidates by retranslation; they do not authorize choosing one print candidate over another when multiple candidates canonically retranslate to the same input.

### 10.11 Bridging word components

- Do not use a groupsign across components of an unhyphenated compound word. *(p.157, rule 10.11.1)*
- Do not use `ch`, `gh`, `sh`, `th`, `wh`, or `the` across components when the `h` is aspirated. *(p.158, rule 10.11.2)*
- Use `be`, `con`, or `dis` across a prefix/remainder boundary when it forms the first syllable; do not bridge that boundary with `ea`. *(p.158, rules 10.11.3-10.11.4)*
- Other groupsigns, including `ed`, `en`, `er`, `of`, and `st`, generally may bridge a prefix/remainder boundary unless doing so harms recognition or pronunciation. *(pp.159-160, rule 10.11.5)*

## Inverse Validation Consequence

A generated print candidate is standards-valid for canonical backtranslation only if translating it forward under the same grade and mode reproduces the complete input cell sequence. This reuses the forward program's ordered preference rules, boundary predicates, grade indicators, and provenance without turning corpus frequency, a dictionary, or Liblouis into a silent selector.

## Continued Detailed Notes: Remaining Section 10

### 10.11 Bridging, final rules

- Use a newly available groupsign after adding a prefix or forming an unhyphenated compound even if the original word used a different braille form, unless it would hinder recognition or pronunciation. *(p.161, rule 10.11.6)*
- Generally bridge a word/suffix boundary with a groupsign unless recognition or pronunciation would suffer. *(pp.161-162, rule 10.11.7)*
- Use final lower `ea`, `bb`, `cc`, `ff`, or `gg` when a suffix is added or when the word becomes the first component of an unhyphenated compound. *(pp.162-163, rule 10.11.8)*
- Generally bridge a diphthong and adjoining letter unless the diphthong is printed as a ligature. *(p.163, rule 10.11.9)*

### 10.12 Miscellaneous contexts

- In abbreviations and acronyms, omit a contraction when the component letters are known to be pronounced separately; in doubt, use the contraction. Otherwise apply Grade 1 rules and Sections 10.1-10.11 normally. *(pp.163-166, rules 10.12.1-10.12.2)*
- In regular prose, contract embedded email addresses, URLs, web sites, and filenames; use uncontracted braille for separately displayed program code and nearby program excerpts. *(pp.166-167, rule 10.12.3)*
- Apply the ordinary contraction rules to dialect and word fragments. *(pp.167-168, rules 10.12.4-10.12.5)*
- Pronunciation- and syllabification-based rules are best practices when the word is familiar or the information is readily available. For unfamiliar words whose pronunciation or syllabification is difficult to determine, the transcriber or proofreader may use best judgment, and software contraction usage may be followed. *(pp.168-169, rules 10.12.6-10.12.7)*
- These unknown-pronunciation guidelines especially affect proper names, abbreviations, acronyms, invented words, and anglicized foreign words. Consistency within a transcription is required, while different transcriptions may legitimately contract the same word differently. *(p.169, rules 10.12.8-10.12.10)*
- Apply the ordinary contraction rules to lisped words and to words containing medial punctuation, indicators, or terminators. *(pp.169-171, rules 10.12.11-10.12.12)*
- For omitted letters, follow print, Grade 1 mode, and the ordinary contraction rules. Apply the ordinary rules to speech hesitation, slurring, and vocal sounds. *(p.171, rules 10.12.13-10.12.14)*
- Spelled words follow print plus Grade 1 and capitalization rules. Stammered words additionally follow the ordinary contraction rules. *(pp.172-173, rules 10.12.15-10.12.16)*
- Syllabified words follow the ordinary contraction rules, but an alphabetic wordsign is not used for a displayed syllable. *(p.173, rule 10.12.17)*

### 10.13 Word division

- Prefer not to divide words at braille line endings. When division is necessary, divide between syllables even when that suppresses a strong contraction or groupsign. *(pp.173-174, rule 10.13.1)*
- When division occurs at an existing hyphen, retain the normal braille form except where this would leave a lower-sign-only sequence. *(pp.174-175, rule 10.13.2)*
- Do not use an alphabetic or strong wordsign as part of a word divided between lines, even when its represented word appears to stand alone. Do not use `ing` at the beginning of the continuation line. *(pp.175-176, rules 10.13.3-10.13.4)*
- A divided-line sequence of lower groupsigns and lower punctuation must contain a sign with upper dots; quotation marks count as lower-only, and otherwise the final lower groupsign is not used. *(p.176, rule 10.13.5)*
- A dash permits a line break on either side. Do not use lower wordsigns `be`, `were`, `his`, or `was` next to the dash; retain `enough` or `in` subject to the lower-sign rule. *(p.177, rules 10.13.6-10.13.8)*
- Do not use `be`, `con`, or `dis`, final lower `ea`, `bb`, `cc`, `ff`, or `gg`, or a final-letter groupsign immediately before the division hyphen or at the beginning of the continuation line. *(pp.177-178, rules 10.13.9-10.13.11)*
- Never divide a shortform itself; when a longer word contains a shortform, preserve its ordinary eligibility across the line division. *(p.179, rule 10.13.12)*
- Printed page 180 is blank and closes the scoped Section 10 range. *(p.180)*

## Backtranslation Consequences from the Final Rules

- The standard explicitly permits multiple forward forms for unfamiliar words and acknowledges divergent valid transcriptions. A decoder therefore cannot infer unique print solely from cells whenever these alternatives converge.
- Grade indicators, capitalization, punctuation, line boundaries, and lexical boundaries are part of the inverse state; removing them before decoding would erase standards-relevant evidence.
- A pronunciation dictionary may support an explicitly supplied caller policy, but it cannot participate in the default candidate generator or silently resolve an ambiguous result.

## Collection Cross-References

### Already in Collection

- (none found)

### New Leads (Not Yet in Collection)

- (none)

### Supersedes or Recontextualizes

- (none)

### Cited By (in Collection)

- [Unified English Braille: Guidelines for Technical Material](../ICEB_2014_GuidelinesTechnicalMaterial/notes.md) - delegates literary symbols, modes, and indicators to the current Rules of Unified English Braille.
- [Errata for Guidelines for Technical Material, October 2008](../ICEB_2014_GTMErrata/notes.md) - uses the rulebook's contraction and line-mode conditions when correcting technical examples.
- [Guidelines for Technical Material, Section 3: Signs of Operation and Comparison](../ICEB_2018_OperationComparison/notes.md) - uses the rulebook for literary forms outside the replacement technical-sign table.
- [Guidelines for Technical Material, Section 1.7: Choice and Placement of Grade 1 Indicators](../ICEB_2025_Grade1Indicators/notes.md) - uses the rulebook's underlying per-sign Grade 1 requirements while replacing the technical-expression scope planner.
- [Guidance on Transcribing Mathematics and Science in UEB](../BANA_2026_MathScienceGuidance/notes.md) - treats the Third Edition 2024 rulebook as the international foundation for its regional technical guidance.

### Now in Collection (previously listed as leads)

- [Guidelines for Technical Material, Section 1.7: Choice and Placement of Grade 1 Indicators](../ICEB_2025_Grade1Indicators/notes.md) previously listed the rulebook's Grade 1 rules as a missing dependency; this source now supplies that normative foundation, while the 2025 document remains controlling for its approved replacement scope.

### Conceptual Links (not citation-based)

- [Finite-State Transducers in Language and Speech Processing](../Mohri_1997_FiniteStateTransducers/notes.md) - strong connection: Section 10 defines a finite, context-sensitive relation whose inverse must preserve multiple outputs; Mohri supplies the finite-state relation, composition, and bounded-ambiguity framework used to separate candidate generation from canonical forward validation.
- [Incremental Construction of Minimal Acyclic Finite-State Automata](../Daciuk_2000_MinimalAcyclicAutomata/notes.md) - moderate connection: the standard's finite contraction and shortform inventories can be compiled into the project's compact canonical automata, while inverse ambiguity remains an API property rather than a reason to duplicate tables.
- [Guidelines for Technical Material, Section 1.7: Choice and Placement of Grade 1 Indicators](../ICEB_2025_Grade1Indicators/notes.md) - strong standards connection: Section 10 relies on Grade 1 disambiguation, while the later approved replacement distinguishes canonical scope selection from other conforming alternatives, matching the inverse API's separation of standards candidates from caller policy.

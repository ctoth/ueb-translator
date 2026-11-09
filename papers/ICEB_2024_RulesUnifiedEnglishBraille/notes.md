---
title: "The Rules of Unified English Braille, Third Edition 2024"
authors: "International Council on English Braille; edited by Matthew Horspool"
year: 2024
cite_key: iceb2024rules
venue: "International Council on English Braille"
doi_url: "https://iceb.org/wp-content/uploads/2025/10/Rules-of-Unified-English-Braille-2024.pdf"
pages: "Section 5, printed pages 57-64 (PDF pages 84-91); rules 6.5 and 7.5, printed pages 68 and 81 (PDF pages 95 and 108); Sections 8-9, printed pages 89-112 (PDF pages 116-139); Section 10, printed pages 113-180 (PDF pages 140-207)"
reading_method: "Every rendered page image in the declared scope inspected"
---

# The Rules of Unified English Braille, Third Edition 2024

> **Ingestion scope:** Section 10, “Contractions” (printed pages 113-180; PDF pages 140-207), plus the title page and table of contents, is extracted here; Section 5, “Grade 1 Mode” (printed pages 57-64; PDF pages 84-91), rules 6.5 (printed page 68) and 7.5 (printed page 81), Section 8, “Capitalisation” (printed pages 89-100; PDF pages 116-127) and Section 9, “Typeforms” (printed pages 101-112; PDF pages 128-139) were added on 2026-11-07. The complete 408-page official rulebook remains in `paper.pdf`; all other sections are intentionally unextracted for this Issue #5 backtranslation study.

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

## Section 5: Grade 1 Mode (printed pp.57-64; PDF pages 84-91)

Scoped addition (2026-11-07), read from page images. Printed p.64 is blank.

### Signs *(p.57)*
- Grade 1 symbol indicator `⠰`, word indicator `⠰⠰`, passage indicator `⠰⠰⠰`, terminator `⠰⠄`. *(p.57)*

### 5.1 Mode indicators *(p.57)*
- Note: a braille symbol may have both a grade 1 meaning and a contraction (grade 2) meaning, and some also a numeric meaning. *(p.57)*
- 5.1.1 A grade 1 indicator sets grade 1 mode when the grade 1 meaning of a symbol could be misread as a contraction or a numeric meaning. *(p.57)*
- 5.1.2 The extent of grade 1 mode is determined by the grade 1 indicator in use. *(p.57)*

### 5.2 Grade 1 symbol indicator *(pp.57-58)*
- 5.2.1 The symbol indicator sets grade 1 mode for the next symbol. Note: it is not required before a, i and o, which have no contraction meaning when standing alone. Examples: the vowels are: a, e, i, o and u; Mrs X and Mr O; J. S. Bach; 22b 22B 22p; adagio e cantabile; Add either ? or ! to each sentence. [question mark and exclamation mark]; In Smith⁵⁶ we find …; jim@take2.com. *(pp.57-58)*

### 5.3 Grade 1 word indicator *(p.58)*
- 5.3.1 The word indicator sets grade 1 mode for the next symbols-sequence or the remainder of the current symbols-sequence. *(p.58)*
- 5.3.2 Its effect is terminated by a space or a grade 1 terminator (refer to 5.5). Examples: I spell it u-n-t-i-d-y.; replace I with E/R (stacked). *(p.58)*

### 5.4 Grade 1 passage indicator *(pp.58-59)*
- 5.4.1 The passage indicator sets grade 1 mode for the next passage. *(p.58)*
- 5.4.2 A grade 1 passage is terminated by the grade 1 terminator. Examples: He spelt H-o C-h-i M-i-n-h City.; Factorise: y = x²−4; y = x²−2x; y = x−x². *(p.58)*
- 5.4.3 To keep a line-by-line arrangement (computer program, set of equations), put the passage indicator on a line above and the terminator on a line below, each preceded by the dot locator for "use" (refer to 3.14). *(pp.58-59)*

### 5.5 Grade 1 terminator *(p.59)*
- 5.5.1 The terminator usually follows immediately after the last affected symbols-sequence of a grade 1 passage. *(p.59)*
- 5.5.2 Use the terminator to end grade 1 mode before the end of a symbols-sequence (p-p-p-p-p-p-p-perishing). *(p.59)*

### 5.6 Numeric indicator *(pp.59-60)*
- 5.6.1 Grade 1 mode is also set by the numeric indicator (1st, shopping4you, 4starhotel@webnet.com). *(p.59)*
- 5.6.2 Grade 1 mode set by the numeric indicator is terminated by a space, hyphen, dash or grade 1 terminator (refer to 6.5). Examples: I'll go 3rd–you go 4th.; 3-D; 3-dimensional; 5-CD set; c:\personal\2009finances. *(pp.59-60)*

### 5.7 Grade 1 mode avoids confusion with contractions *(pp.60-62)*
- 5.7.1 Grade 1 mode is required to prevent a letter from being misread as an alphabetic wordsign (refer to 10.1). Examples: b–e, b-1, B-team, ev-er-y-which-way, ending in –s or –es, V–VII, viii-x, What have you d–, What have you d…, p. 7, p.7, p7, the letters "a" to "g", Sections (h) and (i)., Did 'e 'n' Ma get to 't?, c/o maître d', the people's right, p's and q's., letter *d*, "*X marks the spot.*", Dr J. F. Smith, M.D., s-p-e-l-l-i-n-g. *(pp.60-61)*
- 5.7.2 Grade 1 mode is required to prevent a letters-sequence from being misread as a shortform or as containing one (refer to 10.9.7-10.9.9). Examples: CD-ROM, "Hm!" he mused., Could you buy a CD/DVD?, My friends are Fr Ted and Sr Ann., the Imm family, al dente, Use the ALT key., NEC (National Executive Committee), ozbrl (Australian listserve). *(p.61)*

### 5.8 Grade 1 indicators and capitalisation *(pp.61-62)*
- 5.8.1 A grade 1 indicator precedes a capitalisation indicator (T-SHIRTS FOR SALE). *(pp.61-62)*

### 5.9 Choice of indicators *(pp.62-63)*
- Note: extended grade 1 mode (word or passage) may be used for non-literary expressions, especially mathematics and computer programming. But since braille should be as easy to read as possible, contracted braille with grade 1 indicators only on symbols that could be misread is often appropriate. Contracted braille is recommended for email addresses, filenames and web addresses. *(p.62)*
- 5.9.1 Words are most easily recognised in their familiar contracted form, so minimise the number of switches between grades, the number of indicators and the number of cells (un-e-mo-tion-al rather than an alternative; c-h-e-e-s-e; br-r-r-r; d-don't; d-d-d-don't; about-f-f-f-face; d-d-d-dictionary rather than an alternative; p-p-please rather than an alternative; s-s-s-s-super-st-stition). *(p.62)*
- 5.9.2 Reduce the indicators within equations: when reading mathematical expressions, passage indicators are less intrusive than interior indicators (refer to Guidelines for Technical Material, Part 1.7). Example: x^(a/b) y = x, with one form "[or]" another, "[rather than]" a third. *(pp.62-63)*

### 5.10 Optional use of the grade 1 indicator *(p.63)*
- 5.10.1 "When an expression in grade 1 mode would be equivalent to the same text in grade 2 mode because no contractions would occur, a grade 1 indicator may be used although it is not required." Example: The engine stuttered rm-m-m-m-m then rm-mm-mm-mm then settled into r-mmmmmmm. *(p.63)*

### 5.11 Use of grade 1 indicators in grade 1 text *(p.63)*
- 5.11.1 In a work entirely in grade 1 braille (no contractions), grade 1 indicators are not used except as required for other reasons, e.g. lowercase a-j immediately after digits, and a question mark in an unusual position (C is for candy.; Question 3c). *(p.63)*

### Back-translation reading of Section 5
- 5.10.1 is a direct licence for a *redundant* grade 1 indicator when no contractions occur. The back-translator's acceptance of a grade 1 word indicator where forward translation writes only a symbol indicator, conditioned on no contraction rules applying, is this rule. *(p.63)*
- 5.10.1 also covers one direction of the typeform-context relaxation: braille carrying a grade 1 indicator that forward translation omits, where no contraction is involved. It does not license *omitting* a required indicator, which 5.1.1 requires. *(pp.57, 63)*
- 5.9 frames the choice of indicators as readability guidance (minimise switches, indicators and cells), so several indicator placements of the same print are conforming. *(p.62)*
- 5.8.1 fixes the order grade 1 indicator before capitals indicator. *(p.61)*

## Rules 6.5 and 7.5 (printed pp.68 and 81; PDF pages 95 and 108)

Scoped addition (2026-11-07): single pages read to pin the grade 1 requirements the runtime encodes.

### 6.5 Numeric indicators set grade 1 mode *(p.68)*
- 6.5.1 A numeric indicator also sets grade 1 mode. When set by a numeric indicator, grade 1 mode is terminated by a space, hyphen, dash or grade 1 terminator. *(p.68)*
- 6.5.2 While grade 1 mode is in effect, a grade 1 indicator is not required unless a lowercase letter a–j follows a digit, full stop/period or comma (32, 3b, 3B, 3m, 4.2, 4.b, 4.B, 4.m, report3.doc, report3.xls, … in the Second World War² 1939–1945.³). *(p.68)*
- 6.5.3 While grade 1 mode is in effect, contractions may not follow a number (houses4lease; He came 4th in the race.). *(p.68)*
- The page also ends the examples of the preceding rule (Piano Sonata No.16 in C major is K.545.; ⅜ = .375). Rule 6.4 itself was not read. *(p.68)*

### 7.5 Question mark *(p.81)*
- 7.5.1 In most cases a question mark needs no grade 1 symbol indicator; see 7.5.2-7.5.4 (What???, "What?!", ...?", persons?/people?). *(p.81)*
- 7.5.2 Place a grade 1 symbol indicator before a question mark where it would be read as the wordsign "his" or as an opening double quotation mark. *(p.81)*
- 7.5.3 Place a grade 1 symbol indicator before a question mark that is "standing alone" ([?]). *(p.81)*
- 7.5.4 Place a grade 1 symbol indicator before a question mark that follows a space, hyphen or dash. Any of the punctuation and indicator symbols listed in 2.6.2 may intervene between the space, hyphen or dash and the question mark (?-1750, (?—1750), 10:30-?, Replace each ? with a letter: ?e??u). *(p.81)*

### Back-translation / runtime reading
- The runtime's numeric-ambiguous-letter rule (a lowercase a–j while numeric mode is active) is 6.5.2; its question-mark rule (after a start, a sequence boundary, or a hyphen/en dash/em dash, with intervening 2.6.2 symbols) is 7.5.4. *(pp.68, 81)*

## Section 8: Capitalisation (printed pp.89-100; PDF pages 116-127)

Scoped addition (2026-11-07): read from page images to find the rules behind the back-translation capitals relaxation. Printed p.100 is blank.

### Signs *(p.89)*
- Capital letters A-Z: dot-6 prefix `⠠` + letter. Capital Greek letters: `⠠⠨` + letter. Capital German sharp s: shown as `,.!` (ASCII braille). Capitals word indicator `⠠⠠`; capitals passage indicator `⠠⠠⠠`; capitals terminator `⠠⠄`. *(p.89)*

### 8.1 Use of capitals *(p.89)*
- 8.1.1 Follow print for the use of capital letters. Note: the transcriber may reasonably reduce capitals used in print as visual embellishment (e.g. capitalised words at the start of paragraphs or chapters). Small capitals used as a distinctive typeform: refer to 9.6. *(p.89)*

### 8.2 Extent of capitals mode *(p.89)*
- 8.2.1 The extent of capitals mode is determined by the capitals indicator in use. *(p.89)*

### 8.3 Defining a capital letter *(pp.89-90)*
- 8.3.1 A capital letter is a two-cell symbol: prefix dot 6 and the lowercase form of the letter. Examples include O, V, 20B, B.C., "Hush. Keep Quiet!", C. O. Linkletter, M MacPherson and O O'Hara, 'Twas Dr. Hamilton-Hall., B-E-L-I-E-V-E (each letter separately capitalised with hyphens). *(pp.89-90)*
- 8.3.2 Place the prefix dot 6 before a contraction when only its first letter is capitalised (Father Edmond Anderson; Today, Mr Will Just visited us.; His name is Thomas.). *(p.90)*
- 8.3.3 Only a modifier or a ligature indicator can be positioned between a letter and its capitals prefix (refer to 4.2, 4.3). Examples: Étude, Voyage À Nice. *(p.90)*

### 8.4 Capitalised word indicator `⠠⠠` *(pp.90-92)*
- 8.4.1 The capitalised word indicator sets capitals mode for the next letters-sequence or the remainder of the current letters-sequence. *(p.90)*
- 8.4.2 Its effect is terminated by a space, a single capital letter, a nonalphabetic symbol, or a capitals terminator, but not by a modifier or a ligature indicator. Examples (pp.90-92): PARLIAMENT, FRANÇOIS, ΠΒΦ, DipTP, NEW YORK (each word indicated separately), TVOntario, "GO quickly and TAKE CARE!", ANGLO-SAXON and MERRY-GO-ROUND (word indicator repeated after each hyphen), McGRAW-HILL, UPPERCASE-lowercase, LITTLE-RED-RIDING-HOOD-type tales, The d'ARTAGNAN Romances, O'SULLIVAN, DON'T, THAT'S, SHE'LL, JACK'S FO'C'S'LE (word indicator repeated after apostrophes in some cases), WELCOME TO McDONALD'S, OK'd, RSVP or R.S.V.P., HOTELS.COM, The N.A.S.D.A.Q. News, BA(Oxon), (R)AC, WIND(ward), I/O, B&B, AT&T, McDONALD@xyz.com, SWIFT & CO., FREEform (bold `form`), EXAMINE (italic X inside). *(pp.90-92)*
- 8.4.3 A fully capitalised hyphenated compound divided at the hyphen at the end of a braille line is correctly capitalised: the new line begins with the capitalised word indicator (already required) after the hyphen. Example ANGLO-SAXON. *(p.92)*
- 8.4.4 A hyphen inserted during transcription for word division at the end of a braille line does not terminate capitals word mode. Example INTERNATIONAL. *(p.92)*

### 8.5 Capitalised passage indicator `⠠⠠⠠` *(pp.93-96)*
- 8.5.1 The capitalised passage indicator sets capitals mode for the next passage. *(p.93)*
- 8.5.2 A passage is three or more symbols-sequences and may include non-alphabetic symbols. *(p.93)*
- 8.5.3 A capitalised passage is terminated by the capitals terminator immediately following the last affected symbols-sequence. Examples: CAUTION: WET PAINT!; Please KEEP OFF THE GRASS in this area.; THE BBC AFRICA NEWS; PROUD TO BE A ΦBK; FOR SALE: 1975 FIREBIRD; A SELF-MADE MAN; BUY *FAHRENHEIT 9/11* ON E-BAY; A.A. (ALAN ALEXANDER) MILNE. *(p.93)*
- 8.5.4 A capitalised letter or letters-sequence adjacent to the beginning or end of a capitalised passage is not necessarily considered part of the passage, especially if separated from it by a space or punctuation. Examples (p.94): "... at 11:00 AM"—MARKHAM ECONOMIST AND SUN; STOP RUNNING NOW! It's dangerous.; ... (See Attachment A). A CSP (Carriage Service Provider) has obligations to ...; Go to point A. BUT NOT YET!; He worked for the ABC. A BBC journalist reported ... *(pp.93-94)*
- 8.5.5 A capitalised passage extending over more than one text element (series of paragraphs, numbered or bulleted list): each element is preceded by the capitalised passage indicator and capitals mode is terminated only at the end of the final element. *(pp.94-95)*
- 8.5.6 Where the text elements do not form a continuous passage (e.g. a series of headings), each element is capitalised separately. *(p.95)*
- 8.5.7 A single heading is capitalised as a unit even if it extends over more than one braille line (LIST OF SURVEY RECIPIENTS ORGANISED BY COUNTRY, italic). *(pp.95-96)*

### 8.6 Capitals terminator `⠠⠄` *(pp.96-97)*
- 8.6.1 The capitals terminator is placed after the final capitalised letter, either within or following the symbols-sequence. *(p.96)*
- 8.6.2 It may precede or follow punctuation and other terminators, but it is best to nest indicators and paired characters: close punctuation and indicators in reverse order of opening. Examples: He shouted "I WILL NOT!"; ROMEO AND JULIET (italic); IT'S A HOAX! (APRIL FOOL!). *(p.96)*
- 8.6.3 To end capitals mode before the end of a symbols-sequence, place the terminator after the last affected letter of capitals word mode or capitals passage mode. Examples: ABCs, WASPs, WALKing, unSELFish, XXIInd, VIIb, INITIALS OF WRITER/initials of secretary, The two CEOs met in our CEO's office. *(pp.96-97)*

### 8.7 Placement of indicators *(p.97)*
- 8.7.1 The dot-6 prefix, capitalised word indicator or capitalised passage indicator is placed immediately before the first capitalised letter or a modifier to that letter (cedilla, grave, circumflex). Only a modifier or ligature indicator may come between the capitals indicator and the letter. Examples: "So?", (July), B-U-S, [Σ], *Voyage À Nice*, 'TIS, CD, "SHHHH!", Hippity-HOP, **RESOLVED**, ÉTUDE, Unified English Braille (UEB), AC SMITH, V-NECK SWEATERS FOR SALE!. *(p.97)*

### 8.8 Choice of capitalised indicators *(pp.98-99)*
- Note: the default treatment for a sequence of capital letters is capitals word mode, but in some situations the transcriber may choose between individual capital letters and capitals word mode. "If both choices will render an unambiguous transcription, interpret the following rules as guidelines." *(p.98)*
- 8.8.1 Choose the method which retains the usual braille form (XI XIth, XXXI XXXIst, OK OKd, CD CDs, RV: Recreational Vehicle–Let's go RVing., www.BLASTSoundMachine.com, www.BLASTsoundmachine.com). *(p.98)*
- 8.8.2 Choose the method which best conveys the meaning, in particular one that avoids capital indicators or terminators within natural subunits (Br in KBr, Sc in BSc, Ontario in TVOntario). Examples: KBr, BSc, TVOntario, preSENT, PRESent, WoooooooOOOOOOOooooooo, MHz, ATandT. *(pp.98-99)*
- 8.8.3 Choose the method which gives consistency throughout a single title (chemical formulae H₂O O H OH KCl CH₂OH HOCH₂). *(p.99)*

### 8.9 Accented letters in fully capitalised words *(p.99)*
- 8.9.1 When an accented letter in a fully capitalised word is shown lowercase in print, the lowercase may be ignored in braille except in facsimile transcription; explain in a transcriber's note (PREMIèRE, ESPAñOLA). *(p.99)*

### Back-translation reading of Section 8
- More than one capitals encoding of the same print is conforming. 8.5.4 says letters next to a passage are "not necessarily" part of it; 8.8 calls the choice between individual capitals and word mode a guideline when both are unambiguous. A validator that accepts only the forward translator's canonical capitals indicators will therefore reject conforming braille. *(pp.94, 98)*
- 8.5.2 defines a passage as three or more symbols-sequences. The rules read so far do not state outright that a capitals passage may replace word indicators over a span the forward translator would encode differently. 8.5.4 and the 8.8 note are the nearest pinpoints. *(pp.93-94, 98)*

## Section 9: Typeforms (printed pp.101-112; PDF pages 128-139)

Scoped addition (2026-11-07), read from page images.

### Signs *(p.101)*
- Each typeform has symbol, word and passage indicators and a terminator: italic, boldface, underlined, script, and a first transcriber-defined typeform. Note: a typeform indicator has two parts, a prefix and a root; the prefix designates the typeform and the root its extent. Prefixes for the second to fifth transcriber-defined typeforms are listed. *(p.101)*

### 9.1 Deciding when to use typeform indicators *(pp.102-103)*
- For placement relative to punctuation, refer to 9.7. *(p.102)*
- 9.1.1 Typeforms in print need not always be indicated in braille. Distinctive heading typefaces are generally ignored where formatting distinguishes headings; the print practice of italicising all variables in technical material is ignored. *(p.102)*
- 9.1.2 Typeform indicators are needed when the change is significant because it shows emphasis or distinction: foreign words in English text, titles within text, subject headings on paragraphs, silent thought, computer input versus output, the class of a variable in mathematics. *(p.102)*
- 9.1.3 When it cannot be determined whether a change of typeform is significant, indicate the change. Examples: 31*l* (font only distinguishes l from 1; not indicated); two underlined hyperlinks (the first a print enhancement not shown, the second marks embedded text and is shown); vector field **v** at *P* (the italic P's are not significant because all single capitals are italic in that text); CHAPTER 6 / ON TUESDAY (heading typeform and chapter-opening embellishment ignored). *(pp.102-103)*

### 9.2 Typeform symbol indicators *(pp.103-104)*
- 9.2.1 A typeform symbol indicator sets the typeform for the next letter or symbol. Examples: the set of real numbers ℜ (script), *p*neumonia, *8* chickens!, stor_y_ stor_i_es, 24 should be _3_4, **b**right **b**lue **b**all, 27_._9, Stop**!** May I help**?**, 83_%_, **$**45 not **€**45, the **?** icon, change *y* to *i*, 5**5** not 5**6**. *(pp.103-104)*
- 9.2.2 When a typeform symbol indicator precedes a contraction, only the first letter is affected (_I_ _h_ave _e_nough _k_nowledge.; ("*B*eyond *b*elief!"); **W**hi**c**h b**o**wl is brok**e**n?; M is for *M*other). *(p.104)*
- 9.2.3 If any letter of a contraction other than the first is to be preceded by a typeform symbol indicator, the contraction is not used (mothe**r**, mo**t**her, moth**e**r, mot**h**er; with *mother* uncontracted, the contractions for *the*, *th* or *er* may still be used). *(p.104)*

### 9.3 Typeform word indicators *(pp.104-106)*
- 9.3.1 A typeform word indicator sets the typeform for the next symbols-sequence or the remainder of the current symbols-sequence. *(p.104)*
- 9.3.2 Its effect is terminated by a space, but not by a numeric space or by the space at the end of a braille line in a divided symbols-sequence (refer to 9.4). Examples (pp.104-106): Who is _for_ the people?; She **was** right.; *R.S.V.P.*; *l'oeil-de-boeuf* (Fr.: bull's eye), also shown divided at the end of a braille line; *one two–three*; _1,500,000_ _1 500 000_; *1939-1945*, also divided; a handwritten "555 1982"; brief*ly*; day_time_; 13.8**6666...**; Go to *http://www.wikipedia.org*; the *ionogenic* (ion-forming) *form*; **sea waves** / ***tsunami***; HarperCollins*Publishers*; **N(*S*)** is called the **empty set** or **null set.** *(pp.104-106)*

### 9.4 Typeform passage indicators and terminators *(pp.106-107)*
- 9.4.1 A typeform passage indicator sets the typeform for the next passage. *(p.106)*
- 9.4.2 A passage is three or more symbols-sequences. *(p.106)*
- 9.4.3 A passage is terminated by the typeform terminator following the last affected symbol. *(p.106)*
- 9.4.4 A typeform word indicator may also be terminated within a symbols-sequence by the typeform terminator (refer to 9.7-9.9). Examples (pp.106-107): handwritten lunchbox note; Charles Dickens titles; **Maybe** / *Maybe it will rain tomorrow*; Click the **Up One Level** button; _words were underlined_ / *the italic font is preferred*; C:\My Documents\_letter to dad 041023_.doc; **text**book; _and_/or; _syl_lable _em_phasis; *Radar* is from *ra*dio *d*etecting *a*nd *r*anging; Harper*Flamingo*Canada; the *Globe*'s business section. *(pp.106-107)*

### 9.5 Transcriber-defined typeform indicators *(p.108)*
- 9.5.1 Use transcriber-defined typeform indicators for significant typeform changes other than italics, boldface, underlining or script: different-sized, coloured or crossed-out type, sans serif, double/dotted/coloured/wavy underlining. List them on the special symbols page or in a transcriber's note. Examples: Courier New prompt "Insert the CD-ROM in drive E:" (first transcriber-defined typeform); "Your monday is mutch much busier than my is mine" (second = double underline, third = crossed out, fourth = dotted underline). *(p.108)*

### 9.6 Small capitals *(pp.108-109)*
- Note: small capitals are capital-shaped letters at roughly lowercase height; print uses them in two ways. *(p.108)*
- 9.6.1 Abbreviations and Roman numerals in small capitals are best transcribed as capitals (refer to Section 8). Examples: King Henry VIII, PT109. *(pp.108-109)*
- 9.6.2 Small capitals used for emphasis or distinction (usually recognisable by regular-size capitals for the letters that are capitalised) use a transcriber-defined typeform indicator when significant (EARTHQUAKE KILLS THOUSANDS, fifth transcriber-defined typeform). *(p.109)*

### 9.7 Placement of typeform symbols with punctuation *(pp.109-111)*
- Note: interpret these rules as guidelines. *(p.109)*
- 9.7.1 Prefer nesting of typeform indicators, terminators and paired characters (parentheses, brackets, quotes): close in reverse order of opening (plays (such as *Romeo and Juliet*); "**Venite exultemus Domino!**" his father sang.). *(p.109)*
- 9.7.2 When print clearly excludes punctuation from a typeform and a terminator is needed for other reasons, place the terminator where the typeform changes. When in doubt (except hyphen, dash and ellipsis), treat the punctuation as part of the typeform (*Hänsel und Gretel,* a fairy tale; out-*of-the*-way; *Brevity is the soul of wit.*—Shakespeare; Remember *Do unto others* ...). *(p.110)*
- 9.7.3 For readability, ignore a typeform change for closing punctuation when a typeform word indicator is used, and for incidental punctuation within a passage, unless the change matters for understanding (e.g. typeforms being studied). Examples: Did you read _Hamlet_?; "*Help!* I'm *falling*."; the reading list (all punctuation regular in print); Foreign words (such as *buon giorno*) are italicized (typeforms being studied). *(pp.110-111)*

### 9.8 Multiple typeform indicators for the same text *(p.111)*
- 9.8.1 The order of typeform indicators is not prescribed. When two or more typeforms apply to the same text, indicators and terminators are best nested: the first opened is the last closed (Anne of Green Gables, underlined italic; the bank's dictum ***Pecunia Felicitatibus Honoratur.*** *Money welcomed gladly.*). *(p.111)*

### 9.9 Typeform passages across consecutive text elements *(p.112)*
- 9.9.1 A typeform passage spanning more than one text element (e.g. consecutive paragraphs): each element is preceded by the typeform passage indicator, and the typeform is terminated only where it changes. *(p.112)*

### Back-translation reading of Section 9
- Section 9 has no rule on whether a grade 1 indicator may be kept or omitted inside or around typeform indicators. The only grade 1 evidence is in examples, e.g. "change *y* to *i*" (p.104), which writes a grade 1 indicator together with the italic symbol indicator. The rule that would govern that choice lies in Section 5 (Grade 1 mode), which has not been read. *(pp.101-112)*
- Several placements are explicitly guidelines (9.7 note; the 9.8.1 "not prescribed" order). So more than one typeform-indicator arrangement of the same print is conforming, and a validator that demands the forward translator's exact arrangement will reject conforming braille. *(pp.109, 111)*

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

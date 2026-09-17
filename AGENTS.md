# Oracle validation

When changing Grade 2 translation or oracle ledgers, run the full dictionary
and retained-corpus oracle sweeps as well as `npm run check` and a fuzz replay.
Reconcile changed evidence against the local ICEB sources; remove stale entries
only after verifying that the current outputs agree, and review changed
disagreements individually. A passing seed replay does not establish that the
dictionary or corpus sweeps pass. Verify the pushed head's oracle CI before
reporting this work complete.

Corpus case IDs identify content, not necessarily unique source documents.
Preserve all distinct evidence digests during reconciliation; assert that a
helper has not collapsed records sharing a case ID before writing a ledger.

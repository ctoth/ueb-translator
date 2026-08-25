# Abstract

## Original Text (Verbatim)

Finite-state machines have been used in various domains of natural language processing. We consider here the use of a type of transducer that supports very efficient programs: sequential transducers. We recall classical theorems and give new ones characterizing sequential string-to-string transducers. Transducers that output weights also play an important role in language and speech processing. We give a specific study of string-to-weight transducers, including algorithms for determinizing and minimizing these transducers very efficiently, and characterizations of the transducers admitting determinization and the corresponding algorithms. Some applications of these algorithms in speech recognition are described and illustrated.

---

## Our Interpretation

A finite UEB rule dictionary is an acyclic deterministic-input subsequential transducer: lookup follows one path in time proportional to the input examined, and equivalent suffix states can be merged exactly. The general weighted determinizer is unnecessary for already functional, finite rules; the project instead uses the paper to state the model and its boundary precisely.

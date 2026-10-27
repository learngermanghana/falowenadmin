# A1 objective grammar safeguards

Falowen uses tolerant text matching for vocabulary, prices, preferences, and ordinary free-text objective answers. Grammar-conjugation assignments may opt into `answerMatchingMode: "strict_grammar"` in the answer dictionary.

In strict grammar mode:

- capitalization, punctuation, umlauts, and `ß` normalization remain supported;
- the complete normalized accepted sentence must match;
- a different subject pronoun or verb ending is wrong;
- multiple valid forms must be listed as explicit `/` alternatives in the reference answer.

A1-1.2 uses the separate `subject_verb` mode because students fill in conjugated verbs rather than reproduce complete sentences. In this mode, a one-word answer must equal the reference verb; a multi-word answer must begin with the reference subject and conjugated verb. Remaining copied prompt words are not graded. Compact alternatives such as `Sie kommen/kommt aus Russland` are expanded before comparison. Therefore `ihr kommt Brasilien` receives credit, while `Ich heißt Max`, `Ihr komme aus Brasilien`, and `Sie wohnen in Wien` remain wrong for reference forms using `Du heißt`, `Ihr kommt`, and `Sie wohnt`.

The `subject_verb` exception is assignment-controlled and does not weaken `strict_grammar`. For example, a future strict answer of `Ihr kommt aus Brasilien` must reject `Ihr kommt aus Russland` even though the first two tokens match.

Objective-only assignments may still receive helpful language observations about extra prose, but unregistered writing must not contribute a writing score or claims such as “all task points completed.”

After deterministic scoring, the displayed detected-part totals must be rebuilt from deterministic details. Raw AI part statistics must never contradict the authoritative objective score or wrong-answer table.

Regression coverage: `tests/a1-grammar-objective-consistency.test.js` preserves Mary A1-4, verifies A1-1.2 subject-and-verb grading, and proves that `strict_grammar` still rejects a sentence with a matching prefix but a different ending.

# A1 objective grammar safeguards

Falowen uses tolerant text matching for vocabulary, prices, preferences, and ordinary free-text objective answers. Grammar-conjugation assignments may opt into `answerMatchingMode: "strict_grammar"` in the answer dictionary.

In strict grammar mode:

- capitalization, punctuation, umlauts, and `ß` normalization remain supported;
- the complete normalized accepted sentence must match;
- a different subject pronoun or verb ending is wrong;
- multiple valid forms must be listed as explicit `/` alternatives in the reference answer.

A1-1.2 uses strict grammar mode because its learning objective is pronoun and verb conjugation. Therefore `Ich heißt Max`, `Ihr komme aus Brasilien`, and `Sie wohnen in Wien` must not receive credit for reference forms using `Du heißt`, `Ihr kommt`, and `Sie wohnt`.

Objective-only assignments may still receive helpful language observations about extra prose, but unregistered writing must not contribute a writing score or claims such as “all task points completed.”

After deterministic scoring, the displayed detected-part totals must be rebuilt from deterministic details. Raw AI part statistics must never contradict the authoritative objective score or wrong-answer table.

Regression coverage: `tests/a1-grammar-objective-consistency.test.js` preserves Mary A1-4 at 10/12 and scores Josh A1-1.2 at 11/14, with questions 2, 5, and 9 wrong.

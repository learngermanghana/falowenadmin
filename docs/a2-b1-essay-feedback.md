# A2 and B1 essay feedback

Falowen student comments for A2 and B1 writing must be based on evidence from the submitted text and structured marking result.

## Required feedback order

The feedback engine prioritises:

1. deterministic objective counts and exact wrong-question numbers;
2. one specific writing strength;
3. one exact correction from the student's sentence;
4. missing or completed task points when structured evidence is available;
5. one level-appropriate next step when space remains.

A2 comments are limited to complete sentences within approximately 60 words. B1 comments may use up to 75 words. The limiter must never cut a correction halfway through a sentence.

## Level focus

A2 feedback focuses on task completion, understandable messages, greeting and closing, practical details, verb position, articles and basic connectors.

B1 feedback focuses on position, argument development, examples, paragraph structure, connectors and subordinate-clause accuracy.

## Originality safeguard

Openings and coaching sentences are selected deterministically from several valid alternatives. When previous or recent feedback is available, the engine chooses wording with lower phrase similarity. Variation must never change scores, wrong-answer numbers or grammar evidence.

## Deterministic safeguards

- `wrongAnswers` remains authoritative for the student-facing wrong-question list.
- A null or missing `objectiveScore` must not be converted to zero. When `objectiveCorrect` and `objectiveTotal` are present, those counts are preserved.
- Exact writing corrections must come from structured correction evidence; the engine must not invent a quotation from the student's work.
- Missing task points are mentioned only when the marking result provides them.

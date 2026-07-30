# Structured writing feedback

Falowen keeps deterministic objective marking authoritative. OpenAI is responsible for qualitative writing evidence only.

For A2 and B1 writing, the examiner response must provide:

- `writingStrengths`: one or two specific strengths grounded in the student's actual wording or completed task details;
- `taskCompletion`: completed points, total points, and missing points;
- `corrections`: one or two exact `from` → `to` corrections, or an empty array when no genuine correction exists;
- `nextStep`: one assignment-specific improvement or extension goal;
- `writingScore` / `writingScorePercent`.

Both the Firebase normalizer and browser normalizer must preserve these fields. The final 40–60 word A2 or 50–75 word B1 tutor comment then combines the deterministic objective result with the structured writing evidence.

Do not replace missing evidence with invented corrections. Generic fallback advice is permitted only when OpenAI returns no usable structured evidence after a registered writing part was detected.

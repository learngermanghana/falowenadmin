import test from "node:test";
import assert from "node:assert/strict";

import { buildNaturalStudentFeedback } from "../src/utils/naturalMarkingFeedback.js";

const submission = `Teil 2 · Schreiben : Sind persönliche Kontakte hilfreicher als Online-Portale?

Heutzutage ist die Wohnungssuche besonders in Großstädten sehr schwierig. Ich bin der Meinung, dass persönliche Kontakte hilfreicher sind, weil es weniger Konkurrenz gibt. Einerseits bieten Online-Portale viele Anzeigen, und man kann Wohnungen einfach vergleichen. Andererseits bewerben sich dort sehr viele Menschen. Bei einer Besichtigung in Hamburg waren einmal etwa dreißig Interessenten dabei. Durch persönliche Kontakte erfährt man oft früher von freien Wohnungen. Deshalb glaube ich, dass Kontakte bessere Chancen bieten. Zusammenfassend sollte man beide Methoden nutzen, aber persönliche Kontakte bevorzugen.

Teil 3 · Lesen: 1B, 2A, 3B, 4B, 5A

Teil 4 · Hören: 1B, 2C, 3B, 4B, 5B`;

const objectiveDetails = {
  "teil3.1": { correct: true, partId: "teil3", student: "B", expected: "B" },
  "teil3.2": { correct: true, partId: "teil3", student: "A", expected: "A" },
  "teil3.3": { correct: true, partId: "teil3", student: "B", expected: "B" },
  "teil3.4": { correct: true, partId: "teil3", student: "B", expected: "B" },
  "teil3.5": { correct: true, partId: "teil3", student: "A", expected: "A" },
  "teil3.6": { correct: false, partId: "teil3", student: "", expected: "A" },
  "teil3.7": { correct: false, partId: "teil3", student: "", expected: "B" },
  "teil4.1": { correct: true, partId: "teil4", student: "B", expected: "B" },
  "teil4.2": { correct: true, partId: "teil4", student: "C", expected: "C" },
  "teil4.3": { correct: true, partId: "teil4", student: "B", expected: "B" },
  "teil4.4": { correct: true, partId: "teil4", student: "B", expected: "B" },
  "teil4.5": { correct: true, partId: "teil4", student: "B", expected: "B" },
};

test("omitted B1 objective answers are reported as not answered", () => {
  const feedback = buildNaturalStudentFeedback({
    studentName: "Student",
    level: "B1",
    assignmentKey: "B1-2.4",
    objectiveScore: 83,
    objectiveCorrect: 10,
    objectiveTotal: 12,
    objectiveDetails,
    writingScore: 82,
    writingScorePercent: 82,
  }, submission);

  assert.match(feedback, /In Teil 3, questions 6 and 7 were not answered/i);
  assert.doesNotMatch(feedback, /review questions 6 and 7/i);
});

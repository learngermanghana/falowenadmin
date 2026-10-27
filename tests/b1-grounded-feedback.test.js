import test from "node:test";
import assert from "node:assert/strict";

import { buildNaturalStudentFeedback } from "../src/utils/naturalMarkingFeedback.js";

const submission = `Teil 2
Liebe Forum-Mitglieder,
heute möchte ich über das Thema persönlicher Kontakt und Homeoffice im Traumberuf sprechen. Ich bin der Meinung, dass dieses Thema unser Leben stark beeinflusst. Sowohl Homeoffice als auch persönlicher Kontakt im Traumberuf sind wichtig und haben verschiedene Vorteile und Nachteile. Meiner Ansicht nach ist Homeoffice im Traumberuf besser als persönlicher Kontakt. Einerseits bietet Homeoffice mehrere Vorteile. Ein Beispiel dafür ist, dass es sehr flexibel ist und man Zeit mit der Familie verbringen kann. Andererseits gibt es auch Nachteile. Ein Grund dafür ist, dass man sich manchmal einsam fühlen kann und auch von den Kindern abgelenkt werden kann. In meinem Heimatland ist die Situation so, dass die meisten Menschen am Arbeitsplatz arbeiten. Zusammenfassend lässt sich sagen, dass beides sehr wichtig ist, aber ich würde gerne in Zukunft von zu Hause arbeiten.

Teil 3
1. A
2. B
3. A
4. B
5. B
6. B
7. B

Teil 4
1. A
2. A
3. A
4. A
5. A`;

const objectiveDetails = Object.fromEntries([
  ...Array.from({ length: 7 }, (_, index) => [`teil3.${index + 1}`, { correct: true, partId: "teil3" }]),
  ...Array.from({ length: 5 }, (_, index) => [`teil4.${index + 1}`, { correct: true, partId: "teil4" }]),
]);

test("B1 perfect objective parts and opinion writing receive grounded feedback", () => {
  const feedback = buildNaturalStudentFeedback({
    studentName: "Reuben Nii Lante Lamptey",
    level: "B1",
    assignmentKey: "B1-1.1",
    objectiveScore: 100,
    objectiveCorrect: 12,
    objectiveTotal: 12,
    objectiveDetails,
    writingScore: 87,
    writingScorePercent: 87,
    finalScore: 95,
    status: "needs_review",
    confidence: 0.5,
  }, submission);

  assert.match(feedback, /Teil 3 and Teil 4 are excellent, with all answers correct/i);
  assert.match(feedback, /Einerseits .* Andererseits|Einerseits … Andererseits/i);
  assert.match(feedback, /persönlicher Kontakt am Arbeitsplatz|arbeiten vor Ort/i);
  assert.doesNotMatch(feedback, /Develop one central argument more fully instead of adding several short points/i);
});

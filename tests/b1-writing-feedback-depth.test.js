import test from "node:test";
import assert from "node:assert/strict";

import { buildNaturalStudentFeedback } from "../src/utils/naturalMarkingFeedback.js";

const submission = `Teil 2 : Schreiben

Sehr geehrte Damen und Herren,

ich habe Ihre Wohnungsanzeige im Internet gesehen und interessiere mich sehr für die angebotene Wohnung. Gern würde ich sie persönlich besichtigen. Wäre ein Termin am Freitag um 16 Uhr möglich? Alternativ könnte ich am Samstagvormittag kommen.

Bitte bestätigen Sie mir den Termin und teilen Sie mir die genaue Adresse mit. Außerdem möchte ich gern wissen, welche Unterlagen ich zur Besichtigung mitbringen soll. Sie erreichen mich per E-Mail oder telefonisch unter 0123 456789.

Vielen Dank im Voraus. Ich freue mich auf Ihre Rückmeldung.

Mit freundlichen Grüßen
Ruth

Teil 3 : Lesen
1B 2B 3B 4B 5A 6B 7C

Teil 4 : Hören
1A 2B 3B 4C 5B`;

const objectiveDetails = {
  "teil3.1": { correct: true, partId: "teil3" },
  "teil3.2": { correct: true, partId: "teil3" },
  "teil3.3": { correct: true, partId: "teil3" },
  "teil3.4": { correct: true, partId: "teil3" },
  "teil3.5": { correct: true, partId: "teil3" },
  "teil3.6": { correct: true, partId: "teil3" },
  "teil3.7": { correct: true, partId: "teil3" },
  "teil4.1": { correct: true, partId: "teil4" },
  "teil4.2": { correct: true, partId: "teil4" },
  "teil4.3": { correct: true, partId: "teil4" },
  "teil4.4": { correct: true, partId: "teil4" },
  "teil4.5": { correct: true, partId: "teil4" },
};

test("B1 formal-letter feedback comments on the writing itself, not only greeting/connectors", () => {
  const feedback = buildNaturalStudentFeedback({
    studentName: "Ruth Ndekiro Shao",
    level: "B1",
    assignmentKey: "B1-2.5",
    objectiveScore: 100,
    objectiveCorrect: 12,
    objectiveTotal: 12,
    objectiveDetails,
    writingScore: 82,
    writingScorePercent: 82,
    status: "needs_review",
    confidence: 0.35,
  }, submission);

  assert.match(feedback, /Teil 2 letter is task-focused/i);
  assert.match(feedback, /request a viewing/i);
  assert.match(feedback, /Wäre ein Termin/i);
  assert.match(feedback, /address/i);
  assert.match(feedback, /subordinate clause|language range|connectors/i);
  assert.doesNotMatch(feedback, /connector\s+[“"]?und/i);
  assert.ok(feedback.split(/\s+/).length >= 60, feedback);
  assert.ok(feedback.split(/\s+/).length <= 115, feedback);
});

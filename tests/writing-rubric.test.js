import test from "node:test";
import assert from "node:assert/strict";

import { evaluateWritingRubric, rubricFeedbackSentences } from "../src/utils/writingRubric.js";
import { writingDepthSentences } from "../src/utils/writingFeedbackDepth.js";

const a2Submission = `
Teil 2:
Hallo Anna,
ich komme am Samstag nach Accra, weil ich meine Familie besuche. Wir können uns um 15 Uhr am Bahnhof treffen. Danach können wir in ein Café gehen. Kannst du mir sagen, ob du Zeit hast?
Liebe Grüße
Mina
`;

test("A2 rubric evaluates the whole message instead of praising isolated basic words", () => {
  const result = {
    level: "A2",
    taskCompletion: { completed: 2, total: 3, missing: ["transport"] },
    corrections: [{ from: "am Bahnhof treffen", to: "uns am Bahnhof treffen" }],
  };
  const rubric = evaluateWritingRubric(result, a2Submission, "A2");
  const feedback = rubricFeedbackSentences(result, a2Submission, "A2").join(" ");
  const depth = writingDepthSentences(result, a2Submission, "A2").join(" ");

  assert.equal(rubric.dimensions.taskCompletion.score <= 2, true);
  assert.match(feedback, /transport/i);
  assert.match(feedback, /am Bahnhof treffen.*uns am Bahnhof treffen/i);
  assert.match(depth, /concrete details|relevant question/i);
  assert.doesNotMatch(depth, /you used (?:lieber|weil)/i);
});

const b1Opinion = `
Teil 2:
Heutzutage ist die Wohnungssuche besonders in Großstädten sehr schwierig. Ich bin der Meinung, dass persönliche Kontakte hilfreicher sind, weil es weniger Konkurrenz gibt. Einerseits bieten Online-Portale viele Anzeigen, andererseits bewerben sich dort sehr viele Menschen. Bei einer Besichtigung in Hamburg waren etwa dreißig Interessenten dabei. Deshalb glaube ich, dass Kontakte bessere Chancen bieten. Zusammenfassend sollte man beide Methoden nutzen, aber persönliche Kontakte bevorzugen.
`;

test("B1 rubric rewards argument development and preserves assignment-specific context", () => {
  const rubric = evaluateWritingRubric({ level: "B1" }, b1Opinion, "B1");
  const feedback = writingDepthSentences({ level: "B1" }, b1Opinion, "B1").join(" ");

  assert.equal(rubric.dimensions.organizationCohesion.score >= 3, true);
  assert.equal(rubric.dimensions.grammarControl.subordinateCount >= 2, true);
  assert.match(feedback, /argument|position|central point|reason/i);
  assert.match(feedback, /etwa dreißig Interessenten|concrete example/i);
  assert.doesNotMatch(feedback, /you used (?:weil|einerseits|andererseits)/i);
});

test("structured next steps remain authoritative in rubric feedback", () => {
  const result = {
    level: "B1",
    nextStep: "Develop the second argument with one specific example before the conclusion",
  };
  const feedback = rubricFeedbackSentences(result, b1Opinion, "B1");
  assert.equal(feedback.includes(result.nextStep), true);
});

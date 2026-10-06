import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { checkDeterministicObjectiveAnswers } from "../src/utils/autoMarking.js";
import { buildNaturalStudentFeedback } from "../src/utils/naturalMarkingFeedback.js";
import { getA2WritingTaskSpec } from "../src/data/a2WritingTaskSpecs.js";
import { evaluateWritingTaskEvidence } from "../src/utils/writingTaskEvidence.js";

const submission = `TEIL 2

Liebe Diana,

ich schreibe dir, weil ich dich zu einem gemeinsamen Wochenende einladen möchte. Wenn das Wetter gut ist, können wir an den Strand gehen und ein Picknick machen. Ich denke, dass es viel Spaß macht.

Hast du nächsten Samstag Zeit? Wir können uns um 12 Uhr vor dem Einkaufszentrum in Spintex treffen.

Sag mir bitte, ob du Zeit hast. Es ist eine Reise für zwei Tage, deshalb bring bitte bequeme Kleidung und ein Handtuch mit.

Ich hoffe, du kannst kommen!

Liebe Grüße
Millicent

TEIL3
1. A
2. B
3. B
4. A
5. C`;

function day21Reference() {
  const dictionary = JSON.parse(fs.readFileSync(new URL("../src/data/answers_dictionary.json", import.meta.url), "utf8"));
  return dictionary["A2 8.21 Ein Wochenende planen"];
}

test("A2-8.21 deterministic objective marking keeps Millicent at 5/5", () => {
  const result = checkDeterministicObjectiveAnswers({
    referenceEntry: day21Reference(),
    submissionText: submission,
  });

  assert.equal(result.objectiveCorrect, 5);
  assert.equal(result.objectiveTotal, 5);
  assert.equal(result.objectiveScore, 100);
  assert.equal(result.wrongAnswers.length, 0);
  assert.match(result.detectedParts[0].summary, /5 objective answers found, 5 correct, 0 wrong/i);
});

test("A2-8.21 feedback quotes the letter and recognises its natural conclusion", () => {
  const objective = checkDeterministicObjectiveAnswers({
    referenceEntry: day21Reference(),
    submissionText: submission,
  });

  const feedback = buildNaturalStudentFeedback({
    level: "A2",
    assignmentKey: "A2-8.21",
    writingScore: 83,
    writingScorePercent: 83,
    objectiveScore: objective.objectiveScore,
    objectiveCorrect: objective.objectiveCorrect,
    objectiveTotal: objective.objectiveTotal,
    objectiveDetails: Object.fromEntries(
      Object.entries(objective.parts[0].result.details || {}).map(([key, detail]) => [
        `teil3.${key}`,
        { ...detail, partId: "teil3" },
      ]),
    ),
    taskCompletion: { completed: 3, total: 3, missing: [] },
    writingStrengths: ["The invitation is clear and includes practical weekend details."],
    nextStep: "Add a clear conclusion before the closing.",
  }, submission);

  assert.match(feedback, /ich schreibe dir, weil ich dich zu einem gemeinsamen Wochenende einladen möchte/i);
  assert.match(feedback, /Ich hoffe, du kannst kommen/i);
  assert.match(feedback, /natural conclusion before the closing/i);
  assert.doesNotMatch(feedback, /add a clear conclusion/i);
  assert.doesNotMatch(feedback, /[\p{Extended_Pictographic}]/u);
});



test("A2-8.21 task evidence quotes the direct bring instruction", () => {
  const task = getA2WritingTaskSpec("A2-8.21");
  const writing = submission.split(/\n\s*TEIL3\b/i)[0];
  const evidence = evaluateWritingTaskEvidence(task, writing);
  const bringPoint = evidence.find((item) => /bring|can expect/i.test(item.label));

  assert.equal(bringPoint?.status, "met");
  assert.match(bringPoint?.evidence || "", /bring bitte bequeme Kleidung und ein Handtuch mit/i);
  assert.doesNotMatch(bringPoint?.evidence || "", /Wenn das Wetter gut ist/i);
});

test("student-facing marking sources no longer introduce emoji headings", () => {
  const router = fs.readFileSync(new URL("../api/router.js", import.meta.url), "utf8");
  const functions = fs.readFileSync(new URL("../functions/index.js", import.meta.url), "utf8");
  const service = fs.readFileSync(new URL("../src/services/markingService.js", import.meta.url), "utf8");

  assert.doesNotMatch(router, /📌 Marking summary|📊 Score|🛠 Corrections to review|✅ All objective answers were correct|✍️ Writing feedback/);
  assert.match(functions, /no Markdown, bold markers, asterisks, or emojis/i);
  assert.match(service, /stripFeedbackEmojis/);
  assert.match(service, /reconcileDetectedObjectiveParts/);
});

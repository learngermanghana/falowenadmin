import test from "node:test";
import assert from "node:assert/strict";

import { compareExaminerResults } from "../src/utils/markingIntelligence.js";
import {
  applyQuestionAwareWritingGuard,
  enrichOptionsWithQuestionAwareWritingTask,
  resolveQuestionAwareWritingTask,
} from "../src/utils/questionAwareWritingMarking.js";

const assignmentOptions = {
  referenceEntry: {
    assignmentKey: "B1-1.2",
    level: "B1",
    title: "Freunde fürs Leben",
  },
  submission: {
    assignmentKey: "B1-1.2",
    level: "B1",
  },
};

const opinionEssayInsteadOfEmail = `Teil 2

Hallo Carmen,
ich schreibe dir, weil ich über das Thema „Freundschaft fürs Leben“ sprechen möchte.

Meine Meinung ist, dass Freundschaft fürs Leben sehr wichtig ist, weil man Wissen teilen und über seine Probleme sprechen kann.

Im Alltag trifft man viele Menschen. Manchmal entstehen Freundschaften durch gemeinsame Ziele oder Hobbys, zum Beispiel beim Sport, bei der Arbeit oder in der Kirche.

Ich denke, dass Freundschaften fürs Leben oft schon in der Schulzeit oder Kindheit entstehen. Gute Freunde bleiben auch in schwierigen Zeiten zusammen. Ein echter Freund geht mit dir durch dick und dünn.

Einerseits gibt es viele Vorteile. Man kann seine Geheimnisse mit einem guten Freund teilen. Ein zuverlässiger Freund bewahrt deine Geheimnisse und unterstützt dich, wenn du Probleme hast.

Andererseits gibt es auch Nachteile. Manchmal gibt es Probleme zwischen Freunden. Zum Beispiel kann man enttäuscht werden oder das Vertrauen kann verletzt werden.

In meinem Heimatland treffen sich viele Menschen am Wochenende mit ihren Freunden. Sie spielen zusammen, helfen sich gegenseitig und verbringen Zeit miteinander.

Zusammenfassend lässt sich sagen, dass Freundschaft fürs Leben sehr wichtig ist. Gute Freunde unterstützen uns in schwierigen Zeiten und machen unser Leben schöner.

Viele Grüße
Fred

Teil 3
1. b
2. b
3. a
4. a
5. b
6. b
7. b

Teil 4
1. a
2. a
3. a
4. b
5. b`;

const actualEmail = `Teil 2

Hallo Carmen,
wie geht es dir? Ich möchte dir von meinem besten Freund Kofi erzählen. Wir haben uns vor fünf Jahren in einem Deutschkurs kennengelernt, weil wir zusammen eine Partneraufgabe gemacht haben.
Unsere Freundschaft ist für mich besonders, weil Kofi ehrlich und zuverlässig ist und mich in schwierigen Situationen unterstützt.
Hast du am Samstag Zeit? Wollen wir uns um 15 Uhr im Café am Bahnhof treffen? Dann kann ich dir mehr erzählen.
Schreib mir bald.

Liebe Grüße
Fred`;

const reubenEmail = `Teil 2
Liebe Ruth,
ich hoffe, es geht dir gut. Ich schreibe dir, weil ich dir von einem neuen Freund von mir erzählen möchte. Er heißt Mark, ist Arzt und wohnt auch hier in Accra. Wir haben uns vor vier Jahren am Arbeitsplatz kennengelernt. Seitdem sind wir gute Freunde. Unsere Freundschaft ist für mich ganz besonders, weil Mark viele gute Eigenschaften hat. Zum Beispiel ist er ehrlich, geduldig, bescheiden, lustig, klug, hilfsbereit und offen. Er hilft mir in vielen schwierigen Situationen. Ich möchte ihn dir gerne vorstellen. Hast du am nächsten Wochenende Zeit? Wir könnten uns bei mir zu Hause treffen. Passt dir das? Ich freue mich auf deine Antwort.
Viele Grüße
Reuben`;

test("B1-1.2 resolves the actual workbook writing task and its three communicative points", () => {
  const task = resolveQuestionAwareWritingTask(assignmentOptions);
  assert.ok(task);
  assert.equal(task.assignmentKey, "B1-1.2");
  assert.equal(task.level, "B1");
  assert.equal(task.textType, "informal_email");
  assert.equal(task.register, "informal");
  assert.deepEqual(task.taskPoints, [
    "Explain how you and the friend met",
    "Explain why this specific friendship is special",
    "Make a concrete suggestion for a meeting",
  ]);
  assert.match(task.taskText, /explain how you met/i);
  assert.match(task.gradingInstruction, /not merely against the general topic/i);
});

test("marking payload is enriched so both AI examiners receive the exact writing task", () => {
  const enriched = enrichOptionsWithQuestionAwareWritingTask(assignmentOptions);
  assert.equal(enriched.referenceEntry.questionAwareWritingTask.assignmentKey, "B1-1.2");
  assert.equal(enriched.submission.questionAwareWritingTask.assignmentKey, "B1-1.2");
  assert.match(enriched.referenceEntry.questionAwareWritingTask.gradingInstruction, /every required communicative point separately/i);
});

test("generic friendship opinion essay cannot keep a 100% writing score", () => {
  const enriched = enrichOptionsWithQuestionAwareWritingTask({
    ...assignmentOptions,
    submissionText: opinionEssayInsteadOfEmail,
  });
  const result = applyQuestionAwareWritingGuard({
    level: "B1",
    assignmentKey: "B1-1.2",
    objectiveScore: 100,
    objectiveCorrect: 12,
    objectiveTotal: 12,
    writingScore: 100,
    writingScorePercent: 100,
    finalScore: 100,
    score: 100,
    taskCompletion: { completed: 3, total: 3, missing: [] },
    feedback: "Strong work. You completed the required task.",
    status: "needs_review",
    confidence: 0.8,
  }, enriched, opinionEssayInsteadOfEmail);

  assert.equal(result.objectiveScore, 100);
  assert.equal(result.objectiveCorrect, 12);
  assert.equal(result.objectiveTotal, 12);
  assert.equal(result.writingScore, 55);
  assert.equal(result.writingScorePercent, 55);
  assert.equal(result.finalScore, 82);
  assert.equal(result.markingPolicy, "a2-b1-40-30-30");
  assert.equal(result.writingMinimumMet, true);
  assert.equal(result.taskCompletion.completed, 0);
  assert.equal(result.taskCompletion.total, 3);
  assert.equal(result.missingTaskPoints.length, 3);
  assert.equal(result.ai.questionAwareWritingGuard.genreMismatch, true);
  assert.equal(result.ai.detectedWritingTextType.detectedType, "opinion_essay");
  assert.match(result.feedback, /language quality cannot replace task fulfilment/i);
});

test("a genuine informal email that answers all three points is not capped", () => {
  const enriched = enrichOptionsWithQuestionAwareWritingTask({
    ...assignmentOptions,
    submissionText: actualEmail,
  });
  const result = applyQuestionAwareWritingGuard({
    level: "B1",
    assignmentKey: "B1-1.2",
    objectiveScore: 100,
    objectiveCorrect: 12,
    objectiveTotal: 12,
    writingScore: 92,
    writingScorePercent: 92,
    finalScore: 97,
    score: 97,
    taskCompletion: { completed: 3, total: 3, missing: [] },
    feedback: "Clear and complete informal email.",
    status: "needs_review",
    confidence: 0.8,
  }, enriched, actualEmail);

  assert.equal(result.writingScore, 92);
  assert.equal(result.finalScore, 97);
  assert.equal(result.ai.questionAwareWritingGuard, undefined);
  assert.equal(result.ai.questionAwareWritingTask.assignmentKey, "B1-1.2");
  assert.equal(result.ai.detectedWritingTextType.detectedType, "informal_email");
});

test("Reuben-style complete B1 email is not left in the mid-80s without concrete corrections", () => {
  const enriched = enrichOptionsWithQuestionAwareWritingTask({
    ...assignmentOptions,
    submissionText: reubenEmail,
  });
  const result = applyQuestionAwareWritingGuard({
    level: "B1",
    assignmentKey: "B1-1.2",
    objectiveScore: 100,
    objectiveCorrect: 12,
    objectiveTotal: 12,
    writingScore: 85,
    writingScorePercent: 85,
    finalScore: 94,
    score: 94,
    taskCompletion: { completed: 3, total: 3, missing: [] },
    missingTaskPoints: [],
    corrections: [],
    feedback: "Strong task completion with only an extension goal for cohesion.",
    status: "marked",
    confidence: 0.82,
  }, enriched, reubenEmail);

  assert.equal(result.writingScore, 90);
  assert.equal(result.writingScorePercent, 90);
  assert.equal(result.finalScore, 96);
  assert.equal(result.status, "marked");
  assert.equal(result.ai.questionAwareWritingGuard, undefined);
  assert.equal(result.ai.questionAwareWritingCalibration.applied, true);
  assert.equal(result.ai.detectedWritingTextType.detectedType, "informal_email");
});

test("a close second examiner at 0.68 confidence does not force tutor review by status alone", () => {
  const comparison = compareExaminerResults(
    { finalScore: 96, writingScore: 90, confidence: 0.84, status: "marked" },
    { finalScore: 95, writingScore: 88, confidence: 0.68, status: "needs_review" },
  );

  assert.equal(comparison.scoreDelta, 1);
  assert.equal(comparison.writingScoreDelta, 2);
  assert.equal(comparison.requiresTutorReview, false);
  assert.equal(comparison.agreement, "high");
});
import test from "node:test";
import assert from "node:assert/strict";

import { compareExaminerResults } from "../src/utils/markingIntelligence.js";
import { A2_WRITING_RUBRIC_VERSION, getA2WritingTaskSpecs } from "../src/data/a2WritingTaskSpecs.js";
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

test("Reuben-style complete B1 email keeps its evidence-based language score", () => {
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

  assert.equal(result.writingScore, 85);
  assert.equal(result.writingScorePercent, 85);
  assert.equal(result.finalScore, 94);
  assert.equal(result.status, "marked");
  assert.equal(result.ai.questionAwareWritingGuard, undefined);
  assert.equal(result.ai.questionAwareWritingCalibration, undefined);
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

function findUndefinedPaths(value, path = "result", seen = new WeakSet()) {
  if (value === undefined) return [path];
  if (!value || typeof value !== "object") return [];
  if (seen.has(value)) return [];
  seen.add(value);
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => findUndefinedPaths(item, path + "[" + index + "]", seen));
  }
  return Object.entries(value).flatMap(([key, item]) => findUndefinedPaths(item, path + "." + key, seen));
}

const victoriaA2Day1 = `Teil 2
Sehr geehrter Herr Felix,
Ich schreibe Ihnen, weil ich über meine Arbeiten und Schule sprechen möchte.
Die Schule ist sehr schön und interessant. Ich habe viele Leute aus meinem Land kennengelernt.
Ich arbeite bei Cleanwerk, es ist sehr stressig.Könnten Sie mir helfen?
Viele Grüße
Victoria

Teil 3
1. C
2. B
3. A
4. A
5. B
6. B
7. C

Teil 4
1. B
2. A
3. A
4. B
5. C`;

test("A2-1.1 keeps the authoritative informal Felix-letter register even if cached registry metadata says formal", () => {
  const staleFormalTask = {
    assignmentKey: "A2-1.1",
    level: "A2",
    title: "Small Talk",
    taskText: "Write to Felix about work and family.",
    textType: "formal_email",
    register: "formal",
    recipient: "formal_recipient",
    taskPoints: ["Explain why you are writing", "Write about work and school/family", "Ask Felix a question"],
    source: "assignmentRegistry",
    gradingInstruction: "Expected register: formal.",
  };
  const enriched = enrichOptionsWithQuestionAwareWritingTask({
    referenceEntry: { assignmentKey: "A2-1.1", level: "A2", questionAwareWritingTask: staleFormalTask },
    submission: { assignmentKey: "A2-1.1", level: "A2" },
    submissionText: victoriaA2Day1,
  });

  const task = enriched.referenceEntry.questionAwareWritingTask;
  assert.equal(task.register, "informal");
  assert.equal(task.textType, "informal_email");
  assert.equal(task.recipient, "friend_or_personal_contact");
  assert.equal(task.taskPoints.length, 5);
  assert.match(task.taskText, /something new about your family/i);
  assert.match(task.taskText, /ask how he is or what is new with him/i);
  assert.match(task.gradingInstruction, /Expected register: informal/i);
  assert.doesNotMatch(task.gradingInstruction, /Expected register: formal/i);
});

test("Victoria A2-1.1 recovers an impossible zero before applying the informal-register cap", () => {
  const enriched = enrichOptionsWithQuestionAwareWritingTask({
    referenceEntry: {
      assignmentKey: "A2-1.1",
      level: "A2",
      questionAwareWritingTask: {
        assignmentKey: "A2-1.1",
        level: "A2",
        title: "Small Talk",
        taskText: "Informal letter to Felix about work and family.",
        textType: "formal_email",
        register: "formal",
        recipient: "formal_recipient",
        taskPoints: ["Explain why you are writing", "Write about work and school/family", "Ask Felix a question"],
      },
    },
    submission: { assignmentKey: "A2-1.1", level: "A2" },
    submissionText: victoriaA2Day1,
  });

  const result = applyQuestionAwareWritingGuard({
    level: "A2",
    assignmentKey: "A2-1.1",
    objectiveScore: 92,
    objectiveCorrect: 11,
    objectiveTotal: 12,
    writingScore: 0,
    writingScorePercent: 0,
    finalScore: 55,
    score: 55,
    taskCompletion: { completed: 3, total: 3, missing: [] },
    missingTaskPoints: [],
    feedback: "You addressed all 3 task points.",
    status: "marked",
    confidence: 0.8,
  }, enriched, victoriaA2Day1);

  assert.equal(result.ai.questionAwareWritingTask.register, "informal");
  assert.equal(result.writingScore, 60);
  assert.equal(result.writingScorePercent, 60);
  assert.equal(result.finalScore, 79);
  assert.equal(Object.prototype.hasOwnProperty.call(result.ai, "suspiciousWritingZero"), false);
  assert.deepEqual(findUndefinedPaths(result), []);
  assert.equal(result.ai.questionAwareWritingGuard.suspiciousWritingZero, true);
  assert.equal(result.ai.questionAwareWritingGuard.recoveredWritingScore > 0, true);
  assert.equal(result.ai.questionAwareWritingGuard.genreMismatch, false);
  assert.equal(result.ai.questionAwareWritingGuard.registerMismatch, true);
  assert.equal(result.taskCompletion.completed, 3);
  assert.equal(result.taskCompletion.total, 5);
  assert.equal(result.markingRubricVersion, A2_WRITING_RUBRIC_VERSION);
  assert.equal(result.taskPointEvidence.length, 5);
  assert.deepEqual(result.taskPointEvidence.map((item) => item.status), ["met", "met", "missing", "met", "missing"]);
  assert.equal(result.writingDimensions.taskFulfilment, 60);
  assert.equal(result.writingDimensions.registerAndTextType, 60);
  assert.deepEqual(result.missingTaskPoints, [
    "Tell Felix something new about your family",
    "At the end ask Felix a relevant personal question about how he is or what is new with him",
  ]);
  assert.match(result.ai.questionAwareWritingGuard.endingAdvice, /Könnten Sie mir helfen/);
  assert.match(result.ai.questionAwareWritingGuard.endingAdvice, /Ich freue mich auf deine Antwort/);
  assert.equal(result.status, "needs_review");
  assert.equal(result.shouldSendAutomatically, false);
  assert.match(result.feedback, /requested informal register/i);
  assert.match(result.feedback, /something new about your family/i);
  assert.match(result.feedback, /relevant personal question/i);
  assert.match(result.feedback, /Könnten Sie mir helfen/);
  assert.match(result.feedback, /Ich freue mich auf deine Antwort/);
  assert.match(result.feedback, /capped at 60%/i);
  assert.doesNotMatch(result.feedback, /requested formal register/i);
});


test("formal and informal email are the same correspondence genre; register is evaluated separately", async () => {
  const { writingTextTypesCompatible } = await import("../src/utils/writingTaskSchema.js");
  assert.equal(writingTextTypesCompatible("informal_email", "formal_email"), true);
  assert.equal(writingTextTypesCompatible("formal_email", "informal_email"), true);
  assert.equal(writingTextTypesCompatible("informal_email", "opinion_essay"), false);
});


const selasiA2Day1 = `Teil 2
Lieber Felix,
Wie geht es dir? Ich hoffe es geht dir gut. Ich schreibe dir, weil ich eine tolle Nachricht habe für dich! Wir haben jetzt einen neuen Hund. Ich bin sehr glücklich.
Ich arbeite in der IT-Branche, zu Hause natürlich und studiere Deutsch. Mein Vater, meine Mutter und meine Geschwister sind Teil der Familie. Ich habe einen großen Bruder und eine jüngere Schwester, und jetzt haben wir einen schönen Hund.
Und du? Was machst du gern?
Viele Grüße,
Selasi`;

test("A2-1.1 accepts a relevant personal final question but does not require the exact model wording", () => {
  const enriched = enrichOptionsWithQuestionAwareWritingTask({
    referenceEntry: { assignmentKey: "A2-1.1", level: "A2" },
    submission: { assignmentKey: "A2-1.1", level: "A2" },
    submissionText: selasiA2Day1,
  });

  const result = applyQuestionAwareWritingGuard({
    level: "A2",
    assignmentKey: "A2-1.1",
    objectiveScore: 92,
    writingScore: 86,
    writingScorePercent: 86,
    finalScore: 90,
    score: 90,
    taskCompletion: { completed: 3, total: 3, missing: [] },
    missingTaskPoints: [],
    feedback: "Clear and relevant informal letter.",
    status: "needs_review",
    confidence: 0.52,
  }, enriched, selasiA2Day1);

  assert.equal(result.writingScore, 86);
  assert.equal(result.ai.questionAwareWritingGuard, undefined);
  assert.equal(result.ai.questionAwareWritingTask.taskPoints.length, 5);
  assert.equal(result.taskCompletion.completed, 5);
  assert.equal(result.taskCompletion.total, 5);
  assert.equal(result.taskPointEvidence.every((item) => item.status === "met"), true);
  assert.equal(result.markingRubricVersion, A2_WRITING_RUBRIC_VERSION);
});

test("A2-1.1 does not count a generic help question as the required final question to Felix", () => {
  const enriched = enrichOptionsWithQuestionAwareWritingTask({
    referenceEntry: { assignmentKey: "A2-1.1", level: "A2" },
    submission: { assignmentKey: "A2-1.1", level: "A2" },
    submissionText: victoriaA2Day1,
  });

  const result = applyQuestionAwareWritingGuard({
    level: "A2",
    assignmentKey: "A2-1.1",
    objectiveScore: 92,
    writingScore: 82,
    writingScorePercent: 82,
    finalScore: 88,
    score: 88,
    taskCompletion: { completed: 5, total: 5, missing: [] },
    missingTaskPoints: [],
    feedback: "You addressed all task points.",
    status: "marked",
    confidence: 0.8,
  }, enriched, victoriaA2Day1);

  assert.equal(result.taskCompletion.completed, 3);
  assert.equal(result.taskCompletion.total, 5);
  assert.equal(result.missingTaskPoints.includes("Tell Felix something new about your family"), true);
  assert.equal(result.missingTaskPoints.some((item) => /relevant personal question/i.test(item)), true);
  assert.match(result.feedback, /does not answer the Felix task/i);
});


test("all 28 A2 writing assignments have canonical semantic specs", () => {
  const specs = getA2WritingTaskSpecs();
  assert.equal(specs.length, 28);
  assert.equal(new Set(specs.map((spec) => spec.assignmentKey)).size, 28);
  for (const spec of specs) {
    assert.match(spec.assignmentKey, /^A2-\d+\.\d+$/);
    assert.ok(spec.taskText.length >= 10, spec.assignmentKey + " needs task text");
    assert.ok(["formal", "informal", "neutral"].includes(spec.register), spec.assignmentKey + " needs register");
    assert.ok(spec.taskPoints.length >= 3, spec.assignmentKey + " needs communicative points");
    assert.equal(spec.rubricVersion, A2_WRITING_RUBRIC_VERSION);
  }
});

test("canonical A2 spec overrides stale registry metadata beyond Day 1", () => {
  const task = resolveQuestionAwareWritingTask({
    referenceEntry: {
      assignmentKey: "A2-7.20",
      level: "A2",
      questionAwareWritingTask: {
        assignmentKey: "A2-7.20",
        level: "A2",
        textType: "informal_email",
        register: "informal",
        taskText: "Old generic writing task",
        taskPoints: ["Write something"],
      },
    },
    submission: { assignmentKey: "A2-7.20", level: "A2" },
  });
  assert.equal(task.textType, "complaint");
  assert.equal(task.register, "formal");
  assert.equal(task.taskPoints.length, 3);
  assert.match(task.taskText, /defective|unacceptable product/i);
});

import test from "node:test";
import assert from "node:assert/strict";

import {
  applyQuestionAwareWritingGuard,
  enrichOptionsWithQuestionAwareWritingTask,
  resolveQuestionAwareWritingTask,
} from "../src/utils/questionAwareWritingMarking.js";
import { B1_WRITING_RUBRIC_VERSION, getB1WritingTaskSpecs } from "../src/data/b1WritingTaskSpecs.js";
import { evaluateB1WritingTaskEvidence } from "../src/utils/b1WritingTaskEvidence.js";

const completeFriendship = `Teil 2
Liebe Anna,
wie geht es dir? Ich möchte dir von meiner besten Freundin Ama erzählen. Wir haben uns vor drei Jahren in einem Deutschkurs kennengelernt. Unsere Freundschaft ist besonders, weil sie ehrlich ist und mich immer unterstützt. Hast du am Samstag Zeit? Wollen wir uns um 15 Uhr im Café treffen?
Liebe Grüße
Felix`;

const opinionInsteadOfFriendshipEmail = `Teil 2
Meiner Meinung nach ist Freundschaft im Leben sehr wichtig. Einerseits braucht jeder Mensch Freunde, andererseits kann eine Freundschaft auch schwierig sein. In meinem Heimatland verbringen viele Menschen viel Zeit mit Freunden. Zusammenfassend denke ich, dass Vertrauen wichtig ist.`;

test("all 28 historical B1 semantic task specs remain structurally complete", () => {
  const specs = getB1WritingTaskSpecs();
  assert.equal(specs.length, 28);
  assert.equal(new Set(specs.map((spec) => spec.assignmentKey)).size, 28);
  for (const spec of specs) {
    assert.match(spec.assignmentKey, /^B1-\d+\.\d+$/);
    assert.ok(spec.taskText.length >= 20, spec.assignmentKey + " needs exact task text");
    assert.ok(["formal", "informal", "neutral"].includes(spec.register), spec.assignmentKey + " needs register");
    assert.ok(spec.taskPoints.length >= 3, spec.assignmentKey + " needs communicative points");
    assert.equal(spec.rubricVersion, B1_WRITING_RUBRIC_VERSION);
  }
});

test("every canonical B1 task point has a deterministic evidence rule", () => {
  for (const spec of getB1WritingTaskSpecs()) {
    const evidence = evaluateB1WritingTaskEvidence(spec, "");
    assert.equal(evidence.length, spec.taskPoints.length, spec.assignmentKey + " evidence length");
    assert.equal(evidence.some((item) => item.status === "review"), false, spec.assignmentKey + " has an unconfigured point");
  }
});

test("canonical B1 spec overrides stale registry metadata", () => {
  const task = resolveQuestionAwareWritingTask({
    referenceEntry: {
      assignmentKey: "B1-8.25",
      level: "B1",
      questionAwareWritingTask: {
        assignmentKey: "B1-8.25",
        level: "B1",
        textType: "informal_email",
        register: "informal",
        taskText: "Old generic task",
        taskPoints: ["Write something"],
      },
    },
    submission: { assignmentKey: "B1-8.25", level: "B1" },
  });

  assert.equal(task.textType, "complaint");
  assert.equal(task.register, "formal");
  assert.equal(task.taskPoints.length, 5);
  assert.equal(task.rubricVersion, B1_WRITING_RUBRIC_VERSION);
  assert.match(task.taskText, /damaged phone/i);
});

test("complete B1-1.2 friendship email is 3/3 and keeps its language score", () => {
  const enriched = enrichOptionsWithQuestionAwareWritingTask({
    referenceEntry: { assignmentKey: "B1-1.2", level: "B1" },
    submission: { assignmentKey: "B1-1.2", level: "B1" },
    submissionText: completeFriendship,
  });

  const result = applyQuestionAwareWritingGuard({
    level: "B1",
    assignmentKey: "B1-1.2",
    objectiveScore: 88,
    writingScore: 86,
    writingScorePercent: 86,
    finalScore: 87,
    score: 87,
    taskCompletion: { completed: 3, total: 3, missing: [] },
    missingTaskPoints: [],
    feedback: "Good B1 email.",
    status: "marked",
    confidence: 0.83,
  }, enriched, completeFriendship);

  assert.equal(result.writingScore, 86);
  assert.equal(result.taskCompletion.completed, 3);
  assert.equal(result.taskCompletion.total, 3);
  assert.equal(result.taskPointEvidence.length, 3);
  assert.equal(result.taskPointEvidence.every((item) => item.status === "met"), true);
  assert.equal(result.markingRubricVersion, B1_WRITING_RUBRIC_VERSION);
  assert.equal(result.writingDimensions.taskFulfilment, 100);
});

test("B1-1.2 opinion essay cannot pass as a friend-for-life email", () => {
  const enriched = enrichOptionsWithQuestionAwareWritingTask({
    referenceEntry: { assignmentKey: "B1-1.2", level: "B1" },
    submission: { assignmentKey: "B1-1.2", level: "B1" },
    submissionText: opinionInsteadOfFriendshipEmail,
  });

  const result = applyQuestionAwareWritingGuard({
    level: "B1",
    assignmentKey: "B1-1.2",
    objectiveScore: 90,
    writingScore: 92,
    writingScorePercent: 92,
    finalScore: 91,
    score: 91,
    taskCompletion: { completed: 3, total: 3, missing: [] },
    missingTaskPoints: [],
    feedback: "You addressed all task points.",
    status: "marked",
    confidence: 0.9,
  }, enriched, opinionInsteadOfFriendshipEmail);

  assert.equal(result.taskCompletion.completed, 0);
  assert.equal(result.taskCompletion.total, 3);
  assert.equal(result.taskPointEvidence.every((item) => item.status === "missing"), true);
  assert.equal(result.missingTaskPoints.length, 3);
  assert.equal(result.status, "needs_review");
  assert.equal(result.shouldSendAutomatically, false);
  assert.ok(result.writingScore <= 55);
  assert.ok(result.ai.markingContradictions?.some((item) => /taskCompletion reports complete/i.test(item)));
});

test("B1-8.25 historical complaint spec is inactive because the current workbook has no Schreiben", () => {
  const options = {
    referenceEntry: {
      assignmentKey: "B1-8.25",
      level: "B1",
      expectedParts: ["teil3"],
      writingParts: [],
      aiGradedParts: [],
      partGrading: {},
    },
    submission: { assignmentKey: "B1-8.25", level: "B1" },
  };

  assert.equal(resolveQuestionAwareWritingTask(options), null);

  const enriched = enrichOptionsWithQuestionAwareWritingTask(options);
  assert.equal(enriched.referenceEntry.questionAwareWritingTask, undefined);
  assert.equal(enriched.submission.questionAwareWritingTask, undefined);
});

test("B1 semantic completion does not automatically inflate an 86 writing score to 90", () => {
  const enriched = enrichOptionsWithQuestionAwareWritingTask({
    referenceEntry: { assignmentKey: "B1-1.2", level: "B1" },
    submission: { assignmentKey: "B1-1.2", level: "B1" },
    submissionText: completeFriendship,
  });

  const result = applyQuestionAwareWritingGuard({
    level: "B1",
    assignmentKey: "B1-1.2",
    objectiveScore: 90,
    writingScore: 86,
    writingScorePercent: 86,
    finalScore: 88,
    score: 88,
    taskCompletion: { completed: 3, total: 3, missing: [] },
    missingTaskPoints: [],
    corrections: [],
    feedback: "Complete and accurate.",
    status: "marked",
    confidence: 0.9,
  }, enriched, completeFriendship);

  assert.equal(result.writingScore, 86);
  assert.equal(result.writingScorePercent, 86);
});

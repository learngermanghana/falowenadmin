import test from "node:test";
import assert from "node:assert/strict";
import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";
import { buildC2SpeakingCoaching } from "../src/data/c2SpeakingCoaching.js";

test("all 28 C2 seminars show question-matched guidance without additional slides", () => {
  const lessons = getSlidesByCourse("C2");
  assert.equal(lessons.length, 28);
  for (const lesson of lessons) {
    const stages = buildTeachingPresenterStages(lesson, lesson.topic);
    const speaking = stages.find((stage) => stage.id === "questions");
    assert.ok(speaking, lesson.assignmentId);
    assert.equal(speaking.items.length, 1, lesson.assignmentId);
    assert.equal(speaking.coachingItems.length, 1, lesson.assignmentId);
    const question = speaking.items[0];
    const matchingModel = lesson.speakingModels.find((model) => model.questionDe === question);
    assert.ok(matchingModel?.modelAnswerDe, lesson.assignmentId);
    const coaching = speaking.coachingItems[0];
    assert.ok(coaching, lesson.assignmentId);
    assert.equal(coaching.questionDe, question);
    assert.ok(coaching.hintDe && coaching.retryDe);
    assert.ok(coaching.taskChecksDe.length);
    assert.equal(coaching.referenceIdeaDe.length > 0, true);
    assert.equal(coaching.lessonPitfallEn, ""); // no invented observations
  }
});

test("C2 coaching is absent rather than fabricated for missing models", () => {
  const slide = { course: "C2", speakingModels: [], studentQuestionsDe: ["Beurteile die These."] };
  assert.deepEqual(buildC2SpeakingCoaching(slide, slide.studentQuestionsDe), [null]);
  assert.deepEqual(buildC2SpeakingCoaching({ ...slide, course: "B1" }, slide.studentQuestionsDe), []);
});

test("C2 warm-up follow-ups use the day's own conceptual foundation", () => {
  for (const lesson of getSlidesByCourse("C2")) {
    const stages = buildTeachingPresenterStages(lesson, lesson.topic);
    const warmup = stages.find((stage) => stage.id === "warmup");
    assert.ok(warmup?.questionSupport?.length, lesson.assignmentId);
    for (const item of warmup.questionSupport) {
      assert.ok(item.followUpDe?.trim(), lesson.assignmentId);
      assert.ok(item.answerStarterDe?.trim(), lesson.assignmentId);
    }
    const vocabulary = stages.find((stage) => stage.id === "phrases");
    assert.ok(vocabulary, lesson.assignmentId);
    for (const challenge of vocabulary.challengeItems || []) {
      assert.match(challenge.followUp, /Kollokation.*Register/);
      assert.equal(challenge.options.length, 3);
    }
  }
});

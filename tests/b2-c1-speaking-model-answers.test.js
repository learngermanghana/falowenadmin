import test from "node:test";
import assert from "node:assert/strict";

import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { buildTeachingPresenterStages, getSpeakingQuestionModel } from "../src/utils/teachingPresenter.js";

for (const level of ["B2", "C1"]) {
  test(`${level} Days 1–28 have direct model answers for every speaking question`, () => {
    const slides = getSlidesByCourse(level);
    assert.equal(slides.length, 28);

    const allAnswers = [];
    for (const slide of slides) {
      assert.equal(slide.studentQuestionsDe.length, 5, `${slide.assignmentId} should have five speaking questions`);
      assert.equal(slide.speakingModels.length, 5, `${slide.assignmentId} should have five direct model answers`);
      assert.deepEqual(
        slide.speakingModels.map((item) => item.questionDe),
        slide.studentQuestionsDe,
        `${slide.assignmentId} model questions must match the visible questions exactly`,
      );

      const questionStage = buildTeachingPresenterStages(slide).find((stage) => stage.id === "questions");
      assert.ok(questionStage, `${slide.assignmentId} should expose the speaking stage`);
      assert.equal(questionStage.requiresQuestionModel, true, `${slide.assignmentId} must not fall back to generic support`);
      assert.equal(questionStage.questionModels.length, 5);

      for (const question of questionStage.items) {
        const model = getSpeakingQuestionModel(questionStage, question);
        assert.ok(model, `${slide.assignmentId} is missing a direct answer for: ${question}`);
        assert.equal(model.questionDe, question);
        assert.ok(model.modelAnswerDe.length >= 150, `${slide.assignmentId} answer is too thin: ${question}`);
        assert.equal(model.modelAnswerDe.includes("..."), false, `${slide.assignmentId} answer should be complete`);
        assert.equal(questionStage.supportItems.includes(model.modelAnswerDe), false, `${slide.assignmentId} should not reuse the generic lesson examples as the direct answer`);
        allAnswers.push(model.modelAnswerDe);
      }
    }

    assert.equal(allAnswers.length, 140);
    assert.equal(new Set(allAnswers).size, 140, `${level} should have 140 distinct question-specific answers`);
  });

  test(`${level} speaking reveal resolves by question text rather than array position`, () => {
    const slide = getSlidesByCourse(level)[0];
    const questionStage = buildTeachingPresenterStages(slide).find((stage) => stage.id === "questions");
    const targetQuestion = questionStage.items[3];
    const shuffled = { ...questionStage, questionModels: [...questionStage.questionModels].reverse() };

    assert.equal(getSpeakingQuestionModel(shuffled, targetQuestion)?.questionDe, targetQuestion);
    assert.equal(getSpeakingQuestionModel(shuffled, "Eine nicht vorhandene Frage"), null);
    assert.equal(getSpeakingQuestionModel({ ...shuffled, questionModels: [] }, targetQuestion), null);
  });
}

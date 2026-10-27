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

      for (const model of slide.speakingModels) {
        assert.ok(model.modelAnswerDe.length >= 150, `${slide.assignmentId} source answer is too thin: ${model.questionDe}`);
        assert.equal(model.modelAnswerDe.includes("..."), false, `${slide.assignmentId} source answer should be complete`);
        allAnswers.push(model.modelAnswerDe);
      }

      const questionStage = buildTeachingPresenterStages(slide).find((stage) => stage.id === "questions");
      assert.ok(questionStage, `${slide.assignmentId} should expose the speaking stage`);
      assert.equal(questionStage.requiresQuestionModel, true, `${slide.assignmentId} must not fall back to generic support`);
      assert.equal(questionStage.items.length, 1, `${slide.assignmentId} should show one deep discussion question`);
      assert.equal(questionStage.questionModels.length, 1);
      assert.equal(questionStage.items[0], slide.studentQuestionsDe.at(-1));
      const model = getSpeakingQuestionModel(questionStage, questionStage.items[0]);
      assert.ok(model, `${slide.assignmentId} is missing the direct discussion answer`);
      assert.equal(model.questionDe, questionStage.items[0]);
      assert.equal(questionStage.supportItems.includes(model.modelAnswerDe), false, `${slide.assignmentId} should not reuse generic lesson examples as the direct answer`);
    }

    assert.equal(allAnswers.length, 140);
    assert.equal(new Set(allAnswers).size, 140, `${level} should have 140 distinct question-specific answers`);
  });

  test(`${level} speaking reveal resolves by question text rather than array position`, () => {
    const slide = getSlidesByCourse(level)[0];
    const questionStage = buildTeachingPresenterStages(slide).find((stage) => stage.id === "questions");
    const targetQuestion = questionStage.items[0];
    const shuffled = { ...questionStage, questionModels: [...questionStage.questionModels].reverse() };

    assert.equal(getSpeakingQuestionModel(shuffled, targetQuestion)?.questionDe, targetQuestion);
    assert.equal(getSpeakingQuestionModel(shuffled, "Eine nicht vorhandene Frage"), null);
    assert.equal(getSpeakingQuestionModel({ ...shuffled, questionModels: [] }, targetQuestion), null);
  });
}

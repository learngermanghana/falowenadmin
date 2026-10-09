import test from "node:test";
import assert from "node:assert/strict";
import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";

for (const level of ["A2", "B1"]) {
  test(`${level}: 28 lesson summaries use the taught expressions and a real speaking question`, () => {
    const slides = getSlidesByCourse(level);
    assert.equal(slides.length, 28);
    for (const slide of slides) {
      const stages = buildTeachingPresenterStages(slide, slide.topic);
      const summary = stages.at(-1);
      assert.equal(summary.id, "lesson-summary", slide.assignmentId);
      assert.equal(stages.length, 9, slide.assignmentId);
      const expressions = summary.items.find(item => item.label === "Redemittel");
      const spoken = summary.items.find(item => item.label === "Sprechprobe");
      const check = summary.items.find(item => item.label === "Selbstcheck");
      assert.ok(expressions, slide.assignmentId + ": missing language check");
      assert.ok(spoken, slide.assignmentId + ": missing speaking exit check");
      assert.ok(check, slide.assignmentId + ": missing original wrap-up");
      assert.ok(expressions.detail.includes(slide.keyPhrasesDe[0]), slide.assignmentId);
      assert.ok(expressions.detail.includes(slide.keyPhrasesDe[1]), slide.assignmentId);
      assert.ok(spoken.detail.includes(slide.studentQuestionsDe.at(-1)), slide.assignmentId);
      assert.equal(check.detail, slide.wrapUpTaskDe, slide.assignmentId);
      assert.doesNotMatch([expressions.detail, spoken.detail].join(" "), /You can talk about|You can use today.s target grammar accurately/i, slide.assignmentId);
      assert.deepEqual(stages.slice(-3).map(s => s.id), ["questions", "workbook", "lesson-summary"], slide.assignmentId);
    }
  });

  test(`${level}: grammar-check answers follow authored lesson question models`, () => {
    for (const slide of getSlidesByCourse(level)) {
      if (Array.isArray(slide.grammarCheckItems) && slide.grammarCheckItems.length === 3) continue;
      const stage = buildTeachingPresenterStages(slide, slide.topic).find(s => s.id === "grammar-check");
      const sourceQuestions = slide.studentQuestionsDe || [];
      const models = slide.speakingModels || [];
      assert.equal(stage.items.length, 3, slide.assignmentId);
      if (models.length !== sourceQuestions.length) continue;
      for (const item of stage.items) {
        const sourceIndex = sourceQuestions.indexOf(item.prompt);
        assert.ok(sourceIndex >= 0, slide.assignmentId);
        const exactMatch = models.find(model => String(model.questionDe || "").trim() === item.prompt);
        const expectedAnswer = exactMatch?.modelAnswerDe || models[sourceIndex]?.modelAnswerDe;
        if (expectedAnswer) {
          assert.equal(item.answer, expectedAnswer, `${slide.assignmentId}: do not pair this grammar prompt with an unrelated answer`);
        }
      }
    }
  });
}

test("A2 Day 10 summary checks city-exploring language and a real student task", () => {
 const slide = getSlidesByCourse("A2").find(row => row.assignmentId === "A2-4.10");
 const summary = buildTeachingPresenterStages(slide, slide.topic).at(-1);
 assert.match(summary.items.find(x=>x.label==="Redemittel").detail,/entdecken/);
 assert.match(summary.items.find(x=>x.label==="Sprechprobe").detail,/Entdeckungstag/);
});

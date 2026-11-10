import test from "node:test";
import assert from "node:assert/strict";
import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";

const A2_GRAMMAR_PAGE_COUNTS = { 2: 4, 4: 2, 6: 2, 7: 2, 9: 3, 10: 2, 16: 2, 23: 3 };

for (const level of ["A2", "B1"]) {
  test(`${level}: each workbook grammar slide teaches before corrections and reading`, () => {
    const titles = new Set();
    for (const slide of getSlidesByCourse(level)) {
      const stages = buildTeachingPresenterStages(slide, slide.topic);
      const grammar = stages.filter(stage => stage.type === "workbook-grammar");
      assert.equal(grammar.length, (level === "A2" && A2_GRAMMAR_PAGE_COUNTS[slide.dayNumber]) || 1, slide.assignmentId);
      const first = stages.indexOf(grammar[0]);
      assert.deepEqual(stages.slice(first, first + grammar.length), grammar);
      assert.equal(stages[first + grammar.length].id, "common-mistakes", slide.assignmentId);
      titles.add(grammar[0].title);
      const items = grammar.flatMap(stage => stage.items);
      const rules = items.filter(item => item.example);
      const checks = items.filter(item => item.answer);
      assert.ok(rules.length >= 2 && rules.every(item => item.label && item.prompt), slide.assignmentId);
      assert.ok(checks.length > 0, slide.assignmentId);
      assert.ok(grammar.every(page => page.items.length >= 2 && page.items.length <= 4), slide.assignmentId);
      assert.ok(checks.every(item => item.prompt && !item.example), slide.assignmentId);
    }
    assert.equal(titles.size, 28);
  });

  test(`${level}: 28 lesson summaries use the taught expressions and a real speaking question`, () => {
    const slides = getSlidesByCourse(level);
    assert.equal(slides.length, 28);
    for (const slide of slides) {
      const stages = buildTeachingPresenterStages(slide, slide.topic);
      const summary = stages.find(stage => stage.id === "lesson-summary");
      assert.equal(summary.id, "lesson-summary", slide.assignmentId);
      assert.equal(new Set(stages.map(stage => stage.id)).size, stages.length, slide.assignmentId);
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
      assert.deepEqual(stages.slice(-4).map(s => s.id), (slide.course === "A2" ? ["questions", "workbook", "lesson-summary", "workbook-presentation"] : ["questions", "workbook-presentation", "workbook", "lesson-summary"]), slide.assignmentId);
    }
  });

  test(`${level}: grammar-check answers follow authored lesson question models`, () => {
    for (const slide of getSlidesByCourse(level)) {
      if (Array.isArray(slide.grammarCheckItems) && slide.grammarCheckItems.length === 3) continue;
      const stage = buildTeachingPresenterStages(slide, slide.topic).find(s => s.id === "grammar-check");
      const sourceQuestions = slide.studentQuestionsDe || [];
      const models = slide.speakingModels || [];
      assert.equal(stage.items.length, 3, slide.assignmentId);
      if (level === "A2") {
        assert.equal(stage.variant,"a2-application-lab",slide.assignmentId);
        assert.deepEqual(stage.items.map(item=>item.prompt),stage.lab.tasks.map(task=>task.prompt),slide.assignmentId);
        assert.deepEqual(stage.items.map(item=>item.answer),stage.lab.tasks.map(task=>task.answer),slide.assignmentId);
        continue;
      }
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

test("all 28 A2 decks use the Day 1 opening and finish with the workbook presentation", () => {
  const listeningDays = [1, 2, 3, 17, 18, 19, 20, 21, 23];
  for (const slide of getSlidesByCourse("A2")) {
    const stages = buildTeachingPresenterStages(slide);
    const music = stages.filter(stage => stage.variant === "interactive-music-video");
    const listening = stages.find(stage => stage.variant === "interactive-listening");
    assert.equal(music.length, 1, slide.assignmentId);
    assert.equal(stages[0].id, "intro", slide.assignmentId);
    assert.equal(stages[1], music[0], slide.assignmentId);
    assert.equal(music[0].musicVideo.day, slide.dayNumber, slide.assignmentId);
    assert.ok(stages.every(stage => stage.variant !== "interactive-warmup" && stage.title !== "Warm-up"), slide.assignmentId);
    assert.equal(Boolean(listening), listeningDays.includes(slide.dayNumber), slide.assignmentId);
    if (listening) {
      assert.ok(listening.audioKey && listening.listeningItems.length, slide.assignmentId);
      assert.equal(stages[2], listening, slide.assignmentId);
    }
    assert.equal(stages[listening ? 3 : 2].id, "workbook-grammar", slide.assignmentId);
    assert.equal(stages.filter(stage => stage.id === "workbook-presentation").length, 1, slide.assignmentId);
    assert.equal(stages.at(-1).id, "workbook-presentation", slide.assignmentId);
  }
});

test("A2 Day 10 summary checks city-exploring language and a real student task", () => {
 const slide = getSlidesByCourse("A2").find(row => row.assignmentId === "A2-4.10");
 const summary = buildTeachingPresenterStages(slide, slide.topic).find(stage => stage.id === "lesson-summary");
 assert.match(summary.items.find(x=>x.label==="Redemittel").detail,/entdecken/);
 assert.match(summary.items.find(x=>x.label==="Sprechprobe").detail,/Entdeckungstag/);
});

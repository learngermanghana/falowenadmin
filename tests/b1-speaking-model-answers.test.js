import test from "node:test";
import assert from "node:assert/strict";
import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { buildTeachingPresenterStages, getSpeakingQuestionModel } from "../src/utils/teachingPresenter.js";

test("all 140 B1 speaking questions have distinct, complete, question-keyed answers", () => {
  const slides = getSlidesByCourse("B1");
  assert.equal(slides.length, 28);
  const answers = new Set();
  for (const slide of slides) {
    const stage = buildTeachingPresenterStages(slide).find((item) => item.id === "questions");
    assert.equal(stage.requiresQuestionModel, true);
    assert.equal(stage.questionModels.length, 5);
    assert.deepEqual(stage.questionModels.map((item) => item.questionDe), stage.items);
    for (const question of stage.items) {
      const model = getSpeakingQuestionModel(stage, question);
      assert.ok(model?.modelAnswerDe.length > 70, `${slide.assignmentId}: ${question}`);
      assert.doesNotMatch(model.modelAnswerDe, /\.\.\.|…/);
      assert.ok(!stage.supportItems.includes(model.modelAnswerDe));
      assert.ok(!answers.has(model.modelAnswerDe), "Do not reuse generic answers");
      answers.add(model.modelAnswerDe);
    }
    // Moving forwards, backwards or randomly must resolve by question, not list position.
    const reordered = { ...stage, questionModels: [...stage.questionModels].reverse() };
    for (const index of [0, 4, 1, 3, 2, 0]) {
      assert.deepEqual(getSpeakingQuestionModel(reordered, stage.items[index]), stage.questionModels[index]);
    }
    assert.equal(getSpeakingQuestionModel(stage, "A newly added question"), null);
    assert.equal(getSpeakingQuestionModel({ ...stage, questionModels: [] }, stage.items[0]), null);
  }
  assert.equal(answers.size, 140);
});

test("B1 compound questions and required grammar have explicit answers", () => {
  const slides = getSlidesByCourse("B1");
  const answer = (day, index) => slides.find((s) => s.dayNumber === day).speakingModels[index].modelAnswerDe;
  assert.match(answer(1, 0), /weil.*Außerdem/s);
  assert.equal((answer(5, 1).match(/\?/g) || []).length, 4);
  assert.match(answer(5, 2), /ob die Wohnung noch frei ist/);
  assert.match(answer(7, 2), /Wegen ihres hohen Zuckergehalts/);
  assert.match(answer(7, 3), /Trotz meines vollen Terminkalenders/);
  assert.match(answer(9, 2), /damit.*indem/s);
  assert.match(answer(10, 3), /Je weniger.*desto/s);
  assert.match(answer(13, 3), /wurde.*gedreht/s);
});

test("each day's first answer stays on its own lesson topic", () => {
  const topics = ["Traumberuf", "Freundschaft", "Erfolgsgeschichte", "Online-Portale", "Besichtigungstermin", "Stadt", "Hausmannskost", "gesunde Lebensweise", "Work-Life-Balance", "digitale Auszeiten", "Teamspiele", "Abenteuer", "Filmbeispiel", "Präsenzunterricht", "Homeoffice", "Prüfungsangst", "Wörter", "Lehrers", "Alex Mensah", "Koch", "WG", "Partner", "Café", "konsumieren", "Online-Shopping", "Flug", "Wasser", "Energie"];
  for (const slide of getSlidesByCourse("B1")) {
    assert.ok(slide.speakingModels[0].modelAnswerDe.includes(topics[slide.dayNumber - 1]), slide.assignmentId);
  }
});

test("other levels retain lesson-level model support", () => {
  for (const level of ["A1", "B2", "C1"]) {
    for (const slide of getSlidesByCourse(level)) {
      const stage = buildTeachingPresenterStages(slide).find((item) => item.type === "question-reveal");
      if (!stage) continue;
      assert.equal(stage.requiresQuestionModel, false);
      assert.ok(stage.supportItems.length > 0);
    }
  }
});

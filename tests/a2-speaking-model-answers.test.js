import test from "node:test";
import assert from "node:assert/strict";
import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { buildTeachingPresenterStages, getSpeakingQuestionModel } from "../src/utils/teachingPresenter.js";

test("all 141 A2 speaking questions have complete, distinct, question-keyed answers", () => {
  const slides = getSlidesByCourse("A2");
  assert.equal(slides.length, 28);
  assert.deepEqual(slides.map(s => s.dayNumber), Array.from({length: 28}, (_, i) => i + 1));
  const answers = new Set();
  for (const slide of slides) {
    const stage = buildTeachingPresenterStages(slide).find(s => s.id === "questions");
    assert.equal(stage.requiresQuestionModel, true);
    assert.equal(stage.questionModels.length, slide.dayNumber === 1 ? 6 : 5);
    assert.deepEqual(stage.questionModels.map(m => m.questionDe), stage.items);
    for (const question of stage.items) {
      const model = getSpeakingQuestionModel(stage, question);
      assert.ok(model.modelAnswerDe.length > 50, `${slide.assignmentId}: ${question}`);
      assert.doesNotMatch(model.modelAnswerDe, /\.\.\.|…/);
      assert.ok(!stage.supportItems.includes(model.modelAnswerDe));
      assert.ok(!answers.has(model.modelAnswerDe), "No repeated template answers");
      answers.add(model.modelAnswerDe);
    }
    const reordered = {...stage, questionModels: [...stage.questionModels].reverse()};
    for (const index of [0, 4, 1, 3, 2, 0]) {
      assert.deepEqual(getSpeakingQuestionModel(reordered, stage.items[index]), stage.questionModels[index]);
    }
    assert.equal(getSpeakingQuestionModel(stage, "A new question"), null);
    assert.equal(getSpeakingQuestionModel({...stage, questionModels: []}, stage.items[0]), null);
  }
  assert.equal(answers.size, 141);
});

test("A2 answers stay aligned with all 28 daily topics", () => {
  const topics = ["Familie", "Freundin", "Schwester", "Film", "Fußball", "Wohnzimmer", "Wohnung", "Reis", "Cape Coast", "Musikfest", "Bus", "Koch", "Alex Mensah", "Verkäufer", "Fußball", "Wohlbefinden", "Husten", "Konto", "Geschäft", "Wasserkocher", "Wochenende", "Montag", "Bus", "Hamburg", "sechs Uhr", "Prüfung", "WhatsApp", "Deutschkenntnisse"];
  for (const slide of getSlidesByCourse("A2")) {
    assert.ok(slide.speakingModels[0].modelAnswerDe.includes(topics[slide.dayNumber - 1]), slide.assignmentId);
  }
});

test("A2 model answers demonstrate requested grammar and cover multipart questions", () => {
  const slides = getSlidesByCourse("A2");
  const answer = (day, index) => slides.find(s => s.dayNumber === day).speakingModels[index].modelAnswerDe;
  assert.match(answer(3, 0), /genauso groß wie/);
  assert.equal((answer(3, 1).match(/ als /g) || []).length, 2);
  assert.match(answer(4, 1), /vor dem Kino/);
  assert.match(answer(4, 2), /in ein Restaurant/);
  assert.match(answer(5, 3), /stehe.*auf.*kaufe.*ein.*rufe.*an/s);
  assert.match(answer(7, 2), /Wohnung, die/);
  assert.match(answer(8, 2), /Wasche.*Schneide.*Koche/s);
  assert.match(answer(10, 3), /war.*hatten/s);
  assert.match(answer(13, 2), /konnte/);
  assert.match(answer(13, 3), /musste/);
  assert.equal((answer(14, 3).match(/um /g) || []).length, 2);
  assert.match(answer(15, 1), /seit zwei Jahren/);
  assert.match(answer(16, 1), /wasche mich.*entspanne ich mich/s);
  assert.match(answer(20, 1), /weil er nicht funktioniert/);
  assert.match(answer(21, 4), /ob meine Freunde.*Zeit haben/);
  assert.match(answer(28, 1), /werde.*besuchen/s);
  assert.equal((answer(11, 3).match(/\?/g) || []).length, 3);
});

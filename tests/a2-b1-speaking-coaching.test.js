import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { buildA2B1SpeakingCoaching } from "../src/data/a2B1SpeakingCoaching.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";

test("all 56 A2/B1 lessons use their own verified speaking answers for coaching", () => {
  for (const level of ["A2", "B1"]) {
    const slides = getSlidesByCourse(level);
    assert.equal(slides.length, 28, `${level}: expected 28 lessons`);

    for (const slide of slides) {
      const questions = slide.studentQuestionsDe || [];
      const models = slide.speakingModels || [];
      const items = buildA2B1SpeakingCoaching(slide, questions);
      assert.equal(items.length, questions.length, `${slide.assignmentId}: missing coaching slots`);
      assert.equal(models.length, questions.length, `${slide.assignmentId}: missing source models`);

      for (let index = 0; index < questions.length; index += 1) {
        const item = items[index];
        const model = models[index];
        assert.ok(item, `${slide.assignmentId} question ${index + 1}: no verified coaching`);
        assert.equal(item.questionDe, questions[index]);
        assert.equal(model.questionDe, questions[index], `${slide.assignmentId}: model paired to wrong question`);
        assert.ok(model.modelAnswerDe.startsWith(item.referenceIdeaDe), `${slide.assignmentId}: feedback not anchored to the exact answer`);
        assert.ok(item.hintDe.length > 12, `${slide.assignmentId}: speaking hint missing`);
        assert.ok(item.retryDe.length > 12, `${slide.assignmentId}: retry missing`);
        assert.notEqual(item.hintDe, model.modelAnswerDe, `${slide.assignmentId}: hint must not reveal full answer`);
        if (item.languageFocusEn) {
          assert.ok(slide.teacherSupport?.grammarFocusEn?.includes(item.languageFocusEn), `${slide.assignmentId}: grammar guidance not lesson-authored`);
        }
        if (item.commonErrorEn) {
          assert.ok(slide.teacherSupport?.commonMistakesEn?.includes(item.commonErrorEn), `${slide.assignmentId}: correction not lesson-authored`);
        }
        const sourcePhraseUsed = (slide.keyPhrasesDe || []).some((phrase) => item.hintDe.includes(phrase));
        assert.ok(sourcePhraseUsed || item.hintDe.includes(model.modelAnswerDe.split(/\s+/).slice(0, 2).join(" ")),
          `${slide.assignmentId}: hint uses neither a lesson phrase nor its own model starter`);
      }

      const speaking = buildTeachingPresenterStages(slide, slide.topic)
        .find((stage) => stage.id === "questions");
      assert.ok(speaking, `${slide.assignmentId}: speaking stage disappeared`);
      if (speaking.type === "question-reveal") {
        assert.equal(speaking.coachingItems.length, speaking.items.length, `${slide.assignmentId}: selected question coaching mismatch`);
        for (let index = 0; index < speaking.items.length; index += 1) {
          assert.equal(speaking.coachingItems[index]?.questionDe, speaking.items[index],
            `${slide.assignmentId}: selected feedback belongs to a different question`);
        }
      } else {
        assert.equal(speaking.type, "flow", `${slide.assignmentId}: special speaking format changed`);
      }
    }
  }
});

test("unverified models never acquire guessed hints or corrections", () => {
  const emptySlide = {
    course: "A2",
    studentQuestionsDe: ["Wie ist dein Wochenende?"],
    speakingModels: [],
    keyPhrasesDe: ["Am Wochenende ..."],
  };
  assert.deepEqual(buildA2B1SpeakingCoaching(emptySlide, emptySlide.studentQuestionsDe), [null]);
  assert.deepEqual(buildA2B1SpeakingCoaching({ ...emptySlide, course: "C1" }, emptySlide.studentQuestionsDe), []);
});

test("speaking feedback is teacher-controlled and does not replace participation marking", () => {
  const presenter = fs.readFileSync("src/components/TeachingSlidePresenter.jsx", "utf8");
  const picker = fs.readFileSync("src/components/PresenterStudentPicker.jsx", "utf8");
  const css = fs.readFileSync("src/components/TeachingSlidePresenter.css", "utf8");

  assert.match(presenter, /Sprachhilfe · vor der Antwort/);
  assert.match(presenter, /Lehrerfeedback · nach der Antwort/);
  assert.match(presenter, /showSpeakingHint && activeCoaching/);
  assert.match(presenter, /showSpeakingFeedback && activeCoaching/);
  assert.match(presenter, /getSpeakingQuestionModel\(stage, activeQuestion\)/);
  assert.match(presenter, /setShowSpeakingFeedback\(false\)/);
  assert.match(css, /\.presenter-speaking-coaching-feedback/);
  for (const status of ["Correct", "Needs review", "Skip", "Absent"]) {
    assert.ok(picker.includes(`>${status}</button>`), `marking option ${status} must remain available`);
  }
});

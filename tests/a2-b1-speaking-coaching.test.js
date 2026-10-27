import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { buildA2B1SpeakingCoaching, speakingTaskChecks } from "../src/data/a2B1SpeakingCoaching.js";
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


test("each A2/B1 spoken answer has question-grounded content checks and a targeted second try", () => {
  for (const level of ["A2", "B1"]) {
    for (const slide of getSlidesByCourse(level)) {
      const questions = slide.studentQuestionsDe || [];
      const coaching = buildA2B1SpeakingCoaching(slide, questions);
      const retries = new Set();
      for (let i = 0; i < questions.length; i += 1) {
        const item = coaching[i];
        const model = slide.speakingModels[i];
        assert.ok(item, slide.assignmentId + " missing item " + i);
        assert.ok(item.taskChecksDe?.length, slide.assignmentId + " lacks question-specific content criteria");
        assert.ok(item.taskChecksDe.every((check) => check.length > 20), slide.assignmentId + " has an empty content criterion");
        assert.ok(item.retryDe.includes(questions[i]), slide.assignmentId + " retry belongs to a different question");
        assert.ok(model.modelAnswerDe.startsWith(item.referenceIdeaDe), slide.assignmentId + " wrong question evidence");
        if (item.supportingIdeaDe) {
          assert.ok(model.modelAnswerDe.includes(item.supportingIdeaDe), slide.assignmentId + " unsupported second model detail");
        }
        if (slide.teacherSupport?.grammarFocusEn?.length) {
          assert.ok(slide.teacherSupport.grammarFocusEn.includes(item.lessonGrammarFocusEn),
            slide.assignmentId + " grammar note not authored for this lesson");
        }
        if (slide.teacherSupport?.commonMistakesEn?.length) {
          assert.ok(slide.teacherSupport.commonMistakesEn.includes(item.lessonPitfallEn),
            slide.assignmentId + " mistake warning not authored for this lesson");
        }
        retries.add(item.retryDe);
      }
      assert.equal(retries.size, questions.length, slide.assignmentId + ": generic/repeated speaking retries");
    }
  }
});

test("task checks match what the student was actually asked to do", () => {
  assert.match(speakingTaskChecks("Welche drei Aktivitäten würdest du wählen?")[0], /drei/);
  assert.ok(speakingTaskChecks("Welche Vor- und Nachteile hat die WG?").some((item) => /beide Seiten/.test(item)));
  assert.ok(speakingTaskChecks("Warum ist Teamarbeit wichtig?").some((item) => /Begründung/.test(item)));
  assert.ok(speakingTaskChecks("Wo und wann war dein Abenteuer?").some((item) => /Zeitpunkt/.test(item)));
  assert.ok(speakingTaskChecks("Wo und wann war dein Abenteuer?").some((item) => /Ort/.test(item)));
  assert.deepEqual(speakingTaskChecks(""), []);
});

test("feedback is explicitly conditional on listening to the learner and not presented as automatic grading", () => {
  const presenter = fs.readFileSync("src/components/TeachingSlidePresenter.jsx", "utf8");
  assert.match(presenter, /activeCoaching\.taskChecksDe/);
  assert.match(presenter, /activeCoaching\.supportingIdeaDe/);
  assert.match(presenter, /activeCoaching\.lessonGrammarFocusEn/);
  assert.match(presenter, /activeCoaching\.lessonPitfallEn/);
  assert.match(presenter, /wenn tatsächlich gehört/);
  assert.match(presenter, /Keine automatische Bewertung/);
  assert.match(presenter, /showSpeakingFeedback && activeCoaching/);
});

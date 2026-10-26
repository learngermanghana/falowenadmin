import test from "node:test";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { getInteractiveLessonOpening, isInteractiveOpeningStage } from "../src/data/interactiveLessonOpenings.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";
import { B1_DAY25_AUDIO_KEY, B1_DAY25_LISTENING } from "../src/data/b1Day25Listening.js";

test("B1 Day 25 uses the published YouTube video only on slide 2 and retains R2 Hören on slide 3", () => {
  const slide = getSlidesByCourse("B1").find((row) => row.assignmentId === "B1-8.25");
  assert.ok(slide);
  const stages = buildTeachingPresenterStages(slide, slide.topic);

  assert.deepEqual(stages.map((stage) => stage.id), [
    "intro", "warmup", "knowledge", "phrases", "grammar-check",
    "scenario-challenge", "questions", "workbook", "lesson-summary",
  ]);
  assert.equal(stages[0].musicIntro, undefined);
  assert.equal(stages[1].variant, "interactive-music-video");
  assert.equal(stages[1].musicVideo.youtubeId, "ArWT0uVqUxo");
  assert.equal(stages[1].timingMode, "");
  assert.equal(stages[1].suggestedMinutes, 0);
  assert.match(stages[1].musicVideo.nextStep, /Hören-Aufgabe/);
  assert.ok(!stages[1].challengeItems?.length);

  assert.equal(stages[2].variant, "interactive-listening");
  assert.equal(stages[2].audioKey, B1_DAY25_AUDIO_KEY);
  assert.equal(stages[2].audioKey, "b1/day-25/day-25.mp3");
  assert.equal(stages[2].listeningItems.length, 5);
  assert.equal(stages[2].transcript, B1_DAY25_LISTENING.transcript);
  assert.equal(stages[2].transcript.length, 0, "do not invent a transcript for the revised audio");
  assert.equal(stages[2].musicVideo, undefined);
  assert.equal(isInteractiveOpeningStage("B1-8.25", "warmup"), false);
  assert.equal(isInteractiveOpeningStage("B1-8.25", "knowledge"), true);

  // The remaining teaching stages, speaking, workbook, and assessment contract
  // are unchanged. The music is a teacher-led, unscored introduction.
  assert.deepEqual(stages.slice(3).map((stage) => stage.id), [
    "phrases", "grammar-check", "scenario-challenge", "questions", "workbook", "lesson-summary",
  ]);
});

test("B1 Day 24 original music + reading format and A2 signed-audio lessons remain separate", () => {
  const day24 = getSlidesByCourse("B1").find((row) => row.assignmentId === "B1-8.24");
  const stages24 = buildTeachingPresenterStages(day24, day24.topic);
  assert.equal(stages24[1].musicVideo.youtubeId, "-46siG9FrfE");
  assert.equal(stages24[2].variant, "interactive-music-reading");
  for (const id of ["A2-6.17", "A2-7.18", "A2-7.20"]) {
    const slide = getSlidesByCourse("A2").find((row) => row.assignmentId === id);
    const stages = buildTeachingPresenterStages(slide, slide.topic);
    const listening = getInteractiveLessonOpening(id).listening;
    assert.ok(listening.audioKey);
    assert.equal(stages.find((stage) => stage.id === "knowledge").variant, "interactive-listening");
  }
});


test("B1 Day 25 projector scenario remains scrollable and action buttons stay within a safe area", () => {
  const css = requireCss();
  const presenter = requirePresenter();
  assert.match(css, /presenter-has-day25-scenario/);
  assert.match(css, /presenter-content-day25-scenario/);
  assert.match(css, /overflow-y:\s*auto/);
  assert.match(css, /scroll-padding-bottom:\s*6\.5rem/);
  assert.match(css, /presenter-career-controls/);
  assert.match(presenter, /isDay25ScenarioStage/);
  assert.match(presenter, /presenter-has-day25-scenario/);
  assert.match(presenter, /presenter-content-day25-scenario/);
});

function requireCss() {
  return readFileSync(new URL("../src/components/TeachingSlidePresenter.css", import.meta.url), "utf8");
}
function requirePresenter() {
  return readFileSync(new URL("../src/components/TeachingSlidePresenter.jsx", import.meta.url), "utf8");
}

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { getInteractiveLessonOpening, isInteractiveOpeningStage } from "../src/data/interactiveLessonOpenings.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";
import { A2_DAY18_BANK_AUDIO_KEY, A2_DAY18_BANK_LISTENING } from "../src/data/a2Day18BankListening.js";

test("A2 Day 18 follows B1 Day 25: music on slide 2 and existing R2 Hören on slide 3", () => {
  const slide = getSlidesByCourse("A2").find((item) => item.assignmentId === "A2-7.18");
  assert.ok(slide);
  const stages = buildTeachingPresenterStages(slide, slide.topic);
  const lesson = getInteractiveLessonOpening("A2-7.18");

  assert.equal(stages[0].id, "intro");
  assert.equal(stages[1].id, "warmup");
  assert.equal(stages[1].variant, "interactive-music-video");
  assert.equal(stages[1].musicVideo.youtubeId, "pXAxzMMXHoE");
  assert.equal(stages[1].musicVideo.level, "A2");
  assert.match(stages[1].musicVideo.title, /Meine Karte ist gesperrt/);
  assert.equal(stages[1].suggestedMinutes, 0);
  assert.equal(stages[1].timingMode, "");
  assert.equal(stages[1].challengeItems?.length || 0, 0);
  assert.match(stages[1].teacherPurpose.student, /Amirs Geschichte/);
  assert.match(stages[1].teacherPurpose.teacher, /Cloudflare R2/);
  assert.equal(lesson.musicIntro.mediaType, "music");
  assert.equal(lesson.musicIntro.audioKey, undefined);

  assert.equal(stages[2].id, "knowledge");
  assert.equal(stages[2].variant, "interactive-listening");
  assert.equal(stages[2].audioKey, "a2/day-18/bank-telefonat.mp3");
  assert.equal(stages[2].audioKey, A2_DAY18_BANK_AUDIO_KEY);
  assert.equal(stages[2].listeningItems.length, 5);
  assert.strictEqual(stages[2].transcript, A2_DAY18_BANK_LISTENING.transcript);
  assert.deepEqual(stages[2].listeningItems, A2_DAY18_BANK_LISTENING.questions);
  assert.equal(stages[2].musicVideo, undefined);
  assert.equal(isInteractiveOpeningStage("A2-7.18", "warmup"), false);
  assert.equal(isInteractiveOpeningStage("A2-7.18", "knowledge"), true);
  const remainingIds = stages.slice(3).map((stage) => stage.id);
  assert.equal(remainingIds.length, 6, "do not add or remove teaching slides");
  assert.deepEqual(remainingIds.slice(0, 2), ["phrases", "grammar-check"]);
  assert.ok(["practice", "scenario-challenge"].includes(remainingIds[2]));
  assert.deepEqual(remainingIds.slice(3), ["questions", "workbook", "lesson-summary"]);
});

test("music screen displays A2 instead of hard-coded B1 without changing B1 Day 25", () => {
  const stage = readFileSync(new URL("../src/components/MusicTeachingStages.jsx", import.meta.url), "utf8");
  assert.match(stage, /music\.level \|\| "B1"/);
  const b1Slide = getSlidesByCourse("B1").find((item) => item.assignmentId === "B1-8.25");
  const b1Stages = buildTeachingPresenterStages(b1Slide, b1Slide.topic);
  assert.equal(b1Stages[1].musicVideo.youtubeId, "ArWT0uVqUxo");
  assert.equal(b1Stages[2].variant, "interactive-listening");
  assert.equal(b1Stages[2].audioKey, "b1/day-25/day-25.mp3");
});

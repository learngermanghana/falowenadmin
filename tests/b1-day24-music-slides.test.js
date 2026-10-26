import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { getInteractiveLessonOpening, isInteractiveOpeningStage } from "../src/data/interactiveLessonOpenings.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";
import { musicMomentUrl, musicTimestamp } from "../src/utils/musicTeaching.js";

test("B1 Day 24 has YouTube music on slide 2 and deeper lyric reading on slide 3", () => {
  const slide = getSlidesByCourse("B1").find((item) => item.assignmentId === "B1-8.24");
  assert.ok(slide);
  const stages = buildTeachingPresenterStages(slide, slide.topic);

  assert.deepEqual(stages.map((item) => item.id), [
    "intro", "warmup", "knowledge", "phrases", "grammar-check",
    "practice", "questions", "workbook", "lesson-summary",
  ]);

  assert.equal(stages[0].musicIntro, undefined, "intro must not duplicate the YouTube video");
  assert.equal(stages[1].variant, "interactive-music-video");
  assert.equal(stages[1].type, "list");
  assert.equal(stages[1].musicVideo.youtubeId, "-46siG9FrfE");
  assert.equal(stages[1].timingMode, "", "per-student timer is disabled only on the video slide");
  assert.equal(stages[1].musicVideo.audioKey, undefined, "music is not Cloudflare audio");

  assert.equal(stages[2].variant, "interactive-music-reading");
  assert.equal(stages[2].type, "knowledge");
  assert.equal(stages[2].musicReading.questions.length, 5);
  assert.equal(stages[2].musicReading.readingSections.length, 4);
  assert.deepEqual(
    stages[2].musicReading.questions.map(({ timestamp }) => timestamp),
    [32, 81, 91, 37, 136],
  );

  // The remaining 6 stages are the existing curriculum flow, including
  // the original graded-unrelated teacher-led B1 grammar and speaking.
  assert.deepEqual(stages.slice(3).map((stage) => stage.id), [
    "phrases", "grammar-check", "practice", "questions", "workbook", "lesson-summary",
  ]);
  assert.equal(stages[6].type, "question-reveal");
  assert.equal(stages[6].items.length, 3);
  assert.equal(stages[4].items.length, 3);

  const song = getInteractiveLessonOpening("B1-8.24").listening;
  assert.equal(song.mediaType, "music");
  assert.equal(song.youtubeId, "-46siG9FrfE");
  assert.ok(song.questions.every((q) =>
    q.options[q.correctIndex] === q.answer && q.evidence && q.explanation && q.hint
    && Number.isInteger(q.timestamp) && q.timestamp >= 0 && q.timestamp < 219));
  assert.equal(isInteractiveOpeningStage("B1-8.24", "warmup"), false);
  assert.equal(isInteractiveOpeningStage("B1-8.24", "knowledge"), false);
});

test("all other R2 Hören lessons continue unchanged, with signed audio", () => {
  for (const assignmentId of ["A2-6.17", "A2-7.18", "A2-7.20", "B1-8.25"]) {
    const lesson = getInteractiveLessonOpening(assignmentId);
    const level = assignmentId.split("-")[0];
    const slide = getSlidesByCourse(level).find((row) => row.assignmentId === assignmentId);
    const knowledge = buildTeachingPresenterStages(slide, slide.topic).find((stage) => stage.id === "knowledge");
    assert.ok(lesson.listening.audioKey, assignmentId);
    assert.equal(knowledge.variant, "interactive-listening", assignmentId);
    assert.equal(isInteractiveOpeningStage(assignmentId, "knowledge"), true);
  }
});

test("teacher can follow up answer evidence by seeking to the correct moment", () => {
  assert.equal(musicTimestamp(136), "02:16");
  assert.equal(musicTimestamp(81), "01:21");
  assert.equal(musicMomentUrl("-46siG9FrfE", 136),
    "https://www.youtube.com/watch?v=-46siG9FrfE&t=136s");
  assert.equal(musicMomentUrl("invalid", 30), "");

  const stage = fs.readFileSync("src/components/MusicTeachingStages.jsx", "utf8");
  const presenter = fs.readFileSync("src/components/TeachingSlidePresenter.jsx", "utf8");
  const css = fs.readFileSync("src/components/TeachingSlidePresenter.css", "utf8");

  assert.match(stage, /MusicVideoEmbed/);
  assert.match(stage, /musicMomentUrl/);
  assert.match(stage, /musicTimestamp/);
  assert.match(stage, /Textstelle im Lied/);
  assert.match(stage, /Im YouTube-Video ab/);
  assert.match(stage, /setRevealed/);
  assert.match(presenter, /<MusicVideoStage music=\{stage\.musicVideo\}/);
  assert.match(presenter, /<MusicReadingStage key=/);
  assert.match(presenter, /!isMusicVideoStage/);
  assert.match(css, /presenter-has-music-video/);
  assert.match(css, /presenter-session-timer-copy/);
});

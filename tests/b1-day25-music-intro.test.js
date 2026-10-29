import test from "node:test";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { getInteractiveLessonOpening, isInteractiveOpeningStage } from "../src/data/interactiveLessonOpenings.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";
import { B1_DAY25_AUDIO_KEY, B1_DAY25_LISTENING } from "../src/data/b1Day25Listening.js";

test("B1 Day 25 has direct lesson music with its independent R2 Hören and approved slide flow", () => {
  const slide=getSlidesByCourse("B1").find(row=>row.assignmentId==="B1-8.25");
  const stages=buildTeachingPresenterStages(slide,slide.topic);
  assert.deepEqual(stages.map(x=>x.id),["intro","warmup","knowledge","common-mistakes","reading","grammar-check",
    "scenario-challenge","questions","workbook","lesson-summary"]);
  assert.equal(stages[1].variant,"interactive-music-video");
  assert.equal(stages[1].musicVideo.youtubeId,undefined);
  assert.equal(stages[1].musicVideo.mediaType,"music");
  assert.equal(stages[1].musicVideo.musicLibraryUrl,"https://music.falowen.app/?level=B1&day=25");
  assert.equal(stages[1].timingMode,"");
  assert.equal(stages[2].variant,"interactive-listening");
  assert.equal(stages[2].audioKey,B1_DAY25_AUDIO_KEY);
  assert.equal(stages[2].audioKey,"b1/day-25/day-25.mp3");
  assert.equal(stages[2].listeningItems.length,5);
  assert.equal(stages[2].transcript,B1_DAY25_LISTENING.transcript);
  assert.equal(stages[2].transcript.length,0);
  assert.equal(stages[2].musicVideo,undefined);
  assert.equal(isInteractiveOpeningStage("B1-8.25","warmup"),false);
  assert.equal(isInteractiveOpeningStage("B1-8.25","knowledge"),true);
});

test("B1 Day 24 music-reading and A2 signed conversation Hören remain separate", () => {
  const slide=getSlidesByCourse("B1").find(row=>row.assignmentId==="B1-8.24");
  const stages=buildTeachingPresenterStages(slide,slide.topic);
  assert.equal(stages[1].musicVideo.musicLibraryUrl,"https://music.falowen.app/?level=B1&day=24");
  assert.equal(stages[2].variant,"interactive-music-reading");
  for(const id of ["A2-6.17","A2-7.18","A2-7.20"]){
    const s=getSlidesByCourse("A2").find(row=>row.assignmentId===id);
    assert.ok(getInteractiveLessonOpening(id).listening.audioKey);
    assert.equal(buildTeachingPresenterStages(s,s.topic).find(x=>x.id==="knowledge").variant,"interactive-listening");
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

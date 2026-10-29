import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { getInteractiveLessonOpening, isInteractiveOpeningStage } from "../src/data/interactiveLessonOpenings.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";
import { musicMomentUrl, musicTimestamp } from "../src/utils/musicTeaching.js";

test("B1 Day 24 uses direct music with verified in-slide lyrics, MCQs and original deep-reading page", () => {
  const slide=getSlidesByCourse("B1").find(row=>row.assignmentId==="B1-8.24");
  const stages=buildTeachingPresenterStages(slide,slide.topic);
  assert.equal(stages.length,10);
  assert.deepEqual(stages.slice(0,6).map(x=>x.id),
    ["intro","warmup","knowledge","common-mistakes","reading","grammar-check"]);
  assert.equal(stages[1].variant,"interactive-music-video");
  assert.equal(stages[1].musicVideo.mediaType,"music");
  assert.equal(stages[1].musicVideo.youtubeId,undefined);
  assert.equal(stages[1].musicVideo.musicLibraryUrl,"https://music.falowen.app/?level=B1&day=24");
  assert.equal(stages[1].timingMode,"");
  assert.equal(stages[2].variant,"interactive-music-reading");
  assert.equal(stages[2].musicReading.questions.length,5);
  assert.equal(stages[2].musicReading.readingSections.length,4);
  assert.ok(stages[2].musicReading.questions.every(q=>q.options[q.correctIndex]===q.answer));
  assert.equal(stages[3].items.length>=2,true);
  assert.ok(stages[4].textDe);
  assert.equal(isInteractiveOpeningStage("B1-8.24","warmup"),false);
  assert.equal(isInteractiveOpeningStage("B1-8.24","knowledge"),false);
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


test("B1 Day 24 Argumentkarte is a four-case interactive decision activity on its existing 7-minute slide", () => {
  const slide = getSlidesByCourse("B1").find((item) => item.assignmentId === "B1-8.24");
  const stages = buildTeachingPresenterStages(slide, slide.topic);
  const practice = stages.find((stage) => stage.id === "practice");

  assert.equal(stages.length, 10, "add only the correction page; reading replaces vocabulary");
  assert.equal(stages[6].id, "practice");
  assert.equal(stages[7].id, "questions", "keep existing speaking tasks after practice");
  assert.equal(practice.type, "flow");
  assert.equal(practice.suggestedMinutes, 7);
  assert.equal(practice.items.length, 1);
  assert.equal(practice.items[0].title, "Argumentkarte Nachhaltigkeit");

  const cases = practice.items[0].sustainabilityCases;
  assert.equal(cases.length, 4, "each sustainability category needs a clear everyday case");
  assert.deepEqual(cases.map((item) => item.id), ["handy", "jacke", "getraenk", "batterien"]);
  assert.deepEqual(cases.map((item) => item.correctCategory), ["avoid", "reuse", "switch", "dispose"]);
  assert.ok(cases.every((item) => item.title && item.situation && item.question && item.model && item.explanation));

  const presenter = fs.readFileSync("src/components/TeachingSlidePresenter.jsx", "utf8");
  const interactive = fs.readFileSync("src/components/B1SustainabilityDecisions.jsx", "utf8");
  const css = fs.readFileSync("src/components/B1SustainabilityDecisions.css", "utf8");

  assert.match(presenter, /<B1SustainabilityDecisions/);
  assert.match(presenter, /stage\.items\?\.\[0\]\?\.sustainabilityCases/);
  assert.match(interactive, /Lösung prüfen/);
  assert.match(interactive, /Nächster Fall/);
  assert.match(interactive, /B1-MODELLSATZ/);
  assert.match(interactive, /setRevealed/);
  assert.match(interactive, /onSetMinutes\?\.\(7\)/);
  assert.match(css, /@media\(max-width:520px\)/);
});

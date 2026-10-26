import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { getInteractiveLessonOpening, isInteractiveOpeningStage } from "../src/data/interactiveLessonOpenings.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";

test("B1 Day 24 integrates music only into slides 1 and 3 of the existing nine-stage lesson", () => {
  const slide = getSlidesByCourse("B1").find((item) => item.assignmentId === "B1-8.24");
  assert.ok(slide, "B1 Day 24 must exist");

  const stages = buildTeachingPresenterStages(slide, slide.topic);
  assert.deepEqual(stages.map((item) => item.id), [
    "intro", "warmup", "knowledge", "phrases", "grammar-check",
    "practice", "questions", "workbook", "lesson-summary",
  ]);

  assert.equal(stages[0].musicIntro.youtubeId, "-46siG9FrfE");
  assert.equal(stages[0].musicIntro.mediaType, "music");
  assert.equal(stages[1].variant, undefined, "the original warm-up must remain unchanged");
  assert.equal(stages[2].variant, "interactive-music", "music is distinct from signed R2 Hördetektiv");
  assert.equal(stages[2].type, "knowledge", "knowledge ID/type remain stable for saved sessions");
  assert.equal(stages[2].listeningItems.length, 5);
  assert.equal(stages[3].id, "phrases");
  assert.equal(stages[4].id, "grammar-check");
  assert.equal(stages[6].id, "questions");

  // Teacher-led music is not a new graded or submitted Teil 4.
  const listening = getInteractiveLessonOpening("B1-8.24").listening;
  assert.equal(listening.audioKey, undefined);
  assert.equal(listening.youtubeId, "-46siG9FrfE");
  assert.ok(listening.questions.every((item) =>
    item.options[item.correctIndex] === item.answer && item.evidence && item.explanation));
  assert.equal(isInteractiveOpeningStage("B1-8.24", "warmup"), false);
  assert.equal(isInteractiveOpeningStage("B1-8.24", "knowledge"), true);
});

test("music presenter reuses the approved YouTube player without changing existing signed R2 Hören", () => {
  const player = fs.readFileSync("src/components/MusicVideoEmbed.jsx", "utf8");
  const presenter = fs.readFileSync("src/components/TeachingSlidePresenter.jsx", "utf8");
  const interactive = fs.readFileSync("src/components/InteractiveLessonOpening.jsx", "utf8");

  assert.match(player, /youtube-nocookie\.com\/embed/);
  assert.match(player, /allowFullScreen/);
  assert.match(player, /Video auf YouTube öffnen/);
  assert.match(presenter, /stage\.musicIntro/);
  assert.match(interactive, /lesson\.listening\.youtubeId/);
  assert.match(interactive, /MUSIK \/ LIED VERSTEHEN/);
  assert.match(interactive, /prepareAudio/);
  assert.match(interactive, /Antworten einzeln besprechen/);

  const a2Existing = getInteractiveLessonOpening("A2-7.20").listening;
  const b1Existing = getInteractiveLessonOpening("B1-8.25").listening;
  assert.ok(a2Existing.audioKey && !a2Existing.youtubeId);
  const a2 = getSlidesByCourse("A2").find((item) => item.assignmentId === "A2-7.20");
  assert.equal(buildTeachingPresenterStages(a2, a2.topic).find((x) => x.id === "knowledge").variant, "interactive-listening");
  assert.ok(b1Existing.audioKey && !b1Existing.youtubeId);
});

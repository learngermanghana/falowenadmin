import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { getInteractiveLessonOpening, isInteractiveOpeningStage } from "../src/data/interactiveLessonOpenings.js";
import { buildTeachingPresenterStages, isB1PresenterV2Slide } from "../src/utils/teachingPresenter.js";
import { B1_DAY27_AUDIO_KEY, B1_DAY27_LISTENING, B1_DAY27_LISTENING_QUESTIONS } from "../src/data/b1Day27Listening.js";

test("B1 Day 27 uses modern music on slide 2 and supplied private Hören on slide 3", () => {
  const slide = getSlidesByCourse("B1").find((row) => row.assignmentId === "B1-10.27");
  assert.ok(slide);
  assert.equal(isB1PresenterV2Slide(slide), true);
  const stages = buildTeachingPresenterStages(slide, slide.topic);
  assert.deepEqual(stages.slice(0, 3).map((stage) => stage.id), ["intro", "warmup", "knowledge"]);
  assert.equal(stages[1].variant, "interactive-music-video");
  assert.equal(stages[1].musicVideo.mediaType, "music");
  assert.equal(stages[1].musicVideo.youtubeId, undefined);
  assert.equal(stages[1].musicVideo.musicLibraryUrl, "https://music.falowen.app/?level=B1&day=27");
  assert.equal(stages[1].timingMode, "");
  assert.equal(stages[2].variant, "interactive-listening");
  assert.equal(stages[2].audioKey, "b1/day-27/umweltfreundlich-im-alltag.mp3");
  assert.equal(stages[2].audioLevel, "B1");
  assert.equal(stages[2].audioDay, 27);
  assert.equal(stages[2].listeningItems.length, 5);
  assert.equal(stages[2].transcript.length, 0, "a full transcript was not supplied");
  assert.equal(stages[2].musicVideo, undefined);
  assert.equal(isInteractiveOpeningStage("B1-10.27", "warmup"), false);
  assert.equal(isInteractiveOpeningStage("B1-10.27", "knowledge"), true);
  assert.equal(getInteractiveLessonOpening("B1-10.27").listening, B1_DAY27_LISTENING);
});

test("the five original teacher-supplied questions retain their answer order and evidence", () => {
  assert.equal(B1_DAY27_AUDIO_KEY, "b1/day-27/umweltfreundlich-im-alltag.mp3");
  assert.deepEqual(B1_DAY27_LISTENING_QUESTIONS.map((item) => item.correctIndex), [0, 1, 2, 0, 1]);
  assert.deepEqual(B1_DAY27_LISTENING_QUESTIONS.map((item) => item.prompt), [
    "Was nutzt Person B beim Einkaufen?",
    "Wie vermeidet Person B Plastikmüll im Supermarkt?",
    "Wo kauft Person B ein, um regionale Produkte zu bekommen?",
    "Was macht Person B zu Hause in Bezug auf Energie?",
    "Wie lüftet Person B zu Hause?",
  ]);
  assert.deepEqual(B1_DAY27_LISTENING_QUESTIONS.map((item) => item.evidence), [
    "Ich nutze nur noch wiederverwendbare Stofftaschen.",
    "Ich kaufe möglichst loses Obst und Gemüse und vermeide Produkte mit viel Plastikverpackung.",
    "Ich kaufe im Bioladen um die Ecke ein, weil die Lebensmittel dort von Höfen aus der Region kommen.",
    "Da achte ich sehr darauf, Licht immer auszuschalten, wenn ich den Raum verlasse.",
    "Außerdem lüfte ich kurz und intensiv.",
  ]);
  assert.ok(B1_DAY27_LISTENING_QUESTIONS.every((item) => item.options.length === 3 && item.answer && item.explanation));
});

test("all 28 B1 slides keep the modern Presenter 2.0 spine, not old legacy stages", () => {
  const slides = getSlidesByCourse("B1");
  assert.equal(slides.length, 28);
  for (const slide of slides) {
    assert.equal(isB1PresenterV2Slide(slide), true, slide.assignmentId);
    const stages = buildTeachingPresenterStages(slide, slide.topic);
    const ids = stages.map((stage) => stage.id);
    assert.equal(ids[0], "intro", slide.assignmentId);
    assert.equal(ids[1], "warmup", slide.assignmentId);
    for (const id of ["common-mistakes", "reading", "grammar-check", "questions", "workbook-presentation", "workbook", "lesson-summary"]) {
      assert.ok(ids.includes(id), slide.assignmentId + " missing modern " + id);
    }
    for (const legacy of ["examples", "mistakes", "weekly-challenge", "b1-grammar-check", "b1-vocabulary-retrieval", "b1-guided-action"]) {
      assert.equal(ids.includes(legacy), false, slide.assignmentId + " reverted to legacy " + legacy);
    }
  }
});

test("Day 27 music player recognizes the new day and private Hören uses the existing staff-only signer", () => {
  const musicPlayer = readFileSync(new URL("../src/components/LinkedPublishedSongLessonStage.jsx", import.meta.url), "utf8");
  const audioPlayer = readFileSync(new URL("../src/components/InteractiveLessonOpening.jsx", import.meta.url), "utf8");
  assert.ok(musicPlayer.includes("[24,25,26,27].includes(day)"));
  assert.ok(musicPlayer.includes("27:'B1-10.27'"));
  assert.ok(audioPlayer.includes("isB1Day27Classroom"));
  assert.ok(audioPlayer.includes(B1_DAY27_AUDIO_KEY));
  assert.ok(audioPlayer.includes("https://www.falowen.app/api/course-media/classroom/audio-url"));
  assert.ok(audioPlayer.includes('params.set("level", "B1")'));
  assert.ok(audioPlayer.includes("getIdToken()"));
  assert.ok(!B1_DAY27_LISTENING.youtubeId);
});

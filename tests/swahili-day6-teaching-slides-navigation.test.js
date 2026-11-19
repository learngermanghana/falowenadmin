import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { swahiliSlidePacks } from "../src/data/swahiliSlidePacks.js";

test("Swahili packs list the published lessons in day order", () => {
  assert.deepEqual(swahiliSlidePacks.A1.map(lesson => lesson.dayNumber), [1, 5, 6, 10]);
  assert.deepEqual(swahiliSlidePacks.B1.map(lesson => lesson.dayNumber), [28]);
});

test("Sokoni and Mazingira use the approved AI videos without replacing Falowen Radio or music", () => {
  const lessons = [
    { lesson: swahiliSlidePacks.A1.at(-1), videoId: "xLN5QX669JA", radioId: "4_ygEiW5QjI" },
    { lesson: swahiliSlidePacks.B1[0], videoId: "kcqRGi5KLMs", radioId: "aeXVw4Q4olE" },
  ];

  for (const { lesson, videoId, radioId } of lessons) {
    const stages = lesson.stages || lesson.classroomStages;
    assert.equal(lesson.teacherLectureVideoId, videoId);
    assert.equal(stages[0].id, "intro");
    assert.equal(stages[1].id, "ai-video");
    assert.equal(stages[1].type, "teacher-lecture");
    assert.equal(stages[1].videoId, videoId);
    assert.match(stages[2].id, /^grammar/);
    assert.equal(stages.at(-1).id, "presentation");
    const radio = stages.find(stage => "radioVideoId" in stage);
    assert.equal(radio.radioVideoId, radioId);
    assert.ok(radio.content || radio.items.length);
    assert.ok(stages.find(stage => stage.id === "music").audio.audioUrl);
  }
});

test("Swahili AI video stages reuse the existing YouTube player in the presentation", () => {
  const stageComponent = readFileSync(new URL("../src/components/SwahiliA2LessonStage.jsx", import.meta.url), "utf8");
  const presenter = readFileSync(new URL("../src/components/SwahiliTeachingSlides.jsx", import.meta.url), "utf8");
  assert.match(stageComponent, /stage\.type==="teacher-lecture"/);
  assert.match(stageComponent, /MusicVideoEmbed videoId=\{stage\.videoId\}/);
  assert.match(presenter, /<SwahiliA2LessonStage stage=\{stage\}/);
});

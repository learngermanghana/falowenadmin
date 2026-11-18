import test from "node:test";
import assert from "node:assert/strict";
import { swahiliSlidePacks } from "../src/data/swahiliSlidePacks.js";

test("Swahili packs list the published lessons in day order", () => {
  assert.deepEqual(swahiliSlidePacks.A1.map(lesson => lesson.dayNumber), [1, 5, 6, 10]);
  assert.deepEqual(swahiliSlidePacks.B1.map(lesson => lesson.dayNumber), [28]);
});

test("Sokoni and Mazingira can be presented while their Radio videos are pending", () => {
  for (const lesson of [swahiliSlidePacks.A1.at(-1), swahiliSlidePacks.B1[0]]) {
    const stages = lesson.stages || lesson.classroomStages;
    assert.equal(stages[0].id, "intro");
    assert.match(stages[1].id, /^grammar/);
    assert.equal(stages.at(-1).id, "presentation");
    const radio = stages.find(stage => "radioVideoId" in stage);
    assert.equal(radio.radioVideoId, null);
    assert.ok(radio.content || radio.items.length);
    assert.ok(stages.find(stage => stage.id === "music").audio.audioUrl);
  }
});

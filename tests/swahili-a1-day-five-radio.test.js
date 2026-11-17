import test from "node:test";
import assert from "node:assert/strict";
import { SWAHILI_DAY_FIVE_ADMIN_LESSON } from "../src/data/swahiliDayFiveTeachingSlides.js";

test("Somo la 5 uses the approved Falowen Radio episode throughout the slides", () => {
  const stages = SWAHILI_DAY_FIVE_ADMIN_LESSON.stages;
  assert.equal(stages.find(stage => stage.id === "listening").radioUrl, "https://youtu.be/qfgDXc8yYiE");
  assert.ok(stages.filter(stage => stage.radioUrl).every(stage => stage.radioUrl === "https://youtu.be/qfgDXc8yYiE"));
  assert.ok(!stages.some(stage => JSON.stringify(stage).includes("SKVEqbLqjSY")));
});

test("The complete supplied questions and private answer reveals are present", () => {
  const stages = SWAHILI_DAY_FIVE_ADMIN_LESSON.stages;
  const gap = stages.find(stage => stage.id === "radio-first-listening");
  assert.match(gap.content, /Baba na mama ni/);
  assert.match(gap.content, /Nina kaka/);
  assert.equal(gap.answer, "1. wazazi\n2. Bibi\n3. watoto\n4. mmoja");
  assert.deepEqual(
    stages.filter(stage => /^radio-choice-/.test(stage.id)).map(stage => stage.answer.charAt(0)),
    ["b", "b", "c", "a"],
  );
  const write = stages.find(stage => stage.id === "radio-write");
  assert.match(write.content, /zisizopungua saba/);
  assert.match(write.answer, /Tunapenda kupika na kula pamoja/);
  assert.ok(stages.filter(stage => stage.answer).every(stage => stage.prompt));
});

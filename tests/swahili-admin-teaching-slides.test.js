import test from "node:test";
import assert from "node:assert/strict";
import { SWAHILI_DAY_ONE_ADMIN_LESSON, SWAHILI_DAY_ONE_SLIDES } from "../src/data/swahiliTeachingSlides.js";

test("Swahili is a separate language in Admin with only the approved first lesson", () => {
  assert.equal(SWAHILI_DAY_ONE_ADMIN_LESSON.course, "SWAHILI");
  assert.equal(SWAHILI_DAY_ONE_ADMIN_LESSON.language, "Kiswahili");
  assert.equal(SWAHILI_DAY_ONE_ADMIN_LESSON.dayNumber, 1);
  assert.equal(SWAHILI_DAY_ONE_ADMIN_LESSON.id, "swahili-day-1");
  assert.equal(SWAHILI_DAY_ONE_SLIDES.length, 10);
  assert.deepEqual(SWAHILI_DAY_ONE_ADMIN_LESSON.stages, SWAHILI_DAY_ONE_SLIDES);
  assert.equal(new Set(SWAHILI_DAY_ONE_SLIDES.map(stage => stage.id)).size, 10);
  assert.ok(SWAHILI_DAY_ONE_SLIDES.every(stage => stage.title && stage.content && stage.notes));
});

test("Swahili presentation follows Ruth's vowel, syllable and pronunciation Day 1", () => {
  const stages = SWAHILI_DAY_ONE_SLIDES.map(stage => stage.content).join(" ");
  for (const item of ["A", "E", "I", "O", "U", "mama", "wewe", "kiti", "mtoto", "kuku", "ng’ombe", "ba", "cha", "la"]) {
    assert.ok(stages.includes(item), item);
  }
  assert.match(stages, /Wasilisha/);
  assert.ok(!SWAHILI_DAY_ONE_SLIDES.some(stage => /somo la 2/i.test(stage.title)));
});

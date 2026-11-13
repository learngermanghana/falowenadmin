import test from "node:test";
import assert from "node:assert/strict";
import { SWAHILI_DAY_ONE_ADMIN_LESSON, SWAHILI_DAY_ONE_SLIDES } from "../src/data/swahiliTeachingSlides.js";

test("Kiswahili remains a separate one-day language course inside Admin", () => {
  assert.equal(SWAHILI_DAY_ONE_ADMIN_LESSON.course, "SWAHILI");
  assert.equal(SWAHILI_DAY_ONE_ADMIN_LESSON.language, "Kiswahili");
  assert.equal(SWAHILI_DAY_ONE_ADMIN_LESSON.dayNumber, 1);
  assert.equal(SWAHILI_DAY_ONE_ADMIN_LESSON.id, "swahili-day-1");
  assert.equal(SWAHILI_DAY_ONE_SLIDES.length, 9);
  assert.deepEqual(SWAHILI_DAY_ONE_ADMIN_LESSON.stages, SWAHILI_DAY_ONE_SLIDES);
  assert.equal(new Set(SWAHILI_DAY_ONE_SLIDES.map(stage => stage.id)).size, 9);
  assert.ok(SWAHILI_DAY_ONE_SLIDES.every(stage => stage.title && stage.content && stage.notes));
});

test("Kiswahili mirrors the A2 classroom stages but avoids inventing recordings", () => {
  assert.deepEqual(SWAHILI_DAY_ONE_SLIDES.map(stage => stage.type), [
    "intro", "music", "listening", "grammar", "reading", "speaking", "writing", "presentation", "summary",
  ]);
  assert.equal(SWAHILI_DAY_ONE_SLIDES.find(stage => stage.type === "music").status, "pending-audio");
  assert.equal(SWAHILI_DAY_ONE_SLIDES.find(stage => stage.type === "listening").status, "teacher-led");
  assert.ok(SWAHILI_DAY_ONE_SLIDES.find(stage => stage.type === "grammar").details.length >= 5);
});

test("Kiswahili Day 1 still teaches vowels, syllables and familiar words", () => {
  const material = SWAHILI_DAY_ONE_SLIDES.flatMap(stage => [stage.content, ...(stage.details || []).map(detail => detail.body)]).join(" ");
  for (const item of ["A", "E", "I", "O", "U", "mama", "kiti", "mtoto", "kuku", "ng’ombe", "ba", "cha", "la"]) {
    assert.ok(material.includes(item), item);
  }
  assert.match(material, /Wasilisha/);
  assert.ok(!SWAHILI_DAY_ONE_SLIDES.some(stage => /somo la 2/i.test(stage.title)));
});

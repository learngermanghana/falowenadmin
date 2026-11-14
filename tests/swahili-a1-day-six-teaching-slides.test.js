import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SWAHILI_DAY_ONE_ADMIN_LESSON } from "../src/data/swahiliTeachingSlides.js";
import { SWAHILI_DAY_SIX_ADMIN_LESSON } from "../src/data/swahiliDaySixTeachingSlides.js";

const source = file => readFileSync(new URL(file, import.meta.url), "utf8");
const presenter = source("../src/components/SwahiliTeachingSlides.jsx");
const css = source("../src/components/SwahiliTeachingSlides.css");
const daySixData = source("../src/data/swahiliDaySixTeachingSlides.js");

test("Swahili Day 6 is a separate A1 lesson with A2-style stages and six radio question slides", () => {
  assert.equal(SWAHILI_DAY_SIX_ADMIN_LESSON.id, "swahili-day-6");
  assert.equal(SWAHILI_DAY_SIX_ADMIN_LESSON.course, "SWAHILI");
  assert.equal(SWAHILI_DAY_SIX_ADMIN_LESSON.dayNumber, 6);
  assert.deepEqual(SWAHILI_DAY_SIX_ADMIN_LESSON.stages.map(stage => stage.id),
    ["intro","music","listening",
    "radio-first-listening","radio-second-listening","radio-drinks-and-preferences",
    "radio-ordering","radio-write","radio-speak","grammar","reading","speaking","writing","presentation","summary"]);
  assert.equal(SWAHILI_DAY_SIX_ADMIN_LESSON.stages.find(stage => stage.id === "grammar").details.length, 7);
  assert.equal(SWAHILI_DAY_ONE_ADMIN_LESSON.stages.length, 9);
});

test("Day 6 is available in the Swahili Admin slides index and presenter link", () => {
  assert.match(presenter,/SWAHILI_DAY_SIX_ADMIN_LESSON/);
  assert.match(presenter,/courseRoot \+ "\/swahili-day-6"/);
  assert.match(presenter,/daySixRoot \+ "\?present=1"/);
  assert.match(presenter,/Open \{lesson.day\} learner workbook/);
  assert.match(presenter,/selectedPresenterSlide/);
  assert.match(presenter,/<PresenterSessionTimer/);
  assert.match(presenter,/<PresenterStudentPicker/);
  assert.match(presenter,/<PresenterActivityTimer/);
  assert.match(presenter,/<PresenterControls/);
  assert.match(presenter,/<PresenterStageJump/);
});

test("All Day 6 food and grammar content is source-aligned and no song is invented", () => {
  const stages=SWAHILI_DAY_SIX_ADMIN_LESSON.stages;
  const music=stages.find(s=>s.id==="music");
  const radio=stages.find(s=>s.id==="listening");
  assert.match(music.content,/Naomba, naomba, tafadhali/);
  assert.match(music.notes,/no.*song.*audio|text-only/i);
  assert.equal(radio.radioUrl,"https://youtu.be/ZesonfipX4I");
  assert.match(stages.find(s=>s.id==="speaking").content,/Mimi ninapenda kula wali na kuku/);
  assert.match(stages.find(s=>s.id==="reading").content,/ugali samaki/);
  assert.match(stages.find(s=>s.id==="writing").notes,/not in a new slide-specific assignment/i);
  assert.match(daySixData,/Prices are intentionally omitted/i);
  assert.match(presenter,/grammar\?\.question \|\| stage.prompt/);
});

test("Day 6 radio link and grammar are responsive within existing presentation shell", () => {
  assert.match(presenter,/presenter-shell swahili-a2-shell/);
  assert.match(source("../src/components/SwahiliA2LessonStage.jsx"),/swahili-a2-presenter__radio-link/);
  assert.match(source("../src/components/SwahiliA2LessonStage.jsx"),/swahili-a2-presenter__grammar-stage/);
  assert.match(css,/\.swahili-a2-presenter__radio-link/);
  assert.match(css,/@media\(max-width:650px\)/);
});

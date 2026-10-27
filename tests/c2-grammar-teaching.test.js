import test from "node:test";
import assert from "node:assert/strict";
import { C2_GRAMMAR_TEACHING } from "../src/data/c2GrammarTeaching.js";
import { getSlidesByCourse } from "../src/data/teachingSlides.js";
test("all 28 C2 slide days have explicit teaching and valid guided answers", () => {
 assert.equal(Object.keys(C2_GRAMMAR_TEACHING).length, 28);
 for(const slide of getSlidesByCourse("C2")) {
  const lesson=C2_GRAMMAR_TEACHING[slide.dayNumber];
  assert.ok(lesson, slide.assignmentId);
  for(const field of ["definitionDe","supportEn","structureDe","workedExample","explanationDe"]) assert.ok(lesson[field].length>25, slide.assignmentId+field);
  assert.equal(new Set(lesson.check.options).size,lesson.check.options.length);
  assert.ok(lesson.check.options[lesson.check.answerIndex]);
 }
});

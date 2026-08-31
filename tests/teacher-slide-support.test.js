import test from "node:test";
import assert from "node:assert/strict";
import { buildTeacherSlideSupport } from "../src/data/teacherSlideSupport.js";

test("teacher support adds lesson planning guidance for generic slides", () => {
  const support = buildTeacherSlideSupport({
    course: "B1",
    assignmentId: "B1-9.9",
    title: "B1 Lesson · Arbeit",
    topic: "9.9 Arbeit und Beruf",
  });

  assert.match(support.lessonOverviewEn, /Arbeit und Beruf/);
  assert.ok(support.grammarFocusEn.length >= 2);
  assert.ok(support.modelExamplesDe.length >= 3);
  assert.ok(support.commonMistakesEn.length >= 3);
});

test("curated lessons receive topic-specific grammar, examples, and mistakes", () => {
  const support = buildTeacherSlideSupport({
    course: "A2",
    assignmentId: "A2-1.3",
    title: "A2 Day 3 · Dinge und Personen vergleichen",
    topic: "1.3 Vergleichen",
  });

  assert.equal(support.grammarFocusEn.some((item) => item.includes("comparative")), true);
  assert.equal(support.modelExamplesDe.some((item) => item.includes("schneller als")), true);
  assert.equal(support.commonMistakesEn.some((item) => item.includes("wie instead of als")), true);
});

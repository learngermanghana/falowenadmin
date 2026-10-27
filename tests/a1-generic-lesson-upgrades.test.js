import test from "node:test";
import assert from "node:assert/strict";

import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { A1_GENERIC_LESSON_UPGRADE_IDS } from "../src/data/a1GenericLessonUpgrades.js";

const RETIRED_GENERIC = [
  "Ich denke, dass ...",
  "Ich brauche ein Beispiel.",
  "Model one full exchange before pair speaking.",
  "Use short correction slots after each speaking phase.",
  "Students can communicate about",
];

test("all 13 formerly generic A1 lessons now contain lesson-specific classroom content", () => {
  assert.equal(A1_GENERIC_LESSON_UPGRADE_IDS.length, 13);

  const slides = new Map(getSlidesByCourse("A1").map((slide) => [slide.assignmentId, slide]));
  for (const assignmentId of A1_GENERIC_LESSON_UPGRADE_IDS) {
    const slide = slides.get(assignmentId);
    assert.ok(slide, `${assignmentId} missing`);
    assert.ok(String(slide.objective || "").length >= 40, `${assignmentId} objective too short`);
    assert.ok((slide.warmupQuestionsDe || []).length >= 3, `${assignmentId} warm-up too small`);
    assert.ok((slide.keyPhrasesDe || []).length >= 4, `${assignmentId} key phrases too small`);
    assert.ok((slide.studentQuestionsDe || []).length >= 4, `${assignmentId} student practice too small`);
    assert.ok((slide.teacherNotesEn || []).length >= 3, `${assignmentId} teacher notes too small`);
    assert.ok((slide.interactionFlow || []).length >= 4, `${assignmentId} interaction flow too small`);

    const searchable = JSON.stringify(slide);
    for (const phrase of RETIRED_GENERIC) {
      assert.equal(searchable.includes(phrase), false, `${assignmentId} still contains generic phrase: ${phrase}`);
    }
  }
});


test("all upgraded A1 interaction flows sum to a complete 60-minute lesson", () => {
  const slides = new Map(getSlidesByCourse("A1").map((slide) => [slide.assignmentId, slide]));

  for (const assignmentId of A1_GENERIC_LESSON_UPGRADE_IDS) {
    const slide = slides.get(assignmentId);
    const phaseMinutes = (slide.interactionFlow || []).map((item) => {
      const match = String(item?.detailEn || "").match(/^(\d+)\s*min:/i);
      return match ? Number(match[1]) : 0;
    });

    assert.equal(
      phaseMinutes.reduce((sum, value) => sum + value, 0),
      60,
      `${assignmentId} should provide a complete 60-minute plan`,
    );
  }
});

test("A1-8 timetable question requires an actual lookup across multiple entries", () => {
  const slide = getSlidesByCourse("A1").find((item) => item.assignmentId === "A1-8");
  const question = slide.studentQuestionsDe?.[0] || "";

  assert.match(question, /RE 2/);
  assert.match(question, /RE 4/);
  assert.match(question, /RE 8/);
  assert.match(question, /17:20/);
  assert.match(question, /18:45/);
  assert.match(question, /20:10/);
  assert.match(question, /Wann fährt der RE 4 ab\?/);
  assert.doesNotMatch(question, /^Wann fährt ein Zug um 18:45 Uhr\?/);
});

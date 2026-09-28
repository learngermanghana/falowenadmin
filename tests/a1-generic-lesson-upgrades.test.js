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

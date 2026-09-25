import test from "node:test";
import assert from "node:assert/strict";

import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { c2PresenterSlides } from "../src/data/c2PresenterSlides.js";
import {
  STRICT_PARITY_LEVELS,
  KNOWN_PARITY_EXCEPTION_LEVELS,
  auditCurriculumParity,
  buildCourseBookBridgeItems,
  getCurriculumParityReference,
  getStudentLessonContract,
} from "../src/data/studentCurriculumParity.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";

function paritySlides(level) {
  return level === "C2" ? c2PresenterSlides : getSlidesByCourse(level);
}

test("A2 through C2 expose 28 canonical learner lesson identities", () => {
  for (const level of ["A2","B1","B2","C1","C2"]) {
    for (let day = 1; day <= 28; day += 1) {
      const contract = getStudentLessonContract(level, day);
      assert.ok(contract, `${level} Day ${day} missing student contract`);
      assert.equal(contract.canonicalId, `${level}-DAY-${String(day).padStart(2, "0")}`);
      assert.ok(contract.title.length > 3);
    }
  }
});

test("strict parity levels stay aligned with the learner Course Book", () => {
  for (const level of STRICT_PARITY_LEVELS) {
    const audit = auditCurriculumParity(paritySlides(level));
    assert.equal(audit.length, 28, level + " audit should cover 28 lessons");
    const mismatches = audit.filter((item) => item.status !== "aligned");
    assert.deepEqual(
      mismatches,
      [],
      level + " has Student/Admin curriculum drift: " + JSON.stringify(mismatches),
    );
  }
});

test("C1 is now strict parity with no known curriculum exception", () => {
  assert.deepEqual(KNOWN_PARITY_EXCEPTION_LEVELS, []);
  assert.ok(STRICT_PARITY_LEVELS.includes("C1"));

  const audit = auditCurriculumParity(getSlidesByCourse("C1"));
  assert.equal(audit.length, 28);
  assert.deepEqual(audit.filter((item) => item.status !== "aligned"), []);
});

test("Presenter intro exposes the learner lesson reference for every A2-C2 lesson", () => {
  for (const level of ["A2","B1","B2","C1","C2"]) {
    for (const slide of paritySlides(level)) {
      const stages = buildTeachingPresenterStages(slide, slide.topic);
      const intro = stages.find((stage) => stage.id === "intro");
      const reference = getCurriculumParityReference(slide);

      assert.ok(intro?.studentReference, slide.assignmentId + " missing Student lesson reference");
      assert.equal(intro.studentReference.canonicalId, reference.canonicalId);
      assert.equal(intro.studentReference.title, reference.title);
    }
  }
});

test("Lesson summary is the final stage and keeps the Course Book next steps", () => {
  for (const level of ["A2","B1","B2","C1","C2"]) {
    for (const slide of paritySlides(level)) {
      const items = buildCourseBookBridgeItems(slide);
      assert.equal(items.length, 4, slide.assignmentId + " Course Book steps should stay available");
      assert.deepEqual(items.map((item) => item.label), [
        "1. Grammar",
        "2. Speak",
        "3. Write",
        "4. Workbook / Submit",
      ]);

      const stages = buildTeachingPresenterStages(slide, slide.topic);
      const summary = stages.at(-1);
      assert.equal(summary?.id, "lesson-summary", slide.assignmentId + " should finish with Lesson summary");
      assert.equal(summary?.type, "summary");
      assert.match(summary?.subtitle || "", /You should now be able to/i);
      assert.ok(Array.isArray(summary?.items) && summary.items.length >= 2);
      assert.deepEqual(summary?.nextSteps?.map((item) => item.label), items.map((item) => item.label));
    }
  }
});

test("A2 Day 5 summary tells students what they can do after the lesson", () => {
  const slide = getSlidesByCourse("A2").find((item) => item.assignmentId === "A2-2.5");
  const summary = buildTeachingPresenterStages(slide, slide.topic).at(-1);

  assert.equal(summary?.id, "lesson-summary");
  assert.match(summary?.items?.[0]?.detail || "", /^You can describe free time/i);
  assert.match(summary?.items?.[0]?.detail || "", /separable verbs/i);
  assert.ok(summary?.items?.some((item) => item.label === "Speaking"));
  assert.ok(summary?.items?.some((item) => item.label === "Self-check"));
});

test("C1 intro now reports Student/Admin aligned", () => {
  const slide = paritySlides("C1")[0];
  const reference = getCurriculumParityReference(slide);

  assert.equal(reference.courseBookLabel, "C1 Day 1");
  assert.equal(reference.title, "Ziele und Lernweg");
  assert.equal(reference.status, "aligned");
  assert.equal(reference.statusLabel, "Student/Admin aligned");
});

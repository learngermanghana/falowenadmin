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
  return level === "C2" ? c2PresenterSlides : paritySlides(level);
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

test("C1 sequence difference is explicit and cannot masquerade as aligned", () => {
  assert.deepEqual(KNOWN_PARITY_EXCEPTION_LEVELS, ["C1"]);
  const audit = auditCurriculumParity(getSlidesByCourse("C1"));
  assert.equal(audit.length, 28);
  assert.ok(audit.some((item) => item.status === "known-exception"), "C1 should expose its known learner/admin sequence difference");
  assert.equal(audit.some((item) => item.status === "mismatch"), false, "C1 should use known-exception, not an unclassified mismatch");
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

test("Course Book Bridge is the final stage and always returns Grammar, Speak, Write and Workbook/Submit", () => {
  for (const level of ["A2","B1","B2","C1","C2"]) {
    for (const slide of paritySlides(level)) {
      const items = buildCourseBookBridgeItems(slide);
      assert.equal(items.length, 4, slide.assignmentId + " bridge should have four steps");
      assert.deepEqual(items.map((item) => item.label), [
        "1. Grammar",
        "2. Speak",
        "3. Write",
        "4. Workbook / Submit",
      ]);

      const stages = buildTeachingPresenterStages(slide, slide.topic);
      assert.equal(stages.at(-1)?.id, "coursebook-bridge", slide.assignmentId + " should finish with Course Book Bridge");
      assert.equal(stages.at(-1)?.items.length, 4);
    }
  }
});

test("known C1 mismatch is teacher-visible rather than hidden", () => {
  const slide = paritySlides("C1")[0];
  const reference = getCurriculumParityReference(slide);

  assert.equal(reference.courseBookLabel, "C1 Day 1");
  assert.equal(reference.title, "Ziele und Lernweg");
  assert.equal(reference.status, "known-exception");
  assert.match(reference.note, /different Admin sequence/i);
});

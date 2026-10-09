import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { getA1LearningPath } from "../src/data/a1LearningPath.js";

const slide = (assignmentId) => getSlidesByCourse("A1").find(
  (entry) => entry.assignmentId.toUpperCase() === assignmentId.toUpperCase(),
);

test("published tutor-marked A1 assignments are explicitly classified from authored evidence", () => {
  for (const id of ["A1-0.1", "A1-0.2", "A1-1.1", "A1-1.2", "A1-2", "A1-3", "A1-4", "A1-5", "A1-6"]) {
    const row = slide(id);
    assert.ok(row, "Missing " + id);
    const path = getA1LearningPath(row);
    assert.equal(path.kind, "tutor-marked", id);
    assert.equal(path.label, "Tutor-marked assignment");
    assert.match(path.instruction, /submit them through Falowen for tutor marking/);
    assert.equal(path.activityUrl, row.workbookConnection.workbookUrl, "Never invent a marked-assignment route");
  }
});

test("A1 self-practice is unscored and never described as tutor-marked", () => {
  for (const id of ["A1-1.1-PRACTICE", "A1-1.3", "A1-2.3"]) {
    const row = slide(id);
    assert.ok(row, "Missing self-practice lesson " + id);
    const path = getA1LearningPath(row);
    assert.equal(path.kind, "self-practice", id);
    assert.equal(path.label, "Self-practice");
    assert.match(path.instruction, /not a tutor-marked submission/);
    assert.doesNotMatch(path.actionLabel, /submit|tutor/i);
    assert.equal(path.activityUrl, row.workbookConnection.workbookUrl);
  }
});

test("unverified A1 learner activities do not inherit tutor-marked status from a link", () => {
  const row = slide("A1-11");
  const task = getA1LearningPath(row);
  assert.equal(task.kind, "review");
  assert.match(task.instruction, /Submission status has not been confirmed/);
  assert.equal(task.activityUrl, "");
  assert.equal(getA1LearningPath({ course: "A1", assignmentId: "A1-5.9" }), null);
  assert.equal(getA1LearningPath({ course: "A1", assignmentId: "A1-TUTORIAL" }), null);
  assert.equal(getA1LearningPath({ course: "B1", assignmentId: "B1-1.1" }), null);
  const misleading = getA1LearningPath({
    course: "A1",
    assignmentId: "A1-TEST",
    workbookConnection: { subtitle: "Self-practice, not a tutor-marked assignment", workbookUrl: "/test" },
  });
  assert.equal(misleading.kind, "self-practice");
});

test("A1 classroom slides use understanding checks, not A2/B1 roleplay as the default", () => {
  const presenter = fs.readFileSync("src/components/A1GrammarPresenter.jsx", "utf8");
  const guide = fs.readFileSync("src/components/TeacherLessonBlocks.jsx", "utf8");
  assert.match(presenter, /getA1LearningPath\(slide\)/);
  assert.match(presenter, /Verständnis prüfen/);
  assert.match(presenter, /One understanding question per student/);
  assert.match(presenter, /data-a1-learning-mode=\{stage.activityKind\}/);
  assert.match(presenter, /stage.actionLabel/);
  assert.match(guide, /getA1LearningPath\(slide\)/);
  assert.match(guide, /Check understanding/);
  assert.match(guide, /no role-play is required/);
  assert.match(guide, /a1Path\?\.label/);
  assert.doesNotMatch(presenter, /id: "mini-dialogue"|id: "speak-first"/);
});

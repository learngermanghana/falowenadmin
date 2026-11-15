const { courseEnrollmentPatch } = require("./courseEnrollment");
const { test } = require("node:test");
const assert = require("node:assert/strict");
for (const primary of ["swahili", "german"]) {
  test(primary + " placement survives dual enrollment, removal and restoration", () => {
    const other = primary === "german" ? "swahili" : "german";
    let student = { program: primary, level: "B1", className: "Morning", classId: "morning" };
    const apply = (mode, fields) => Object.assign(student, courseEnrollmentPatch(student, { mode, expectedPrimary: student.program, ...fields }));
    apply("both", { secondaryClassName: "Evening" });
    assert.equal(student.level, "B1");
    assert.deepEqual(student.coursePlacements[other], { level: "A1", levelId: "A1", className: "Evening" });
    apply(other);
    assert.equal(student.classId, "");
    assert.equal(student.className, "Evening");
    apply("both");
    assert.equal(student.coursePlacements[primary].classId, "morning");
    apply(primary);
    assert.equal(student.level, "B1");
    assert.equal(student.classId, "morning");
    assert.equal(student.secondaryProgram, null);
  });
}

test("switching to a single course applies edits to that language", () => {
  const student = { program: "swahili", level: "A1", secondaryProgram: "german",
    coursePlacements: { german: { level: "A1", classId: "evening" } } };
  const patch = courseEnrollmentPatch(student, { expectedPrimary: "swahili", mode: "german", secondaryLevel: "C2" });
  assert.equal(patch.level, "C2");
  assert.equal(patch.classId, "evening");
  assert.equal(patch.coursePlacements.swahili.level, "A1");
});

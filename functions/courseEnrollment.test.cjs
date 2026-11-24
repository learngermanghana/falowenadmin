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

test("paid German learner receives independent three calendar months and editable Swahili expiry", () => {
  const now = new Date("2026-11-24T10:00:00Z");
  const student = {program:"german",level:"A2",paid:3000,contractEnd:"2027-05-24",paymentStatus:"paid"};
  const change = (fields, date=now) => Object.assign(student, courseEnrollmentPatch(student,{mode:"both",expectedPrimary:"german",...fields},date));
  change({grantSecondaryAccess:true});
  assert.equal(student.coursePlacements.swahili.contractEnd,"2027-02-24T10:00:00.000Z");
  assert.equal(student.coursePlacements.swahili.accessType,"complimentary");
  assert.equal(student.coursePlacements.swahili.paid,undefined);
  assert.equal(student.contractEnd,"2027-05-24");
  change({secondaryClassName:"A1 evening"},new Date("2026-12-01"));
  assert.equal(student.coursePlacements.swahili.contractEnd,"2027-02-24T10:00:00.000Z");
  change({secondaryAccessEnd:"2027-03-31"});
  assert.equal(student.coursePlacements.swahili.contractEnd,"2027-03-31T23:59:59.999Z");
  assert.equal(student.paid,3000);
});
test("unpaid German learners cannot use the complimentary grant", () => {
  assert.throws(() => courseEnrollmentPatch({program:"german",paid:0},{mode:"both",expectedPrimary:"german",grantSecondaryAccess:true}),/paid German course/);
});

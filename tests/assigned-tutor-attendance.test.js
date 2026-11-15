import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { authorizeAssignedTutor } = require("../functions/assignedTutorAttendance.js");
const { studentBelongsToClass } = require("../functions/classSessionReminderEmails.js");

const classId = "swahili-cohort";
const sessionId = "session-1";
const teacher = { uid: "tutor-1", staff: true, staffRole: "teacher", staffLanguages: ["swahili"] };
const klass = { name: "Kiswahili A1", tutorId: teacher.uid, language: "Swahili" };

function attendanceDb({ staff = { active: true, staffRole: "teacher", languages: ["swahili"] }, sessionClass = classId } = {}) {
  const data = {
    falowenStaffAccess: { [teacher.uid]: staff },
    classes: { [classId]: klass },
    classSessions: { [sessionId]: { classId: sessionClass } },
  };
  return { collection: name => ({ doc: id => ({ get: async () => ({ data: () => data[name][id] }) }) }) };
}

test("only the active assigned tutor can operate a session in their teaching language", async () => {
  const db = attendanceDb();
  assert.equal((await authorizeAssignedTutor(db, teacher, classId, sessionId)).klass.id, classId);
  assert.equal(await authorizeAssignedTutor(db, { ...teacher, uid: "different-tutor" }, classId, sessionId), null);
  assert.equal(await authorizeAssignedTutor(db, { ...teacher, staffLanguages: ["german"] }, classId, sessionId), null);
  assert.equal(await authorizeAssignedTutor(db, { ...teacher, staffRole: "reviewer" }, classId, sessionId), null);
  assert.equal(await authorizeAssignedTutor(attendanceDb({ staff: { active: false } }), teacher, classId, sessionId), null);
  assert.equal(await authorizeAssignedTutor(attendanceDb({ sessionClass: "other-class" }), teacher, classId, sessionId), null);
});

test("Swahili reminders and attendance include active secondary placements only", () => {
  const student = {
    program: "german", classId: "german-cohort", secondaryProgram: "swahili",
    coursePlacements: { swahili: { classRecordId: classId } },
  };
  assert.equal(studentBelongsToClass(student, { ...klass, id: classId }), true);
  assert.equal(studentBelongsToClass({ ...student, secondaryProgram: "" }, { ...klass, id: classId }), false);
  assert.equal(studentBelongsToClass(student, { id: "german-cohort", language: "German" }), true);
  assert.equal(studentBelongsToClass({ program: "german", classId }, { ...klass, id: classId }), false);
});

test("assigned attendance requires permission in both the token and current staff record", async () => {
  const staff = { active: true, staffRole: "teacher", languages: ["swahili"], pages: ["attendance"] };
  const token = { ...teacher, staffPages: ["attendance"] };
  assert.ok(await authorizeAssignedTutor(attendanceDb({ staff }), token, classId, sessionId));
  assert.equal(await authorizeAssignedTutor(attendanceDb({ staff }), { ...token, staffPages: ["marking"] }, classId, sessionId), null);
  assert.equal(await authorizeAssignedTutor(attendanceDb({ staff: { ...staff, pages: ["teaching-slides"] } }), token, classId, sessionId), null);
});

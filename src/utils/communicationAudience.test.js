import test from "node:test";
import assert from "node:assert/strict";
import {
  assignmentIdsOf,
  filterStudentsByAttendance,
  filterStudentsNotCheckedIn,
  filterUnpaidStudents,
  submissionMatchesAssignments,
} from "./communicationAudience.js";

const students = [
  { id: "1", studentCode: "A-1", name: "Ama", email: "ama@example.com", paymentStatus: "paid" },
  { id: "2", studentCode: "A-2", name: "Kojo", email: "kojo@example.com", balanceDue: 200 },
  { id: "3", studentCode: "A-3", name: "Esi", email: "esi@example.com", paymentStatus: "pending" },
];

test("attendance filters use the selected session only", () => {
  const session = {
    students: {
      "A-1": { present: true, status: "present" },
      "A-2": { present: false, status: "absent" },
      "A-3": { present: false, status: "" },
    },
  };
  assert.deepEqual(filterStudentsByAttendance(students, session, "present").map((row) => row.studentCode), ["A-1"]);
  assert.deepEqual(filterStudentsByAttendance(students, session, "absent").map((row) => row.studentCode), ["A-2"]);
});

test("not checked in matches student identity safely", () => {
  const result = filterStudentsNotCheckedIn(students, [{ studentCode: "A-1" }, { email: "esi@example.com" }]);
  assert.deepEqual(result.map((row) => row.studentCode), ["A-2"]);
});

test("unpaid requires explicit payment evidence", () => {
  assert.deepEqual(filterUnpaidStudents(students).map((row) => row.studentCode), ["A-2", "A-3"]);
});

test("assignment matching accepts canonical assignment variants", () => {
  const ids = assignmentIdsOf({ assignmentIds: ["A2-5.14"] });
  assert.equal(submissionMatchesAssignments({ assignment_id: "A2-5_14" }, ids), true);
  assert.equal(submissionMatchesAssignments({ assignmentId: "A2-5.13" }, ids), false);
});

import test from "node:test";
import assert from "node:assert/strict";

import { listStudentsByClassWithDeps } from "../src/services/studentsService.js";

test("Firestore class transfer suppresses a stale published-sheet roster entry from the old class", async () => {
  const currentFirestoreStudent = {
    id: "student-1",
    studentCode: "S-001",
    email: "student@example.com",
    name: "Transferred Student",
    classId: "new-class",
    classRecordId: "new-class",
    className: "A1 Dortmund Klasse",
  };
  const stalePublishedStudent = {
    id: "S-001",
    studentCode: "S-001",
    email: "student@example.com",
    name: "Transferred Student",
    className: "A1 Berlin Klasse",
  };

  const oldClass = await listStudentsByClassWithDeps("old-class", {
    className: "A1 Berlin Klasse",
    loadStudentsByField: async () => [],
    loadAllStudents: async () => [currentFirestoreStudent],
    loadPublishedStudentsByClass: async (identifier) => (
      identifier === "A1 Berlin Klasse" ? [stalePublishedStudent] : []
    ),
  });
  assert.deepEqual(oldClass, []);

  const newClass = await listStudentsByClassWithDeps("new-class", {
    className: "A1 Dortmund Klasse",
    loadStudentsByField: async () => [currentFirestoreStudent],
    loadAllStudents: async () => [currentFirestoreStudent],
    loadPublishedStudentsByClass: async () => [],
  });
  assert.equal(newClass.length, 1);
  assert.equal(newClass[0].studentCode, "S-001");
});

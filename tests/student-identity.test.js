import test from "node:test";
import assert from "node:assert/strict";

import { codeFromScopeKey, resolveStudentIdentity } from "../src/utils/studentIdentity.js";

const scopeKey = "17lztisya8p2kru8b8xxdhvmknz2__Abigailkellisakara815__sakaraabigail1_gmail.com";

test("flat submission identity keeps the document student code and identity fields", () => {
  assert.deepEqual(resolveStudentIdentity({
    studentCode: "Abigailkellisakara815",
    studentName: "Abigail kelli sakara",
    studentEmail: "sakaraabigail1@gmail.com",
    studentId: "17LztISYa8P2krU8b8xXDhVMknZ2",
  }), {
    studentCode: "Abigailkellisakara815",
    studentcode: "Abigailkellisakara815",
    student_code: "Abigailkellisakara815",
    studentName: "Abigail kelli sakara",
    studentEmail: "sakaraabigail1@gmail.com",
    studentId: "17LztISYa8P2krU8b8xXDhVMknZ2",
    studentScopeKey: "",
  });
});

test("flat submission identity reads aliases from raw submission data", () => {
  const identity = resolveStudentIdentity({ raw: { student_code: "STU-RAW", studentName: "Raw Student" } });

  assert.equal(identity.studentCode, "STU-RAW");
  assert.equal(identity.studentcode, "STU-RAW");
  assert.equal(identity.student_code, "STU-RAW");
  assert.equal(identity.studentName, "Raw Student");
});

test("student code is extracted from a student scope key", () => {
  assert.equal(codeFromScopeKey(scopeKey), "Abigailkellisakara815");
  assert.equal(resolveStudentIdentity({ studentScopeKey: scopeKey }).studentCode, "Abigailkellisakara815");
});

test("direct marking result student code wins over scope-key fallback", () => {
  const identity = resolveStudentIdentity({ studentCode: "DIRECT-CODE", studentScopeKey: scopeKey });

  assert.equal(identity.studentCode, "DIRECT-CODE");
  assert.equal(identity.studentcode, "DIRECT-CODE");
  assert.equal(identity.student_code, "DIRECT-CODE");
});

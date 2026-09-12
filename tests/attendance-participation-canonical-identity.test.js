import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = new URL("../", import.meta.url);

execFileSync(process.execPath, ["scripts/patchAttendanceParticipationSummaryEmail.mjs"], {
  cwd: root,
  stdio: "pipe",
});
execFileSync(process.execPath, ["scripts/patchAttendanceParticipationCanonicalIdentity.mjs"], {
  cwd: root,
  stdio: "pipe",
});

delete require.cache[require.resolve("../functions/attendanceConfirmationEmails.js")];
const { _test } = require("../functions/attendanceConfirmationEmails.js");
const {
  participationRecordMatchesStudent,
  participationRecordBelongsToClass,
} = _test;

const student = {
  uid: "uid-one",
  studentCode: "same-name-001",
  email: "one@example.com",
  name: "Shared Name",
};

const record = {
  studentUid: "uid-one",
  studentCode: "same-name-001",
  studentEmail: "one@example.com",
  studentEmailNormalized: "one@example.com",
  studentName: "Shared Name",
};

test("canonical student identities prevent same-name participation leakage", () => {
  assert.equal(participationRecordMatchesStudent(record, student), true);

  const differentStudentSameName = {
    uid: "uid-two",
    studentCode: "same-name-002",
    email: "two@example.com",
    name: "Shared Name",
  };
  assert.equal(participationRecordMatchesStudent(record, differentStudentSameName), false);
});

test("a conflicting canonical student identifier rejects the record even when another field or name matches", () => {
  assert.equal(participationRecordMatchesStudent(record, {
    uid: "different-uid",
    studentCode: "same-name-001",
    email: "one@example.com",
    name: "Shared Name",
  }), false);
});

test("student name is only a fallback when neither side has a canonical identifier", () => {
  assert.equal(participationRecordMatchesStudent({ studentName: "Legacy Student" }, { name: "Legacy Student" }), true);
  assert.equal(participationRecordMatchesStudent({ studentName: "Legacy Student" }, {
    uid: "uid-present",
    name: "Legacy Student",
  }), false);
});

test("canonical class id wins over a shared display name", () => {
  const klass = {
    id: "class-one",
    classId: "class-one",
    name: "A1 Berlin Klasse",
  };

  assert.equal(participationRecordBelongsToClass({
    classId: "class-one",
    className: "A1 Berlin Klasse",
  }, klass), true);

  assert.equal(participationRecordBelongsToClass({
    classId: "class-two",
    className: "A1 Berlin Klasse",
  }, klass), false);
});

test("legacy class records without an id can still match by class name", () => {
  assert.equal(participationRecordBelongsToClass({
    className: "A1 Berlin Klasse",
  }, {
    id: "class-one",
    name: "A1 Berlin Klasse",
  }), true);
});

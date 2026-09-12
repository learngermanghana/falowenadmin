import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const targetPath = path.join(root, "functions", "attendanceConfirmationEmails.js");
const basePatch = path.join(root, "scripts", "patchAttendanceParticipationSummaryEmail.mjs");
let source = fs.readFileSync(targetPath, "utf8");

if (!source.includes("// BEGIN ATTENDANCE PARTICIPATION SUMMARY")) {
  execFileSync(process.execPath, [basePatch], { cwd: root, stdio: "inherit" });
  source = fs.readFileSync(targetPath, "utf8");
}

const unsafeStudentBlock = `function participationStudentIdentityValues(record = {}) {
  return [
    record.studentUid,
    record.studentCode,
    record.studentEmail,
    record.studentEmailNormalized,
    record.studentName,
  ].map(comparable).filter(Boolean);
}

function participationRecordMatchesStudent(record = {}, student = {}) {
  const identities = new Set(studentIdentityValues(student));
  return participationStudentIdentityValues(record).some((value) => identities.has(value));
}`;

const safeStudentBlock = `function participationRecordCanonicalIdentity(record = {}) {
  return {
    uid: comparable(record.studentUid),
    code: comparable(record.studentCode),
    email: comparable(record.studentEmailNormalized || record.studentEmail),
  };
}

function participationStudentCanonicalIdentity(student = {}) {
  return {
    uid: comparable(student.uid),
    code: comparable(student.studentCode || student.studentcode),
    email: comparable(student.email),
  };
}

function hasParticipationCanonicalIdentity(identity = {}) {
  return Boolean(identity.uid || identity.code || identity.email);
}

function participationRecordMatchesStudent(record = {}, student = {}) {
  const recordIdentity = participationRecordCanonicalIdentity(record);
  const studentIdentity = participationStudentCanonicalIdentity(student);
  let matchedCanonical = false;

  for (const field of ["uid", "code", "email"]) {
    const recordValue = recordIdentity[field];
    const studentValue = studentIdentity[field];
    if (!recordValue || !studentValue) continue;
    if (recordValue !== studentValue) return false;
    matchedCanonical = true;
  }

  if (matchedCanonical) return true;
  if (hasParticipationCanonicalIdentity(recordIdentity) || hasParticipationCanonicalIdentity(studentIdentity)) return false;

  const recordName = comparable(record.studentName);
  const studentName = comparable(student.name);
  return Boolean(recordName && studentName && recordName === studentName);
}`;

const unsafeClassBlock = `function participationRecordBelongsToClass(record = {}, klass = {}) {
  const classValues = new Set(classIdentityValues(klass));
  return [record.classId, record.className]
    .map(comparable)
    .filter(Boolean)
    .some((value) => classValues.has(value));
}`;

const safeClassBlock = `function participationRecordBelongsToClass(record = {}, klass = {}) {
  const recordClassId = comparable(record.classId);
  const classIds = [klass.id, klass.classId, klass.classRecordId]
    .map(comparable)
    .filter(Boolean);

  if (recordClassId && classIds.length) {
    return classIds.includes(recordClassId);
  }

  const recordClassName = comparable(record.className);
  const classNames = [klass.name, klass.className, klass.group, klass.slug]
    .map(comparable)
    .filter(Boolean);
  return Boolean(recordClassName && classNames.includes(recordClassName));
}`;

function replaceOrConfirm(unsafeBlock, safeBlock, label) {
  if (source.includes(safeBlock)) return;
  if (!source.includes(unsafeBlock)) throw new Error(`Could not harden ${label}.`);
  source = source.replace(unsafeBlock, safeBlock);
}

replaceOrConfirm(unsafeStudentBlock, safeStudentBlock, "student participation identity matching");
replaceOrConfirm(unsafeClassBlock, safeClassBlock, "class participation identity matching");

if (!source.includes("    participationRecordBelongsToClass,")) {
  const anchor = "    participationRecordMatchesStudent,";
  if (!source.includes(anchor)) throw new Error("Could not export participation class matcher for regression tests.");
  source = source.replace(anchor, `${anchor}\n    participationRecordBelongsToClass,`);
}

fs.writeFileSync(targetPath, source, "utf8");
console.log("Attendance participation matching now rejects conflicting canonical student and class identities.");

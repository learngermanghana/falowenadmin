import { collection, doc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { db } from "../firebase.js";
import {
  loadPublishedStudentRows,
  readPublishedClassName,
  readPublishedLevel,
  readPublishedStatus,
  readPublishedStudentCode,
  readPublishedStudentEmail,
  readPublishedStudentName,
} from "./publishedSheetService.js";

const ROSTER_SOURCE_TIMEOUT_MS = 8000;

function byNameAsc(a, b) {
  return String(a?.name || "").localeCompare(String(b?.name || ""));
}

function normalize(value) {
  return String(value || "").trim();
}

function normalizeComparable(value) {
  return normalize(value).toLowerCase().replace(/\s+/g, " ");
}

function settleWithin(promise, fallback = []) {
  return Promise.race([
    Promise.resolve(promise).catch(() => fallback),
    new Promise((resolve) => globalThis.setTimeout(() => resolve(fallback), ROSTER_SOURCE_TIMEOUT_MS)),
  ]);
}

function isActiveStudent(row = {}) {
  const status = normalize(row.status || row.studentStatus || row.enrollmentStatus).toLowerCase();
  if (!status) return true;
  return !["inactive", "archived", "withdrawn", "removed", "cancelled", "canceled"].includes(status);
}

function studentIdentityKeys(student = {}) {
  const strongKeys = [
    student.studentCode,
    student.studentcode,
    student.uid,
    student.email,
  ].map(normalizeComparable).filter(Boolean);

  if (strongKeys.length) return strongKeys;

  return [student.id, student.name]
    .map(normalizeComparable)
    .filter(Boolean);
}

function uniqueStudents(rows = []) {
  const seen = new Set();
  return rows.filter((student) => {
    const keys = studentIdentityKeys(student);
    if (!keys.length || keys.some((key) => seen.has(key))) return false;
    keys.forEach((key) => seen.add(key));
    return true;
  });
}

function studentClassValues(student = {}) {
  return [
    student.classId,
    student.classRecordId,
    student.className,
    student.classname,
    student.class,
    student.group,
    student.groupId,
    student.groupName,
    student.cohort,
    student.cohortId,
    student.cohortName,
  ].map(normalizeComparable).filter(Boolean);
}

function resolvePublishedClass(row) {
  const className = normalize(readPublishedClassName(row));
  if (className) return className;
  return normalize(readPublishedLevel(row));
}

function mapPublishedStudent(row) {
  return {
    id: String(readPublishedStudentCode(row) || readPublishedStudentName(row) || "").trim(),
    name: normalize(readPublishedStudentName(row)),
    email: normalize(readPublishedStudentEmail(row)),
    studentCode: normalize(readPublishedStudentCode(row)),
    className: resolvePublishedClass(row),
    status: normalize(readPublishedStatus(row)).toLowerCase(),
    role: "student",
  };
}

export async function listPublishedStudentsByClassWithLoader(classId, loadRows = loadPublishedStudentRows) {
  const targetClassName = normalizeComparable(classId);
  if (!targetClassName) return [];

  const rows = await loadRows();

  return rows
    .filter((row) => {
      const className = normalizeComparable(readPublishedClassName(row));
      return className === targetClassName;
    })
    .map(mapPublishedStudent)
    .filter((row) => row.name && isActiveStudent(row))
    .sort(byNameAsc);
}

export async function loadStudentsByFieldWithFirestore(fieldName, classId, firestore = { collection, getDocs, query, where, db }) {
  const q = firestore.query(firestore.collection(firestore.db, "students"), firestore.where(fieldName, "==", classId));
  const snap = await firestore.getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byNameAsc);
}

export async function listAllStudentsWithFirestore(firestore = { collection, getDocs, db }) {
  const snap = await firestore.getDocs(firestore.collection(firestore.db, "students"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byNameAsc);
}

export async function updateStudentByIdWithFirestore(studentId, payload, firestore = { doc, updateDoc, db }) {
  if (!normalize(studentId)) {
    throw new Error("Student ID is required");
  }

  const studentRef = firestore.doc(firestore.db, "students", studentId);
  await firestore.updateDoc(studentRef, payload);
}

export async function createStudentWithFirestore(
  studentId,
  payload,
  firestore = { doc, setDoc, serverTimestamp, db },
) {
  if (!normalize(studentId)) {
    throw new Error("Student ID is required");
  }

  const studentRef = firestore.doc(firestore.db, "students", studentId);
  await firestore.setDoc(studentRef, { ...payload, updated_at: firestore.serverTimestamp() }, { merge: true });
}

export async function listStudentsByClassWithDeps(
  classId,
  {
    className = "",
    loadPublishedStudentsByClass = listPublishedStudentsByClassWithLoader,
    loadStudentsByField = loadStudentsByFieldWithFirestore,
    loadAllStudents = listAllStudentsWithFirestore,
  } = {},
) {
  const identifiers = [...new Set(
    [classId, className]
      .map(normalize)
      .filter(Boolean),
  )];
  const comparableIdentifiers = new Set(identifiers.map(normalizeComparable));
  const fields = ["classId", "classRecordId", "className"];

  const exactQueries = identifiers.flatMap((identifier) =>
    fields.map((field) => settleWithin(loadStudentsByField(field, identifier))),
  );
  const publishedIdentifiers = [...new Set([className, classId].map(normalize).filter(Boolean))];
  const publishedQueries = publishedIdentifiers.map((identifier) =>
    settleWithin(loadPublishedStudentsByClass(identifier)),
  );

  const [exactResults, allStudents, publishedResults] = await Promise.all([
    Promise.all(exactQueries),
    settleWithin(loadAllStudents()),
    Promise.all(publishedQueries),
  ]);

  const rosterRows = exactResults.flat();
  rosterRows.push(...allStudents.filter((student) =>
    studentClassValues(student).some((value) => comparableIdentifiers.has(value)),
  ));
  rosterRows.push(...publishedResults.flat());

  return uniqueStudents(rosterRows)
    .filter((row) => row.name && isActiveStudent(row))
    .sort(byNameAsc);
}

export async function listStudentsByClass(classId, options = {}) {
  return listStudentsByClassWithDeps(classId, options);
}

export async function listAllStudents() {
  return listAllStudentsWithFirestore();
}

export async function updateStudentById(studentId, payload) {
  return updateStudentByIdWithFirestore(studentId, payload);
}

export async function createStudent(studentId, payload) {
  return createStudentWithFirestore(studentId, payload);
}

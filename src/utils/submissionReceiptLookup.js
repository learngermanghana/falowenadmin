import { resolveStudentIdentity } from "./studentIdentity.js";
import { normalizeTimedAssignmentKey } from "./timedAttemptLookup.js";

export function receiptAssignmentKey(row = {}) {
  return normalizeTimedAssignmentKey(row.assignmentKey || row.assignment_key || row.assignmentId
    || row.assignment_id || row.canonicalAssignmentKey || row.assignment);
}

const UID_FIELDS = ["studentId", "student_id", "uid"];
const EMAIL_FIELDS = ["studentEmail", "email"];
const CODE_FIELDS = ["studentCode", "studentcode", "student_code"];

// read() returns documents with their full Firestore path. Query failures must
// propagate: an incomplete search is not evidence that a receipt is missing.
export async function lookupSubmissionReceipts({ who, assignmentKey, timerRecords = [], read }) {
  const entered = String(who || "").trim();
  const key = normalizeTimedAssignmentKey(assignmentKey);
  const level = key.split("-")[0];
  const uids = new Set(entered.includes("@") ? [] : [entered]);
  const emails = new Set(entered.includes("@") ? [entered, entered.toLowerCase()] : []);
  const codes = new Set();
  const addIdentity = (row) => {
    const identity = resolveStudentIdentity(row);
    if (identity.studentId) uids.add(identity.studentId);
    if (identity.studentEmail) {
      emails.add(identity.studentEmail);
      emails.add(identity.studentEmail.toLowerCase());
    }
    if (identity.studentCode) codes.add(identity.studentCode);
    if (row.code) codes.add(String(row.code).trim());
  };
  timerRecords.forEach(addIdentity);
  const profiles = await Promise.all([
    ...[...uids].map(value => read({ kind: "document", path: `students/${value}` })),
    ...[...uids].flatMap(value => UID_FIELDS.map(field => read({ kind: "collection", path: "students", field, value }))),
    ...[...emails].flatMap(value => EMAIL_FIELDS.map(field => read({ kind: "collection", path: "students", field, value }))),
  ]);
  profiles.flat().forEach(row => {
    addIdentity(row);
    // Student profiles may be keyed by either the login UID or student code.
    if (row.id) {
      uids.add(row.id);
      if (!resolveStudentIdentity(row).studentCode && !row.code) codes.add(row.id);
    }
  });

  const queries = [];
  for (const path of ["submissions", "posts"]) {
    for (const [fields, values] of [[UID_FIELDS, uids], [EMAIL_FIELDS, emails], [CODE_FIELDS, codes]]) {
      for (const value of values) for (const field of fields) {
        queries.push({ kind: "group", path, field, value });
      }
    }
  }
  // Older per-student collections can omit identity fields entirely.
  for (const code of codes) queries.push({ kind: "collection", path: `submissions/${level}/${code}` });
  const batches = await Promise.all(queries.map(read));
  const receipts = new Map();
  for (const row of batches.flat()) {
    if (row.__collectionShape === "container" || receiptAssignmentKey(row) !== key) continue;
    receipts.set(row.path, { ...row, assignmentKey: receiptAssignmentKey(row) });
  }
  return [...receipts.values()];
}

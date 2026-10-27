import { inferSubmissionIdentityFromPath } from "./submissionIdentity.js";
import { resolveStudentIdentity } from "./studentIdentity.js";
import { normalizeTimedAssignmentKey } from "./timedAttemptLookup.js";

export const RECEIPT_IDENTITY_FIELDS = Object.freeze({
  uid: Object.freeze(["studentId", "student_id", "uid", "userId", "ownerUid"]),
  email: Object.freeze(["studentEmail", "email"]),
  code: Object.freeze(["studentCode", "studentcode", "student_code"]),
});

const trimmed = value => String(value ?? "").trim();
const lowercase = value => trimmed(value).toLowerCase();
const safeSegment = value => /^[A-Za-z0-9._-]+$/.test(value) && value !== "." && value !== "..";
const unique = values => [...new Set(values.map(trimmed).filter(Boolean))];

export function buildCampusReceiptLookupPlan({ studentInput, assignmentKey, timerRecords = [] }) {
  const student = trimmed(studentInput);
  const isEmail = student.includes("@");
  const level = normalizeTimedAssignmentKey(assignmentKey).split("-")[0];
  const uids = unique([!isEmail ? student : "", ...timerRecords.flatMap(row => [
    row.studentId, row.student_id, row.uid, row.userId, row.ownerUid,
  ])]);
  const emails = unique([isEmail ? student.toLowerCase() : "", ...timerRecords.flatMap(row => [
    row.studentEmail, row.email,
  ])]).map(lowercase);
  const codes = unique(timerRecords.flatMap(row => [
    row.studentCode, row.studentcode, row.student_code,
  ]));
  const selectors = [];
  for (const [kind, values] of [["uid", uids], ["email", emails], ["code", codes]]) {
    for (const value of values) for (const field of RECEIPT_IDENTITY_FIELDS[kind]) {
      selectors.push({ field, value });
    }
  }
  const nestedIds = unique([...uids, ...codes]).filter(safeSegment);
  return { level, uids, emails, codes, selectors, nestedIds };
}

export function isReceiptForCampusAssignment(data = {}, path = "", assignmentKey = "", plan = {}) {
  if (!data || data.__collectionShape === "container") return false;
  const expected = normalizeTimedAssignmentKey(assignmentKey);
  const values = [
    data.canonicalAssignmentKey, data.assignmentKey, data.assignmentId,
    data.assignment_id, data.assignment_key, data.assignment, data.raw?.assignmentKey,
    path.split("/").pop(),
  ];
  if (!values.some(item => normalizeTimedAssignmentKey(item) === expected)) return false;
  const status = lowercase(data.status || data.submissionStatus);
  if (["draft", "unsaved", "deleted"].includes(status)) return false;

  const inferred = inferSubmissionIdentityFromPath(path);
  const identity = resolveStudentIdentity(data, inferred.studentCode);
  const identityUids = unique([
    identity.studentId, data.studentId, data.student_id, data.uid,
    data.userId, data.ownerUid, data.raw?.studentId, data.raw?.uid,
  ]);
  const matchedUid = plan.uids?.some(id => identityUids.includes(trimmed(id)));
  const matchedEmail = plan.emails?.some(email => lowercase(email) === lowercase(identity.studentEmail));
  const matchedCode = plan.codes?.some(code => lowercase(code) === lowercase(identity.studentCode));
  const nestedPathMatches = plan.nestedIds?.some(id =>
    [plan.level, plan.level?.toLowerCase()].some(level =>
      path.startsWith(`submissions/${level}/${id}/`)));
  // Never return another student's submission solely from a reused student code.
  if (identityUids.length && plan.uids?.length && !matchedUid) return false;
  return Boolean(matchedUid || matchedEmail || matchedCode || nestedPathMatches);
}

export async function findCampusSubmissionReceipts({
  db, studentInput, assignmentKey, timerRecords = [], firestore, maxPerQuery = 50,
}) {
  const plan = buildCampusReceiptLookupPlan({ studentInput, assignmentKey, timerRecords });
  const { collection, collectionGroup, getDocs, query, where, limit } = firestore;
  const targets = [];
  for (const selector of plan.selectors) {
    for (const source of [
      collection(db, "submissions"),
      collectionGroup(db, "posts"),
      collectionGroup(db, "submissions"),
    ]) {
      targets.push({ description: `${source.path || source.id || "submission collection"} · ${selector.field}`,
        ref: query(source, where(selector.field, "==", selector.value), limit(maxPerQuery)) });
    }
  }
  for (const level of unique([plan.level, plan.level.toLowerCase()])) {
    for (const id of plan.nestedIds) {
      targets.push({
        description: `submissions/${level}/${id}`,
        ref: query(collection(db, "submissions", level, id), limit(maxPerQuery)),
      });
    }
  }
  const receipts = new Map();
  const errors = [];
  let cappedQueries = 0;
  // Bounded fan-out to avoid hitting Firestore with a large concurrent scan.
  for (let offset = 0; offset < targets.length; offset += 4) {
    const chunk = targets.slice(offset, offset + 4);
    const outcomes = await Promise.allSettled(chunk.map(target => getDocs(target.ref)));
    outcomes.forEach((outcome, index) => {
      if (outcome.status !== "fulfilled") {
        errors.push(`${chunk[index].description}: ${outcome.reason?.message || "query failed"}`);
        return;
      }
      const docs = outcome.value.docs || [];
      if (docs.length >= maxPerQuery) cappedQueries += 1;
      for (const result of docs) {
        const data = result.data() || {};
        const path = result.ref?.path || result.id;
        if (!isReceiptForCampusAssignment(data, path, assignmentKey, plan)) continue;
        receipts.set(path, {
          ...data,
          id: result.id,
          path,
        });
      }
    });
  }
  if (targets.length && errors.length === targets.length) {
    throw new Error("All submission receipt lookups failed. Check staff permissions or Firestore indexes; no absence can be concluded.");
  }
  return {
    receipts: [...receipts.values()],
    incomplete: Boolean(errors.length || cappedQueries),
    errors,
    cappedQueries,
    queriedSources: targets.length,
  };
}

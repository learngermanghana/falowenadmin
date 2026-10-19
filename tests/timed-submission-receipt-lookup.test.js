import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCampusReceiptLookupPlan,
  findCampusSubmissionReceipts,
  isReceiptForCampusAssignment,
} from "../src/utils/timedSubmissionReceiptLookup.js";

const makeAdapter = (documents, failedSource = "") => ({
  collection: (_db, ...parts) => ({ path: parts.join("/"), kind: "collection" }),
  collectionGroup: (_db, name) => ({ path: `group:${name}`, kind: "group" }),
  where: (field, op, value) => ({ field, op, value }),
  limit: (count) => ({ count }),
  query: (source, ...conditions) => ({ source, conditions }),
  async getDocs(q) {
    if (q.source.path === failedSource) throw new Error("permission denied");
    const f = q.conditions.find(item => item.field);
    const size = q.conditions.find(item => item.count)?.count ?? 50;
    const matches = documents.filter(doc => {
      if (q.source.kind === "group") {
        const collectionName = doc.path.split("/").at(-2);
        if (collectionName !== q.source.path.slice(6)) return false;
      } else if (!doc.path.startsWith(q.source.path + "/")
        || doc.path.split("/").length !== q.source.path.split("/").length + 1) return false;
      return !f || doc.fields[f.field] === f.value;
    });
    return { docs: matches.slice(0, size).map(({ path, fields }) => ({
      id: path.split("/").at(-1), ref: { path }, data: () => fields,
    })) };
  },
});
const doc = (path, fields) => ({ path, fields });
const plan = buildCampusReceiptLookupPlan({
  studentInput: "uid42", assignmentKey: "A1-11",
  timerRecords: [{ studentId: "uid42", studentCode: "A1007", studentEmail: "learner@example.com" }],
});

test("plan covers historical student UID/email/code fields and nested paths", () => {
  const pairs = plan.selectors.map(selector => `${selector.field}=${selector.value}`);
  for (const field of ["studentId", "student_id", "uid", "userId", "ownerUid"]) {
    assert.ok(pairs.includes(`${field}=uid42`));
  }
  for (const field of ["studentEmail", "email"]) {
    assert.ok(pairs.includes(`${field}=learner@example.com`));
  }
  assert.ok(plan.nestedIds.includes("A1007"));
  assert.ok(plan.nestedIds.includes("uid42"));
});

test("matches flat, posts, nested submissions and legacy per-student collection", async () => {
  const samples = [
    doc("submissions/flat", { uid: "uid42", assignmentKey: "A1-11", status: "submitted" }),
    doc("classes/A1/students/A1007/posts/p01", { student_id: "uid42", assignment_id: "A1-11", status: "marked" }),
    doc("classes/A1/students/A1007/submissions/s01", { email: "learner@example.com", canonicalAssignmentKey: "A1-11" }),
    doc("submissions/A1/A1007/old1", { assignmentId: "A1-11", status: "submitted" }),
    doc("submissions/unrelated", { studentId: "someone-else", assignmentKey: "A1-11" }),
    doc("submissions/different", { uid: "uid42", assignmentKey: "A1-12" }),
    doc("submissions/draft", { uid: "uid42", assignmentKey: "A1-11", status: "draft" }),
  ];
  const result = await findCampusSubmissionReceipts({
    db: {}, studentInput: "uid42", assignmentKey: "A1-11",
    timerRecords: [{ studentId: "uid42", studentCode: "A1007", studentEmail: "learner@example.com" }],
    firestore: makeAdapter(samples),
  });
  assert.equal(result.incomplete, false);
  assert.deepEqual(result.receipts.map(row => row.path).sort(), [
    "classes/A1/students/A1007/posts/p01",
    "classes/A1/students/A1007/submissions/s01",
    "submissions/A1/A1007/old1",
    "submissions/flat",
  ]);
});

test("alias UID and email records can match without canonical studentId", () => {
  assert.equal(isReceiptForCampusAssignment(
    { ownerUid: "uid42", assignmentKey: "A1-11" }, "submissions/owner", "A1-11", plan,
  ), true);
  assert.equal(isReceiptForCampusAssignment(
    { email: "learner@example.com", assignmentId: "A1-11" }, "submissions/email", "A1-11", plan,
  ), true);
  assert.equal(isReceiptForCampusAssignment(
    { uid: "another-user", email: "learner@example.com", assignmentId: "A1-11" },
    "submissions/other", "A1-11", plan,
  ), false);
});

test("a failed or capped source marks the negative result inconclusive", async () => {
  const result = await findCampusSubmissionReceipts({
    db: {}, studentInput: "uid42", assignmentKey: "A1-11",
    firestore: makeAdapter([], "group:posts"),
  });
  assert.deepEqual(result.receipts, []);
  assert.equal(result.incomplete, true);
  assert.ok(result.errors.length > 0);
});

test("a query cannot represent every historical record; never call an unresolved source complete", async () => {
  const result = await findCampusSubmissionReceipts({
    db: {}, studentInput: "uid42", assignmentKey: "A1-11",
    firestore: makeAdapter([
      doc("submissions/1", { uid: "uid42", assignmentKey: "A1-11" }),
      doc("submissions/2", { uid: "uid42", assignmentKey: "A1-11" }),
    ]),
    maxPerQuery: 2,
  });
  assert.equal(result.incomplete, true);
  assert.equal(result.receipts.length, 2);
});

 test("finds identity-free legacy receipts in both level cases without collapsing repeated IDs", async () => {
  const samples = [
    doc("submissions/A1/A1007/shared", { assignmentId: "A1-11" }),
    doc("submissions/a1/A1007/shared", { assignment_key: "A1-11" }),
    doc("submissions/a1/uid42/by-uid", { assignmentId: "A1-11" }),
    doc("submissions/a1/other/shared", { assignmentId: "A1-11" }),
  ];
  const result = await findCampusSubmissionReceipts({
    db: {}, studentInput: "uid42", assignmentKey: "A1-11",
    timerRecords: [{ studentId: "uid42", studentCode: "A1007" }],
    firestore: makeAdapter(samples),
  });
  assert.equal(result.incomplete, false);
  assert.deepEqual(result.receipts.map(row => row.path).sort(), samples.slice(0, 3).map(row => row.path).sort());
});

 test("stored metadata cannot override the reference path or document ID", async () => {
  const samples = [undefined, null, "shared-path"].flatMap((path, index) => [
    doc(`submissions/flat${index}`, { uid: "uid42", assignmentKey: "A1-11", id: "stored-id", path }),
    doc(`classes/A1/students/A1007/posts/flat${index}`, { uid: "uid42", assignmentKey: "A1-11", id: "stored-id", path }),
  ]);
  const result = await findCampusSubmissionReceipts({
    db: {}, studentInput: "uid42", assignmentKey: "A1-11", firestore: makeAdapter(samples),
  });
  assert.deepEqual(result.receipts.map(row => row.path).sort(), samples.map(row => row.path).sort());
  assert.equal(new Set(result.receipts.map(row => row.path)).size, samples.length);
  for (const row of result.receipts) assert.equal(row.id, row.path.split("/").at(-1));
});

import test from "node:test";
import assert from "node:assert/strict";
import { lookupSubmissionReceipts, receiptAssignmentKey } from "../src/utils/submissionReceiptLookup.js";

function reader(records, calls = []) {
  return async q => {
    calls.push(q);
    return records.filter(row => {
      const parts = row.path.split("/");
      if (q.kind === "document") return row.path === q.path;
      const inSource = q.kind === "group" ? parts.at(-2) === q.path : parts.slice(0, -1).join("/") === q.path;
      return inSource && (!q.field || row[q.field] === q.value);
    });
  };
}
const lookup = (records, options = {}) => lookupSubmissionReceipts({
  who: "login-uid", assignmentKey: "A1-11", read: reader(records), ...options,
});

test("resolves UID and email to a student code for identity-free nested receipts", async () => {
  const records = [
    { path: "students/profile", id: "profile", uid: "login-uid", email: "learner@example.com", student_code: "CODE" },
    { path: "submissions/A1/CODE/receipt", id: "receipt", assignment_key: "A1-11" },
  ];
  for (const who of ["login-uid", "learner@example.com"]) {
    const found = await lookup(records, { who });
    assert.equal(found.length, 1);
    assert.equal(found[0].path, "submissions/A1/CODE/receipt");
  }
});

test("covers posts, nested submissions and identity aliases; deduplicates by full path", async () => {
  const records = [
    { path: "submissions/flat", id: "flat", student_id: "login-uid", assignment: "A1-11" },
    { path: "submissions/A1/posts/same", id: "same", uid: "login-uid", studentId: "login-uid", assignmentId: "A1-11" },
    { path: "students/login-uid/submissions/same", id: "same", uid: "login-uid", canonicalAssignmentKey: "A1-11" },
    { path: "submissions/other", id: "other", uid: "different", assignmentKey: "A1-11" },
  ];
  assert.deepEqual((await lookup(records)).map(x => x.path).sort(), records.slice(0, 3).map(x => x.path).sort());
  const emailRow = { path: "submissions/mail", id: "mail", email: "learner@example.com", assignment_key: "A1-11" };
  assert.equal((await lookup([emailRow], { who: "LEARNER@example.com" })).length, 1);
});

test("does not lose a receipt beyond 200 other assignments", async () => {
  const records = Array.from({ length: 250 }, (_, i) => ({ path: `submissions/${i}`, id: `${i}`, uid: "login-uid", assignmentKey: "A1-10" }));
  records.push({ path: "submissions/last", id: "last", uid: "login-uid", assignmentKey: "A1-11" });
  assert.equal((await lookup(records))[0].id, "last");
});

test("matches all backend assignment aliases and normalizes the display label", async () => {
  for (const field of ["assignmentKey", "assignment_key", "assignmentId", "assignment_id", "canonicalAssignmentKey", "assignment"]) {
    const row = { path: `submissions/${field}`, id: field, uid: "login-uid", [field]: "a1-11" };
    assert.equal(receiptAssignmentKey(row), "A1-11");
    assert.equal((await lookup([row]))[0].assignmentKey, "A1-11");
  }
});

test("uses timer identity for legacy student collections", async () => {
  const row = { path: "submissions/A1/CODE/receipt", id: "receipt", assignmentKey: "A1-11" };
  assert.equal((await lookup([row], { timerRecords: [{ studentCode: "CODE" }] })).length, 1);
});

test("failed sources reject the lookup instead of returning a false zero", async () => {
  await assert.rejects(lookup([], { read: async q => {
    if (q.kind === "group" && q.path === "posts") throw new Error("permission-denied");
    return [];
  } }), /permission-denied/);
});

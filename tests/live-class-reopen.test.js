import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function harness(session) {
  const writes = [];
  const original = { ...session };
  const source = (await readFile(new URL("../src/services/liveClassReopenService.js", import.meta.url), "utf8"))
    .replace(/^import .*;\n/gm, "");
  const factory = new Function("collection", "doc", "runTransaction", "serverTimestamp", "db", source.replace("export async function", "async function") + "\nreturn reopenSession;");
  const runTransaction = async (_db, fn) => fn({
    get: async ref => ({ exists: () => true, data: () => ref === "classSessions/day28" ? original : { name: "B1" } }),
    update: (ref, patch) => writes.push({ ref, patch }),
    set: (ref, patch, options) => writes.push({ ref, patch, options }),
  });
  const reopen = factory((_db, path) => path, (...args) => args.filter(Boolean).join("/"), runTransaction, () => "timestamp", "");
  return { reopen, writes, original };
}

test("reopening synchronizes status, preserves attendance and records prior completion", async () => {
  const { reopen, writes, original } = await harness({ status: "completed", classRecordId: "b1", completedBy: "tutor", completedAt: "old-time", sequence: 3, assignmentIds: ["B1-10.28"] });
  await reopen("day28", { reason: "Lesson has not been taught", adminId: "staff" });
  const session = writes.find(row => row.ref === "classSessions/day28");
  assert.equal(session.patch.status, "scheduled");
  assert.equal(session.patch.autoCompletionSuppressed, true);
  assert.equal(session.patch.sequence, 4);
  assert.equal(session.patch.completedAt, null);
  assert.equal("assignmentIds" in session.patch, false);
  const attendance = writes.find(row => row.ref === "attendance/b1/sessions/day28");
  assert.deepEqual(attendance.options, { merge: true });
  assert.equal(attendance.patch.sessionStatus, "scheduled");
  assert.equal("entries" in attendance.patch, false);
  assert.equal(writes.find(row => row.ref === "auditLogs").patch.previousCompletedBy, "tutor");
  assert.equal(original.status, "completed");
});
test("blank correction reason and stale status produce no writes", async () => {
  const { reopen, writes } = await harness({ status: "scheduled", classId: "b1" });
  await assert.rejects(reopen("day28", { reason: " " }), /reason/);
  await assert.rejects(reopen("day28", { reason: "Correction" }), /no longer completed/);
  assert.equal(writes.length, 0);
});

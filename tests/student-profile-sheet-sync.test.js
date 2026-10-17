import test from "node:test";
import assert from "node:assert/strict";
import syncModule from "../functions/studentProfileSheetSync.js";
import profileModule from "../functions/studentProfileUpdate.js";

const {
  sheetPatchFromUpdates,
  sheetSyncIdentity,
  resolveStudentSheetSyncConfig,
  writeProfileToStudentSheet,
} = syncModule;

test("only supported, existing student sheet columns are changed", () => {
  assert.deepEqual(sheetPatchFromUpdates({
    contractStart: "2026-09-14",
    contractEnd: "2027-03-15",
    balanceDue: 0,
    studentCode: "ABC",
    status: "Paid",
    paymentStatus: "Paid",
    paid: 3000,
    tuitionFee: 3000,
    className: "A2 Berlin",
    contractTermMonths: 6,
    Reminder7Sent: "ignore",
  }), {
    contractStart: "2026-09-14",
    contractEnd: "2027-03-15",
    balanceDue: "0",
    studentCode: "ABC",
    status: "Paid",
  });
});

test("identity comes from the old record, not editable values", () => {
  assert.deepEqual(sheetSyncIdentity({
    uid: "firebase-uid", studentCode: "OLD", email: "old@example.com",
  }, "doc"), { uid: "firebase-uid", studentCode: "OLD", email: "old@example.com" });
});

test("sheet sync requires configuration and never silently claims success", async () => {
  const result = await writeProfileToStudentSheet({
    studentId: "student-1", identity: { uid: "one" },
    updates: { contractEnd: "2027-03-15" }, config: {},
  });
  assert.equal(result.status, "failed");
  assert.match(result.error, /not configured/);
  assert.equal(resolveStudentSheetSyncConfig({}, {}).url, "");
});

test("sheet sync only succeeds after a complete, single-row verification", async () => {
  const input = { studentId: "student-1",
    identity: { uid: "one", email: "old@example.com" },
    updates: { contractStart: "2026-09-14", contractEnd: "2027-03-15" },
    config: { url: "https://script.google.com/macros/s/test/exec", secret: "secret" },
  };
  const fake = (body, ok = true) => async (_url, options) => {
    const payload = JSON.parse(options.body);
    assert.equal(payload.action, "syncStudentProfile");
    assert.equal(payload.identity.uid, "one");
    assert.equal(payload.updates.contractEnd, "2027-03-15");
    return { ok, json: async () => body };
  };
  assert.equal((await writeProfileToStudentSheet({
    ...input, fetchImpl: fake({ ok: true, verified: true, matchedRows: 1,
      verifiedFields: ["contractEnd", "contractStart"], row: 64 }),
  })).status, "synced");
  for (const body of [
    { ok: true, verified: true, matchedRows: 2, verifiedFields: ["contractEnd", "contractStart"] },
    { ok: true, verified: false, matchedRows: 1, verifiedFields: ["contractEnd", "contractStart"] },
    { ok: true, verified: true, matchedRows: 1, verifiedFields: ["contractEnd"] },
  ]) {
    assert.equal((await writeProfileToStudentSheet({ ...input, fetchImpl: fake(body) })).status, "failed");
  }
});

test("staff retry uses current Firestore values and keeps sheet status", async () => {
  const student = {
    uid: "UID-123", contractEnd: "2027-03-15",
    studentProfileSheetSync: {
      status: "failed", fields: ["contractEnd"],
      identity: { uid: "UID-123", studentCode: "old", email: "old@example.com" },
    },
  };
  const writes = [];
  let body = null;
  const record = {
    get: async () => ({ exists: true, data: () => ({ ...student, studentProfileSheetSync: writes.at(-1)?.studentProfileSheetSync || student.studentProfileSheetSync }) }),
    update: async patch => { writes.push(patch); },
  };
  const routes = {};
  const app = {
    patch: (path, fn) => routes["PATCH " + path] = fn,
    post: (path, fn) => routes["POST " + path] = fn,
    get: () => {},
  };
  profileModule.registerStudentProfileUpdateRoute({
    app, db: { collection: () => ({ doc: () => record }), batch: () => ({}) },
    admin: { firestore: { FieldValue: { serverTimestamp: () => "TIME" } } },
    requireAuth: async () => ({ admin: true, email: "admin@example.com" }),
    runtimeConfig: { student_profile_sheet: { webhook_url: "https://example.test/exec", sync_secret: "secret" } },
  });
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async (_url, options) => {
    body = JSON.parse(options.body);
    return { ok: true, json: async () => ({ ok: true, verified: true, matchedRows: 1, verifiedFields: ["contractEnd"], row: 64 }) };
  };
  try {
    const res = { statusCode: 200, status(code) { this.statusCode = code; return this; },
      json(value) { this.body = value; return this; } };
    await routes["POST /students/:studentId/sync-sheet"]({ params: { studentId: "UID-123" } }, res);
    assert.equal(res.body.sheetSync.status, "synced");
    assert.equal(body.updates.contractEnd, "2027-03-15");
    assert.equal(writes.at(-1).studentProfileSheetSync.status, "synced");
  } finally {
    globalThis.fetch = previousFetch;
  }
});

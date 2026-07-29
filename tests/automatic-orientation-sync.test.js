import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const {
  buildOrientationTarget,
  createOrientationAutoSyncHandler,
  findMatchingClass,
  hasQualifyingPayment,
  orientationSyncKey,
  shouldAutoSyncAfterUpdate,
} = require("../functions/orientationAutoSync.js");

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

function snapshot(data, ref = null, id = "FELIX123") {
  return {
    exists: Boolean(data),
    id,
    ref,
    data: () => data,
  };
}

function classDb(classes) {
  return {
    collection(name) {
      assert.equal(name, "classes");
      return {
        async get() {
          return {
            docs: classes.map((klass, index) => ({
              id: klass.id || `class-${index + 1}`,
              data: () => klass,
            })),
          };
        },
      };
    },
  };
}

test("a first partial or full payment qualifies for automatic orientation sync", () => {
  assert.equal(hasQualifyingPayment({ paymentStatus: "pending", paid: 0 }), false);
  assert.equal(hasQualifyingPayment({ paymentStatus: "partial", paid: 2000 }), true);
  assert.equal(hasQualifyingPayment({ paymentStatus: "Paid", paid: 3000 }), true);

  assert.equal(
    shouldAutoSyncAfterUpdate(
      { paymentStatus: "pending", paid: 0, className: "A1 Accra" },
      { paymentStatus: "partial", paid: 2000, className: "A1 Accra" },
    ),
    true,
  );
});

test("orientation marker-only writes do not recursively trigger another sync", () => {
  const before = {
    paymentStatus: "partial",
    paid: 2000,
    className: "A1 Accra",
    orientationAutoSync: { status: "pending" },
  };
  const after = {
    ...before,
    orientationAutoSync: { status: "success", syncKey: "same" },
  };

  assert.equal(shouldAutoSyncAfterUpdate(before, after), false);
});

test("the selected created class supplies the canonical level and start date", () => {
  const student = {
    name: "Ama Mensah",
    email: "AMA@example.com",
    studentCode: "AMA123",
    level: "A1",
    className: "A1 Accra August",
  };
  const classes = [
    { id: "other", name: "A1 Kumasi", levelId: "A1", startDate: "2026-08-03" },
    { id: "accra-a1", title: "A1 Accra August", levelId: "A1", startDate: "2026-08-11" },
  ];

  const klass = findMatchingClass(student, classes);
  assert.equal(klass.id, "accra-a1");

  const target = buildOrientationTarget(student, klass);
  assert.deepEqual(target, {
    name: "Ama Mensah",
    email: "ama@example.com",
    studentCode: "AMA123",
    level: "A1",
    startDate: "2026-08-11",
    classId: "accra-a1",
    className: "A1 Accra August",
  });
  assert.equal(
    orientationSyncKey(target),
    "ama123__A1__accra-a1__2026-08-11",
  );
});

test("payment-triggered handler posts once and records success on the student", async () => {
  const writes = [];
  let currentStudent = {
    name: "Ama Mensah",
    email: "ama@example.com",
    studentCode: "AMA123",
    level: "A1",
    className: "A1 Accra August",
    paymentStatus: "partial",
    paid: 2000,
  };
  const studentRef = {
    async get() {
      return snapshot(currentStudent, studentRef, "AMA123");
    },
    async set(payload, options) {
      writes.push({ payload, options });
      currentStudent = { ...currentStudent, ...payload };
    },
  };
  const requests = [];
  const handler = createOrientationAutoSyncHandler({
    db: classDb([
      { id: "accra-a1", name: "A1 Accra August", levelId: "A1", startDate: "2026-08-11" },
    ]),
    appsScriptUrl: () => "https://script.google.com/macros/s/test/exec",
    syncSecret: () => "secret",
    fetchImpl: async (url, options) => {
      requests.push({ url, options, body: JSON.parse(options.body) });
      return { ok: true, status: 200, json: async () => ({ ok: true, action: "updated" }) };
    },
    logger: { log() {}, error() {} },
    now: () => new Date("2026-07-29T10:49:00.000Z"),
  });

  const result = await handler({
    id: "event-1",
    params: { studentCode: "AMA123" },
    data: {
      before: snapshot({ ...currentStudent, paymentStatus: "pending", paid: 0 }, studentRef, "AMA123"),
      after: snapshot(currentStudent, studentRef, "AMA123"),
    },
  });

  assert.equal(result.ok, true);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].body.source, "automatic_paid_student_sync");
  assert.equal(requests[0].body.studentCode, "AMA123");
  assert.equal(requests[0].body.startDate, "2026-08-11");
  assert.equal(writes.length, 2);
  assert.equal(writes[0].payload.orientationAutoSync.status, "pending");
  assert.equal(writes[1].payload.orientationAutoSync.status, "success");
});

test("a duplicate payment event skips when the current student already has the successful sync key", async () => {
  const target = {
    name: "Ama Mensah",
    email: "ama@example.com",
    studentCode: "AMA123",
    level: "A1",
    startDate: "2026-08-11",
    classId: "accra-a1",
    className: "A1 Accra August",
  };
  const currentStudent = {
    ...target,
    paymentStatus: "partial",
    paid: 2000,
    orientationAutoSync: { status: "success", syncKey: orientationSyncKey(target) },
  };
  const studentRef = {
    async get() {
      return snapshot(currentStudent, studentRef, "AMA123");
    },
    async set() {
      throw new Error("duplicate event must not write");
    },
  };
  let fetchCount = 0;
  const handler = createOrientationAutoSyncHandler({
    db: classDb([
      { id: "accra-a1", name: "A1 Accra August", levelId: "A1", startDate: "2026-08-11" },
    ]),
    appsScriptUrl: "unused",
    syncSecret: "unused",
    fetchImpl: async () => {
      fetchCount += 1;
      throw new Error("duplicate event must not call Apps Script");
    },
    logger: { log() {}, error() {} },
  });

  const result = await handler({
    id: "duplicate-event",
    data: {
      before: snapshot({ ...currentStudent, paymentStatus: "pending", paid: 0 }, studentRef, "AMA123"),
      after: snapshot(currentStudent, studentRef, "AMA123"),
    },
  });

  assert.equal(result.skipped, true);
  assert.equal(result.reason, "already_synced");
  assert.equal(fetchCount, 0);
});

test("deployment patch is wired into build, test and Firebase predeploy safeguards", () => {
  const patch = read("scripts/patchAutomaticOrientationSync.mjs");
  const packageJson = read("package.json");
  const firebaseJson = read("firebase.json");

  assert.match(patch, /exports\.autoSyncPaidStudentOrientation/);
  assert.match(patch, /onDocumentUpdated/);
  assert.match(patch, /orientationAppsScriptUrlSecret/);
  assert.match(patch, /orientationSyncSecret/);
  assert.match(packageJson, /patchAutomaticOrientationSync\.mjs/);
  assert.match(firebaseJson, /patchAutomaticOrientationSync\.mjs/);
});

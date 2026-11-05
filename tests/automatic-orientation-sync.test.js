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
  assert.equal(hasQualifyingPayment({ paymentStatus: "pending", initialPaymentAmount: 3000, paid: 0 }), false);
  assert.equal(hasQualifyingPayment({ paymentStatus: "Paid", paid: 0 }), false);
  assert.equal(hasQualifyingPayment({ paymentStatus: "Partially Paid", paid: 2000, status: "Suspended" }), false);

  assert.equal(
    shouldAutoSyncAfterUpdate(
      { paymentStatus: "pending", paid: 0, className: "A1 Accra" },
      { paymentStatus: "partial", paid: 2000, className: "A1 Accra" },
    ),
    true,
  );
});

test("organisation approval needs real tuition and confirmed class before orientation sync", () => {
  const approved = {
    billingResponsibility: "organisation", name: "Example Learner", email: "org@example.test",
    studentCode: "ExampleLearner429", level: "A1",
    requestedClassName: "A1 Stuttgart", className: "",
    paymentStatus: "pending", paid: 0, initialPaymentAmount: 3000, status: "pending",
  };
  assert.equal(shouldAutoSyncAfterUpdate({}, approved), false);
  const paid = { ...approved, paymentStatus: "Partially Paid", paid: 2000, balanceDue: 1000, status: "Active" };
  assert.equal(shouldAutoSyncAfterUpdate(approved, paid), true);
  const assigned = { ...paid, className: "A1 Stuttgart", classId: "a1-stuttgart" };
  assert.equal(shouldAutoSyncAfterUpdate(paid, assigned), true);
  assert.equal(shouldAutoSyncAfterUpdate(assigned, { ...assigned,
    orientationAutoSync: { status: "success" } }), false);
});

test("approval status updates already-paid student eligibility", () => {
  const before = { status: "pending", paymentStatus: "Paid", paid: 3000,
    className: "A2 Munich Klasse" };
  assert.equal(shouldAutoSyncAfterUpdate(before, { ...before, status: "Active" }), true);
});

test("missing approved class remains waiting, with no upstream orientation send", async () => {
  let student = { name: "Example Learner", email: "org@example.test",
    studentCode: "ExampleLearner429", level: "A1", paymentStatus: "Partially Paid",
    paid: 2000, requestedClassName: "A1 Stuttgart", className: "" };
  const writes = [];
  const ref = {
    async get() { return snapshot(student, ref, "internal-org-id"); },
    async set(value) { writes.push(value); student = { ...student, ...value }; },
  };
  const handler = createOrientationAutoSyncHandler({
    db: classDb([{ id: "a1-stuttgart", name: "A1 Stuttgart",
      startDate: "2026-11-11", levelId: "A1" }]),
    appsScriptUrl: "https://example.test", syncSecret: "secret",
    fetchImpl: async () => { throw new Error("Unapproved class must not sync"); },
    logger: { log() {}, error() {} },
  });
  const result = await handler({ data: {
    before: snapshot({ ...student, paid: 0, paymentStatus: "pending" }, ref),
    after: snapshot(student, ref),
  } });
  assert.equal(result.reason, "confirmed_class_missing");
  assert.equal(student.orientationAutoSync.status, "waiting_for_class");
  assert.equal(writes.length, 1);
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

test("operational orientation sync accepts active trials and removes them when eligibility ends", () => {
  const snippet = read("scripts/snippets/operationalSheetAutoSyncJobs.js.txt");
  const workflow = read(".github/workflows/deploy-firebase.yml");

  assert.match(snippet, /operationalHasQualifyingPayment/);
  assert.match(snippet, /operationalHasActiveTrial/);
  assert.match(snippet, /payment_or_active_trial_required/);
  assert.match(snippet, /student\.trialStartedAt/);
  assert.match(snippet, /student\.joined_at/);
  assert.match(snippet, /exports\.autoRemoveIneligibleStudentFromOrientationSheet = onDocumentUpdated/);
  assert.match(snippet, /exports\.autoRemoveDeletedStudentFromOrientationSheet = onDocumentDeleted/);
  assert.match(snippet, /action: "removeOrientationRow"/);
  assert.match(workflow, /functions:falowenadmin:autoRemoveIneligibleStudentFromOrientationSheet/);
  assert.match(workflow, /functions:falowenadmin:autoRemoveDeletedStudentFromOrientationSheet/);
  assert.match(workflow, /functions:falowenadmin:autoSyncNewStudentToOrientationSheet/);
  assert.match(workflow, /functions:falowenadmin:syncPendingOperationalSheets/);
});

test("deployment patch listens for student payment and confirmed class updates", () => {
  const patch = read("scripts/patchAutomaticOrientationSync.mjs");
  const packageJson = read("package.json");
  const firebaseJson = read("firebase.json");
  const workflow = read(".github/workflows/deploy-firebase.yml");

  assert.match(patch, /exports\.autoSyncPaidStudentOrientation/);
  assert.match(patch, /onDocumentUpdated/);
  assert.match(patch, /document: "students\/\{studentId\}"/);
  assert.match(patch, /document: "payments\/\{reference\}"/);
  assert.match(patch, /payment_not_newly_paid/);
  assert.match(patch, /group_payment_synced_from_student_records/);
  assert.match(patch, /exports\.autoSyncApprovedStudentOrientation/);
  assert.match(patch, /studentIdentityFingerprint/);
  assert.match(patch, /orientationAppsScriptUrlSecret/);
  assert.match(patch, /orientationSyncSecret/);
  assert.match(packageJson, /patchAutomaticOrientationSync\.mjs/);
  assert.match(firebaseJson, /patchAutomaticOrientationSync\.mjs/);
  assert.match(workflow, /patchAutomaticOrientationSync\.mjs/);
  assert.match(workflow, /functions:falowenadmin:autoSyncPaidStudentOrientation/);
  assert.match(workflow, /functions:falowenadmin:autoSyncApprovedStudentOrientation/);
});

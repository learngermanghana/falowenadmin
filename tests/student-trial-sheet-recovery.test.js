import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import {
  mapRetainedSheetTrial,
  missingRetainedSheetTrials,
} from "../src/utils/studentTrialSheetRecovery.js";

const require = createRequire(import.meta.url);
const { validateTrialRecovery, registerStudentTrialRecoveryRoute } = require("../functions/studentTrialRecovery.js");

const NOW = Date.parse("2026-10-17T12:00:00Z");
const example = {
  Name: "Example Student",
  StudentCode: "ExampleStudent123",
  email: "example@example.com",
  UID: "firebase-uid-example",
  Status: "pending",
  TrialStatus: "expired",
  trialExpiredAt: "2026-10-09T16:55:17.636Z",
  registrationDate: "2026-10-02T16:51:29.719Z",
  className: "A1 Leipzig Klasse",
  level: "A1",
  paid: "0",
};
test("published sheet-only trial still appears after expiry and before recovery deadline", () => {
  const row = mapRetainedSheetTrial(example, NOW);
  assert.equal(row?.name, "Example Student");
  assert.equal(row?.uid, example.UID);
  assert.equal(row?.status, "trial_expired");
  assert.equal(row?.trialPurgeAt, "2026-11-08T16:55:17.636Z");
  assert.equal(missingRetainedSheetTrials([example], [], NOW).length, 1);
  assert.equal(missingRetainedSheetTrials([example], [{ uid: example.UID }], NOW).length, 0);
  assert.equal(missingRetainedSheetTrials([example], [{ studentCode: example.StudentCode }], NOW).length, 0);
  assert.equal(missingRetainedSheetTrials([example], [{ email: example.email }], NOW).length, 0);
  assert.equal(missingRetainedSheetTrials([example], [], Date.parse("2026-11-09T00:00:00Z")).length, 0);
});

test("do not treat paid/converted sheet rows as unpaid expired trials", () => {
  assert.equal(mapRetainedSheetTrial({ ...example, paid: "800" }, NOW), null);
  assert.equal(mapRetainedSheetTrial({ ...example, paymentStatus: "Paid" }, NOW), null);
  assert.equal(mapRetainedSheetTrial({ ...example, trialStatus: "converted" }, NOW), null);
});

test("API validates retention dates and explicit confirmation", () => {
  const row = { ...mapRetainedSheetTrial(example, NOW), confirm: true };
  assert.equal(validateTrialRecovery(row, NOW).purgeAt, Date.parse("2026-11-08T16:55:17.636Z"));
  assert.throws(() => validateTrialRecovery({ ...row, confirm: false }, NOW), /confirmation/);
  assert.throws(() => validateTrialRecovery(row, Date.parse("2026-11-09T00:00:00Z")), /recovery window/);
});

function makeResponse() {
  return {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}
function mockRecoveryApi({ email = "example@example.com", existing = false } = {}) {
  let route;
  const creates = [];
  const students = {
    doc(id) {
      return { id, async get() { return { exists: existing, id }; }, async create(payload) { creates.push(payload); } };
    },
    where() { return { limit() { return { async get() { return { docs: [] }; } }; } }; },
  };
  const db = { collection(name) {
    if (name === "students") return students;
    return { async add() {} };
  } };
  const admin = {
    auth: () => ({ getUser: async (uid) => ({ uid, email }) }),
    firestore: {
      Timestamp: { fromMillis: (ms) => ms },
      FieldValue: { serverTimestamp: () => "SERVER_TIME" },
    },
  };
  registerStudentTrialRecoveryRoute({
    app: { post(path, fn) { if (path === "/students/recover-trial") route = fn; } },
    db, admin,
    requireAuth: async () => ({ email: "admin@example.com" }),
    assertStaff: () => {},
  });
  return { route, creates };
}

test("staff may safely restore same Firebase identity but cannot activate trial", async () => {
  const { route, creates } = mockRecoveryApi();
  const res = makeResponse();
  const payload = { ...mapRetainedSheetTrial(example, NOW), confirm: true };
  // validateTrialRecovery checks system clock; dates in this fixture are now historic.
  // Use a live-relative fixture for route testing.
  const expired = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const start = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
  await route({ body: { ...payload, trialExpiredAt: expired, trialPurgeAt: "", registrationDate: start } }, res);
  assert.equal(res.body?.recovered, true);
  assert.equal(creates.length, 1);
  assert.equal(creates[0].status, "trial_expired");
  assert.equal(creates[0].trialStatus, "expired");
  assert.equal(creates[0].paid, 0);
  assert.equal(creates[0].uid, example.UID);
});

test("mismatched Firebase Auth identity cannot be restored", async () => {
  const { route, creates } = mockRecoveryApi({ email: "another@example.com" });
  const expired = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const res = makeResponse();
  await route({ body: { ...mapRetainedSheetTrial(example, NOW), confirm: true, trialExpiredAt: expired, trialPurgeAt: "" } }, res);
  assert.equal(res.statusCode, 409);
  assert.equal(creates.length, 0);
});

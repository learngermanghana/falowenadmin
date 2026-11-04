"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  accountStatus, prepareAccount, recordInvitation, registerStudentAccountActivationRoutes,
} = require("./studentAccountActivation.js");

function fixture(initial = { name: "Test Learner", email: "student@example.org" }, existingUsers = []) {
  let data = { ...initial };
  let createCalls = 0;
  const byEmail = new Map(existingUsers.map((row) => [row.email, row]));
  const byUid = new Map(existingUsers.map((row) => [row.uid, row]));
  const timestamp = () => "2026-11-04T15:00:00.000Z";
  const ref = {
    get: async () => ({ exists: true, data: () => ({ ...data }) }),
    update: async (patch) => { data = { ...data, ...patch }; },
  };
  const auth = {
    async verifyIdToken() { return { email: "moxflex@gmail.com", email_verified: true, uid: "owner-1" }; },
    async getUserByEmail(email) {
      if (!byEmail.has(email)) throw Object.assign(new Error("Not found"), { code: "auth/user-not-found" });
      return byEmail.get(email);
    },
    async getUser(uid) {
      if (!byUid.has(uid)) throw Object.assign(new Error("Not found"), { code: "auth/user-not-found" });
      return byUid.get(uid);
    },
    async createUser(options) {
      createCalls += 1;
      assert.ok(options.password.length >= 40, "long random bootstrap password");
      assert.equal(options.emailVerified, false);
      const user = { uid: `new-uid-${createCalls}`, email: options.email, disabled: false, metadata: {} };
      byEmail.set(options.email, user);
      byUid.set(user.uid, user);
      return user;
    },
  };
  return {
    db: { collection: () => ({ doc: () => ref }) },
    admin: { auth: () => auth, firestore: { FieldValue: { serverTimestamp: timestamp } } },
    actor: { email: "moxflex@gmail.com", uid: "owner-1" },
    getStudent: () => data,
    getCreatedCount: () => createCalls,
    getUser: (email) => byEmail.get(email),
  };
}

test("only prepares a saved student identity; no email is sent automatically", async () => {
  const f = fixture();
  const result = await prepareAccount({ ...f, studentId: "test-123" });
  assert.equal(result.created, true);
  assert.equal(result.state, "ready_to_invite");
  assert.equal(f.getStudent().uid, result.uid);
  assert.equal(f.getStudent().authEmail, "student@example.org");
  assert.equal(f.getStudent().activationEmailSentAt, undefined);
  assert.equal(f.getCreatedCount(), 1);
});

test("preparing the same student twice is idempotent", async () => {
  const f = fixture();
  await prepareAccount({ ...f, studentId: "test-123" });
  const second = await prepareAccount({ ...f, studentId: "test-123" });
  assert.equal(second.created, false);
  assert.equal(f.getCreatedCount(), 1);
});

test("an existing unlinked Firebase login cannot be silently claimed", async () => {
  const other = { uid: "other-user", email: "student@example.org", metadata: {} };
  const f = fixture(undefined, [other]);
  await assert.rejects(prepareAccount({ ...f, studentId: "test-123" }), (err) => err.status === 409);
  assert.equal(f.getCreatedCount(), 0);
  assert.equal(f.getStudent().uid, undefined);
});

test("invalid contact details cannot produce an account", async () => {
  const f = fixture({ name: "Learner", email: "invalid" });
  await assert.rejects(prepareAccount({ ...f, studentId: "test-123" }), (err) => err.status === 400);
  assert.equal(f.getCreatedCount(), 0);
});

test("invitation is tracked separately from first sign-in", async () => {
  const f = fixture();
  await prepareAccount({ ...f, studentId: "test-123" });
  await recordInvitation({ ...f, studentId: "test-123" });
  assert.equal((await accountStatus({ ...f, studentId: "test-123" })).state, "invited");
  f.getUser("student@example.org").metadata.lastSignInTime = "Wed, 04 Nov 2026 17:00:00 GMT";
  assert.equal((await accountStatus({ ...f, studentId: "test-123" })).state, "active");
});

test("owner auth is checked before exposing details or provisioning accounts", async () => {
  const f = fixture();
  const handlers = {};
  const app = {
    get(path, handler) { handlers[`GET ${path}`] = handler; },
    post(path, handler) { handlers[`POST ${path}`] = handler; },
  };
  registerStudentAccountActivationRoutes(app, f);
  let status = 200; let body = {};
  const res = {
    set() { return this; },
    status(code) { status = code; return this; },
    json(value) { body = value; return this; },
  };
  await handlers["POST /admin/student-accounts/:studentId/prepare"]({
    headers: {}, params: { studentId: "test-123" },
  }, res);
  assert.equal(status, 401);
  assert.equal(body.ok, false);
  assert.equal(f.getCreatedCount(), 0);
});

"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  accountStatus, prepareAccount, recordInvitation, registerStudentAccountActivationRoutes,
  findExistingLogin, linkExistingLogin, changeLoginEmail,
} = require("./studentAccountActivation.js");

function fixture(initial = { name: "Test Learner", email: "student@example.org" }, existingUsers = []) {
  let data = { ...initial };
  let createCalls = 0;
  const byEmail = new Map(existingUsers.map((row) => [row.email, row]));
  const byUid = new Map(existingUsers.map((row) => [row.uid, row]));
  const timestamp = () => "2026-11-04T15:00:00.000Z";
  const locks = new Map();
  const studentId = "test-123";
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
    async updateUser(uid, updates) {
      const user = byUid.get(uid);
      byEmail.delete(user.email);
      Object.assign(user, updates);
      byEmail.set(user.email, user);
      return user;
    },
    async revokeRefreshTokens() {},
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
    db: {
      collection: (name) => name === "students"
        ? {
            doc: () => ref,
            where: (field, op, uid) => ({
              limit: () => ({ get: async () => ({
                docs: [ "uid", "authUid", "firebaseUid" ].includes(field) && data[field] === uid
                  ? [{ id: studentId }] : [],
              }) }),
            }),
          }
        : { doc: (uid = "audit") => ({
            uid,
            get: async () => ({ exists: locks.has(uid), data: () => locks.get(uid) }),
          }) },
      runTransaction: async fn => fn({
        get: async target => target.get(),
        set: (target, value) => { locks.set(target.uid, value); },
        update: (target, patch) => { data = { ...data, ...patch }; },
      }),
    },
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

test("existing signed-in Firebase account can be explicitly linked without a second login", async () => {
  const existing = { uid: "auth-existing", email: "student@example.org",
    metadata: { lastSignInTime: "Wed, 04 Nov 2026 17:00:00 GMT" } };
  const f = fixture(undefined, [existing]);
  const candidate = await findExistingLogin({ ...f, studentId: "test-123" });
  assert.equal(candidate.linkAvailable, true);
  assert.equal(f.getStudent().uid, undefined, "lookup must not mutate student");
  const result = await linkExistingLogin({ ...f, studentId: "test-123" });
  assert.equal(result.linked, true);
  assert.equal(result.state, "active");
  assert.equal(f.getStudent().uid, "auth-existing");
  assert.equal(f.getCreatedCount(), 0);
  assert.equal(f.getStudent().paymentStatus, undefined);
});

test("existing UID is never overwritten during explicit link", async () => {
  const f = fixture({ name: "Test Learner", email: "student@example.org", uid: "another-uid" },
    [{ uid: "auth-existing", email: "student@example.org", metadata: {} }]);
  await assert.rejects(findExistingLogin({ ...f, studentId: "test-123" }), err => err.status === 409);
  await assert.rejects(linkExistingLogin({ ...f, studentId: "test-123" }), err => err.status === 409);
  assert.equal(f.getStudent().uid, "another-uid");
});

test("owner changes login and contact email without replacing UID or billing", async () => {
  const f = fixture({ name: "Learner", email: "student@example.org", uid: "existing", paid: 100, trialEndsAt: "original" }, [
    { uid: "existing", email: "student@example.org", providerData: [{ providerId: "password" }], metadata: {} },
  ]);
  const result = await changeLoginEmail({ ...f, studentId: "test-123", expectedEmail: "student@example.org", newEmail: "correct@example.org", reason: "Typo" });
  assert.equal(result.uid, "existing");
  assert.equal(f.getStudent().email, "correct@example.org");
  assert.equal(f.getStudent().uid, "existing");
  assert.equal(f.getStudent().paid, 100);
  assert.equal(f.getStudent().trialEndsAt, "original");
  assert.equal(f.getUser("correct@example.org").emailVerified, false);
  assert.equal(f.getCreatedCount(), 0);
});

test("duplicate destination Firebase email is rejected", async () => {
  const f = fixture({ email: "student@example.org", uid: "existing" }, [
    { uid: "existing", email: "student@example.org", providerData: [{ providerId: "password" }] },
    { uid: "other", email: "taken@example.org" },
  ]);
  await assert.rejects(changeLoginEmail({ ...f, studentId: "test-123", expectedEmail: "student@example.org", newEmail: "taken@example.org", reason: "Typo" }), err => err.status === 409);
  assert.equal(f.getStudent().email, "student@example.org");
});

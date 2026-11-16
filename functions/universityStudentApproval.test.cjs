"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { registerStudentProfileUpdateRoute } = require("./studentProfileUpdate");

function setup(student, actor = { admin: true, email: "owner@example.org" }) {
  const routes = {};
  let current = { ...student };
  const studentRef = { id: "SW-A1-1" };
  const fieldValue = { serverTimestamp: () => "2026-11-16T12:00:00Z", delete: () => "__DELETE__" };
  const app = {
    patch(path, handler) { routes[`PATCH ${path}`] = handler; },
    post(path, handler) { routes[`POST ${path}`] = handler; },
    get(path, handler) { routes[`GET ${path}`] = handler; },
  };
  const db = {
    collection() { return { doc() { return studentRef; } }; },
    batch() { return {}; },
    async runTransaction(callback) {
      return callback({
        async get() { return { exists: true, data: () => ({ ...current }) }; },
        update(ref, patch) {
          assert.equal(ref, studentRef);
          current = { ...current, ...patch };
        },
      });
    },
  };
  registerStudentProfileUpdateRoute({
    app, db, admin: { firestore: { FieldValue: fieldValue } },
    requireAuth: async () => actor,
  });
  return {
    getRecord: () => current,
    async review(decision) {
      const response = {
        code: 200, body: null,
        status(value) { this.code = value; return this; },
        json(value) { this.body = value; return this; },
      };
      await routes["POST /students/:studentId/university-approval"](
        { params: { studentId: "SW-A1-1" }, body: { decision } }, response,
      );
      return response;
    },
  };
}

const invited = {
  uid: "firebase-user-1", program: "swahili", registrationSource: "university-invite",
  institutionId: "university-hamburg", cohortId: "university-hamburg-kiswahili-a1",
  institutionVerification: "pending", accessType: "invitation_pending",
  status: "registered", paymentStatus: "exempt_pending", trialStatus: "not_applicable",
};

test("staff approval grants complimentary access with no expiry and no tuition", async () => {
  const instance = setup(invited);
  const result = await instance.review("approve");
  assert.equal(result.code, 200);
  assert.equal(result.body.updates.accessType, "complimentary");
  assert.equal(result.body.updates.institutionVerification, "approved");
  assert.equal(instance.getRecord().paymentStatus, "exempt");
  assert.equal(instance.getRecord().tuitionFee, null);
  assert.equal(instance.getRecord().trialEndsAt, "__DELETE__");
  const revoked = await instance.review("revoke");
  assert.equal(revoked.code, 200);
  assert.equal(instance.getRecord().accessType, "invitation_pending");
});

test("invitation attribution alone does not approve an outsider", async () => {
  const instance = setup({ ...invited, cohortId: "other-group" });
  const result = await instance.review("approve");
  assert.equal(result.code, 409);
  assert.equal(instance.getRecord().institutionVerification, "pending");
});

test("student accounts cannot approve complimentary access", async () => {
  const instance = setup(invited, { role: "student", email: "student@example.org" });
  const result = await instance.review("approve");
  assert.equal(result.code, 403);
  assert.equal(instance.getRecord().accessType, "invitation_pending");
});

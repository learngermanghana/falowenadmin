"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { registerStudentProfileUpdateRoute } = require("./studentProfileUpdate");

const swahiliClass = (id, startDate, details = {}) => ({
  id,
  data: () => ({ name: id, language: "Swahili", levelId: "A1", startDate, status: "upcoming", registrationOpen: true, ...details }),
});

function setup(student, actor = { admin: true, email: "owner@example.org" }, classes = [
  swahiliClass("later", "2027-01-10"),
  swahiliClass("next", "2026-12-03"),
  swahiliClass("different-level", "2026-09-03", { levelId: "A2" }),
  swahiliClass("closed", "2026-09-01", { registrationOpen: false }),
  swahiliClass("cancelled", "2026-09-01", { status: "cancelled" }),
  swahiliClass("past", "2026-08-30"),
  swahiliClass("german", "2026-09-01", { language: "German" }),
]) {
  const routes = {};
  let current = { ...student };
  const studentRef = { id: "SW-A1-1" };
  const classQuery = {};
  const fieldValue = { serverTimestamp: () => "2026-11-16T12:00:00Z", delete: () => "__DELETE__" };
  const app = {
    patch(path, handler) { routes[`PATCH ${path}`] = handler; },
    post(path, handler) { routes[`POST ${path}`] = handler; },
    get(path, handler) { routes[`GET ${path}`] = handler; },
  };
  const db = {
    collection(name) {
      if (name !== "classes") return { doc() { return studentRef; } };
      return {
        where(field, operator, values) {
          assert.equal(field, "language");
          assert.equal(operator, "in");
          classQuery.docs = classes.filter(doc => values.includes(doc.data().language));
          return classQuery;
        },
      };
    },
    batch() { return {}; },
    async runTransaction(callback) {
      return callback({
        async get(ref) { return ref === classQuery ? classQuery : { exists: true, data: () => ({ ...current }) }; },
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
    now: () => new Date("2026-08-31T12:00:00Z"),
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

test("staff approval assigns the next open same-level Swahili class and grants six calendar months", async () => {
  const instance = setup(invited);
  const result = await instance.review("approve");
  assert.equal(result.code, 200);
  assert.equal(result.body.updates.accessType, "complimentary");
  assert.equal(result.body.updates.institutionVerification, "approved");
  assert.equal(instance.getRecord().paymentStatus, "exempt");
  assert.equal(instance.getRecord().tuitionFee, null);
  assert.equal(instance.getRecord().trialEndsAt, "__DELETE__");
  assert.equal(result.body.updates.classRecordId, "next");
  assert.equal(result.body.updates.className, "next");
  assert.equal(result.body.updates.contractStart, "2026-08-31");
  assert.equal(result.body.updates.contractEnd, "2027-02-28");
  assert.equal(result.body.updates.contractTermMonths, 6);
  assert.equal((await instance.review("approve")).code, 200);
  assert.equal(instance.getRecord().contractEnd, "2027-02-28");
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

test("approval leaves the application pending when no matching class is open", async () => {
  const instance = setup(invited, { role: "admin" }, []);
  const result = await instance.review("approve");
  assert.equal(result.code, 409);
  assert.match(result.body.error, /No upcoming Swahili A1 class/);
  assert.equal(instance.getRecord().institutionVerification, "pending");
  assert.equal(instance.getRecord().contractEnd, undefined);
});

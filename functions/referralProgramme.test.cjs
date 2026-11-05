const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const { firstPayment, registerReferralRoutes, verifyReceipt } = require("./referralProgramme");
const id = email => createHash("sha256").update(email).digest("hex");
const claimed = "2026-01-01T00:00:00Z";
const paid = "2026-01-02T00:00:00Z";
const doc = (id, data) => ({ id, data: () => data, exists: Boolean(data) });
const payment = { studentId: "student", status: "paid", currency: "GHS", tuitionCredit: 100.55, paidAt: paid };

test("the first course payment controls eligibility across both tuition ledgers", () => {
  const admin = doc("admin", payment);
  const campus = doc("campus", { status: "handled", tuitionAmount: 200, createdAt: "2025-12-01" });
  assert.equal(firstPayment([admin], [campus], claimed), null);
  assert.equal(firstPayment([admin], [], claimed).commissionMinor, 1006);
  for (const patch of [{ refunded: true }, { refundStatus: "processing" }, { status: "refunded" }, { purpose: "renewal" }, { currency: "USD" }, { paidAt: null }]) {
    const first = doc("first", { ...payment, ...patch });
    assert.equal(firstPayment([first, doc("later", { ...payment, paidAt: "2026-03-01" })], [], claimed), null);
  }
  assert.equal(firstPayment([], [doc("c", { status: "handled", tuitionAmount: 500, createdAt: paid })], claimed).commissionMinor, 5000);
});
test("provider verification checks refund records and fails closed on unavailable data", async () => {
  const calls = [];
  const fetch = async (url, init) => {
    assert.equal(init.headers.Authorization, "Bearer test");
    calls.push(url);
    return { ok: true, json: async () => ({ status: true, data: calls.length === 1 ? { id: 123, reference: "ABC" } : [{ status: "pending" }] }) };
  };
  assert.equal((await verifyReceipt("ABC", () => "test", fetch)).refund, true);
  assert.match(calls[1], /refund\?transaction=123&perPage=1$/);
  await assert.rejects(verifyReceipt("ABC", () => "", fetch), { status: 503 });
  await assert.rejects(verifyReceipt("../transaction", () => "test", fetch), { status: 400 });
});
// Exercise the registered HTTP handlers with a small transactional Firestore double.
function fixture() {
  const records = new Map();
  const routes = new Map();
  const collection = name => ({
    doc: id => ({ name, id, key: name + "/" + id }),
    where: (field, op, value) => ({ name, field, value, limit(n) { return { ...this, n }; } }),
  });
  const tx = {
    async get(ref) {
      if (ref.key) return doc(ref.id, records.get(ref.key));
      const docs = [...records].filter(([key, value]) => key.startsWith(ref.name + "/") && value[ref.field] === ref.value)
        .map(([key, value]) => doc(key.split("/")[1], value)).slice(0, ref.n ?? Infinity);
      return { docs, size: docs.length };
    },
    create(ref, data) { assert.ok(!records.has(ref.key)); records.set(ref.key, data); },
    update(ref, data) { assert.ok(records.has(ref.key)); records.set(ref.key, { ...records.get(ref.key), ...data }); },
    set(ref, data) { records.set(ref.key, data); },
  };
  const proof = { receipt: { reference: "pay", status: "success", currency: "GHS", amount: 10155, paid_at: paid, metadata: { studentId: "student", tuitionCredit: 100.55 } }, refund: false };
  const app = { post: (p, fn) => routes.set(p, fn), get: (p, fn) => routes.set(p, fn) };
  registerReferralRoutes(app, {
    db: { collection, runTransaction: fn => fn(tx) },
    admin: { firestore: { FieldValue: { serverTimestamp: () => claimed } }, auth: () => ({ verifyIdToken: async () => ({ email_verified: true, email: "moxflex@gmail.com", uid: "owner" }) }) },
    verify: async () => proof,
  });
  async function call(path, body, key, signed = false) {
    let status = 200;
    let result;
    await routes.get(path)({ body, params: { id: key }, headers: signed ? { authorization: "Bearer owner" } : {} }, {
      set() {}, status(code) { status = code; return this; }, json(data) { result = data; },
    });
    return { status, ...result };
  }
  return { records, routes, call, proof };
}
test("new referrals are closed, organisation approval creates no code, and historical commissions remain auditable", async () => {
  const { records, call, routes, proof } = fixture();
  for (const path of routes.keys()) {
    if (path.startsWith("/admin/")) assert.equal((await call(path, {})).status, 401);
  }
  const partner = { email: "partner@example.org", name: "Partner", consent: true };
  assert.equal((await call("/referrals/apply", partner)).status, 410);
  assert.equal((await call("/referrals/claim", { email: "new@example.org", code: "a".repeat(32), consent: true })).status, 410);
  const institution = id("institution");
  records.set("referralApplications/" + institution, { kind: "institutional", status: "pending", name: "Agency", email: "agency@example.org" });
  await call("/admin/referrals/applications/:id", { status: "approved" }, institution, true);
  assert.equal(records.get("referralApplications/" + institution).status, "approved");
  assert.equal(records.get("referralApplications/" + institution).code, null);
  const application = id(partner.email);
  records.set("referralApplications/" + application, { ...partner, status: "pending" });
  assert.equal((await call("/admin/referrals/applications/:id", { status: "approved" }, application, true)).status, 409);
  // Previously earned/claimed records remain available for audit and refund handling.
  const email = "learner@example.org", claim = id(email);
  records.set("referralClaims/" + claim, { email, partnerId: application, status: "pending", createdAt: claimed });
  records.set("students/student", { email });
  const decide = (action, extra) => call("/admin/referrals/claims/:id", { action, confirmed: true, ...extra }, claim, true);
  assert.equal((await decide("inspect")).status, 409);
  records.set("payments/pay", payment);
  records.set("students/student", { email, billingResponsibility: "organisation" });
  assert.equal((await decide("inspect")).status, 409);
  records.set("students/student", { email });
  const preview = (await decide("inspect")).payment;
  assert.equal(preview.commissionMinor, 1006);
  proof.refund = true;
  assert.equal((await decide("approve", preview)).status, 409);
  proof.refund = false;
  proof.receipt.metadata.studentId = "other";
  assert.equal((await decide("approve", preview)).status, 409);
  proof.receipt.metadata.studentId = "student";
  assert.equal((await decide("approve", preview)).status, 200);
  assert.equal((await decide("approve", preview)).status, 200);
  const key = "referralClaims/" + claim;
  assert.equal(records.get(key).commissionMinor, 1006);
  assert.equal(records.get(key).status, "approved");
  assert.equal((await decide("record-payout", { ...preview, payoutReference: "paid-1" })).status, 200);
  assert.equal((await decide("record-payout", { ...preview, payoutReference: "paid-2" })).status, 409);
  proof.refund = true;
  assert.equal((await decide("check-refund", preview)).refunded, true);
  assert.equal(records.get(key).status, "reversed");
  assert.equal(records.get(key).payoutReference, "paid-1");
  assert.equal((await decide("approve", preview)).status, 409);
  assert.equal(records.get("referralCommissionStudents/student").claimId, claim);
});

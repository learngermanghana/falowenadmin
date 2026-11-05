const test = require("node:test");
const assert = require("node:assert/strict");
const { validateLines, balanceOf, applyGroupPayment, sendGroupReceipt, registerOrganisationPaymentRoutes } = require("./organisationPayments");
const admin = { firestore: { FieldValue: { serverTimestamp: () => "NOW" }, Timestamp: { fromDate: d => d.toISOString() } } };
function fixture() {
  const data = new Map([
    ["students/A", { name: "A", email: "a@example.test", organisationSubmissionId: "batch", paid: 100, balanceDue: 1000 }],
    ["students/B", { name: "B", email: "b@example.test", organisationSubmissionId: "batch", paid: 0, balanceDue: 500 }],
  ]);
  const doc = path => ({ path, get: async () => snap(path), update: async value => data.set(path, { ...data.get(path), ...value }) });
  const snap = path => ({ exists: data.has(path), data: () => data.get(path), ref: doc(path) });
  const writes = [];
  const tx = { get: async ref => snap(ref.path), set: (ref, value) => writes.push([ref.path, value]), update: (ref, value) => writes.push([ref.path, value]), create: (ref, value) => { assert.ok(!data.has(ref.path)); writes.push([ref.path, value]); } };
  const db = { collection: name => ({ doc: id => doc(`${name}/${id}`) }), runTransaction: async fn => {
    writes.length = 0; const result = await fn(tx);
    for (const [path, value] of writes) data.set(path, { ...data.get(path), ...value }); return result;
  } };
  const payment = { reference: "FAL-ORG-test", organisationSubmissionId: "batch", purpose: "organisation_group", status: "pending", checkoutAmount: 710, tuitionCredit: 700, discount: 100,
    email: "company@example.test", organisationName: "Company", lines: [
      { studentId: "A", studentName: "A", grossAmount: 600, discount: 100, tuitionCredit: 500 },
      { studentId: "B", studentName: "B", grossAmount: 200, discount: 0, tuitionCredit: 200 },
    ] };
  const paymentRef = doc("payments/FAL-ORG-test"); data.set(paymentRef.path, payment);
  const eventData = { reference: payment.reference, amount: 71000, currency: "GHS" };
  const apply = () => db.runTransaction(transaction => applyGroupPayment({ transaction, paymentRef, payment: data.get(paymentRef.path), eventData, db, admin }));
  return { db, data, payment, eventData, apply };
}
test("validates amounts, discounts, duplicates and unconfigured balances", () => {
  assert.equal(validateLines([{ studentId: "A", amount: 1000, discount: 100 }])[0].tuitionCredit, 900);
  for (const amount of [-1, Infinity, "", true, "1.001"]) assert.throws(() => validateLines([{ studentId: "A", amount }]));
  assert.throws(() => validateLines([{ studentId: "A", amount: 1, discount: 1 }]));
  assert.throws(() => validateLines([{ studentId: "A", amount: 1 }, { studentId: "A", amount: 1 }]));
  assert.throws(() => balanceOf({})); assert.equal(balanceOf({ balanceDue: 0, tuitionFee: 10 }), 0);
});
test("allocates cash and discounts separately to all students, and duplicate confirmation is inert", async () => {
  const f = fixture(); await f.apply();
  assert.equal(f.data.get("students/A").paid, 600);
  assert.equal(f.data.get("students/A").tuitionDiscount, 100);
  assert.equal(f.data.get("students/A").balanceDue, 400);
  assert.equal(f.data.get("students/B").paid, 200);
  assert.equal(f.data.get("students/B").balanceDue, 300);
  assert.equal(f.data.get("students/A").syncedToSheets, false);
  assert.equal(f.data.get("payments/FAL-ORG-test-0").referralEligible, false);
  assert.equal(f.data.get("payments/FAL-ORG-test").status, "paid");
  assert.equal((await f.apply()).duplicate, true);
  assert.equal(f.data.get("students/A").paid, 600);
});
test("rejects incorrect amount, currency and missing students without partial credits", async () => {
  for (const mutate of [f => f.eventData.amount++, f => f.eventData.currency = "USD", f => f.data.delete("students/B")]) {
    const f = fixture(); mutate(f); await assert.rejects(f.apply());
    assert.equal(f.data.get("students/A").paid, 100);
    assert.equal(f.data.get("payments/FAL-ORG-test").status, "pending");
  }
});
test("company receipt retries do not allocate payment again and sent receipts are skipped", async () => {
  const f = fixture(); await f.apply(); let sends = 0;
  const args = { ...f, admin, reference: f.payment.reference, runtimeConfig: {}, send: async () => { throw new Error("offline"); } };
  await assert.rejects(sendGroupReceipt(args)); assert.equal(f.data.get("payments/FAL-ORG-test").receiptStatus, "failed");
  args.send = async (config, row) => { sends++; assert.equal(row.email, "company@example.test"); assert.equal(row.email_type, "organisation_payment_receipt"); assert.match(row.announcement, /A \\| Gross GHS 600\\.00/); assert.match(row.announcement, /net tuition allocated GHS 500\\.00/); assert.match(row.announcement, /Retained 10% organisation share: GHS 100\\.00/); assert.match(row.announcement, /Checkout processing charges: GHS 10\\.00/); };
  await sendGroupReceipt(args); await sendGroupReceipt(args);
  assert.equal(sends, 1); assert.equal(f.data.get("students/A").paid, 600);
});
test("all group endpoints enforce verified owner auth before database access", async () => {
  const routes = [];
  registerOrganisationPaymentRoutes({ get: (p, h) => routes.push(h), post: (p, h) => routes.push(h) }, { db: { collection() { throw new Error("unexpected database read"); } }, admin });
  for (const handler of routes) {
    let code, body;
    const res = { set() {}, status(n) { code = n; return this; }, json(value) { body = value; } };
    await handler({ headers: {} }, res); assert.equal(code, 401); assert.equal(body.ok, false);
  }
});
test("group link uses approved student records, company email and one reference across retries", async () => {
  const f = fixture();
  f.data.set("organisationEnrolments/batch", { organisation: { name: "Company" }, students: [{ studentId: "A", status: "approved" }] });
  const routes = new Map(); let initializations = 0;
  const ownerAdmin = { ...admin, auth: () => ({ verifyIdToken: async () => ({ email: "moxflex@gmail.com", email_verified: true, uid: "owner" }) }) };
  registerOrganisationPaymentRoutes({ get: (path, handler) => routes.set(path, handler), post: (path, handler) => routes.set(path, handler) }, {
    ...f, admin: ownerAdmin, calculateStudentCheckoutAmount: amount => amount + 10,
    initializePaystackPayment: async args => { initializations++; assert.equal(args.email, "billing@example.test"); return { authorization_url: "https://checkout.example.test/group" }; },
  });
  const body = { batchId: "batch", requestId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", email: "billing@example.test", agreement: "Institutional agreement 1", discountReason: "Agreed reduction", lines: [{ studentId: "A", amount: 500, discount: 100 }] };
  const call = async payload => {
    let status = 200, value;
    const res = { set() {}, status(n) { status = n; return this; }, json(data) { value = data; } };
    await routes.get("/payments/organisation-link")({ headers: { authorization: "Bearer test" }, body: payload }, res);
    return { status, value };
  };
  const first = await call(body), retry = await call(body);
  assert.equal(first.status, 200); assert.equal(retry.status, 200); assert.equal(initializations, 1);
  assert.equal(first.value.payment.tuitionCredit, 400); assert.equal(first.value.payment.discount, 100);
  assert.equal(first.value.payment.lines[0].studentName, "A"); assert.equal(first.value.payment.referralEligible, false);
  assert.equal(f.data.get("students/A").paid, 100);
  assert.equal((await call({ ...body, email: "changed@example.test" })).status, 409);
  assert.equal((await call({ ...body, requestId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", lines: [{ studentId: "B", amount: 100 }] })).status, 409);
  assert.equal((await call({ ...body, requestId: "cccccccc-cccc-cccc-cccc-cccccccccccc", lines: [{ studentId: "A", amount: 1500 }] })).status, 409);
});

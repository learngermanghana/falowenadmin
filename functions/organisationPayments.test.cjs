const test = require("node:test");
const assert = require("node:assert/strict");
const { validateLines, balanceOf, applyGroupPayment, sendGroupReceipt, receiptFailure, recordManualOrganisationPayment, registerOrganisationPaymentRoutes } = require("./organisationPayments");
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
  args.send = async (config, row) => { sends++; assert.equal(row.email, "company@example.test"); assert.equal(row.email_type, "organisation_payment_receipt"); assert.match(row.announcement, /A \| Gross GHS 600\.00/); assert.match(row.announcement, /net tuition allocated GHS 500\.00/); assert.match(row.announcement, /Retained 10% organisation share: GHS 100\.00/); assert.match(row.announcement, /Checkout processing charges: GHS 10\.00/); };
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
  f.data.get("students/A").paid = 0; // First tuition payment is eligible for the agreed 10% share.
  f.data.set("organisationEnrolments/batch", { organisation: { name: "Company" }, students: [{ studentId: "A", status: "approved" }] });
  const routes = new Map(); let initializations = 0;
  const ownerAdmin = { ...admin, auth: () => ({ verifyIdToken: async () => ({ email: "moxflex@gmail.com", email_verified: true, uid: "owner" }) }) };
  registerOrganisationPaymentRoutes({ get: (path, handler) => routes.set(path, handler), post: (path, handler) => routes.set(path, handler) }, {
    ...f, admin: ownerAdmin, calculateStudentCheckoutAmount: amount => amount + 10,
    initializePaystackPayment: async args => { initializations++; assert.equal(args.email, "billing@example.test"); return { authorization_url: "https://checkout.example.test/group" }; },
  });
  const body = { batchId: "batch", requestId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", email: "billing@example.test", agreement: "Institutional agreement 1", discountReason: "10% first tuition", lines: [{ studentId: "A", amount: 500, discount: 50 }] };
  const call = async payload => {
    let status = 200, value;
    const res = { set() {}, status(n) { status = n; return this; }, json(data) { value = data; } };
    await routes.get("/payments/organisation-link")({ headers: { authorization: "Bearer test" }, body: payload }, res);
    return { status, value };
  };
  const first = await call(body), retry = await call(body);
  assert.equal(first.status, 200); assert.equal(retry.status, 200); assert.equal(initializations, 1);
  assert.equal(first.value.payment.tuitionCredit, 450); assert.equal(first.value.payment.discount, 50);
  assert.equal(first.value.payment.lines[0].studentName, "A"); assert.equal(first.value.payment.referralEligible, false);
  assert.equal(f.data.get("students/A").paid, 0);
  assert.equal((await call({ ...body, requestId: "dddddddd-dddd-dddd-dddd-dddddddddddd", lines: [{ studentId: "A", amount: 500, discount: 10 }] })).status, 409);
  f.data.get("students/A").paid = 100;
  assert.equal((await call({ ...body, requestId: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee", lines: [{ studentId: "A", amount: 200, discount: 20 }] })).status, 409);
  assert.equal((await call({ ...body, email: "changed@example.test" })).status, 409);
  assert.equal((await call({ ...body, requestId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", lines: [{ studentId: "B", amount: 100 }] })).status, 409);
  assert.equal((await call({ ...body, requestId: "cccccccc-cccc-cccc-cccc-cccccccccccc", lines: [{ studentId: "A", amount: 1500 }] })).status, 409);
});


const manualBody = (overrides = {}) => ({
  batchId: "batch", agreementType: "legacy_full_tuition", method: "bank_transfer",
  transactionReference: "BANK-TRANSFER-001", receivedDate: "2026-11-04",
  agreementNote: "Historical full tuition agreement before the new programme",
  verificationNote: "Checked confirmed incoming transfer on the bank statement",
  fundsVerified: true, lines: [{ studentId: "A", amount: 3000, discount: 0 }],
  ...overrides,
});
function manualFixture() {
  const f = fixture();
  f.data.set("students/A", {
    name: "A", email: "a@example.test", organisationSubmissionId: "batch",
    billingResponsibility: "organisation", paid: 0, tuitionFee: 3000,
    initialPaymentAmount: 3000, balanceDue: 3000, paymentStatus: "Pending",
    status: "pending", accountActivationState: "not_prepared",
  });
  f.data.set("organisationEnrolments/batch", {
    organisation: { name: "Company", email: "company@example.test" },
    students: [{ studentId: "A", status: "approved" }],
  });
  const actor = { uid: "owner", email: "owner@example.test" };
  const record = body => recordManualOrganisationPayment({ ...f, admin, actor, body: body || manualBody() });
  return { ...f, actor, record };
}
test("verified legacy full tuition atomically credits student, keeps invitation pending and creates an idempotent manual ledger", async () => {
  const f = manualFixture();
  const first = await f.record();
  assert.equal(first.duplicate, false);
  assert.match(first.reference, /^FAL-ORG-MAN-[a-f0-9]{48}$/);
  const student = f.data.get("students/A"), payment = f.data.get("payments/" + first.reference);
  assert.equal(student.paid, 3000);
  assert.equal(student.balanceDue, 0);
  assert.equal(student.paymentStatus, "Paid");
  assert.equal(student.status, "pending");
  assert.equal(student.accountActivationState, "not_prepared");
  assert.equal(student.lastPaymentProvider, "Bank transfer");
  assert.equal(student.syncedToSheets, false);
  assert.equal(payment.email, "company@example.test");
  assert.equal(payment.tuitionCredit, 3000);
  assert.equal(payment.discount, 0);
  assert.equal(payment.processingShare, 0);
  assert.equal(payment.referralEligible, false);
  assert.equal(payment.purpose, "organisation_manual");
  assert.equal(payment.fundsVerified, true);
  assert.equal(payment.verifiedBy, "owner@example.test");
  assert.equal(f.data.get("payments/" + first.reference + "-0").status, "paid");
  assert.equal(f.data.get("payments/" + first.reference + "-0").referralEligible, false);
  const retry = await f.record();
  assert.equal(retry.duplicate, true);
  assert.equal(f.data.get("students/A").paid, 3000);
  await assert.rejects(f.record(manualBody({ receivedDate: "2026-11-03" })), /already been recorded/);
  assert.equal(f.data.get("students/A").paid, 3000);
});
test("manual tuition rejects unverified transfers, discounting, incorrect balances and unapproved students without recording money", async () => {
  const cases = [
    { fundsVerified: false },
    { transactionReference: "x" },
    { agreementType: "current_10_percent" },
    { receivedDate: "2030-02-10" },
    { lines: [{ studentId: "A", amount: 3000, discount: 300 }] },
    { lines: [{ studentId: "A", amount: 3001, discount: 0 }] },
    { lines: [{ studentId: "B", amount: 500, discount: 0 }] },
    { verificationNote: "" },
    { agreementNote: "" },
  ];
  for (const change of cases) {
    const f = manualFixture();
    await assert.rejects(f.record(manualBody(change)));
    assert.equal(f.data.get("students/A").paid, 0);
    assert.equal([...f.data.keys()].filter(key => key.startsWith("payments/FAL-ORG-MAN-")).length, 0);
  }
  const f = manualFixture();
  f.data.get("students/A").balanceDue = 0;
  await assert.rejects(f.record(), /unpaid balance/);
  assert.equal(f.data.get("students/A").paid, 0);
  const g = manualFixture();
  g.data.get("students/A").paymentStatus = "Paid";
  await assert.rejects(g.record(), /unpaid balance/);
  assert.equal(g.data.get("students/A").paid, 0);
});

test("legacy partial tuition credits only GH₵2,000 of GH₵3,000 and grants one calendar month", async () => {
  const f = manualFixture();
  const recorded = await f.record(manualBody({
    lines: [{ studentId: "A", amount: 2000, discount: 0 }],
  }));
  const student = f.data.get("students/A"), payment = f.data.get("payments/" + recorded.reference);
  assert.equal(student.tuitionFee, 3000);
  assert.equal(student.paid, 2000);
  assert.equal(student.balanceDue, 1000);
  assert.equal(student.balance, 1000);
  assert.equal(student.paymentStatus, "Partially Paid");
  assert.equal(student.status, "Active");
  assert.equal(student.contractTermMonths, "1");
  assert.equal(student.contractStart, "2026-11-04T12:00:00.000Z");
  assert.equal(student.contractEnd, "2026-12-04T12:00:00.000Z");
  assert.equal(student.accountActivationState, "not_prepared");
  assert.equal(payment.tuitionCredit, 2000);
  assert.equal(payment.lines[0].courseTuitionFee, 3000);
  assert.equal(payment.lines[0].remainingBalance, 1000);
  assert.equal(payment.lines[0].accessEndDate, "2026-12-04T12:00:00.000Z");
  assert.equal(f.data.get("payments/" + recorded.reference + "-0").remainingBalance, 1000);
  const retry = await f.record(manualBody({
    lines: [{ studentId: "A", amount: 2000, discount: 0 }],
  }));
  assert.equal(retry.duplicate, true);
  assert.equal(f.data.get("students/A").paid, 2000);
});
test("partial receipt states outstanding tuition and one-month expiry without claiming full settlement", async () => {
  const f = manualFixture();
  const { reference } = await f.record(manualBody({ lines: [{ studentId: "A", amount: 2000, discount: 0 }] }));
  await sendGroupReceipt({ ...f, admin, reference, runtimeConfig: {}, send: async (_conf, row) => {
    assert.equal(row.email, "company@example.test");
    assert.match(row.announcement, /Tuition payment received: GHS 2000\.00/);
    assert.match(row.announcement, /Course tuition GHS 3000\.00 \| Remaining balance GHS 1000\.00/);
    assert.match(row.announcement, /One-month paid access until 2026-12-04T12:00:00.000Z/);
    assert.match(row.announcement, /This is a partial tuition payment/);
    assert.doesNotMatch(row.announcement, /Falowen received the full tuition amount/);
    assert.doesNotMatch(row.announcement, /Student access is six months from account activation/);
    assert.equal(row.student_allocations[0].net_tuition, 2000);
  }});
});
test("one-month partial access clamps end-of-month and rejects preexisting contract or overpayment", async () => {
  const f = manualFixture();
  await assert.rejects(f.record(manualBody({
    lines: [{ studentId: "A", amount: 3100, discount: 0 }],
  })), /must not exceed/);
  f.data.get("students/A").contractEnd = "2027-01-01T00:00:00.000Z";
  await assert.rejects(f.record(manualBody({
    lines: [{ studentId: "A", amount: 2000, discount: 0 }],
  })), /already has contract access dates/);
  assert.equal(f.data.get("students/A").paid, 0);
});

test("the same manual external reference cannot be reused for a different company, amount or payment method", async () => {
  const f = manualFixture();
  const first = await f.record();
  await assert.rejects(f.record(manualBody({ batchId: "another-batch" })), /already been recorded/);
  await assert.rejects(f.record(manualBody({ lines: [{ studentId: "A", amount: 2999, discount: 0 }] })), /already been recorded/);
  assert.equal(f.data.get("students/A").paid, 3000);
  // Case changes to the same bank reference resolve to the same payment record.
  const retry = await f.record(manualBody({ transactionReference: "bank-transfer-001" }));
  assert.equal(retry.reference, first.reference);
  assert.equal(retry.duplicate, true);
});
test("manual company receipt states actual full tuition without new 10% share, and retries do not send twice", async () => {
  const f = manualFixture();
  const { reference } = await f.record();
  const opts = { ...f, admin, reference, runtimeConfig: {},
    send: async () => { throw new Error("mail delivery offline"); } };
  await assert.rejects(sendGroupReceipt(opts), /mail delivery offline/);
  assert.equal(f.data.get("payments/" + reference).receiptStatus, "failed");
  let sends = 0;
  opts.send = async (_config, row) => {
    sends++;
    assert.equal(row.email, "company@example.test");
    assert.equal(row.email_type, "organisation_payment_receipt");
    assert.match(row.announcement, /Original full-tuition arrangement/);
    assert.match(row.announcement, /Partner deduction from Falowen tuition: GHS 0\.00/);
    assert.match(row.announcement, /Net tuition paid to Falowen: GHS 3000\.00/);
    assert.match(row.announcement, /BANK-TRANSFER-001/);
    assert.doesNotMatch(row.announcement, /Retained 10% organisation share/);
    assert.equal(row.net_tuition, 3000);
    assert.equal(row.organisation_share, 0);
  };
  await sendGroupReceipt(opts); await sendGroupReceipt(opts);
  assert.equal(sends, 1);
  assert.equal(f.data.get("payments/" + reference).receiptStatus, "sent");
  assert.equal(f.data.get("students/A").paid, 3000);
});

test("receipt errors distinguish configuration, provider HTTP and unreachable service without exposing private details", () => {
  assert.deepEqual(
    { code: receiptFailure(new Error("Payment-update email webhook is not configured")).code,
      status: receiptFailure(new Error("Payment-update email webhook is not configured")).status },
    { code: "email_webhook_not_configured", status: 503 },
  );
  assert.equal(receiptFailure(new Error("Payment email webhook returned HTTP 403")).code, "email_provider_http_403");
  assert.equal(receiptFailure(new Error("fetch failed")).code, "email_provider_unreachable");
  assert.equal(receiptFailure(new Error("Company receipt is being delivered; retry shortly.")).status, 409);
  const unexpected = receiptFailure(new Error("PRIVATE_WEBHOOK_KEY=SECRET"));
  assert.equal(unexpected.code, "email_delivery_failed");
  assert.doesNotMatch(unexpected.message, /PRIVATE_WEBHOOK_KEY/);
});
test("retry route returns actionable 503 without modifying verified manual payment credits", async () => {
  const f = manualFixture();
  const { reference } = await f.record(manualBody({ lines: [{ studentId: "A", amount: 2000, discount: 0 }] }));
  const routes = new Map();
  const ownerAdmin = { ...admin, auth: () => ({ verifyIdToken: async () => ({
    email: "moxflex@gmail.com", email_verified: true, uid: "owner",
  }) }) };
  const sendReceipt = async () => { throw new Error("Payment-update email webhook is not configured"); };
  registerOrganisationPaymentRoutes({
    get: (path, handler) => routes.set("GET " + path, handler),
    post: (path, handler) => routes.set("POST " + path, handler),
  }, { ...f, admin: ownerAdmin, runtimeConfig: {}, sendReceipt });
  let status = 200, value;
  const res = {
    set() {},
    status(code) { status = code; return this; },
    json(result) { value = result; },
  };
  await routes.get("POST /payments/organisations/receipt/:reference")({
    headers: { authorization: "Bearer valid" }, params: { reference },
  }, res);
  assert.equal(status, 503);
  assert.equal(value.ok, false);
  assert.equal(value.code, "email_webhook_not_configured");
  assert.match(value.error, /not configured/i);
  assert.equal(f.data.get("payments/" + reference).status, "paid");
  assert.equal(f.data.get("students/A").paid, 2000);
  assert.equal(f.data.get("students/A").balanceDue, 1000);
});
test("receipt retry is safe when already sent and records non-sensitive failure classification", async () => {
  const f = manualFixture();
  const { reference } = await f.record();
  await assert.rejects(sendGroupReceipt({
    ...f, admin, reference, runtimeConfig: {},
    send: async () => { throw new Error("Payment email webhook returned HTTP 403"); },
  }));
  assert.equal(f.data.get("payments/" + reference).receiptErrorCode, "email_provider_http_403");
  assert.equal(f.data.get("payments/" + reference).receiptStatus, "failed");
  const initial = f.data.get("students/A").paid;
  await sendGroupReceipt({
    ...f, admin, reference, runtimeConfig: {},
    send: async () => {},
  });
  assert.equal(f.data.get("payments/" + reference).receiptErrorCode, "");
  const delivery = await sendGroupReceipt({
    ...f, admin, reference, runtimeConfig: {},
    send: async () => { throw new Error("Should never re-send an already sent receipt"); },
  });
  assert.deepEqual(delivery, { status: "sent", alreadySent: true });
  assert.equal(f.data.get("students/A").paid, initial);
});

test("verified manual organisation receipt has structured email data for the branded receipt", async () => {
  const f = manualFixture();
  const { reference } = await f.record(manualBody({ lines: [{ studentId: "A", amount: 2000, discount: 0 }] }));
  let sent = 0;
  await sendGroupReceipt({
    ...f, admin, reference, runtimeConfig: {},
    send: async (_config, row) => {
      sent++;
      const receipt = JSON.parse(row.receipt_payload_json);
      assert.equal(row.email_type, "organisation_payment_receipt");
      assert.match(row.subject, /^Falowen tuition payment receipt/);
      assert.equal(receipt.reference, reference);
      assert.equal(receipt.amountReceived, 2000);
      assert.equal(receipt.tuitionAllocated, 2000);
      assert.equal(receipt.students[0].courseTuition, 3000);
      assert.equal(receipt.students[0].balanceRemaining, 1000);
      assert.equal(receipt.students[0].accessEndDate, "2026-12-04T12:00:00.000Z");
      assert.equal(receipt.isManual, true);
      assert.equal(receipt.organisationShare, 0);
    },
  });
  await sendGroupReceipt({
    ...f, admin, reference, runtimeConfig: {},
    send: async () => { throw Error("Already delivered receipt must never be resent"); },
  });
  assert.equal(sent, 1);
  assert.equal(f.data.get("students/A").paid, 2000);
  assert.equal(f.data.get("students/A").balanceDue, 1000);
});
test("Paystack group receipt preserves charge, processing fee and student allocation in structured details", async () => {
  const f = fixture(); await f.apply();
  await sendGroupReceipt({
    ...f, admin, reference: f.payment.reference, runtimeConfig: {},
    send: async (_config, row) => {
      const receipt = JSON.parse(row.receipt_payload_json);
      assert.equal(receipt.isManual, false);
      assert.equal(receipt.amountReceived, 710);
      assert.equal(receipt.tuitionAllocated, 700);
      assert.equal(receipt.organisationShare, 100);
      assert.equal(receipt.processingCharges, 10);
      assert.equal(receipt.students.length, 2);
    },
  });
});

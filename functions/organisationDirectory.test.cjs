const { test } = require("node:test");
const assert = require("node:assert/strict");
const { organisationId, organisationDirectoryRows, organisationStudentLedger, loadOrganisationStudents } = require("./organisationDirectory");
const { organisationStudentConfirmation, sendOrganisationStudentConfirmation } = require("./organisationConfirmations");
const { _test: payment } = require("./studentPaymentUpdateEmails");

test("signed partner appears before submitting students and identity is stable", () => {
  const email = "Partner@EXAMPLE.org";
  const rows = organisationDirectoryRows([{ id: organisationId(email), kind: "institutional", email, name: "Example Organisation", signerName: "Director", signedAt: "2026-11-05", status: "pending" }], []);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].name, "Example Organisation");
  assert.equal(rows[0].studentCount, 0);
  assert.equal(rows[0].contactEmail, "partner@example.org");
  assert.equal(rows[0].agreementSignedAt, "2026-11-05");
});
test("same organisation is shown once across multiple student submissions", () => {
  const email = "partner@example.org", id = organisationId(email);
  const signed = [{ id, kind: "institutional", email, name: "School", signedAt: "2026-11-05" }];
  const submissions = [
    { id: "b1", organisation: { email: email.toUpperCase(), name: "School" }, students: [{ status: "approved", studentId: "A" }] },
    { id: "b2", organisation: { email, name: "School" }, students: [{ status: "pending" }, { status: "approved", studentId: "B" }] },
    { id: "gone", deleted: true, organisation: { email }, students: [{ status: "pending" }] },
  ];
  const rows = organisationDirectoryRows(signed, submissions);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].submissions.length, 2);
  assert.equal(rows[0].studentCount, 3);
  assert.equal(rows[0].approvedCount, 2);
});
test("historical unlinked submissions are not silently discarded", () => {
  const rows = organisationDirectoryRows([], [{ id: "legacy", organisation: { email: "old@example.org", name: "Old Organisation" }, students: [] }]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].agreementStatus, "not_linked");
});
test("student receives an organisation-paid statement, not a personal receipt", () => {
  const student = { billingResponsibility: "organisation", name: "Ama", email: "ama@example.org", organisationName: "Learning Group",
    paid: 450, lastPaymentReference: "FAL-ORG-example", className: "A2 Accra", level: "A2" };
  const message = organisationStudentConfirmation(student);
  assert.equal(message.email, "ama@example.org");
  assert.match(message.announcement, /Your tuition was paid by Learning Group/);
  assert.match(message.announcement, /A2 Accra/);
  assert.match(message.announcement, /10 weeks/);
  assert.match(message.announcement, /six months from account activation/);
  assert.equal(organisationStudentConfirmation({ ...student, className: "" }), null);
  assert.equal(organisationStudentConfirmation({ ...student, billingResponsibility: "student" }), null);
});
test("organisation confirmation is idempotent and sends only after account invitation", async () => {
  const data = new Map([["students/A", { billingResponsibility: "organisation", email: "a@example.org", name: "A", organisationName: "Company", paid: 300,
    lastPaymentReference: "FAL-ORG-1", className: "A1 Monday", accountActivationState: "ready_to_invite" }]]);
  const ref = key => ({
    key, get: async () => ({ exists: data.has(key), data: () => data.get(key) }),
    set: async value => data.set(key, { ...data.get(key), ...value }),
  });
  const db = {
    collection: name => ({ doc: id => ref(name + "/" + id) }),
    runTransaction: fn => fn({
      get: async r => ({ exists: data.has(r.key), data: () => data.get(r.key) }),
      set: (r, value) => data.set(r.key, { ...data.get(r.key), ...value }),
    }),
  };
  const admin = { firestore: { FieldValue: { serverTimestamp: () => "NOW" } } };
  let sends = 0;
  const args = { db, admin, studentId: "A", send: async (_config, row) => { sends++; assert.equal(row.email, "a@example.org"); } };
  assert.equal((await sendOrganisationStudentConfirmation(args)).sent, false);
  data.get("students/A").accountActivationState = "invited";
  assert.equal((await sendOrganisationStudentConfirmation(args)).sent, true);
  assert.equal((await sendOrganisationStudentConfirmation(args)).sent, false);
  assert.equal(sends, 1);
});
test("Firestore payment watcher does not send a personal receipt to organisation-funded students", async () => {
  const { processStudentPaymentUpdate } = require("./studentPaymentUpdateEmails");
  const event = {
    params: { studentId: "A" },
    data: {
      before: { data: () => ({ email: "a@example.org", paid: 0, balance: 500 }) },
      after: { data: () => ({ email: "a@example.org", paid: 450, balance: 0,
        billingResponsibility: "organisation", lastPaymentReference: "FAL-ORG-123" }) },
    },
  };
  const result = await processStudentPaymentUpdate({ event });
  assert.equal(result.sent, false);
  assert.equal(result.reason, "organisation_funded_company_is_payer");
  assert.equal(payment.paymentSnapshot({ paid: 300 }).paid, 300);
});
test('prepared profile overlays contact changes without splitting historical groups', () => {
 const email='partner@example.test',id=organisationId(email);
 const rows=organisationDirectoryRows([], [{id:'old',organisation:{email,name:'School',phone:'old'},students:[]}], [{id,loginEmail:email,name:'School',contactName:'New contact',phone:'new'}]);
 assert.equal(rows.length,1);assert.equal(rows[0].phone,'new');assert.equal(rows[0].submissions[0].id,'old');assert.equal(rows[0].accountPrepared,true);
});
test('same company name across different emails warns without merging identities', () => {
 const rows=organisationDirectoryRows([], [{id:'one',organisation:{email:'one@example.test',name:'School!'},students:[]},{id:'two',organisation:{email:'two@example.test',name:'SCHOOL'},students:[]}]);
 assert.equal(rows.length,2);assert.ok(rows.every(row=>row.possibleDuplicate));assert.notEqual(rows[0].id,rows[1].id);
});

test("partner ledger uses confirmed paid and balance fields and never treats intentions as receipts", () => {
  const data = organisationStudentLedger([
    { id: "A", name: "Sandra", level: "A1", paid: 1000, balanceDue: 2000, tuitionFee: 3000 },
    { id: "B", name: "Kofi", tuitionFee: 3000, initialPaymentAmount: 3000 },
    { id: "C", name: "Esi", paid: 2000, balanceDue: 0, paymentStatus: "Paid" },
    { id: "D", name: "No tuition entered", paymentStatus: "pending" },
    { id: "E", name: "Partial", tuitionFee: 3000, paid: 1000, tuitionDiscount: 300 },
  ]);
  assert.equal(data.outstandingTotal, 6700);
  assert.equal(data.owingCount, 3);
  assert.equal(data.unverifiedCount, 1);
  assert.equal(data.students[1].paid, null);
  assert.equal(data.students[1].balanceDue, 3000);
  assert.equal(data.students[2].balanceDue, 0);
  assert.equal(data.students[3].balanceDue, null);
  assert.equal(data.students[4].balanceDue, 1700);
});

test("partner balances query only selected organisation on demand and cap results", async () => {
  const id = organisationId("company@example.org");
  const calls = [];
  const docs = Array.from({ length: 101 }, (_, index) => ({
    id: "student-" + index,
    data: () => ({ organisationId: id, tuitionFee: 3000, paid: 1000, balanceDue: 2000 }),
  }));
  const db = { collection(name) {
    assert.equal(name, "students");
    return { where(field, operator, value) {
      calls.push([field, operator, value]);
      return { limit(count) { assert.equal(count, 101); return { get: async () => ({ docs }) }; } };
    } };
  } };
  const result = await loadOrganisationStudents(db, id);
  assert.deepEqual(calls, [["organisationId", "==", id]]);
  assert.equal(result.students.length, 100);
  assert.equal(result.outstandingTotal, 200000);
  assert.equal(result.truncated, true);
  await assert.rejects(loadOrganisationStudents(db, "../students"), { status: 400 });
});

test("partner profile includes each submitted student's identity and review status", () => {
  const rows = organisationDirectoryRows([], [{
    id: "submission-one",
    organisation: { email: "school@example.org", name: "School" },
    students: [
      { studentId: "stu-1", name: "Learner One", email: "learner@example.org", level: "A1", status: "approved" },
      { name: "Learner Two", email: "learner2@example.org", level: "A2", status: "pending" },
    ],
  }]);
  assert.equal(rows[0].approvedCount, 1);
  assert.deepEqual(rows[0].submissions[0].students, [
    { studentId: "stu-1", name: "Learner One", email: "learner@example.org", level: "A1", status: "approved" },
    { studentId: "", name: "Learner Two", email: "learner2@example.org", level: "A2", status: "pending" },
  ]);
  assert.equal(rows[0].submissions[0].students[0].phone, undefined);
});

test("partner profile distinguishes configured paid totals from missing payment figures", () => {
  const ledger = organisationStudentLedger([
    { id: "one", paid: 100, balanceDue: 400, tuitionFee: 500 },
    { id: "two", initialPaymentAmount: 250, tuitionFee: 250 },
    { id: "three", paidAmount: 80, balanceDue: 0, tuitionFee: 80 },
  ]);
  assert.equal(ledger.confirmedPaidTotal, 180);
  assert.equal(ledger.unknownPaidCount, 1);
  assert.equal(ledger.outstandingTotal, 650);
  assert.equal(ledger.owingCount, 2);
});

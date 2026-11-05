const { test } = require("node:test");
const assert = require("node:assert/strict");
const { organisationId, organisationDirectoryRows } = require("./organisationDirectory");
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
test("Firestore payment watcher can distinguish organisation funding", () => {
  // The watcher is guarded before sending a personal receipt for an organisation-funded student.
  const fs = require("node:fs");
  const source = fs.readFileSync(require.resolve("./studentPaymentUpdateEmails"), "utf8");
  assert.match(source, /organisation_funded_company_is_payer/);
  assert.equal(payment.paymentSnapshot({ paid: 300 }).paid, 300);
});

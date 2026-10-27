import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const {
  firstPaymentTransition,
  registrationRow,
  resolveRegistrationDocsConfig,
  _test,
} = require("../functions/registrationLifecycleEvents.js");

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

test("student creation payload uses canonical registration identity", () => {
  const row = registrationRow({
    studentCode: " Adu123 ",
    name: "Adu Yaw",
    email: " ADU@EXAMPLE.COM ",
    className: "A1 Dortmund Klasse",
    level: "a1",
    paid: 500,
    balanceDue: 2300,
  }, "firestore-id", new Date("2026-09-18T10:00:00Z"));

  assert.equal(row.student_code, "Adu123");
  assert.equal(row.email, "adu@example.com");
  assert.equal(row.class_name, "A1 Dortmund Klasse");
  assert.equal(row.level, "A1");
  assert.equal(row.paid, 500);
  assert.equal(row.balance, 2300);
});

test("first paid increase confirms enrollment once", () => {
  assert.deepEqual(
    firstPaymentTransition(
      { paid: 0, balanceDue: 2800 },
      { paid: 500, balanceDue: 2300 },
    ),
    { confirmed: true, source: "paid_increase", amount: 500 },
  );

  assert.equal(
    firstPaymentTransition(
      { paid: 500, balanceDue: 2300 },
      { paid: 1000, balanceDue: 1800 },
    ).confirmed,
    false,
  );
});

test("manual first payment recorded only as a balance decrease confirms enrollment", () => {
  assert.deepEqual(
    firstPaymentTransition(
      { paid: 0, balanceDue: 2800 },
      { paid: 0, balanceDue: 2300 },
    ),
    { confirmed: true, source: "balance_decrease", amount: 500 },
  );
});

test("registration docs use the deployed web-app URL without extra runtime configuration", () => {
  const config = resolveRegistrationDocsConfig({
    communication: {
      announcement_webhook_token: "existing-token",
    },
  }, {});

  assert.equal(config.url, "https://script.google.com/macros/s/AKfycbxWsVmzNdDMXtUd0CwChFXR_Iy6lbb7oVVt8ao_6_8oYYFI9Te9Y7pD0FgIJTjAozYOQg/exec");
  assert.equal(config.token, "existing-token");
});

test("registration docs Firebase config reuses existing Announcement webhook token", () => {
  const config = resolveRegistrationDocsConfig({
    registration_docs: {
      webhook_url: "https://script.google.com/macros/s/registration/exec",
    },
    communication: {
      announcement_webhook_token: "existing-token",
    },
  }, {});

  assert.equal(config.url, "https://script.google.com/macros/s/registration/exec");
  assert.equal(config.token, "existing-token");
});

test("automatic lifecycle events use stable event IDs and the shared System Events store", () => {
  assert.equal(_test.eventIdFor("registration.received", "student-1"), _test.eventIdFor("registration.received", "student-1"));
  const source = read("functions/registrationLifecycleEvents.js");
  const index = read("functions/index.js");

  assert.match(source, /registrationLifecycleStates/);
  assert.match(source, /auditLogs/);
  assert.match(source, /integrationEvent: true/);
  assert.match(source, /registration\.received/);
  assert.match(source, /enrollment\.confirmed/);
  assert.match(source, /reactivateTrialStudentAfterPayment/);
  assert.match(source, /trialStatus: "converted"/);
  assert.match(source, /trialPurgeAt: deleteValue/);
  assert.match(index, /trackStudentRegistrationReceived/);
  assert.match(index, /sendEnrollmentConfirmationDocuments/);
});

test("bound Registration Docs Apps Script accepts lifecycle events and keeps existing enrollment sender authoritative", () => {
  const source = read("docs/apps-script/registration-lifecycle-webhook.gs");

  assert.match(source, /ANNOUNCEMENT_WEBHOOK_TOKEN/);
  assert.match(source, /processRegistrationLifecycleEvent/);
  assert.match(source, /registration\.received/);
  assert.match(source, /enrollment\.confirmed/);
  assert.match(source, /sendEnrollmentPacketToStudent_/);
  assert.match(source, /COL_ENROLL_SENT/);
  assert.match(source, /COL_LAST_PAID/);
  assert.doesNotMatch(source, /REGISTRATION_DOCS_WEBHOOK_TOKEN_PROPERTY/);
});

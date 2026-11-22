import fs from "node:fs";

const indexTarget = new URL("../functions/index.js", import.meta.url);
let source = fs.readFileSync(indexTarget, "utf8");

function replaceOnce(input, before, after, label) {
  if (input.includes(after)) return input;
  if (!input.includes(before)) throw new Error(`${label} anchor changed; update patchStudentPaymentUpdateEmails.mjs`);
  return input.replace(before, after);
}

const firestoreTriggerPattern = /const \{ ([^}]+) \} = require\("firebase-functions\/v2\/firestore"\);/;
const firestoreMatch = source.match(firestoreTriggerPattern);
if (!firestoreMatch) throw new Error("Firestore trigger import anchor changed; update patchStudentPaymentUpdateEmails.mjs");
const firestoreTriggers = [...new Set(
  firestoreMatch[1].split(",").map((value) => value.trim()).filter(Boolean),
)];
for (const trigger of ["onDocumentCreated", "onDocumentUpdated"]) {
  if (!firestoreTriggers.includes(trigger)) firestoreTriggers.push(trigger);
}
source = source.replace(
  firestoreTriggerPattern,
  'const { ' + firestoreTriggers.join(", ") + ' } = require("firebase-functions/v2/firestore");',
);

source = replaceOnce(
  source,
  'const { defineSecret } = require("firebase-functions/params");',
  'const { defineSecret } = require("firebase-functions/params");\nconst { createStudentPaymentUpdateEmailTrigger } = require("./studentPaymentUpdateEmails.js");',
  "payment email module import",
);

const registration = `exports.sendStudentPaymentUpdateEmail = createStudentPaymentUpdateEmailTrigger({
  admin,
  db,
  onDocumentUpdated,
  runtimeConfig,
});

exports.createFlatSubmissionMarkingJob`;

source = replaceOnce(
  source,
  "exports.createFlatSubmissionMarkingJob",
  registration,
  "payment email trigger registration",
);

fs.writeFileSync(indexTarget, source);

const paymentTarget = new URL("../functions/studentPaymentUpdateEmails.js", import.meta.url);
let paymentSource = fs.readFileSync(paymentTarget, "utf8");

// The base notification module now accepts only a newly credited paid amount.
// Do not reintroduce balance-decrease receipts or cumulative paid baselines
// in generated deployment output.

paymentSource = replaceOnce(
  paymentSource,
  `}

async function postPaymentRow(config, row, fetchImpl = fetch) {`,
  `}

function resolveClassWebhookConfig(klass = {}, fallback = {}) {
  const stored = klass.studentPaymentUpdateEmailDelivery
    || klass.classReminderEmailDelivery
    || klass.attendanceConfirmationEmailDelivery
    || klass.courseReviewEmailDelivery
    || {};
  return {
    url: text(stored.url) || fallback.url || "",
    token: text(stored.token) || fallback.token || "",
    sheetName: text(stored.sheetName) || fallback.sheetName || "",
    sheetGid: text(stored.sheetGid) || fallback.sheetGid || "",
  };
}

function studentClassCandidates(student = {}) {
  return [...new Set([
    student.classId,
    student.classRecordId,
    student.assignedClassId,
    student.className,
    student.class,
    student.group,
  ].map(text).filter(Boolean))];
}

async function loadStudentClass(db, student = {}) {
  if (!db?.collection) return null;
  const candidates = studentClassCandidates(student);
  const classes = db.collection("classes");

  for (const candidate of candidates) {
    try {
      const snap = await classes.doc(candidate).get();
      if (snap.exists) return { id: snap.id, ...(snap.data() || {}) };
    } catch (error) {
      console.warn("payment_email_class_direct_lookup_failed", { candidate, message: error?.message || String(error) });
    }
  }

  for (const candidate of candidates) {
    for (const field of ["name", "className", "classId"]) {
      try {
        const snap = await classes.where(field, "==", candidate).limit(1).get();
        if (!snap.empty) {
          const docSnap = snap.docs[0];
          return { id: docSnap.id, ...(docSnap.data() || {}) };
        }
      } catch (error) {
        console.warn("payment_email_class_query_failed", { field, candidate, message: error?.message || String(error) });
      }
    }
  }

  return null;
}

async function resolveStudentWebhookConfig({ db, student = {}, fallback = {} } = {}) {
  const klass = await loadStudentClass(db, student);
  return resolveClassWebhookConfig(klass || {}, fallback);
}

async function postPaymentRow(config, row, fetchImpl = fetch) {`,
  "class delivery fallback helpers",
);

paymentSource = replaceOnce(
  paymentSource,
  `  const row = rowForPaymentUpdate({ student: after, change, now });
  const config = resolveWebhookConfig(runtimeConfig);`,
  `  const row = rowForPaymentUpdate({ student: after, change, now });
  const config = await resolveStudentWebhookConfig({
    db,
    student: after,
    fallback: resolveWebhookConfig(runtimeConfig),
  });`,
  "student class delivery fallback application",
);

paymentSource = replaceOnce(
  paymentSource,
  `    ACCOUNT_URL,
    PAID_FIELDS,`,
  `    ACCOUNT_URL,
    PAID_FIELDS,
    applyStoredPaymentBaseline,
    loadStudentClass,
    resolveClassWebhookConfig,
    resolveStudentWebhookConfig,`,
  "payment delivery helper exports",
);

fs.writeFileSync(paymentTarget, paymentSource);
console.log("Student payment-update email trigger is registered with cumulative totals and class delivery fallback.");

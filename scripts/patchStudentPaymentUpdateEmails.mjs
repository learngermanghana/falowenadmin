import fs from "node:fs";

const indexTarget = new URL("../functions/index.js", import.meta.url);
let source = fs.readFileSync(indexTarget, "utf8");

function replaceOnce(input, before, after, label) {
  if (input.includes(after)) return input;
  if (!input.includes(before)) throw new Error(`${label} anchor changed; update patchStudentPaymentUpdateEmails.mjs`);
  return input.replace(before, after);
}

source = replaceOnce(
  source,
  'const { onDocumentCreated } = require("firebase-functions/v2/firestore");',
  'const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");',
  "Firestore trigger import",
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

paymentSource = replaceOnce(
  paymentSource,
  `  const totalPaid = current.paidPresent
    ? current.paid
    : roundMoney((previous.paidPresent ? previous.paid : 0) + amount);`,
  `  const totalPaid = source === "balance_decrease" && paidIncrease <= MONEY_EPSILON
    ? roundMoney((previous.paidPresent ? previous.paid : 0) + amount)
    : current.paidPresent
      ? current.paid
      : roundMoney((previous.paidPresent ? previous.paid : 0) + amount);`,
  "manual balance total paid calculation",
);

paymentSource = replaceOnce(
  paymentSource,
  `function sameStoredTotals(state = {}, change = {}) {
  return approximatelyEqual(state.lastPaid, change.totalPaid)
    && approximatelyEqual(state.lastBalance, change.balance);
}
`,
  `function sameStoredTotals(state = {}, change = {}) {
  return approximatelyEqual(state.lastPaid, change.totalPaid)
    && approximatelyEqual(state.lastBalance, change.balance);
}

function applyStoredPaymentBaseline(state = {}, change = {}) {
  if (change.source !== "balance_decrease" || change.paidIncrease > MONEY_EPSILON) return change;
  const storedPaid = money(state.lastPaid);
  if (storedPaid === null) return change;
  return {
    ...change,
    totalPaid: roundMoney(Math.max(change.totalPaid, storedPaid + change.amount)),
  };
}
`,
  "stored manual payment baseline helper",
);

paymentSource = replaceOnce(
  paymentSource,
  `    if (processingFresh) {
      result = { reserved: false, ref, reason: "processing" };
      return;
    }

    const token = crypto.createHash("sha256").update([`,
  `    if (processingFresh) {
      result = { reserved: false, ref, reason: "processing" };
      return;
    }

    Object.assign(change, applyStoredPaymentBaseline(state, change));

    const token = crypto.createHash("sha256").update([`,
  "stored manual payment baseline application",
);

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

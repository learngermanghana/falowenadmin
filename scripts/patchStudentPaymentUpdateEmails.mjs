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
  `    ACCOUNT_URL,
    PAID_FIELDS,`,
  `    ACCOUNT_URL,
    PAID_FIELDS,
    applyStoredPaymentBaseline,`,
  "stored manual payment baseline export",
);

fs.writeFileSync(paymentTarget, paymentSource);
console.log("Student payment-update email trigger is registered with cumulative manual-payment totals.");

import fs from "node:fs";

const target = new URL("../functions/index.js", import.meta.url);
let source = fs.readFileSync(target, "utf8");

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

fs.writeFileSync(target, source);
console.log("Student payment-update email trigger is registered.");

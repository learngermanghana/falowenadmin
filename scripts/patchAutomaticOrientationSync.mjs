import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const functionsPath = path.join(root, "functions/index.js");
let content = fs.readFileSync(functionsPath, "utf8");

const firestoreImport = 'const { onDocumentCreated } = require("firebase-functions/v2/firestore");';
const expandedFirestoreImport = 'const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");';
if (content.includes(firestoreImport)) {
  content = content.replace(firestoreImport, expandedFirestoreImport);
} else if (!content.includes(expandedFirestoreImport)) {
  throw new Error("Automatic orientation sync patch could not find the Firestore trigger import.");
}

const helperRequire = 'const { createOrientationAutoSyncHandler } = require("./orientationAutoSync");\n';
const helperAnchor = 'const { defineSecret } = require("firebase-functions/params");\n';
if (!content.includes(helperRequire)) {
  if (!content.includes(helperAnchor)) {
    throw new Error("Automatic orientation sync patch could not find the Firebase params import.");
  }
  content = content.replace(helperAnchor, `${helperAnchor}${helperRequire}`);
}

const beginMarker = "// BEGIN AUTOMATIC PAID STUDENT ORIENTATION SYNC\n";
const endMarker = "// END AUTOMATIC PAID STUDENT ORIENTATION SYNC\n\n";
while (content.includes(beginMarker)) {
  const start = content.indexOf(beginMarker);
  const end = content.indexOf(endMarker, start);
  if (end < 0) throw new Error("Automatic orientation sync patch found an incomplete generated block.");
  content = `${content.slice(0, start)}${content.slice(end + endMarker.length)}`;
}

const block = `${beginMarker}const automaticPaidStudentOrientationHandler = createOrientationAutoSyncHandler({
  db,
  appsScriptUrl: () => String(
    orientationAppsScriptUrlSecret.value() || process.env.ORIENTATION_APPS_SCRIPT_URL || ""
  ).trim(),
  syncSecret: () => String(
    orientationSyncSecret.value() || process.env.ORIENTATION_SYNC_SECRET || ""
  ).trim(),
});

async function automaticPaidPaymentOrientationHandler(event) {
  const beforePayment = event?.data?.before?.exists ? event.data.before.data() || {} : {};
  const afterPayment = event?.data?.after?.exists ? event.data.after.data() || {} : {};
  const beforeStatus = String(beforePayment.status || "").trim().toLowerCase();
  const afterStatus = String(afterPayment.status || "").trim().toLowerCase();

  if (afterStatus !== "paid" || beforeStatus === "paid") {
    return { skipped: true, reason: "payment_not_newly_paid" };
  }

  const studentId = String(afterPayment.studentId || "").trim();
  if (!studentId) throw new Error("Paid payment is missing studentId for orientation sync.");

  const studentRef = db.collection("students").doc(studentId);
  const studentSnapshot = await studentRef.get();
  if (!studentSnapshot.exists) {
    throw new Error("Student record not found for paid payment: " + studentId);
  }

  const currentStudent = studentSnapshot.data() || {};
  const syntheticBefore = {
    ...currentStudent,
    paymentStatus: "pending",
    payment_status: "pending",
    paid: 0,
    paidAmount: 0,
    initialPaymentAmount: 0,
  };
  const beforeStudentSnapshot = {
    exists: true,
    id: studentSnapshot.id || studentId,
    ref: studentRef,
    data: () => syntheticBefore,
  };

  return automaticPaidStudentOrientationHandler({
    ...event,
    params: {
      ...(event?.params || {}),
      studentCode: studentSnapshot.id || studentId,
    },
    data: {
      before: beforeStudentSnapshot,
      after: studentSnapshot,
    },
  });
}

exports.autoSyncPaidStudentOrientation = onDocumentUpdated(
  {
    region: "europe-west1",
    document: "payments/{reference}",
    secrets: [orientationSyncSecret, orientationAppsScriptUrlSecret],
    timeoutSeconds: 60,
  },
  automaticPaidPaymentOrientationHandler
);
${endMarker}`;

const triggerAnchors = [
  'exports.createFlatSubmissionMarkingJob = onDocumentCreated(',
  'exports.sendDueHolidayNotices = onSchedule({',
];
const triggerAnchor = triggerAnchors.find((candidate) => content.includes(candidate));
if (!triggerAnchor) {
  throw new Error("Automatic orientation sync patch could not find a stable function-export insertion point.");
}
content = content.replace(triggerAnchor, `${block}${triggerAnchor}`);

fs.writeFileSync(functionsPath, content, "utf8");
console.log("Automatic paid-payment orientation sync patch applied.");

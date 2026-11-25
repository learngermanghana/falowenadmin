"use strict";
// Scheduled legacy cleanup is never authorized to remove a level-managed account.
// Even a planned, expired or malformed ledger may contain history requiring review.
// A read failure must stop cleanup, never be interpreted as an empty ledger.
// Keep complimentary/institutional placements and any secondary course with
// billing or contract history out of destructive legacy cleanup.
function hasOtherCourseProtection(student = {}) {
  if (student.institutionId || student.institutionVerification ||
      student.accessType === "complimentary" || student.accountType === "exam_only") return true;
  const secondary = student.secondaryProgram;
  const placement = secondary && student.coursePlacements?.[secondary];
  return Boolean(placement && (placement.institutionId || placement.accessType === "complimentary" ||
    placement.contractStart || placement.contractEnd || Number(placement.paid || 0) > 0 ||
    ["paid","partial","partially paid"].includes(String(placement.paymentStatus || "").toLowerCase())));
}
// The exam ledger is independent of student-level tuition. A paid term or
// unresolved checkout requires retention even when the course trial has ended.
// Do not infer payment from an exam trial. Missing/malformed non-trial ledger
// data is deliberately retained for reconciliation, not automatically deleted.
async function hasExamLedgerProtection(ref, student) {
  const db = ref.firestore;
  if (!db || !ref.id) throw Error("Missing Firestore cleanup identity");
  const uid = String(student.uid || ref.id).trim();
  const email = String(student.email || "").trim().toLowerCase();
  const studentId = ref.id;
  const purchases = db.collection("mockPurchases");
  const orders = db.collection("mockOrders");
  const subscriptions = db.collection("mockSubscriptions");
  const [byId, byUid] = await Promise.all([
    purchases.where("studentId","==",studentId).limit(1).get(),
    purchases.where("uid","==",uid).limit(1).get(),
  ]);
  if (!byId.empty || !byUid.empty) return true;
  const [grants, ...checkouts] = await Promise.all([
    subscriptions.where("uid","==",uid).get(),
    orders.where("studentId","==",studentId).get(),
    orders.where("uid","==",uid).get(),
    ...(email ? [orders.where("email","==",email).get()] : []),
  ]);
  if (grants.docs.some(doc => doc.data()?.scope !== "trial")) return true;
  return checkouts.some(snap => snap.docs.some(doc =>
    !["rejected","cancelled","failed"].includes(String(doc.data()?.status || "").toLowerCase())));
}
async function readCleanupCandidate(ref, eligible) {
  const current = await ref.get();
  if (!current.exists || !eligible(current.data() || {}) || hasOtherCourseProtection(current.data())) return null;
  const enrollments = await ref.collection("levelEnrollments").limit(1).get();
  if (!enrollments.empty || await hasExamLedgerProtection(ref, current.data() || {})) return null;
  const latest = await ref.get();
  if (!latest.exists || !eligible(latest.data() || {}) || hasOtherCourseProtection(latest.data())) return null;
  if ((latest.data()?.uid || "") !== (current.data()?.uid || "") || (latest.data()?.email || "") !== (current.data()?.email || "")) return null;
  return latest.data() || {};
}
function hasTrialHistory(student = {}) {
  return Boolean(student.trialStartedAt || student.trialUsedAt || student.trialEndsAt ||
    student.trialExpiredAt || student.trialPurgeAt || student.trialConvertedAt ||
    student.trialStartAt || student.trialStart || student.trial_started_at ||
    student.trial_end || student.trial_purge_at ||
    String(student.status || "").toLowerCase().replace(/[ -]/g, "_").startsWith("trial_") ||
    String(student.trialStatus || student.trial_status || "").trim());
}
function hasConversion(student = {}) {
  return Boolean(student.trialConvertedAt || ["converted","paid"].includes(String(student.trialStatus || student.trial_status || "").trim().toLowerCase()));
}
module.exports = {readCleanupCandidate,hasTrialHistory,hasConversion,hasExamLedgerProtection,hasOtherCourseProtection};

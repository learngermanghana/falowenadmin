"use strict";
// Scheduled legacy cleanup is never authorized to remove a level-managed account.
// Even a planned, expired or malformed ledger may contain history requiring review.
// A read failure must stop cleanup, never be interpreted as an empty ledger.
async function readCleanupCandidate(ref, eligible) {
  const current = await ref.get();
  if (!current.exists || !eligible(current.data() || {})) return null;
  const enrollments = await ref.collection("levelEnrollments").limit(1).get();
  if (!enrollments.empty) return null;
  const latest = await ref.get();
  if (!latest.exists || !eligible(latest.data() || {})) return null;
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
module.exports = {readCleanupCandidate,hasTrialHistory,hasConversion};

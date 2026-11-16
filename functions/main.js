const baseExports = require("./index.js");
const admin = require("firebase-admin");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const {
  runExpiredPendingStudentCleanup,
  resolveLifecycleWebhookConfig,
} = require("./pendingStudentCleanup.js");
const { createStudentLearningNudgeJob } = require("./studentLearningInterventionEmails.js");

const db = admin.firestore();

function parseRuntimeConfig() {
  const raw = process.env.CLOUD_RUNTIME_CONFIG || "{}";
  try {
    return JSON.parse(raw);
  } catch {
    console.warn("pending_cleanup_runtime_config_invalid");
    return {};
  }
}

async function cleanupExpiredPendingStudentsNow() {
  const runtimeConfig = parseRuntimeConfig();
  const communication = resolveLifecycleWebhookConfig(runtimeConfig, process.env);
  return runExpiredPendingStudentCleanup({
    admin,
    db,
    now: Date.now(),
    // Reuse the same Announcement Apps Script URL/token already configured for
    // class reminders, attendance, registration docs, completion docs, etc.
    appsScriptUrl: communication.url,
    syncSecret: communication.token,
  });
}

module.exports = baseExports;

module.exports.sendStudentLearningNudges = createStudentLearningNudgeJob({
  admin,
  db,
  onSchedule,
  runtimeConfig: parseRuntimeConfig(),
});

module.exports.cleanupExpiredPendingStudents = onSchedule({
  cpu: "gcf_gen1",
  schedule: "0 3 * * *",
  timeZone: "Africa/Accra",
  retryCount: 1,
  memory: "256MiB",
}, async () => {
  const result = await cleanupExpiredPendingStudentsNow();
  console.log("pending_student_trial_lifecycle", {
    checked: result.checked,
    candidates: result.candidates,
    blocked: result.blocked,
    purged: result.purged,
  });
  return result;
});

Object.assign(module.exports, require("./referralPayouts").registerPayoutTriggers({
  db, admin, onDocumentWritten: require("firebase-functions/v2/firestore").onDocumentWritten,
  paystackSecret: require("firebase-functions/params").defineSecret("PAYSTACK_SECRET"),
}));

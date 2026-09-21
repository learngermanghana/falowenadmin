const baseExports = require("./index.js");
const admin = require("firebase-admin");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const {
  runExpiredPendingStudentCleanup,
} = require("./pendingStudentCleanup.js");
const { runClassSessionReminderEmailJob } = require("./classSessionReminderEmails.js");

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
  return runExpiredPendingStudentCleanup({
    admin,
    db,
    now: Date.now(),
    // Google Sheet cleanup is optional and only runs at the final purge.
    // Day-7 trial blocking never depends on the sheet webhook.
    appsScriptUrl: String(process.env.STUDENT_DELETE_APPS_SCRIPT_URL || "").trim(),
    syncSecret: String(process.env.STUDENT_DELETE_SYNC_SECRET || "").trim(),
  });
}

module.exports = baseExports;

module.exports.cleanupExpiredPendingStudents = onSchedule({
  schedule: "*/5 * * * *",
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

// Replace the original reminder export with a lifecycle-first version. Pending
// students keep receiving reminders during the valid 7-day trial; once it ends
// they are marked trial_expired before recipients are resolved, and final data
// deletion happens only after the 30-day recovery window.
module.exports.sendClassSessionReminderEmails = onSchedule({
  schedule: "*/5 * * * *",
  timeZone: "Africa/Accra",
  retryCount: 1,
}, async () => {
  const cleanup = await cleanupExpiredPendingStudentsNow();
  console.log("class_reminder_pre_trial_lifecycle", {
    checked: cleanup.checked,
    candidates: cleanup.candidates,
    blocked: cleanup.blocked,
    purged: cleanup.purged,
  });
  return runClassSessionReminderEmailJob({
    admin,
    db,
    runtimeConfig: parseRuntimeConfig(),
    now: new Date(),
  });
});

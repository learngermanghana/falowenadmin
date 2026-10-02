const baseExports = require("./index.js");
const admin = require("firebase-admin");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const {
  runExpiredPendingStudentCleanup,
  resolveLifecycleWebhookConfig,
} = require("./pendingStudentCleanup.js");
const { runClassSessionReminderEmailJob } = require("./classSessionReminderEmails.js");
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

function accraClassClock(date = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Accra",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date).map((part) => [part.type, part.value]));
  return {
    weekday: parts.weekday || "",
    minutes: (Number(parts.hour) * 60) + Number(parts.minute),
  };
}

function isClassReminderOperatingWindow(date = new Date()) {
  const { weekday, minutes } = accraClassClock(date);
  const inRange = (startHour, startMinute, endHour, endMinute) => {
    const start = (startHour * 60) + startMinute;
    const end = (endHour * 60) + endMinute;
    return minutes >= start && minutes <= end;
  };

  if (["Mon", "Tue", "Wed", "Thu", "Fri"].includes(weekday)) {
    return inRange(10, 25, 12, 0)
      || inRange(12, 25, 15, 0)
      || inRange(17, 25, 20, 30);
  }
  if (weekday === "Sat") return inRange(6, 25, 10, 0);
  return false;
}

async function runClassReminderIfOpen() {
  const now = new Date();
  if (!isClassReminderOperatingWindow(now)) {
    console.log("class_session_reminder_skipped_outside_operating_window");
    return { due: 0, sent: 0, skipped: "outside_operating_window" };
  }
  return runClassSessionReminderEmailJob({
    admin,
    db,
    runtimeConfig: parseRuntimeConfig(),
    now,
  });
}

// Current class windows: Monday-Friday 11:00-12:00, 13:00-15:00,
// 18:00-20:30, plus Saturday 07:00-10:00. Scheduler windows begin early
// enough to preserve the 30-minute and 10-minute reminder emails.
module.exports.sendClassSessionReminderEmails = onSchedule({
  schedule: "*/5 10-20 * * 1-5",
  timeZone: "Africa/Accra",
  retryCount: 1,
}, runClassReminderIfOpen);

module.exports.sendSaturdayClassSessionReminderEmails = onSchedule({
  schedule: "*/5 6-10 * * 6",
  timeZone: "Africa/Accra",
  retryCount: 1,
}, runClassReminderIfOpen);

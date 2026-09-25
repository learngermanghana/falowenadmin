const crypto = require("crypto");
const {
  TRIAL_DURATION_MS,
  hasQualifyingPayment,
  pendingStartedAtMillis,
  trialExpiredAtMillis,
  trialPurgeAtMillis,
} = require("./pendingStudentCleanup.js");

const TZ = "Africa/Accra";
const ACCOUNT_URL = "https://www.falowen.app/campus/account";
const CAMPUS_URL = "https://www.falowen.app/campus";
const PROCESSING_STALE_MS = 30 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function text(value) {
  return String(value == null ? "" : value).trim();
}

function lower(value) {
  return text(value).toLowerCase();
}

function studentStatus(student = {}) {
  return lower(student.status || student.studentStatus || student.enrollmentStatus);
}

function studentRole(student = {}) {
  return lower(student.role);
}

function studentEmail(student = {}) {
  return lower(student.email || student.emailAddress || student.studentEmail);
}

function studentName(student = {}) {
  return text(student.name || student.displayName || student.firstName) || "Student";
}

function studentClassName(student = {}) {
  return text(student.className || student.class || student.groupName || student.program || student.level);
}

function studentLevel(student = {}) {
  const direct = text(student.level || student.levelId).toUpperCase();
  if (/^(A1|A2|B1|B2|C1|C2)$/.test(direct)) return direct;
  const match = studentClassName(student).toUpperCase().match(/\b(A1|A2|B1|B2|C1|C2)\b/);
  return match?.[1] || "";
}

function isGermanCourse(student = {}) {
  const language = lower(student.language || student.courseLanguage || student.languageName);
  if (!language) return true;
  return language.includes("german") || language.includes("deutsch");
}

function day1LessonUrl(student = {}) {
  const level = studentLevel(student);
  if (!level || !isGermanCourse(student)) return CAMPUS_URL;
  return `https://www.falowen.app/campus/course/lesson/${level}/1?view=workbook`;
}

function asDate(value) {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(value) {
  const date = asDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function isoDate(value = new Date()) {
  const date = asDate(value) || new Date();
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function resolveTrialEmailConfig(runtimeConfig = {}, env = process.env) {
  const communication = runtimeConfig.communication
    || runtimeConfig.announcements
    || runtimeConfig.announcement
    || {};
  const trial = runtimeConfig.trial_emails
    || runtimeConfig.trialEmails
    || runtimeConfig.trial
    || {};

  return {
    url: text(
      env.TRIAL_ACCESS_EMAIL_WEBHOOK_URL
      || env.ANNOUNCEMENT_WEBHOOK_URL
      || env.VITE_ANNOUNCEMENT_WEBHOOK_URL
      || trial.webhook_url
      || trial.url
      || communication.trial_access_webhook_url
      || communication.announcement_webhook_url
      || communication.webhook_url,
    ),
    token: text(
      env.TRIAL_ACCESS_EMAIL_WEBHOOK_TOKEN
      || env.ANNOUNCEMENT_WEBHOOK_TOKEN
      || env.VITE_ANNOUNCEMENT_WEBHOOK_TOKEN
      || trial.webhook_token
      || trial.token
      || communication.trial_access_webhook_token
      || communication.announcement_webhook_token
      || communication.webhook_token,
    ),
    sheetName: text(
      env.TRIAL_ACCESS_EMAIL_SHEET_NAME
      || env.ANNOUNCEMENT_WEBHOOK_SHEET_NAME
      || env.VITE_ANNOUNCEMENT_WEBHOOK_SHEET_NAME
      || trial.sheet_name
      || communication.announcement_sheet_name
      || communication.sheet_name,
    ),
    sheetGid: text(
      env.TRIAL_ACCESS_EMAIL_SHEET_GID
      || env.ANNOUNCEMENT_WEBHOOK_SHEET_GID
      || env.VITE_ANNOUNCEMENT_WEBHOOK_SHEET_GID
      || trial.sheet_gid
      || communication.announcement_sheet_gid
      || communication.sheet_gid,
    ),
  };
}

function trialEmailStage(student = {}, now = Date.now()) {
  const role = studentRole(student);
  if (role && role !== "student") return "";
  if (hasQualifyingPayment(student)) return "";
  if (!studentEmail(student)) return "";

  const status = studentStatus(student);
  if (!["pending", "trial_expired"].includes(status)) return "";

  const startedAt = pendingStartedAtMillis(student);
  if (!startedAt || startedAt > now) return "";

  const purgeAt = trialPurgeAtMillis(student);
  if (purgeAt && now >= purgeAt) return "";

  const expiredAt = trialExpiredAtMillis(student) || (startedAt + TRIAL_DURATION_MS);
  if (status === "trial_expired" || now >= expiredAt) return "expired";

  const elapsed = now - startedAt;
  if (elapsed >= 6 * DAY_MS) return "day6";
  if (elapsed >= 3 * DAY_MS) return "day3";
  return "welcome";
}

function stageTopic(stage) {
  if (stage === "welcome") return "Your 7-day Falowen free trial is ready";
  if (stage === "day3") return "You still have 4 days of Falowen trial access";
  if (stage === "day6") return "Your Falowen trial ends tomorrow";
  return "Your Falowen trial has ended";
}

function stageButtonLabel(stage) {
  if (stage === "welcome") return "Start Day 1 lesson";
  if (stage === "day3") return "Continue learning";
  if (stage === "day6") return "Continue your trial";
  return "Open account to register";
}

function stageActionUrl(stage, student = {}) {
  return stage === "welcome" ? day1LessonUrl(student) : (stage === "expired" ? ACCOUNT_URL : CAMPUS_URL);
}

function buildTrialAccessMessage({ student = {}, stage = "welcome" } = {}) {
  const name = studentName(student);
  const expiredAt = trialExpiredAtMillis(student);
  const purgeAt = trialPurgeAtMillis(student);
  const lessonUrl = day1LessonUrl(student);

  if (stage === "welcome") {
    return [
      `Hello ${name},`,
      "",
      "Your 7-day Falowen free trial is now active. You can start learning immediately even if you have not paid yet.",
      expiredAt ? `Your free access runs until ${formatDate(expiredAt)}.` : "",
      "",
      "Start with your Day 1 lesson:",
      lessonUrl,
      "",
      "You can register/pay at any time from your Falowen account:",
      ACCOUNT_URL,
      "",
      "If you continue after the trial, you keep the same account and the progress you made during your trial.",
      "",
      "Best regards,",
      "Learn Language Education Academy (Falowen)",
    ].filter((line) => line !== "").join("\n");
  }

  if (stage === "day3") {
    return [
      `Hello ${name},`,
      "",
      "You still have about 4 days of free Falowen access.",
      "Use the remaining trial time to continue your lessons and explore the learning tools in your campus.",
      "",
      "Continue learning:",
      CAMPUS_URL,
      "",
      "To keep access after the trial, you can register/pay from your account at any time:",
      ACCOUNT_URL,
      "",
      "Best regards,",
      "Learn Language Education Academy (Falowen)",
    ].join("\n");
  }

  if (stage === "day6") {
    return [
      `Hello ${name},`,
      "",
      "Your 7-day Falowen free trial ends tomorrow.",
      "You can keep learning until the trial expires.",
      "",
      "Continue your trial:",
      CAMPUS_URL,
      "",
      "To keep your account active without interruption, register/pay from your account:",
      ACCOUNT_URL,
      "",
      "Best regards,",
      "Learn Language Education Academy (Falowen)",
    ].join("\n");
  }

  return [
    `Hello ${name},`,
    "",
    "Your 7-day Falowen free trial has ended, so learning access is now paused.",
    "Your account, scores and learning progress are being kept for 30 days after the trial ends.",
    "If you register/pay during this recovery period, Falowen can reactivate the same account and keep your progress.",
    purgeAt ? `If no qualifying payment is received by ${formatDate(purgeAt)}, the unpaid trial account becomes eligible for permanent deletion.` : "",
    "",
    "Open your Falowen account to register/pay:",
    ACCOUNT_URL,
    "",
    "Best regards,",
    "Learn Language Education Academy (Falowen)",
  ].filter((line) => line !== "").join("\n");
}

function rowForTrialAccessEmail({ student = {}, stage = "welcome", now = new Date() } = {}) {
  return {
    announcement: buildTrialAccessMessage({ student, stage }),
    class: studentClassName(student),
    date: isoDate(now),
    link: stageActionUrl(stage, student),
    topic: stageTopic(stage),
    email: studentEmail(student),
    attach_certificate: "FALSE",
    cert_level: studentLevel(student),
    delivery_mode: "individual",
    allow_bcc_fallback: "FALSE",
    email_type: `trial_access_${stage}`,
    trial_email_stage: stage,
    show_progress: "FALSE",
    show_review: "FALSE",
    show_app_button: "TRUE",
    show_class: "TRUE",
    show_date: "FALSE",
    button_label: stageButtonLabel(stage),
  };
}

async function postTrialAccessRow(config, row, fetchImpl = fetch) {
  if (!config.url) throw new Error("Trial access email webhook is not configured.");
  const response = await fetchImpl(config.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...(config.token ? { token: config.token } : {}),
      ...(config.sheetName ? { sheet_name: config.sheetName } : {}),
      ...(config.sheetGid ? { sheet_gid: config.sheetGid } : {}),
      rows: [row],
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body?.ok === false) {
    throw new Error(body?.error || body?.message || `Trial email webhook returned HTTP ${response.status}`);
  }
  return body;
}

function sendStateId(studentId, stage) {
  return crypto.createHash("sha256").update(`${text(studentId)}::${text(stage)}`).digest("hex");
}

async function reserveTrialEmail({ db, admin, studentId, student, stage, now = new Date() }) {
  const ref = db.collection("trialAccessEmailSends").doc(sendStateId(studentId, stage));
  let result = { reserved: false, ref, reason: "" };

  await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    const current = snap.exists ? snap.data() || {} : {};
    const status = lower(current.status);
    const processingStarted = asDate(current.processingStartedAt);
    const freshProcessing = status === "processing"
      && processingStarted
      && now.getTime() - processingStarted.getTime() < PROCESSING_STALE_MS;

    if (status === "sent") {
      result = { reserved: false, ref, reason: "already_sent" };
      return;
    }
    if (freshProcessing) {
      result = { reserved: false, ref, reason: "processing" };
      return;
    }

    transaction.set(ref, {
      studentId: text(studentId),
      studentEmail: studentEmail(student),
      stage,
      status: "processing",
      attemptCount: Number(current.attemptCount || 0) + 1,
      processingStartedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      ...(snap.exists ? {} : { createdAt: admin.firestore.FieldValue.serverTimestamp() }),
    }, { merge: true });
    result = { reserved: true, ref, reason: "" };
  });

  return result;
}

async function processTrialAccessEmail({
  db,
  admin,
  runtimeConfig = {},
  student = {},
  studentId = "",
  requestedStage = "",
  now = new Date(),
  fetchImpl = fetch,
} = {}) {
  const nowDate = asDate(now) || new Date();
  const stage = trialEmailStage(student, nowDate.getTime());
  if (!stage) return { sent: false, reason: "not_due" };
  if (requestedStage && requestedStage !== stage) {
    return { sent: false, reason: `stage_is_${stage}`, stage };
  }

  const reservation = await reserveTrialEmail({
    db,
    admin,
    studentId,
    student,
    stage,
    now: nowDate,
  });
  if (!reservation.reserved) return { sent: false, reason: reservation.reason, stage };

  const row = rowForTrialAccessEmail({ student, stage, now: nowDate });
  const config = resolveTrialEmailConfig(runtimeConfig);
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  try {
    const upstream = await postTrialAccessRow(config, row, fetchImpl);
    await reservation.ref.set({
      status: "sent",
      sentAt: timestamp,
      updatedAt: timestamp,
      lastError: "",
      upstreamCount: Number(upstream?.count || upstream?.sent || 1),
    }, { merge: true });
    return { sent: true, stage, email: row.email };
  } catch (error) {
    const message = error?.message || String(error);
    await reservation.ref.set({
      status: "failed",
      failedAt: timestamp,
      updatedAt: timestamp,
      lastError: message,
    }, { merge: true });
    return { sent: false, stage, reason: "delivery_failed", error: message };
  }
}

async function runTrialAccessEmailJob({
  db,
  admin,
  runtimeConfig = {},
  now = new Date(),
  fetchImpl = fetch,
} = {}) {
  const snapshot = await db.collection("students")
    .where("status", "in", ["pending", "trial_expired"])
    .get();

  const results = [];
  for (const docSnap of snapshot.docs) {
    const student = { id: docSnap.id, ...(docSnap.data() || {}) };
    const stage = trialEmailStage(student, (asDate(now) || new Date()).getTime());
    if (!stage) continue;
    results.push(await processTrialAccessEmail({
      db,
      admin,
      runtimeConfig,
      student,
      studentId: docSnap.id,
      requestedStage: stage,
      now,
      fetchImpl,
    }));
  }

  return {
    checked: snapshot.size,
    due: results.length,
    sent: results.filter((result) => result.sent).length,
    results,
  };
}

function createTrialAccessWelcomeEmailTrigger({
  db,
  admin,
  onDocumentCreated,
  runtimeConfig = {},
} = {}) {
  if (typeof onDocumentCreated !== "function") {
    throw new Error("Trial welcome Firestore trigger is unavailable.");
  }
  return onDocumentCreated({
    document: "students/{studentId}",
    retry: true,
  }, async (event) => {
    const student = event?.data?.data?.() || {};
    const studentId = text(event?.params?.studentId || event?.data?.id);
    const result = await processTrialAccessEmail({
      db,
      admin,
      runtimeConfig,
      student,
      studentId,
      requestedStage: "welcome",
      now: new Date(),
    });
    console.log("trial_access_welcome_email", result);
    return result;
  });
}

function createTrialAccessReminderEmailJob({
  db,
  admin,
  onSchedule,
  runtimeConfig = {},
} = {}) {
  if (typeof onSchedule !== "function") {
    throw new Error("Trial access scheduler is unavailable.");
  }
  return onSchedule({
    schedule: "15 * * * *",
    timeZone: TZ,
    retryCount: 1,
    memory: "256MiB",
  }, async () => {
    const result = await runTrialAccessEmailJob({ db, admin, runtimeConfig, now: new Date() });
    console.log("trial_access_email_job", {
      checked: result.checked,
      due: result.due,
      sent: result.sent,
    });
    return result;
  });
}

module.exports = {
  createTrialAccessWelcomeEmailTrigger,
  createTrialAccessReminderEmailJob,
  processTrialAccessEmail,
  runTrialAccessEmailJob,
  _test: {
    ACCOUNT_URL,
    CAMPUS_URL,
    DAY_MS,
    buildTrialAccessMessage,
    day1LessonUrl,
    formatDate,
    resolveTrialEmailConfig,
    rowForTrialAccessEmail,
    stageActionUrl,
    stageButtonLabel,
    stageTopic,
    studentLevel,
    trialEmailStage,
  },
};

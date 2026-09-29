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

function normalizedStatus(value) {
  return lower(value).replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

function studentStatus(student = {}) {
  return normalizedStatus(student.status || student.studentStatus || student.enrollmentStatus);
}

function studentTrialStatus(student = {}) {
  return normalizedStatus(student.trialStatus || student.trial_status);
}

const TRIAL_ELIGIBLE_STATUSES = new Set(["pending", "trial active", "active", "trial expired"]);
const EXPIRED_TRIAL_STATUSES = new Set(["expired", "trial expired"]);

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

function secretValue(secret) {
  if (!secret) return "";
  return text(typeof secret.value === "function" ? secret.value() : secret);
}

function resolveTrialEmailRuntimeConfig(runtimeConfig = {}, secrets = {}) {
  const config = resolveTrialEmailConfig(runtimeConfig);
  return {
    ...config,
    url: secretValue(secrets.webhookUrl) || config.url,
    token: secretValue(secrets.webhookToken) || config.token,
  };
}

function trialEmailEligibility(student = {}, now = Date.now()) {
  const role = studentRole(student);
  if (role && role !== "student") return { stage: "", reason: "not_student" };
  if (hasQualifyingPayment(student)) return { stage: "", reason: "has_payment" };
  if (!studentEmail(student)) return { stage: "", reason: "missing_email" };

  const status = studentStatus(student);
  const trialStatus = studentTrialStatus(student);
  if (["converted", "paid"].includes(trialStatus)) {
    return { stage: "", reason: "trial_converted", status, trialStatus };
  }

  let effectiveStatus = status;
  if (EXPIRED_TRIAL_STATUSES.has(trialStatus)) effectiveStatus = "trial expired";
  else if (!effectiveStatus && TRIAL_ELIGIBLE_STATUSES.has(trialStatus)) effectiveStatus = trialStatus;

  if (!TRIAL_ELIGIBLE_STATUSES.has(effectiveStatus)) {
    return {
      stage: "",
      reason: effectiveStatus ? `status_${effectiveStatus.replace(/\s+/g, "_")}` : "missing_status",
      status: effectiveStatus,
      trialStatus,
    };
  }

  const startedAt = pendingStartedAtMillis(student);
  if (!startedAt) {
    return { stage: "", reason: "missing_start_date", status: effectiveStatus, trialStatus };
  }
  if (startedAt > now) {
    return { stage: "", reason: "future_start_date", status: effectiveStatus, trialStatus };
  }

  const purgeAt = trialPurgeAtMillis(student);
  if (purgeAt && now >= purgeAt) {
    return { stage: "", reason: "purge_due", status: effectiveStatus, trialStatus };
  }

  const expiredAt = trialExpiredAtMillis(student) || (startedAt + TRIAL_DURATION_MS);
  if (effectiveStatus === "trial expired" || now >= expiredAt) {
    return { stage: "expired", reason: "due", status: effectiveStatus, trialStatus };
  }

  const elapsed = now - startedAt;
  if (elapsed >= 6 * DAY_MS) return { stage: "day6", reason: "due", status: effectiveStatus, trialStatus };
  if (elapsed >= 3 * DAY_MS) return { stage: "day3", reason: "due", status: effectiveStatus, trialStatus };
  return { stage: "welcome", reason: "due", status: effectiveStatus, trialStatus };
}

function trialEmailStage(student = {}, now = Date.now()) {
  return trialEmailEligibility(student, now).stage;
}

function shouldRecordTrialDiagnostic(student = {}) {
  const role = studentRole(student);
  if (role && role !== "student") return false;
  if (hasQualifyingPayment(student)) return false;
  const status = studentStatus(student);
  const trialStatus = studentTrialStatus(student);
  return TRIAL_ELIGIBLE_STATUSES.has(status)
    || TRIAL_ELIGIBLE_STATUSES.has(trialStatus)
    || EXPIRED_TRIAL_STATUSES.has(trialStatus);
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
    const lines = [
      `Hello ${name},`,
      "",
      "Your 7-day Falowen free trial is now active. You can start learning immediately even if you have not paid yet.",
    ];
    if (expiredAt) lines.push(`Your free access runs until ${formatDate(expiredAt)}.`);
    lines.push(
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
    );
    return lines.join("\n");
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

  const lines = [
    `Hello ${name},`,
    "",
    "Your 7-day Falowen free trial has ended, so learning access is now paused.",
    "Your account, scores and learning progress are being kept for 30 days after the trial ends.",
    "If you register/pay during this recovery period, Falowen can reactivate the same account and keep your progress.",
  ];
  if (purgeAt) {
    lines.push(`If no qualifying payment is received by ${formatDate(purgeAt)}, the unpaid trial account becomes eligible for permanent deletion.`);
  }
  lines.push(
    "",
    "Open your Falowen account to register/pay:",
    ACCOUNT_URL,
    "",
    "Best regards,",
    "Learn Language Education Academy (Falowen)",
  );
  return lines.join("\n");
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
      // Older Announcement deployments consume `row`; newer deployments
      // consume `rows`. Send both, as the established payment-email path does.
      row,
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
  webhookSecrets = {},
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
  const config = resolveTrialEmailRuntimeConfig(runtimeConfig, webhookSecrets);
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

async function writeTrialEmailDiagnostic({
  db,
  admin,
  studentId,
  student = {},
  eligibility = {},
  result = {},
} = {}) {
  if (!text(studentId) || !db?.collection) return false;
  try {
    await db.collection("trialAccessEmailDiagnostics").doc(text(studentId)).set({
      studentId: text(studentId),
      studentEmail: studentEmail(student),
      studentStatus: studentStatus(student),
      trialStatus: studentTrialStatus(student),
      dueStage: text(eligibility.stage || result.stage),
      reason: text(result.sent ? "sent" : (result.reason || eligibility.reason || "not_due")),
      deliveryError: text(result.error),
      lastCheckedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    return true;
  } catch (error) {
    console.warn("trial_access_email_diagnostic_write_failed", {
      studentId: text(studentId),
      message: error?.message || String(error),
    });
    return false;
  }
}

async function runTrialAccessEmailJob({
  db,
  admin,
  runtimeConfig = {},
  webhookSecrets = {},
  now = new Date(),
  fetchImpl = fetch,
} = {}) {
  // Scan all students so this scheduled worker can recover a missed Day-0
  // trigger. Eligibility remains strict: unpaid trial students only.
  const snapshot = await db.collection("students").get();
  const nowDate = asDate(now) || new Date();

  const results = [];
  const skipped = [];
  for (const docSnap of snapshot.docs) {
    const student = { id: docSnap.id, ...(docSnap.data() || {}) };
    const eligibility = trialEmailEligibility(student, nowDate.getTime());

    if (!eligibility.stage) {
      if (shouldRecordTrialDiagnostic(student)) {
        const skippedResult = {
          studentId: docSnap.id,
          email: studentEmail(student),
          sent: false,
          stage: "",
          reason: eligibility.reason,
        };
        skipped.push(skippedResult);
        await writeTrialEmailDiagnostic({
          db,
          admin,
          studentId: docSnap.id,
          student,
          eligibility,
          result: skippedResult,
        });
      }
      continue;
    }

    const result = await processTrialAccessEmail({
      db,
      admin,
      runtimeConfig,
      webhookSecrets,
      student,
      studentId: docSnap.id,
      requestedStage: eligibility.stage,
      now: nowDate,
      fetchImpl,
    });
    const enriched = { studentId: docSnap.id, ...result };
    results.push(enriched);

    await writeTrialEmailDiagnostic({
      db,
      admin,
      studentId: docSnap.id,
      student,
      eligibility,
      result,
    });
  }

  const skipReasons = skipped.reduce((counts, item) => {
    counts[item.reason] = (counts[item.reason] || 0) + 1;
    return counts;
  }, {});
  const resultReasons = results.reduce((counts, item) => {
    const reason = item.sent ? "sent" : (item.reason || "unknown");
    counts[reason] = (counts[reason] || 0) + 1;
    return counts;
  }, {});

  return {
    checked: snapshot.size,
    candidates: results.length + skipped.length,
    due: results.length,
    sent: results.filter((result) => result.sent).length,
    skipped: skipped.length,
    skipReasons,
    resultReasons,
    results,
  };
}

function createTrialAccessWelcomeEmailTrigger({
  db,
  admin,
  onDocumentWritten,
  runtimeConfig = {},
  webhookSecrets = {},
  fetchImpl = fetch,
} = {}) {
  if (typeof onDocumentWritten !== "function") {
    throw new Error("Trial welcome Firestore write trigger is unavailable.");
  }
  return onDocumentWritten({
    document: "students/{studentId}",
    retry: true,
    ...(webhookSecrets.webhookUrl && webhookSecrets.webhookToken
      ? { secrets: [webhookSecrets.webhookUrl, webhookSecrets.webhookToken] }
      : {}),
  }, async (event) => {
    const afterSnap = event?.data?.after;
    if (!afterSnap?.exists) return { sent: false, reason: "student_deleted" };

    const student = afterSnap.data?.() || {};
    const studentId = text(event?.params?.studentId || afterSnap.id);
    const result = await processTrialAccessEmail({
      db,
      admin,
      runtimeConfig,
      webhookSecrets,
      student,
      studentId,
      requestedStage: "welcome",
      now: new Date(),
      fetchImpl,
    });
    console.log("trial_access_welcome_email", result);

    if (!result.sent && result.reason === "delivery_failed") {
      throw new Error(result.error || "Trial welcome email delivery failed.");
    }

    return result;
  });
}

function createTrialAccessReminderEmailJob({
  db,
  admin,
  onSchedule,
  runtimeConfig = {},
  webhookSecrets = {},
} = {}) {
  if (typeof onSchedule !== "function") {
    throw new Error("Trial access scheduler is unavailable.");
  }
  return onSchedule({
    schedule: "15 * * * *",
    timeZone: TZ,
    retryCount: 1,
    memory: "256MiB",
    ...(webhookSecrets.webhookUrl && webhookSecrets.webhookToken
      ? { secrets: [webhookSecrets.webhookUrl, webhookSecrets.webhookToken] }
      : {}),
  }, async () => {
    const result = await runTrialAccessEmailJob({ db, admin, runtimeConfig, webhookSecrets, now: new Date() });
    console.log("trial_access_email_job", {
      checked: result.checked,
      candidates: result.candidates,
      due: result.due,
      sent: result.sent,
      skipped: result.skipped,
      skipReasons: result.skipReasons,
      resultReasons: result.resultReasons,
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
    resolveTrialEmailRuntimeConfig,
    rowForTrialAccessEmail,
    stageActionUrl,
    stageButtonLabel,
    stageTopic,
    studentLevel,
    trialEmailEligibility,
    trialEmailStage,
  },
};

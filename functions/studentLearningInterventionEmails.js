const crypto = require("crypto");

const TZ = "Africa/Accra";
const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_MAX_SENDS = 50;
const DEFAULT_CAMPUS_URL = "https://www.falowen.app/campus";
const DEFAULT_RESULTS_URL = "https://www.falowen.app/campus/results";
const DEFAULT_ATTENDANCE_URL = "https://www.falowen.app/campus/attendance";
const DEFAULT_EXAMS_URL = "https://www.falowen.app/exams/overview";

const RULES = Object.freeze({
  "needs-improvement": { priority: 100, cooldownDays: 7 },
  inactive: { priority: 80, cooldownDays: 7 },
  attendance: { priority: 60, cooldownDays: 14 },
  "a1-finish": { priority: 40, cooldownDays: 14 },
});

const BLOCKED_STATUSES = new Set([
  "inactive",
  "archived",
  "withdrawn",
  "removed",
  "cancelled",
  "canceled",
  "deleted",
  "blocked",
  "suspended",
  "trial_expired",
]);

const BLOCKED_PAYMENT_STATUSES = new Set(["overdue", "failed", "rejected"]);
const PENDING_REVIEW_STATUSES = new Set([
  "submitted",
  "resubmitted",
  "pending_review",
  "awaiting_review",
]);

function text(value) {
  return String(value == null ? "" : value).trim();
}

function lower(value) {
  return text(value).toLowerCase();
}

function asDate(value) {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  if (typeof value?.toMillis === "function") return new Date(value.toMillis());
  if (typeof value === "object" && Number.isFinite(Number(value.seconds))) {
    return new Date((Number(value.seconds) * 1000) + Math.round(Number(value.nanoseconds || 0) / 1000000));
  }
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toMillis(value) {
  return asDate(value)?.getTime() || 0;
}

function number(value) {
  if (value === null || value === undefined || text(value) === "") return null;
  const parsed = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function firstNumber(...values) {
  for (const value of values) {
    const parsed = number(value);
    if (parsed !== null) return parsed;
  }
  return null;
}

function firstText(...values) {
  return values.map(text).find(Boolean) || "";
}

function normalizeEmail(value) {
  return lower(value);
}

function studentStatus(student = {}) {
  return lower(student.status || student.studentStatus || student.enrollmentStatus);
}

function studentPaymentStatus(student = {}) {
  return lower(student.paymentStatus);
}

function studentRole(student = {}) {
  return lower(student.role);
}

function studentEmail(student = {}) {
  return normalizeEmail(student.email || student.emailAddress || student.studentEmail);
}

function studentName(student = {}) {
  return firstText(student.name, student.displayName, student.firstName) || "Student";
}

function studentClassName(student = {}) {
  return firstText(student.className, student.class, student.groupName, student.program, student.level);
}

function studentLevel(student = {}) {
  const direct = firstText(student.level, student.levelId).toUpperCase();
  if (/^(A1|A2|B1|B2|C1|C2)$/.test(direct)) return direct;
  const match = studentClassName(student).toUpperCase().match(/\b(A1|A2|B1|B2|C1|C2)\b/);
  return match?.[1] || "";
}

function lastLearningActivityMillis(student = {}) {
  return Math.max(
    toMillis(student.lastLearningActivityAt),
    toMillis(student.lastActivityAt),
    toMillis(student.lastProgressAt),
    toMillis(student.lastLessonActivityAt),
    toMillis(student.lastSubmissionAt),
    toMillis(student.lastSeenAt),
    toMillis(student.lastLoginAt),
  );
}

function studentIsEligible(student = {}) {
  const role = studentRole(student);
  if (role && role !== "student") return false;

  const status = studentStatus(student);
  if (BLOCKED_STATUSES.has(status)) return false;
  if (status === "pending" || status.includes("trial")) return false;

  const paymentStatus = studentPaymentStatus(student);
  if (BLOCKED_PAYMENT_STATUSES.has(paymentStatus)) return false;

  return Boolean(studentEmail(student));
}

function reviewStatus(student = {}) {
  return lower(
    student.latestReviewStatus
    || student.reviewStatus
    || student.markingStatus
    || student.latestSubmissionStatus
    || student.assignmentStatus,
  );
}

function absoluteFalowenUrl(value, fallback = DEFAULT_CAMPUS_URL) {
  const route = text(value);
  if (!route) return fallback;
  if (/^https?:\/\//i.test(route)) return route;
  return route.startsWith("/")
    ? `https://www.falowen.app${route}`
    : `https://www.falowen.app/${route}`;
}

function resolveAutomatedNudge(student = {}, now = new Date()) {
  if (!studentIsEligible(student)) return null;

  const nowMs = asDate(now)?.getTime() || Date.now();
  const status = reviewStatus(student);
  const awaitingReview = firstNumber(
    student.awaitingReview,
    student.awaitingReviewCount,
    student.pendingTutorReviews,
  ) || 0;
  const waitingForTutor = awaitingReview > 0 || PENDING_REVIEW_STATUSES.has(status);

  const latestScore = firstNumber(
    student.latestScore,
    student.latestResultScore,
    student.lastScore,
    student.score,
  );
  const needsImprovement = !waitingForTutor && (
    student.needsImprovement === true
    || ["failed", "needs_correction", "needs-improvement", "redo_required"].some((token) => status.includes(token))
    || (latestScore !== null && latestScore < 60)
  );

  const activityMs = lastLearningActivityMillis(student);
  const inactiveDays = activityMs
    ? Math.max(0, Math.floor((nowMs - activityMs) / DAY_MS))
    : null;

  const attendanceRate = firstNumber(
    student.attendanceRate,
    student.attendancePercent,
    student.attendancePercentage,
  );

  const completionPercent = firstNumber(
    student.completionPercent,
    student.courseCompletionPercent,
    student.progressPercent,
  );

  const level = studentLevel(student);
  const resumeRoute = firstText(student.lastRoute, student.resumeRoute, student.currentLessonRoute);
  const resumeUrl = absoluteFalowenUrl(resumeRoute, DEFAULT_CAMPUS_URL);

  const candidates = [];

  if (needsImprovement) {
    candidates.push({
      reason: "needs-improvement",
      priority: RULES["needs-improvement"].priority,
      cooldownDays: RULES["needs-improvement"].cooldownDays,
      actionUrl: resumeRoute ? absoluteFalowenUrl(resumeRoute) : DEFAULT_RESULTS_URL,
      buttonLabel: "Review & retry",
      topic: "Your Falowen work needs a correction",
      detail: latestScore !== null ? `Your latest score is ${Math.round(latestScore)}%.` : "",
      fingerprint: [
        status || "low-score",
        latestScore === null ? "" : String(Math.round(latestScore)),
        text(student.lastSubmissionAt || student.latestReviewUpdatedAt || student.updatedAt),
      ].join("::"),
    });
  }

  if (inactiveDays !== null && inactiveDays >= 4) {
    candidates.push({
      reason: "inactive",
      priority: RULES.inactive.priority,
      cooldownDays: RULES.inactive.cooldownDays,
      actionUrl: resumeUrl,
      buttonLabel: "Continue learning",
      topic: "Continue where you stopped in Falowen",
      detail: `It has been ${inactiveDays} day${inactiveDays === 1 ? "" : "s"} since your last recorded learning activity.`,
      fingerprint: String(activityMs),
      inactiveDays,
    });
  }

  if (attendanceRate !== null && attendanceRate < 70) {
    candidates.push({
      reason: "attendance",
      priority: RULES.attendance.priority,
      cooldownDays: RULES.attendance.cooldownDays,
      actionUrl: DEFAULT_ATTENDANCE_URL,
      buttonLabel: "View attendance",
      topic: "Review your recent class attendance",
      detail: `Your current attendance record is ${Math.round(attendanceRate)}%.`,
      fingerprint: String(Math.round(attendanceRate)),
    });
  }

  if (
    level === "A1"
    && completionPercent !== null
    && completionPercent >= 80
    && completionPercent < 100
  ) {
    candidates.push({
      reason: "a1-finish",
      priority: RULES["a1-finish"].priority,
      cooldownDays: RULES["a1-finish"].cooldownDays,
      actionUrl: DEFAULT_EXAMS_URL,
      buttonLabel: "Practise for A1",
      topic: "You are close to completing A1",
      detail: `Your A1 course completion is about ${Math.round(completionPercent)}%.`,
      fingerprint: String(Math.floor(completionPercent / 5) * 5),
    });
  }

  return candidates.sort((a, b) => b.priority - a.priority)[0] || null;
}

function stateDocId(studentId) {
  return crypto.createHash("sha256").update(text(studentId)).digest("hex");
}

function cooldownAllowsSend(state = {}, nudge = {}, now = new Date()) {
  if (!nudge?.reason) return false;
  const byReason = state.byReason && typeof state.byReason === "object" ? state.byReason : {};
  const previous = byReason[nudge.reason] || {};
  const lastSentMs = toMillis(previous.lastSentAt);
  if (!lastSentMs) return true;

  const cooldownMs = Math.max(1, Number(nudge.cooldownDays || 7)) * DAY_MS;
  const nowMs = asDate(now)?.getTime() || Date.now();
  return nowMs - lastSentMs >= cooldownMs;
}

function formatDate(value = new Date()) {
  const date = asDate(value) || new Date();
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function buildNudgeMessage({ student = {}, nudge = {} } = {}) {
  const name = studentName(student);
  const lines = [`Hello ${name},`, ""];

  if (nudge.reason === "needs-improvement") {
    lines.push(
      "Your latest Falowen work needs improvement.",
      nudge.detail || "Please review the tutor feedback and correct the important mistakes.",
      "",
      "Open the lesson, review the feedback, make your corrections and submit again:",
      nudge.actionUrl,
    );
  } else if (nudge.reason === "inactive") {
    lines.push(
      nudge.detail,
      "A short return is enough — continue from where you stopped and complete the next section.",
      "",
      "Continue learning:",
      nudge.actionUrl,
    );
  } else if (nudge.reason === "attendance") {
    lines.push(
      nudge.detail,
      "Please review any missed class work and check your attendance before the next live session.",
      "",
      "View your attendance:",
      nudge.actionUrl,
    );
  } else if (nudge.reason === "a1-finish") {
    lines.push(
      nudge.detail,
      "You are close to the end of A1. Keep finishing your Course Book work and add short A1 exam practice.",
      "",
      "Open your A1 practice:",
      nudge.actionUrl,
    );
  }

  lines.push(
    "",
    "You do not need to reply to this reminder if you have already continued.",
    "",
    "Best regards,",
    "Learn Language Education Academy (Falowen)",
  );
  return lines.join("\n");
}

function rowForNudge({ student = {}, nudge = {}, now = new Date() } = {}) {
  return {
    announcement: buildNudgeMessage({ student, nudge }),
    class: studentClassName(student),
    date: formatDate(now),
    link: nudge.actionUrl || DEFAULT_CAMPUS_URL,
    topic: nudge.topic || "Your Falowen learning reminder",
    email: studentEmail(student),
    attach_certificate: "FALSE",
    cert_level: studentLevel(student),
    delivery_mode: "individual",
    allow_bcc_fallback: "FALSE",
    email_type: `learning_nudge_${nudge.reason}`,
    learning_nudge_reason: nudge.reason,
    show_progress: "FALSE",
    show_review: "FALSE",
    show_app_button: "TRUE",
    show_class: "TRUE",
    show_date: "FALSE",
    button_label: nudge.buttonLabel || "Open Falowen",
  };
}

function resolveNudgeConfig(runtimeConfig = {}, env = process.env) {
  const communication = runtimeConfig.communication
    || runtimeConfig.announcements
    || runtimeConfig.announcement
    || {};
  const nudges = runtimeConfig.learning_nudges
    || runtimeConfig.learningNudges
    || runtimeConfig.student_learning_nudges
    || {};

  const enabledRaw = firstText(
    env.STUDENT_LEARNING_NUDGES_ENABLED,
    nudges.enabled,
    "true",
  ).toLowerCase();

  return {
    enabled: !["0", "false", "off", "disabled"].includes(enabledRaw),
    maxSends: Math.min(
      50,
      Math.max(1, Number(env.STUDENT_LEARNING_NUDGES_MAX_SENDS || nudges.max_sends || DEFAULT_MAX_SENDS)),
    ),
    webhook: {
      url: firstText(
        env.STUDENT_LEARNING_NUDGES_WEBHOOK_URL,
        env.ANNOUNCEMENT_WEBHOOK_URL,
        env.VITE_ANNOUNCEMENT_WEBHOOK_URL,
        nudges.webhook_url,
        communication.learning_nudges_webhook_url,
        communication.announcement_webhook_url,
        communication.webhook_url,
      ),
      token: firstText(
        env.STUDENT_LEARNING_NUDGES_WEBHOOK_TOKEN,
        env.ANNOUNCEMENT_WEBHOOK_TOKEN,
        env.VITE_ANNOUNCEMENT_WEBHOOK_TOKEN,
        nudges.webhook_token,
        communication.learning_nudges_webhook_token,
        communication.announcement_webhook_token,
        communication.webhook_token,
      ),
      sheetName: firstText(
        env.STUDENT_LEARNING_NUDGES_SHEET_NAME,
        env.ANNOUNCEMENT_WEBHOOK_SHEET_NAME,
        env.VITE_ANNOUNCEMENT_WEBHOOK_SHEET_NAME,
        nudges.sheet_name,
        communication.announcement_sheet_name,
        communication.sheet_name,
      ),
      sheetGid: firstText(
        env.STUDENT_LEARNING_NUDGES_SHEET_GID,
        env.ANNOUNCEMENT_WEBHOOK_SHEET_GID,
        env.VITE_ANNOUNCEMENT_WEBHOOK_SHEET_GID,
        nudges.sheet_gid,
        communication.announcement_sheet_gid,
        communication.sheet_gid,
      ),
    },
  };
}

async function postRows(config, rows, fetchImpl = fetch) {
  if (!config.url) {
    throw new Error("Student learning nudge webhook is not configured.");
  }
  const response = await fetchImpl(config.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...(config.token ? { token: config.token } : {}),
      ...(config.sheetName ? { sheet_name: config.sheetName } : {}),
      ...(config.sheetGid ? { sheet_gid: config.sheetGid } : {}),
      rows,
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body?.ok === false) {
    throw new Error(body?.error || body?.message || `Learning nudge webhook returned HTTP ${response.status}`);
  }
  return body;
}

function snapshotRows(snapshot) {
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() || {}) }));
}

async function readAllStudents({ admin, db, pageSize = 500 } = {}) {
  const collectionRef = db.collection("students");
  const documentIdField = admin?.firestore?.FieldPath?.documentId
    ? admin.firestore.FieldPath.documentId()
    : "__name__";

  const rows = [];
  let pages = 0;
  let cursor = null;

  while (true) {
    let query = collectionRef.orderBy(documentIdField);
    if (cursor) query = query.startAfter(cursor);
    query = query.limit(pageSize);

    const snapshot = await query.get();
    pages += 1;
    rows.push(...snapshotRows(snapshot));

    if (!snapshot.size || snapshot.size < pageSize) break;
    cursor = snapshot.docs[snapshot.docs.length - 1];
  }

  return { rows, pages };
}

async function selectDueCandidates({
  db,
  candidates = [],
  maxSends = DEFAULT_MAX_SENDS,
  now = new Date(),
  stateBatchSize = 50,
} = {}) {
  const due = [];
  let stateReads = 0;

  for (let offset = 0; offset < candidates.length && due.length < maxSends; offset += stateBatchSize) {
    const chunk = candidates.slice(offset, offset + stateBatchSize);
    const snapshots = await Promise.all(
      chunk.map(({ student }) =>
        db.collection("studentLearningInterventionStates")
          .doc(stateDocId(student.id))
          .get()),
    );
    stateReads += snapshots.length;

    for (let index = 0; index < chunk.length && due.length < maxSends; index += 1) {
      const snapshot = snapshots[index];
      const state = snapshot?.exists ? snapshot.data() || {} : {};
      if (cooldownAllowsSend(state, chunk[index].nudge, now)) {
        due.push(chunk[index]);
      }
    }
  }

  return { due, stateReads };
}

async function markSuccessfulSends({ admin, db, sends = [], now = new Date() }) {
  if (!sends.length) return 0;
  const batch = db.batch();
  const sentAt = admin.firestore.Timestamp.fromDate(asDate(now) || new Date());

  sends.forEach(({ student, nudge }) => {
    const studentId = text(student.id);
    const ref = db.collection("studentLearningInterventionStates").doc(stateDocId(studentId));
    batch.set(ref, {
      studentId,
      studentEmail: studentEmail(student),
      lastReason: nudge.reason,
      lastSentAt: sentAt,
      updatedAt: sentAt,
      byReason: {
        [nudge.reason]: {
          lastSentAt: sentAt,
          lastFingerprint: text(nudge.fingerprint),
        },
      },
    }, { merge: true });
  });

  await batch.commit();
  return sends.length;
}

async function runStudentLearningNudgeJob({
  admin,
  db,
  runtimeConfig = {},
  now = new Date(),
  fetchImpl = fetch,
} = {}) {
  const config = resolveNudgeConfig(runtimeConfig);
  if (!config.enabled) {
    return { enabled: false, checked: 0, eligible: 0, due: 0, sent: 0, writes: 0, results: [] };
  }

  const studentScan = await readAllStudents({ admin, db });
  const candidates = [];

  for (const student of studentScan.rows) {
    const nudge = resolveAutomatedNudge(student, now);
    if (!nudge) continue;
    candidates.push({ student, nudge });
  }

  candidates.sort((left, right) =>
    Number(right.nudge.priority || 0) - Number(left.nudge.priority || 0)
    || studentName(left.student).localeCompare(studentName(right.student)));

  const selected = await selectDueCandidates({
    db,
    candidates,
    maxSends: config.maxSends,
    now,
  });
  const due = selected.due;

  if (!due.length) {
    return {
      enabled: true,
      checked: studentScan.rows.length,
      studentPages: studentScan.pages,
      stateReads: selected.stateReads,
      eligible: candidates.length,
      due: 0,
      sent: 0,
      writes: 0,
      results: [],
    };
  }

  const rows = due.map(({ student, nudge }) => rowForNudge({ student, nudge, now }));
  const upstream = await postRows(config.webhook, rows, fetchImpl);
  const writes = await markSuccessfulSends({ admin, db, sends: due, now });

  return {
    enabled: true,
    checked: studentScan.rows.length,
    studentPages: studentScan.pages,
    stateReads: selected.stateReads,
    eligible: candidates.length,
    due: due.length,
    sent: rows.length,
    writes,
    upstreamCount: Number(upstream?.count || upstream?.sent || rows.length),
    results: due.map(({ student, nudge }) => ({
      studentId: text(student.id),
      email: studentEmail(student),
      reason: nudge.reason,
      actionUrl: nudge.actionUrl,
    })),
  };
}

function createStudentLearningNudgeJob({ admin, db, onSchedule, runtimeConfig = {} } = {}) {
  if (!admin?.firestore?.Timestamp?.fromDate || !db?.collection || typeof onSchedule !== "function") {
    throw new Error("Student learning nudge scheduler dependencies are incomplete.");
  }

  return onSchedule({
    schedule: "15 9 * * *",
    timeZone: TZ,
    retryCount: 0,
    memory: "256MiB",
  }, async () => {
    const result = await runStudentLearningNudgeJob({
      admin,
      db,
      runtimeConfig,
      now: new Date(),
    });
    console.log("student_learning_nudge_job_complete", {
      checked: result.checked,
      stateReads: result.stateReads || 0,
      due: result.due,
      sent: result.sent,
      writes: result.writes,
    });
    return result;
  });
}

module.exports = {
  createStudentLearningNudgeJob,
  runStudentLearningNudgeJob,
  _test: {
    DAY_MS,
    DEFAULT_MAX_SENDS,
    RULES,
    absoluteFalowenUrl,
    buildNudgeMessage,
    cooldownAllowsSend,
    lastLearningActivityMillis,
    resolveAutomatedNudge,
    resolveNudgeConfig,
    rowForNudge,
    stateDocId,
    studentIsEligible,
    readAllStudents,
    selectDueCandidates,
  },
};

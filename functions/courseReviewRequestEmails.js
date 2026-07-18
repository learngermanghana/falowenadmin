const crypto = require("crypto");

const TZ = "Africa/Accra";
const DEFAULT_DELAY_HOURS = 12;
const DEFAULT_LOOKBACK_DAYS = 30;
const PROCESSING_STALE_MS = 30 * 60 * 1000;
const FALLBACK_GOOGLE_REVIEW_URL = "https://www.google.com/maps/place/Learn+Language+Education+Academy+(Former+%22Learn+German+Ghana%22)/data=!4m2!3m1!1s0x0:0xbd2e1fb7eabd20da?sa=X&ved=1t:2428&ictx=111";
const BLOCKED_CLASS_STATUSES = new Set(["deleted", "cancelled", "canceled"]);
const BLOCKED_STUDENT_STATUSES = new Set([
  "inactive", "withdrawn", "removed", "cancelled", "canceled", "deleted", "blocked", "suspended",
]);
const FINAL_BLOCKED_STATUSES = new Set(["cancelled", "canceled", "deleted", "superseded"]);

function text(value) {
  return String(value || "").trim();
}

function comparable(value) {
  return text(value).toLowerCase().replace(/[\s_-]+/g, " ");
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

function isoDate(value, timezone = TZ) {
  const date = asDate(value);
  if (!date) return "";
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date).map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function sessionStart(session = {}) {
  return asDate(session.startsAt || session.startAt || session.startDateTime || session.date);
}

function sessionEnd(session = {}) {
  const explicit = asDate(session.endsAt || session.endAt || session.endDateTime);
  if (explicit) return explicit;
  const start = sessionStart(session);
  return start ? new Date(start.getTime() + 60 * 60 * 1000) : null;
}

function completionTime(session = {}) {
  return asDate(session.completedAt || session.autoCompletedAt || session.manualCompletedAt) || sessionEnd(session);
}

function sessionStatus(session = {}) {
  return comparable(session.status || session.sessionStatus || "scheduled");
}

function classStatus(klass = {}) {
  return comparable(klass.status || klass.state || klass.workflowStatus || "active");
}

function assignmentIds(session = {}) {
  return [...new Set([
    ...(Array.isArray(session.assignmentIds) ? session.assignmentIds : []),
    ...(Array.isArray(session.assignments) ? session.assignments : []),
    session.assignmentId,
    session.assignment_id,
  ].map(text).filter(Boolean))];
}

function classValues(klass = {}) {
  return [
    klass.id, klass.classId, klass.classRecordId, klass.name, klass.className, klass.group, klass.slug,
  ].map(comparable).filter(Boolean);
}

function sessionClassValues(session = {}) {
  return [
    session.classId, session.classRecordId, session.classDocumentId, session.className, session.class, session.group,
  ].map(comparable).filter(Boolean);
}

function studentClassValues(student = {}) {
  return [
    student.classId, student.classRecordId, student.assignedClassId, student.className, student.class,
    student.group, student.groupId, student.groupName, student.cohort, student.cohortId, student.cohortName,
  ].map(comparable).filter(Boolean);
}

function sessionBelongsToClass(session = {}, klass = {}) {
  const exactClassId = text(klass.id || klass.classId || klass.classRecordId);
  const exactSessionIds = [session.classId, session.classRecordId, session.classDocumentId].map(text).filter(Boolean);
  if (exactClassId && exactSessionIds.length) return exactSessionIds.includes(exactClassId);
  const values = new Set(classValues(klass));
  return sessionClassValues(session).some((value) => values.has(value));
}

function studentBelongsToClass(student = {}, klass = {}) {
  const exactClassId = text(klass.id || klass.classId || klass.classRecordId);
  const exactStudentIds = [student.classId, student.classRecordId, student.assignedClassId].map(text).filter(Boolean);
  if (exactClassId && exactStudentIds.length) return exactStudentIds.includes(exactClassId);
  const values = new Set(classValues(klass));
  return studentClassValues(student).some((value) => values.has(value));
}

function isActiveStudent(student = {}) {
  const role = comparable(student.role);
  if (role && role !== "student") return false;
  return !BLOCKED_STUDENT_STATUSES.has(comparable(
    student.status || student.studentStatus || student.enrollmentStatus || "active",
  ));
}

function curriculumIndex(session = {}) {
  const candidates = [session.curriculumIndex, session.officialSessionIndex, session.sessionIndex, session.dayIndex];
  for (const candidate of candidates) {
    const value = Number(candidate);
    if (Number.isFinite(value)) return value;
  }
  return null;
}

function sessionIdentity(session = {}) {
  const index = curriculumIndex(session);
  if (index !== null) return `index:${index}`;
  const assignments = assignmentIds(session);
  if (assignments.length) return `assignments:${assignments.map(comparable).sort().join("+")}`;
  return `id:${text(session.officialSessionId || session.canonicalSessionId || session.classSessionId || session.id)}`;
}

function sessionRevisionTime(session = {}) {
  return Math.max(
    ...[
      session.rescheduledAt, session.manualDateOverrideAt, session.updatedAt,
      session.completedAt, session.autoCompletedAt, session.createdAt,
    ].map(asDate).filter(Boolean).map((date) => date.getTime()),
    0,
  );
}

function preferredSessionScore(session = {}) {
  const status = sessionStatus(session);
  return (status === "completed" ? 1000000 : 0)
    + (!FINAL_BLOCKED_STATUSES.has(status) ? 500000 : 0)
    + (text(session.officialSessionId || session.canonicalSessionId) ? 100000 : 0)
    + (Number(session.sequence || 0) * 1000)
    + Math.floor(sessionRevisionTime(session) / 1000000000);
}

function dedupeOfficialSessions(sessions = []) {
  const preferred = new Map();
  sessions.forEach((session) => {
    if (!session || session.superseded === true || session.isSuperseded === true) return;
    const identity = sessionIdentity(session);
    const current = preferred.get(identity);
    if (!current || preferredSessionScore(session) > preferredSessionScore(current)) preferred.set(identity, session);
  });
  return [...preferred.values()];
}

function pickFinalOfficialSession(sessions = []) {
  const official = dedupeOfficialSessions(sessions);
  if (!official.length) return null;
  return official.sort((left, right) => {
    const leftIndex = curriculumIndex(left);
    const rightIndex = curriculumIndex(right);
    if (leftIndex !== null || rightIndex !== null) {
      if (leftIndex === null) return -1;
      if (rightIndex === null) return 1;
      if (leftIndex !== rightIndex) return leftIndex - rightIndex;
    }
    const leftStart = sessionStart(left)?.getTime() || 0;
    const rightStart = sessionStart(right)?.getTime() || 0;
    if (leftStart !== rightStart) return leftStart - rightStart;
    return preferredSessionScore(left) - preferredSessionScore(right);
  }).at(-1) || null;
}

function reviewRequestsEnabled(klass = {}, runtimeConfig = {}) {
  if (klass.courseReviewRequestEnabled === false || klass.googleReviewRequestEnabled === false) return false;
  const mode = comparable(klass.courseReviewRequestMode || klass.googleReviewRequestMode);
  if (["off", "disabled", "paused"].includes(mode)) return false;
  const reviews = runtimeConfig.reviews || runtimeConfig.google_reviews || {};
  if (reviews.enabled === false) return false;
  return true;
}

function resolveReviewUrl(klass = {}, runtimeConfig = {}, env = process.env) {
  const communication = runtimeConfig.communication || {};
  const reviews = runtimeConfig.reviews || runtimeConfig.google_reviews || {};
  return text(
    klass.googleReviewUrl
    || klass.courseReviewRequestUrl
    || klass.reviewUrl
    || env.GOOGLE_REVIEW_URL
    || env.COURSE_REVIEW_URL
    || reviews.google_review_url
    || reviews.review_url
    || communication.google_review_url
    || communication.course_review_url
    || FALLBACK_GOOGLE_REVIEW_URL,
  );
}

function resolveDelayHours(klass = {}, runtimeConfig = {}, env = process.env) {
  const reviews = runtimeConfig.reviews || runtimeConfig.google_reviews || {};
  const value = Number(
    klass.courseReviewRequestDelayHours
    ?? env.COURSE_REVIEW_DELAY_HOURS
    ?? reviews.delay_hours
    ?? DEFAULT_DELAY_HOURS,
  );
  return Number.isFinite(value) ? Math.max(0, Math.min(value, 168)) : DEFAULT_DELAY_HOURS;
}

function resolveLookbackDays(runtimeConfig = {}, env = process.env) {
  const reviews = runtimeConfig.reviews || runtimeConfig.google_reviews || {};
  const value = Number(env.COURSE_REVIEW_LOOKBACK_DAYS ?? reviews.lookback_days ?? DEFAULT_LOOKBACK_DAYS);
  return Number.isFinite(value) ? Math.max(1, Math.min(value, 365)) : DEFAULT_LOOKBACK_DAYS;
}

function reviewDueAt(session = {}, delayHours = DEFAULT_DELAY_HOURS) {
  const completed = completionTime(session);
  return completed ? new Date(completed.getTime() + Math.max(0, Number(delayHours) || 0) * 3600000) : null;
}

function findDueCourseReviewRequests({ classes = [], sessions = [], now = new Date(), runtimeConfig = {} } = {}) {
  const nowDate = asDate(now);
  if (!nowDate) return [];
  const oldestAllowed = nowDate.getTime() - resolveLookbackDays(runtimeConfig) * 86400000;
  const due = [];

  classes.forEach((klass) => {
    if (!reviewRequestsEnabled(klass, runtimeConfig) || BLOCKED_CLASS_STATUSES.has(classStatus(klass))) return;
    const classSessions = sessions.filter((session) => sessionBelongsToClass(session, klass));
    const finalSession = pickFinalOfficialSession(classSessions);
    if (!finalSession) return;
    const status = sessionStatus(finalSession);
    if (status !== "completed" || FINAL_BLOCKED_STATUSES.has(status)) return;
    const completed = completionTime(finalSession);
    if (!completed || completed.getTime() < oldestAllowed) return;
    const dueAt = reviewDueAt(finalSession, resolveDelayHours(klass, runtimeConfig));
    if (!dueAt || dueAt > nowDate) return;
    due.push({ klass, finalSession, dueAt, reviewUrl: resolveReviewUrl(klass, runtimeConfig) });
  });

  return due.sort((left, right) => left.dueAt - right.dueAt);
}

function resolveWebhookConfig(runtimeConfig = {}, env = process.env) {
  const communication = runtimeConfig.communication || runtimeConfig.announcements || runtimeConfig.announcement || {};
  const reviews = runtimeConfig.reviews || runtimeConfig.google_reviews || {};
  return {
    url: text(
      env.COURSE_REVIEW_WEBHOOK_URL
      || env.ANNOUNCEMENT_WEBHOOK_URL
      || env.VITE_ANNOUNCEMENT_WEBHOOK_URL
      || reviews.webhook_url
      || communication.course_review_webhook_url
      || communication.announcement_webhook_url
      || communication.webhook_url,
    ),
    token: text(
      env.COURSE_REVIEW_WEBHOOK_TOKEN
      || env.ANNOUNCEMENT_WEBHOOK_TOKEN
      || env.VITE_ANNOUNCEMENT_WEBHOOK_TOKEN
      || reviews.webhook_token
      || communication.course_review_webhook_token
      || communication.announcement_webhook_token
      || communication.webhook_token,
    ),
    sheetName: text(
      env.COURSE_REVIEW_SHEET_NAME
      || env.ANNOUNCEMENT_WEBHOOK_SHEET_NAME
      || env.VITE_ANNOUNCEMENT_WEBHOOK_SHEET_NAME
      || reviews.sheet_name
      || communication.course_review_sheet_name
      || communication.announcement_sheet_name
      || communication.sheet_name,
    ),
    sheetGid: text(
      env.COURSE_REVIEW_SHEET_GID
      || env.ANNOUNCEMENT_WEBHOOK_SHEET_GID
      || env.VITE_ANNOUNCEMENT_WEBHOOK_SHEET_GID
      || reviews.sheet_gid
      || communication.course_review_sheet_gid
      || communication.announcement_sheet_gid
      || communication.sheet_gid,
    ),
  };
}

function resolveClassWebhookConfig(klass = {}, fallback = {}) {
  const stored = klass.courseReviewEmailDelivery || klass.classReminderEmailDelivery || klass.attendanceConfirmationEmailDelivery || {};
  return {
    url: text(stored.url) || fallback.url || "",
    token: text(stored.token) || fallback.token || "",
    sheetName: text(stored.sheetName) || fallback.sheetName || "",
    sheetGid: text(stored.sheetGid) || fallback.sheetGid || "",
  };
}

function buildReviewMessage({ student = {}, klass = {}, reviewUrl = "" } = {}) {
  const name = text(student.name || student.displayName || student.firstName) || "Student";
  const className = text(klass.name || klass.className || klass.classId || klass.id) || "your German course";
  return [
    `Hello ${name},`,
    "",
    `Congratulations on completing ${className}.`,
    "",
    "Thank you for learning with Learn Language Education Academy and Falowen. Your honest feedback helps us improve our courses and helps other students find the right German-learning support.",
    "",
    "Please share your experience on Google:",
    reviewUrl,
    "",
    "Already left a review? Thank you — you can ignore this message.",
    "",
    "Best regards,",
    "Learn Language Education Academy (Falowen)",
  ].join("\n");
}

function rowForReviewRequest({ student = {}, klass = {}, finalSession = {}, reviewUrl = "", message = "" } = {}) {
  return {
    announcement: message,
    class: text(klass.name || klass.className || klass.classId || klass.id),
    date: isoDate(completionTime(finalSession), text(klass.timezone) || TZ),
    link: reviewUrl,
    topic: "Course completion review request",
    email: text(student.email),
    attach_certificate: "FALSE",
    cert_level: text(klass.levelId || klass.level),
    delivery_mode: "individual",
    allow_bcc_fallback: "FALSE",
    email_type: "course_review_request",
    show_progress: "FALSE",
    show_review: "TRUE",
    show_app_button: "FALSE",
    show_class: "TRUE",
    show_date: "FALSE",
    review_url: reviewUrl,
    button_label: "Leave an honest Google review",
  };
}

async function postRows(config, rows, fetchImpl = fetch) {
  if (!config.url) throw new Error("Configure communication.announcement_webhook_url or COURSE_REVIEW_WEBHOOK_URL for review request emails.");
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
    throw new Error(body?.error || body?.message || `Announcement webhook returned HTTP ${response.status}`);
  }
  return body;
}

function sendId({ klass = {}, student = {} } = {}) {
  return crypto.createHash("sha256").update([
    text(klass.id || klass.classId || klass.classRecordId),
    text(student.id || student.uid || student.studentCode || student.email),
    comparable(student.email),
  ].join("::")).digest("hex");
}

async function reserveStudentSend({ db, admin, klass, student, finalSession, reviewUrl, now }) {
  const id = sendId({ klass, student });
  const ref = db.collection("courseReviewRequestSends").doc(id);
  const classRef = db.collection("classes").doc(text(klass.id));
  const sessionRef = db.collection("classSessions").doc(text(finalSession.id));
  let reserved = false;

  await db.runTransaction(async (transaction) => {
    const [existingSnap, classSnap, sessionSnap] = await Promise.all([
      transaction.get(ref), transaction.get(classRef), transaction.get(sessionRef),
    ]);
    if (!classSnap.exists || !sessionSnap.exists) return;
    const currentClass = { id: classSnap.id, ...classSnap.data() };
    const currentSession = { id: sessionSnap.id, ...sessionSnap.data() };
    if (!reviewRequestsEnabled(currentClass) || BLOCKED_CLASS_STATUSES.has(classStatus(currentClass))) return;
    if (sessionStatus(currentSession) !== "completed" || FINAL_BLOCKED_STATUSES.has(sessionStatus(currentSession))) return;

    const existing = existingSnap.exists ? existingSnap.data() || {} : {};
    const updated = asDate(existing.updatedAt || existing.processingStartedAt);
    const processingFresh = comparable(existing.status) === "processing"
      && updated && now.getTime() - updated.getTime() < PROCESSING_STALE_MS;
    if (comparable(existing.status) === "sent" || processingFresh) return;

    reserved = true;
    const timestamp = admin.firestore.FieldValue.serverTimestamp();
    transaction.set(ref, {
      classId: text(currentClass.id),
      className: text(currentClass.name || currentClass.className || currentClass.classId),
      studentId: text(student.id || student.uid || student.studentCode),
      studentEmail: text(student.email),
      studentName: text(student.name || student.displayName),
      finalSessionId: text(currentSession.id),
      finalSessionCompletedAt: completionTime(currentSession)?.toISOString() || "",
      reviewUrl,
      status: "processing",
      attemptCount: Number(existing.attemptCount || 0) + 1,
      processingStartedAt: timestamp,
      updatedAt: timestamp,
      ...(existingSnap.exists ? {} : { createdAt: timestamp }),
    }, { merge: true });
  });
  return reserved ? ref : null;
}

async function markRefs(refs, patch) {
  await Promise.all(refs.map((ref) => ref.set(patch, { merge: true })));
}

async function processClassReviewRequest({ admin, db, item, students, config, runtimeConfig, now, fetchImpl }) {
  const { klass, finalSession, reviewUrl } = item;
  const recipients = students.filter((student) =>
    isActiveStudent(student) && studentBelongsToClass(student, klass) && text(student.email),
  );
  if (!recipients.length) return { sent: 0, skipped: "no_recipients" };

  const reserved = [];
  for (const student of recipients) {
    const ref = await reserveStudentSend({ db, admin, klass, student, finalSession, reviewUrl, now });
    if (ref) reserved.push({ ref, student });
  }
  if (!reserved.length) return { sent: 0, skipped: "already_sent" };

  const rows = reserved.map(({ student }) => {
    const message = buildReviewMessage({ student, klass, reviewUrl });
    return rowForReviewRequest({ student, klass, finalSession, reviewUrl, message });
  });
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  try {
    const upstream = await postRows(resolveClassWebhookConfig(klass, config), rows, fetchImpl);
    await markRefs(reserved.map((itemRef) => itemRef.ref), {
      status: "sent",
      sentAt: timestamp,
      updatedAt: timestamp,
      upstreamCount: Number(upstream?.count || upstream?.sent || rows.length),
      lastError: "",
    });
    await db.collection("classes").doc(klass.id).set({
      courseReviewRequestLastRunAt: timestamp,
      courseReviewRequestLastSentAt: timestamp,
      courseReviewRequestLastStatus: "sent",
      courseReviewRequestLastSentCount: rows.length,
      courseReviewRequestLastFinalSessionId: text(finalSession.id),
      courseReviewRequestLastError: "",
      courseReviewRequestUrl: resolveReviewUrl(klass, runtimeConfig),
    }, { merge: true });
    return { sent: rows.length, skipped: "" };
  } catch (error) {
    const message = error?.message || "Course review request delivery failed";
    await markRefs(reserved.map((itemRef) => itemRef.ref), {
      status: "failed",
      failedAt: timestamp,
      updatedAt: timestamp,
      lastError: message,
    });
    await db.collection("classes").doc(klass.id).set({
      courseReviewRequestLastRunAt: timestamp,
      courseReviewRequestLastStatus: "failed",
      courseReviewRequestLastError: message,
    }, { merge: true });
    throw error;
  }
}

async function runCourseReviewRequestEmailJob({
  admin, db, runtimeConfig = {}, now = new Date(), fetchImpl = fetch,
} = {}) {
  const [classSnap, sessionSnap, studentSnap] = await Promise.all([
    db.collection("classes").get(),
    db.collection("classSessions").get(),
    db.collection("students").get(),
  ]);
  const classes = classSnap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  const sessions = sessionSnap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  const students = studentSnap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  const due = findDueCourseReviewRequests({ classes, sessions, now, runtimeConfig });
  const config = resolveWebhookConfig(runtimeConfig);
  const nowDate = asDate(now) || new Date();
  const results = [];

  for (const item of due) {
    try {
      results.push({
        classId: text(item.klass.id),
        finalSessionId: text(item.finalSession.id),
        ok: true,
        ...await processClassReviewRequest({
          admin, db, item, students, config, runtimeConfig, now: nowDate, fetchImpl,
        }),
      });
    } catch (error) {
      console.error("course_review_request_failed", {
        classId: text(item.klass.id),
        finalSessionId: text(item.finalSession.id),
        message: error?.message || String(error),
      });
      results.push({
        classId: text(item.klass.id), finalSessionId: text(item.finalSession.id),
        ok: false, sent: 0, error: error?.message || String(error),
      });
    }
  }

  const sent = results.reduce((sum, result) => sum + Number(result.sent || 0), 0);
  console.log("course_review_request_job_complete", { dueClasses: due.length, sent });
  return { dueClasses: due.length, sent, results };
}

function createCourseReviewRequestEmailJob({ admin, db, onSchedule, runtimeConfig = {} }) {
  return onSchedule({
    schedule: "0 10 * * *",
    timeZone: TZ,
    retryCount: 1,
  }, async () => runCourseReviewRequestEmailJob({ admin, db, runtimeConfig }));
}

module.exports = {
  createCourseReviewRequestEmailJob,
  runCourseReviewRequestEmailJob,
  _test: {
    assignmentIds,
    buildReviewMessage,
    completionTime,
    dedupeOfficialSessions,
    findDueCourseReviewRequests,
    isActiveStudent,
    pickFinalOfficialSession,
    resolveDelayHours,
    resolveReviewUrl,
    resolveWebhookConfig,
    reviewDueAt,
    rowForReviewRequest,
    sessionBelongsToClass,
    studentBelongsToClass,
  },
};

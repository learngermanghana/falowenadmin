const crypto = require("crypto");

const TZ = "Africa/Accra";
const DEFAULT_LEADS = [30, 10];
const DEFAULT_GRACE_MIN = 7;
const PROCESSING_STALE_MS = 20 * 60 * 1000;
const BLOCKED_SESSION_STATUSES = new Set([
  "cancelled", "canceled", "completed", "superseded", "deleted",
]);
const BLOCKED_CLASS_STATUSES = new Set([
  "archived", "inactive", "deleted", "cancelled", "canceled",
]);

function text(value) {
  return String(value || "").trim();
}

function comparable(value) {
  return text(value).toLowerCase().replace(/\s+/g, " ");
}

function asDate(value) {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  if (typeof value?.toMillis === "function") return new Date(value.toMillis());
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function dateParts(value, timezone = TZ) {
  const date = asDate(value);
  if (!date) return null;
  return Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date).map((part) => [part.type, part.value]));
}

function isoDate(value, timezone = TZ) {
  const parts = dateParts(value, timezone);
  return parts ? `${parts.year}-${parts.month}-${parts.day}` : "";
}

function formatDate(value, timezone = TZ) {
  const date = asDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatTime(value, timezone = TZ) {
  const date = asDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function sessionStart(session = {}) {
  return asDate(session.startsAt || session.startAt || session.startDateTime || session.date);
}

function sessionStatus(session = {}) {
  return comparable(session.status || session.sessionStatus || "scheduled");
}

function isSuppressedSession(session = {}) {
  return BLOCKED_SESSION_STATUSES.has(sessionStatus(session))
    || session.remindersSuppressed === true
    || session.superseded === true
    || session.isSuperseded === true
    || session.schoolClosed === true
    || session.holidayClosed === true;
}

function assignmentIds(session = {}) {
  return [...new Set([
    ...(Array.isArray(session.assignmentIds) ? session.assignmentIds : []),
    ...(Array.isArray(session.assignments) ? session.assignments : []),
    session.assignmentId,
    session.assignment_id,
  ].map(text).filter(Boolean))];
}

function topicForSession(session = {}) {
  const topic = text(
    session.topic || session.title || session.sessionLabel || session.lesson || session.lessonTitle,
  ) || "Today’s German lesson";
  const missing = assignmentIds(session).filter(
    (assignment) => !comparable(topic).includes(comparable(assignment)),
  );
  return missing.length ? `${topic} (${missing.join(" + ")})` : topic;
}

function officialSessionId(session = {}) {
  return text(
    session.officialSessionId || session.classSessionId || session.canonicalSessionId || session.id,
  );
}

function preferredSessionScore(session = {}) {
  return (text(session.officialSessionId) ? 20 : 0)
    + (text(session.curriculumSource) ? 10 : 0)
    + (Number.isFinite(Number(session.curriculumIndex)) ? 8 : 0)
    + (assignmentIds(session).length ? 6 : 0)
    + (text(session.topic || session.title) ? 4 : 0);
}

function dedupeSessions(sessions = []) {
  const preferred = new Map();
  sessions.forEach((session) => {
    const start = sessionStart(session);
    const officialId = officialSessionId(session);
    if (!start || !officialId) return;
    const key = `${officialId}::${start.toISOString()}`;
    const current = preferred.get(key);
    if (!current || preferredSessionScore(session) > preferredSessionScore(current)) {
      preferred.set(key, session);
    }
  });
  return [...preferred.values()];
}

function normalizeLeads(value) {
  const raw = Array.isArray(value) ? value : text(value) ? text(value).split(",") : DEFAULT_LEADS;
  const leads = [...new Set(raw.map(Number)
    .filter((lead) => Number.isFinite(lead) && lead > 0 && lead <= 240)
    .map(Math.round))].sort((a, b) => b - a);
  return leads.length ? leads : [...DEFAULT_LEADS];
}

function findDueSessionReminders({
  sessions = [],
  now = new Date(),
  leadMinutes = DEFAULT_LEADS,
  graceMinutes = DEFAULT_GRACE_MIN,
} = {}) {
  const nowDate = asDate(now);
  if (!nowDate) return [];
  const leads = normalizeLeads(leadMinutes);
  const grace = Math.max(0, Number(graceMinutes) || 0);
  const due = [];

  dedupeSessions(sessions).forEach((session) => {
    if (isSuppressedSession(session)) return;
    const startsAt = sessionStart(session);
    if (!startsAt) return;
    const minutesUntilStart = (startsAt.getTime() - nowDate.getTime()) / 60000;
    if (minutesUntilStart <= 0) return;
    leads.forEach((leadMin) => {
      if (minutesUntilStart <= leadMin && minutesUntilStart >= leadMin - grace) {
        due.push({ session, startsAt, leadMin, reminderType: `${leadMin}min` });
      }
    });
  });

  return due.sort((a, b) => a.startsAt - b.startsAt || b.leadMin - a.leadMin);
}

function classValues(klass = {}) {
  return [
    klass.id, klass.classId, klass.classRecordId, klass.name,
    klass.className, klass.group, klass.slug,
  ].map(comparable).filter(Boolean);
}

function studentClassValues(student = {}) {
  return [
    student.classId, student.classRecordId, student.assignedClassId,
    student.className, student.class, student.group, student.groupId,
    student.groupName, student.cohort, student.cohortId, student.cohortName,
  ].map(comparable).filter(Boolean);
}

function studentBelongsToClass(student = {}, klass = {}) {
  const values = new Set(classValues(klass));
  return studentClassValues(student).some((value) => values.has(value));
}

function isActiveStudent(student = {}) {
  const role = comparable(student.role);
  if (role && role !== "student") return false;
  const status = comparable(student.status || student.studentStatus || student.enrollmentStatus);
  return ![
    "inactive", "archived", "withdrawn", "removed", "cancelled",
    "canceled", "deleted", "blocked", "suspended",
  ].includes(status);
}

function classContainsDate(klass = {}, startsAt) {
  const sessionDate = isoDate(startsAt, text(klass.timezone) || TZ);
  const start = text(klass.startDate);
  const end = text(klass.endDate || klass.graduationDate);
  return (!start || sessionDate >= start) && (!end || sessionDate <= end);
}

function resolveClassForSession(session = {}, classes = []) {
  const exactIds = [session.classRecordId, session.classId, session.classDocumentId]
    .map(text).filter(Boolean);
  for (const id of exactIds) {
    const exact = classes.find((klass) => text(klass.id) === id);
    if (exact) return exact;
  }

  const sessionValues = new Set([
    ...exactIds, session.className, session.class, session.group,
  ].map(comparable).filter(Boolean));
  const start = sessionStart(session);
  const matches = classes.filter((klass) => classValues(klass).some((value) => sessionValues.has(value)));
  return matches.sort((left, right) => {
    const score = (klass) => (classContainsDate(klass, start) ? 30 : 0)
      + (!BLOCKED_CLASS_STATUSES.has(comparable(klass.status)) ? 20 : 0)
      + (Number(klass.curriculumMappedSessionCount || 0) >= Number(klass.officialSessionCount || 1) ? 15 : 0)
      + (klass.officialTimetableRepairCompletedAt ? 10 : 0);
    return score(right) - score(left);
  })[0] || null;
}

function isHolidayClosed({ holiday = {}, klass = {}, session = {} } = {}) {
  if (holiday.schoolClosed === true || session.schoolClosed === true || session.holidayClosed === true) {
    return true;
  }
  const date = isoDate(sessionStart(session), text(klass.timezone) || TZ);
  return Array.isArray(klass.holidayDatesExcluded)
    && klass.holidayDatesExcluded.map(text).includes(date);
}

function resolveWebhookConfig(runtimeConfig = {}, env = process.env) {
  const communication = runtimeConfig.communication
    || runtimeConfig.announcements
    || runtimeConfig.announcement
    || {};
  return {
    url: text(
      env.CLASS_REMINDER_WEBHOOK_URL
      || env.ANNOUNCEMENT_WEBHOOK_URL
      || env.VITE_ANNOUNCEMENT_WEBHOOK_URL
      || communication.class_reminder_webhook_url
      || communication.announcement_webhook_url
      || communication.webhook_url,
    ),
    token: text(
      env.CLASS_REMINDER_WEBHOOK_TOKEN
      || env.ANNOUNCEMENT_WEBHOOK_TOKEN
      || env.VITE_ANNOUNCEMENT_WEBHOOK_TOKEN
      || communication.class_reminder_webhook_token
      || communication.announcement_webhook_token
      || communication.webhook_token,
    ),
    sheetName: text(
      env.CLASS_REMINDER_SHEET_NAME
      || env.ANNOUNCEMENT_WEBHOOK_SHEET_NAME
      || env.VITE_ANNOUNCEMENT_WEBHOOK_SHEET_NAME
      || communication.class_reminder_sheet_name
      || communication.announcement_sheet_name
      || communication.sheet_name,
    ),
    sheetGid: text(
      env.CLASS_REMINDER_SHEET_GID
      || env.ANNOUNCEMENT_WEBHOOK_SHEET_GID
      || env.VITE_ANNOUNCEMENT_WEBHOOK_SHEET_GID
      || communication.class_reminder_sheet_gid
      || communication.announcement_sheet_gid
      || communication.sheet_gid,
    ),
  };
}

function resolveClassWebhookConfig(klass = {}, fallback = {}) {
  const stored = klass.classReminderEmailDelivery || klass.attendanceConfirmationEmailDelivery || {};
  return {
    url: text(stored.url) || fallback.url || "",
    token: text(stored.token) || fallback.token || "",
    sheetName: text(stored.sheetName) || fallback.sheetName || "",
    sheetGid: text(stored.sheetGid) || fallback.sheetGid || "",
  };
}

function zoomDetails(klass = {}, profile = {}) {
  return {
    url: text(
      klass.zoomUrl || klass.zoomLink || klass.meetingUrl || klass.joinUrl
      || profile.joinUrl || profile.url || profile.zoomUrl,
    ),
    meetingId: text(
      klass.zoomMeetingId || klass.meetingId || profile.meetingId || profile.zoomMeetingId,
    ),
    passcode: text(
      klass.zoomPasscode || klass.passcode || profile.passcode || profile.zoomPasscode,
    ),
  };
}

function buildReminderMessage({ student, klass, session, leadMin, zoom = {} } = {}) {
  const timezone = text(klass.timezone) || TZ;
  const startsAt = sessionStart(session);
  const name = text(student.name || student.displayName) || "Student";
  const className = text(klass.name || klass.className || klass.classId || klass.id) || "your class";
  const assignments = assignmentIds(session);
  const lines = [
    `Hello ${name},`,
    "",
    `Your ${className} class starts in ${leadMin} minutes.`,
    "",
    `Topic: ${topicForSession(session)}`,
    ...(assignments.length ? [`Assignment${assignments.length === 1 ? "" : "s"}: ${assignments.join(" + ")}`] : []),
    `Date: ${formatDate(startsAt, timezone)}`,
    `Time: ${formatTime(startsAt, timezone)} Ghana time`,
  ];
  if (zoom.url || zoom.meetingId || zoom.passcode) {
    lines.push("", "Join the class:");
    if (zoom.url) lines.push(zoom.url);
    if (zoom.meetingId) lines.push(`Meeting ID: ${zoom.meetingId}`);
    if (zoom.passcode) lines.push(`Passcode: ${zoom.passcode}`);
  }
  lines.push("", "Please join 5 minutes early.", "", "Best regards,", "Learn Language Education Academy (Falowen)");
  return lines.join("\n");
}

function rowForReminder({ klass, student, session, leadMin, message } = {}) {
  return {
    announcement: message,
    class: text(klass.name || klass.className || klass.classId || klass.id),
    date: isoDate(sessionStart(session), text(klass.timezone) || TZ),
    link: "",
    topic: `Class reminder — ${topicForSession(session)}`,
    email: text(student.email),
    attach_certificate: "FALSE",
    cert_level: text(klass.levelId || klass.level),
    delivery_mode: "individual",
    allow_bcc_fallback: "FALSE",
    email_type: "class_reminder",
    reminder_lead_minutes: String(leadMin),
    show_progress: "FALSE",
    show_review: "FALSE",
    show_app_button: "FALSE",
    show_class: "TRUE",
    show_date: "TRUE",
  };
}

async function postRows(config, rows, fetchImpl = fetch) {
  if (!config.url) {
    throw new Error("Configure communication.announcement_webhook_url or CLASS_REMINDER_WEBHOOK_URL for class reminder emails.");
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
    throw new Error(body?.error || body?.message || `Announcement webhook returned HTTP ${response.status}`);
  }
  return body;
}

function sendId({ classId, session, leadMin }) {
  return crypto.createHash("sha256").update([
    text(classId), officialSessionId(session),
    sessionStart(session)?.toISOString() || "", `${leadMin}min`,
  ].join("::")).digest("hex");
}

async function reserveSend({ db, admin, klass, session, leadMin, now }) {
  const classId = text(klass.id || klass.classId || klass.classRecordId);
  const ref = db.collection("classReminderSends").doc(sendId({ classId, session, leadMin }));
  const sessionRef = db.collection("classSessions").doc(text(session.id));
  const expectedStart = sessionStart(session)?.toISOString() || "";
  let reserved = false;

  await db.runTransaction(async (transaction) => {
    const [sendSnap, currentSessionSnap] = await Promise.all([
      transaction.get(ref), transaction.get(sessionRef),
    ]);
    if (!currentSessionSnap.exists) return;
    const currentSession = { id: currentSessionSnap.id, ...currentSessionSnap.data() };
    if (sessionStart(currentSession)?.toISOString() !== expectedStart || isSuppressedSession(currentSession)) return;

    const existing = sendSnap.exists ? sendSnap.data() || {} : {};
    const updated = asDate(existing.updatedAt || existing.processingStartedAt);
    const processingFresh = comparable(existing.status) === "processing"
      && updated && now.getTime() - updated.getTime() < PROCESSING_STALE_MS;
    if (comparable(existing.status) === "sent" || processingFresh) return;

    reserved = true;
    transaction.set(ref, {
      classId,
      className: text(klass.name || klass.className || klass.classId),
      sessionId: text(session.id),
      officialSessionId: officialSessionId(session),
      sessionStartsAt: expectedStart,
      topic: topicForSession(session),
      assignmentIds: assignmentIds(session),
      leadMinutes: leadMin,
      reminderType: `${leadMin}min`,
      status: "processing",
      attemptCount: Number(existing.attemptCount || 0) + 1,
      processingStartedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      ...(sendSnap.exists ? {} : { createdAt: admin.firestore.FieldValue.serverTimestamp() }),
    }, { merge: true });
  });
  return reserved ? ref : null;
}

async function loadHoliday(db, klass, session) {
  const date = isoDate(sessionStart(session), text(klass.timezone) || TZ);
  if (!date) return {};
  const country = text(klass.holidayCalendarCountryCode || "GH").toUpperCase() || "GH";
  const snap = await db.collection("holidayCalendar").doc(`${country}_${date}`).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : {};
}

async function loadZoomProfile(db, klass) {
  const profileId = text(klass.zoomProfileId);
  if (!profileId) return {};
  const snap = await db.collection("zoomProfiles").doc(profileId).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : {};
}

function classReminderEnabled(klass = {}) {
  if (klass.classReminderEmailEnabled === false) return false;
  return !["off", "disabled"].includes(comparable(klass.classReminderEmailMode));
}

async function processReminder({ admin, db, due, classes, students, config, now, fetchImpl }) {
  const { session, leadMin } = due;
  const klass = resolveClassForSession(session, classes);
  if (!klass || BLOCKED_CLASS_STATUSES.has(comparable(klass.status)) || !classReminderEnabled(klass)) {
    return { sent: 0, skipped: "inactive_or_missing_class" };
  }

  const holiday = await loadHoliday(db, klass, session);
  if (isHolidayClosed({ holiday, klass, session })) {
    console.log("class_reminder_skipped_holiday", {
      classId: klass.id,
      sessionId: session.id,
      holiday: text(holiday.name || holiday.localName),
    });
    return { sent: 0, skipped: "holiday_closed" };
  }

  const recipients = students.filter((student) =>
    isActiveStudent(student) && studentBelongsToClass(student, klass) && text(student.email),
  );
  if (!recipients.length) return { sent: 0, skipped: "no_recipients" };

  const sendRef = await reserveSend({ db, admin, klass, session, leadMin, now });
  if (!sendRef) return { sent: 0, skipped: "already_sent_or_changed" };

  const profile = await loadZoomProfile(db, klass);
  const zoom = zoomDetails(klass, profile);
  const rows = recipients.map((student) => {
    const message = buildReminderMessage({ student, klass, session, leadMin, zoom });
    return rowForReminder({ klass, student, session, leadMin, message });
  });
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  try {
    const upstream = await postRows(resolveClassWebhookConfig(klass, config), rows, fetchImpl);
    await sendRef.set({
      status: "sent",
      sentAt: timestamp,
      updatedAt: timestamp,
      recipientCount: rows.length,
      upstreamCount: Number(upstream?.count || upstream?.sent || rows.length),
      lastError: "",
    }, { merge: true });
    await db.collection("classes").doc(klass.id).set({
      classReminderEmailLastRunAt: timestamp,
      classReminderEmailLastSentAt: timestamp,
      classReminderEmailLastStatus: "sent",
      classReminderEmailLastSentCount: rows.length,
      classReminderEmailLastSessionId: text(session.id),
      classReminderEmailLastTopic: topicForSession(session),
      classReminderEmailLastError: "",
    }, { merge: true });
    return { sent: rows.length, skipped: "" };
  } catch (error) {
    const message = error?.message || "Class reminder email delivery failed";
    await sendRef.set({ status: "failed", failedAt: timestamp, updatedAt: timestamp, lastError: message }, { merge: true });
    await db.collection("classes").doc(klass.id).set({
      classReminderEmailLastRunAt: timestamp,
      classReminderEmailLastStatus: "failed",
      classReminderEmailLastError: message,
    }, { merge: true });
    throw error;
  }
}

async function runClassSessionReminderEmailJob({
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
  const communication = runtimeConfig.communication || {};
  const due = findDueSessionReminders({
    sessions,
    now,
    leadMinutes: communication.class_reminder_leads_minutes
      || process.env.CLASS_REMINDER_LEADS_MINUTES
      || DEFAULT_LEADS,
    graceMinutes: communication.class_reminder_grace_minutes
      || process.env.CLASS_REMINDER_GRACE_MINUTES
      || DEFAULT_GRACE_MIN,
  });
  const config = resolveWebhookConfig(runtimeConfig);
  const nowDate = asDate(now) || new Date();
  const results = [];

  for (const item of due) {
    try {
      results.push({
        sessionId: text(item.session.id),
        leadMin: item.leadMin,
        ok: true,
        ...await processReminder({ admin, db, due: item, classes, students, config, now: nowDate, fetchImpl }),
      });
    } catch (error) {
      console.error("class_session_reminder_failed", {
        sessionId: text(item.session.id),
        leadMin: item.leadMin,
        message: error?.message || String(error),
      });
      results.push({
        sessionId: text(item.session.id), leadMin: item.leadMin,
        ok: false, sent: 0, error: error?.message || String(error),
      });
    }
  }

  const sent = results.reduce((sum, result) => sum + Number(result.sent || 0), 0);
  console.log("class_session_reminder_job_complete", { due: due.length, sent });
  return { due: due.length, sent, results };
}

function createClassSessionReminderEmailJob({ admin, db, onSchedule, runtimeConfig = {} }) {
  return onSchedule({
    schedule: "*/5 * * * *",
    timeZone: TZ,
    retryCount: 1,
  }, async () => runClassSessionReminderEmailJob({ admin, db, runtimeConfig }));
}

module.exports = {
  createClassSessionReminderEmailJob,
  runClassSessionReminderEmailJob,
  _test: {
    assignmentIds,
    buildReminderMessage,
    dedupeSessions,
    findDueSessionReminders,
    isHolidayClosed,
    isSuppressedSession,
    normalizeLeads,
    officialSessionId,
    resolveClassForSession,
    resolveClassWebhookConfig,
    resolveWebhookConfig,
    rowForReminder,
    studentBelongsToClass,
    topicForSession,
    zoomDetails,
  },
};

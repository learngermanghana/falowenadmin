const crypto = require("crypto");

const ACCRA_TIMEZONE = "Africa/Accra";
const MODE_OFF = "off";
const MODE_EACH_CLASS = "each_class";
const MODE_WEEKLY = "weekly";
const DEFAULT_DELAY_MINUTES = 30;
const DEFAULT_LATE_MINUTES = 15;
const DELIVERY_LOOKBACK_MS = 36 * 60 * 60 * 1000;
const PROCESSING_STALE_MS = 30 * 60 * 1000;

function normalize(value) {
  return String(value || "").trim();
}

function comparable(value) {
  return normalize(value).toLowerCase().replace(/\s+/g, " ");
}

function clampNumber(value, fallback, minimum, maximum) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(minimum, Math.min(maximum, Math.round(number)));
}

function asDate(value) {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  if (typeof value?.toMillis === "function") return new Date(value.toMillis());
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function dateParts(value, timezone = ACCRA_TIMEZONE) {
  const date = asDate(value);
  if (!date) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(date);
  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

function isoDateInTimezone(value, timezone = ACCRA_TIMEZONE) {
  const parts = dateParts(value, timezone);
  return parts ? `${parts.year}-${parts.month}-${parts.day}` : "";
}

function formatDate(value, timezone = ACCRA_TIMEZONE) {
  const date = asDate(value);
  if (!date) return "the scheduled class date";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value, timezone = ACCRA_TIMEZONE) {
  const date = asDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function weekKey(value, timezone = ACCRA_TIMEZONE) {
  const iso = isoDateInTimezone(value, timezone);
  if (!iso) return "";
  const date = new Date(`${iso}T00:00:00.000Z`);
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function modeForClass(klass = {}) {
  const stored = normalize(klass.attendanceConfirmationEmailMode).toLowerCase();
  const mode = [MODE_OFF, MODE_EACH_CLASS, MODE_WEEKLY].includes(stored) ? stored : MODE_WEEKLY;
  const enabled = klass.attendanceConfirmationEmailEnabled == null
    ? mode !== MODE_OFF
    : Boolean(klass.attendanceConfirmationEmailEnabled);
  return enabled ? mode : MODE_OFF;
}

function isActiveSession(session = {}) {
  const status = normalize(session.status || session.sessionStatus).toLowerCase();
  return !["cancelled", "canceled", "superseded", "deleted"].includes(status)
    && session.superseded !== true
    && session.isSuperseded !== true;
}

function sessionStart(session = {}) {
  return asDate(session.startsAt || session.startAt || session.date);
}

function sessionEnd(session = {}) {
  const explicit = asDate(session.endsAt || session.endAt);
  if (explicit) return explicit;
  const start = sessionStart(session);
  return start ? new Date(start.getTime() + 60 * 60 * 1000) : null;
}

function sessionLabel(session = {}) {
  const assignment = normalize(session.assignmentIds?.[0] || session.assignment_id || session.assignmentId);
  const topic = normalize(session.topic || session.title || session.sessionLabel || "Live class");
  return [assignment, topic].filter(Boolean).join(" — ") || "Live class";
}

function classIdentityValues(klass = {}) {
  return [klass.id, klass.classId, klass.classRecordId, klass.name, klass.className, klass.group, klass.slug]
    .map(comparable)
    .filter(Boolean);
}

function studentClassValues(student = {}) {
  return [
    student.classId,
    student.classRecordId,
    student.className,
    student.class,
    student.group,
    student.groupId,
    student.groupName,
    student.cohort,
    student.cohortId,
    student.cohortName,
  ].map(comparable).filter(Boolean);
}

function isActiveStudent(student = {}) {
  const role = comparable(student.role);
  if (role && role !== "student") return false;
  const status = comparable(student.status || student.studentStatus || student.enrollmentStatus);
  return !["inactive", "archived", "withdrawn", "removed", "cancelled", "canceled", "deleted", "blocked", "suspended"].includes(status);
}

function studentBelongsToClass(student = {}, klass = {}) {
  const classValues = new Set(classIdentityValues(klass));
  return studentClassValues(student).some((value) => classValues.has(value));
}

function studentIdentityValues(student = {}) {
  return [
    student.id,
    student.uid,
    student.studentCode,
    student.studentcode,
    student.email,
    student.name,
  ].map(comparable).filter(Boolean);
}

function studentDeliveryKey(student = {}) {
  return normalize(student.uid || student.studentCode || student.studentcode || student.id || student.email || student.name);
}

function findManualEntry(studentsMap = {}, student = {}) {
  const identities = new Set(studentIdentityValues(student));
  for (const [key, entryValue] of Object.entries(studentsMap || {})) {
    const entry = entryValue && typeof entryValue === "object" ? entryValue : { present: Boolean(entryValue) };
    const values = [key, entry.studentCode, entry.studentId, entry.uid, entry.email, entry.name]
      .map(comparable)
      .filter(Boolean);
    if (values.some((value) => identities.has(value))) return entry;
  }
  return null;
}

function findCheckin(checkins = [], student = {}) {
  const identities = new Set(studentIdentityValues(student));
  return checkins.find((checkin) => [
    checkin.id,
    checkin.uid,
    checkin.studentCode,
    checkin.studentcode,
    checkin.email,
    checkin.name,
  ].map(comparable).filter(Boolean).some((value) => identities.has(value))) || null;
}

function attendanceStatus({ session, attendance = {}, checkins = [], student, lateMinutes = DEFAULT_LATE_MINUTES }) {
  const checkin = findCheckin(checkins, student);
  const start = sessionStart(session);
  if (checkin) {
    const checkedAt = asDate(checkin.checkedInAt || checkin.submittedAt || checkin.createdAt || checkin.updatedAt);
    const late = Boolean(start && checkedAt && checkedAt.getTime() > start.getTime() + lateMinutes * 60000);
    return {
      status: late ? "late" : "present",
      method: normalize(checkin.method || "qr") || "qr",
      checkedAt,
    };
  }

  const manual = findManualEntry(attendance.students || {}, student);
  if (manual) {
    const explicit = comparable(manual.status || manual.attendanceStatus);
    if (explicit === "excused") return { status: "excused", method: "manual", checkedAt: null };
    if (explicit === "late") return { status: "late", method: "manual", checkedAt: null };
    if (manual.present === true || ["present", "attended"].includes(explicit)) {
      return { status: "present", method: "manual", checkedAt: null };
    }
  }

  return { status: "absent", method: "none", checkedAt: null };
}

function statusLabel(status) {
  return {
    present: "Present",
    late: "Late",
    absent: "Absent",
    excused: "Excused",
  }[status] || "Not recorded";
}

function attendanceRate(records = []) {
  const counted = records.filter((record) => ["present", "late", "absent"].includes(record.status));
  if (!counted.length) return 0;
  const attended = counted.filter((record) => ["present", "late"].includes(record.status)).length;
  return Math.round((attended / counted.length) * 100);
}

function buildEachClassMessage({ student, klass, record, replyNote = "", timezone = ACCRA_TIMEZONE }) {
  const name = normalize(student.name) || "student";
  const status = statusLabel(record.status);
  const checkinText = record.checkedAt ? ` Check-in time: ${formatDateTime(record.checkedAt, timezone)}.` : "";
  const methodText = record.method === "manual" ? " This attendance was confirmed manually by the tutor." : record.method === "qr" ? " This attendance came from your QR check-in." : "";
  const correction = normalize(replyNote) ? ` ${normalize(replyNote)}` : "";
  return `Hello ${name}, your attendance for ${normalize(klass.name || klass.className || klass.classId) || "your class"} — ${sessionLabel(record.session)} on ${formatDate(record.session.startsAt, timezone)} has been confirmed as ${status}.${checkinText}${methodText}${correction}`;
}

function buildWeeklyMessage({ student, klass, records, replyNote = "", timezone = ACCRA_TIMEZONE }) {
  const name = normalize(student.name) || "student";
  const counts = records.reduce((result, record) => {
    result[record.status] = (result[record.status] || 0) + 1;
    return result;
  }, {});
  const first = records[0]?.session?.startsAt;
  const last = records[records.length - 1]?.session?.startsAt;
  const lessons = records
    .map((record) => `${formatDate(record.session.startsAt, timezone)}: ${statusLabel(record.status)}`)
    .join("; ");
  const correction = normalize(replyNote) ? ` ${normalize(replyNote)}` : "";
  return `Hello ${name}, here is your attendance summary for ${normalize(klass.name || klass.className || klass.classId) || "your class"}, covering ${formatDate(first, timezone)} to ${formatDate(last, timezone)}. Present: ${counts.present || 0}; Late: ${counts.late || 0}; Excused: ${counts.excused || 0}; Absent: ${counts.absent || 0}. Attendance rate: ${attendanceRate(records)}%. Lessons: ${lessons}.${correction}`;
}

function deliveryId({ classId, mode, periodKey, studentKey }) {
  return crypto.createHash("sha256")
    .update([classId, mode, periodKey, studentKey].join("::"))
    .digest("hex");
}

function resolveWebhookConfig(runtimeConfig = {}, env = process.env) {
  const communication = runtimeConfig.communication || runtimeConfig.announcements || runtimeConfig.announcement || {};
  return {
    url: normalize(
      env.ATTENDANCE_CONFIRMATION_WEBHOOK_URL
      || env.ANNOUNCEMENT_WEBHOOK_URL
      || env.VITE_ANNOUNCEMENT_WEBHOOK_URL
      || communication.attendance_confirmation_webhook_url
      || communication.announcement_webhook_url
      || communication.webhook_url,
    ),
    token: normalize(
      env.ATTENDANCE_CONFIRMATION_WEBHOOK_TOKEN
      || env.ANNOUNCEMENT_WEBHOOK_TOKEN
      || env.VITE_ANNOUNCEMENT_WEBHOOK_TOKEN
      || communication.attendance_confirmation_webhook_token
      || communication.announcement_webhook_token
      || communication.webhook_token,
    ),
    sheetName: normalize(
      env.ATTENDANCE_CONFIRMATION_SHEET_NAME
      || env.ANNOUNCEMENT_WEBHOOK_SHEET_NAME
      || env.VITE_ANNOUNCEMENT_WEBHOOK_SHEET_NAME
      || communication.attendance_confirmation_sheet_name
      || communication.announcement_sheet_name
      || communication.sheet_name,
    ),
    sheetGid: normalize(
      env.ATTENDANCE_CONFIRMATION_SHEET_GID
      || env.ANNOUNCEMENT_WEBHOOK_SHEET_GID
      || env.VITE_ANNOUNCEMENT_WEBHOOK_SHEET_GID
      || communication.attendance_confirmation_sheet_gid
      || communication.announcement_sheet_gid
      || communication.sheet_gid,
    ),
  };
}

function rowForDelivery({ klass, student, mode, message, date, periodKey }) {
  return {
    announcement: message,
    class: normalize(klass.name || klass.className || klass.classId || klass.id),
    date,
    link: "",
    topic: mode === MODE_WEEKLY ? `Weekly Attendance Summary — ${periodKey}` : "Attendance Confirmed",
    email: normalize(student.email),
    attach_certificate: "FALSE",
    cert_level: normalize(klass.levelId || klass.level),
    delivery_mode: "individual",
    allow_bcc_fallback: "FALSE",
  };
}

async function postAnnouncementRows(config, rows, fetchImpl = fetch) {
  if (!config.url) throw new Error("Announcement webhook is not configured for the Firebase attendance email job.");
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

async function reserveDelivery({ db, admin, id, payload, now }) {
  const ref = db.collection("attendanceEmailDeliveries").doc(id);
  let reserved = false;
  await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    const existing = snap.exists ? snap.data() || {} : {};
    const existingUpdated = asDate(existing.updatedAt || existing.processingStartedAt);
    const processingFresh = existing.status === "processing"
      && existingUpdated
      && now.getTime() - existingUpdated.getTime() < PROCESSING_STALE_MS;
    if (existing.status === "sent" || processingFresh) return;
    reserved = true;
    transaction.set(ref, {
      ...payload,
      status: "processing",
      attemptCount: Number(existing.attemptCount || 0) + 1,
      processingStartedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      ...(snap.exists ? {} : { createdAt: admin.firestore.FieldValue.serverTimestamp() }),
    }, { merge: true });
  });
  return reserved ? ref : null;
}

async function loadSessionsForClass(db, klass) {
  const identifiers = [...new Set([klass.id, klass.classId, klass.classRecordId, klass.name, klass.className].map(normalize).filter(Boolean))];
  const result = new Map();
  for (const identifier of identifiers) {
    const snap = await db.collection("classSessions").where("classId", "==", identifier).get();
    snap.docs.forEach((docSnap) => result.set(docSnap.id, { id: docSnap.id, ...docSnap.data() }));
  }
  return [...result.values()].filter(isActiveSession).sort((a, b) => (sessionStart(a)?.getTime() || 0) - (sessionStart(b)?.getTime() || 0));
}

async function loadAttendanceForSession(db, klass, session) {
  const parentIds = [...new Set([klass.id, klass.classId, klass.classRecordId, klass.name, klass.className].map(normalize).filter(Boolean))];
  let attendance = {};
  let attendanceRef = null;
  for (const parentId of parentIds) {
    const ref = db.collection("attendance").doc(parentId).collection("sessions").doc(session.id);
    const snap = await ref.get();
    if (snap.exists) {
      attendance = snap.data() || {};
      attendanceRef = ref;
      break;
    }
  }
  if (!attendanceRef) {
    attendanceRef = db.collection("attendance").doc(normalize(klass.id || klass.classId || klass.name)).collection("sessions").doc(session.id);
  }
  const checkinSnap = await attendanceRef.collection("checkins").get();
  return {
    attendance,
    checkins: checkinSnap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })),
  };
}

function dueAfter({ session, attendance, delayMinutes }) {
  const end = sessionEnd(session);
  if (!end) return null;
  const delayed = new Date(end.getTime() + delayMinutes * 60000);
  const openTo = asDate(attendance.openTo);
  return openTo && openTo > delayed ? openTo : delayed;
}

function groupDueSessions({ sessions, mode, now, timezone }) {
  if (mode === MODE_EACH_CLASS) {
    return sessions
      .filter((session) => {
        const end = sessionEnd(session);
        return end && end <= now && now.getTime() - end.getTime() <= DELIVERY_LOOKBACK_MS;
      })
      .map((session) => ({ periodKey: session.id, sessions: [session] }));
  }

  const groups = new Map();
  sessions.forEach((session) => {
    const key = weekKey(sessionStart(session), timezone);
    if (!key) return;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(session);
  });
  return [...groups.entries()]
    .map(([periodKey, groupSessions]) => ({
      periodKey,
      sessions: groupSessions.sort((a, b) => (sessionStart(a)?.getTime() || 0) - (sessionStart(b)?.getTime() || 0)),
    }))
    .filter((group) => {
      const finalEnd = sessionEnd(group.sessions[group.sessions.length - 1]);
      return finalEnd && finalEnd <= now && now.getTime() - finalEnd.getTime() <= DELIVERY_LOOKBACK_MS;
    });
}

async function markDeliveryRefs(refs, patch) {
  await Promise.all(refs.map((ref) => ref.set(patch, { merge: true })));
}

async function processClass({ admin, db, klass, allStudents, config, now, fetchImpl }) {
  const mode = modeForClass(klass);
  const classRef = db.collection("classes").doc(klass.id);
  const timestamp = admin.firestore.FieldValue.serverTimestamp();
  if (mode === MODE_OFF) return { sent: 0, skipped: true };

  const timezone = normalize(klass.timezone) || ACCRA_TIMEZONE;
  const delayMinutes = clampNumber(klass.attendanceConfirmationEmailDelayMinutes, DEFAULT_DELAY_MINUTES, 0, 360);
  const lateMinutes = clampNumber(klass.attendanceConfirmationLateMinutes, DEFAULT_LATE_MINUTES, 0, 120);
  const replyNote = normalize(klass.attendanceConfirmationEmailReplyNote);
  const sessions = await loadSessionsForClass(db, klass);
  const groups = groupDueSessions({ sessions, mode, now, timezone });
  const students = allStudents.filter((student) => isActiveStudent(student) && studentBelongsToClass(student, klass) && normalize(student.email));

  await classRef.set({
    attendanceConfirmationEmailLastRunAt: timestamp,
    attendanceConfirmationEmailLastStatus: groups.length ? "checking_due_deliveries" : "no_delivery_due",
    attendanceConfirmationEmailLastError: "",
  }, { merge: true });

  let totalSent = 0;
  for (const group of groups) {
    const sessionData = [];
    let groupDueAt = null;
    for (const session of group.sessions) {
      const data = await loadAttendanceForSession(db, klass, session);
      const dueAt = dueAfter({ session, attendance: data.attendance, delayMinutes });
      if (!dueAt || dueAt > now) {
        groupDueAt = null;
        break;
      }
      groupDueAt = !groupDueAt || dueAt > groupDueAt ? dueAt : groupDueAt;
      sessionData.push({ session, ...data });
    }
    if (!groupDueAt || !sessionData.length) continue;

    const rows = [];
    const deliveryRefs = [];
    for (const student of students) {
      const studentKey = studentDeliveryKey(student);
      if (!studentKey) continue;
      const records = sessionData.map(({ session, attendance, checkins }) => ({
        session,
        ...attendanceStatus({ session, attendance, checkins, student, lateMinutes }),
      }));
      const message = mode === MODE_WEEKLY
        ? buildWeeklyMessage({ student, klass, records, replyNote, timezone })
        : buildEachClassMessage({ student, klass, record: records[0], replyNote, timezone });
      const id = deliveryId({ classId: klass.id, mode, periodKey: group.periodKey, studentKey });
      const ref = await reserveDelivery({
        db,
        admin,
        id,
        now,
        payload: {
          classId: klass.id,
          className: normalize(klass.name || klass.className || klass.classId),
          mode,
          periodKey: group.periodKey,
          sessionIds: group.sessions.map((session) => session.id),
          studentKey,
          studentName: normalize(student.name),
          studentEmail: normalize(student.email),
          dueAt: groupDueAt.toISOString(),
          message,
        },
      });
      if (!ref) continue;
      deliveryRefs.push(ref);
      rows.push(rowForDelivery({
        klass,
        student,
        mode,
        message,
        date: isoDateInTimezone(groupDueAt, timezone),
        periodKey: group.periodKey,
      }));
    }

    if (!rows.length) continue;
    try {
      const upstream = await postAnnouncementRows(config, rows, fetchImpl);
      await markDeliveryRefs(deliveryRefs, {
        status: "sent",
        sentAt: timestamp,
        updatedAt: timestamp,
        upstreamCount: Number(upstream?.count || upstream?.sent || rows.length),
        lastError: "",
      });
      totalSent += rows.length;
    } catch (error) {
      await markDeliveryRefs(deliveryRefs, {
        status: "failed",
        lastError: error?.message || "Attendance email delivery failed",
        failedAt: timestamp,
        updatedAt: timestamp,
      });
      throw error;
    }
  }

  await classRef.set({
    attendanceConfirmationEmailLastRunAt: timestamp,
    attendanceConfirmationEmailLastStatus: totalSent ? "sent" : "no_new_recipients",
    attendanceConfirmationEmailLastSentCount: totalSent,
    ...(totalSent ? { attendanceConfirmationEmailLastSentAt: timestamp } : {}),
    attendanceConfirmationEmailLastError: "",
  }, { merge: true });
  return { sent: totalSent, skipped: false };
}

async function runAttendanceConfirmationEmailJob({ admin, db, runtimeConfig = {}, now = new Date(), fetchImpl = fetch }) {
  const config = resolveWebhookConfig(runtimeConfig);
  const classSnap = await db.collection("classes").get();
  const studentSnap = await db.collection("students").get();
  const allStudents = studentSnap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  const results = [];

  for (const classDoc of classSnap.docs) {
    const klass = { id: classDoc.id, ...classDoc.data() };
    if (modeForClass(klass) === MODE_OFF) continue;
    try {
      if (!config.url) throw new Error("Set communication.announcement_webhook_url in FALOWEN_ADMIN_CLOUD_RUNTIME_CONFIG or ANNOUNCEMENT_WEBHOOK_URL for automatic attendance emails.");
      const result = await processClass({ admin, db, klass, allStudents, config, now, fetchImpl });
      results.push({ classId: klass.id, ok: true, ...result });
    } catch (error) {
      await classDoc.ref.set({
        attendanceConfirmationEmailLastRunAt: admin.firestore.FieldValue.serverTimestamp(),
        attendanceConfirmationEmailLastStatus: "failed",
        attendanceConfirmationEmailLastError: error?.message || "Attendance confirmation email job failed",
      }, { merge: true });
      console.error("attendance_confirmation_email_failed", { classId: klass.id, message: error?.message || String(error) });
      results.push({ classId: klass.id, ok: false, error: error?.message || String(error) });
    }
  }

  const sent = results.reduce((sum, result) => sum + Number(result.sent || 0), 0);
  console.log("attendance_confirmation_email_job_complete", { classes: results.length, sent });
  return { results, sent };
}

function createAttendanceConfirmationEmailJob({ admin, db, onSchedule, runtimeConfig = {} }) {
  return onSchedule({
    schedule: "*/15 * * * *",
    timeZone: ACCRA_TIMEZONE,
    retryCount: 1,
  }, async () => runAttendanceConfirmationEmailJob({ admin, db, runtimeConfig }));
}

module.exports = {
  createAttendanceConfirmationEmailJob,
  runAttendanceConfirmationEmailJob,
  _test: {
    MODE_OFF,
    MODE_EACH_CLASS,
    MODE_WEEKLY,
    attendanceRate,
    attendanceStatus,
    buildEachClassMessage,
    buildWeeklyMessage,
    deliveryId,
    groupDueSessions,
    modeForClass,
    resolveWebhookConfig,
    studentBelongsToClass,
    weekKey,
  },
};

const ACCRA_TIMEZONE = "Africa/Accra";
const MAX_RETRY_BATCH = 200;
const RETRY_CONCURRENCY = 5;
const STALE_PROCESSING_MS = 15 * 60 * 1000;

function normalize(value) {
  return String(value || "").trim();
}

function asDate(value) {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  if (typeof value?.toMillis === "function") return new Date(value.toMillis());
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function studentEnrollmentStart(student = {}) {
  const classSpecific = [
    student.classJoinedAt,
    student.classAssignedAt,
    student.classEnrollmentAt,
    student.classEnrollmentDate,
    student.classStartDate,
  ].map(asDate).filter(Boolean);
  const general = [
    student.trialStartedAt,
    student.enrollDate,
    student.enrollmentDate,
    student.registrationDate,
    student.contractStart,
    student.contractStartDate,
  ].map(asDate).filter(Boolean);
  const candidates = classSpecific.length ? classSpecific : general;
  if (!candidates.length) return null;
  return [...candidates].sort((left, right) => left.getTime() - right.getTime())[0];
}

async function resolveDeliverySessionStarts(delivery = {}, db = null) {
  const starts = [];
  const unresolvedIds = new Set();
  const lessons = delivery?.deliveryPayload?.attendance?.lessons;
  if (Array.isArray(lessons)) {
    for (const lesson of lessons) {
      const inlineStart = asDate(
        lesson?.startsAt || lesson?.startAt || lesson?.sessionStartsAt || lesson?.startedAt,
      );
      if (inlineStart) {
        starts.push(inlineStart);
        continue;
      }
      const sessionId = normalize(lesson?.sessionId || lesson?.classSessionId);
      if (sessionId) unresolvedIds.add(sessionId);
    }
  }

  for (const sessionId of Array.isArray(delivery?.sessionIds) ? delivery.sessionIds : []) {
    const normalized = normalize(sessionId);
    if (normalized) unresolvedIds.add(normalized);
  }

  if (db) {
    for (const sessionId of unresolvedIds) {
      const snap = await db.collection("classSessions").doc(sessionId).get();
      if (!snap.exists) continue;
      const session = snap.data() || {};
      const resolvedStart = asDate(session.startsAt || session.startAt || session.date);
      if (resolvedStart) starts.push(resolvedStart);
    }
  }

  return starts;
}

async function deliveryPredatesEnrollment(delivery = {}, student = {}, db = null) {
  const enrollmentAt = studentEnrollmentStart(student);
  if (!enrollmentAt) return false;

  const sessionStarts = await resolveDeliverySessionStarts(delivery, db);
  if (sessionStarts.length) {
    return sessionStarts.some((sessionAt) => sessionAt.getTime() < enrollmentAt.getTime());
  }

  // Legacy fallback: only cancel when the stored calendar date is strictly
  // earlier. Same-day records need an exact timestamp and are never guessed.
  const enrollmentDate = enrollmentAt.toISOString().slice(0, 10);
  const lessons = delivery?.deliveryPayload?.attendance?.lessons;
  if (!Array.isArray(lessons) || !lessons.length) return false;
  return lessons.some((lesson) => {
    const lessonDate = normalize(lesson?.date);
    return /^\d{4}-\d{2}-\d{2}$/.test(lessonDate) && lessonDate < enrollmentDate;
  });
}

function retryCandidateStatus(data = {}, now = new Date()) {
  const status = normalize(data.status).toLowerCase();
  if (status === "failed") return true;
  if (status !== "processing") return false;
  const updated = asDate(data.updatedAt || data.retryStartedAt || data.processingStartedAt);
  return !updated || now.getTime() - updated.getTime() >= STALE_PROCESSING_MS;
}

async function findStudentForDelivery(db, delivery = {}) {
  const studentKey = normalize(delivery.studentKey);
  if (studentKey) {
    const direct = await db.collection("students").doc(studentKey).get();
    if (direct.exists) return { id: direct.id, ...direct.data() };
  }

  const probes = [
    ["uid", studentKey],
    ["studentCode", studentKey],
    ["studentcode", studentKey],
    ["emailNormalized", normalize(delivery.studentEmail).toLowerCase()],
    ["email", normalize(delivery.studentEmail)],
  ];
  for (const [field, value] of probes) {
    if (!value) continue;
    const snap = await db.collection("students").where(field, "==", value).limit(1).get();
    if (!snap.empty) return { id: snap.docs[0].id, ...snap.docs[0].data() };
  }
  return null;
}

function isoDateInTimezone(value, timezone = ACCRA_TIMEZONE) {
  const date = asDate(value);
  if (!date) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
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

function resolveClassWebhookConfig(klass = {}, fallback = {}) {
  const stored = klass.attendanceConfirmationEmailDelivery || {};
  return {
    url: normalize(stored.url) || fallback.url || "",
    token: normalize(stored.token) || fallback.token || "",
    sheetName: normalize(stored.sheetName) || fallback.sheetName || "",
    sheetGid: normalize(stored.sheetGid) || fallback.sheetGid || "",
  };
}

function retrySafeCombinedMessage(message = "") {
  return normalize(message)
    .replace(/attendance summary/gi, "attendance and participation summary")
    .replace(/attendance report/gi, "attendance and participation report")
    .replace(/\. Present:/, ".\n\nAttendance\nPresent:")
    .replace(/\. Attendance rate:/, ".\nAttendance rate:")
    .replace(/\. Lessons:/, ".\n\nLesson record\n")
    .replace(/\. Class participation this week:/, ".\n\nClass participation this week:")
    .replace(/\. Class participation:/, ".\n\nClass participation:")
    .replace(/ How attendance works:/, "\n\nHow attendance works:");
}

function rowForRetry(delivery = {}, klass = {}) {
  const mode = normalize(delivery.mode).toLowerCase();
  const periodKey = normalize(delivery.periodKey);
  const timezone = normalize(klass.timezone) || ACCRA_TIMEZONE;
  const payload = delivery.deliveryPayload && typeof delivery.deliveryPayload === "object"
    ? delivery.deliveryPayload
    : null;
  const participation = payload?.participation || null;
  const hasParticipation = Boolean(participation);
  const subject = mode === "weekly"
    ? (hasParticipation
      ? `Weekly Attendance & Participation Summary — ${periodKey}`
      : `Weekly Attendance Summary — ${periodKey}`)
    : (hasParticipation ? "Attendance & Participation Confirmed" : "Attendance Confirmed");
  const detailsUrl = normalize(participation?.detailsUrl);

  return {
    announcement: hasParticipation
      ? retrySafeCombinedMessage(delivery.message)
      : normalize(delivery.message),
    class: normalize(delivery.className || klass.name || klass.className || klass.classId || klass.id),
    date: isoDateInTimezone(delivery.dueAt || delivery.failedAt || delivery.updatedAt || new Date(), timezone),
    link: detailsUrl,
    link_label: detailsUrl ? "View class participation" : "",
    topic: subject,
    subject,
    email: normalize(delivery.studentEmail),
    attach_certificate: "FALSE",
    cert_level: normalize(klass.levelId || klass.level),
    delivery_mode: "individual",
    allow_bcc_fallback: "FALSE",
    email_type: hasParticipation ? "general" : "attendance",
    show_progress: "FALSE",
    show_review: "FALSE",
    show_app_button: hasParticipation ? "TRUE" : "FALSE",
    show_class: "TRUE",
    show_date: "TRUE",
    attendance_json: payload ? JSON.stringify(payload) : "",
    participation_json: participation ? JSON.stringify(participation) : "",
    participation_text: normalize(participation?.text),
    render_mode: hasParticipation ? "attendance_with_participation" : "attendance",
  };
}

async function postAnnouncementRows(config, rows, fetchImpl = fetch) {
  if (!config.url) {
    throw new Error("Save this class under Communication → Attendance confirmation emails, or configure the announcement webhook.");
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

async function reserveFailedDelivery({ db, admin, docSnap, now = new Date() }) {
  const ref = docSnap.ref;
  let reserved = null;
  await db.runTransaction(async (transaction) => {
    const freshSnap = await transaction.get(ref);
    if (!freshSnap.exists) return;
    const data = freshSnap.data() || {};
    if (!retryCandidateStatus(data, asDate(now) || new Date())) return;
    if (!normalize(data.studentEmail) || !normalize(data.message)) return;
    reserved = { id: freshSnap.id, ...data };
    transaction.set(ref, {
      status: "processing",
      attemptCount: Number(data.attemptCount || 0) + 1,
      retryStartedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastError: "",
    }, { merge: true });
  });
  return reserved ? { ref, delivery: reserved } : null;
}

async function markRefs(refs, patch) {
  await Promise.all(refs.map((ref) => ref.set(patch, { merge: true })));
}

function serializedTimestamp(value) {
  const date = asDate(value);
  return date ? date.toISOString() : "";
}

function deliveryHealthRecord(docSnap) {
  const data = docSnap.data() || {};
  return {
    id: docSnap.id,
    classId: normalize(data.classId),
    className: normalize(data.className),
    studentKey: normalize(data.studentKey),
    studentName: normalize(data.studentName),
    studentEmail: normalize(data.studentEmail),
    mode: normalize(data.mode),
    periodKey: normalize(data.periodKey),
    status: normalize(data.status).toLowerCase() || "unknown",
    attemptCount: Number(data.attemptCount || 0),
    lastError: normalize(data.lastError),
    dueAt: serializedTimestamp(data.dueAt),
    createdAt: serializedTimestamp(data.createdAt),
    processingStartedAt: serializedTimestamp(data.processingStartedAt),
    cancelledAt: serializedTimestamp(data.cancelledAt),
    sentAt: serializedTimestamp(data.sentAt),
    failedAt: serializedTimestamp(data.failedAt),
    retryStartedAt: serializedTimestamp(data.retryStartedAt),
    retrySentAt: serializedTimestamp(data.retrySentAt),
    retryFailedAt: serializedTimestamp(data.retryFailedAt),
    updatedAt: serializedTimestamp(data.updatedAt),
    upstreamCount: Number(data.upstreamCount || 0),
  };
}

function deliveryRecordTime(record = {}) {
  return asDate(record.updatedAt || record.sentAt || record.failedAt || record.processingStartedAt || record.createdAt)?.getTime() || 0;
}

function summarizeDeliveryHealthRecords(records = []) {
  const rows = Array.isArray(records) ? records : [];
  const sent = rows.filter((row) => row.status === "sent").length;
  const failed = rows.filter((row) => row.status === "failed").length;
  const processing = rows.filter((row) => row.status === "processing").length;
  const cancelled = rows.filter((row) => row.status === "cancelled").length;
  const unknown = Math.max(0, rows.length - sent - failed - processing - cancelled);
  const sorted = [...rows].sort((left, right) => deliveryRecordTime(right) - deliveryRecordTime(left));
  const latest = sorted[0] || null;
  const latestFailure = sorted.find((row) => row.status === "failed") || null;
  const totalAttempts = rows.reduce((sum, row) => sum + Math.max(0, Number(row.attemptCount || 0)), 0);

  return {
    total: rows.length,
    sent,
    failed,
    processing,
    cancelled,
    unknown,
    totalAttempts,
    latest,
    latestFailure,
    healthy: rows.length === 0 ? null : failed === 0 && processing === 0,
  };
}

async function listAttendanceDeliveryHealth({ db, classId, limit = 100 }) {
  const id = normalize(classId);
  if (!id) throw new Error("Select a class before loading attendance delivery health.");

  const classSnap = await db.collection("classes").doc(id).get();
  if (!classSnap.exists) throw new Error("The selected Live Class record was not found.");

  const deliverySnap = await db.collection("attendanceEmailDeliveries").where("classId", "==", id).get();
  const allRecords = deliverySnap.docs
    .map(deliveryHealthRecord)
    .sort((left, right) => deliveryRecordTime(right) - deliveryRecordTime(left));
  const boundedLimit = Math.max(1, Math.min(Number(limit) || 100, 500));
  const records = allRecords.slice(0, boundedLimit);

  return {
    classId: id,
    records,
    summary: summarizeDeliveryHealthRecords(allRecords),
    recentLimit: boundedLimit,
    hasMore: allRecords.length > records.length,
  };
}

async function retryFailedAttendanceDeliveries({
  admin,
  db,
  classId,
  runtimeConfig = {},
  fetchImpl = fetch,
  limit = MAX_RETRY_BATCH,
}) {
  const id = normalize(classId);
  if (!id) throw new Error("Select a class before retrying failed attendance emails.");

  const classRef = db.collection("classes").doc(id);
  const classSnap = await classRef.get();
  if (!classSnap.exists) throw new Error("The selected Live Class record was not found.");
  const klass = { id: classSnap.id, ...classSnap.data() };
  const timestamp = admin.firestore.FieldValue.serverTimestamp();
  const fallbackConfig = resolveWebhookConfig(runtimeConfig);
  const config = resolveClassWebhookConfig(klass, fallbackConfig);

  await classRef.set({
    attendanceConfirmationEmailLastRunAt: timestamp,
    attendanceConfirmationEmailLastStatus: "retrying_failed",
    attendanceConfirmationEmailLastError: "",
  }, { merge: true });

  const deliverySnap = await db.collection("attendanceEmailDeliveries").where("classId", "==", id).get();
  const retryNow = new Date();
  const failedDocs = deliverySnap.docs
    .filter((docSnap) => retryCandidateStatus(docSnap.data() || {}, retryNow))
    .slice(0, Math.max(1, Math.min(Number(limit) || MAX_RETRY_BATCH, MAX_RETRY_BATCH)));

  if (!failedDocs.length) {
    await classRef.set({
      attendanceConfirmationEmailLastRunAt: timestamp,
      attendanceConfirmationEmailLastStatus: "no_failed_deliveries",
      attendanceConfirmationEmailLastError: "",
      attendanceConfirmationEmailLastRetryCount: 0,
    }, { merge: true });
    return { classId: id, failedFound: 0, retried: 0 };
  }

  const eligibleDocs = [];
  let invalidSkipped = 0;
  for (const docSnap of failedDocs) {
    const delivery = { id: docSnap.id, ...docSnap.data() };
    const student = await findStudentForDelivery(db, delivery);
    if (student && await deliveryPredatesEnrollment(delivery, student, db)) {
      invalidSkipped += 1;
      await docSnap.ref.set({
        status: "cancelled",
        lastError: "Cancelled stale attendance summary because it includes a class session before this student enrolled.",
        cancelledAt: timestamp,
        updatedAt: timestamp,
      }, { merge: true });
      continue;
    }
    eligibleDocs.push(docSnap);
  }

  if (!eligibleDocs.length) {
    await classRef.set({
      attendanceConfirmationEmailLastRunAt: timestamp,
      attendanceConfirmationEmailLastStatus: "no_failed_deliveries",
      attendanceConfirmationEmailLastError: "",
      attendanceConfirmationEmailLastRetryCount: 0,
    }, { merge: true });
    return { classId: id, failedFound: failedDocs.length, retried: 0, retryFailed: 0, invalidSkipped };
  }

  let retried = 0;
  let retryFailed = 0;
  let reservationSkipped = 0;
  let lastRetryError = "";

  // Keep concurrency bounded and reserve each record only immediately before
  // its network request. An interrupted invocation can strand at most the small
  // in-flight chunk, and stale processing records are eligible on the next run.
  for (let offset = 0; offset < eligibleDocs.length; offset += RETRY_CONCURRENCY) {
    const chunk = eligibleDocs.slice(offset, offset + RETRY_CONCURRENCY);
    const outcomes = await Promise.all(chunk.map(async (docSnap) => {
      const item = await reserveFailedDelivery({ db, admin, docSnap, now: retryNow });
      if (!item) return { reserved: false };

      try {
        const upstream = await postAnnouncementRows(config, [rowForRetry(item.delivery, klass)], fetchImpl);
        await markRefs([item.ref], {
          status: "sent",
          sentAt: timestamp,
          retrySentAt: timestamp,
          updatedAt: timestamp,
          upstreamCount: Number(upstream?.count || upstream?.sent || 1),
          lastError: "",
        });
        return { reserved: true, sent: true };
      } catch (error) {
        const message = error?.message || "Attendance email retry failed";
        await markRefs([item.ref], {
          status: "failed",
          lastError: message,
          failedAt: timestamp,
          retryFailedAt: timestamp,
          updatedAt: timestamp,
        });
        return { reserved: true, failed: true, message };
      }
    }));

    for (const outcome of outcomes) {
      if (!outcome.reserved) {
        reservationSkipped += 1;
      } else if (outcome.sent) {
        retried += 1;
      } else if (outcome.failed) {
        retryFailed += 1;
        lastRetryError = outcome.message || lastRetryError;
      }
    }
  }

  await classRef.set({
    attendanceConfirmationEmailLastRunAt: timestamp,
    ...(retried ? { attendanceConfirmationEmailLastSentAt: timestamp } : {}),
    attendanceConfirmationEmailLastStatus: retryFailed
      ? (retried ? "retry_partial_failed" : "retry_failed")
      : retried
        ? "retry_sent"
        : "no_failed_deliveries",
    attendanceConfirmationEmailLastSentCount: retried,
    attendanceConfirmationEmailLastRetryCount: retried,
    attendanceConfirmationEmailLastError: lastRetryError,
  }, { merge: true });

  return {
    classId: id,
    failedFound: failedDocs.length,
    retried,
    retryFailed,
    invalidSkipped,
    reservationSkipped,
  };
}

module.exports = {
  retryFailedAttendanceDeliveries,
  listAttendanceDeliveryHealth,
  _test: {
    resolveClassWebhookConfig,
    resolveWebhookConfig,
    rowForRetry,
    retrySafeCombinedMessage,
    studentEnrollmentStart,
    resolveDeliverySessionStarts,
    deliveryPredatesEnrollment,
    retryCandidateStatus,
    deliveryHealthRecord,
    summarizeDeliveryHealthRecords,
  },
};

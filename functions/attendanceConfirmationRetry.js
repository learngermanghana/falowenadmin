const ACCRA_TIMEZONE = "Africa/Accra";
const MAX_RETRY_BATCH = 200;

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

function rowForRetry(delivery = {}, klass = {}) {
  const mode = normalize(delivery.mode).toLowerCase();
  const periodKey = normalize(delivery.periodKey);
  const timezone = normalize(klass.timezone) || ACCRA_TIMEZONE;
  return {
    announcement: normalize(delivery.message),
    class: normalize(delivery.className || klass.name || klass.className || klass.classId || klass.id),
    date: isoDateInTimezone(delivery.dueAt || delivery.failedAt || delivery.updatedAt || new Date(), timezone),
    link: "",
    topic: mode === "weekly" ? `Weekly Attendance Summary — ${periodKey}` : "Attendance Confirmed",
    email: normalize(delivery.studentEmail),
    attach_certificate: "FALSE",
    cert_level: normalize(klass.levelId || klass.level),
    delivery_mode: "individual",
    allow_bcc_fallback: "FALSE",
    email_type: "attendance",
    show_progress: "FALSE",
    show_review: "FALSE",
    show_app_button: "FALSE",
    show_class: "TRUE",
    show_date: "TRUE",
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

async function reserveFailedDelivery({ db, admin, docSnap }) {
  const ref = docSnap.ref;
  let reserved = null;
  await db.runTransaction(async (transaction) => {
    const freshSnap = await transaction.get(ref);
    if (!freshSnap.exists) return;
    const data = freshSnap.data() || {};
    if (normalize(data.status).toLowerCase() !== "failed") return;
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
  const failedDocs = deliverySnap.docs
    .filter((docSnap) => normalize(docSnap.data()?.status).toLowerCase() === "failed")
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

  const reserved = [];
  for (const docSnap of failedDocs) {
    const item = await reserveFailedDelivery({ db, admin, docSnap });
    if (item) reserved.push(item);
  }

  if (!reserved.length) {
    await classRef.set({
      attendanceConfirmationEmailLastRunAt: timestamp,
      attendanceConfirmationEmailLastStatus: "no_failed_deliveries",
      attendanceConfirmationEmailLastError: "",
      attendanceConfirmationEmailLastRetryCount: 0,
    }, { merge: true });
    return { classId: id, failedFound: failedDocs.length, retried: 0 };
  }

  const refs = reserved.map((item) => item.ref);
  const rows = reserved.map((item) => rowForRetry(item.delivery, klass));

  try {
    const upstream = await postAnnouncementRows(config, rows, fetchImpl);
    await markRefs(refs, {
      status: "sent",
      sentAt: timestamp,
      retrySentAt: timestamp,
      updatedAt: timestamp,
      upstreamCount: Number(upstream?.count || upstream?.sent || rows.length),
      lastError: "",
    });
    await classRef.set({
      attendanceConfirmationEmailLastRunAt: timestamp,
      attendanceConfirmationEmailLastSentAt: timestamp,
      attendanceConfirmationEmailLastStatus: "retry_sent",
      attendanceConfirmationEmailLastSentCount: rows.length,
      attendanceConfirmationEmailLastRetryCount: rows.length,
      attendanceConfirmationEmailLastError: "",
    }, { merge: true });
    return { classId: id, failedFound: failedDocs.length, retried: rows.length };
  } catch (error) {
    const message = error?.message || "Attendance email retry failed";
    await markRefs(refs, {
      status: "failed",
      lastError: message,
      failedAt: timestamp,
      retryFailedAt: timestamp,
      updatedAt: timestamp,
    });
    await classRef.set({
      attendanceConfirmationEmailLastRunAt: timestamp,
      attendanceConfirmationEmailLastStatus: "retry_failed",
      attendanceConfirmationEmailLastError: message,
    }, { merge: true });
    throw error;
  }
}

module.exports = {
  retryFailedAttendanceDeliveries,
  _test: {
    resolveClassWebhookConfig,
    resolveWebhookConfig,
    rowForRetry,
  },
};

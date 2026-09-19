import { auth } from "../firebase.js";

function normalize(value) {
  return String(value ?? "").trim();
}

function asDate(value) {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  if (typeof value?.toMillis === "function") return new Date(value.toMillis());
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function recordTime(record = {}) {
  const value = record.updatedAt
    || record.sentAt
    || record.failedAt
    || record.processingStartedAt
    || record.createdAt;
  return asDate(value)?.getTime() || 0;
}

function normalizedStatus(value) {
  const status = normalize(value).toLowerCase();
  if (status === "sent") return "sent";
  if (status === "failed") return "failed";
  if (status === "processing") return "processing";
  return status || "unknown";
}

export function normalizeAttendanceDeliveryRecord(id, data = {}) {
  return {
    id: normalize(id),
    classId: normalize(data.classId),
    className: normalize(data.className),
    studentKey: normalize(data.studentKey),
    studentName: normalize(data.studentName),
    studentEmail: normalize(data.studentEmail),
    mode: normalize(data.mode),
    periodKey: normalize(data.periodKey),
    status: normalizedStatus(data.status),
    attemptCount: Number(data.attemptCount || 0),
    message: normalize(data.message),
    lastError: normalize(data.lastError),
    dueAt: data.dueAt || null,
    createdAt: data.createdAt || null,
    processingStartedAt: data.processingStartedAt || null,
    sentAt: data.sentAt || null,
    failedAt: data.failedAt || null,
    retryStartedAt: data.retryStartedAt || null,
    retrySentAt: data.retrySentAt || null,
    retryFailedAt: data.retryFailedAt || null,
    updatedAt: data.updatedAt || null,
    upstreamCount: Number(data.upstreamCount || 0),
  };
}

export function summarizeAttendanceDeliveryHealth(records = []) {
  const rows = Array.isArray(records) ? records : [];
  const sent = rows.filter((row) => row.status === "sent").length;
  const failed = rows.filter((row) => row.status === "failed").length;
  const processing = rows.filter((row) => row.status === "processing").length;
  const unknown = Math.max(0, rows.length - sent - failed - processing);
  const latest = [...rows].sort((a, b) => recordTime(b) - recordTime(a))[0] || null;
  const latestFailure = [...rows]
    .filter((row) => row.status === "failed")
    .sort((a, b) => recordTime(b) - recordTime(a))[0] || null;
  const totalAttempts = rows.reduce((sum, row) => sum + Math.max(0, Number(row.attemptCount || 0)), 0);

  return {
    total: rows.length,
    sent,
    failed,
    processing,
    unknown,
    totalAttempts,
    latest,
    latestFailure,
    healthy: rows.length === 0 ? null : failed === 0 && processing === 0,
  };
}

export async function loadAttendanceDeliveryHealth(classRecordId) {
  const classId = normalize(classRecordId);
  if (!classId) throw new Error("Select a class before loading attendance delivery health.");

  const user = auth?.currentUser;
  if (!user) throw new Error("You must be signed in to load attendance delivery health.");
  const token = await user.getIdToken();
  const response = await fetch("/api/attendance-confirmation-emails/health?classId=" + encodeURIComponent(classId), {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + token,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.ok === false) {
    throw new Error(String(data?.error || data?.message || "Could not load attendance delivery health."));
  }

  const records = (Array.isArray(data.records) ? data.records : [])
    .map((record) => normalizeAttendanceDeliveryRecord(record.id, record))
    .sort((left, right) => recordTime(right) - recordTime(left));

  const fallbackSummary = summarizeAttendanceDeliveryHealth(records);
  const serverSummary = data?.summary && typeof data.summary === "object"
    ? {
        ...data.summary,
        latest: data.summary.latest ? normalizeAttendanceDeliveryRecord(data.summary.latest.id, data.summary.latest) : fallbackSummary.latest,
        latestFailure: data.summary.latestFailure ? normalizeAttendanceDeliveryRecord(data.summary.latestFailure.id, data.summary.latestFailure) : fallbackSummary.latestFailure,
      }
    : null;

  return {
    classId,
    records,
    summary: serverSummary || fallbackSummary,
    recentLimit: Number(data?.recentLimit || records.length || 0),
    hasMore: Boolean(data?.hasMore),
  };
}

import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase.js";

export const ATTENDANCE_EMAIL_MODES = Object.freeze({
  OFF: "off",
  EACH_CLASS: "each_class",
  WEEKLY: "weekly",
});

const communicationDeliveryConfig = Object.freeze({
  url: String(import.meta.env.VITE_ANNOUNCEMENT_WEBHOOK_URL || "").trim(),
  token: String(import.meta.env.VITE_ANNOUNCEMENT_WEBHOOK_TOKEN || "").trim(),
  sheetName: String(import.meta.env.VITE_ANNOUNCEMENT_WEBHOOK_SHEET_NAME || "").trim(),
  sheetGid: String(import.meta.env.VITE_ANNOUNCEMENT_WEBHOOK_SHEET_GID || "").trim(),
});

function normalize(value) {
  return String(value || "").trim();
}

function clampNumber(value, fallback, minimum, maximum) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(minimum, Math.min(maximum, Math.round(number)));
}

function storedDeliveryConfig(data = {}) {
  const value = data.attendanceConfirmationEmailDelivery || {};
  return {
    url: normalize(value.url),
    token: normalize(value.token),
    sheetName: normalize(value.sheetName),
    sheetGid: normalize(value.sheetGid),
  };
}

export function normalizeAttendanceEmailSettings(data = {}) {
  const storedMode = normalize(data.attendanceConfirmationEmailMode).toLowerCase();
  const mode = Object.values(ATTENDANCE_EMAIL_MODES).includes(storedMode)
    ? storedMode
    : ATTENDANCE_EMAIL_MODES.WEEKLY;
  const enabled = data.attendanceConfirmationEmailEnabled == null
    ? mode !== ATTENDANCE_EMAIL_MODES.OFF
    : Boolean(data.attendanceConfirmationEmailEnabled);
  const delivery = storedDeliveryConfig(data);

  return {
    enabled: enabled && mode !== ATTENDANCE_EMAIL_MODES.OFF,
    mode,
    delayMinutes: clampNumber(data.attendanceConfirmationEmailDelayMinutes, 30, 0, 360),
    lateMinutes: clampNumber(data.attendanceConfirmationLateMinutes, 15, 0, 120),
    replyNote: normalize(data.attendanceConfirmationEmailReplyNote),
    deliveryConfigured: Boolean(delivery.url || communicationDeliveryConfig.url),
    lastRunAt: data.attendanceConfirmationEmailLastRunAt || null,
    lastSentAt: data.attendanceConfirmationEmailLastSentAt || null,
    lastSentCount: Number(data.attendanceConfirmationEmailLastSentCount || 0),
    lastStatus: normalize(data.attendanceConfirmationEmailLastStatus),
    lastError: normalize(data.attendanceConfirmationEmailLastError),
  };
}

export async function loadAttendanceEmailSettings(classRecordId) {
  const id = normalize(classRecordId);
  if (!id) throw new Error("Select a class first.");
  const snap = await getDoc(doc(db, "classes", id));
  if (!snap.exists()) throw new Error("The selected class record was not found.");
  return normalizeAttendanceEmailSettings(snap.data() || {});
}

export async function saveAttendanceEmailSettings(classRecordId, settings = {}) {
  const id = normalize(classRecordId);
  if (!id) throw new Error("Select a class first.");
  const mode = Object.values(ATTENDANCE_EMAIL_MODES).includes(settings.mode)
    ? settings.mode
    : ATTENDANCE_EMAIL_MODES.WEEKLY;
  const enabled = Boolean(settings.enabled) && mode !== ATTENDANCE_EMAIL_MODES.OFF;
  const payload = {
    attendanceConfirmationEmailEnabled: enabled,
    attendanceConfirmationEmailMode: enabled ? mode : ATTENDANCE_EMAIL_MODES.OFF,
    attendanceConfirmationEmailDelayMinutes: clampNumber(settings.delayMinutes, 30, 0, 360),
    attendanceConfirmationLateMinutes: clampNumber(settings.lateMinutes, 15, 0, 120),
    attendanceConfirmationEmailReplyNote: normalize(settings.replyNote),
    attendanceConfirmationEmailUpdatedAt: serverTimestamp(),
    ...(communicationDeliveryConfig.url ? {
      attendanceConfirmationEmailDelivery: {
        url: communicationDeliveryConfig.url,
        token: communicationDeliveryConfig.token,
        sheetName: communicationDeliveryConfig.sheetName,
        sheetGid: communicationDeliveryConfig.sheetGid,
        source: "communication_webhook",
      },
    } : {}),
  };
  await setDoc(doc(db, "classes", id), payload, { merge: true });
  return normalizeAttendanceEmailSettings(payload);
}

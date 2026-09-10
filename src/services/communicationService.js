import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase.js";
import { listClasses } from "./classesService.js";
import { listStudentsByClass } from "./studentsService.js";
import { cancelSession } from "./liveClassSessionDirectService.js";
import { belongsToSelectedClass } from "../utils/liveClassSessionOwnership.js";

const ANNOUNCEMENT_WEBHOOK_URL = String(import.meta.env.VITE_ANNOUNCEMENT_WEBHOOK_URL || "").trim();
const ANNOUNCEMENT_WEBHOOK_TOKEN = String(import.meta.env.VITE_ANNOUNCEMENT_WEBHOOK_TOKEN || "").trim();
const ANNOUNCEMENT_WEBHOOK_SHEET_NAME = String(import.meta.env.VITE_ANNOUNCEMENT_WEBHOOK_SHEET_NAME || "").trim();
const ANNOUNCEMENT_WEBHOOK_SHEET_GID = String(import.meta.env.VITE_ANNOUNCEMENT_WEBHOOK_SHEET_GID || "").trim();
const SAVE_ANNOUNCEMENTS_TO_FIRESTORE = String(import.meta.env.VITE_ENABLE_ANNOUNCEMENT_FIRESTORE || "false").toLowerCase() === "true";

function normalize(value) {
  return String(value || "").trim();
}

function boolToSheetValue(value) {
  return value ? "TRUE" : "FALSE";
}

function inferLevelFromText(value) {
  const match = normalize(value).match(/\b(A1|A2|B1|B2|C1|C2)\b/i);
  return match?.[1]?.toUpperCase() || "";
}

function inferCertificateLevel(input = {}) {
  const candidates = [
    input.certLevel,
    input.cert_level,
    input.level,
    input.classLevel,
    input.courseLevel,
    input.languageLevel,
    input.className,
    input.class,
    input.topic,
    input.announcement,
  ];

  for (const candidate of candidates) {
    const direct = normalize(candidate);
    if (/^(A1|A2|B1|B2|C1|C2)$/i.test(direct)) return direct.toUpperCase();
    const inferred = inferLevelFromText(direct);
    if (inferred) return inferred;
  }
  return "";
}

function inferDeliveryMode(input = {}) {
  const requestedMode = normalize(input.deliveryMode || input.delivery_mode).toLowerCase();
  if (["auto", "individual", "bcc_batch", "queue_only"].includes(requestedMode)) return requestedMode;
  return "auto";
}

function canUseBccFallback(input = {}) {
  const announcement = normalize(input.announcement).toLowerCase();
  const hasSingleEmailTarget = Boolean(normalize(input.email));

  if (input.attachCertificate) return false;
  if (hasSingleEmailTarget) return false;
  if (announcement.includes("{student_name}") || announcement.includes("student_name")) return false;

  return true;
}

function isLikelyNetworkError(error) {
  return error instanceof TypeError || /networkerror|failed to fetch/i.test(String(error?.message || ""));
}

function isClassCancellation(input = {}) {
  const topic = normalize(input.topic).toLowerCase();
  const action = normalize(input.liveClassAction || input.action).toLowerCase();
  return action === "cancel" || action === "cancel_class" || topic === "class cancellation";
}

function toDate(value) {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  if (typeof value?.toMillis === "function") return new Date(value.toMillis());
  if (typeof value === "object" && Number.isFinite(value.seconds)) {
    return new Date((Number(value.seconds) * 1000) + Math.round(Number(value.nanoseconds || 0) / 1000000));
  }
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function localDate(value, timezone = "Africa/Accra") {
  const date = toDate(value);
  if (!date) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: normalize(timezone) || "Africa/Accra",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function classAliases(klass = {}) {
  return [...new Set([
    klass.id,
    klass.classId,
    klass.name,
    klass.className,
    klass.slug,
  ].map(normalize).filter(Boolean))];
}

function classDisplayName(klass = {}) {
  return normalize(klass.name || klass.className || klass.classId || klass.id);
}

function findCommunicationClass(classes = [], value = "") {
  const target = normalize(value);
  if (!target) return null;
  return classes.find((klass) => classAliases(klass).includes(target)) || null;
}

function sessionStatus(session = {}) {
  return normalize(session.status || session.sessionStatus || "scheduled").toLowerCase();
}

function activeCancellationTarget(session = {}) {
  return !["cancelled", "canceled", "completed", "superseded", "deleted"].includes(sessionStatus(session))
    && session.superseded !== true;
}

async function loadClassSessionsForCommunication(klass = {}) {
  const classId = normalize(klass.id || klass.classId);
  const aliases = classAliases(klass);
  const lookups = aliases.flatMap((identifier) => [
    ["classId", identifier],
    ["classRecordId", identifier],
    ["className", identifier],
  ]);
  const results = await Promise.allSettled(lookups.map(async ([field, identifier]) => {
    const snap = await getDocs(query(collection(db, "classSessions"), where(field, "==", identifier)));
    return snap.docs.map((item) => ({ id: item.id, ...item.data() }));
  }));
  const found = new Map();
  results.forEach((result) => {
    if (result.status !== "fulfilled") return;
    result.value.forEach((session) => {
      if (!belongsToSelectedClass(session, classId, aliases)) return;
      found.set(session.id, session);
    });
  });
  return [...found.values()];
}

async function prepareCommunicationCancellation(input = {}, row = {}) {
  if (!ANNOUNCEMENT_WEBHOOK_URL) {
    throw new Error("Class cancellation email delivery is not configured. The Live Classes session was not changed.");
  }

  const classes = await listClasses();
  const klass = findCommunicationClass(classes, row.class || input.className);
  if (!klass) {
    throw new Error("Select one actual class before cancelling. Level-wide and all-active broadcasts cannot cancel a Live Classes session.");
  }

  const classId = normalize(klass.id || klass.classId);
  if (!classId) throw new Error("The selected class has no permanent class document ID.");
  const timezone = normalize(klass.timezone) || "Africa/Accra";
  const sessions = await loadClassSessionsForCommunication(klass);
  const targetDate = normalize(row.date || input.date);
  const candidates = sessions
    .filter(activeCancellationTarget)
    .filter((session) => localDate(session.startsAt, timezone) === targetDate)
    .sort((left, right) => (toDate(left.startsAt)?.getTime() || 0) - (toDate(right.startsAt)?.getTime() || 0));

  if (!candidates.length) {
    throw new Error(`No active Live Classes session was found for ${classDisplayName(klass)} on ${targetDate}. Nothing was emailed.`);
  }
  if (candidates.length > 1) {
    throw new Error(`More than one Live Classes session exists for ${classDisplayName(klass)} on ${targetDate}. Cancel the exact session from Live Classes so Falowen can use its permanent Firestore document ID. Nothing was emailed.`);
  }

  const session = candidates[0];
  const reason = normalize(input.cancellationReason || input.reason || input.announcement) || "Class cancelled from Communication page.";
  const result = await cancelSession(session.id, {
    classId,
    reason,
    adminId: normalize(input.adminId) || "communication-page",
  });

  // The session + reminder suppression + attendance session status are written by
  // cancelSession transactionally. Explicitly close an already-open check-in gate
  // before the student announcement is allowed to continue.
  await updateDoc(doc(db, "attendance", classId, "sessions", session.id), {
    opened: false,
    closed: true,
    autoOpened: false,
    closedBy: normalize(input.adminId) || "communication-page",
    closedAt: serverTimestamp(),
    sessionStatus: "cancelled",
    remindersSuppressed: true,
    updatedAt: serverTimestamp(),
  });

  const students = await listStudentsByClass(classDisplayName(klass)).catch(() => []);
  const recipientKeys = new Set(students.map((student) => normalize(student.email || student.contactEmail || student.id)).filter(Boolean));
  return {
    classId,
    className: classDisplayName(klass),
    sessionId: session.id,
    session,
    recipientCount: recipientKeys.size,
    result,
  };
}

export function buildAnnouncementRow(input = {}) {
  const rowDate = normalize(input.date) || new Date().toISOString().slice(0, 10);
  const deliveryMode = inferDeliveryMode(input);

  return {
    announcement: normalize(input.announcement),
    class: normalize(input.className),
    date: rowDate,
    link: normalize(input.link),
    topic: normalize(input.topic),
    email: normalize(input.email),
    attach_certificate: boolToSheetValue(Boolean(input.attachCertificate)),
    cert_level: inferCertificateLevel(input),
    delivery_mode: deliveryMode,
    allow_bcc_fallback: boolToSheetValue(deliveryMode !== "individual" && canUseBccFallback(input)),
  };
}

async function postAnnouncementToWebhook(payload) {
  const response = await fetch(ANNOUNCEMENT_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || "Failed to write announcement to Google Sheets webhook");
  }

  const responseBody = await response.json().catch(() => ({}));
  if (responseBody?.ok === false) {
    throw new Error(responseBody?.error || "Validation failed while saving announcement");
  }
  return responseBody;
}

async function postAnnouncementToWebhookNoCors(payload) {
  await fetch(ANNOUNCEMENT_WEBHOOK_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=UTF-8" },
    body: JSON.stringify(payload),
  });
}

export async function saveAnnouncementRow(input) {
  const row = buildAnnouncementRow(input);
  const cancellation = isClassCancellation(input)
    ? await prepareCommunicationCancellation(input, row)
    : null;

  const payload = {
    ...(ANNOUNCEMENT_WEBHOOK_TOKEN ? { token: ANNOUNCEMENT_WEBHOOK_TOKEN } : {}),
    ...(ANNOUNCEMENT_WEBHOOK_SHEET_NAME ? { sheet_name: ANNOUNCEMENT_WEBHOOK_SHEET_NAME } : {}),
    ...(ANNOUNCEMENT_WEBHOOK_SHEET_GID ? { sheet_gid: ANNOUNCEMENT_WEBHOOK_SHEET_GID } : {}),
    row,
    rows: [row],
  };

  const receipt = {
    row,
    ...(cancellation ? { liveClass: cancellation } : {}),
    sheet: {
      attempted: Boolean(ANNOUNCEMENT_WEBHOOK_URL),
      success: !ANNOUNCEMENT_WEBHOOK_URL,
      message: ANNOUNCEMENT_WEBHOOK_URL
        ? "Pending"
        : "Sheet save skipped (webhook not configured).",
      unverified: false,
    },
    firestore: {
      attempted: SAVE_ANNOUNCEMENTS_TO_FIRESTORE,
      success: !SAVE_ANNOUNCEMENTS_TO_FIRESTORE,
      message: SAVE_ANNOUNCEMENTS_TO_FIRESTORE
        ? "Pending"
        : "Firestore mirror skipped (disabled by config).",
    },
  };

  if (ANNOUNCEMENT_WEBHOOK_URL) {
    try {
      const responseBody = await postAnnouncementToWebhook(payload);
      receipt.sheet.success = true;
      if (cancellation) {
        const reportedRecipients = Number(responseBody?.recipientCount || responseBody?.recipients || 0);
        const recipientCount = reportedRecipients > 0 ? reportedRecipients : cancellation.recipientCount;
        receipt.sheet.message = `Class cancelled successfully. The Live Classes timetable was updated, upcoming reminders were stopped, check-in was closed, and the cancellation email was sent${recipientCount ? ` to ${recipientCount} students` : ""}.`;
      } else {
        receipt.sheet.message = "Saved to Google Sheets.";
      }
    } catch (error) {
      if (!isLikelyNetworkError(error)) {
        receipt.sheet.message = String(error?.message || "Failed to write announcement to Google Sheets webhook");
      } else {
        try {
          await postAnnouncementToWebhookNoCors(payload);
          receipt.sheet.success = true;
          receipt.sheet.unverified = true;
          receipt.sheet.message = cancellation
            ? "Class cancelled successfully and reminders/check-in were stopped. The cancellation email request was sent, but the browser cannot verify final delivery."
            : "Sheet request sent via no-cors fallback (delivery cannot be confirmed by browser).";
        } catch (fallbackError) {
          receipt.sheet.message = String(fallbackError?.message || error?.message || "Google Sheets save failed.");
        }
      }
    }
  }

  if (SAVE_ANNOUNCEMENTS_TO_FIRESTORE) {
    try {
      await addDoc(collection(db, "announcements"), {
        ...row,
        ...(cancellation ? {
          liveClassAction: "cancelled",
          classId: cancellation.classId,
          classSessionId: cancellation.sessionId,
        } : {}),
        createdAt: new Date().toISOString(),
      });
      receipt.firestore.success = true;
      receipt.firestore.message = "Saved to Firestore mirror.";
    } catch (error) {
      receipt.firestore.message = String(error?.message || "Firestore mirror save failed.");
    }
  }

  if (!receipt.sheet.success && !receipt.firestore.success) {
    const saveError = new Error(receipt.sheet.message || "Save failed for both Google Sheets and Firestore.");
    saveError.receipt = receipt;
    throw saveError;
  }

  return receipt;
}

import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase.js";
import { listClasses } from "./classesService.js";
import { listStudentsByClass } from "./studentsService.js";
import { cancelSession } from "./liveClassSessionDirectService.js";
import { belongsToSelectedClass } from "../utils/liveClassSessionOwnership.js";
import {
  deliveryFailureMessage,
  historyStatusBlocksDuplicate,
  receiptHasSuccessfulDelivery,
} from "../utils/communicationDelivery.js";

const ANNOUNCEMENT_WEBHOOK_URL = String(import.meta.env.VITE_ANNOUNCEMENT_WEBHOOK_URL || "").trim();
const ANNOUNCEMENT_WEBHOOK_TOKEN = String(import.meta.env.VITE_ANNOUNCEMENT_WEBHOOK_TOKEN || "").trim();
const ANNOUNCEMENT_WEBHOOK_SHEET_NAME = String(import.meta.env.VITE_ANNOUNCEMENT_WEBHOOK_SHEET_NAME || "").trim();
const ANNOUNCEMENT_WEBHOOK_SHEET_GID = String(import.meta.env.VITE_ANNOUNCEMENT_WEBHOOK_SHEET_GID || "").trim();
const DUPLICATE_WINDOW_MS = 10 * 60 * 1000;
const HISTORY_LIMIT_DEFAULT = 30;

function normalize(value) {
  return String(value || "").trim();
}

function normalizeLower(value) {
  return normalize(value).toLowerCase().replace(/\s+/g, " ");
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

function createdAtMs(value) {
  if (!value) return 0;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.toDate === "function") return value.toDate().getTime();
  if (typeof value === "object" && Number.isFinite(value.seconds)) return Number(value.seconds) * 1000;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

function hashText(value) {
  const text = String(value || "");
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function recipientKey(input = {}) {
  if (Array.isArray(input.recipientKeys) && input.recipientKeys.length) {
    return hashText(input.recipientKeys.map(normalizeLower).filter(Boolean).sort().join("|"));
  }
  return normalizeLower(input.email || input.studentId || input.studentCode || "");
}

export function buildAnnouncementFingerprint(input = {}, row = buildAnnouncementRow(input)) {
  const parts = [
    normalizeLower(row.topic),
    normalizeLower(row.announcement),
    normalizeLower(row.class),
    normalizeLower(row.date),
    normalizeLower(row.link),
    normalizeLower(row.cert_level),
    normalizeLower(input.recipientFilter || input.audienceMode || "all"),
    normalizeLower(input.sessionId || input.classSessionId),
    recipientKey(input),
  ];
  return `ann_${hashText(parts.join("||"))}`;
}

async function findRecentDuplicate(fingerprint, windowMs = DUPLICATE_WINDOW_MS) {
  if (!fingerprint) return null;
  try {
    const snap = await getDocs(query(collection(db, "announcements"), where("fingerprint", "==", fingerprint)));
    const cutoff = Date.now() - Math.max(0, Number(windowMs) || DUPLICATE_WINDOW_MS);
    const rows = snap.docs
      .map((item) => ({ id: item.id, ...item.data() }))
      .filter(historyStatusBlocksDuplicate)
      .filter((item) => createdAtMs(item.createdAt) >= cutoff)
      .sort((a, b) => createdAtMs(b.createdAt) - createdAtMs(a.createdAt));
    return rows[0] || null;
  } catch (error) {
    console.warn("Could not check communication duplicate history; continuing without blocking send.", error);
    return null;
  }
}

async function assertNotRecentDuplicate(input, row) {
  if (input.skipDuplicateGuard || isClassCancellation(input)) return;
  const fingerprint = buildAnnouncementFingerprint(input, row);
  const duplicate = await findRecentDuplicate(fingerprint, input.duplicateWindowMs);
  if (!duplicate) return;
  const error = new Error("This exact message was already sent to the same audience recently. Change the message/audience or wait before sending it again.");
  error.code = "duplicate_communication";
  error.duplicate = duplicate;
  throw error;
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
  const requestedSessionId = normalize(input.sessionId || input.classSessionId);
  const targetDate = normalize(row.date || input.date);
  const candidates = requestedSessionId
    ? sessions.filter((session) => normalize(session.id) === requestedSessionId && activeCancellationTarget(session))
    : sessions
      .filter(activeCancellationTarget)
      .filter((session) => localDate(session.startsAt, timezone) === targetDate)
      .sort((left, right) => (toDate(left.startsAt)?.getTime() || 0) - (toDate(right.startsAt)?.getTime() || 0));

  if (!candidates.length) {
    throw new Error(requestedSessionId
      ? "The selected Live Classes session no longer exists or is no longer active. Nothing was emailed."
      : `No active Live Classes session was found for ${classDisplayName(klass)} on ${targetDate}. Nothing was emailed.`);
  }
  if (candidates.length > 1) {
    throw new Error(`More than one Live Classes session exists for ${classDisplayName(klass)} on ${targetDate}. Select the exact lesson so Falowen can use its permanent Firestore document ID. Nothing was emailed.`);
  }

  const session = candidates[0];
  const reason = normalize(input.cancellationReason || input.reason || input.announcement) || "Class cancelled from Communication page.";
  const result = await cancelSession(session.id, {
    classId,
    reason,
    adminId: normalize(input.adminId) || "communication-page",
  });

  await setDoc(doc(db, "attendance", classId, "sessions", session.id), {
    classId,
    classSessionId: session.id,
    opened: false,
    closed: true,
    autoOpened: false,
    closedBy: normalize(input.adminId) || "communication-page",
    closedAt: serverTimestamp(),
    sessionStatus: "cancelled",
    remindersSuppressed: true,
    updatedAt: serverTimestamp(),
  }, { merge: true });

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

async function writeCommunicationHistory(input, row, receipt, extra = {}) {
  const fingerprint = extra.fingerprint || buildAnnouncementFingerprint(input, row);
  const status = extra.status || (
    receipt?.sheet?.success
      ? receipt.sheet.unverified ? "unverified" : "sent"
      : "failed"
  );
  const recipientCount = Number(extra.recipientCount ?? input.recipientCount ?? (row.email ? 1 : 0)) || 0;

  const payload = {
    ...row,
    fingerprint,
    communicationHistory: true,
    audienceMode: normalize(extra.audienceMode || input.audienceMode || input.recipientFilter || (row.email ? "individual" : "class")),
    recipientFilter: normalize(extra.recipientFilter || input.recipientFilter),
    recipientCount,
    successCount: Number(extra.successCount ?? (status === "sent" || status === "unverified" ? recipientCount : 0)) || 0,
    failureCount: Number(extra.failureCount || 0) || 0,
    deliveryStatus: status,
    classId: normalize(extra.classId || input.classId),
    classSessionId: normalize(extra.sessionId || input.sessionId || input.classSessionId),
    sessionLabel: normalize(extra.sessionLabel || input.sessionLabel),
    liveClassAction: normalize(extra.liveClassAction || input.liveClassAction),
    createdAt: new Date().toISOString(),
  };

  const saved = await addDoc(collection(db, "announcements"), payload);
  return { id: saved.id, ...payload };
}

export async function listCommunicationHistory({ limit = HISTORY_LIMIT_DEFAULT } = {}) {
  const snap = await getDocs(collection(db, "announcements"));
  return snap.docs
    .map((item) => ({ id: item.id, ...item.data() }))
    .sort((a, b) => createdAtMs(b.createdAt) - createdAtMs(a.createdAt))
    .slice(0, Math.max(1, Number(limit) || HISTORY_LIMIT_DEFAULT));
}

export async function saveAnnouncementRow(input = {}) {
  const row = buildAnnouncementRow(input);
  await assertNotRecentDuplicate(input, row);

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
      success: false,
      message: ANNOUNCEMENT_WEBHOOK_URL ? "Pending" : "Email webhook not configured; saved to communication history only.",
      unverified: false,
    },
    firestore: {
      attempted: !input.skipHistory,
      success: Boolean(input.skipHistory),
      message: input.skipHistory ? "Grouped history will be saved by the caller." : "Pending",
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

  if (!input.skipHistory) {
    try {
      const history = await writeCommunicationHistory(input, row, receipt, {
        classId: cancellation?.classId,
        sessionId: cancellation?.sessionId,
        recipientCount: cancellation?.recipientCount ?? input.recipientCount,
        liveClassAction: cancellation ? "cancelled" : input.liveClassAction,
      });
      receipt.firestore.success = true;
      receipt.firestore.message = "Saved to communication history.";
      receipt.history = history;
    } catch (error) {
      receipt.firestore.success = false;
      receipt.firestore.message = String(error?.message || "Communication history save failed.");
    }
  }

  if (ANNOUNCEMENT_WEBHOOK_URL && !receipt.sheet.success) {
    const saveError = new Error(receipt.sheet.message || "Announcement delivery failed.");
    saveError.receipt = receipt;
    throw saveError;
  }
  if (!ANNOUNCEMENT_WEBHOOK_URL && !receipt.firestore.success) {
    const saveError = new Error(receipt.firestore.message || "Communication history save failed.");
    saveError.receipt = receipt;
    throw saveError;
  }

  return receipt;
}

export async function saveAnnouncementBatch({ input = {}, recipients = [], recipientFilter = "all", session = null } = {}) {
  if (!ANNOUNCEMENT_WEBHOOK_URL) {
    throw new Error("Targeted email delivery is not configured. No student emails were sent.");
  }

  const unique = new Map();
  recipients.forEach((recipient) => {
    const email = normalizeLower(recipient.email || recipient.contactEmail);
    if (!email || unique.has(email)) return;
    unique.set(email, { ...recipient, email });
  });
  const targetRecipients = [...unique.values()];
  if (!targetRecipients.length) throw new Error("No students with valid email addresses match this audience.");

  const recipientKeys = targetRecipients.map((recipient) => recipient.email).sort();
  const groupInput = {
    ...input,
    email: "",
    recipientFilter,
    audienceMode: recipientFilter,
    recipientKeys,
    recipientCount: targetRecipients.length,
    sessionId: normalize(session?.id || session?.classSessionId || input.sessionId),
    sessionLabel: normalize(session?.title || session?.sessionLabel || input.sessionLabel),
  };
  const groupRow = buildAnnouncementRow(groupInput);
  await assertNotRecentDuplicate(groupInput, groupRow);
  const fingerprint = buildAnnouncementFingerprint(groupInput, groupRow);

  const settled = await Promise.allSettled(targetRecipients.map((recipient) => saveAnnouncementRow({
    ...input,
    email: recipient.email,
    studentId: normalize(recipient.id || recipient.studentCode),
    studentName: normalize(recipient.name || recipient.studentName),
    deliveryMode: "individual",
    skipDuplicateGuard: true,
    skipHistory: true,
  })));

  const successCount = settled.filter((result) => result.status === "fulfilled" && receiptHasSuccessfulDelivery(result.value)).length;
  const failures = settled
    .map((result, index) => {
      if (result.status === "rejected") {
        return {
          email: targetRecipients[index].email,
          name: normalize(targetRecipients[index].name),
          message: String(result.reason?.message || result.reason || "Delivery failed"),
        };
      }
      if (!receiptHasSuccessfulDelivery(result.value)) {
        return {
          email: targetRecipients[index].email,
          name: normalize(targetRecipients[index].name),
          message: deliveryFailureMessage(result.value),
        };
      }
      return null;
    })
    .filter(Boolean);
  const failureCount = failures.length;
  const status = failureCount === 0 ? "sent" : successCount > 0 ? "partial" : "failed";

  let history = null;
  try {
    history = await writeCommunicationHistory(groupInput, groupRow, {
      sheet: { success: successCount > 0, unverified: false },
    }, {
      fingerprint,
      status,
      recipientFilter,
      recipientCount: targetRecipients.length,
      successCount,
      failureCount,
      sessionId: groupInput.sessionId,
      sessionLabel: groupInput.sessionLabel,
      classId: normalize(input.classId),
    });
  } catch (error) {
    console.warn("Could not save grouped communication history.", error);
  }

  if (!successCount) {
    const error = new Error(`Message delivery failed for all ${targetRecipients.length} selected students.`);
    error.failures = failures;
    throw error;
  }

  return {
    recipientCount: targetRecipients.length,
    successCount,
    failureCount,
    failures,
    status,
    history,
  };
}

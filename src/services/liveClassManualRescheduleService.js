import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../firebase.js";
import { resolveManualRescheduleDateTime } from "../utils/liveClassManualReschedule.js";
import { rescheduleSession as rescheduleSessionDirect } from "./liveClassSessionDirectService.js";
import { submitRescheduleCommunication } from "./liveClassRescheduleCommunicationService.js";

function normalize(value) {
  return String(value || "").trim();
}

export function readVisibleManualRescheduleDateTime(root = typeof document === "undefined" ? null : document) {
  if (!root?.querySelectorAll) return "";
  const inputs = [...root.querySelectorAll('input[type="datetime-local"]')];
  const input = inputs.find((candidate) => {
    if (candidate.disabled || !normalize(candidate.value)) return false;
    const form = candidate.closest?.("form");
    const formText = normalize(form?.textContent);
    return Boolean(form && /Which lessons should move\?|Move only this session|Shift this and following sessions/i.test(formText));
  });
  return normalize(input?.value);
}

async function loadSession(sessionId) {
  const normalizedSessionId = normalize(sessionId);
  if (!normalizedSessionId) throw new Error("Session ID is required.");
  const snap = await getDoc(doc(db, "classSessions", normalizedSessionId));
  if (!snap.exists()) throw new Error("Session not found");
  return { id: snap.id, ...snap.data() };
}

async function loadClassScheduleRules(session = {}, payload = {}) {
  if (Array.isArray(payload.scheduleRules)) return payload.scheduleRules;
  const classId = normalize(payload.classId || session.classId || session.classRecordId);
  if (!classId) return [];
  const snap = await getDoc(doc(db, "classes", classId));
  if (!snap.exists()) return [];
  const rules = snap.data()?.scheduleRules;
  return Array.isArray(rules) ? rules : [];
}

function canConfirmManualOverride() {
  return typeof window !== "undefined" && typeof window.confirm === "function";
}

function resolveWithScheduleProtection({ session, payload, domStartsAt, timezone, scheduleRules }) {
  try {
    return resolveManualRescheduleDateTime({
      currentStartsAt: session.startsAt,
      payload,
      domStartsAt,
      timezone,
      scheduleRules,
    });
  } catch (error) {
    const outsideSchedule = error?.code === "live-class/outside-class-schedule";
    const explicitOverride = payload.manualScheduleOverride === true;
    if (!outsideSchedule || explicitOverride || !canConfirmManualOverride()) throw error;

    const confirmed = window.confirm(
      `${error.message}\n\nManual override will save this one lesson outside the normal class timetable and record it in the audit history. Continue?`,
    );
    if (!confirmed) throw error;

    return resolveManualRescheduleDateTime({
      currentStartsAt: session.startsAt,
      payload: { ...payload, manualScheduleOverride: true },
      domStartsAt,
      timezone,
      scheduleRules,
    });
  }
}

export async function rescheduleSession(sessionId, payload = {}) {
  const session = await loadSession(sessionId);
  const timezone = normalize(payload.timezone) || "Africa/Accra";
  const domStartsAt = normalize(payload.domStartsAt) || readVisibleManualRescheduleDateTime();
  const scheduleRules = await loadClassScheduleRules(session, payload);
  const resolved = resolveWithScheduleProtection({
    session,
    payload,
    domStartsAt,
    timezone,
    scheduleRules,
  });

  const overrideReason = normalize(payload.reason);
  if (resolved.manualScheduleOverride && !overrideReason) {
    const error = new Error("Write a reason before using Manual override outside the class timetable.");
    error.code = "live-class/manual-override-reason-required";
    throw error;
  }

  const adminId = normalize(payload.adminId) || "admin";
  const reason = resolved.manualScheduleOverride
    ? `[Manual timetable override] ${overrideReason}`
    : payload.reason;

  const result = await rescheduleSessionDirect(sessionId, {
    ...payload,
    reason,
    startsAt: resolved.startsAt,
    localDate: resolved.localDate,
    localTime: resolved.localTime,
    manualScheduleOverride: resolved.manualScheduleOverride,
    manualRescheduleInputSource: resolved.source,
    manualRescheduleScheduleRuleApplied: resolved.scheduleRuleApplied,
  });

  if (resolved.manualScheduleOverride) {
    await updateDoc(doc(db, "classSessions", String(sessionId)), {
      manualDateOverride: true,
      manualDateOverrideBy: adminId,
      manualDateOverrideAt: serverTimestamp(),
      manualDateOverrideReason: overrideReason,
      manualDateOverrideStartsAt: result.startsAt || resolved.startsAt,
    });
  }

  const communication = await submitRescheduleCommunication({
    klass: {
      id: normalize(result.classId || payload.classId || session.classId || session.classRecordId),
      name: normalize(payload.className || session.className),
    },
    primarySession: session,
    affectedCount: Number(result.movedSessions || 1),
    startsAt: result.startsAt || resolved.startsAt,
  });

  return {
    ...result,
    ...communication,
    manualScheduleOverride: resolved.manualScheduleOverride,
    manualRescheduleInputSource: resolved.source,
  };
}

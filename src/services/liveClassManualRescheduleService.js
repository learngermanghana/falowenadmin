import { doc, getDoc } from "firebase/firestore";
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

export async function rescheduleSession(sessionId, payload = {}) {
  const session = await loadSession(sessionId);
  const timezone = normalize(payload.timezone) || "Africa/Accra";
  const domStartsAt = normalize(payload.domStartsAt) || readVisibleManualRescheduleDateTime();
  const scheduleRules = await loadClassScheduleRules(session, payload);
  const resolved = resolveManualRescheduleDateTime({
    currentStartsAt: session.startsAt,
    payload,
    domStartsAt,
    timezone,
    scheduleRules,
  });

  const result = await rescheduleSessionDirect(sessionId, {
    ...payload,
    startsAt: resolved.startsAt,
    localDate: resolved.localDate,
    localTime: resolved.localTime,
    manualRescheduleInputSource: resolved.source,
    manualRescheduleScheduleRuleApplied: resolved.scheduleRuleApplied,
  });

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
  };
}

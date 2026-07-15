import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase.js";
import { resolveManualRescheduleDateTime } from "../utils/liveClassManualReschedule.js";
import { rescheduleSession as rescheduleSessionDirect } from "./liveClassSessionDirectService.js";

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

export async function rescheduleSession(sessionId, payload = {}) {
  const session = await loadSession(sessionId);
  const timezone = normalize(payload.timezone) || "Africa/Accra";
  const domStartsAt = normalize(payload.domStartsAt) || readVisibleManualRescheduleDateTime();
  const resolved = resolveManualRescheduleDateTime({
    currentStartsAt: session.startsAt,
    payload,
    domStartsAt,
    timezone,
  });

  return rescheduleSessionDirect(sessionId, {
    ...payload,
    startsAt: resolved.startsAt,
    localDate: resolved.localDate,
    localTime: resolved.localTime,
    manualRescheduleInputSource: resolved.source,
  });
}

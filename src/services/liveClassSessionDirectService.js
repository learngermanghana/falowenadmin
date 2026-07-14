import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase.js";
import { zonedLocalToUtcIso } from "../utils/liveClassScheduling.js";

function normalize(value) {
  return String(value || "").trim();
}

function durationMinutes(payload = {}, session = {}) {
  const explicit = Number(payload.durationMinutes || 0);
  if (Number.isFinite(explicit) && explicit > 0) return Math.max(1, Math.round(explicit));

  const startsAt = new Date(session.startsAt || 0);
  const endsAt = new Date(session.endsAt || 0);
  if (!Number.isNaN(startsAt.getTime()) && !Number.isNaN(endsAt.getTime())) {
    return Math.max(1, Math.round((endsAt.getTime() - startsAt.getTime()) / 60000));
  }

  return 120;
}

function resolveMoveTimes(payload = {}, session = {}) {
  const timezone = normalize(payload.timezone) || "Africa/Accra";
  const localDate = normalize(payload.localDate || payload.date);
  const localTime = normalize(payload.localTime || payload.time);
  const minutes = durationMinutes(payload, session);

  let startsAt = "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(localDate) && /^\d{2}:\d{2}$/.test(localTime)) {
    startsAt = zonedLocalToUtcIso(localDate, localTime, timezone);
  } else {
    const rawStart = normalize(payload.startsAt);
    const localMatch = rawStart.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})$/);
    startsAt = localMatch
      ? zonedLocalToUtcIso(localMatch[1], localMatch[2], timezone)
      : new Date(rawStart).toISOString();
  }

  const startsAtDate = new Date(startsAt);
  if (Number.isNaN(startsAtDate.getTime())) throw new Error("Choose a valid new date and time.");

  return {
    startsAt: startsAtDate.toISOString(),
    endsAt: new Date(startsAtDate.getTime() + minutes * 60000).toISOString(),
    durationMinutes: minutes,
  };
}

async function syncOptionalReferences({ classId, sessionId, patch, changeType, reason }) {
  if (!classId) return ["The session was saved, but its class link is missing."];

  const writes = [
    setDoc(doc(db, "attendance", classId, "sessions", sessionId), {
      classId,
      classSessionId: sessionId,
      startsAt: patch.startsAt || "",
      endsAt: patch.endsAt || "",
      sessionStatus: patch.status,
      cancellationReason: patch.cancellationReason || "",
      updatedAt: serverTimestamp(),
    }, { merge: true }),
    setDoc(doc(db, "classes", classId), {
      lastSessionChangeType: changeType,
      lastChangedSessionId: sessionId,
      lastSessionChangeReason: reason,
      sessionScheduleVersion: Date.now(),
      sessionScheduleUpdatedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true }),
    setDoc(doc(db, "calendarFeeds", classId), {
      classId,
      updatedAt: serverTimestamp(),
    }, { merge: true }),
  ];

  const labels = ["attendance", "class schedule", "calendar feed"];
  const results = await Promise.allSettled(writes);
  return results
    .map((result, index) => result.status === "rejected" ? `${labels[index]} sync failed` : "")
    .filter(Boolean);
}

async function loadSession(sessionId) {
  const sessionRef = doc(db, "classSessions", normalize(sessionId));
  const sessionSnap = await getDoc(sessionRef);
  if (!sessionSnap.exists()) throw new Error("Session not found");
  return { sessionRef, session: { id: sessionSnap.id, ...sessionSnap.data() } };
}

export async function cancelSession(sessionId, payload = {}) {
  const { sessionRef, session } = await loadSession(sessionId);
  const classId = normalize(payload.classId || session.classId || session.classRecordId);
  const reason = normalize(payload.reason);
  const patch = {
    status: "cancelled",
    cancellationReason: reason,
    cancelledBy: payload.adminId || "admin",
    cancelledAt: serverTimestamp(),
    remindersSuppressed: true,
    sequence: Number(session.sequence || 0) + 1,
    updatedAt: serverTimestamp(),
  };

  await updateDoc(sessionRef, patch);
  const syncWarnings = await syncOptionalReferences({
    classId,
    sessionId: session.id,
    patch,
    changeType: "cancelled",
    reason,
  });

  return {
    classId,
    sessionId: session.id,
    status: "cancelled",
    emailSubmitted: false,
    emailMessage: "Student email is no longer part of the save action. Use the Communication tab to notify students.",
    syncWarnings,
  };
}

export async function rescheduleSession(sessionId, payload = {}) {
  const { sessionRef, session } = await loadSession(sessionId);
  const classId = normalize(payload.classId || session.classId || session.classRecordId);
  const reason = normalize(payload.reason);
  const times = resolveMoveTimes(payload, session);
  const patch = {
    previousStartsAt: session.startsAt || "",
    previousEndsAt: session.endsAt || "",
    startsAt: times.startsAt,
    endsAt: times.endsAt,
    status: "scheduled",
    rescheduleReason: reason,
    rescheduledBy: payload.adminId || "admin",
    rescheduledAt: serverTimestamp(),
    remindersSuppressed: false,
    cancellationReason: "",
    sequence: Number(session.sequence || 0) + 1,
    updatedAt: serverTimestamp(),
  };

  await updateDoc(sessionRef, patch);
  const syncWarnings = await syncOptionalReferences({
    classId,
    sessionId: session.id,
    patch,
    changeType: "rescheduled",
    reason,
  });

  return {
    classId,
    sessionId: session.id,
    status: "scheduled",
    startsAt: times.startsAt,
    endsAt: times.endsAt,
    emailSubmitted: false,
    emailMessage: "Student email is no longer part of the save action. Use the Communication tab to notify students.",
    syncWarnings,
  };
}

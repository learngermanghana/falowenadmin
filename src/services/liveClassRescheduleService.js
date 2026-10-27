import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../firebase.js";
import { zonedLocalToUtcIso } from "../utils/liveClassScheduling.js";
import { formatAccraDateTime } from "../utils/liveClassCancellationEmail.js";
import { buildRescheduleAnnouncement } from "../utils/liveClassRescheduleEmail.js";
import { saveAnnouncementRow } from "./communicationService.js";
import { syncClassEndDateFromSessions } from "./liveClassEndDateService.js";
import * as base from "./liveClassServiceBase.js";

function validLocalDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || "").trim());
}

function validLocalTime(value) {
  return /^\d{2}:\d{2}$/.test(String(value || "").trim());
}

function normalizeLocalTime(value) {
  const raw = String(value || "").trim();
  if (!validLocalTime(raw)) return raw;
  const [hourRaw, minuteRaw] = raw.split(":");
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return raw;

  // Falowen evening classes are often typed as 06:00 for 6 PM.
  // When rescheduling from Live Classes, treat early 01:00-07:59 entries as PM.
  if (hour > 0 && hour < 8) return `${String(hour + 12).padStart(2, "0")}:${minuteRaw}`;
  return raw;
}

function durationFromPayload(payload = {}) {
  const explicitMinutes = Number(payload.durationMinutes || 0);
  if (Number.isFinite(explicitMinutes) && explicitMinutes > 0) return Math.max(1, Math.round(explicitMinutes));

  const sourceStart = new Date(payload.startsAt || 0);
  const sourceEnd = new Date(payload.endsAt || 0);
  if (!Number.isNaN(sourceStart.getTime()) && !Number.isNaN(sourceEnd.getTime())) {
    return Math.max(1, Math.round((sourceEnd.getTime() - sourceStart.getTime()) / 60000));
  }

  return 120;
}

function normalizeReschedulePayload(payload = {}, klass = {}) {
  const classTimezone = String(payload.timezone || klass.timezone || "Africa/Accra").trim() || "Africa/Accra";
  const localDate = String(payload.localDate || payload.date || "").trim();
  const localTime = normalizeLocalTime(payload.localTime || payload.time || "");
  const durationMinutes = durationFromPayload(payload);

  if (validLocalDate(localDate) && validLocalTime(localTime)) {
    const startsAt = zonedLocalToUtcIso(localDate, localTime, classTimezone);
    const endsAt = new Date(new Date(startsAt).getTime() + durationMinutes * 60000).toISOString();
    return { ...payload, localDate, localTime, startsAt, endsAt, durationMinutes };
  }

  const rawStart = String(payload.startsAt || "").trim();
  const localMatch = rawStart.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})$/);
  if (localMatch) {
    const startTime = normalizeLocalTime(localMatch[2]);
    const startsAt = zonedLocalToUtcIso(localMatch[1], startTime, classTimezone);
    const endsAt = new Date(new Date(startsAt).getTime() + durationMinutes * 60000).toISOString();
    return { ...payload, localDate: localMatch[1], localTime: startTime, startsAt, endsAt, durationMinutes };
  }

  const sourceStart = new Date(payload.startsAt || 0);
  if (Number.isNaN(sourceStart.getTime())) throw new Error("Choose a valid new date and time.");

  const startsAt = sourceStart.toISOString();
  const endsAt = new Date(sourceStart.getTime() + durationMinutes * 60000).toISOString();
  return { ...payload, startsAt, endsAt, durationMinutes };
}

async function repairSessionClassLink(sessionId, session, resolvedClassId, klass) {
  const nextClassName = String(klass.name || klass.className || session.className || "").trim();
  const hasClassId = String(session.classId || "") === resolvedClassId;
  const hasClassRecordId = String(session.classRecordId || "") === resolvedClassId;
  const hasClassName = String(session.className || "") === nextClassName;
  if (hasClassId && hasClassRecordId && hasClassName) return;
  await updateDoc(doc(db, "classSessions", String(sessionId)), {
    classId: resolvedClassId,
    classRecordId: resolvedClassId,
    className: nextClassName,
  });
}

async function markClassScheduleTouched(classId, sessionId, normalizedPayload) {
  await updateDoc(doc(db, "classes", String(classId)), {
    lastSessionChangeType: "rescheduled",
    lastChangedSessionId: String(sessionId),
    lastSessionChangeReason: String(normalizedPayload.reason || "").trim(),
    lastRescheduledSessionId: String(sessionId),
    lastRescheduledStartsAt: normalizedPayload.startsAt,
    lastRescheduledEndsAt: normalizedPayload.endsAt,
    sessionScheduleVersion: Date.now(),
    sessionScheduleUpdatedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }).catch(() => {});
}

export async function rescheduleSession(sessionId, payload) {
  const sessionSnap = await getDoc(doc(db, "classSessions", String(sessionId)));
  if (!sessionSnap.exists()) throw new Error("Session not found");
  const session = { id: sessionSnap.id, ...sessionSnap.data() };
  const resolvedClassId = String(payload.classId || session.classId || session.classRecordId || "").trim();
  if (!resolvedClassId) throw new Error("This session is missing its class link. Select the class again and retry.");

  const classSnap = await getDoc(doc(db, "classes", resolvedClassId));
  if (!classSnap.exists()) throw new Error("Class not found. Select the class again and retry.");
  const klass = { id: classSnap.id, ...classSnap.data() };
  const normalizedPayload = normalizeReschedulePayload({
    ...payload,
    classId: resolvedClassId,
    classRecordId: resolvedClassId,
    className: klass.name || klass.className || payload.className || session.className || "",
  }, klass);

  await repairSessionClassLink(sessionId, session, resolvedClassId, klass);
  await base.rescheduleSession(sessionId, normalizedPayload);
  await syncClassEndDateFromSessions(resolvedClassId).catch(() => {});
  await markClassScheduleTouched(resolvedClassId, sessionId, normalizedPayload);

  const emailPayload = buildRescheduleAnnouncement({
    klass,
    session,
    previousTime: formatAccraDateTime(session.startsAt),
    newTime: formatAccraDateTime(normalizedPayload.startsAt),
  });

  try {
    const receipt = await saveAnnouncementRow({
      announcement: emailPayload.announcement,
      className: emailPayload.className,
      date: String(normalizedPayload.startsAt || "").slice(0, 10),
      link: "",
      topic: emailPayload.topic,
    });
    return {
      classId: resolvedClassId,
      sessionId,
      status: "scheduled",
      startsAt: normalizedPayload.startsAt,
      endsAt: normalizedPayload.endsAt,
      emailSubmitted: Boolean(receipt?.sheet?.success),
      emailMessage: receipt?.sheet?.message || "",
    };
  } catch (error) {
    return {
      classId: resolvedClassId,
      sessionId,
      status: "scheduled",
      startsAt: normalizedPayload.startsAt,
      endsAt: normalizedPayload.endsAt,
      emailSubmitted: false,
      emailMessage: error?.message || "Communication sheet update failed",
    };
  }
}

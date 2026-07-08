import { collection, doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase.js";
import { zonedLocalToUtcIso } from "../utils/liveClassScheduling.js";
import { formatAccraDateTime } from "../utils/liveClassCancellationEmail.js";
import { saveAnnouncementRow } from "./communicationService.js";
import { syncClassEndDateFromSessions } from "./liveClassEndDateService.js";

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

function lessonLabel(session = {}) {
  const topic = String(session.topic || session.title || session.sessionLabel || "").trim();
  const dayNumber = Number.isFinite(Number(session.curriculumDay)) && Number(session.curriculumDay) >= 0
    ? Number(session.curriculumDay)
    : Number.isFinite(Number(session.curriculumIndex)) && Number(session.curriculumIndex) > 0
      ? Number(session.curriculumIndex) - 1
      : null;
  const assignmentIds = [
    ...(Array.isArray(session.assignmentIds) ? session.assignmentIds : []),
    ...(Array.isArray(session.chapterIds) ? session.chapterIds : []),
    ...(Array.isArray(session.curriculumIds) ? session.curriculumIds : []),
    session.assignment_id,
  ].map((value) => String(value || "").trim().toUpperCase()).filter(Boolean);
  const uniqueAssignments = [...new Set(assignmentIds)];

  const parts = [];
  if (dayNumber !== null) parts.push(`Day ${dayNumber}`);
  if (topic) parts.push(topic.replace(/^Day\s+\d+\s*:\s*/i, ""));
  if (uniqueAssignments.length) parts.push(`Assignment ${uniqueAssignments.join(", ")}`);
  return parts.length ? parts.join(" — ") : "Selected lesson";
}

function normalizeAssignmentIds(session = {}) {
  const ids = [session.assignmentIds, session.chapterIds, session.curriculumIds]
    .find((value) => Array.isArray(value) && value.length) || [];
  return ids.map((value) => String(value || "").trim().toUpperCase()).filter(Boolean);
}

function attendanceMetadata(klass = {}, session = {}, patch = {}) {
  const merged = { ...session, ...patch };
  const assignmentIds = normalizeAssignmentIds(merged);
  return {
    classId: merged.classId || klass.id || "",
    className: merged.className || klass.name || "",
    classSessionId: session.id || "",
    title: String(merged.topic || klass.name || merged.className || "Live class").trim(),
    topic: String(merged.topic || "").trim(),
    date: String(merged.startsAt || "").slice(0, 10),
    startsAt: merged.startsAt || "",
    endsAt: merged.endsAt || "",
    sessionStatus: merged.status || "rescheduled",
    cancellationReason: "",
    assignmentIds,
    chapterIds: assignmentIds,
    curriculumIds: assignmentIds,
    assignment_id: assignmentIds[0] || "",
    curriculumIndex: Number(merged.curriculumIndex || 0),
    curriculumDay: Number(merged.curriculumDay ?? -1),
    curriculumTaskCount: Number(merged.curriculumTaskCount || assignmentIds.length),
    curriculumSource: String(merged.curriculumSource || ""),
    curriculumVersion: Number(merged.curriculumVersion || 0),
    updatedAt: serverTimestamp(),
  };
}

async function writeRescheduledSession(sessionId, session, klass, payload) {
  const className = String(klass.name || payload.className || session.className || "Falowen class").trim();
  const patch = {
    classId: payload.classId,
    className,
    previousStartsAt: session.startsAt || "",
    previousEndsAt: session.endsAt || "",
    startsAt: payload.startsAt,
    endsAt: payload.endsAt,
    status: "rescheduled",
    rescheduleReason: String(payload.reason || "").trim(),
    rescheduledBy: payload.adminId || "admin",
    rescheduledAt: serverTimestamp(),
    sequence: Number(session.sequence || 0) + 1,
    remindersSuppressed: false,
    cancellationReason: "",
    updatedAt: serverTimestamp(),
  };

  await updateDoc(doc(db, "classSessions", String(sessionId)), patch);
  await setDoc(doc(db, "attendance", payload.classId, "sessions", String(sessionId)), attendanceMetadata(klass, session, patch), { merge: true });
  await setDoc(doc(collection(db, "auditLogs")), {
    type: "classSession.rescheduled",
    classId: payload.classId,
    sessionId,
    actorId: payload.adminId || "admin",
    reason: patch.rescheduleReason,
    createdAt: serverTimestamp(),
  });
  await setDoc(doc(collection(db, "studentNotifications")), {
    type: "classSession.rescheduled",
    classId: payload.classId,
    sessionId,
    title: "Live class rescheduled",
    body: patch.rescheduleReason || "A live class session was rescheduled.",
    createdAt: serverTimestamp(),
  });
  await setDoc(doc(db, "calendarFeeds", payload.classId), {
    classId: payload.classId,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function rescheduleSession(sessionId, payload) {
  const sessionSnap = await getDoc(doc(db, "classSessions", String(sessionId)));
  if (!sessionSnap.exists()) throw new Error("Session not found");
  const session = { id: sessionSnap.id, ...sessionSnap.data() };
  const resolvedClassId = String(payload.classId || session.classId || "").trim();
  if (!resolvedClassId) throw new Error("This session is missing its class link. Select the class again and retry.");

  const classSnap = await getDoc(doc(db, "classes", resolvedClassId));
  const klass = classSnap.exists()
    ? { id: classSnap.id, ...classSnap.data() }
    : { id: resolvedClassId, name: payload.className || session.className || "Falowen class", timezone: "Africa/Accra" };
  const normalizedPayload = normalizeReschedulePayload({ ...payload, classId: resolvedClassId, className: klass.name || payload.className || session.className || "" }, klass);

  await writeRescheduledSession(sessionId, session, klass, normalizedPayload);
  await syncClassEndDateFromSessions(resolvedClassId).catch(() => {});

  const className = String(klass.name || session.className || "Falowen class").trim();
  const lesson = lessonLabel(session);
  const oldTime = formatAccraDateTime(session.startsAt);
  const newTime = formatAccraDateTime(normalizedPayload.startsAt);
  const subject = `Class Rescheduled: ${className} — ${lesson} — ${newTime}`;
  const announcement = [
    `Hello everyone, the ${className} live class has been rescheduled.`,
    `Lesson: ${lesson}`,
    `Previous time: ${oldTime}`,
    `New time: ${newTime}`,
    "Please check your Falowen homepage for the updated class time.",
  ].join("\n\n");

  try {
    const receipt = await saveAnnouncementRow({
      announcement,
      className,
      date: String(normalizedPayload.startsAt || "").slice(0, 10),
      link: "",
      topic: subject,
    });
    return {
      sessionId,
      classId: resolvedClassId,
      startsAt: normalizedPayload.startsAt,
      endsAt: normalizedPayload.endsAt,
      emailSubmitted: Boolean(receipt?.sheet?.success),
      emailMessage: receipt?.sheet?.message || "",
    };
  } catch (error) {
    return {
      sessionId,
      classId: resolvedClassId,
      startsAt: normalizedPayload.startsAt,
      endsAt: normalizedPayload.endsAt,
      emailSubmitted: false,
      emailMessage: error?.message || "Communication sheet update failed",
    };
  }
}

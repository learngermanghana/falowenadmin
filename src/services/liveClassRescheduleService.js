import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase.js";
import { zonedLocalToUtcIso } from "../utils/liveClassScheduling.js";
import { formatAccraDateTime } from "../utils/liveClassCancellationEmail.js";
import { saveAnnouncementRow } from "./communicationService.js";
import { syncClassEndDateFromSessions } from "./liveClassEndDateService.js";
import * as base from "./liveClassServiceBase.js";

function validLocalDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || "").trim());
}

function validLocalTime(value) {
  return /^\d{2}:\d{2}$/.test(String(value || "").trim());
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
  const localTime = String(payload.localTime || payload.time || "").trim();
  const durationMinutes = durationFromPayload(payload);

  if (validLocalDate(localDate) && validLocalTime(localTime)) {
    const startsAt = zonedLocalToUtcIso(localDate, localTime, classTimezone);
    const endsAt = new Date(new Date(startsAt).getTime() + durationMinutes * 60000).toISOString();
    return { ...payload, startsAt, endsAt, durationMinutes };
  }

  const rawStart = String(payload.startsAt || "").trim();
  const localMatch = rawStart.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})$/);
  if (localMatch) {
    const startsAt = zonedLocalToUtcIso(localMatch[1], localMatch[2], classTimezone);
    const endsAt = new Date(new Date(startsAt).getTime() + durationMinutes * 60000).toISOString();
    return { ...payload, startsAt, endsAt, durationMinutes };
  }

  const sourceStart = new Date(payload.startsAt || 0);
  if (Number.isNaN(sourceStart.getTime())) throw new Error("Choose a valid new date and time.");

  const startsAt = sourceStart.toISOString();
  const endsAt = new Date(sourceStart.getTime() + durationMinutes * 60000).toISOString();
  return { ...payload, startsAt, endsAt, durationMinutes };
}

export async function rescheduleSession(sessionId, payload) {
  const sessionSnap = await getDoc(doc(db, "classSessions", String(sessionId)));
  if (!sessionSnap.exists()) throw new Error("Session not found");
  const session = { id: sessionSnap.id, ...sessionSnap.data() };
  const classSnap = await getDoc(doc(db, "classes", String(session.classId)));
  const klass = classSnap.exists()
    ? { id: classSnap.id, ...classSnap.data() }
    : { id: session.classId, name: session.className || "Falowen class", timezone: "Africa/Accra" };
  const normalizedPayload = normalizeReschedulePayload(payload, klass);

  await base.rescheduleSession(sessionId, normalizedPayload);
  await base.updateSession(sessionId, { status: "rescheduled" });
  await syncClassEndDateFromSessions(session.classId).catch(() => {});

  const className = String(klass.name || session.className || "Falowen class").trim();
  const oldTime = formatAccraDateTime(session.startsAt);
  const newTime = formatAccraDateTime(normalizedPayload.startsAt);
  const subject = `Class Rescheduled: ${className} – ${newTime}`;
  const announcement = [
    `Hello everyone, the ${className} live class has been rescheduled.`,
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
      startsAt: normalizedPayload.startsAt,
      endsAt: normalizedPayload.endsAt,
      emailSubmitted: Boolean(receipt?.sheet?.success),
      emailMessage: receipt?.sheet?.message || "",
    };
  } catch (error) {
    return {
      sessionId,
      startsAt: normalizedPayload.startsAt,
      endsAt: normalizedPayload.endsAt,
      emailSubmitted: false,
      emailMessage: error?.message || "Communication sheet update failed",
    };
  }
}

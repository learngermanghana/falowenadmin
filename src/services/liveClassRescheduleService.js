import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase.js";
import { zonedLocalToUtcIso } from "../utils/liveClassScheduling.js";
import { formatAccraDateTime } from "../utils/liveClassCancellationEmail.js";
import { saveAnnouncementRow } from "./communicationService.js";
import { syncClassEndDateFromSessions } from "./liveClassEndDateService.js";
import * as base from "./liveClassServiceBase.js";

function deviceTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Africa/Accra";
  } catch {
    return "Africa/Accra";
  }
}

function wallClockParts(value, timezone) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    date: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}:${values.minute}`,
  };
}

function normalizeReschedulePayload(payload = {}, klass = {}) {
  const sourceStart = new Date(payload.startsAt || 0);
  const sourceEnd = new Date(payload.endsAt || 0);
  if (Number.isNaN(sourceStart.getTime())) throw new Error("Choose a valid new date and time.");

  const durationMinutes = Number.isNaN(sourceEnd.getTime())
    ? 60
    : Math.max(1, Math.round((sourceEnd.getTime() - sourceStart.getTime()) / 60000));
  const classTimezone = String(klass.timezone || "Africa/Accra").trim() || "Africa/Accra";
  const wallClock = wallClockParts(sourceStart, deviceTimezone());
  if (!wallClock) throw new Error("Choose a valid new date and time.");

  const startsAt = zonedLocalToUtcIso(wallClock.date, wallClock.time, classTimezone);
  const endsAt = new Date(new Date(startsAt).getTime() + durationMinutes * 60000).toISOString();
  return { ...payload, startsAt, endsAt };
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

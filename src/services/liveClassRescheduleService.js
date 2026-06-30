import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase.js";
import { formatAccraDateTime } from "../utils/liveClassCancellationEmail.js";
import { saveAnnouncementRow } from "./communicationService.js";
import { syncClassEndDateFromSessions } from "./liveClassEndDateService.js";
import * as base from "./liveClassServiceBase.js";

export async function rescheduleSession(sessionId, payload) {
  const sessionSnap = await getDoc(doc(db, "classSessions", String(sessionId)));
  if (!sessionSnap.exists()) throw new Error("Session not found");
  const session = { id: sessionSnap.id, ...sessionSnap.data() };
  const classSnap = await getDoc(doc(db, "classes", String(session.classId)));
  const klass = classSnap.exists()
    ? { id: classSnap.id, ...classSnap.data() }
    : { id: session.classId, name: session.className || "Falowen class" };

  await base.rescheduleSession(sessionId, payload);
  await syncClassEndDateFromSessions(session.classId).catch(() => {});

  const className = String(klass.name || session.className || "Falowen class").trim();
  const oldTime = formatAccraDateTime(session.startsAt);
  const newTime = formatAccraDateTime(payload.startsAt);
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
      date: String(payload.startsAt || "").slice(0, 10),
      link: "",
      topic: subject,
    });
    return {
      sessionId,
      emailSubmitted: Boolean(receipt?.sheet?.success),
      emailMessage: receipt?.sheet?.message || "",
    };
  } catch (error) {
    return {
      sessionId,
      emailSubmitted: false,
      emailMessage: error?.message || "Communication sheet update failed",
    };
  }
}

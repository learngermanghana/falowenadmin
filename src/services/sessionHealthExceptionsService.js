import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase.js";

function text(value) {
  return String(value ?? "").trim();
}

export async function loadSessionOperationalState({ classId, sessions = [] } = {}) {
  const safeClassId = text(classId);
  if (!safeClassId) {
    return { attendanceBySessionId: {}, checkins: [], checkinLoadFailures: [] };
  }

  const attendanceSnap = await getDocs(collection(db, "attendance", safeClassId, "sessions"));
  const attendanceBySessionId = {};
  attendanceSnap.forEach((item) => {
    attendanceBySessionId[item.id] = { id: item.id, ...item.data() };
  });

  const sessionIds = [...new Set([
    ...sessions.map((session) => text(session?.id)),
    ...Object.keys(attendanceBySessionId),
  ].filter(Boolean))];

  const results = await Promise.allSettled(sessionIds.map(async (sessionId) => {
    const snap = await getDocs(collection(db, "attendance", safeClassId, "sessions", sessionId, "checkins"));
    return snap.docs.map((item) => ({
      id: item.id,
      sessionId,
      classId: safeClassId,
      ...item.data(),
    }));
  }));

  const checkins = [];
  const checkinLoadFailures = [];
  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      checkins.push(...result.value);
      return;
    }
    checkinLoadFailures.push({
      sessionId: sessionIds[index],
      message: result.reason?.message || String(result.reason || "Could not read check-in records"),
    });
  });

  return { attendanceBySessionId, checkins, checkinLoadFailures };
}

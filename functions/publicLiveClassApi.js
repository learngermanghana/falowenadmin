"use strict";

function text(value) {
  return String(value || "").trim();
}

function toDate(value) {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  if (typeof value?.seconds === "number") return new Date(Number(value.seconds) * 1000);
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toIso(value) {
  return toDate(value)?.toISOString() || null;
}

function idsFrom(row = {}) {
  const arrays = [row.assignmentIds, row.chapterIds, row.curriculumIds];
  const values = arrays.find((candidate) => Array.isArray(candidate) && candidate.length)
    || (row.assignment_id || row.assignmentId ? [row.assignment_id || row.assignmentId] : []);
  return [...new Set(values.map(text).filter(Boolean))];
}

function sanitizeSession(row = {}, attendance = null) {
  const canonicalAttendanceIds = attendance ? idsFrom(attendance) : [];
  const assignmentIds = canonicalAttendanceIds.length ? canonicalAttendanceIds : idsFrom(row);
  const topic = text(attendance?.title || attendance?.topic || row.topic || row.title || row.sessionLabel || "Live class");
  return {
    id: text(row.id || attendance?.id),
    classId: text(row.classId || row.classRecordId || attendance?.classId),
    classRecordId: text(row.classRecordId || row.classId || attendance?.classId),
    className: text(row.className || attendance?.className),
    startsAt: toIso(row.startsAt || row.startAt || row.startDateTime || attendance?.startsAt || attendance?.classStartsAt),
    endsAt: toIso(row.endsAt || row.endAt || row.endDateTime || attendance?.endsAt || attendance?.classEndsAt),
    previousStartsAt: toIso(row.previousStartsAt || row.originalStartsAt),
    status: text(row.status || attendance?.sessionStatus || "scheduled").toLowerCase(),
    topic,
    title: topic,
    assignmentIds,
    chapterIds: assignmentIds,
    curriculumIds: assignmentIds,
    assignment_id: assignmentIds[0] || "",
    curriculumDay: Number.isFinite(Number(row.curriculumDay)) ? Number(row.curriculumDay) : null,
    curriculumIndex: Number.isFinite(Number(row.curriculumIndex)) ? Number(row.curriculumIndex) : null,
    curriculumSource: text(row.curriculumSource || attendance?.curriculumSource),
    curriculumVersion: Number(row.curriculumVersion || attendance?.curriculumVersion || 0),
    cancellationReason: text(row.cancellationReason),
    rescheduleReason: text(row.rescheduleReason),
    rescheduledAt: toIso(row.rescheduledAt),
  };
}

function activeForNext(session = {}, nowMs = Date.now()) {
  const status = text(session.status).toLowerCase();
  if (["cancelled", "superseded", "deleted"].includes(status)) return false;
  const end = toDate(session.endsAt)?.getTime() || 0;
  const start = toDate(session.startsAt)?.getTime() || 0;
  return Boolean(start && (!end || end >= nowMs));
}

async function querySessions(db, field, classId) {
  const snapshot = await db.collection("classSessions").where(field, "==", classId).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

async function readAttendance(db, classId) {
  try {
    const snapshot = await db.collection("attendance").doc(classId).collection("sessions").get();
    return new Map(snapshot.docs.map((doc) => [doc.id, { id: doc.id, ...doc.data() }]));
  } catch {
    return new Map();
  }
}

async function readZoom(db, klass = {}) {
  const profileId = text(klass.zoomProfileId);
  if (!profileId) return null;
  try {
    const snapshot = await db.collection("zoomProfiles").doc(profileId).get();
    if (!snapshot.exists) return null;
    const value = snapshot.data() || {};
    return {
      url: text(value.url || value.joinUrl || value.joinURL),
      meetingId: text(value.meetingId || value.meetingID),
      passcode: text(value.passcode || value.password),
    };
  } catch {
    return null;
  }
}

function registerPublicLiveClassApi(app, { db }) {
  app.get("/public-live-class", async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Cache-Control", "no-store, max-age=0");
    try {
      const classId = text(req.query.classId);
      if (!classId || classId.length > 160) {
        return res.status(400).json({ ok: false, error: "A valid classId is required" });
      }

      const classSnapshot = await db.collection("classes").doc(classId).get();
      if (!classSnapshot.exists) return res.status(404).json({ ok: false, error: "Class not found" });
      const klass = { id: classSnapshot.id, ...classSnapshot.data() };

      const [byClassId, byRecordId, attendanceById, zoom] = await Promise.all([
        querySessions(db, "classId", classId).catch(() => []),
        querySessions(db, "classRecordId", classId).catch(() => []),
        readAttendance(db, classId),
        readZoom(db, klass),
      ]);

      const merged = new Map();
      [...byClassId, ...byRecordId].forEach((session) => merged.set(session.id, session));
      const sessions = [...merged.values()]
        .filter((session) => session.superseded !== true && text(session.status).toLowerCase() !== "superseded")
        .map((session) => sanitizeSession(session, attendanceById.get(session.id)))
        .filter((session) => session.startsAt)
        .sort((left, right) => new Date(left.startsAt) - new Date(right.startsAt));

      const now = new Date();
      const nextSession = sessions.find((session) => activeForNext(session, now.getTime())) || null;
      const completed = sessions.filter((session) => text(session.status).toLowerCase() === "completed" && new Date(session.endsAt || session.startsAt) < now);
      const latestCompletedSession = completed[completed.length - 1] || null;

      return res.json({
        ok: true,
        source: "falowen-admin-public-api",
        serverNow: now.toISOString(),
        klass: {
          id: classSnapshot.id,
          classId: classSnapshot.id,
          name: text(klass.name || klass.className),
          className: text(klass.className || klass.name),
          levelId: text(klass.levelId || klass.level),
          level: text(klass.level || klass.levelId),
          timezone: text(klass.timezone) || "Africa/Accra",
          status: text(klass.status),
          startDate: toIso(klass.startDate) || text(klass.startDate),
          endDate: toIso(klass.endDate) || text(klass.endDate),
        },
        sessions,
        nextSession,
        latestCompletedSession,
        cancelledSessions: sessions.filter((session) => text(session.status).toLowerCase() === "cancelled"),
        zoom,
      });
    } catch (error) {
      console.error("public_live_class_failed", error);
      return res.status(500).json({ ok: false, error: "Could not load the live class timetable" });
    }
  });
}

module.exports = { registerPublicLiveClassApi, sanitizeSession };

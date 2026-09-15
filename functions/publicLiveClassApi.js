"use strict";

function text(value) {
  return String(value || "").trim();
}

function optionalInteger(value) {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
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

function identifiersFor(classId, klass = {}) {
  return [...new Set([
    classId,
    klass.id,
    klass.name,
    klass.classId,
    klass.className,
    klass.slug,
  ].map(text).filter(Boolean))];
}

function belongsToSelectedClass(session = {}, classId = "", aliases = []) {
  const acceptedIds = new Set([classId, ...aliases].map(text).filter(Boolean));
  const classRecordId = text(session.classRecordId);
  const legacyClassId = text(session.classId);

  // Match Admin's compatibility ownership rule: an explicit canonical owner is
  // authoritative, while older name/slug identities remain readable only when
  // no conflicting classRecordId points at another cohort.
  if (classRecordId) return acceptedIds.has(classRecordId);
  if (!legacyClassId) return true;
  return acceptedIds.has(legacyClassId);
}

function sanitizeSession(row = {}, attendance = null) {
  const canonicalAttendanceIds = attendance ? idsFrom(attendance) : [];
  const assignmentIds = canonicalAttendanceIds.length ? canonicalAttendanceIds : idsFrom(row);
  const topic = text(attendance?.title || attendance?.topic || row.topic || row.title || row.sessionLabel || "Live class");
  const curriculumDay = optionalInteger(attendance?.curriculumDay ?? row.curriculumDay);
  const curriculumIndex = optionalInteger(attendance?.curriculumIndex ?? row.curriculumIndex);
  return {
    id: text(row.id || attendance?.id),
    classId: text(row.classId || row.classRecordId || attendance?.classId),
    classRecordId: text(row.classRecordId || attendance?.classId),
    className: text(row.className || attendance?.className),
    startsAt: toIso(attendance?.startsAt || attendance?.classStartsAt || row.startsAt || row.startAt || row.startDateTime),
    endsAt: toIso(attendance?.endsAt || attendance?.classEndsAt || row.endsAt || row.endAt || row.endDateTime),
    previousStartsAt: toIso(row.previousStartsAt || row.originalStartsAt),
    status: text(attendance?.sessionStatus || row.status || "scheduled").toLowerCase(),
    topic,
    title: topic,
    assignmentIds,
    chapterIds: assignmentIds,
    curriculumIds: assignmentIds,
    assignment_id: assignmentIds[0] || "",
    curriculumDay,
    curriculumIndex,
    curriculumSource: text(attendance?.curriculumSource || row.curriculumSource),
    curriculumVersion: Number(attendance?.curriculumVersion || row.curriculumVersion || 0),
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

async function querySessions(db, field, identifier) {
  const snapshot = await db.collection("classSessions").where(field, "==", identifier).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

async function readAttendanceParent(db, parentId) {
  try {
    const snapshot = await db.collection("attendance").doc(parentId).collection("sessions").get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch {
    return [];
  }
}

async function loadCompatibleSessions(db, classId, klass = {}) {
  const aliases = identifiersFor(classId, klass);
  const lookups = aliases.flatMap((identifier) =>
    ["classId", "classRecordId", "className"].map((field) => querySessions(db, field, identifier)),
  );
  const results = await Promise.allSettled(lookups);
  const found = new Map();
  results.forEach((result) => {
    if (result.status !== "fulfilled") return;
    result.value.forEach((session) => found.set(session.id, session));
  });

  return [...found.values()]
    .filter((session) => session.superseded !== true && text(session.status).toLowerCase() !== "superseded")
    .filter((session) => belongsToSelectedClass(session, classId, aliases));
}

async function loadCompatibleAttendance(db, classId, klass = {}) {
  const aliases = identifiersFor(classId, klass);
  const results = await Promise.allSettled(aliases.map((identifier) => readAttendanceParent(db, identifier)));
  const found = new Map();

  // Legacy/name parents are discovery fallbacks. Exact canonical parent wins if
  // the same session has also been mirrored under classes/{classId} attendance.
  results.forEach((result) => {
    if (result.status !== "fulfilled") return;
    result.value.forEach((session) => {
      if (!found.has(session.id)) found.set(session.id, session);
    });
  });
  const exact = await readAttendanceParent(db, classId);
  exact.forEach((session) => found.set(session.id, session));
  return found;
}

function sessionPreference(session = {}, classId = "") {
  let score = 0;
  if (text(session.classId) === text(classId)) score += 8;
  if (text(session.classRecordId) === text(classId)) score += 4;
  if (idsFrom(session).length) score += 2;
  if (text(session.topic || session.title)) score += 1;
  if (text(session.status).toLowerCase() === "rescheduled" || session.manualDateOverride === true || session.previousStartsAt) score += 16;
  return score;
}

function curriculumIdentity(session = {}) {
  const ids = idsFrom(session).map((value) => value.toUpperCase()).sort();
  if (ids.length) return `assign:${ids.join("|")}`;
  const day = optionalInteger(session.curriculumDay);
  if (day !== null) return `day:${day}`;
  const index = optionalInteger(session.curriculumIndex);
  return index !== null ? `index:${index}` : "unknown";
}

function dedupeCompatibleSessions(sessions = [], classId = "") {
  const groups = new Map();
  sessions.forEach((session) => {
    const start = toDate(session.startsAt)?.getTime() || 0;
    const key = start ? `${start}:${curriculumIdentity(session)}` : `id:${session.id}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(session);
  });
  return [...groups.values()]
    .map((group) => [...group].sort((left, right) =>
      sessionPreference(right, classId) - sessionPreference(left, classId)
      || text(left.id).localeCompare(text(right.id))
    )[0])
    .filter(Boolean)
    .sort((left, right) => (toDate(left.startsAt)?.getTime() || 0) - (toDate(right.startsAt)?.getTime() || 0));
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

      const [rawSessions, attendanceById] = await Promise.all([
        loadCompatibleSessions(db, classId, klass),
        loadCompatibleAttendance(db, classId, klass),
      ]);

      const sessions = dedupeCompatibleSessions(rawSessions, classId)
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
      });
    } catch (error) {
      console.error("public_live_class_failed", error);
      return res.status(500).json({ ok: false, error: "Could not load the live class timetable" });
    }
  });
}

module.exports = {
  registerPublicLiveClassApi,
  sanitizeSession,
  identifiersFor,
  belongsToSelectedClass,
  dedupeCompatibleSessions,
};

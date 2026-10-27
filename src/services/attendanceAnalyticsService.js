import {
  listClassCheckins,
  loadAttendanceFromFirestore,
} from "./attendanceService.js";
import { getCompatibleClassDashboard } from "./liveClassCompatibilityService.js";
import { listStudentsByClass } from "./studentsService.js";
import { buildAttendanceAnalytics } from "../utils/attendanceAnalytics.js";

function normalize(value) {
  return String(value || "").trim();
}

export async function loadClassAttendanceAnalytics({
  classId,
  className = "",
  sessions,
  students,
  klass,
  now = new Date(),
} = {}) {
  const resolvedClassId = normalize(classId || klass?.id || klass?.classRecordId);
  if (!resolvedClassId) throw new Error("Select a class to load attendance tracking.");

  let dashboard = null;
  let resolvedSessions = Array.isArray(sessions) && sessions.length ? sessions : null;
  let resolvedClass = klass || null;
  if (!resolvedSessions || !resolvedClass) {
    dashboard = await getCompatibleClassDashboard(resolvedClassId);
    resolvedSessions = resolvedSessions || dashboard.sessions || [];
    resolvedClass = resolvedClass || dashboard.klass || {};
  }

  const resolvedClassName = normalize(className || resolvedClass?.name || resolvedClass?.className || resolvedClassId);
  const resolvedStudents = Array.isArray(students)
    ? students
    : await listStudentsByClass(resolvedClassId, { className: resolvedClassName });

  const [attendanceById, attendanceByName, checkins] = await Promise.all([
    loadAttendanceFromFirestore(resolvedClassId).catch(() => ({})),
    resolvedClassName && resolvedClassName !== resolvedClassId
      ? loadAttendanceFromFirestore(resolvedClassName).catch(() => ({}))
      : {},
    listClassCheckins({
      classId: resolvedClassId,
      className: resolvedClassName,
      sessionIds: resolvedSessions.map((session) => normalize(session.id || session.classSessionId)).filter(Boolean),
    }).catch(() => []),
  ]);

  const attendanceBySession = { ...attendanceByName, ...attendanceById };
  const analytics = buildAttendanceAnalytics({
    sessions: resolvedSessions,
    students: resolvedStudents,
    attendanceBySession,
    checkins,
    now,
    timezone: resolvedClass?.timezone || "Africa/Accra",
  });

  return {
    klass: resolvedClass,
    sessions: resolvedSessions,
    students: resolvedStudents,
    attendanceBySession,
    checkins,
    analytics,
  };
}

const DEFAULT_TIMEZONE = "Africa/Accra";
export const DEFAULT_LATE_MINUTES = 15;

function normalize(value) {
  return String(value ?? "").trim();
}

function comparable(value) {
  return normalize(value).toLowerCase().replace(/\s+/g, " ");
}

export function attendanceDate(value) {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  if (typeof value?.toMillis === "function") return new Date(value.toMillis());
  if (typeof value === "object" && Number.isFinite(value.seconds)) {
    return new Date((Number(value.seconds) * 1000) + Math.round(Number(value.nanoseconds || 0) / 1000000));
  }
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function attendanceDateKey(value, timezone = DEFAULT_TIMEZONE) {
  const date = attendanceDate(value);
  if (!date) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function studentName(student = {}) {
  return normalize(student.name || student.displayName || student.studentCode || student.studentcode || student.email || student.id) || "Student";
}

function studentCode(student = {}) {
  return normalize(student.studentCode || student.studentcode || student.uid || student.id || student.email || student.name);
}

function studentAliases(student = {}) {
  const strong = [
    student.id,
    student.uid,
    student.studentCode,
    student.studentcode,
    student.email,
  ].map(comparable).filter(Boolean);
  if (strong.length) return new Set(strong);
  return new Set([student.name, student.displayName].map(comparable).filter(Boolean));
}

function savedAliases(code, entry = {}) {
  return new Set([
    code,
    entry.id,
    entry.uid,
    entry.studentCode,
    entry.studentcode,
    entry.email,
    entry.name,
  ].map(comparable).filter(Boolean));
}

function checkinAliases(checkin = {}) {
  return new Set([
    checkin.id,
    checkin.uid,
    checkin.studentCode,
    checkin.studentcode,
    checkin.email,
    checkin.name,
  ].map(comparable).filter(Boolean));
}

function intersects(left = new Set(), right = new Set()) {
  for (const value of left) if (right.has(value)) return true;
  return false;
}

function normalizeStatus(value) {
  const status = comparable(value);
  if (["present", "checked in", "checked-in", "attended"].includes(status)) return "present";
  if (["late", "tardy"].includes(status)) return "late";
  if (["excused", "excused absence", "permission"].includes(status)) return "excused";
  if (["absent", "missing"].includes(status)) return "absent";
  return status;
}

function activeSessionStatus(session = {}) {
  return comparable(session.status || session.sessionStatus || "scheduled");
}

function sessionIdentity(session = {}) {
  return normalize(session.id || session.classSessionId || session.sessionId || session.date);
}

function sessionTopic(session = {}) {
  const assignment = normalize(session.assignmentIds?.[0] || session.assignmentId || session.assignment_id);
  const topic = normalize(session.topic || session.title || session.sessionLabel || session.lesson) || "Class session";
  return assignment ? `${assignment} — ${topic}` : topic;
}

function sessionStart(session = {}) {
  return attendanceDate(session.startsAt)
    || (/^\d{4}-\d{2}-\d{2}$/.test(normalize(session.date)) ? new Date(`${session.date}T${normalize(session.startTime) || "00:00"}:00Z`) : null);
}

function sessionEnd(session = {}) {
  return attendanceDate(session.endsAt);
}

function findAttendanceDoc(attendanceBySession = {}, session = {}) {
  const id = sessionIdentity(session);
  if (id && attendanceBySession[id]) return attendanceBySession[id];
  return Object.values(attendanceBySession).find((entry) => normalize(entry?.classSessionId || entry?.sessionId) === id) || {};
}

function findSavedStudent(savedStudents = {}, aliases = new Set()) {
  for (const [code, entry] of Object.entries(savedStudents || {})) {
    if (intersects(aliases, savedAliases(code, entry))) return { code, ...entry };
  }
  return null;
}

function findCheckin(checkins = [], aliases = new Set()) {
  const matches = checkins.filter((checkin) => intersects(aliases, checkinAliases(checkin)));
  return matches.sort((left, right) => {
    const leftAt = attendanceDate(left.checkedInAt || left.submittedAt || left.createdAt)?.getTime() || Number.MAX_SAFE_INTEGER;
    const rightAt = attendanceDate(right.checkedInAt || right.submittedAt || right.createdAt)?.getTime() || Number.MAX_SAFE_INTEGER;
    return leftAt - rightAt;
  })[0] || null;
}

function checkinMethod(checkin = {}, saved = {}) {
  const method = comparable(checkin.method || checkin.source || saved.method || saved.source);
  if (!method) return saved?.present ? "Manual" : "";
  if (method.includes("qr") || method.includes("self_checkin") || method.includes("self checkin")) return "QR";
  if (method.includes("manual")) return "Manual";
  return normalize(checkin.method || checkin.source || saved.method || saved.source);
}

function formatCheckinIso(checkin = {}, saved = {}) {
  const value = checkin.checkedInAt || checkin.submittedAt || checkin.createdAt || saved.checkedInAt || saved.submittedAt;
  return attendanceDate(value)?.toISOString() || "";
}

function statusForRecord({ session, saved, checkin, nowDate, lateMinutes }) {
  const status = activeSessionStatus(session);
  if (status === "cancelled" || status === "canceled") return "cancelled";

  const startsAt = sessionStart(session);
  const completed = status === "completed";
  const live = status === "live";
  const held = completed || live || Boolean(startsAt && startsAt.getTime() <= nowDate.getTime());
  if (!held) return "upcoming";

  const explicit = normalizeStatus(saved?.status || saved?.attendanceStatus);
  if (explicit === "excused") return "excused";
  if (explicit === "late") return "late";

  const checkedAt = attendanceDate(checkin?.checkedInAt || checkin?.submittedAt || checkin?.createdAt);
  if (checkin && checkedAt && startsAt && checkedAt.getTime() > startsAt.getTime() + lateMinutes * 60000) return "late";
  if (checkin || saved?.present === true || explicit === "present") return "present";
  return "absent";
}

function trailingAbsences(records = []) {
  let count = 0;
  const held = records
    .filter((record) => ["present", "late", "absent", "excused"].includes(record.status))
    .sort((left, right) => (right.startsAtMs || 0) - (left.startsAtMs || 0));
  for (const record of held) {
    if (record.status !== "absent") break;
    count += 1;
  }
  return count;
}

function percentage(attended, eligible) {
  if (!eligible) return 0;
  return Math.round((attended / eligible) * 100);
}

export function buildAttendanceAnalytics({
  sessions = [],
  students = [],
  attendanceBySession = {},
  checkins = [],
  now = new Date(),
  timezone = DEFAULT_TIMEZONE,
  lateMinutes = DEFAULT_LATE_MINUTES,
} = {}) {
  const nowDate = attendanceDate(now) || new Date();
  const roster = students.map((student, index) => ({
    student,
    key: studentCode(student) || `student-${index + 1}`,
    code: studentCode(student),
    name: studentName(student),
    email: normalize(student.email),
    aliases: studentAliases(student),
  }));

  const checkinsBySession = new Map();
  checkins.forEach((checkin) => {
    const sessionId = normalize(checkin.sessionId || checkin.classSessionId);
    if (!sessionId) return;
    if (!checkinsBySession.has(sessionId)) checkinsBySession.set(sessionId, []);
    checkinsBySession.get(sessionId).push(checkin);
  });

  const records = [];
  const sessionSummaries = [];
  const orderedSessions = [...sessions].sort((left, right) => (sessionStart(left)?.getTime() || 0) - (sessionStart(right)?.getTime() || 0));

  orderedSessions.forEach((session) => {
    const id = sessionIdentity(session);
    const savedDoc = findAttendanceDoc(attendanceBySession, session);
    const savedStudents = savedDoc.students || {};
    const sessionCheckins = checkinsBySession.get(id) || [];
    const startsAt = sessionStart(session);
    const endsAt = sessionEnd(session);
    const date = attendanceDateKey(startsAt || savedDoc.date, timezone);
    const topic = sessionTopic({ ...savedDoc, ...session });
    const statusCounts = { present: 0, late: 0, absent: 0, excused: 0, cancelled: 0, upcoming: 0 };

    roster.forEach((entry) => {
      const saved = findSavedStudent(savedStudents, entry.aliases);
      const checkin = findCheckin(sessionCheckins, entry.aliases);
      const recordStatus = statusForRecord({ session: { ...savedDoc, ...session }, saved, checkin, nowDate, lateMinutes });
      statusCounts[recordStatus] = (statusCounts[recordStatus] || 0) + 1;
      records.push({
        studentKey: entry.key,
        studentCode: entry.code,
        studentName: entry.name,
        studentEmail: entry.email,
        sessionId: id,
        sessionTopic: topic,
        date,
        startsAt: startsAt?.toISOString() || "",
        endsAt: endsAt?.toISOString() || "",
        startsAtMs: startsAt?.getTime() || 0,
        status: recordStatus,
        checkedInAt: formatCheckinIso(checkin || {}, saved || {}),
        method: checkinMethod(checkin || {}, saved || {}),
        source: checkin ? "checkin" : saved ? "attendance" : "derived",
      });
    });

    const held = !["cancelled", "canceled"].includes(activeSessionStatus({ ...savedDoc, ...session }))
      && (activeSessionStatus({ ...savedDoc, ...session }) === "completed" || activeSessionStatus({ ...savedDoc, ...session }) === "live" || Boolean(startsAt && startsAt.getTime() <= nowDate.getTime()));
    const attended = statusCounts.present + statusCounts.late;
    const eligible = Math.max(0, roster.length - statusCounts.excused);
    sessionSummaries.push({
      sessionId: id,
      topic,
      date,
      startsAt: startsAt?.toISOString() || "",
      startsAtMs: startsAt?.getTime() || 0,
      status: activeSessionStatus({ ...savedDoc, ...session }) || "scheduled",
      held,
      rosterCount: roster.length,
      ...statusCounts,
      checkedIn: attended,
      attendancePercent: held ? percentage(attended, eligible) : 0,
    });
  });

  const studentSummaries = roster.map((entry) => {
    const studentRecords = records.filter((record) => record.studentKey === entry.key);
    const heldRecords = studentRecords.filter((record) => ["present", "late", "absent", "excused"].includes(record.status));
    const present = heldRecords.filter((record) => record.status === "present").length;
    const late = heldRecords.filter((record) => record.status === "late").length;
    const absent = heldRecords.filter((record) => record.status === "absent").length;
    const excused = heldRecords.filter((record) => record.status === "excused").length;
    const eligible = Math.max(0, heldRecords.length - excused);
    const checkinDates = studentRecords.map((record) => attendanceDate(record.checkedInAt)).filter(Boolean).sort((left, right) => right - left);
    return {
      studentKey: entry.key,
      studentCode: entry.code,
      studentName: entry.name,
      studentEmail: entry.email,
      student: entry.student,
      sessionsHeld: heldRecords.length,
      present,
      late,
      absent,
      excused,
      attended: present + late,
      attendancePercent: percentage(present + late, eligible),
      consecutiveAbsences: trailingAbsences(studentRecords),
      lastCheckin: checkinDates[0]?.toISOString() || "",
      records: studentRecords,
    };
  });

  const heldSessions = sessionSummaries.filter((session) => session.held);
  const eligibleRecords = records.filter((record) => ["present", "late", "absent"].includes(record.status));
  const presentRecords = eligibleRecords.filter((record) => ["present", "late"].includes(record.status));
  const today = attendanceDateKey(nowDate, timezone);
  const todayRecords = records.filter((record) => record.date === today && !["cancelled", "upcoming"].includes(record.status));

  return {
    timezone,
    lateMinutes,
    today,
    records,
    sessionSummaries,
    studentSummaries,
    classSummary: {
      totalStudents: roster.length,
      sessionsHeld: heldSessions.length,
      present: eligibleRecords.filter((record) => record.status === "present").length,
      late: eligibleRecords.filter((record) => record.status === "late").length,
      absent: eligibleRecords.filter((record) => record.status === "absent").length,
      excused: records.filter((record) => record.status === "excused").length,
      attendancePercent: percentage(presentRecords.length, eligibleRecords.length),
      todayCheckedIn: todayRecords.filter((record) => ["present", "late"].includes(record.status)).length,
      todayMissing: todayRecords.filter((record) => record.status === "absent").length,
    },
  };
}

export function filterAttendanceRecords(records = [], {
  query = "",
  status = "all",
  dateFrom = "",
  dateTo = "",
} = {}) {
  const wanted = comparable(query);
  return records.filter((record) => {
    if (status !== "all" && record.status !== status) return false;
    if (dateFrom && record.date < dateFrom) return false;
    if (dateTo && record.date > dateTo) return false;
    if (!wanted) return true;
    return [record.studentName, record.studentCode, record.studentEmail, record.sessionTopic, record.method]
      .map(comparable)
      .some((value) => value.includes(wanted));
  });
}

function csvCell(value) {
  const text = normalize(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function buildAttendanceCsv(records = []) {
  const header = ["Student", "Student code", "Email", "Session", "Date", "Scheduled start", "Status", "Check-in time", "Method", "Source"];
  const rows = records.map((record) => [
    record.studentName,
    record.studentCode,
    record.studentEmail,
    record.sessionTopic,
    record.date,
    record.startsAt,
    record.status,
    record.checkedInAt,
    record.method,
    record.source,
  ]);
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}

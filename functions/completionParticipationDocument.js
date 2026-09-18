const crypto = require("node:crypto");
const { _test: attendanceHelpers } = require("./attendanceConfirmationEmails.js");

const BLOCKED_SESSION_STATUSES = new Set(["cancelled", "canceled", "superseded", "deleted"]);
const NON_TEACHING_TYPES = /orientation|tutorial|holiday|break|review only/i;

function text(value) {
  return String(value || "").trim();
}

function lower(value) {
  return text(value).toLowerCase().replace(/\s+/g, " ");
}

function asDate(value) {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  if (typeof value?.toMillis === "function") return new Date(value.toMillis());
  if (typeof value === "object" && Number.isFinite(value.seconds)) return new Date(value.seconds * 1000);
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(value) {
  const date = asDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Accra",
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

function classValues(value = {}) {
  return [
    value.id,
    value.classId,
    value.classRecordId,
    value.classDocumentId,
    value.assignedClassId,
    value.name,
    value.className,
    value.class,
    value.group,
    value.groupId,
    value.groupName,
    value.slug,
    value.cohort,
    value.cohortId,
    value.cohortName,
  ].map(lower).filter(Boolean);
}

function studentIdentityValues(student = {}) {
  return [
    student.id,
    student.uid,
    student.studentCode,
    student.studentcode,
    student.student_code,
    student.email,
    student.name,
  ].map(lower).filter(Boolean);
}

function sessionStatus(session = {}) {
  return lower(session.status || session.sessionStatus || "scheduled");
}

function sessionStart(session = {}) {
  return asDate(session.startsAt || session.startAt || session.startDateTime || session.date);
}

function sessionEnd(session = {}) {
  return asDate(session.endsAt || session.endAt || session.endDateTime)
    || (sessionStart(session) ? new Date(sessionStart(session).getTime() + 90 * 60 * 1000) : null);
}

function curriculumIndex(session = {}) {
  for (const candidate of [session.curriculumIndex, session.officialSessionIndex, session.sessionIndex, session.dayIndex]) {
    const value = Number(candidate);
    if (Number.isFinite(value)) return value;
  }
  return null;
}

function assignmentIds(session = {}) {
  return [...new Set([
    ...(Array.isArray(session.assignmentIds) ? session.assignmentIds : []),
    ...(Array.isArray(session.assignments) ? session.assignments : []),
    session.assignmentId,
    session.assignment_id,
  ].map(text).filter(Boolean))];
}

function sessionIdentity(session = {}) {
  const index = curriculumIndex(session);
  if (index !== null) return `index:${index}`;
  const assignments = assignmentIds(session);
  if (assignments.length) return `assignments:${assignments.map(lower).sort().join("+")}`;
  return `id:${text(session.officialSessionId || session.canonicalSessionId || session.classSessionId || session.id)}`;
}

function sessionPreference(session = {}) {
  const updated = asDate(
    session.completedAt || session.autoCompletedAt || session.updatedAt || session.createdAt,
  )?.getTime() || 0;
  return (sessionStatus(session) === "completed" ? 1000000000000 : 0)
    + (text(session.officialSessionId || session.canonicalSessionId) ? 1000000000 : 0)
    + (Number(session.sequence || 0) * 1000000)
    + Math.floor(updated / 1000000);
}

function dedupeOfficialSessions(sessions = []) {
  const preferred = new Map();
  sessions.forEach((session) => {
    if (!session || session.superseded === true || session.isSuperseded === true) return;
    if (BLOCKED_SESSION_STATUSES.has(sessionStatus(session))) return;
    const identity = sessionIdentity(session);
    const current = preferred.get(identity);
    if (!current || sessionPreference(session) > sessionPreference(current)) preferred.set(identity, session);
  });
  return [...preferred.values()];
}

function isTeachingSession(session = {}) {
  const kind = text(session.sessionType || session.type || session.kind || session.category || session.topic || session.title);
  if (NON_TEACHING_TYPES.test(kind)) return false;
  return curriculumIndex(session) !== null
    || assignmentIds(session).length > 0
    || Boolean(text(session.topic || session.title));
}

function recordBelongsToClass(record = {}, klass = {}) {
  const wanted = new Set(classValues(klass));
  return classValues(record).some((value) => wanted.has(value));
}

async function queryExact(collection, field, value, limit = 10) {
  if (!text(value)) return [];
  const snapshot = await collection.where(field, "==", value).limit(limit).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

async function findStudent(db, input = {}) {
  const collection = db.collection("students");
  const codeCandidates = [...new Set([
    text(input.studentCode),
    text(input.student_code),
    text(input.studentcode),
    text(input.studentCode).toUpperCase(),
    text(input.studentCode).toLowerCase(),
  ].filter(Boolean))];
  const email = lower(input.email || input.studentEmail);

  for (const code of codeCandidates) {
    for (const field of ["studentCode", "studentcode", "student_code"]) {
      const rows = await queryExact(collection, field, code, 5);
      if (rows.length) return rows[0];
    }
  }
  if (email) {
    for (const field of ["email", "emailNormalized"]) {
      const values = field === "email" ? [input.email || input.studentEmail, email] : [email];
      for (const value of values.filter(Boolean)) {
        const rows = await queryExact(collection, field, value, 5);
        if (rows.length) return rows[0];
      }
    }
  }

  const snapshot = await collection.get();
  const wantedCodes = new Set(codeCandidates.map(lower));
  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .find((student) => {
      const codes = [student.studentCode, student.studentcode, student.student_code].map(lower).filter(Boolean);
      const studentEmail = lower(student.email);
      return codes.some((code) => wantedCodes.has(code)) || (email && studentEmail === email);
    }) || null;
}

async function findClass(db, input = {}, student = {}) {
  const collection = db.collection("classes");
  const idCandidates = [...new Set([
    input.classId,
    input.class_id,
    student.classId,
    student.classRecordId,
    student.assignedClassId,
  ].map(text).filter(Boolean))];

  for (const id of idCandidates) {
    const snap = await collection.doc(id).get();
    if (snap.exists) return { id: snap.id, ...snap.data() };
  }

  const nameCandidates = [...new Set([
    input.className,
    input.class_name,
    student.className,
    student.class,
    student.groupName,
    student.cohort,
  ].map(text).filter(Boolean))];
  for (const value of nameCandidates) {
    for (const field of ["name", "className", "classId", "slug"]) {
      const rows = await queryExact(collection, field, value, 5);
      if (rows.length) return rows[0];
    }
  }

  const wanted = new Set(nameCandidates.map(lower));
  const snapshot = await collection.get();
  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .find((klass) => classValues(klass).some((value) => wanted.has(value))) || null;
}

async function loadClassSessions(db, klass = {}) {
  const collection = db.collection("classSessions");
  const byId = new Map();
  const identifiers = [...new Set([
    klass.id,
    klass.classId,
    klass.classRecordId,
    klass.name,
    klass.className,
  ].map(text).filter(Boolean))];

  for (const field of ["classId", "classRecordId", "classDocumentId", "className"]) {
    for (const identifier of identifiers) {
      const rows = await queryExact(collection, field, identifier, 120);
      rows.forEach((row) => byId.set(row.id, row));
    }
  }

  if (!byId.size) {
    const snapshot = await collection.get();
    snapshot.docs.forEach((doc) => {
      const row = { id: doc.id, ...doc.data() };
      if (recordBelongsToClass(row, klass)) byId.set(row.id, row);
    });
  }

  return dedupeOfficialSessions([...byId.values()])
    .filter(isTeachingSession)
    .sort((left, right) => {
      const leftIndex = curriculumIndex(left);
      const rightIndex = curriculumIndex(right);
      if (leftIndex !== null && rightIndex !== null && leftIndex !== rightIndex) return leftIndex - rightIndex;
      return (sessionStart(left)?.getTime() || 0) - (sessionStart(right)?.getTime() || 0);
    });
}

async function loadAttendanceSession(db, klass = {}, session = {}) {
  const parents = [...new Set([
    klass.id,
    klass.classId,
    klass.classRecordId,
    klass.name,
    klass.className,
    session.classId,
    session.classRecordId,
    session.classDocumentId,
  ].map(text).filter(Boolean))];

  for (const parentId of parents) {
    const ref = db.collection("attendance").doc(parentId).collection("sessions").doc(text(session.id));
    const snap = await ref.get();
    if (!snap.exists) continue;
    const checkinSnap = await ref.collection("checkins").get();
    return {
      attendance: snap.data() || {},
      checkins: checkinSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
    };
  }
  return { attendance: {}, checkins: [] };
}

async function loadParticipationRecords(db, student = {}, klass = {}) {
  const collection = db.collection("classParticipationRecords");
  const byId = new Map();
  const probes = [
    ["studentUid", text(student.uid)],
    ["studentCode", lower(student.studentCode || student.studentcode || student.student_code)],
    ["studentEmailNormalized", lower(student.email)],
  ].filter(([, value]) => value);

  for (const [field, value] of probes) {
    const rows = await queryExact(collection, field, value, 200);
    rows.forEach((row) => byId.set(row.id, row));
  }

  return [...byId.values()].filter((row) => recordBelongsToClass(row, klass));
}

function summarizeParticipation(records = []) {
  const lessons = new Set();
  const participated = new Set();
  const strong = new Set();
  const review = new Set();
  let turns = 0;
  let correct = 0;
  let needsReview = 0;
  let skipped = 0;

  records.forEach((record, index) => {
    const lesson = text(record.sessionId)
      || [text(record.assignmentId), text(record.sessionDate), index].join("|");
    lessons.add(lesson);
    const recordTurns = Math.max(0, Number(record.turns || 0));
    const recordSkipped = Math.max(0, Number(record.skipped || 0));
    if (recordTurns > 0 || recordSkipped > 0) participated.add(lesson);
    turns += recordTurns;
    correct += Math.max(0, Number(record.correct || 0));
    needsReview += Math.max(0, Number(record.needsReview || 0));
    skipped += recordSkipped;

    (Array.isArray(record.questionResponses) ? record.questionResponses : []).forEach((response) => {
      const concept = text(response.conceptLabel || response.questionContext);
      if (!concept) return;
      const result = lower(response.result || response.status);
      if (result === "correct") strong.add(concept);
      if (["needs_review", "needshelp", "needs_help", "skipped", "skip"].includes(result)) review.add(concept);
    });
    (Array.isArray(record.reviewConcepts) ? record.reviewConcepts : []).forEach((concept) => {
      if (text(concept)) review.add(text(concept));
    });
  });

  review.forEach((concept) => strong.delete(concept));
  const trackedLessons = lessons.size;
  const participatedLessons = participated.size;
  return {
    trackedLessons,
    participatedLessons,
    participationRate: trackedLessons ? Math.round((participatedLessons / trackedLessons) * 100) : 0,
    turns,
    correct,
    needsReview,
    skipped,
    strongConcepts: [...strong].slice(0, 6),
    reviewConcepts: [...review].slice(0, 6),
  };
}

function summarizeAttendance(records = []) {
  const present = records.filter((record) => record.status === "present").length;
  const late = records.filter((record) => record.status === "late").length;
  const absent = records.filter((record) => record.status === "absent").length;
  const excused = records.filter((record) => record.status === "excused").length;
  const counted = present + late + absent;
  return {
    scheduled: records.length,
    present,
    late,
    absent,
    excused,
    attended: present + late,
    attendanceRate: counted ? Math.round(((present + late) / counted) * 100) : 0,
  };
}

function completionDocumentId(student = {}, klass = {}, completionDate = "") {
  return "LLEA-" + crypto.createHash("sha256")
    .update([
      text(student.studentCode || student.studentcode || student.student_code || student.id),
      text(klass.id || klass.classId || klass.name),
      text(completionDate),
    ].join("|"))
    .digest("hex")
    .slice(0, 12)
    .toUpperCase();
}

async function buildCompletionReport({ db, input = {} }) {
  const student = await findStudent(db, input);
  if (!student) {
    const error = new Error("Student not found for completion participation report.");
    error.status = 404;
    throw error;
  }
  const klass = await findClass(db, input, student);
  if (!klass) {
    const error = new Error("Class not found for completion participation report.");
    error.status = 404;
    throw error;
  }

  const completionDate = asDate(input.completionDate || input.completion_date) || new Date();
  const sessions = (await loadClassSessions(db, klass)).filter((session) => {
    const start = sessionStart(session);
    return !start || start.getTime() <= completionDate.getTime() + 24 * 60 * 60 * 1000;
  });

  const attendanceRecords = [];
  for (const session of sessions) {
    const { attendance, checkins } = await loadAttendanceSession(db, klass, session);
    const status = attendanceHelpers.attendanceStatus({
      session,
      attendance,
      checkins,
      student,
    });
    attendanceRecords.push({
      session,
      status: status.status,
      method: status.method,
      checkedAt: status.checkedAt,
    });
  }

  const participationRecords = (await loadParticipationRecords(db, student, klass))
    .filter((record) => {
      const date = asDate(record.sessionDate || record.updatedAt);
      return !date || date.getTime() <= completionDate.getTime() + 24 * 60 * 60 * 1000;
    });

  const attendance = summarizeAttendance(attendanceRecords);
  const participation = summarizeParticipation(participationRecords);
  const level = text(input.level || klass.levelId || klass.level || student.level).toUpperCase();
  const className = text(klass.name || klass.className || input.className || input.class_name);
  const studentName = text(student.name || input.studentName || input.student_name || "Student");
  const studentCode = text(student.studentCode || student.studentcode || student.student_code || input.studentCode || input.student_code);

  return {
    documentId: completionDocumentId(student, klass, completionDate.toISOString().slice(0, 10)),
    issuedAt: new Date().toISOString(),
    completionDate: completionDate.toISOString(),
    student: {
      id: student.id,
      uid: text(student.uid),
      name: studentName,
      code: studentCode,
      email: text(student.email),
    },
    course: {
      classId: text(klass.id || klass.classId),
      className,
      level,
      startDate: text(klass.startDate || klass.startsAt || ""),
      endDate: text(klass.endDate || klass.graduationDate || input.completionDate || input.completion_date || ""),
    },
    attendance,
    attendanceRecords: attendanceRecords.map((record) => ({
      date: sessionStart(record.session)?.toISOString() || "",
      assignmentId: assignmentIds(record.session)[0] || "",
      title: text(record.session.topic || record.session.title || record.session.sessionLabel),
      status: record.status,
      method: record.method,
    })),
    participation,
  };
}

function pdfEscape(value) {
  return text(value)
    .replace(/[–—]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function latin1Buffer(value) {
  return Buffer.from(String(value || "").replace(/[^\x09\x0A\x0D\x20-\xFF]/g, "?"), "latin1");
}

function wrapText(value, maxChars = 84) {
  const words = text(value).split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";
  words.forEach((word) => {
    const next = current ? current + " " + word : word;
    if (next.length <= maxChars) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  });
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

function pageStream(lines = []) {
  const commands = [];
  let y = 800;
  lines.forEach((entry) => {
    const item = typeof entry === "string" ? { text: entry } : entry;
    if (item.space) {
      y -= Number(item.space);
      return;
    }
    const size = Number(item.size || 11);
    const x = Number(item.x || 48);
    const font = item.bold ? "F2" : "F1";
    const wrapped = item.wrap === false ? [text(item.text)] : wrapText(item.text, item.maxChars || 84);
    wrapped.forEach((line) => {
      commands.push(`BT /${font} ${size} Tf ${x} ${y} Td (${pdfEscape(line)}) Tj ET`);
      y -= Number(item.leading || Math.max(14, size + 3));
    });
    if (item.after) y -= Number(item.after);
  });
  return commands.join("\n");
}

function buildPdf(pages = []) {
  const objects = [];
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  const pageRefs = pages.map((_, index) => 5 + index * 2);
  objects[2] = `<< /Type /Pages /Kids [${pageRefs.map((ref) => ref + " 0 R").join(" ")}] /Count ${pages.length} >>`;
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  objects[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";

  pages.forEach((pageLines, index) => {
    const pageRef = 5 + index * 2;
    const contentRef = pageRef + 1;
    const stream = pageStream(pageLines);
    const streamLength = latin1Buffer(stream).length;
    objects[pageRef] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentRef} 0 R >>`;
    objects[contentRef] = `<< /Length ${streamLength} >>\nstream\n${stream}\nendstream`;
  });

  const chunks = [latin1Buffer("%PDF-1.4\n")];
  const offsets = [0];
  for (let index = 1; index < objects.length; index += 1) {
    offsets[index] = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    chunks.push(latin1Buffer(`${index} 0 obj\n${objects[index]}\nendobj\n`));
  }
  const xrefOffset = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  let xref = `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let index = 1; index < objects.length; index += 1) {
    xref += String(offsets[index]).padStart(10, "0") + " 00000 n \n";
  }
  xref += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  chunks.push(latin1Buffer(xref));
  return Buffer.concat(chunks);
}

function buildCompletionPdf(report = {}) {
  const student = report.student || {};
  const course = report.course || {};
  const attendance = report.attendance || {};
  const participation = report.participation || {};
  const attendancePages = [
    { text: "LEARN LANGUAGE EDUCATION ACADEMY", bold: true, size: 18, after: 4 },
    { text: "Certificate of Attendance", bold: true, size: 22, after: 12 },
    { text: "This document certifies the recorded live-class attendance for the course shown below.", size: 11, after: 12 },
    { text: `Student: ${student.name || "Student"}`, bold: true, size: 13 },
    { text: `Student code: ${student.code || "-"}` },
    { text: `Course level: ${course.level || "-"}` },
    { text: `Class: ${course.className || "-"}` },
    { text: `Course completion date: ${formatDate(report.completionDate) || "-"}`, after: 14 },
    { text: "Attendance summary", bold: true, size: 15, after: 4 },
    { text: `Scheduled teaching sessions: ${attendance.scheduled || 0}` },
    { text: `Attended: ${attendance.attended || 0}` },
    { text: `Present: ${attendance.present || 0}` },
    { text: `Late: ${attendance.late || 0}` },
    { text: `Absent: ${attendance.absent || 0}` },
    { text: `Excused: ${attendance.excused || 0}` },
    { text: `Attendance rate: ${attendance.attendanceRate || 0}%`, bold: true, size: 14, after: 14 },
    { text: `Document ID: ${report.documentId || "-"}` },
    { text: `Issued: ${formatDate(report.issuedAt) || "-"}` },
    { space: 18 },
    { text: "Attendance is calculated from Falowen live-class attendance records. Present and late sessions count as attended; excused sessions are excluded from the percentage denominator.", size: 9, maxChars: 95 },
  ];

  const conceptStrong = (participation.strongConcepts || []).join(" · ") || "No specific concepts recorded";
  const conceptReview = (participation.reviewConcepts || []).join(" · ") || "No specific review concepts recorded";
  const participationPage = [
    { text: "LEARN LANGUAGE EDUCATION ACADEMY", bold: true, size: 18, after: 4 },
    { text: "Class Participation Record", bold: true, size: 22, after: 12 },
    { text: `Student: ${student.name || "Student"}`, bold: true, size: 13 },
    { text: `Course: ${course.level || "-"} · ${course.className || "-"}`, after: 14 },
    { text: "Participation summary", bold: true, size: 15, after: 4 },
    { text: `Presenter lessons recorded: ${participation.trackedLessons || 0}` },
    { text: `Lessons participated in: ${participation.participatedLessons || 0}` },
    { text: `Participation rate: ${participation.participationRate || 0}%`, bold: true, size: 14 },
    { text: `Recorded turns: ${participation.turns || 0}` },
    { text: `Correct responses: ${participation.correct || 0}` },
    { text: `Responses needing review: ${participation.needsReview || 0}` },
    { text: `Skipped opportunities: ${participation.skipped || 0}`, after: 12 },
    { text: "Strong concepts", bold: true, size: 13 },
    { text: conceptStrong, size: 10, maxChars: 90, after: 10 },
    { text: "Recommended review concepts", bold: true, size: 13 },
    { text: conceptReview, size: 10, maxChars: 90, after: 16 },
    { text: "Important note", bold: true, size: 12 },
    { text: "Class participation is diagnostic learning data from Falowen Teaching Slides. It does not change the student's academic grade or official attendance record.", size: 10, maxChars: 95 },
    { space: 16 },
    { text: `Document ID: ${report.documentId || "-"}`, size: 9 },
  ];

  return buildPdf([attendancePages, participationPage]);
}

function timingSafeEquals(left, right) {
  const a = Buffer.from(text(left));
  const b = Buffer.from(text(right));
  return a.length > 0 && a.length === b.length && crypto.timingSafeEqual(a, b);
}

function providedSecret(req) {
  const announcementToken = text(req.headers?.["x-falowen-announcement-token"]);
  if (announcementToken) return announcementToken;
  const legacyCompletionToken = text(req.headers?.["x-falowen-completion-secret"]);
  if (legacyCompletionToken) return legacyCompletionToken;
  const authorization = text(req.headers?.authorization);
  const bearer = authorization.match(/^Bearer\s+(.+)$/i);
  return bearer ? text(bearer[1]) : "";
}

function resolveAnnouncementWebhookSecret(runtimeConfig = {}, env = process.env) {
  const communication = runtimeConfig.communication
    || runtimeConfig.announcements
    || runtimeConfig.announcement
    || {};
  return text(
    env.ANNOUNCEMENT_WEBHOOK_TOKEN
    || env.VITE_ANNOUNCEMENT_WEBHOOK_TOKEN
    || communication.announcement_webhook_token
    || communication.webhook_token
    || attendanceHelpers.resolveWebhookConfig(runtimeConfig, env)?.token,
  );
}

function registerCompletionDocumentRoute({ app, db, runtimeConfig = {}, env = process.env }) {
  app.post("/completion/attendance-participation-document", async (req, res) => {
    try {
      const expected = resolveAnnouncementWebhookSecret(runtimeConfig, env);
      if (!expected) return res.status(503).json({ ok: false, error: "Announcement webhook secret is not configured." });
      if (!timingSafeEquals(providedSecret(req), expected)) {
        return res.status(401).json({ ok: false, error: "Unauthorized" });
      }

      const report = await buildCompletionReport({ db, input: req.body || {} });
      const pdf = buildCompletionPdf(report);
      const safeCode = text(report.student?.code || "student").replace(/[^A-Za-z0-9_-]+/g, "_");
      const level = text(report.course?.level || "course").replace(/[^A-Za-z0-9_-]+/g, "_");
      const filename = `${safeCode}_${level}_Attendance_and_Class_Participation.pdf`;

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("X-Falowen-Document-Id", report.documentId);
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).send(pdf);
    } catch (error) {
      const status = Number(error?.status) || 500;
      console.error("completion_participation_document_failed", {
        status,
        message: error?.message || String(error),
      });
      return res.status(status).json({ ok: false, error: error?.message || "Could not build completion participation document." });
    }
  });
}

module.exports = {
  buildCompletionPdf,
  buildCompletionReport,
  dedupeOfficialSessions,
  registerCompletionDocumentRoute,
  resolveAnnouncementWebhookSecret,
  summarizeAttendance,
  summarizeParticipation,
  _test: {
    buildPdf,
    completionDocumentId,
    isTeachingSession,
    sessionIdentity,
  },
};

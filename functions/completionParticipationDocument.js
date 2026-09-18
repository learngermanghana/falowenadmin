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
  participation.dataAvailable = participation.trackedLessons > 0;
  const level = text(input.level || klass.levelId || klass.level || student.level).toUpperCase();
  const className = text(klass.name || klass.className || input.className || input.class_name);
  const studentName = text(student.name || input.studentName || input.student_name || "Student");
  const studentCode = text(student.studentCode || student.studentcode || student.student_code || input.studentCode || input.student_code);
  const firstSessionDate = sessions.map(sessionStart).filter(Boolean).sort((a, b) => a - b)[0] || null;
  const lastSessionDate = sessions.map(sessionEnd).filter(Boolean).sort((a, b) => b - a)[0] || null;
  const courseStartDate = text(klass.startDate || klass.startsAt || klass.contractStart || "")
    || (firstSessionDate ? firstSessionDate.toISOString() : "");
  const courseEndDate = text(klass.endDate || klass.endsAt || klass.graduationDate || klass.contractEnd || "")
    || (lastSessionDate ? lastSessionDate.toISOString() : completionDate.toISOString());

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
      startDate: courseStartDate,
      endDate: courseEndDate,
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
    if (item.raw) {
      commands.push(item.raw);
      return;
    }
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
    const stream = typeof pageLines === "string" ? pageLines : pageStream(pageLines);
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

const PDF_COLORS = {
  ink: [0.059, 0.090, 0.165],
  sub: [0.278, 0.333, 0.412],
  gold: [0.769, 0.639, 0.337],
  goldSoft: [0.969, 0.945, 0.867],
  navy: [0.043, 0.231, 0.467],
  blueSoft: [0.937, 0.965, 1],
  rule: [0.796, 0.835, 0.882],
  pale: [0.973, 0.980, 0.988],
  white: [1, 1, 1],
};

function pdfColor(color = PDF_COLORS.ink, operator = "rg") {
  return `${color.map((part) => Number(part).toFixed(3)).join(" ")} ${operator}`;
}

function approxTextWidth(value, size = 11) {
  return text(value).length * Number(size || 11) * 0.51;
}

function pdfText(value, x, y, size = 11, { bold = false, color = PDF_COLORS.ink } = {}) {
  return [
    "BT",
    pdfColor(color, "rg"),
    `/${bold ? "F2" : "F1"} ${Number(size)} Tf`,
    `${Number(x).toFixed(1)} ${Number(y).toFixed(1)} Td`,
    `(${pdfEscape(value)}) Tj`,
    "ET",
  ].join(" ");
}

function pdfCenteredText(value, y, size = 11, options = {}) {
  const width = approxTextWidth(value, size);
  return pdfText(value, Math.max(36, (595 - width) / 2), y, size, options);
}

function pdfRect(x, y, width, height, {
  fill = null,
  stroke = null,
  lineWidth = 1,
} = {}) {
  const commands = ["q"];
  if (fill) commands.push(pdfColor(fill, "rg"));
  if (stroke) commands.push(pdfColor(stroke, "RG"), `${Number(lineWidth)} w`);
  commands.push(`${x} ${y} ${width} ${height} re`);
  commands.push(fill && stroke ? "B" : fill ? "f" : "S");
  commands.push("Q");
  return commands.join(" ");
}

function pdfLine(x1, y1, x2, y2, { color = PDF_COLORS.rule, lineWidth = 1 } = {}) {
  return `q ${pdfColor(color, "RG")} ${lineWidth} w ${x1} ${y1} m ${x2} ${y2} l S Q`;
}

function pdfWrappedText(value, x, y, maxChars, size = 10, {
  bold = false,
  color = PDF_COLORS.sub,
  leading = 13,
  maxLines = 5,
} = {}) {
  return wrapText(value, maxChars)
    .slice(0, maxLines)
    .map((line, index) => pdfText(line, x, y - index * leading, size, { bold, color }))
    .join("\n");
}

function completionBrandFrame() {
  return [
    pdfRect(24, 24, 547, 794, { stroke: PDF_COLORS.gold, lineWidth: 2.8 }),
    pdfRect(29, 29, 537, 784, { stroke: [0.90, 0.91, 0.93], lineWidth: 0.7 }),
    pdfCenteredText("FALOWEN", 790, 11, { bold: true, color: PDF_COLORS.gold }),
    pdfCenteredText("LEARN LANGUAGE EDUCATION ACADEMY", 774, 8.5, { bold: true, color: PDF_COLORS.navy }),
    "q 0.955 0.960 0.968 rg BT /F2 70 Tf 122 398 Td (FALOWEN) Tj ET Q",
  ].join("\n");
}

function statCard(label, value, x, y, width = 150, { accent = PDF_COLORS.navy } = {}) {
  return [
    pdfRect(x, y, width, 58, { fill: PDF_COLORS.pale, stroke: PDF_COLORS.rule, lineWidth: 0.8 }),
    pdfText(label.toUpperCase(), x + 12, y + 38, 8.5, { bold: true, color: PDF_COLORS.sub }),
    pdfText(String(value), x + 12, y + 15, 18, { bold: true, color: accent }),
  ].join("\n");
}

function courseDateLabel(course = {}, completionDate = "") {
  const start = formatDate(course.startDate);
  const end = formatDate(course.endDate || completionDate);
  if (start && end) return `${start} - ${end}`;
  return start || end || "-";
}

function brandedFooter(report = {}, { pageLabel = "" } = {}) {
  const documentId = text(report.documentId || "-");
  return [
    pdfLine(68, 133, 243, 133, { color: PDF_COLORS.ink, lineWidth: 1.1 }),
    pdfText("Felix Asadu", 112, 115, 10.5, { bold: true, color: PDF_COLORS.ink }),
    pdfText("Director", 132, 100, 9, { color: PDF_COLORS.sub }),
    pdfText("Issued by Learn Language Education Academy", 332, 124, 8.8, { bold: true, color: PDF_COLORS.ink }),
    pdfText("Accra, Ghana", 332, 109, 8.8, { color: PDF_COLORS.sub }),
    pdfText(`Verification ID: ${documentId}`, 332, 94, 8.8, { bold: true, color: PDF_COLORS.navy }),
    pdfText("Verification: learngermanghana@gmail.com", 332, 79, 8.3, { color: PDF_COLORS.sub }),
    pdfText(pageLabel, 502, 42, 7.5, { color: PDF_COLORS.sub }),
  ].join("\n");
}

function buildAttendancePage(report = {}) {
  const student = report.student || {};
  const course = report.course || {};
  const attendance = report.attendance || {};
  const courseDates = courseDateLabel(course, report.completionDate);
  const rate = Number(attendance.attendanceRate || 0);

  return [
    completionBrandFrame(),
    pdfCenteredText("Certificate of Attendance", 730, 27, { bold: true, color: PDF_COLORS.ink }),
    pdfCenteredText("This certifies the recorded live-class attendance for", 704, 10.5, { color: PDF_COLORS.sub }),
    pdfCenteredText(student.name || "Student", 660, 23, { bold: true, color: PDF_COLORS.navy }),
    pdfLine(108, 646, 487, 646, { color: PDF_COLORS.rule, lineWidth: 1.4 }),
    pdfCenteredText(`${course.level || "-"} German Course`, 620, 15, { bold: true, color: PDF_COLORS.ink }),
    pdfCenteredText(course.className || "-", 598, 10.5, { color: PDF_COLORS.sub }),
    pdfCenteredText(`Course dates: ${courseDates}`, 579, 9.5, { color: PDF_COLORS.sub }),
    statCard("Scheduled", attendance.scheduled || 0, 62, 492, 142),
    statCard("Attended", attendance.attended || 0, 226, 492, 142),
    statCard("Attendance rate", `${rate}%`, 390, 492, 142, { accent: PDF_COLORS.gold }),
    statCard("Present", attendance.present || 0, 62, 413, 106),
    statCard("Late", attendance.late || 0, 183, 413, 106),
    statCard("Absent", attendance.absent || 0, 304, 413, 106),
    statCard("Excused", attendance.excused || 0, 425, 413, 106),
    pdfRect(62, 316, 470, 70, { fill: PDF_COLORS.goldSoft, stroke: [0.90, 0.80, 0.55], lineWidth: 0.8 }),
    pdfText("ATTENDANCE METHOD", 76, 363, 8.5, { bold: true, color: PDF_COLORS.gold }),
    pdfWrappedText(
      "Present and late sessions count as attended. Excused sessions are excluded from the attendance percentage denominator. The record is calculated from Falowen live-class attendance and check-in data.",
      76, 343, 84, 9.3, { color: PDF_COLORS.ink, leading: 13, maxLines: 3 },
    ),
    pdfText(`Student code: ${student.code || "-"}`, 62, 280, 9.2, { color: PDF_COLORS.sub }),
    pdfText(`Completed: ${formatDate(report.completionDate) || "-"}`, 330, 280, 9.2, { color: PDF_COLORS.sub }),
    pdfText(`Issued: ${formatDate(report.issuedAt) || "-"}`, 62, 261, 9.2, { color: PDF_COLORS.sub }),
    brandedFooter(report, { pageLabel: "1 / 2" }),
  ].join("\n");
}

function buildParticipationPage(report = {}) {
  const student = report.student || {};
  const course = report.course || {};
  const participation = report.participation || {};
  const courseDates = courseDateLabel(course, report.completionDate);
  const tracked = Number(participation.trackedLessons || 0);
  const available = participation.dataAvailable !== false && tracked > 0;
  const strong = (participation.strongConcepts || []).join(" · ") || "No specific strong concepts recorded.";
  const review = (participation.reviewConcepts || []).join(" · ") || "No specific review concepts recorded.";

  const body = [
    completionBrandFrame(),
    pdfCenteredText("Class Participation Record", 730, 27, { bold: true, color: PDF_COLORS.ink }),
    pdfCenteredText(student.name || "Student", 696, 16, { bold: true, color: PDF_COLORS.navy }),
    pdfCenteredText(`${course.level || "-"} · ${course.className || "-"} · ${courseDates}`, 674, 9.5, { color: PDF_COLORS.sub }),
  ];

  if (!available) {
    body.push(
      pdfRect(62, 520, 470, 92, { fill: PDF_COLORS.goldSoft, stroke: [0.90, 0.80, 0.55], lineWidth: 0.8 }),
      pdfText("PARTICIPATION DATA", 78, 581, 9, { bold: true, color: PDF_COLORS.gold }),
      pdfWrappedText(
        "Participation data was not sufficiently recorded for this course. No participation percentage is assigned. This does not affect the student's academic result or official attendance.",
        78, 558, 80, 10, { color: PDF_COLORS.ink, leading: 14, maxLines: 4 },
      ),
    );
  } else {
    body.push(
      statCard("Tracked lessons", tracked, 62, 568, 142),
      statCard("Participated", participation.participatedLessons || 0, 226, 568, 142),
      statCard("Participation rate", `${participation.participationRate || 0}%`, 390, 568, 142, { accent: PDF_COLORS.gold }),
      statCard("Recorded turns", participation.turns || 0, 62, 489, 106),
      statCard("Correct", participation.correct || 0, 183, 489, 106),
      statCard("Needs review", participation.needsReview || 0, 304, 489, 106),
      statCard("Skipped", participation.skipped || 0, 425, 489, 106),
    );
  }

  body.push(
    pdfRect(62, 360, 225, 96, { fill: PDF_COLORS.blueSoft, stroke: [0.75, 0.83, 0.94], lineWidth: 0.8 }),
    pdfText("STRONG CONCEPTS", 76, 431, 8.5, { bold: true, color: PDF_COLORS.navy }),
    pdfWrappedText(strong, 76, 408, 37, 9.2, { color: PDF_COLORS.ink, leading: 13, maxLines: 4 }),
    pdfRect(307, 360, 225, 96, { fill: PDF_COLORS.goldSoft, stroke: [0.90, 0.80, 0.55], lineWidth: 0.8 }),
    pdfText("RECOMMENDED REVIEW", 321, 431, 8.5, { bold: true, color: PDF_COLORS.gold }),
    pdfWrappedText(review, 321, 408, 37, 9.2, { color: PDF_COLORS.ink, leading: 13, maxLines: 4 }),
    pdfRect(62, 270, 470, 66, { fill: PDF_COLORS.pale, stroke: PDF_COLORS.rule, lineWidth: 0.8 }),
    pdfText("IMPORTANT NOTE", 76, 313, 8.5, { bold: true, color: PDF_COLORS.sub }),
    pdfWrappedText(
      "Class participation is diagnostic learning data recorded from Falowen Teaching Slides. It does not change the student's academic grade and it does not replace the official attendance record.",
      76, 293, 83, 9.2, { color: PDF_COLORS.ink, leading: 12.5, maxLines: 3 },
    ),
    pdfText(`Student code: ${student.code || "-"}`, 62, 238, 9.2, { color: PDF_COLORS.sub }),
    pdfText(`Issued: ${formatDate(report.issuedAt) || "-"}`, 330, 238, 9.2, { color: PDF_COLORS.sub }),
    brandedFooter(report, { pageLabel: "2 / 2" }),
  );

  return body.join("\n");
}

function buildCompletionPdf(report = {}) {
  return buildPdf([
    buildAttendancePage(report),
    buildParticipationPage(report),
  ]);
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

function completionFilename(report = {}) {
  const safeCode = text(report.student?.code || "student").replace(/[^A-Za-z0-9_-]+/g, "_");
  const level = text(report.course?.level || "course").replace(/[^A-Za-z0-9_-]+/g, "_");
  return `${safeCode}_${level}_Attendance_and_Class_Participation.pdf`;
}

function sendPdfResponse(res, report, pdf, disposition = "attachment") {
  const filename = completionFilename(report);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `${disposition}; filename="${filename}"`);
  res.setHeader("X-Falowen-Document-Id", report.documentId);
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).send(pdf);
}

function registerCompletionDocumentRoute({ app, db, runtimeConfig = {}, env = process.env, requireAuth = null }) {
  app.post("/completion/attendance-participation-document", async (req, res) => {
    try {
      const expected = resolveAnnouncementWebhookSecret(runtimeConfig, env);
      if (!expected) return res.status(503).json({ ok: false, error: "Announcement webhook secret is not configured." });
      if (!timingSafeEquals(providedSecret(req), expected)) {
        return res.status(401).json({ ok: false, error: "Unauthorized" });
      }

      const report = await buildCompletionReport({ db, input: req.body || {} });
      const pdf = buildCompletionPdf(report);
      return sendPdfResponse(res, report, pdf, "attachment");
    } catch (error) {
      const status = Number(error?.status) || 500;
      console.error("completion_participation_document_failed", {
        status,
        message: error?.message || String(error),
      });
      return res.status(status).json({ ok: false, error: error?.message || "Could not build completion participation document." });
    }
  });

  if (typeof requireAuth === "function") {
    app.post("/completion-pack/report", async (req, res) => {
      try {
        await requireAuth(req);
        const report = await buildCompletionReport({ db, input: req.body || {} });
        return res.json({ ok: true, report });
      } catch (error) {
        const unauthorized = /Authorization|Not allowed|token/i.test(String(error?.message || ""));
        const status = unauthorized ? 401 : Number(error?.status) || 400;
        return res.status(status).json({ ok: false, error: error?.message || "Could not load completion pack." });
      }
    });

    app.post("/completion-pack/pdf", async (req, res) => {
      try {
        await requireAuth(req);
        const report = await buildCompletionReport({ db, input: req.body || {} });
        const pdf = buildCompletionPdf(report);
        const disposition = req.body?.download === true ? "attachment" : "inline";
        return sendPdfResponse(res, report, pdf, disposition);
      } catch (error) {
        const unauthorized = /Authorization|Not allowed|token/i.test(String(error?.message || ""));
        const status = unauthorized ? 401 : Number(error?.status) || 400;
        return res.status(status).json({ ok: false, error: error?.message || "Could not generate completion PDF." });
      }
    });
  }
}

module.exports = {
  buildCompletionPdf,
  buildCompletionReport,
  completionFilename,
  dedupeOfficialSessions,
  registerCompletionDocumentRoute,
  resolveAnnouncementWebhookSecret,
  summarizeAttendance,
  summarizeParticipation,
  _test: {
    buildAttendancePage,
    buildParticipationPage,
    buildPdf,
    completionDocumentId,
    isTeachingSession,
    sessionIdentity,
  },
};

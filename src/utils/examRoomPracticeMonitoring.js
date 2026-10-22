// Read-only Exams Room practice projection. A score is proof of a completed
// submission; a page visit, draft, or started timer is not.
const str = value => String(value ?? "").trim();
const code = value => str(value).toLowerCase().replace(/[^a-z0-9]/g, "");
const email = value => str(value).toLowerCase();
const VALID_SECTIONS = new Set(["lesen", "hoeren", "schreiben", "sprechen", "mixed"]);
const RESULT_ID = /^(A1|A2|B1|B2|C1|C2)-EXAMS-(LESEN|HOEREN|SCHREIBEN|SPRECHEN|MIXED)-/i;

export function isExamRoomPracticeResult(row = {}) {
  const source = str(row.source).toLowerCase();
  if (source === "exam_room_practice") return true;
  if (source.endsWith("_final_mock") || str(row.resultType).toLowerCase() === "final_mock") return false;
  return RESULT_ID.test(str(row.assignmentId || row.assignment_id || row.canonicalAssignmentKey));
}

export function asExamRoomPractice(row = {}) {
  if (!isExamRoomPracticeResult(row)) return null;
  const assignmentId = str(row.assignmentId || row.assignment_id || row.canonicalAssignmentKey);
  const match = assignmentId.match(RESULT_ID);
  const section = str(row.examSection || match?.[2]).toLowerCase();
  const level = str(row.level || match?.[1]).toUpperCase();
  const rawScore = row.rawScore;
  const maximum = row.total;
  const percentValue = row.percent ?? row.finalScore ?? row.score;
  const numeric = Number(percentValue);
  if (!VALID_SECTIONS.has(section) || !/^(A1|A2|B1|B2|C1|C2)$/.test(level)
    || percentValue == null || percentValue === "" || !Number.isFinite(numeric)
    || numeric < 0 || numeric > 100) return null;
  const date = str(row.date || row.updatedAt || row.createdAt);
  const timestamp = new Date(date).getTime();
  const exact = rawScore !== null && rawScore !== undefined && rawScore !== ""
    && maximum !== null && maximum !== undefined && Number(maximum) > 0;
  return {
    id: str(row.id || assignmentId + ":" + row.examRoomAttemptId),
    assignmentId, title: str(row.assignment || row.assignmentText || assignmentId),
    section, level, studentCode: str(row.studentCode || row.studentcode),
    uid: str(row.uid), email: email(row.studentEmail || row.email),
    name: str(row.studentName || row.name),
    percent: numeric, rawScore: exact ? Number(rawScore) : null,
    total: exact ? Number(maximum) : null,
    date: Number.isFinite(timestamp) ? date : "",
    timestamp: Number.isFinite(timestamp) ? timestamp : 0,
    attemptNumber: Number(row.attemptNumber || row.attempt) || 1,
  };
}

export function normalizeExamRoomPractices(rows = []) {
  return rows.map(asExamRoomPractice).filter(Boolean)
    .sort((a,b) => b.timestamp - a.timestamp);
}

function studentKeys(row = {}) {
  return [code(row.studentCode || row.studentcode), email(row.email || row.studentEmail),
    str(row.uid || row.userId)].filter(Boolean);
}

export function studentHasPractice(student = {}, practices = []) {
  const wanted = new Set(studentKeys(student));
  return wanted.size > 0 && practices.some(row =>
    studentKeys(row).some(key => wanted.has(key)));
}

export function unpractisedStudents(roster = [], practices = [], level = "all") {
  return roster.filter(student =>
    (level === "all" || str(student.level).toUpperCase() === level)
    && !studentHasPractice(student, practices));
}

export function filterExamRoomPractices(rows = [], { search = "", level = "all", section = "all" } = {}) {
  const query = email(search);
  return rows.filter(row => (level === "all" || row.level === level)
    && (section === "all" || row.section === section)
    && [row.name,row.email,row.studentCode,row.uid,row.title,row.assignmentId]
      .some(value => email(value).includes(query)));
}

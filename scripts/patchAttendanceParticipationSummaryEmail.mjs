import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const targetPath = path.join(root, "functions", "attendanceConfirmationEmails.js");
let source = fs.readFileSync(targetPath, "utf8");

const BEGIN = "// BEGIN ATTENDANCE PARTICIPATION SUMMARY";
const END = "// END ATTENDANCE PARTICIPATION SUMMARY";

const participationSummaryAlreadyInstalled = (
  source.includes(BEGIN)
  && source.includes('function buildEachClassMessage({ student, klass, record, participation = null')
  && source.includes('function buildWeeklyMessage({ student, klass, records, participation = null')
  && source.includes("async function loadParticipationForSessions")
  && source.includes("let participationRecords = [];")
  && source.includes("summarizeStudentParticipation({")
  && source.includes("buildParticipationText,")
  && source.includes("participationRecordMatchesStudent,")
);

if (participationSummaryAlreadyInstalled) {
  console.log("Attendance participation summary is already installed; leaving downstream hardening/enrichment intact.");
  process.exit(0);
}

const helperBlock = String.raw`${BEGIN}
const PARTICIPATION_RECORD_COLLECTION = "classParticipationRecords";
const PARTICIPATION_DETAILS_URL = "https://www.falowen.app/campus/account?tab=participation";

function sessionAssignmentValues(session = {}) {
  return [
    ...(Array.isArray(session.assignmentIds) ? session.assignmentIds : []),
    session.assignmentId,
    session.assignment_id,
    session.lessonId,
  ].map(comparable).filter(Boolean);
}

function participationStudentIdentityValues(record = {}) {
  return [
    record.studentUid,
    record.studentCode,
    record.studentEmail,
    record.studentEmailNormalized,
    record.studentName,
  ].map(comparable).filter(Boolean);
}

function participationRecordMatchesStudent(record = {}, student = {}) {
  const identities = new Set(studentIdentityValues(student));
  return participationStudentIdentityValues(record).some((value) => identities.has(value));
}

function participationRecordBelongsToClass(record = {}, klass = {}) {
  const classValues = new Set(classIdentityValues(klass));
  return [record.classId, record.className]
    .map(comparable)
    .filter(Boolean)
    .some((value) => classValues.has(value));
}

function participationRecordMatchesSession(record = {}, session = {}, timezone = ACCRA_TIMEZONE) {
  const sessionDate = isoDateInTimezone(sessionStart(session), timezone);
  if (!sessionDate || normalize(record.sessionDate) !== sessionDate) return false;
  const assignments = new Set(sessionAssignmentValues(session));
  if (!assignments.size) return true;
  const recordAssignment = comparable(record.assignmentId || record.lessonId);
  return Boolean(recordAssignment && assignments.has(recordAssignment));
}

async function loadParticipationForSessions(db, klass, sessions = [], timezone = ACCRA_TIMEZONE) {
  const dates = [...new Set(
    sessions.map((session) => isoDateInTimezone(sessionStart(session), timezone)).filter(Boolean),
  )];
  const records = new Map();
  for (const date of dates) {
    try {
      const snap = await db.collection(PARTICIPATION_RECORD_COLLECTION)
        .where("sessionDate", "==", date)
        .get();
      snap.docs.forEach((docSnap) => {
        const record = { id: docSnap.id, ...docSnap.data() };
        if (!participationRecordBelongsToClass(record, klass)) return;
        if (!sessions.some((session) => participationRecordMatchesSession(record, session, timezone))) return;
        records.set(docSnap.id, record);
      });
    } catch (error) {
      console.warn("attendance_participation_lookup_failed", {
        classId: normalize(klass.id || klass.classId || klass.name),
        date,
        message: error?.message || String(error),
      });
    }
  }
  return [...records.values()];
}

function summarizeStudentParticipation({ participationRecords = [], student, sessions = [], timezone = ACCRA_TIMEZONE } = {}) {
  const matched = participationRecords.filter((record) => (
    participationRecordMatchesStudent(record, student)
    && sessions.some((session) => participationRecordMatchesSession(record, session, timezone))
  ));
  if (!matched.length) return null;

  const lessonKeys = new Set();
  let participatedLessons = 0;
  let responses = 0;
  let correct = 0;
  let needsReview = 0;
  let skipped = 0;

  matched.forEach((record, index) => {
    const key = normalize(record.sessionId)
      || [normalize(record.assignmentId), normalize(record.sessionDate), index].join("|");
    lessonKeys.add(key);
    const recordCorrect = Math.max(0, Number(record.correct || 0));
    const recordNeedsReview = Math.max(0, Number(record.needsReview || 0));
    const recordTurns = Math.max(0, Number(record.turns || 0), recordCorrect + recordNeedsReview);
    const recordSkipped = Math.max(0, Number(record.skipped || 0));
    if (recordTurns > 0) participatedLessons += 1;
    responses += recordTurns;
    correct += recordCorrect;
    needsReview += recordNeedsReview;
    skipped += recordSkipped;
  });

  return {
    trackedLessons: lessonKeys.size,
    participatedLessons,
    responses,
    correct,
    needsReview,
    skipped,
  };
}

function buildParticipationText(participation, mode) {
  if (!participation) return "";
  const tracked = Math.max(0, Number(participation.trackedLessons || 0));
  const responses = Math.max(0, Number(participation.responses || 0));
  const correct = Math.max(0, Number(participation.correct || 0));
  const needsReview = Math.max(0, Number(participation.needsReview || 0));
  const skipped = Math.max(0, Number(participation.skipped || 0));
  const weekly = mode === MODE_WEEKLY;
  const lead = weekly
    ? " Class participation this week: participation was tracked in " + tracked + " lesson" + (tracked === 1 ? "" : "s") + "."
    : " Class participation:";
  const activity = responses > 0
    ? " Recorded responses: " + responses + "; Correct: " + correct + "; Needs review: " + needsReview + "; Skipped: " + skipped + "."
    : skipped > 0
      ? " No scored response was recorded; Skipped: " + skipped + "."
      : " No recorded response was saved for this lesson.";
  return lead
    + activity
    + " This participation summary is learning-support feedback only; it is not a grade and it does not change your attendance status."
    + " View your detailed participation in Falowen: "
    + PARTICIPATION_DETAILS_URL;
}
${END}`;

if (!source.includes(BEGIN)) {
  const anchor = "function buildEachClassMessage({";
  if (!source.includes(anchor)) throw new Error("Could not find attendance message builder anchor.");
  source = source.replace(anchor, `${helperBlock}\n\n${anchor}`);
}

function replaceOrConfirm(oldValue, newValue, label) {
  if (source.includes(newValue)) return;
  if (!source.includes(oldValue)) throw new Error(`Could not patch ${label}.`);
  source = source.replace(oldValue, newValue);
}

replaceOrConfirm(
  'function buildEachClassMessage({ student, klass, record, replyNote = "", timezone = ACCRA_TIMEZONE }) {',
  'function buildEachClassMessage({ student, klass, record, participation = null, replyNote = "", timezone = ACCRA_TIMEZONE }) {',
  "each-class message signature",
);
replaceOrConfirm(
  '  const correction = normalize(replyNote) ? ` ${normalize(replyNote)}` : "";\n  return `Hello ${name}, your attendance for ${normalize(klass.name || klass.className || klass.classId) || "your class"} — ${sessionLabel(record.session)} on ${formatDate(record.session.startsAt, timezone)} has been confirmed as ${status}.${checkinText}${methodText}${correction}`;',
  '  const participationText = buildParticipationText(participation, MODE_EACH_CLASS);\n  const correction = normalize(replyNote) ? ` ${normalize(replyNote)}` : "";\n  return `Hello ${name}, your attendance for ${normalize(klass.name || klass.className || klass.classId) || "your class"} — ${sessionLabel(record.session)} on ${formatDate(record.session.startsAt, timezone)} has been confirmed as ${status}.${checkinText}${methodText}${participationText}${correction}`;',
  "each-class participation text",
);
replaceOrConfirm(
  'function buildWeeklyMessage({ student, klass, records, replyNote = "", timezone = ACCRA_TIMEZONE }) {',
  'function buildWeeklyMessage({ student, klass, records, participation = null, replyNote = "", timezone = ACCRA_TIMEZONE }) {',
  "weekly message signature",
);
replaceOrConfirm(
  '  const correction = normalize(replyNote) ? ` ${normalize(replyNote)}` : "";\n  return `Hello ${name}, here is your attendance summary for ${normalize(klass.name || klass.className || klass.classId) || "your class"}, covering ${formatDate(first, timezone)} to ${formatDate(last, timezone)}. Present: ${counts.present || 0}; Late: ${counts.late || 0}; Excused: ${counts.excused || 0}; Absent: ${counts.absent || 0}. Attendance rate: ${attendanceRate(records)}%. Lessons: ${lessons}. How attendance works: Your attendance is normally recorded through your check-in, but a tutor may also record Present, Late or Excused manually. If you do not check in and a tutor has not recorded another status, the app marks you Absent. A Late status may come from a late check-in or a tutor\'s manual record; it does not necessarily mean you joined the class late. You are responsible for checking in for every class, so always open the check-in link and complete your check-in on time.${correction}`;',
  '  const participationText = buildParticipationText(participation, MODE_WEEKLY);\n  const correction = normalize(replyNote) ? ` ${normalize(replyNote)}` : "";\n  return `Hello ${name}, here is your attendance summary for ${normalize(klass.name || klass.className || klass.classId) || "your class"}, covering ${formatDate(first, timezone)} to ${formatDate(last, timezone)}. Present: ${counts.present || 0}; Late: ${counts.late || 0}; Excused: ${counts.excused || 0}; Absent: ${counts.absent || 0}. Attendance rate: ${attendanceRate(records)}%. Lessons: ${lessons}.${participationText} How attendance works: Your attendance is normally recorded through your check-in, but a tutor may also record Present, Late or Excused manually. If you do not check in and a tutor has not recorded another status, the app marks you Absent. A Late status may come from a late check-in or a tutor\'s manual record; it does not necessarily mean you joined the class late. You are responsible for checking in for every class, so always open the check-in link and complete your check-in on time.${correction}`;',
  "weekly participation text",
);

replaceOrConfirm(
  '    if (!groupDueAt || !sessionData.length) continue;\n\n    const rows = [];',
  '    if (!groupDueAt || !sessionData.length) continue;\n\n    let participationRecords = [];\n    try {\n      participationRecords = await loadParticipationForSessions(db, klass, group.sessions, timezone);\n    } catch (error) {\n      console.warn("attendance_participation_summary_unavailable", {\n        classId: normalize(klass.id || klass.classId || klass.name),\n        periodKey: group.periodKey,\n        message: error?.message || String(error),\n      });\n    }\n\n    const rows = [];',
  "participation lookup",
);

replaceOrConfirm(
  '      const message = mode === MODE_WEEKLY\n        ? buildWeeklyMessage({ student, klass, records, replyNote, timezone })\n        : buildEachClassMessage({ student, klass, record: records[0], replyNote, timezone });',
  '      const participation = summarizeStudentParticipation({\n        participationRecords,\n        student,\n        sessions: group.sessions,\n        timezone,\n      });\n      const message = mode === MODE_WEEKLY\n        ? buildWeeklyMessage({ student, klass, records, participation, replyNote, timezone })\n        : buildEachClassMessage({ student, klass, record: records[0], participation, replyNote, timezone });',
  "student participation summary",
);

replaceOrConfirm(
  '    attendanceStatus,\n    buildEachClassMessage,\n    buildWeeklyMessage,',
  '    attendanceStatus,\n    buildEachClassMessage,\n    buildWeeklyMessage,\n    buildParticipationText,\n    summarizeStudentParticipation,\n    participationRecordMatchesSession,\n    participationRecordMatchesStudent,',
  "test exports",
);

fs.writeFileSync(targetPath, source, "utf8");
console.log("Attendance summary emails now include student-safe class participation when available.");

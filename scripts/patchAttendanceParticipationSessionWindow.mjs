import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const targetPath = path.join(root, "functions", "attendanceConfirmationEmails.js");
const MARKER = "// ATTENDANCE PARTICIPATION SESSION WINDOW";
const LEGACY_GRACE_DAYS = 7;
let source = fs.readFileSync(targetPath, "utf8");

if (source.includes(MARKER)) {
  console.log("Attendance participation session-window matching already installed.");
  process.exit(0);
}
if (!source.includes("// ATTENDANCE PARTICIPATION RECAP + STREAK GOALS")) {
  throw new Error("Participation recap must be installed before session-window matching.");
}

const matcherPattern = /function participationRecordMatchesSession\(record = \{\}, session = \{\}, timezone = ACCRA_TIMEZONE\) \{[\s\S]*?\n\}/;
const matcher = `${MARKER}
const LEGACY_PARTICIPATION_MARKING_GRACE_DAYS = ${LEGACY_GRACE_DAYS};

function isoDayOffset(isoDate = "", offset = 0) {
  if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(normalize(isoDate))) return "";
  const date = new Date(isoDate + "T00:00:00.000Z");
  date.setUTCDate(date.getUTCDate() + Number(offset || 0));
  return date.toISOString().slice(0, 10);
}

function participationSessionId(session = {}) {
  return normalize(session.id || session.sessionId || session.classSessionId);
}

function participationRecordMatchesSession(record = {}, session = {}, timezone = ACCRA_TIMEZONE) {
  const expectedClassSessionId = participationSessionId(session);
  const storedClassSessionId = normalize(record.classSessionId);
  if (storedClassSessionId && expectedClassSessionId) {
    return storedClassSessionId === expectedClassSessionId;
  }

  const assignments = new Set(sessionAssignmentValues(session));
  const recordAssignment = comparable(record.assignmentId || record.lessonId);
  if (assignments.size && (!recordAssignment || !assignments.has(recordAssignment))) return false;

  const scheduledDate = isoDateInTimezone(sessionStart(session), timezone);
  const recordDate = normalize(record.sessionDate);
  if (!scheduledDate || !recordDate) return false;
  if (recordDate === scheduledDate) return true;

  // Legacy records were dated when the tutor marked them. Only records without a
  // canonical classSessionId may use this bounded late-marking fallback.
  if (storedClassSessionId) return false;
  const lastLegacyDate = isoDayOffset(scheduledDate, LEGACY_PARTICIPATION_MARKING_GRACE_DAYS);
  return recordDate > scheduledDate && recordDate <= lastLegacyDate;
}`;

if (!matcherPattern.test(source)) throw new Error("Could not locate participation session matcher.");
source = source.replace(matcherPattern, matcher);

const loaderPattern = /async function loadParticipationForSessions\(db, klass, sessions = \[\], timezone = ACCRA_TIMEZONE\) \{[\s\S]*?\n\}\n\n(?=function summarizeStudentParticipation)/;
const loader = `async function loadParticipationForSessions(db, klass, sessions = [], timezone = ACCRA_TIMEZONE) {
  const dates = [...new Set(
    sessions.flatMap((session) => {
      const scheduledDate = isoDateInTimezone(sessionStart(session), timezone);
      if (!scheduledDate) return [];
      return Array.from(
        { length: LEGACY_PARTICIPATION_MARKING_GRACE_DAYS + 1 },
        (_, index) => isoDayOffset(scheduledDate, index),
      ).filter(Boolean);
    }),
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
      throw error;
    }
  }
  return [...records.values()];
}

`;
if (!loaderPattern.test(source)) throw new Error("Could not locate participation loader.");
source = source.replace(loaderPattern, loader);

const matchedBlock = `  const matched = participationRecords.filter((record) => (
    participationRecordMatchesStudent(record, student)
    && sessions.some((session) => participationRecordMatchesSession(record, session, timezone))
  ));`;
const dedupeBlock = `  const matchingRecords = participationRecords.filter((record) => (
    participationRecordMatchesStudent(record, student)
    && sessions.some((session) => participationRecordMatchesSession(record, session, timezone))
  ));
  const matchedBySession = new Map();
  matchingRecords.forEach((record) => {
    const matchedSession = sessions
      .filter((session) => participationRecordMatchesSession(record, session, timezone))
      .sort((left, right) => {
        const leftExact = normalize(record.classSessionId) && normalize(record.classSessionId) === participationSessionId(left) ? 1 : 0;
        const rightExact = normalize(record.classSessionId) && normalize(record.classSessionId) === participationSessionId(right) ? 1 : 0;
        if (leftExact !== rightExact) return rightExact - leftExact;
        const recordDate = normalize(record.sessionDate);
        const leftDate = isoDateInTimezone(sessionStart(left), timezone);
        const rightDate = isoDateInTimezone(sessionStart(right), timezone);
        return Math.abs(Date.parse(recordDate) - Date.parse(leftDate)) - Math.abs(Date.parse(recordDate) - Date.parse(rightDate));
      })[0];
    const key = participationSessionId(matchedSession)
      || [isoDateInTimezone(sessionStart(matchedSession), timezone), ...sessionAssignmentValues(matchedSession)].filter(Boolean).join("|");
    if (!key) return;
    const previous = matchedBySession.get(key);
    if (!previous) {
      matchedBySession.set(key, record);
      return;
    }
    const previousCanonical = Boolean(normalize(previous.classSessionId));
    const currentCanonical = Boolean(normalize(record.classSessionId));
    if (currentCanonical && !previousCanonical) matchedBySession.set(key, record);
  });
  const matched = [...matchedBySession.values()];`;

if (!source.includes(dedupeBlock)) {
  if (!source.includes(matchedBlock)) throw new Error("Could not locate participation summary matching block.");
  source = source.replace(matchedBlock, dedupeBlock);
}

fs.writeFileSync(targetPath, source, "utf8");
console.log("Attendance emails now use exact class sessions and a bounded legacy late-marking fallback.");

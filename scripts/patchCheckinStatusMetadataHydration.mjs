import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const apiPath = path.join(repoRoot, "functions", "index.js");
const autoCheckinPath = path.join(repoRoot, "functions", "classSessionAutoCheckin.js");
const pagePath = path.join(repoRoot, "src", "pages", "CheckinPage.jsx");

function replaceOnce(source, before, after, label) {
  if (source.includes(after)) return source;
  if (!source.includes(before)) throw new Error(`Could not patch ${label}: source anchor missing.`);
  return source.replace(before, after);
}

let apiSource = fs.readFileSync(apiPath, "utf8");
if (!apiSource.includes("checkinMetadataHydrated: true")) {
  const statusPattern = /app\.get\("\/checkinStatus", async \(req, res\) => \{[\s\S]*?\n\}\);\n\n+async function mergeSessionDocuments/;
  // Keep generated source raw so regex escapes survive and avoid nested template interpolation.
  const statusReplacement = String.raw`app.get("/checkinStatus", async (req, res) => {
  try {
    const classId = normalizeClassComparable(req.query.classId || req.query.className);
    const sessionId = String(req.query.sessionId || req.query.session || "").trim();

    if (!classId || !sessionId) {
      return res.status(400).json({ error: "classId and sessionId are required" });
    }

    const sessionLookup = await getExistingSessionRef(classId, sessionId);
    const sessionRef = sessionLookup.existingRef || sessionLookup.requestedRef;
    const sessionSnap = sessionLookup.existingSnap || await sessionRef.get();
    const attendanceSession = sessionSnap.exists ? (sessionSnap.data() || {}) : {};

    let classSessionSnap = await db.collection("classSessions").doc(sessionId).get();
    if (!classSessionSnap.exists) {
      const aliasSnap = await db.collection("classSessions")
        .where("officialSessionId", "==", sessionId)
        .limit(1)
        .get();
      if (!aliasSnap.empty) classSessionSnap = aliasSnap.docs[0];
    }
    const classSession = classSessionSnap.exists ? (classSessionSnap.data() || {}) : {};

    const toMillis = (value) => {
      if (!value) return null;
      if (typeof value?.toMillis === "function") {
        const millis = Number(value.toMillis());
        return Number.isFinite(millis) ? millis : null;
      }
      if (typeof value?.toDate === "function") {
        const millis = value.toDate().getTime();
        return Number.isFinite(millis) ? millis : null;
      }
      const parsed = value instanceof Date ? value : new Date(value);
      const millis = parsed.getTime();
      return Number.isFinite(millis) ? millis : null;
    };
    const timezone = String(attendanceSession.timezone || classSession.timezone || "Africa/Accra").trim() || "Africa/Accra";
    const formatDateValue = (millis) => {
      if (!Number.isFinite(millis)) return "";
      const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).formatToParts(new Date(millis)).map((part) => [part.type, part.value]));
      return [parts.year, parts.month, parts.day].join("-");
    };
    const formatTimeValue = (millis) => {
      if (!Number.isFinite(millis)) return "";
      return new Intl.DateTimeFormat("en-GB", {
        timeZone: timezone,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(new Date(millis));
    };

    const startsAt = toMillis(
      attendanceSession.classStartsAt
      || classSession.startsAt
      || classSession.startAt
      || classSession.startDateTime
      || attendanceSession.autoOpenSessionStartsAt,
    );
    const endsAt = toMillis(
      attendanceSession.classEndsAt
      || classSession.endsAt
      || classSession.endAt
      || classSession.endDateTime
      || classSession.endDate,
    );
    const storedDate = [attendanceSession.date, classSession.date]
      .map((value) => String(value || "").trim())
      .find((value) => /^\d{4}-\d{2}-\d{2}$/.test(value)) || "";
    const classSessionAssignmentId = String(
      (Array.isArray(classSession.assignmentIds) ? classSession.assignmentIds[0] : "")
      || (Array.isArray(classSession.assignments) ? classSession.assignments[0] : "")
      || classSession.assignmentId
      || classSession.assignment_id
      || "",
    ).trim();
    const assignmentId = String(
      attendanceSession.assignmentId
      || attendanceSession.assignment_id
      || classSessionAssignmentId
      || "",
    ).trim();
    const topic = String(
      attendanceSession.topic
      || attendanceSession.sessionLabel
      || classSession.topic
      || classSession.title
      || classSession.sessionLabel
      || classSession.lesson
      || classSession.lessonTitle
      || "",
    ).trim();
    const sessionLabel = String(
      attendanceSession.sessionLabel
      || attendanceSession.topic
      || classSession.sessionLabel
      || classSession.topic
      || classSession.title
      || classSession.lesson
      || classSession.lessonTitle
      || "",
    ).trim();
    const metadata = {
      date: storedDate || formatDateValue(startsAt),
      sessionLabel,
      assignmentId,
      topic,
      chapter: String(attendanceSession.chapter || classSession.chapter || "").trim(),
      startTime: String(attendanceSession.startTime || "").trim() || formatTimeValue(startsAt),
      endTime: String(attendanceSession.endTime || "").trim() || formatTimeValue(endsAt),
      startsAt,
      endsAt,
      checkinMetadataHydrated: true,
    };

    const className = await publicCheckinClassName(classId);

    if (!sessionSnap.exists) {
      return res.json({
        ok: true,
        status: "not_opened",
        opened: false,
        serverTime: admin.firestore.Timestamp.now().toMillis(),
        className,
        ...metadata,
      });
    }

    const now = admin.firestore.Timestamp.now().toMillis();
    const opened = Boolean(attendanceSession.opened);
    const openFrom = attendanceSession.openFrom?.toMillis?.() || null;
    const openTo = attendanceSession.openTo?.toMillis?.() || null;

    let status = "closed";
    if (opened) {
      if (openFrom && now < openFrom) status = "scheduled";
      else if (openTo && now > openTo) status = "ended";
      else status = "open";
    }

    return res.json({
      ok: true,
      status,
      opened,
      openFrom,
      openTo,
      serverTime: now,
      className,
      ...metadata,
    });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
});


async function mergeSessionDocuments`;

  if (!statusPattern.test(apiSource)) {
    throw new Error("Could not find /checkinStatus handler for metadata hydration.");
  }
  apiSource = apiSource.replace(statusPattern, statusReplacement);
  if (!apiSource.includes('.find((value) => /^\\d{4}-\\d{2}-\\d{2}$/.test(value))')) {
    throw new Error("Generated check-in status date regex lost digit escapes.");
  }
}
fs.writeFileSync(apiPath, apiSource, "utf8");

let autoSource = fs.readFileSync(autoCheckinPath, "utf8");
if (!autoSource.includes("function sessionEnd(session = {})")) {
  autoSource = replaceOnce(
    autoSource,
    `function sessionStart(session = {}) {
  return asDate(session.startsAt || session.startAt || session.startDateTime || session.date);
}
`,
    `function sessionStart(session = {}) {
  return asDate(session.startsAt || session.startAt || session.startDateTime || session.date);
}

function sessionEnd(session = {}) {
  return asDate(session.endsAt || session.endAt || session.endDateTime || session.endDate);
}

function formatTime24(value, timezone = TZ) {
  const date = asDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}
`,
    "auto-open class start/end helpers",
  );
}
if (!autoSource.includes("classStartsAt: startsAt.toISOString()")) {
  autoSource = replaceOnce(
    autoSource,
    `      date: isoDate(startsAt, text(klass.timezone) || TZ),
      sessionLabel: topic,
      assignmentId,
      topic,
      chapter: parseAssignmentChapter(assignmentId),`,
    `      date: isoDate(startsAt, text(klass.timezone) || TZ),
      sessionLabel: topic,
      assignmentId,
      topic,
      chapter: parseAssignmentChapter(assignmentId),
      timezone: text(klass.timezone) || TZ,
      startTime: formatTime24(startsAt, text(klass.timezone) || TZ),
      endTime: formatTime24(sessionEnd(session), text(klass.timezone) || TZ),
      classStartsAt: startsAt.toISOString(),
      classEndsAt: sessionEnd(session)?.toISOString() || "",`,
    "auto-open check-in metadata",
  );
}
fs.writeFileSync(autoCheckinPath, autoSource, "utf8");

let pageSource = fs.readFileSync(pagePath, "utf8");
if (pageSource.includes('className="checkin-student-header"')) {
  const cleanPageRequired = [
    "const resolvedDate",
    "const resolvedAssignmentId",
    "checkinStatus?.className",
    "checkinStatus?.sessionLabel",
    "checkinStatus?.startsAt",
    "date: resolvedDate",
    "assignmentId: resolvedAssignmentId",
    "Teacher presentation slides are not shared from the attendance page.",
  ];
  cleanPageRequired.forEach((marker) => {
    if (!pageSource.includes(marker)) throw new Error(`Clean student check-in marker missing: ${marker}`);
  });
  const forbiddenStudentUi = [
    "getTeachingSlideByAssignmentId",
    "Download this teaching slide",
    "Assignment ID:",
    "Saved to:",
    "Normalized student number",
    "Saved under session ID",
  ];
  forbiddenStudentUi.forEach((marker) => {
    if (pageSource.includes(marker)) throw new Error(`Student check-in still exposes admin/teacher UI: ${marker}`);
  });
} else {
  throw new Error("Check-in page must use the clean verified-student experience.");
}
fs.writeFileSync(pagePath, pageSource, "utf8");

const apiRequired = [
  "checkinMetadataHydrated: true",
  "classSessionAssignmentId",
  "startTime:",
  "endTime:",
  "startsAt,",
  "endsAt,",
];
apiRequired.forEach((marker) => {
  if (!apiSource.includes(marker)) throw new Error(`Check-in status hydration marker missing: ${marker}`);
});

console.log("Concise check-in URLs now hydrate date, lesson, assignment and class timing from server session metadata.");

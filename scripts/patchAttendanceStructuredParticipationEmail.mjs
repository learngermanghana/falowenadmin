import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const targetPath = path.join(root, "functions", "attendanceConfirmationEmails.js");
const prerequisitePatch = path.join(root, "scripts", "patchAttendanceParticipationSessionWindow.mjs");
let source = fs.readFileSync(targetPath, "utf8");

const MARKER = "// STRUCTURED ATTENDANCE + PARTICIPATION DELIVERY";

// This patch must run after the participation summary/session matching stack so
// the worker has the exact student-safe participation object available when the
// outbound row is created.
if (!source.includes("// ATTENDANCE PARTICIPATION SESSION WINDOW")) {
  if (!source.includes("// ATTENDANCE PARTICIPATION RECAP + STREAK GOALS")) {
    const recapFailSafe = path.join(root, "scripts", "patchAttendanceParticipationRecapFailSafe.mjs");
    await import(pathToFileURL(recapFailSafe).href);
  }
  await import(pathToFileURL(prerequisitePatch).href);
  source = fs.readFileSync(targetPath, "utf8");
}

if (source.includes(MARKER)) {
  console.log("Structured attendance + participation delivery is already installed.");
  process.exit(0);
}

const helperBlock = `${MARKER}
function structuredParticipationPayload(participation, { participationStreak = 0, mode = MODE_WEEKLY, attendanceRecords = [] } = {}) {
  if (!participation) return null;
  return {
    noParticipation: Boolean(participation.noParticipation),
    trackedLessons: Math.max(0, Number(participation.trackedLessons || 0)),
    participatedLessons: Math.max(0, Number(participation.participatedLessons || 0)),
    responses: Math.max(0, Number(participation.responses || 0)),
    correct: Math.max(0, Number(participation.correct || 0)),
    needsReview: Math.max(0, Number(participation.needsReview || 0)),
    skipped: Math.max(0, Number(participation.skipped || 0)),
    strongConcepts: Array.isArray(participation.strongConcepts) ? participation.strongConcepts.slice(0, 3) : [],
    reviewConcepts: Array.isArray(participation.reviewConcepts) ? participation.reviewConcepts.slice(0, 3) : [],
    reviewRecommendation: normalize(participation.reviewRecommendation),
    consecutiveNoParticipation: Math.max(0, Number(participationStreak || 0)),
    latestSessionId: normalize(participation.latestSessionId),
    detailsUrl: participationDetailsUrl(participation),
    text: buildParticipationText(participation, mode, {
      attendanceRecords,
      streak: participationStreak,
    }).trim(),
  };
}

function structuredAttendancePayload({ records = [], participation = null, participationStreak = 0, mode = MODE_WEEKLY, periodKey = "", timezone = ACCRA_TIMEZONE } = {}) {
  const counts = records.reduce((result, record) => {
    const status = comparable(record?.status);
    if (["present", "late", "excused", "absent"].includes(status)) {
      result[status] += 1;
    }
    return result;
  }, { present: 0, late: 0, excused: 0, absent: 0 });

  return {
    schemaVersion: 2,
    kind: "attendance_participation_summary",
    mode,
    periodKey: normalize(periodKey),
    attendance: {
      ...counts,
      rate: attendanceRate(records),
      lessons: records.map((record) => ({
        sessionId: normalize(record?.session?.id || record?.session?.classSessionId),
        date: isoDateInTimezone(record?.session?.startsAt, timezone),
        label: formatDate(record?.session?.startsAt, timezone),
        status: comparable(record?.status),
      })),
    },
    participation: structuredParticipationPayload(participation, {
      participationStreak,
      mode,
      attendanceRecords: records,
    }),
  };
}

function rendererSafeCombinedMessage(message = "") {
  return normalize(message)
    .replace(/\. Present:/, ".\\n\\nAttendance\\nPresent:")
    .replace(/\. Attendance rate:/, ".\\nAttendance rate:")
    .replace(/\. Lessons:/, ".\\n\\nLesson record\\n")
    .replace(/\. Class participation this week:/, ".\\n\\nClass participation this week:")
    .replace(/\. Class participation:/, ".\\n\\nClass participation:")
    .replace(/ How attendance works:/, "\\n\\nHow attendance works:");
}
`;

const rowAnchor = "function rowForDelivery({ klass, student, mode, message, date, periodKey }) {";
if (!source.includes(rowAnchor)) throw new Error("Could not locate attendance delivery row builder.");
source = source.replace(rowAnchor, `${helperBlock}\nfunction rowForDelivery({ klass, student, mode, message, date, periodKey, deliveryPayload = null }) {`);

const oldRowBody = `  return {
    announcement: message,
    class: normalize(klass.name || klass.className || klass.classId || klass.id),
    date,
    link: "",
    topic: mode === MODE_WEEKLY ? \`Weekly Attendance Summary — \${periodKey}\` : "Attendance Confirmed",
    email: normalize(student.email),
    attach_certificate: "FALSE",
    cert_level: normalize(klass.levelId || klass.level),
    delivery_mode: "individual",
    allow_bcc_fallback: "FALSE",
  };`;

const newRowBody = `  const participation = deliveryPayload?.participation || null;
  const hasParticipationContext = Boolean(participation);
  const weeklyCombinedSubject = \`Weekly Attendance & Participation Summary — \${periodKey}\`;
  const subject = mode === MODE_WEEKLY
    ? (hasParticipationContext ? weeklyCombinedSubject : \`Weekly Attendance Summary — \${periodKey}\`)
    : (hasParticipationContext ? "Attendance & Participation Confirmed" : "Attendance Confirmed");

  // The current attendance-specific Apps Script renderer rebuilds the body from
  // attendance prose and drops the participation paragraph. Until that renderer
  // consumes participation_json, combined rows deliberately use the proven
  // general renderer so the complete message reaches the student. Structured
  // JSON is sent at the same time so the rich attendance renderer can adopt it
  // without another backend migration.
  const useCombinedRenderer = hasParticipationContext;
  const detailsUrl = normalize(participation?.detailsUrl);
  return {
    announcement: useCombinedRenderer ? rendererSafeCombinedMessage(message) : message,
    class: normalize(klass.name || klass.className || klass.classId || klass.id),
    date,
    link: detailsUrl,
    link_label: detailsUrl ? "View class participation" : "",
    topic: useCombinedRenderer ? subject : (mode === MODE_WEEKLY ? \`Weekly Attendance Summary — \${periodKey}\` : "Attendance Confirmed"),
    subject,
    email: normalize(student.email),
    attach_certificate: "FALSE",
    cert_level: normalize(klass.levelId || klass.level),
    delivery_mode: "individual",
    allow_bcc_fallback: "FALSE",
    email_type: useCombinedRenderer ? "general" : "attendance",
    show_progress: "FALSE",
    show_review: "FALSE",
    show_app_button: "TRUE",
    show_class: "TRUE",
    show_date: "TRUE",
    attendance_json: deliveryPayload ? JSON.stringify(deliveryPayload) : "",
    participation_json: participation ? JSON.stringify(participation) : "",
    participation_text: normalize(participation?.text),
    render_mode: useCombinedRenderer ? "attendance_with_participation" : "attendance",
  };`;

if (!source.includes(oldRowBody)) throw new Error("Could not locate attendance delivery row body.");
source = source.replace(oldRowBody, newRowBody);

const rowCall = `      rows.push(rowForDelivery({
        klass,
        student,
        mode,
        message,
        date: isoDateInTimezone(groupDueAt, timezone),
        periodKey: group.periodKey,
      }));`;
const rowCallReplacement = `      const deliveryPayload = structuredAttendancePayload({
        records,
        participation,
        participationStreak,
        mode,
        periodKey: group.periodKey,
        timezone,
      });
      rows.push(rowForDelivery({
        klass,
        student,
        mode,
        message,
        date: isoDateInTimezone(groupDueAt, timezone),
        periodKey: group.periodKey,
        deliveryPayload,
      }));`;
if (!source.includes(rowCall)) throw new Error("Could not locate attendance delivery row call.");
source = source.replace(rowCall, rowCallReplacement);

if (!source.includes("    structuredAttendancePayload,")) {
  const exportAnchor = "    participationRecordMatchesStudent,";
  if (!source.includes(exportAnchor)) throw new Error("Could not locate attendance participation test exports.");
  source = source.replace(
    exportAnchor,
    `${exportAnchor}\n    structuredParticipationPayload,\n    structuredAttendancePayload,\n    rendererSafeCombinedMessage,\n    rowForDelivery,`,
  );
}

fs.writeFileSync(targetPath, source, "utf8");
console.log("Attendance emails now carry structured participation and preserve it through the final email renderer.");

import fs from "node:fs";

const file = "src/pages/CanonicalAttendancePageV3.jsx";
let source = fs.readFileSync(file, "utf8");

const oldLessonLabel = `function lessonLabel(session, timezone = TIMEZONE) {
  const date = asDate(session?.startsAt);
  const assignmentId = String(session?.assignmentIds?.[0] || session?.assignment_id || "").trim();
  const topic = String(session?.topic || "Lesson details to be confirmed").trim();
  if (!date) return [assignmentId, topic].filter(Boolean).join(" — ");
  const text = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  return \`${"${text} · ${assignmentId ? `${assignmentId} — ` : \"\"}${topic}"}\`;
}`;

const newLessonLabel = `function attendanceLessonTitle(session, levelId = "") {
  const topic = String(session?.topic || "Lesson details to be confirmed").trim();
  const level = String(levelId || "").trim().toUpperCase();
  if (level === "A1") {
    const explicitDay = Number(session?.curriculumDay);
    const topicDay = topic.match(/^Day\\s+(\\d+)\\s*:/i);
    const day = Number.isFinite(explicitDay) ? explicitDay : Number(topicDay?.[1]);
    const title = topic.replace(/^Day\\s+\\d+\\s*:\\s*/i, "").trim();
    if (Number.isFinite(day)) return \`Day ${"${day}"} — ${"${title || \"Lesson details to be confirmed\"}"}\`;
  }
  const assignmentId = String(session?.assignmentIds?.[0] || session?.assignment_id || "").trim();
  return [assignmentId, topic].filter(Boolean).join(" — ");
}

function lessonLabel(session, timezone = TIMEZONE, levelId = "") {
  const date = asDate(session?.startsAt);
  const lesson = attendanceLessonTitle(session, levelId);
  if (!date) return lesson;
  const text = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  return \`${"${text} · ${lesson}"}\`;
}`;

if (!source.includes("function attendanceLessonTitle(")) {
  if (!source.includes(oldLessonLabel)) throw new Error("Attendance lesson-label anchor changed; update patchA1AttendanceDayLabels.mjs");
  source = source.replace(oldLessonLabel, newLessonLabel);
}

const optionBefore = `lessonLabel(session, klass.timezone || TIMEZONE)`;
const optionAfter = `lessonLabel(session, klass.timezone || TIMEZONE, klass.levelId || klass.level)`;
if (!source.includes(optionAfter)) {
  if (!source.includes(optionBefore)) throw new Error("Attendance lesson option anchor changed; update patchA1AttendanceDayLabels.mjs");
  source = source.replace(optionBefore, optionAfter);
}

const headingBefore = `{assignmentId ? \`${"${assignmentId} — "}\` : ""}{selected.topic || "Lesson details to be confirmed"}`;
const headingAfter = `{attendanceLessonTitle(selected, klass?.levelId || klass?.level)}`;
if (!source.includes(headingAfter)) {
  if (!source.includes(headingBefore)) throw new Error("Attendance lesson heading anchor changed; update patchA1AttendanceDayLabels.mjs");
  source = source.replace(headingBefore, headingAfter);
}

const noteBefore = `The lesson title and curriculum ID come from this class session. Change lesson mapping under Live Classes, not on the attendance page.`;
const noteAfter = `For A1, attendance shows one visible label per teaching day. The underlying chapter and curriculum IDs remain unchanged for assignments, marking and check-in.`;
if (!source.includes(noteAfter)) {
  if (!source.includes(noteBefore)) throw new Error("Attendance lesson note anchor changed; update patchA1AttendanceDayLabels.mjs");
  source = source.replace(noteBefore, noteAfter);
}

fs.writeFileSync(file, source);
console.log("A1 attendance day labels patched.");

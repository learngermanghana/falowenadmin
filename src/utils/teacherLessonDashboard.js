import { getTeachingSlideByAssignmentId, getSlidesByCourse } from "../data/teachingSlides.js";
import { assignmentIdsForSession } from "./liveClassSessionDedupe.js";

function normalize(value) {
  return String(value ?? "").trim();
}

function normalizeKey(value) {
  return normalize(value).toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function numberValue(...values) {
  for (const value of values) {
    if (value == null || value === "") continue;
    const parsed = Number(String(value).replace(/[^0-9.-]/g, ""));
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function sessionTime(value) {
  const parsed = new Date(value || 0);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

export function selectTeacherLessonSession(dashboard = {}, now = new Date()) {
  const sessions = Array.isArray(dashboard.sessions) ? dashboard.sessions : [];
  const nowMs = new Date(now).getTime();
  const active = sessions
    .filter((session) => {
      const status = normalize(session.status).toLowerCase();
      if (["cancelled", "completed", "superseded"].includes(status)) return false;
      const start = sessionTime(session.startsAt);
      const end = sessionTime(session.endsAt) || start + 90 * 60 * 1000;
      return start && start <= nowMs && end >= nowMs;
    })
    .sort((a, b) => sessionTime(a.startsAt) - sessionTime(b.startsAt))[0];

  return active || dashboard.nextSession || dashboard.latestCompletedSession || sessions[0] || null;
}

export function resolveTeacherLessonSlide({ dashboard = {}, session = null } = {}) {
  const targetSession = session || selectTeacherLessonSession(dashboard);
  if (!targetSession) return null;

  for (const assignmentId of assignmentIdsForSession(targetSession)) {
    const slide = getTeachingSlideByAssignmentId(assignmentId);
    if (slide) return slide;
  }

  const level = normalize(
    dashboard?.klass?.resolvedLevelId
      || dashboard?.klass?.levelId
      || dashboard?.klass?.level
      || targetSession.levelId
      || targetSession.level,
  ).toUpperCase();
  const slides = level ? getSlidesByCourse(level) : [];
  const day = Number(targetSession.curriculumDay || targetSession.dayNumber || 0);
  if (day > 0) return slides.find((slide) => Number(slide.dayNumber) === day) || slides[day - 1] || null;

  const index = Number(targetSession.curriculumIndex);
  if (Number.isInteger(index) && index >= 0) return slides[index] || null;
  return null;
}

export function previousTeacherLesson(slide = null) {
  if (!slide) return null;
  const day = Number(slide.dayNumber || String(slide.day || "").match(/\d+/)?.[0] || 0);
  if (!day || day <= 1) return null;
  return getSlidesByCourse(slide.course).find((candidate) => Number(candidate.dayNumber) === day - 1) || null;
}

export function learnerLessonUrl(slide = null) {
  if (!slide) return "https://www.falowen.app/campus/course";
  const level = normalize(slide.course).toUpperCase();
  const day = Number(slide.dayNumber || String(slide.day || "").match(/\d+/)?.[0] || 0);
  if (["A2", "B1", "B2", "C1", "C2"].includes(level) && day > 0) {
    return `https://www.falowen.app/campus/course/lesson/${encodeURIComponent(level)}/${day}`;
  }
  return "https://www.falowen.app/campus/course";
}

export function grammarTargetForSlide(slide = null) {
  if (!slide) return "";
  if (slide.canonicalLearnerLesson?.grammarTitle) return normalize(slide.canonicalLearnerLesson.grammarTitle);
  const lessonSpecific = Array.isArray(slide.grammarTeachDe) ? slide.grammarTeachDe.find(Boolean) : "";
  if (lessonSpecific) return normalize(lessonSpecific).replace(/^Zielstruktur:\s*/i, "");
  const support = Array.isArray(slide.teacherSupport?.grammarFocusEn) ? slide.teacherSupport.grammarFocusEn : [];
  return normalize(support[0] || "");
}

export function writingFocusForSlide(slide = null) {
  if (!slide) return "";
  const parts = Array.isArray(slide.workbookConnection?.parts) ? slide.workbookConnection.parts : [];
  const writePart = parts.find((item) => /write|schreib/i.test(normalize(item.label)));
  return normalize(
    writePart?.detailEn
      || slide.canonicalWritingPromptDe
      || slide.wrapUpTaskDe
      || "",
  );
}

function studentIdentityValues(student = {}) {
  return [
    student.studentCode,
    student.studentcode,
    student.uid,
    student.id,
    student.email,
    student.name,
  ].map(normalizeKey).filter(Boolean);
}

function submissionIdentityValues(row = {}) {
  return [
    row.studentCode,
    row.studentcode,
    row.uid,
    row.studentId,
    row.email,
    row.studentName,
    row.name,
  ].map(normalizeKey).filter(Boolean);
}

function assignmentValues(row = {}) {
  return [
    row.assignmentId,
    row.assignment_id,
    row.assignmentKey,
    row.assignment,
  ].map(normalizeKey).filter(Boolean);
}

function slideAssignmentValues(slide = null) {
  if (!slide) return [];
  return [
    slide.assignmentId,
    slide.assignment_id,
    slide.id,
    slide.title,
  ].map(normalizeKey).filter(Boolean);
}

function submissionMatchesStudent(row, student) {
  const studentIds = new Set(studentIdentityValues(student));
  return submissionIdentityValues(row).some((value) => studentIds.has(value));
}

function submissionMatchesSlide(row, slide) {
  const wanted = slideAssignmentValues(slide);
  if (!wanted.length) return false;
  const values = assignmentValues(row);
  return values.some((value) => wanted.some((target) => value === target || value.includes(target) || target.includes(value)));
}

function submissionTime(row = {}) {
  const value = row.resubmittedAt || row.submittedAt || row.createdAt || row.updatedAt || row.date;
  if (value instanceof Date) return value.getTime();
  if (typeof value?.toDate === "function") return value.toDate().getTime();
  return sessionTime(value);
}

function latestSubmission(rows = []) {
  return [...rows].sort((a, b) => submissionTime(b) - submissionTime(a))[0] || null;
}

function attendanceSummaryFor(analytics = null, student = {}) {
  const summaries = Array.isArray(analytics?.studentSummaries) ? analytics.studentSummaries : [];
  const ids = new Set(studentIdentityValues(student));
  return summaries.find((summary) => [
    summary.studentKey,
    summary.studentCode,
    summary.studentEmail,
    summary.studentName,
  ].map(normalizeKey).some((value) => ids.has(value))) || null;
}

export function buildTeacherRosterReadiness({
  students = [],
  submissions = [],
  currentSlide = null,
  previousSlide = null,
  attendanceAnalytics = null,
} = {}) {
  return (Array.isArray(students) ? students : []).map((student) => {
    const rows = (Array.isArray(submissions) ? submissions : []).filter((row) => submissionMatchesStudent(row, student));
    const currentRows = rows.filter((row) => submissionMatchesSlide(row, currentSlide));
    const previousRows = rows.filter((row) => submissionMatchesSlide(row, previousSlide));
    const latest = latestSubmission(rows);
    const score = numberValue(latest?.finalScore, latest?.previousScore, latest?.score);
    const attendance = attendanceSummaryFor(attendanceAnalytics, student);

    return {
      student,
      name: normalize(student.name || student.displayName || student.studentName || student.studentCode || student.email || "Student"),
      studentCode: normalize(student.studentCode || student.studentcode || student.uid || student.id),
      previousComplete: previousSlide ? previousRows.length > 0 : true,
      currentStarted: currentRows.length > 0,
      latestScore: score,
      latestAssignment: normalize(latest?.assignment || latest?.assignmentId || latest?.assignmentKey),
      attendancePercent: Number.isFinite(Number(attendance?.attendancePercent)) ? Number(attendance.attendancePercent) : null,
      consecutiveAbsences: Number(attendance?.consecutiveAbsences || 0),
    };
  });
}

export function summarizeTeacherReadiness(rows = []) {
  const list = Array.isArray(rows) ? rows : [];
  const previousReady = list.filter((row) => row.previousComplete).length;
  const currentStarted = list.filter((row) => row.currentStarted).length;
  const needsAttention = list.filter((row) =>
    !row.previousComplete
      || Number(row.consecutiveAbsences || 0) >= 2
      || (row.latestScore != null && Number(row.latestScore) < 60)
  ).length;
  return { total: list.length, previousReady, currentStarted, needsAttention };
}

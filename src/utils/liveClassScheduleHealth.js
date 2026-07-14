import { inspectTimetableIntegrity } from "./liveClassTimetableIntegrity.js";
import { latestSessionDateInTimezone } from "./liveClassScheduling.js";

const BROKEN_CODES = new Set([
  "session-count",
  "invalid-time",
  "invalid-duration",
  "duplicate-time",
  "overlap",
  "duplicate-curriculum-position",
  "missing-curriculum-position",
  "curriculum-order",
  "before-class-start",
]);

const CURRICULUM_METADATA_CODES = new Set([
  "missing-curriculum-identity",
  "missing-assignment-ids",
  "wrong-curriculum-identity",
  "stale-curriculum-index",
]);

function normalize(value) {
  return String(value || "").trim();
}

function countCode(items = [], code) {
  return items.filter((item) => item.code === code).length;
}

function allFindings(report = {}) {
  return [...(report.issues || []), ...(report.warnings || [])];
}

function activeSessionsForEndDate(sessions = []) {
  return sessions.filter((session) => {
    const status = normalize(session.status || "scheduled").toLowerCase();
    return status !== "cancelled" && status !== "superseded" && session.superseded !== true;
  });
}

export function classifyTimetableHealth(report = {}) {
  const findings = allFindings(report);
  const blockingIssues = findings.filter((item) => BROKEN_CODES.has(item.code));
  const advisoryIssues = findings.filter((item) => !BROKEN_CODES.has(item.code));
  const status = blockingIssues.length ? "broken" : advisoryIssues.length ? "warning" : "healthy";
  const missingByPosition = countCode(findings, "missing-curriculum-position");
  const missingByCount = Math.max(0, Number(report.expectedCount || 0) - Number(report.actualCount || 0));

  return {
    ...report,
    status,
    label: status === "broken" ? "Broken" : status === "warning" ? "Warning" : "Healthy",
    blockingIssues,
    advisoryIssues,
    findings,
    reminderSuppressed: status === "broken",
    counts: {
      duplicateTimes: countCode(findings, "duplicate-time"),
      overlaps: countCode(findings, "overlap"),
      missingLessons: Math.max(missingByPosition, missingByCount),
      outOfOrder: countCode(findings, "curriculum-order"),
      endDateMismatch: countCode(findings, "end-date-mismatch"),
      curriculumMetadata: findings.filter((item) => CURRICULUM_METADATA_CODES.has(item.code)).length,
      invalidTimes: countCode(findings, "invalid-time") + countCode(findings, "invalid-duration"),
      duplicateCurriculumPositions: countCode(findings, "duplicate-curriculum-position"),
      activeSupersededRecords: countCode(findings, "stale-superseded-status"),
    },
  };
}

export function buildClassScheduleHealth({
  klass = {},
  sessions = [],
  requireCurriculum = true,
  enforceEndDate = true,
} = {}) {
  const base = inspectTimetableIntegrity({
    klass,
    sessions,
    requireCurriculum,
    enforceEndDate: false,
  });
  const timezone = normalize(klass.timezone) || "Africa/Accra";
  const derivedEndDate = latestSessionDateInTimezone(activeSessionsForEndDate(sessions), timezone);
  const storedEndDate = normalize(klass.endDate);
  const issues = [...(base.issues || [])];

  if (enforceEndDate && derivedEndDate && storedEndDate !== derivedEndDate) {
    issues.push({
      code: "end-date-mismatch",
      message: `The class end date is ${storedEndDate || "not set"}, but the latest active timetable record is on ${derivedEndDate}.`,
      storedEndDate,
      derivedEndDate,
    });
  }

  return classifyTimetableHealth({
    ...base,
    healthy: issues.length === 0,
    derivedEndDate,
    issues,
  });
}

export function timetableHealthClassFields(health = {}, {
  validatedAt,
  validatedBy = "admin",
  scheduleVersion = Date.now(),
} = {}) {
  const broken = health.status === "broken";
  return {
    timetableIntegrityStatus: health.status || "broken",
    timetableIntegrityExpectedCount: Number(health.expectedCount || 0),
    timetableIntegrityActualCount: Number(health.actualCount || 0),
    timetableIntegrityIssueCount: Number(health.blockingIssues?.length || 0),
    timetableIntegrityWarningCount: Number(health.advisoryIssues?.length || 0),
    timetableIntegrityCodes: (health.findings || []).map((item) => item.code).slice(0, 50),
    timetableIntegrityMessages: (health.findings || []).map((item) => item.message).slice(0, 20),
    timetableIntegrityDerivedEndDate: health.derivedEndDate || "",
    timetableIntegrityValidatedAt: validatedAt,
    timetableIntegrityValidatedBy: validatedBy,
    scheduleRemindersSuppressed: broken,
    remindersSuppressed: broken,
    reminderSuppressionSource: broken ? "schedule-health" : "",
    scheduleReminderSuppressionReason: broken
      ? "Future class reminders are paused because the timetable health status is broken."
      : "",
    reminderScheduleVersion: scheduleVersion,
    reminderScheduleUpdatedAt: validatedAt,
  };
}

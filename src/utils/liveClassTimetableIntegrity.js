import { getCourseSessionGroups } from "../data/courseSessionGroups.js";
import { resolveOfficialSessionNumber } from "./liveClassLessonOrder.js";
import { sessionDateInTimezone } from "./liveClassScheduling.js";
import {
  isSupersededRecord,
  needsSupersededStatusNormalization,
} from "./liveClassSupersededRecords.js";

function normalize(value) {
  return String(value || "").trim();
}

function normalizeLevel(value) {
  return normalize(value).toUpperCase();
}

function toDate(value) {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  if (typeof value?.toMillis === "function") return new Date(value.toMillis());
  if (typeof value === "object" && Number.isFinite(value.seconds)) {
    return new Date((Number(value.seconds) * 1000) + Math.round(Number(value.nanoseconds || 0) / 1000000));
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function assignmentIds(session = {}) {
  const values = [session.assignmentIds, session.chapterIds, session.curriculumIds]
    .find((candidate) => Array.isArray(candidate) && candidate.length)
    || (session.assignment_id ? [session.assignment_id] : []);
  return [...new Set(values.map((value) => normalize(value).toUpperCase()).filter(Boolean))];
}

function sameAssignmentSet(left = [], right = []) {
  const leftSet = new Set(left.map((value) => normalize(value).toUpperCase()).filter(Boolean));
  const rightSet = new Set(right.map((value) => normalize(value).toUpperCase()).filter(Boolean));
  return leftSet.size === rightSet.size && [...leftSet].every((value) => rightSet.has(value));
}

function collisionEligible(session = {}) {
  return !isSupersededRecord(session) && normalize(session.status || "scheduled").toLowerCase() !== "cancelled";
}

function sessionLabel(session = {}, fallback = "session") {
  return normalize(session.topic || session.title || session.id) || fallback;
}

function pushIssue(issues, code, message, details = {}) {
  issues.push({ code, message, ...details });
}

export function inspectTimetableIntegrity({
  klass = {},
  sessions = [],
  requireCurriculum = true,
  enforceEndDate = true,
} = {}) {
  const levelId = normalizeLevel(klass.levelId || klass.level || klass.name);
  const groups = getCourseSessionGroups(levelId);
  const expectedCount = groups.length;
  const timezone = normalize(klass.timezone) || "Africa/Accra";
  const canonicalSessions = sessions.filter((session) => !isSupersededRecord(session));
  const issues = [];
  const warnings = [];

  sessions.forEach((session) => {
    if (!needsSupersededStatusNormalization(session)) return;
    const status = normalize(session.status || "scheduled").toLowerCase();
    pushIssue(
      warnings,
      "stale-superseded-status",
      `${sessionLabel(session)} is an inactive superseded alias but still stores status ${status}. It will be normalized automatically.`,
      { sessionId: normalize(session.id) },
    );
  });

  if (expectedCount > 0 && canonicalSessions.length !== expectedCount) {
    pushIssue(
      issues,
      "session-count",
      `Expected ${expectedCount} timetable records for ${levelId}, but found ${canonicalSessions.length}.`,
      { expectedCount, actualCount: canonicalSessions.length },
    );
  }

  const dated = [];
  canonicalSessions.forEach((session) => {
    const startsAt = toDate(session.startsAt);
    const endsAt = toDate(session.endsAt);
    if (!startsAt || !endsAt) {
      pushIssue(
        issues,
        "invalid-time",
        `${sessionLabel(session)} has a missing or invalid start/end time.`,
        { sessionId: normalize(session.id) },
      );
      return;
    }
    if (endsAt.getTime() <= startsAt.getTime()) {
      pushIssue(
        issues,
        "invalid-duration",
        `${sessionLabel(session)} must end after it starts.`,
        { sessionId: normalize(session.id) },
      );
      return;
    }
    dated.push({ session, startsAt, endsAt });
  });

  const activeDated = dated
    .filter(({ session }) => collisionEligible(session))
    .sort((left, right) => left.startsAt.getTime() - right.startsAt.getTime());

  for (let leftIndex = 0; leftIndex < activeDated.length; leftIndex += 1) {
    const left = activeDated[leftIndex];
    for (let rightIndex = leftIndex + 1; rightIndex < activeDated.length; rightIndex += 1) {
      const right = activeDated[rightIndex];
      if (right.startsAt.getTime() >= left.endsAt.getTime()) break;
      const duplicate = right.startsAt.getTime() === left.startsAt.getTime();
      pushIssue(
        issues,
        duplicate ? "duplicate-time" : "overlap",
        duplicate
          ? `${sessionLabel(left.session)} and ${sessionLabel(right.session)} use the same start time.`
          : `${sessionLabel(left.session)} overlaps ${sessionLabel(right.session)}.`,
        {
          sessionId: normalize(left.session.id),
          conflictingSessionId: normalize(right.session.id),
        },
      );
    }
  }

  const numbered = [];
  if (requireCurriculum && expectedCount > 0) {
    const byNumber = new Map();
    canonicalSessions.forEach((session) => {
      const number = resolveOfficialSessionNumber(session, groups, levelId);
      if (!number) {
        pushIssue(
          issues,
          "missing-curriculum-identity",
          `${sessionLabel(session)} cannot be matched to an official ${levelId} curriculum position.`,
          { sessionId: normalize(session.id) },
        );
        return;
      }

      if (!byNumber.has(number)) byNumber.set(number, []);
      byNumber.get(number).push(session);
      const group = groups[number - 1];
      const currentIds = assignmentIds(session);
      if (!currentIds.length) {
        pushIssue(
          issues,
          "missing-assignment-ids",
          `${sessionLabel(session)} has no curriculum assignment IDs.`,
          { sessionId: normalize(session.id), sessionNumber: number },
        );
      } else if (group && !sameAssignmentSet(currentIds, group.assignmentIds || [])) {
        pushIssue(
          issues,
          "wrong-curriculum-identity",
          `${sessionLabel(session)} does not contain the official assignment IDs for ${levelId} ${levelId === "A1" ? `Day ${number - 1}` : `Lesson ${number}`}.`,
          { sessionId: normalize(session.id), sessionNumber: number },
        );
      }

      const storedIndex = Number(session.curriculumIndex || 0);
      if (storedIndex && storedIndex !== number) {
        pushIssue(
          warnings,
          "stale-curriculum-index",
          `${sessionLabel(session)} has curriculum index ${storedIndex}, but its official position is ${number}.`,
          { sessionId: normalize(session.id), sessionNumber: number },
        );
      }
      numbered.push({ session, number, startsAt: toDate(session.startsAt) });
    });

    byNumber.forEach((records, number) => {
      if (records.length > 1) {
        pushIssue(
          issues,
          "duplicate-curriculum-position",
          `${records.length} records are assigned to official position ${number}.`,
          { sessionNumber: number, sessionIds: records.map((record) => normalize(record.id)) },
        );
      }
    });

    for (let number = 1; number <= expectedCount; number += 1) {
      if (!byNumber.has(number)) {
        pushIssue(
          issues,
          "missing-curriculum-position",
          `Official ${levelId} ${levelId === "A1" ? `Day ${number - 1}` : `Lesson ${number}`} is missing.`,
          { sessionNumber: number },
        );
      }
    }

    numbered.sort((left, right) => left.number - right.number);
    for (let index = 1; index < numbered.length; index += 1) {
      const previous = numbered[index - 1];
      const current = numbered[index];
      if (!previous.startsAt || !current.startsAt) continue;
      if (current.startsAt.getTime() <= previous.startsAt.getTime()) {
        pushIssue(
          issues,
          "curriculum-order",
          `${sessionLabel(current.session)} must be scheduled after ${sessionLabel(previous.session)}.`,
          {
            sessionId: normalize(current.session.id),
            previousSessionId: normalize(previous.session.id),
          },
        );
      }
    }
  }

  const finalRecord = requireCurriculum && numbered.length
    ? numbered.at(-1)
    : dated.slice().sort((left, right) => left.startsAt.getTime() - right.startsAt.getTime()).at(-1);
  const finalSession = finalRecord?.session || null;
  const derivedEndDate = finalSession ? sessionDateInTimezone(finalSession.startsAt, timezone) : "";
  const storedEndDate = normalize(klass.endDate);

  if (enforceEndDate && derivedEndDate && storedEndDate !== derivedEndDate) {
    pushIssue(
      issues,
      "end-date-mismatch",
      `The class end date is ${storedEndDate || "not set"}, but the final timetable record is on ${derivedEndDate}.`,
      { storedEndDate, derivedEndDate },
    );
  }

  const startDate = normalize(klass.startDate);
  if (startDate) {
    dated.forEach(({ session, startsAt }) => {
      const date = sessionDateInTimezone(startsAt, timezone);
      if (date && date < startDate) {
        pushIssue(
          issues,
          "before-class-start",
          `${sessionLabel(session)} is scheduled before the class start date ${startDate}.`,
          { sessionId: normalize(session.id), date, startDate },
        );
      }
    });
  }

  return {
    healthy: issues.length === 0,
    levelId,
    expectedCount,
    actualCount: canonicalSessions.length,
    derivedEndDate,
    issues,
    warnings,
  };
}

export function assertTimetableIntegrity(options = {}) {
  const report = inspectTimetableIntegrity(options);
  if (report.healthy) return report;

  const summary = report.issues.slice(0, 3).map((issue) => issue.message).join(" ");
  const remaining = Math.max(0, report.issues.length - 3);
  const error = new Error(
    `${summary}${remaining ? ` Plus ${remaining} more timetable issue(s).` : ""} Run Official class timetable repair before saving this change.`,
  );
  error.code = "live-class/timetable-integrity";
  error.integrityReport = report;
  throw error;
}

import test from "node:test";
import assert from "node:assert/strict";
import { getCourseSessionGroups } from "../src/data/courseSessionGroups.js";
import {
  calculateClassEndDate,
  generateSessionOccurrences,
} from "../src/utils/liveClassScheduling.js";
import {
  assertTimetableIntegrity,
  inspectTimetableIntegrity,
} from "../src/utils/liveClassTimetableIntegrity.js";

const a1Rules = [
  { day: "thu", startTime: "18:00", durationMinutes: 60 },
  { day: "fri", startTime: "18:00", durationMinutes: 60 },
  { day: "sat", startTime: "08:00", durationMinutes: 60 },
];

function buildA1Class(overrides = {}) {
  const startDate = overrides.startDate || "2026-06-19";
  const endDate = calculateClassEndDate({
    levelId: "A1",
    startDate,
    scheduleRules: a1Rules,
    excludedDates: [],
  });
  return {
    id: "a1-integrity-class",
    name: "A1 Integrity Klasse",
    levelId: "A1",
    startDate,
    endDate,
    timezone: "Africa/Accra",
    scheduleRules: a1Rules,
    ...overrides,
  };
}

function buildA1Sessions(klass = buildA1Class()) {
  const groups = getCourseSessionGroups("A1");
  const occurrences = generateSessionOccurrences({
    classId: klass.id,
    ...klass,
    excludedDates: [],
  });
  return occurrences.map((session, index) => ({
    ...session,
    topic: groups[index].topic,
    assignmentIds: groups[index].assignmentIds,
    chapterIds: groups[index].assignmentIds,
    curriculumIds: groups[index].assignmentIds,
    assignment_id: groups[index].assignmentIds[0] || "",
    curriculumIndex: index + 1,
    curriculumDay: groups[index].day,
  }));
}

test("new A1 schedules use exactly 25 grouped attendance sessions", () => {
  const klass = buildA1Class();
  const occurrences = generateSessionOccurrences({
    classId: klass.id,
    ...klass,
    excludedDates: [],
  });
  const report = assertTimetableIntegrity({
    klass,
    sessions: occurrences,
    requireCurriculum: false,
    enforceEndDate: true,
  });

  assert.equal(klass.endDate, "2026-08-14");
  assert.equal(occurrences.length, 25);
  assert.equal(report.healthy, true);
  assert.equal(report.expectedCount, 25);
  assert.equal(report.actualCount, 25);
  assert.equal(report.derivedEndDate, "2026-08-14");
});

test("a complete curriculum-mapped A1 timetable is healthy", () => {
  const klass = buildA1Class();
  const report = assertTimetableIntegrity({
    klass,
    sessions: buildA1Sessions(klass),
    requireCurriculum: true,
    enforceEndDate: true,
  });

  assert.equal(report.healthy, true);
  assert.deepEqual(report.issues, []);
});

test("the guard blocks missing timetable records", () => {
  const klass = buildA1Class();
  const report = inspectTimetableIntegrity({
    klass,
    sessions: buildA1Sessions(klass).slice(0, -1),
    requireCurriculum: true,
    enforceEndDate: true,
  });

  assert.equal(report.healthy, false);
  assert.ok(report.issues.some((issue) => issue.code === "session-count"));
  assert.ok(report.issues.some((issue) => issue.code === "missing-curriculum-position"));
  assert.ok(report.issues.some((issue) => issue.code === "end-date-mismatch"));
});

test("the guard blocks missing or incorrect curriculum identity", () => {
  const klass = buildA1Class();
  const sessions = buildA1Sessions(klass);
  sessions[13] = {
    ...sessions[13],
    assignmentIds: [],
    chapterIds: [],
    curriculumIds: [],
    assignment_id: "",
  };
  const report = inspectTimetableIntegrity({
    klass,
    sessions,
    requireCurriculum: true,
    enforceEndDate: true,
  });

  assert.equal(report.healthy, false);
  assert.ok(report.issues.some((issue) => issue.code === "missing-assignment-ids"));
});

test("the guard blocks duplicate and overlapping times", () => {
  const klass = buildA1Class();
  const duplicateSessions = buildA1Sessions(klass);
  duplicateSessions[1] = {
    ...duplicateSessions[1],
    startsAt: duplicateSessions[0].startsAt,
    endsAt: duplicateSessions[0].endsAt,
  };
  const duplicateReport = inspectTimetableIntegrity({
    klass,
    sessions: duplicateSessions,
    requireCurriculum: true,
    enforceEndDate: true,
  });
  assert.ok(duplicateReport.issues.some((issue) => issue.code === "duplicate-time"));

  const overlapSessions = buildA1Sessions(klass);
  const firstStart = new Date(overlapSessions[0].startsAt);
  overlapSessions[1] = {
    ...overlapSessions[1],
    startsAt: new Date(firstStart.getTime() + 30 * 60000).toISOString(),
    endsAt: new Date(firstStart.getTime() + 90 * 60000).toISOString(),
  };
  const overlapReport = inspectTimetableIntegrity({
    klass,
    sessions: overlapSessions,
    requireCurriculum: true,
    enforceEndDate: true,
  });
  assert.ok(overlapReport.issues.some((issue) => issue.code === "overlap"));
});

test("the guard blocks curriculum sessions that move out of order", () => {
  const klass = buildA1Class();
  const sessions = buildA1Sessions(klass);
  const day12Times = { startsAt: sessions[12].startsAt, endsAt: sessions[12].endsAt };
  const day13Times = { startsAt: sessions[13].startsAt, endsAt: sessions[13].endsAt };
  sessions[12] = { ...sessions[12], ...day13Times };
  sessions[13] = { ...sessions[13], ...day12Times };

  const report = inspectTimetableIntegrity({
    klass,
    sessions,
    requireCurriculum: true,
    enforceEndDate: true,
  });

  assert.equal(report.healthy, false);
  assert.ok(report.issues.some((issue) => issue.code === "curriculum-order"));
});

test("cancelled records still count, while superseded aliases are ignored", () => {
  const klass = buildA1Class();
  const sessions = buildA1Sessions(klass);
  sessions[7] = { ...sessions[7], status: "cancelled" };
  sessions.push({
    ...sessions[7],
    id: "old-duplicate-alias",
    status: "superseded",
    superseded: true,
  });

  const report = assertTimetableIntegrity({
    klass,
    sessions,
    requireCurriculum: true,
    enforceEndDate: true,
  });

  assert.equal(report.healthy, true);
  assert.equal(report.actualCount, 25);
});

test("integrity errors include the repair instruction and stable error code", () => {
  const klass = buildA1Class({ endDate: "2026-08-15" });
  assert.throws(
    () => assertTimetableIntegrity({
      klass,
      sessions: buildA1Sessions(buildA1Class()),
      requireCurriculum: true,
      enforceEndDate: true,
    }),
    (error) => {
      assert.equal(error.code, "live-class/timetable-integrity");
      assert.match(error.message, /Run Official class timetable repair/);
      assert.ok(error.integrityReport.issues.some((issue) => issue.code === "end-date-mismatch"));
      return true;
    },
  );
});

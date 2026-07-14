import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { getCourseSessionGroups } from "../src/data/courseSessionGroups.js";
import {
  calculateClassEndDate,
  generateSessionOccurrences,
} from "../src/utils/liveClassScheduling.js";
import {
  assertTimetableIntegrity,
  inspectTimetableIntegrity,
} from "../src/utils/liveClassTimetableIntegrity.js";
import { buildClassScheduleHealth } from "../src/utils/liveClassScheduleHealth.js";
import {
  buildSupersededStatusRepairs,
  isSupersededRecord,
  needsSupersededStatusNormalization,
} from "../src/utils/liveClassSupersededRecords.js";

const rules = [
  { day: "thu", startTime: "18:00", durationMinutes: 60 },
  { day: "fri", startTime: "18:00", durationMinutes: 60 },
  { day: "sat", startTime: "08:00", durationMinutes: 60 },
];

function buildClass() {
  const startDate = "2026-06-19";
  return {
    id: "a1-superseded-test",
    name: "A1 Superseded Test",
    levelId: "A1",
    startDate,
    endDate: calculateClassEndDate({
      levelId: "A1",
      startDate,
      scheduleRules: rules,
      excludedDates: [],
    }),
    timezone: "Africa/Accra",
    scheduleRules: rules,
  };
}

function buildSessions(klass) {
  const groups = getCourseSessionGroups("A1");
  return generateSessionOccurrences({
    classId: klass.id,
    ...klass,
    excludedDates: [],
  }).map((session, index) => ({
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

test("scheduled records marked superseded are advisory and do not block a valid timetable", () => {
  const klass = buildClass();
  const sessions = buildSessions(klass);
  const staleAliases = [
    { id: "alias-5.13", topic: "5.13 Vorstellungsgespräch", source: sessions[12] },
    { id: "alias-6.17", topic: "6.17. In die Apotheke gehen", source: sessions[16] },
    { id: "alias-7.19", topic: "7.19. Einkaufen – wo und wie?", source: sessions[18] },
  ].map(({ id, topic, source }) => ({
    ...source,
    id,
    topic,
    status: "scheduled",
    superseded: true,
    supersededBySessionId: source.id,
  }));

  const report = assertTimetableIntegrity({
    klass,
    sessions: [...sessions, ...staleAliases],
    requireCurriculum: true,
    enforceEndDate: true,
  });
  const inspected = inspectTimetableIntegrity({
    klass,
    sessions: [...sessions, ...staleAliases],
    requireCurriculum: true,
    enforceEndDate: true,
  });
  const health = buildClassScheduleHealth({
    klass,
    sessions: [...sessions, ...staleAliases],
    requireCurriculum: true,
    enforceEndDate: true,
  });

  assert.equal(report.healthy, true);
  assert.equal(report.actualCount, 25);
  assert.equal(inspected.issues.length, 0);
  assert.equal(inspected.warnings.filter((item) => item.code === "stale-superseded-status").length, 3);
  assert.equal(health.status, "warning");
  assert.equal(health.reminderSuppressed, false);
  assert.equal(health.counts.activeSupersededRecords, 3);
});

test("normalization repairs convert stale aliases to true superseded records", () => {
  const stale = {
    id: "alias-a2-7.19",
    topic: "7.19. Einkaufen – wo und wie?",
    startsAt: "2026-07-13T19:00:00.000Z",
    endsAt: "2026-07-13T21:00:00.000Z",
    status: "scheduled",
    superseded: true,
    supersededBySessionId: "canonical-a2-7.19",
    sequence: 4,
  };

  assert.equal(isSupersededRecord(stale), true);
  assert.equal(needsSupersededStatusNormalization(stale), true);

  const repairs = buildSupersededStatusRepairs([stale, stale]);
  assert.equal(repairs.length, 1);
  assert.equal(repairs[0].sessionId, stale.id);
  assert.equal(repairs[0].patch.status, "superseded");
  assert.equal(repairs[0].patch.originalStatus, "scheduled");
  assert.equal(repairs[0].patch.superseded, true);
  assert.equal(repairs[0].patch.remindersSuppressed, true);
  assert.equal(repairs[0].patch.startsAt, stale.startsAt);
  assert.equal(repairs[0].patch.endsAt, stale.endsAt);
  assert.equal(repairs[0].patch.sequence, 5);
});

test("Live Classes normalizes stale aliases before legacy reschedule recovery", () => {
  const recoverySource = fs.readFileSync(
    new URL("../src/services/liveClassRescheduleRecoveryService.js", import.meta.url),
    "utf8",
  );
  const cleanupSource = fs.readFileSync(
    new URL("../src/services/liveClassSupersededStatusService.js", import.meta.url),
    "utf8",
  );

  assert.match(recoverySource, /normalizeSupersededSessionStatuses\(normalizedClassId/);
  assert.match(recoverySource, /supersededRecordsNormalized/);
  assert.match(cleanupSource, /\.\.\.patch/);
  assert.match(cleanupSource, /sessionStatus:\s*"superseded"/);
  assert.match(cleanupSource, /live-class-superseded-status-normalized/);
});

import test from "node:test";
import assert from "node:assert/strict";
import {
  buildClassScheduleHealth,
  classifyTimetableHealth,
} from "../src/utils/liveClassScheduleHealth.js";

test("schedule health classifies clean, warning and broken timetables", () => {
  const healthy = classifyTimetableHealth({
    expectedCount: 25,
    actualCount: 25,
    issues: [],
    warnings: [],
  });
  assert.equal(healthy.status, "healthy");
  assert.equal(healthy.reminderSuppressed, false);

  const warning = classifyTimetableHealth({
    expectedCount: 25,
    actualCount: 25,
    issues: [{ code: "end-date-mismatch", message: "End date differs." }],
    warnings: [],
  });
  assert.equal(warning.status, "warning");
  assert.equal(warning.counts.endDateMismatch, 1);
  assert.equal(warning.reminderSuppressed, false);

  const broken = classifyTimetableHealth({
    expectedCount: 25,
    actualCount: 24,
    issues: [
      { code: "session-count", message: "One session is missing." },
      { code: "overlap", message: "Two lessons overlap." },
    ],
    warnings: [],
  });
  assert.equal(broken.status, "broken");
  assert.equal(broken.counts.missingLessons, 1);
  assert.equal(broken.counts.overlaps, 1);
  assert.equal(broken.reminderSuppressed, true);
});

test("missing curriculum metadata is a warning rather than a broken timetable", () => {
  const report = classifyTimetableHealth({
    expectedCount: 28,
    actualCount: 28,
    issues: [
      { code: "missing-assignment-ids", message: "Assignment IDs are missing." },
      { code: "wrong-curriculum-identity", message: "Curriculum metadata is stale." },
    ],
    warnings: [],
  });

  assert.equal(report.status, "warning");
  assert.equal(report.counts.curriculumMetadata, 2);
  assert.equal(report.reminderSuppressed, false);
});

test("a cancelled final session is excluded from the recalculated active class end date", () => {
  const health = buildClassScheduleHealth({
    klass: {
      id: "class-1",
      startDate: "2026-07-01",
      endDate: "2026-07-10",
      timezone: "Africa/Accra",
    },
    sessions: [
      {
        id: "session-1",
        startsAt: "2026-07-10T18:00:00.000Z",
        endsAt: "2026-07-10T19:00:00.000Z",
        status: "scheduled",
      },
      {
        id: "session-2",
        startsAt: "2026-07-17T18:00:00.000Z",
        endsAt: "2026-07-17T19:00:00.000Z",
        status: "cancelled",
      },
    ],
    requireCurriculum: false,
    enforceEndDate: true,
  });

  assert.equal(health.derivedEndDate, "2026-07-10");
  assert.equal(health.status, "healthy");
});

test("an outdated stored end date becomes a warning and does not pause reminders", () => {
  const health = buildClassScheduleHealth({
    klass: {
      id: "class-2",
      startDate: "2026-07-01",
      endDate: "2026-07-17",
      timezone: "Africa/Accra",
    },
    sessions: [
      {
        id: "session-1",
        startsAt: "2026-07-10T18:00:00.000Z",
        endsAt: "2026-07-10T19:00:00.000Z",
        status: "scheduled",
      },
      {
        id: "session-2",
        startsAt: "2026-07-17T18:00:00.000Z",
        endsAt: "2026-07-17T19:00:00.000Z",
        status: "cancelled",
      },
    ],
    requireCurriculum: false,
    enforceEndDate: true,
  });

  assert.equal(health.status, "warning");
  assert.equal(health.counts.endDateMismatch, 1);
  assert.equal(health.reminderSuppressed, false);
});

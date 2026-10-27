import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { getCourseSessionGroups } from "../src/data/courseSessionGroups.js";
import { buildFollowingScheduleRestorePlan } from "../src/utils/liveClassFollowingScheduleRestore.js";
import {
  assertTimetableIntegrity,
  inspectTimetableIntegrity,
} from "../src/utils/liveClassTimetableIntegrity.js";

const groups = getCourseSessionGroups("A1");

function sessionForDay(day, startsAt, extra = {}) {
  const group = groups.find((item) => Number(item.day) === day);
  return {
    id: `day-${day}`,
    classId: "a1-dortmund-forward",
    classRecordId: "a1-dortmund-forward",
    className: "A1 Dortmund Klasse",
    status: "scheduled",
    startsAt,
    endsAt: new Date(new Date(startsAt).getTime() + 60 * 60 * 1000).toISOString(),
    topic: group.topic,
    assignmentIds: group.assignmentIds,
    chapterIds: group.assignmentIds,
    curriculumIds: group.assignmentIds,
    assignment_id: group.assignmentIds[0],
    curriculumDay: day,
    curriculumIndex: groups.indexOf(group) + 1,
    ...extra,
  };
}

test("Day 5 on 18 Aug rebuilds Day 6 to the next still-available slot on 25 Aug", () => {
  const klass = {
    id: "a1-dortmund-forward",
    name: "A1 Dortmund Klasse",
    levelId: "A1",
    startDate: "2026-08-10",
    endDate: "2026-11-30",
    timezone: "Africa/Accra",
    scheduleRules: [
      { day: "mon", startTime: "18:00", durationMinutes: 60 },
      { day: "tue", startTime: "18:00", durationMinutes: 60 },
    ],
  };

  const day5 = sessionForDay(5, "2026-08-18T18:00:00.000Z", { repairPreferredRecord: true });
  const day6 = sessionForDay(6, "2026-08-24T18:00:00.000Z", { repairPreferredRecord: true });

  const plan = buildFollowingScheduleRestorePlan({
    classId: klass.id,
    klass,
    sessions: [day5, day6],
    anchorSessionId: day5.id,
    notBeforeStartsAt: "2026-08-25T15:20:00.000Z",
  });

  const next = plan.followingItems.find((item) => Number(item.group.day) === 6);
  assert.equal(plan.anchorStartsAt, "2026-08-18T18:00:00.000Z");
  assert.equal(plan.notBeforeStartsAt, "2026-08-25T15:20:00.000Z");
  assert.equal(next?.targetStartsAt, "2026-08-25T18:00:00.000Z");
  assert.equal(plan.restorableItems.some((item) => item.session?.id === day6.id), true);
});

function fullIntegritySession(sessionNumber, startsAt, extra = {}) {
  const group = groups[sessionNumber - 1];
  return {
    id: `integrity-${sessionNumber}`,
    classId: "a1-dortmund-integrity",
    classRecordId: "a1-dortmund-integrity",
    status: "scheduled",
    startsAt,
    endsAt: new Date(new Date(startsAt).getTime() + 60 * 60 * 1000).toISOString(),
    topic: group.topic,
    assignmentIds: group.assignmentIds,
    chapterIds: group.assignmentIds,
    curriculumIds: group.assignmentIds,
    assignment_id: group.assignmentIds[0],
    curriculumDay: group.day,
    curriculumIndex: sessionNumber,
    ...extra,
  };
}

function anchoredIntegrityFixture() {
  const start = new Date("2026-08-01T18:00:00.000Z");
  const sessions = [];
  for (let sessionNumber = 1; sessionNumber <= groups.length; sessionNumber += 1) {
    if (sessionNumber === 3) continue;
    const startsAt = new Date(start.getTime() + (sessionNumber - 1) * 24 * 60 * 60 * 1000).toISOString();
    sessions.push(fullIntegritySession(sessionNumber, startsAt));
  }
  const anchorSession = sessions.find((session) => session.curriculumIndex === 6);
  return {
    klass: {
      id: "a1-dortmund-integrity",
      name: "A1 Dortmund Klasse",
      levelId: "A1",
      startDate: "2026-08-01",
      endDate: "2026-08-25",
      timezone: "Africa/Accra",
      scheduleAnchorSessionNumber: 6,
      scheduleAnchorDay: 5,
      scheduleAnchorStartsAt: anchorSession.startsAt,
      scheduleAnchorSource: "admin-selected-following-restore",
      scheduleAnchorMode: "rebuild-from-selected-session",
    },
    sessions,
  };
}

test("a missing historical record before the selected anchor does not block future rescheduling", () => {
  const { klass, sessions } = anchoredIntegrityFixture();
  const report = inspectTimetableIntegrity({
    klass,
    sessions,
    requireCurriculum: true,
    enforceEndDate: false,
  });

  assert.equal(report.healthy, true);
  assert.equal(report.issues.some((issue) => issue.code === "session-count"), false);
  assert.equal(report.warnings.some((warning) => warning.code === "historical-session-count"), true);
  assert.equal(report.warnings.some((warning) => warning.code === "historical-missing-curriculum-position"), true);
  assert.doesNotThrow(() => assertTimetableIntegrity({
    klass,
    sessions,
    requireCurriculum: true,
    enforceEndDate: false,
  }));
});

test("a duplicate after the selected anchor still blocks future rescheduling", () => {
  const { klass, sessions } = anchoredIntegrityFixture();
  const source = sessions.find((session) => session.curriculumIndex === 20);
  sessions.push({ ...source, id: "integrity-20-duplicate" });

  const report = inspectTimetableIntegrity({
    klass,
    sessions,
    requireCurriculum: true,
    enforceEndDate: false,
  });
  assert.equal(report.healthy, false);
  assert.equal(report.issues.some((issue) => issue.code === "duplicate-curriculum-position"), true);
  assert.throws(() => assertTimetableIntegrity({
    klass,
    sessions,
    requireCurriculum: true,
    enforceEndDate: false,
  }), /same start time|official position 20/);
});

test("saving an anchor persists the repair boundary even when no timetable move is needed", async () => {
  const serviceSource = await readFile(
    new URL("../src/services/liveClassFollowingScheduleRestoreService.js", import.meta.url),
    "utf8",
  );
  const noOpBranch = serviceSource.slice(
    serviceSource.indexOf("if (!plan.restorableItems.length && !plan.staleFutureRecords.length)"),
    serviceSource.indexOf("const className = normalize(klass.name || klass.className)"),
  );
  assert.match(noOpBranch, /anchorClassPatch/);
  assert.match(noOpBranch, /scheduleAnchorMode: "rebuild-from-selected-session"/);
  assert.match(noOpBranch, /anchorSaved: true/);
});

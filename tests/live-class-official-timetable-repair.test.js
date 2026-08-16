import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildOfficialLessonSchedulePlan } from "../src/utils/liveClassLessonOrder.js";
import { inspectTimetableIntegrity } from "../src/utils/liveClassTimetableIntegrity.js";
import { buildSessionReschedulePlan } from "../src/utils/liveClassReschedulePlan.js";
import { getCourseSessionGroups } from "../src/data/courseSessionGroups.js";

const repairServicePath = new URL("../src/services/liveClassLessonDateRepairService.js", import.meta.url);
const compatibilityServicePath = new URL("../src/services/liveClassCompatibilityServiceBase.js", import.meta.url);
const EXCLUDED_DATES = ["2026-07-15", "2026-07-20", "2026-07-22"];
const SCHEDULE_RULES = [
  { day: "mon", startTime: "19:00", durationMinutes: 120 },
  { day: "tue", startTime: "19:00", durationMinutes: 120 },
  { day: "wed", startTime: "19:00", durationMinutes: 120 },
];

function session(lessonNumber, date) {
  return {
    id: `lesson-${lessonNumber}`,
    topic: `Lesson ${lessonNumber}: Example`,
    assignmentIds: [`A2-${lessonNumber}`],
    startsAt: `${date}T19:00:00.000Z`,
    endsAt: `${date}T21:00:00.000Z`,
    status: "scheduled",
  };
}

function reportedSessions() {
  return [
    session(1, "2026-06-01"),
    session(2, "2026-06-02"),
    session(3, "2026-06-03"),
    session(4, "2026-06-08"),
    session(5, "2026-06-09"),
    session(6, "2026-06-10"),
    session(7, "2026-06-15"),
    session(8, "2026-06-16"),
    session(9, "2026-06-17"),
    session(10, "2026-06-22"),
    session(11, "2026-06-23"),
    session(12, "2026-06-24"),
    session(13, "2026-06-29"),
    session(14, "2026-06-30"),
    session(15, "2026-07-01"),
    session(16, "2026-07-06"),
    session(17, "2026-07-07"),
    session(18, "2026-07-08"),
    session(19, "2026-07-21"),
    session(20, "2026-07-27"),
    session(21, "2026-07-13"),
    session(22, "2026-07-28"),
    session(23, "2026-07-14"),
    session(24, "2026-07-29"),
    session(25, "2026-08-03"),
  ];
}

function buildPlan(sessions) {
  return buildOfficialLessonSchedulePlan({
    classId: "a2-class",
    klass: {
      id: "a2-class",
      levelId: "A2",
      startDate: "2026-06-01",
      endDate: "2026-08-03",
      timezone: "Africa/Accra",
      scheduleRules: SCHEDULE_RULES,
    },
    sessions,
    excludedDates: EXCLUDED_DATES,
  });
}

test("repairs the reported A2 timetable to Day 0 orientation plus 28 lessons", () => {
  const plan = buildPlan(reportedSessions());

  assert.equal(plan.expectedLessons, 29);
  assert.equal(plan.currentSessions, 25);
  assert.equal(plan.missingLessons, 4);
  assert.equal(plan.items[0].group.day, 0);
  assert.equal(plan.items[0].group.assignmentIds[0], "A2-ORIENTATION");
  assert.equal(plan.endDate, "2026-08-11");

  const target = (lessonNumber) => plan.items.find((item) => item.lessonNumber === lessonNumber)?.targetStartsAt;
  assert.equal(target(19), "2026-07-13T19:00:00.000Z");
  assert.equal(target(20), "2026-07-14T19:00:00.000Z");
  assert.equal(target(21), "2026-07-21T19:00:00.000Z");
  assert.equal(target(22), "2026-07-27T19:00:00.000Z");
  assert.equal(target(23), "2026-07-28T19:00:00.000Z");
  assert.equal(target(26), "2026-08-04T19:00:00.000Z");
  assert.equal(target(27), "2026-08-05T19:00:00.000Z");
  assert.equal(target(28), "2026-08-10T19:00:00.000Z");
  assert.equal(target(29), "2026-08-11T19:00:00.000Z");
});

test("a Lesson 20 and Lesson 23 time collision is repaired into unique official slots", () => {
  const sessions = reportedSessions().map((item) => {
    if (item.id !== "lesson-20") return item;
    return {
      ...item,
      startsAt: "2026-07-14T19:00:00.000Z",
      endsAt: "2026-07-14T21:00:00.000Z",
    };
  });
  const plan = buildPlan(sessions);
  const lesson20 = plan.items.find((item) => item.lessonNumber === 20);
  const lesson23 = plan.items.find((item) => item.lessonNumber === 23);

  assert.equal(plan.collisionCount, 1);
  assert.equal(lesson20.targetStartsAt, "2026-07-14T19:00:00.000Z");
  assert.equal(lesson20.changed, false);
  assert.equal(lesson23.targetStartsAt, "2026-07-28T19:00:00.000Z");
  assert.equal(lesson23.changed, true);
  assert.notEqual(lesson20.targetStartsAt, lesson23.targetStartsAt);
});

test("the visible enriched record stays canonical and the generated alias is superseded", () => {
  const visibleDay20 = {
    ...session(21, "2026-07-15"),
    id: "visible-day-20",
    assignmentIds: ["A2-7.20"],
    repairPreferredRecord: true,
  };
  const generatedAlias = {
    ...session(21, "2026-07-14"),
    id: "generated-day-20-alias",
    classId: "a2-class",
    assignmentIds: ["A2-7.20"],
  };
  const sessions = reportedSessions()
    .filter((item) => item.id !== "lesson-21")
    .concat(visibleDay20, generatedAlias);
  const plan = buildPlan(sessions);
  const day20 = plan.items.find((item) => item.group.assignmentIds.includes("A2-7.20"));

  assert.equal(plan.missingLessons, 4);
  assert.equal(day20.session.id, "visible-day-20");
  assert.equal(day20.targetStartsAt, "2026-07-21T19:00:00.000Z");
  assert.equal(day20.changed, true);
  assert.equal(plan.duplicateCount, 1);
  assert.equal(plan.duplicateSessions[0].session.id, "generated-day-20-alias");
  assert.equal(plan.duplicateSessions[0].canonicalSessionId, "visible-day-20");
});

test("the repair service preserves visible identities and hides superseded aliases", async () => {
  const [repairSource, compatibilitySource] = await Promise.all([
    readFile(repairServicePath, "utf8"),
    readFile(compatibilityServicePath, "utf8"),
  ]);
  assert.match(repairSource, /loadRawRepairSessions/);
  assert.match(repairSource, /repairPreferredRecord:\s*true/);
  assert.match(repairSource, /status:\s*"superseded"/);
  assert.match(repairSource, /aliasesSuperseded/);
  assert.match(compatibilitySource, /filter\(isVisibleSession\)/);
  assert.match(compatibilitySource, /status !== "superseded"/);
});

test("loading an existing A2 or B1 class persists one-based lesson days", async () => {
  const compatibilitySource = await readFile(compatibilityServicePath, "utf8");

  assert.match(compatibilitySource, /repairOneBasedCurriculumDays/);
  assert.match(compatibilitySource, /\["A2", "B1"\]\.includes\(levelId\)/);
  assert.match(compatibilitySource, /batch\.update\(doc\(db, "classSessions", session\.id\), patch\)/);
  assert.match(compatibilitySource, /doc\(db, "attendance", String\(classId\), "sessions", session\.id\)/);
  assert.match(compatibilitySource, /curriculumDayNumbering:\s*"one-based"/);
  assert.match(compatibilitySource, /await repairOneBasedCurriculumDays/);
});

test("B1 official repair classifies an unassigned same-time session as an orphan", () => {
  const groups = getCourseSessionGroups("B1");
  assert.equal(groups.length, 29);
  const klass = {
    id: "b1-class",
    name: "B1 Klasse",
    levelId: "B1",
    startDate: "2026-08-03",
    endDate: "2026-09-10",
    timezone: "Africa/Accra",
    scheduleRules: [
      { day: "mon", startTime: "19:00", durationMinutes: 120 },
      { day: "tue", startTime: "19:00", durationMinutes: 120 },
      { day: "wed", startTime: "19:00", durationMinutes: 120 },
      { day: "thu", startTime: "19:00", durationMinutes: 120 },
      { day: "fri", startTime: "19:00", durationMinutes: 120 },
    ],
  };
  const initialPlan = buildOfficialLessonSchedulePlan({
    classId: klass.id,
    klass,
    sessions: [],
  });
  klass.endDate = initialPlan.endDate;
  const official = initialPlan.items.map((item) => ({
    id: `b1-lesson-${item.lessonNumber}`,
    classId: klass.id,
    status: "scheduled",
    topic: item.group.topic,
    assignmentIds: item.group.assignmentIds,
    chapterIds: item.group.assignmentIds,
    curriculumIds: item.group.assignmentIds,
    assignment_id: item.group.assignmentIds[0],
    curriculumIndex: item.lessonNumber,
    curriculumDay: item.group.day,
    startsAt: item.targetStartsAt,
    endsAt: item.targetEndsAt,
  }));
  const orphan = {
    id: "XEO4NwyAZ85gThEf7krP_2026-11-12_1900",
    classId: klass.id,
    status: "scheduled",
    startsAt: official[25].startsAt,
    endsAt: official[25].endsAt,
    assignmentIds: [],
    chapterIds: [],
    curriculumIds: [],
  };

  const before = inspectTimetableIntegrity({ klass, sessions: [...official, orphan] });
  assert.equal(before.actualCount, 30);
  assert.ok(before.issues.some((issue) => issue.code === "duplicate-time"));

  const repairPlan = buildOfficialLessonSchedulePlan({
    classId: klass.id,
    klass,
    sessions: [...official, orphan],
  });
  assert.equal(repairPlan.orphanCount, 1);
  assert.equal(repairPlan.orphanSessions[0].session.id, orphan.id);
  assert.equal(repairPlan.orphanSessions[0].matchedCanonicalStart, true);
  assert.equal(repairPlan.orphanSessions[0].canonicalSessionId, official[25].id);

  const repaired = [...official, {
    ...orphan,
    status: "superseded",
    superseded: true,
    supersededBySessionId: official[25].id,
    remindersSuppressed: true,
  }];
  const after = inspectTimetableIntegrity({ klass, sessions: repaired });
  assert.equal(after.healthy, true);
  assert.equal(after.actualCount, 29);
  assert.equal(after.expectedCount, 29);
  assert.equal(after.issues.some((issue) => issue.code === "duplicate-time"), false);
  assert.equal(after.issues.some((issue) =>
    issue.code === "missing-assignment-ids" && issue.sessionId === orphan.id), false);

  const single = buildSessionReschedulePlan({
    klass,
    sessions: repaired,
    sessionId: official[10].id,
    targetStartsAt: new Date(new Date(official[10].startsAt).getTime() + 30 * 60000).toISOString(),
    targetEndsAt: new Date(new Date(official[10].endsAt).getTime() + 30 * 60000).toISOString(),
    mode: "single",
  });
  assert.equal(single.affectedCount, 1);

  // Historical B1 case: completed Day 3 is 20 Aug while Day 4 was stored on
  // 15 Aug. A following move can put Day 4 after Day 3 and rebuild later slots.
  const historical = repaired.map((record, index) => {
    if (index === 2) return { ...record, status: "completed", startsAt: "2026-08-20T19:00:00.000Z", endsAt: "2026-08-20T21:00:00.000Z" };
    if (index === 3) return { ...record, startsAt: "2026-08-15T19:00:00.000Z", endsAt: "2026-08-15T21:00:00.000Z" };
    return record;
  });
  const following = buildSessionReschedulePlan({
    klass,
    sessions: historical,
    sessionId: official[3].id,
    targetStartsAt: "2026-08-21T19:00:00.000Z",
    targetEndsAt: "2026-08-21T21:00:00.000Z",
    mode: "following",
  });
  assert.equal(following.mode, "following");
  assert.equal(following.affectedCount, 26);
});

test("B1 repair uses the persisted start date and repairs the reported Thu/Sat corruption", () => {
  const groups = getCourseSessionGroups("B1");
  const klass = {
    id: "XEO4NwyAZ85gThEf7krP",
    name: "B1 Klasse",
    levelId: "B1",
    startDate: "2026-08-06",
    timezone: "Africa/Accra",
    scheduleRules: [
      { day: "thu", startTime: "19:00", durationMinutes: 120 },
      { day: "sat", startTime: "07:00", durationMinutes: 120 },
    ],
    // This stale anchor used to shift the entire generated timetable forward.
    scheduleAnchorSessionNumber: 2,
    scheduleAnchorStartsAt: "2026-08-13T19:00:00.000Z",
  };
  const makeRecord = (id, day, startsAt, extra = {}) => ({
    id,
    classId: klass.id,
    topic: groups[day].topic,
    assignmentIds: groups[day].assignmentIds,
    curriculumIndex: day + 1,
    curriculumDay: groups[day].day,
    startsAt,
    endsAt: new Date(new Date(startsAt).getTime() + 120 * 60000).toISOString(),
    status: "scheduled",
    ...extra,
  });
  const broken = [
    makeRecord("day-0", 0, "2026-08-06T19:00:00.000Z"),
    makeRecord("day-1", 1, "2026-08-13T19:00:00.000Z"),
    makeRecord("day-2", 2, "2026-08-15T07:00:00.000Z"),
    makeRecord("stale-day-4", 4, "2026-08-15T08:00:00.000Z", { repairPreferredRecord: true }),
    makeRecord("day-3", 3, "2026-08-20T19:00:00.000Z"),
    makeRecord("completed-day-4", 4, "2026-08-22T07:00:00.000Z", {
      status: "completed",
      manuallyCompleted: true,
      attendanceCount: 8,
    }),
    makeRecord("day-5", 5, "2026-08-29T07:00:00.000Z"),
  ];

  const seedPlan = buildOfficialLessonSchedulePlan({ classId: klass.id, klass, sessions: broken });
  assert.equal(seedPlan.scheduleAnchor, null);
  assert.equal(seedPlan.items[4].session.id, "completed-day-4");
  assert.equal(seedPlan.duplicateSessions[0].session.id, "stale-day-4");

  const canonical = seedPlan.items.map((item) => ({
    ...(item.session || { id: `generated-day-${item.lessonNumber - 1}`, status: "scheduled" }),
    topic: item.group.topic,
    assignmentIds: item.group.assignmentIds,
    curriculumIndex: item.lessonNumber,
    curriculumDay: item.group.day,
    startsAt: item.targetStartsAt,
    endsAt: item.targetEndsAt,
  }));
  const orphan = {
    id: "XEO4NwyAZ85gThEf7krP_2026-11-12_1900",
    classId: klass.id,
    status: "scheduled",
    startsAt: canonical[28].startsAt,
    endsAt: canonical[28].endsAt,
  };
  const withOrphanPlan = buildOfficialLessonSchedulePlan({
    classId: klass.id,
    klass,
    sessions: [...canonical, broken[3], orphan],
  });
  assert.equal(withOrphanPlan.orphanSessions[0].session.id, orphan.id);

  const superseded = [broken[3], orphan].map((record) => ({
    ...record,
    status: "superseded",
    superseded: true,
  }));
  const repaired = [...canonical, ...superseded];
  const beginning = canonical.slice(0, 8).map((record, index) => [
    `Day ${index}`,
    record.startsAt.slice(0, 16),
  ]);
  assert.deepEqual(beginning, [
    ["Day 0", "2026-08-06T19:00"],
    ["Day 1", "2026-08-08T07:00"],
    ["Day 2", "2026-08-13T19:00"],
    ["Day 3", "2026-08-15T07:00"],
    ["Day 4", "2026-08-20T19:00"],
    ["Day 5", "2026-08-22T07:00"],
    ["Day 6", "2026-08-27T19:00"],
    ["Day 7", "2026-08-29T07:00"],
  ]);
  assert.equal(canonical.length, 29);
  assert.equal(canonical.filter((record) => record.curriculumIndex === 5).length, 1);

  klass.endDate = seedPlan.endDate;
  const integrity = inspectTimetableIntegrity({ klass, sessions: repaired });
  assert.equal(integrity.healthy, true);
  assert.equal(integrity.actualCount, 29);
  assert.deepEqual(integrity.issues, []);

  const repeated = buildOfficialLessonSchedulePlan({ classId: klass.id, klass, sessions: repaired });
  assert.equal(repeated.changedLessons, 0);
  assert.equal(repeated.missingLessons, 0);

  const shifted = buildSessionReschedulePlan({
    klass,
    sessions: repaired,
    sessionId: canonical[10].id,
    targetStartsAt: new Date(new Date(canonical[10].startsAt).getTime() + 30 * 60000).toISOString(),
    targetEndsAt: new Date(new Date(canonical[10].endsAt).getTime() + 30 * 60000).toISOString(),
    mode: "following",
  });
  assert.equal(shifted.affectedCount, 19);
});

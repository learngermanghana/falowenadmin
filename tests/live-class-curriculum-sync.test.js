import test from "node:test";
import assert from "node:assert/strict";
import { getCourseSessionGroups } from "../src/data/courseSessionGroups.js";
import { enrichSessionsWithStableCurriculum } from "../src/utils/liveClassSessionDedupe.js";
import { buildDisplayedCurriculumPatch } from "../src/utils/liveClassCurriculumSync.js";

test("Munich corrections persist topic and assignments even when day was already repaired", () => {
  const groups = getCourseSessionGroups("A2");
  const dates = { 17: "2026-09-09", 18: "2026-09-14", 19: "2026-09-15" };
  const raw = groups.map((group, index) => {
    const stale = groups[index + 1] || group;
    const date = dates[group.day] || (group.day < 17
      ? `2026-08-${String(index + 1).padStart(2, "0")}`
      : `2026-10-${String(index + 1).padStart(2, "0")}`);
    return { id: `session-${index}`, classId: "Y4xjoaF5wK0RmDyIEvkY",
      status: "scheduled", startsAt: `${date}T19:00:00.000Z`, endsAt: `${date}T20:30:00.000Z`,
      curriculumDay: group.day, curriculumIndex: group.index,
      topic: stale.topic, assignmentIds: stale.assignmentIds };
  });
  const displayed = enrichSessionsWithStableCurriculum({}, raw, groups);
  for (const day of [17, 18, 19]) {
    const shown = displayed.find(session => session.curriculumDay === day);
    const stored = raw.find(session => session.id === shown.id);
    const patch = buildDisplayedCurriculumPatch(stored, shown);
    assert.ok(patch, "same day must not hide stale curriculum fields");
    const persisted = { ...stored, ...patch };
    assert.equal(persisted.topic, groups.find(group => group.day === day).topic);
    assert.deepEqual(persisted.assignmentIds, shown.assignmentIds);
    assert.deepEqual(persisted.chapterIds, shown.assignmentIds);
    assert.deepEqual(persisted.curriculumIds, shown.assignmentIds);
    assert.equal(persisted.assignment_id, shown.assignmentIds[0]);
    assert.equal(persisted.startsAt, `${dates[day]}T19:00:00.000Z`);
    assert.equal(persisted.endsAt, stored.endsAt);
    assert.equal(persisted.status, stored.status);
    assert.equal(buildDisplayedCurriculumPatch(persisted, shown), null);
  }
});

test("a rescheduled displayed lesson retains its explicit assignment when synchronized", () => {
  const shown = { curriculumDay: 19, curriculumIndex: 19, topic: "Day 19: Einkaufen – wo und wie?",
    assignmentIds: ["A2-7.19"], startsAt: "2026-09-16T19:00:00Z", status: "rescheduled" };
  const patch = buildDisplayedCurriculumPatch({}, shown);
  assert.deepEqual(patch.assignmentIds, ["A2-7.19"]);
  assert.equal(patch.startsAt, undefined);
  assert.equal(patch.status, undefined);
});

import test from "node:test";
import assert from "node:assert/strict";
import { getCourseSessionGroups } from "../src/data/courseSessionGroups.js";
import { buildSessionReschedulePlan } from "../src/utils/liveClassReschedulePlan.js";
import { resolveManualRescheduleDateTime } from "../src/utils/liveClassManualReschedule.js";

const rules = [{ day: "Sat", startTime: "09:00", durationMinutes: 120 }];
test("following accepts the chosen Sunday outside the old Thursday/Friday timetable", () => {
  const resolved = resolveManualRescheduleDateTime({ currentStartsAt: "2026-11-06T09:00:00Z", payload: { moveMode: "following", startsAt: "2026-11-08T10:30" }, scheduleRules: [{ day: "Thu", startTime: "09:00" }, { day: "Fri", startTime: "09:00" }] });
  assert.equal(resolved.startsAt, "2026-11-08T10:30");
});
test("same anchor date can recalculate remaining lessons after weekly days change", () => {
  assert.equal(resolveManualRescheduleDateTime({ currentStartsAt: "2026-11-08T09:00:00Z", payload: { moveMode: "following", startsAt: "2026-11-08T09:00" }, scheduleRules: rules }).startsAt, "2026-11-08T09:00");
});
test("B1 after 27 lessons keeps history and recalculates all remaining lessons on Saturdays", () => {
  const groups = getCourseSessionGroups("B1");
  const sessions = groups.map((group, i) => ({ id: `lesson-${i + 1}`, topic: group.topic, curriculumIndex: i + 1, curriculumDay: group.day, assignmentIds: group.assignmentIds, startsAt: new Date(Date.UTC(2026, 5, i + 1, 9)).toISOString(), endsAt: new Date(Date.UTC(2026, 5, i + 1, 11)).toISOString(), status: i < 27 ? "completed" : "scheduled" }));
  const before = JSON.stringify(sessions);
  const plan = buildSessionReschedulePlan({ klass: { id: "b1", levelId: "B1", startDate: "2026-06-01", scheduleRules: rules }, sessions, sessionId: "lesson-28", targetStartsAt: "2026-11-14T09:00:00Z", targetEndsAt: "2026-11-14T11:00:00Z", mode: "following" });
  assert.equal(plan.affectedCount, groups.length - 27);
  assert.equal(plan.changes[0].startsAt, "2026-11-14T09:00:00.000Z");
  plan.changes.forEach((change, i) => { assert.equal(new Date(change.startsAt).getUTCDay(), 6); assert.deepEqual(change.session.assignmentIds, sessions[i + 27].assignmentIds); });
  assert.equal(JSON.stringify(sessions), before);
});

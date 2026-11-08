import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { getCourseSessionGroups } from "../src/data/courseSessionGroups.js";
import { buildFollowingScheduleRestorePlan } from "../src/utils/liveClassFollowingScheduleRestore.js";
import { buildOfficialLessonSchedulePlan } from "../src/utils/liveClassLessonOrder.js";

for (const levelId of ["A1", "A2", "B1"]) {
  test(`${levelId}: choosing the last untaught lesson preserves every earlier date and status`, async () => {
    const groups = getCourseSessionGroups(levelId);
    const classId = `history-${levelId}`;
    const sessions = groups.map((group, index) => ({
      id: `lesson-${index}`, classId, classRecordId: classId,
      topic: group.topic, curriculumIndex: index + 1, curriculumDay: group.day,
      assignmentIds: group.assignmentIds,
      startsAt: new Date(Date.UTC(2026, 7, 30 + index * 7, 7)).toISOString(),
      endsAt: new Date(Date.UTC(2026, 7, 30 + index * 7, 8, 30)).toISOString(),
      status: index === groups.length - 1 ? "scheduled" : "completed",
      completedBy: index === groups.length - 1 ? null : "tutor",
    }));
    // A completed lesson's stored future date must not commandeer the selected lesson.
    sessions[groups.length - 3].startsAt = "2026-11-14T07:00:00.000Z";
    sessions[groups.length - 3].endsAt = "2026-11-14T08:30:00.000Z";
    sessions[1].status = "scheduled"; // Earlier records stay unchanged even if their status was never corrected.
    const before = structuredClone(sessions);
    const klass = { id: classId, levelId, startDate: "2026-08-30", timezone: "Africa/Accra", scheduleRules: [{ day: "sat", startTime: "07:00", durationMinutes: 90 }, { day: "sun", startTime: "07:00", durationMinutes: 90 }] };
    const plan = buildFollowingScheduleRestorePlan({ classId, klass, sessions, nextLessonNumber: groups.length, nextDate: "2026-11-14" });
    assert.equal(plan.overrideRows.length, 1);
    assert.equal(plan.overrideRows[0].id, sessions.at(-1).id);
    assert.equal(plan.endDate, "2026-11-14");
    assert.equal(plan.staleFutureRecords.length, 0);
    assert.equal(plan.restorableItems.length, 0);
    assert.equal(plan.changedLessons, 0);
    plan.items.slice(0, -1).forEach((item, index) => {
      assert.equal(item.targetStartsAt, before[index].startsAt);
      assert.equal(item.targetEndsAt, before[index].endsAt);
      assert.equal(item.changed, false);
    });
    assert.deepEqual(sessions, before);
    const persisted = { ...klass, ...plan.anchoredClass };
    const refreshed = buildOfficialLessonSchedulePlan({ classId, klass: persisted, sessions: sessions.map(row => row.id === plan.overrideRows[0].id ? { ...row, ...plan.overrideRows[0].patch } : row) });
    assert.ok(refreshed.items.slice(0, -1).every(item => !item.changed));
    // Exercise the save path with captured Firestore writes, not only the preview.
    const source = (await readFile(new URL("../src/services/liveClassFollowingScheduleRestoreService.js", import.meta.url), "utf8"))
      .replace(/^import[\s\S]*?;\n/gm, "")
      .replace("export async function", "async function");
    const writes = [];
    let committed = false;
    const batch = {
      set: (ref, patch) => writes.push({ ref, patch }),
      update: (ref, patch) => writes.push({ ref, patch }),
      commit: async () => { committed = true; },
    };
    const dependencies = {
      db: "", collection: (_db, path) => path,
      doc: (...parts) => parts.filter(Boolean).join("/"),
      serverTimestamp: () => "timestamp", writeBatch: () => batch,
      buildFollowingScheduleRestorePlan,
      loadSchoolClosureDates: async () => [],
      loadRawRepairSessions: async () => sessions,
    };
    const restore = new Function(...Object.keys(dependencies), source + "\nreturn restoreFollowingSessionsToWeeklyPattern;")(...Object.values(dependencies));
    await restore({ classId, klass, sessions, nextLessonNumber: groups.length, nextDate: "2026-11-14", adminId: "staff" });
    assert.equal(committed, true);
    for (const historical of before.slice(0, -1)) {
      assert.ok(!writes.some(write => write.ref === `classSessions/${historical.id}` || write.ref === `attendance/${classId}/sessions/${historical.id}`), historical.id);
    }
    assert.ok(writes.some(write => write.ref === `classSessions/${sessions.at(-1).id}` && write.patch.startsAt === "2026-11-14T07:00:00.000Z"));

  });
}

test("completed next lesson requires explicit reopen instead of silently rewriting history", () => {
  const group = getCourseSessionGroups("B1").at(-1);
  assert.throws(() => buildFollowingScheduleRestorePlan({ classId: "b1", klass: { id: "b1", levelId: "B1", startDate: "2026-08-30", scheduleRules: [{ day: "sat", startTime: "07:00", durationMinutes: 90 }] }, sessions: [{ id: "last", classId: "b1", topic: group.topic, curriculumIndex: group.index + 1, assignmentIds: group.assignmentIds, status: "completed", startsAt: "2026-11-15T07:00:00Z", endsAt: "2026-11-15T08:30:00Z" }], nextLessonNumber: group.index + 1, nextDate: "2026-11-14" }), /Reopen/);
});

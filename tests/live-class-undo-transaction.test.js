import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { attendanceFingerprint, captureFields, restoreFields, assertUndoAvailable } from "../src/utils/liveClassUndo.js";
import { buildSessionReschedulePlan } from "../src/utils/liveClassReschedulePlan.js";
import { zonedLocalToUtcIso } from "../src/utils/liveClassScheduling.js";
import { getCourseSessionGroups } from "../src/data/courseSessionGroups.js";

async function loadFunction(file, name, dependencies) {
  const source = (await readFile(new URL(file, import.meta.url), "utf8")).replace(/^import[\s\S]*?;\n/gm, "").replace(/export async function/g, "async function");
  return new Function(...Object.keys(dependencies), source + `\nreturn ${name};`)(...Object.values(dependencies));
}
test("a schedule save captures reversible dates; undo preserves attendance and audits the reversal", async () => {
  const group = getCourseSessionGroups("B1").at(-1);
  const records = new Map([
    ["classes/b1", { levelId: "B1", endDate: "2026-11-15", sessionScheduleVersion: 0 }],
    ["classSessions/day28", { classId: "b1", topic: group.topic, assignmentIds: group.assignmentIds, curriculumIndex: group.index + 1, curriculumDay: group.day, startsAt: "2026-11-15T07:00:00.000Z", endsAt: "2026-11-15T08:30:00.000Z", status: "scheduled", sequence: 0 }],
    ["attendance/b1/sessions/day28", { startsAt: "2026-11-15T07:00:00.000Z", students: { learner: { present: true } }, sessionStatus: "scheduled" }],
  ]);
  const writes = [];
  let auditNumber = 0;
  const snapshot = ref => ({ exists: () => records.has(ref.path), data: () => structuredClone(records.get(ref.path)), id: ref.id });
  const dependencies = {
    db: {}, collection: (_db, path) => ({ path }),
    doc: (...parts) => { const path = parts.length === 1 ? `${parts[0].path}/audit-${++auditNumber}` : parts.slice(1).join("/"); return { path, id: path.split("/").at(-1) }; },
    getDoc: async ref => snapshot(ref), serverTimestamp: () => "SERVER_TIME", deleteField: () => "DELETE_FIELD",
    runTransaction: async (_db, callback) => {
      const pending = [];
      await callback({ get: async ref => snapshot(ref), update: (ref, patch) => pending.push({ ref, patch }), set: (ref, patch) => pending.push({ ref, patch }) });
      for (const item of pending) {
        const next = { ...records.get(item.ref.path), ...item.patch };
        for (const [key, value] of Object.entries(next)) if (value === "DELETE_FIELD") delete next[key];
        records.set(item.ref.path, next); writes.push(item);
      }
    },
    attendanceFingerprint, captureFields, restoreFields, assertUndoAvailable, buildSessionReschedulePlan, zonedLocalToUtcIso,
    normalizeScheduleRules: value => value,
    loadMutationClassSessions: async () => [{ ...records.get("classSessions/day28"), id: "day28" }],
    buildClassScheduleHealth: () => ({ derivedEndDate: "2026-11-14" }), timetableHealthClassFields: () => ({}),
  };
  const save = await loadFunction("../src/services/liveClassSessionDirectService.js", "rescheduleSession", dependencies);
  await save("day28", { classId: "b1", startsAt: "2026-11-14T07:00", moveMode: "single", reason: "Saturday", adminId: "staff", durationMinutes: 90 });
  const savedClass = records.get("classes/b1");
  assert.equal(savedClass.lastScheduleUndo.changes[0].session.values.startsAt, "2026-11-15T07:00:00.000Z");
  assert.equal("students" in savedClass.lastScheduleUndo.changes[0].attendance.values, false);
  assert.equal(records.get("classSessions/day28").startsAt, "2026-11-14T07:00:00.000Z");
  const undo = await loadFunction("../src/services/liveClassUndoService.js", "undoLastScheduleChange", dependencies);
  await undo("b1", "staff");
  assert.equal(records.get("classSessions/day28").startsAt, "2026-11-15T07:00:00.000Z");
  assert.equal(records.get("classes/b1").endDate, "2026-11-15");
  assert.equal(records.get("classes/b1").lastScheduleUndo, undefined);
  assert.deepEqual(records.get("attendance/b1/sessions/day28").students, { learner: { present: true } });
  assert.ok(writes.some(item => item.patch.type === "live-class-schedule-undone"));
});

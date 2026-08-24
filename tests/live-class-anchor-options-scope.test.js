import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const componentUrl = new URL("../src/components/LiveClassLessonDateRepair.jsx", import.meta.url);
const serviceUrl = new URL("../src/services/liveClassFollowingScheduleRestoreService.js", import.meta.url);

test("anchor options are built from sessions scoped to the selected class", async () => {
  const source = await readFile(componentUrl, "utf8");
  const helperMatch = source.match(/function belongsToSelectedClass[\s\S]*?\n}\n\nexport default/);
  assert.ok(helperMatch, "class ownership helper must remain next to the anchor UI");

  const helperSource = helperMatch[0].replace(/\n\nexport default[\s\S]*$/, "");
  const belongsToSelectedClass = new Function(`${helperSource}\nreturn belongsToSelectedClass;`)();

  const selectedClassId = "a2-munich-2026";
  const local = {
    id: "local-day-5",
    classId: selectedClassId,
    classRecordId: selectedClassId,
    className: "A2 Munich Klasse",
  };
  const foreignHigherPreference = {
    id: "foreign-day-5",
    classId: "a2-munich-second-cohort",
    classRecordId: "a2-munich-second-cohort",
    className: "A2 Munich Klasse",
    status: "completed",
    attendanceCount: 12,
  };
  const ownerlessLegacy = {
    id: "legacy-day-5",
    className: "A2 Munich Klasse",
  };

  assert.equal(belongsToSelectedClass(local, selectedClassId), true);
  assert.equal(belongsToSelectedClass(foreignHigherPreference, selectedClassId), false);
  assert.equal(belongsToSelectedClass(ownerlessLegacy, selectedClassId), true);

  assert.match(source, /const scopedSessions = useMemo\(/);
  const scopedPlanUses = source.match(/sessions: scopedSessions,/g) || [];
  assert.ok(scopedPlanUses.length >= 4, "preview, following preview, and repair actions must use the scoped session set");
});

test("no-op reminder repair uses the same selected-class session scope", async () => {
  const source = await readFile(serviceUrl, "utf8");
  assert.match(source, /const scopedRepairSessions = repairSessions\.filter/);
  assert.match(
    source,
    /releaseHealthyScheduleReminderSuppression\(\{[\s\S]*?sessions: scopedRepairSessions,[\s\S]*?plan,/,
  );
});

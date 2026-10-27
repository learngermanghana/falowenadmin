import test from "node:test";
import assert from "node:assert/strict";
import {
  hasUnsavedClassEditorChanges,
  liveClassRebuildSettings,
} from "../src/utils/classEditorState.js";
import { buildClassEndDateMismatchWarning } from "../src/utils/classEndDateWarning.js";

const saved = {
  name: "A1 Hamburg Klasse",
  levelId: "A1",
  startDate: "2026-06-12",
  endDate: "2026-08-26",
  timezone: "Africa/Accra",
  scheduleRules: [
    { day: "Mon", startTime: "11:00", durationMinutes: 120 },
    { day: "Tue", startTime: "11:00", durationMinutes: 120 },
    { day: "Wed", startTime: "14:00", durationMinutes: 120 },
  ],
};

test("equivalent saved schedule values compare equally", () => {
  const candidate = {
    ...saved,
    scheduleRules: [
      { day: "Monday", startTime: "11:00", durationMinutes: 120 },
      { day: "Tuesday", startTime: "11:00", durationMinutes: 120 },
      { day: "Wednesday", startTime: "14:00", durationMinutes: 120 },
    ],
  };
  assert.equal(liveClassRebuildSettings(candidate), liveClassRebuildSettings(saved));
  assert.equal(hasUnsavedClassEditorChanges(candidate, saved), false);
});

test("changed start date is treated as unsaved schedule data", () => {
  assert.equal(hasUnsavedClassEditorChanges({ ...saved, startDate: "2026-06-29" }, saved), true);
});

test("changed weekly teaching time is treated as unsaved schedule data", () => {
  const candidate = {
    ...saved,
    scheduleRules: saved.scheduleRules.map((rule, index) => index === 0 ? { ...rule, startTime: "12:00" } : rule),
  };
  assert.equal(hasUnsavedClassEditorChanges(candidate, saved), true);
});

test("class editor warns when sessions extend beyond the saved graduation date", () => {
  assert.equal(
    buildClassEndDateMismatchWarning({ endDate: "2026-07-06", sessionDerivedEndDate: "2026-07-29" }),
    "This class has sessions after the saved graduation date. Rebuild/sync will update the class end date to July 29, 2026.",
  );
});

test("class editor does not warn when sessions end by the saved graduation date", () => {
  assert.equal(
    buildClassEndDateMismatchWarning({ endDate: "2026-07-29", sessionDerivedEndDate: "2026-07-06" }),
    "",
  );
});

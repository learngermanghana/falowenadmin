import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  isDeliberateManualReschedule,
  partitionRepairPlanItems,
} from "../src/utils/liveClassRepairManualOverrides.js";

const componentPath = new URL("../src/components/LiveClassLessonDateRepair.jsx", import.meta.url);

test("manual and rescheduled sessions are protected from official repair", () => {
  assert.equal(isDeliberateManualReschedule({ manualDateOverride: true }), true);
  assert.equal(isDeliberateManualReschedule({ status: "rescheduled" }), true);
  assert.equal(isDeliberateManualReschedule({ rescheduledAt: "2026-07-18T10:00:00.000Z" }), true);
  assert.equal(isDeliberateManualReschedule({ previousStartsAt: "2026-07-17T18:00:00.000Z" }), true);
  assert.equal(isDeliberateManualReschedule({ status: "scheduled" }), false);
});

test("a previous official repair does not permanently block a later repair", () => {
  assert.equal(isDeliberateManualReschedule({
    manualDateOverride: true,
    rescheduleReason: "A1 official 25-attendance sessions timetable repaired atomically without duplicate times.",
  }), false);
});

test("repair plan separates automatic corrections from deliberate moves", () => {
  const automatic = { lessonNumber: 14, changed: true, session: { status: "scheduled" } };
  const manual = {
    lessonNumber: 15,
    changed: true,
    session: {
      status: "rescheduled",
      previousStartsAt: "2026-07-17T18:00:00.000Z",
      startsAt: "2026-07-18T08:00:00.000Z",
    },
  };
  const unchanged = { lessonNumber: 16, changed: false, session: { status: "scheduled" } };

  const result = partitionRepairPlanItems([automatic, manual, unchanged]);
  assert.deepEqual(result.automaticItems, [automatic]);
  assert.deepEqual(result.preservedItems, [manual]);
});

test("repair UI blocks destructive reset and explains preserved moves", async () => {
  const source = await readFile(componentPath, "utf8");
  assert.match(source, /repairBlockedByManualMoves/);
  assert.match(source, /deliberately moved session\(s\) will be preserved/i);
  assert.match(source, /Manual moves preserved/);
});

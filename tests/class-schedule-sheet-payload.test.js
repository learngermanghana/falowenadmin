import test from "node:test";
import assert from "node:assert/strict";

import { classRecordToScheduleSheetPayload } from "../src/utils/classScheduleSheetPayload.js";

test("classRecordToScheduleSheetPayload converts live class schedule fields for sheet sync", () => {
  const payload = classRecordToScheduleSheetPayload({
    name: "A2 Koln Klasse",
    startDate: "2026-05-18T00:00:00.000Z",
    endDate: "2026-07-21",
    scheduleRules: [
      { day: "Mon", startTime: "18:00", durationMinutes: 120 },
      { weekday: "Wednesday", time: "19:30" },
    ],
  });

  assert.deepEqual(payload, {
    className: "A2 Koln Klasse",
    startDate: "2026-05-18",
    endDate: "2026-07-21",
    time: "18:00",
    meetingDays: ["Mon", "Wed"],
    monTime: "18:00",
    tueTime: "",
    wedTime: "19:30",
    thuTime: "",
    friTime: "",
    satTime: "",
    sunTime: "",
  });
});

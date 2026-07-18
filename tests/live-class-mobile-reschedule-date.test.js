import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  classScheduleSlotLabel,
  dateTimeInTimezone,
  resolveManualRescheduleDateTime,
} from "../src/utils/liveClassManualReschedule.js";

const serviceIndexPath = new URL("../src/services/liveClassService.js", import.meta.url);
const manualServicePath = new URL("../src/services/liveClassManualRescheduleService.js", import.meta.url);
const recoveryServicePath = new URL("../src/services/liveClassRescheduleRecoveryService.js", import.meta.url);

const scheduleRules = [
  { day: "thu", startTime: "18:00", durationMinutes: 60 },
  { day: "fri", startTime: "18:00", durationMinutes: 60 },
  { day: "sat", startTime: "08:00", durationMinutes: 60 },
];

async function source(path) {
  return readFile(path, "utf8");
}

test("mobile picker value wins when React payload still contains the old date", () => {
  const resolved = resolveManualRescheduleDateTime({
    currentStartsAt: "2026-07-14T19:00:00.000Z",
    payload: {
      startsAt: "2026-07-14T19:00",
      localDate: "2026-07-14",
      localTime: "19:00",
    },
    domStartsAt: "2026-07-15T19:00",
    timezone: "Africa/Accra",
  });

  assert.equal(resolved.previousLocalDateTime, "2026-07-14T19:00");
  assert.equal(resolved.startsAt, "2026-07-15T19:00");
  assert.equal(resolved.localDate, "2026-07-15");
  assert.equal(resolved.localTime, "19:00");
  assert.equal(resolved.source, "mobile-form");
});

test("saved Thursday and Friday timetable slots are accepted", () => {
  const thursday = resolveManualRescheduleDateTime({
    currentStartsAt: "2026-07-15T18:00:00.000Z",
    payload: { localDate: "2026-07-16", localTime: "18:00" },
    domStartsAt: "2026-07-16T18:00",
    timezone: "Africa/Accra",
    scheduleRules,
  });
  const friday = resolveManualRescheduleDateTime({
    currentStartsAt: "2026-07-16T18:00:00.000Z",
    payload: { localDate: "2026-07-17", localTime: "18:00" },
    domStartsAt: "2026-07-17T18:00",
    timezone: "Africa/Accra",
    scheduleRules,
  });

  assert.equal(thursday.startsAt, "2026-07-16T18:00");
  assert.equal(friday.startsAt, "2026-07-17T18:00");
  assert.equal(thursday.manualScheduleOverride, false);
  assert.equal(friday.manualScheduleOverride, false);
});

test("date-only Friday to Saturday move applies the Saturday 08:00 timetable rule", () => {
  const resolved = resolveManualRescheduleDateTime({
    currentStartsAt: "2026-07-17T18:00:00.000Z",
    payload: { localDate: "2026-07-18", localTime: "18:00" },
    domStartsAt: "2026-07-18T18:00",
    timezone: "Africa/Accra",
    scheduleRules,
  });

  assert.equal(resolved.startsAt, "2026-07-18T08:00");
  assert.equal(resolved.localTime, "08:00");
  assert.equal(resolved.scheduleRuleApplied, true);
  assert.equal(resolved.source, "mobile-form-class-weekday-rule");
});

test("Sunday is rejected when Manual override is not enabled", () => {
  assert.throws(
    () => resolveManualRescheduleDateTime({
      currentStartsAt: "2026-07-17T18:00:00.000Z",
      payload: { localDate: "2026-07-19", localTime: "08:00" },
      domStartsAt: "2026-07-19T08:00",
      timezone: "Africa/Accra",
      scheduleRules,
    }),
    (error) => {
      assert.equal(error.code, "live-class/outside-class-schedule");
      assert.match(error.message, /Thursday 18:00, Friday 18:00, Saturday 08:00/);
      return true;
    },
  );
});

test("a different Saturday time is rejected in normal mode", () => {
  assert.throws(
    () => resolveManualRescheduleDateTime({
      currentStartsAt: "2026-07-17T18:00:00.000Z",
      payload: { localDate: "2026-07-18", localTime: "10:00" },
      domStartsAt: "2026-07-18T10:00",
      timezone: "Africa/Accra",
      scheduleRules,
    }),
    (error) => error.code === "live-class/outside-class-schedule",
  );
});

test("an outside slot is accepted only with explicit Manual override", () => {
  const resolved = resolveManualRescheduleDateTime({
    currentStartsAt: "2026-07-17T18:00:00.000Z",
    payload: {
      localDate: "2026-07-19",
      localTime: "08:00",
      manualScheduleOverride: true,
    },
    domStartsAt: "2026-07-19T08:00",
    timezone: "Africa/Accra",
    scheduleRules,
  });

  assert.equal(resolved.startsAt, "2026-07-19T08:00");
  assert.equal(resolved.manualScheduleOverride, true);
  assert.equal(resolved.scheduleRuleApplied, false);
  assert.equal(resolved.source, "mobile-form-manual-schedule-override");
});

test("timetable label clearly lists permitted slots", () => {
  assert.equal(
    classScheduleSlotLabel(scheduleRules),
    "Thursday 18:00, Friday 18:00, Saturday 08:00",
  );
});

test("manual reschedule rejects a silent no-op instead of shifting following lessons", () => {
  assert.throws(
    () => resolveManualRescheduleDateTime({
      currentStartsAt: "2026-07-14T19:00:00.000Z",
      payload: { startsAt: "2026-07-14T19:00" },
      domStartsAt: "2026-07-14T19:00",
      timezone: "Africa/Accra",
    }),
    (error) => {
      assert.equal(error.code, "live-class/no-reschedule-change");
      assert.match(error.message, /same date and time/i);
      return true;
    },
  );
});

test("explicit programmatic payload still works when no class rules are available", () => {
  const resolved = resolveManualRescheduleDateTime({
    currentStartsAt: "2026-07-14T19:00:00.000Z",
    payload: { localDate: "2026-07-15", localTime: "19:00" },
    domStartsAt: "2026-07-14T19:00",
    timezone: "Africa/Accra",
  });

  assert.equal(resolved.startsAt, "2026-07-15T19:00");
  assert.equal(resolved.source, "payload");
});

test("timezone formatter keeps Ghana local date and time stable", () => {
  assert.equal(
    dateTimeInTimezone("2026-07-15T19:00:00.000Z", "Africa/Accra"),
    "2026-07-15T19:00",
  );
});

test("manual UI uses schedule protection and records explicit overrides", async () => {
  const [serviceIndex, manualService, recoveryService] = await Promise.all([
    source(serviceIndexPath),
    source(manualServicePath),
    source(recoveryServicePath),
  ]);

  assert.match(serviceIndex, /rescheduleSession.*liveClassManualRescheduleService\.js/s);
  assert.match(manualService, /input\[type="datetime-local"\]/);
  assert.match(manualService, /resolveManualRescheduleDateTime/);
  assert.match(manualService, /scheduleRules/);
  assert.match(manualService, /manualScheduleOverride/);
  assert.match(manualService, /window\.confirm/);
  assert.match(manualService, /manualDateOverrideAt/);
  assert.match(manualService, /rescheduleSessionDirect/);
  assert.match(recoveryService, /rescheduleSession.*liveClassSessionDirectService\.js/s);
});

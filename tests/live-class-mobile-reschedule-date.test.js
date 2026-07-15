import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  dateTimeInTimezone,
  resolveManualRescheduleDateTime,
} from "../src/utils/liveClassManualReschedule.js";

const serviceIndexPath = new URL("../src/services/liveClassService.js", import.meta.url);
const manualServicePath = new URL("../src/services/liveClassManualRescheduleService.js", import.meta.url);
const recoveryServicePath = new URL("../src/services/liveClassRescheduleRecoveryService.js", import.meta.url);

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

test("explicit programmatic payload still works when no changed mobile value exists", () => {
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

test("manual UI uses the mobile-safe adapter while legacy recovery stays direct", async () => {
  const [serviceIndex, manualService, recoveryService] = await Promise.all([
    source(serviceIndexPath),
    source(manualServicePath),
    source(recoveryServicePath),
  ]);

  assert.match(serviceIndex, /rescheduleSession.*liveClassManualRescheduleService\.js/s);
  assert.match(manualService, /input\[type="datetime-local"\]/);
  assert.match(manualService, /resolveManualRescheduleDateTime/);
  assert.match(manualService, /rescheduleSessionDirect/);
  assert.match(recoveryService, /rescheduleSession.*liveClassSessionDirectService\.js/s);
});

import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  EARLY_COMPLETION_ERROR_CODE,
  activeSessionStatusRestoresReminders,
  requiresEarlySessionCompletionOverride,
  sessionCompletionCutoff,
} from "../src/utils/sessionCompletionGuard.js";

test("completion before the scheduled class end requires an override", () => {
  const session = {
    startsAt: "2026-09-17T19:00:00.000Z",
    endsAt: "2026-09-17T20:30:00.000Z",
  };
  assert.equal(requiresEarlySessionCompletionOverride(session, new Date("2026-09-17T18:50:00.000Z")), true);
  assert.equal(requiresEarlySessionCompletionOverride(session, new Date("2026-09-17T19:45:00.000Z")), true);
  assert.equal(requiresEarlySessionCompletionOverride(session, new Date("2026-09-17T20:30:00.000Z")), false);
  assert.equal(requiresEarlySessionCompletionOverride(session, new Date("2026-09-17T20:31:00.000Z")), false);
});

test("missing end time still protects a future not-yet-started session", () => {
  const session = { startsAt: "2026-09-19T07:00:00.000Z" };
  assert.equal(sessionCompletionCutoff(session)?.toISOString(), "2026-09-19T07:00:00.000Z");
  assert.equal(requiresEarlySessionCompletionOverride(session, new Date("2026-09-18T10:00:00.000Z")), true);
});

test("scheduled, rescheduled and live states restore reminder eligibility", () => {
  assert.equal(activeSessionStatusRestoresReminders("scheduled"), true);
  assert.equal(activeSessionStatusRestoresReminders("RESCHEDULED"), true);
  assert.equal(activeSessionStatusRestoresReminders("live"), true);
  assert.equal(activeSessionStatusRestoresReminders("completed"), false);
  assert.equal(activeSessionStatusRestoresReminders("cancelled"), false);
});

test("generated Live Classes source enforces explicit early-completion override", () => {
  const service = fs.readFileSync("src/services/liveClassServiceBase.js", "utf8");
  const compatibility = fs.readFileSync("src/services/liveClassCompatibilityServiceBase.js", "utf8");
  const page = fs.readFileSync("src/pages/LiveClassesPageV2.jsx", "utf8");

  assert.match(service, /allowEarlyCompletion = false/);
  assert.match(service, /requiresEarlySessionCompletionOverride\(session\)/);
  assert.match(service, /error\.code = EARLY_COMPLETION_ERROR_CODE/);
  assert.match(service, /earlyCompletionOverride: Boolean\(earlyCompletion && allowEarlyCompletion\)/);
  assert.match(service, /restoresReminders[\s\S]*remindersSuppressed: false/);
  assert.match(compatibility, /activeSessionStatusRestoresReminders/);
  assert.match(compatibility, /remindersSuppressed: false/);
  assert.match(page, /Confirm EARLY completion override\?/);
  assert.match(page, /allowEarlyCompletion: earlyCompletion/);
  assert.equal(EARLY_COMPLETION_ERROR_CODE, "live-class/early-completion-confirmation-required");
});

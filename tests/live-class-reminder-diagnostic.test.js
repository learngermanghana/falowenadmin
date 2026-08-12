import test from "node:test";
import assert from "node:assert/strict";
import { buildClassReminderDiagnostic, reminderWindowStatus } from "../src/utils/liveClassReminderDiagnostic.js";

test("diagnostic flags missing roster matches even when session is eligible", () => {
  const result = buildClassReminderDiagnostic({
    klass: { timetableIntegrityStatus: "warning", timetableIntegrityCodes: ["end-date-mismatch"] },
    sessions: [{
      id: "a2-munich-next",
      status: "scheduled",
      startsAt: "2026-08-12T18:00:00.000Z",
      remindersSuppressed: false,
    }],
    students: [],
    now: "2026-08-12T12:00:00.000Z",
  });

  assert.equal(result.eligible, true);
  assert.equal(result.hasRecipients, false);
  assert.equal(result.activeStudentCount, 0);
  assert.equal(result.reminderWindow, "pending-30min");
  assert.equal(result.timetableHealth, "warning");
});

test("diagnostic reports reminder suppression on the next active session", () => {
  const result = buildClassReminderDiagnostic({
    sessions: [{
      id: "a2-munich-next",
      status: "scheduled",
      startsAt: "2026-08-12T18:00:00.000Z",
      remindersSuppressed: true,
    }],
    students: [{ name: "Student One", role: "student", status: "active" }],
    now: "2026-08-12T12:00:00.000Z",
  });

  assert.equal(result.eligible, false);
  assert.equal(result.suppressionReason, "remindersSuppressed is true");
  assert.equal(result.hasRecipients, true);
});

test("reminder windows match the worker 30/10 minute grace windows", () => {
  const start = "2026-08-12T18:00:00.000Z";
  assert.equal(reminderWindowStatus(start, "2026-08-12T17:31:00.000Z"), "30min-window");
  assert.equal(reminderWindowStatus(start, "2026-08-12T17:40:00.000Z"), "pending-10min");
  assert.equal(reminderWindowStatus(start, "2026-08-12T17:52:00.000Z"), "10min-window");
  assert.equal(reminderWindowStatus(start, "2026-08-12T17:58:00.000Z"), "reminder-windows-passed");
});

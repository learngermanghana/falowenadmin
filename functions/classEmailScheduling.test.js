const test = require("node:test");
const assert = require("node:assert/strict");

const reminder = require("./classSessionReminderEmails.js")._test;
const attendance = require("./attendanceConfirmationEmails.js")._test;

test("final class reminder catches a session moved inside the normal grace window", () => {
  const now = new Date("2026-08-14T10:00:00.000Z");
  const session = {
    id: "session-1",
    officialSessionId: "lesson-1",
    startsAt: "2026-08-14T10:02:00.000Z",
    status: "scheduled",
  };

  const due = reminder.findDueSessionReminders({
    sessions: [session],
    now,
    leadMinutes: [30, 10],
    graceMinutes: 7,
  });

  assert.deepEqual(due.map(({ leadMin }) => leadMin), [10]);
});

test("attendance delivery uses the class-specific announcement sheet configuration", () => {
  const fallback = {
    url: "https://global.example/webhook",
    token: "global-token",
    sheetName: "Global announcements",
    sheetGid: "100",
  };
  const klass = {
    attendanceConfirmationEmailDelivery: {
      url: "https://class.example/webhook",
      token: "class-token",
      sheetName: "Class announcements",
      sheetGid: "200",
    },
  };

  assert.deepEqual(attendance.resolveClassWebhookConfig(klass, fallback), {
    url: "https://class.example/webhook",
    token: "class-token",
    sheetName: "Class announcements",
    sheetGid: "200",
  });
});

test("attendance delivery falls back field-by-field to the global configuration", () => {
  assert.deepEqual(attendance.resolveClassWebhookConfig({
    attendanceConfirmationEmailDelivery: { sheetGid: "200" },
  }, {
    url: "https://global.example/webhook",
    token: "global-token",
    sheetName: "Global announcements",
    sheetGid: "100",
  }), {
    url: "https://global.example/webhook",
    token: "global-token",
    sheetName: "Global announcements",
    sheetGid: "200",
  });
});

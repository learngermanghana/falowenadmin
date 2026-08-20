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

test("class reminder keeps Day 4 when a stale Day 3 alias shares its class time", () => {
  const startsAt = "2026-08-19T17:00:00.000Z";
  const staleDay3 = {
    id: "stale-day-3",
    officialSessionId: "A1-DORTMUND-day-3",
    classRecordId: "xTq2ZiYSmtVlpr3I5Zon",
    curriculumIndex: 3,
    startsAt,
    status: "scheduled",
    topic: "Day 3: Personal Information, Articles, Adjectives and W-Questions",
    assignmentIds: ["A1-1.1-practice", "A1-1.2"],
  };
  const officialDay4 = {
    id: "official-day-4",
    officialSessionId: "A1-DORTMUND-day-4",
    classRecordId: "xTq2ZiYSmtVlpr3I5Zon",
    curriculumIndex: 4,
    repairPreferredRecord: true,
    attendanceSessionId: "attendance-day-4",
    startsAt,
    status: "scheduled",
    topic: "Day 4: Numbers, Phone Numbers and Addresses",
    assignmentId: "A1-2",
  };

  const due = reminder.findDueSessionReminders({
    sessions: [staleDay3, officialDay4],
    now: new Date("2026-08-19T16:50:00.000Z"),
    leadMinutes: [10],
    graceMinutes: 7,
  });

  assert.equal(due.length, 1);
  assert.equal(due[0].session.id, "official-day-4");
  assert.equal(reminder.topicForSession(due[0].session), "Day 4: Numbers, Phone Numbers and Addresses (A1-2)");
});

test("reminders at the same time remain separate for different classes", () => {
  const startsAt = "2026-08-19T17:00:00.000Z";
  const sessions = [
    { id: "bonn", officialSessionId: "bonn-day-4", classRecordId: "bonn", startsAt, status: "scheduled" },
    { id: "dortmund", officialSessionId: "dortmund-day-4", classRecordId: "dortmund", startsAt, status: "scheduled" },
  ];

  assert.equal(reminder.findDueSessionReminders({
    sessions,
    now: new Date("2026-08-19T16:50:00.000Z"),
    leadMinutes: [10],
  }).length, 2);
});

test("unique legacy A2 class name resolves to the authoritative Day 8 session", () => {
  const startsAt = "2026-08-19T18:00:00.000Z";
  const sessions = [
    {
      id: "stale-a2-4-9",
      officialSessionId: "a2-munich-4-9",
      className: "A2 Munich Klasse",
      curriculumIndex: 9,
      startsAt,
      status: "scheduled",
      topic: "4.9. Urlaub",
      assignmentId: "A2-4.9",
    },
    {
      id: "official-a2-3-8",
      officialSessionId: "a2-munich-day-8",
      classRecordId: "Y4xjoaF5wK0RmDyIEvkY",
      curriculumIndex: 8,
      repairPreferredRecord: true,
      attendanceSessionId: "attendance-a2-day-8",
      startsAt,
      status: "scheduled",
      topic: "Day 8: Rezepte und Essen",
      assignmentId: "A2-3.8",
    },
  ];

  const due = reminder.findDueSessionReminders({
    sessions,
    classes: [{ id: "Y4xjoaF5wK0RmDyIEvkY", name: "A2 Munich Klasse" }],
    now: new Date("2026-08-19T17:50:00.000Z"),
    leadMinutes: [10],
  });

  assert.equal(due.length, 1);
  assert.equal(due[0].session.id, "official-a2-3-8");
  assert.equal(reminder.topicForSession(due[0].session), "Day 8: Rezepte und Essen (A2-3.8)");
});

test("canonical B1 class session beats the next-lesson name-only alias", () => {
  const startsAt = "2026-08-20T18:00:00.000Z";
  const classId = "XEO4NwyAZ85gThEf7krP";
  const sessions = [
    {
      id: "stale-b1-2-5",
      officialSessionId: "b1-bonn-2-5",
      className: "B1 Bonn Klasse",
      curriculumIndex: 5,
      curriculumSource: "courseDictionary-day-groups",
      startsAt,
      status: "scheduled",
      topic: "2.5. Der Besichtigungstermin",
      assignmentId: "B1-2.5",
      updatedAt: "2026-08-20T17:55:00.000Z",
    },
    {
      id: "official-b1-day-4",
      officialSessionId: "b1-bonn-day-4",
      classRecordId: classId,
      curriculumIndex: 4,
      curriculumSource: "courseDictionary-day-groups",
      startsAt,
      status: "scheduled",
      topic: "Day 4: Wohnung suchen",
      assignmentId: "B1-2.4",
      updatedAt: "2026-08-20T17:00:00.000Z",
    },
  ];

  const due = reminder.findDueSessionReminders({
    sessions,
    classes: [{ id: classId, name: "B1 Bonn Klasse" }],
    now: new Date("2026-08-20T17:30:00.000Z"),
    leadMinutes: [30],
  });

  assert.equal(due.length, 1);
  assert.equal(due[0].session.id, "official-b1-day-4");
  assert.equal(
    reminder.topicForSession(due[0].session),
    "Day 4: Wohnung suchen (B1-2.4)",
  );
});

test("name-only legacy sessions are not deduplicated across ambiguous class names", () => {
  const startsAt = "2026-08-19T17:00:00.000Z";
  const sessions = [
    {
      id: "legacy-cohort-one",
      officialSessionId: "legacy-one-day-4",
      className: "A1 Evening Klasse",
      startsAt,
      status: "scheduled",
      topic: "Cohort one Day 4",
    },
    {
      id: "legacy-cohort-two",
      officialSessionId: "legacy-two-day-4",
      className: "A1 Evening Klasse",
      startsAt,
      status: "scheduled",
      topic: "Cohort two Day 4",
    },
  ];

  const due = reminder.findDueSessionReminders({
    sessions,
    classes: [
      { id: "cohort-one", name: "A1 Evening Klasse" },
      { id: "cohort-two", name: "A1 Evening Klasse" },
    ],
    now: new Date("2026-08-19T16:50:00.000Z"),
    leadMinutes: [10],
  });

  assert.deepEqual(due.map(({ session }) => session.id).sort(), [
    "legacy-cohort-one",
    "legacy-cohort-two",
  ]);
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

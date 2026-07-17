import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { _test } = require("../functions/classSessionReminderEmails.js");

const {
  assignmentIds,
  buildReminderMessage,
  findDueSessionReminders,
  isHolidayClosed,
  resolveClassForSession,
  rowForReminder,
  studentBelongsToClass,
  topicForSession,
} = _test;

test("selects 30-minute and 10-minute reminders from actual sessions", () => {
  const base = {
    classId: "a1-bonn",
    startsAt: "2026-07-22T11:00:00.000Z",
    status: "scheduled",
    topic: "Day 4: Numbers, Phone Numbers and Addresses",
    assignmentIds: ["A1-2"],
  };
  const atThirty = findDueSessionReminders({
    sessions: [{ id: "day-4", ...base }],
    now: new Date("2026-07-22T10:30:00.000Z"),
  });
  const atTen = findDueSessionReminders({
    sessions: [{ id: "day-4", ...base }],
    now: new Date("2026-07-22T10:50:00.000Z"),
  });
  assert.deepEqual(atThirty.map((item) => item.leadMin), [30]);
  assert.deepEqual(atTen.map((item) => item.leadMin), [10]);
});

test("cancelled, completed, superseded and suppressed sessions never become due", () => {
  const statuses = ["cancelled", "completed", "superseded"];
  const sessions = statuses.map((status, index) => ({
    id: `session-${index}`,
    classId: "a1-bonn",
    startsAt: "2026-07-22T11:00:00.000Z",
    status,
  }));
  sessions.push({
    id: "suppressed",
    classId: "a1-bonn",
    startsAt: "2026-07-22T11:00:00.000Z",
    status: "scheduled",
    remindersSuppressed: true,
  });
  assert.equal(findDueSessionReminders({
    sessions,
    now: new Date("2026-07-22T10:30:00.000Z"),
  }).length, 0);
});

test("duplicate session aliases produce one official reminder", () => {
  const sessions = [
    {
      id: "legacy-copy",
      officialSessionId: "bonn-day-4",
      classId: "a1-bonn",
      startsAt: "2026-07-22T11:00:00.000Z",
      status: "scheduled",
    },
    {
      id: "official-copy",
      officialSessionId: "bonn-day-4",
      classId: "a1-bonn",
      startsAt: "2026-07-22T11:00:00.000Z",
      status: "scheduled",
      curriculumSource: "courseDictionary-day-groups",
      curriculumIndex: 4,
      topic: "Day 4: Numbers, Phone Numbers and Addresses",
      assignmentIds: ["A1-2"],
    },
  ];
  const due = findDueSessionReminders({
    sessions,
    now: new Date("2026-07-22T10:30:00.000Z"),
  });
  assert.equal(due.length, 1);
  assert.equal(due[0].session.id, "official-copy");
});

test("grouped lesson topic and assignment IDs appear in the reminder email", () => {
  const session = {
    id: "bonn-day-3",
    startsAt: "2026-07-17T11:00:00.000Z",
    topic: "Day 3: Personal Information, Articles, Adjectives and W-Questions + Present-Tense Verb Conjugation Practice",
    assignmentIds: ["A1-1.1-PRACTICE", "A1-1.2"],
  };
  const klass = { id: "a1-bonn", name: "A1 Bonn Klasse", levelId: "A1", timezone: "Africa/Accra" };
  const student = { name: "Felix", email: "felix@example.com" };
  const message = buildReminderMessage({ student, klass, session, leadMin: 10 });
  assert.match(message, /Topic: Day 3: Personal Information/);
  assert.match(message, /Assignments: A1-1\.1-PRACTICE \+ A1-1\.2/);
  assert.match(message, /starts in 10 minutes/);
  assert.match(message, /11:00 am Ghana time/i);
  assert.deepEqual(assignmentIds(session), ["A1-1.1-PRACTICE", "A1-1.2"]);
  assert.match(topicForSession(session), /A1-1\.1-PRACTICE/);

  const row = rowForReminder({ klass, student, session, leadMin: 10, message });
  assert.equal(row.email_type, "class_reminder");
  assert.equal(row.delivery_mode, "individual");
  assert.match(row.topic, /Class reminder/);
  assert.equal(row.reminder_lead_minutes, "10");
});

test("school-closed holidays and Admin exclusion dates suppress reminders", () => {
  const session = { startsAt: "2026-08-04T11:00:00.000Z" };
  assert.equal(isHolidayClosed({
    holiday: { schoolClosed: true, name: "Founders' Day" },
    klass: { timezone: "Africa/Accra" },
    session,
  }), true);
  assert.equal(isHolidayClosed({
    holiday: { schoolClosed: false },
    klass: { timezone: "Africa/Accra", holidayDatesExcluded: ["2026-08-04"] },
    session,
  }), true);
});

test("exact class ID and student membership are used before class-name fallback", () => {
  const current = {
    id: "a1-bonn-current",
    name: "A1 Bonn Klasse",
    startDate: "2026-07-10",
    endDate: "2026-09-04",
    officialSessionCount: 25,
    curriculumMappedSessionCount: 25,
  };
  const stale = {
    id: "a1-bonn-stale",
    name: "A1 Bonn Klasse",
    startDate: "2026-07-10",
    endDate: "2026-09-10",
    officialSessionCount: 25,
    curriculumMappedSessionCount: 0,
  };
  const selected = resolveClassForSession({
    classId: "a1-bonn-current",
    startsAt: "2026-07-22T11:00:00.000Z",
  }, [stale, current]);
  assert.equal(selected.id, "a1-bonn-current");
  assert.equal(studentBelongsToClass({ classId: "a1-bonn-current" }, current), true);
  assert.equal(studentBelongsToClass({ classId: "a1-bonn-stale" }, current), false);
});

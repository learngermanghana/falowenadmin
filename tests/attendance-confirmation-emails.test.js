import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { _test } = require("../functions/attendanceConfirmationEmails.js");

const {
  MODE_EACH_CLASS,
  MODE_OFF,
  MODE_WEEKLY,
  attendanceRate,
  attendanceStatus,
  buildEachClassMessage,
  buildWeeklyMessage,
  deliveryId,
  groupDueSessions,
  modeForClass,
  resolveWebhookConfig,
  studentBelongsToClass,
  weekKey,
} = _test;

const session = {
  id: "session-1",
  startsAt: "2026-07-14T18:00:00.000Z",
  endsAt: "2026-07-14T19:00:00.000Z",
  topic: "Freizeit und Kultur",
  assignmentIds: ["A1-4.1"],
};

const student = {
  id: "student-1",
  uid: "uid-1",
  studentCode: "Felix123",
  name: "Felix Asadu",
  email: "felix@example.com",
  className: "A1 Munich Klasse",
};

const klass = {
  id: "class-1",
  name: "A1 Munich Klasse",
  levelId: "A1",
  timezone: "Africa/Accra",
};

test("classes default to weekly attendance confirmation and support each-class/off modes", () => {
  assert.equal(modeForClass({}), MODE_WEEKLY);
  assert.equal(modeForClass({ attendanceConfirmationEmailMode: MODE_EACH_CLASS }), MODE_EACH_CLASS);
  assert.equal(modeForClass({ attendanceConfirmationEmailEnabled: false, attendanceConfirmationEmailMode: MODE_WEEKLY }), MODE_OFF);
  assert.equal(modeForClass({ attendanceConfirmationEmailMode: MODE_OFF }), MODE_OFF);
});

test("student membership accepts matching class name or class record id", () => {
  assert.equal(studentBelongsToClass(student, klass), true);
  assert.equal(studentBelongsToClass({ ...student, className: "A2 Berlin Klasse" }, klass), false);
  assert.equal(studentBelongsToClass({ ...student, className: "", classRecordId: "class-1" }, klass), true);
});

test("QR check-ins more than the late threshold after class start are Late", () => {
  const status = attendanceStatus({
    session,
    attendance: {},
    checkins: [{ uid: "uid-1", checkedInAt: "2026-07-14T18:20:00.000Z", method: "qr" }],
    student,
    lateMinutes: 15,
  });
  assert.equal(status.status, "late");
  assert.equal(status.method, "qr");
});

test("manual attendance and excused statuses are preserved", () => {
  const present = attendanceStatus({
    session,
    attendance: { students: { Felix123: { present: true, name: "Felix Asadu" } } },
    checkins: [],
    student,
  });
  assert.equal(present.status, "present");
  assert.equal(present.method, "manual");

  const excused = attendanceStatus({
    session,
    attendance: { students: { Felix123: { present: false, status: "excused" } } },
    checkins: [],
    student,
  });
  assert.equal(excused.status, "excused");
});

test("weekly grouping waits for the final session of a week", () => {
  const sessions = [
    session,
    {
      ...session,
      id: "session-2",
      startsAt: "2026-07-16T18:00:00.000Z",
      endsAt: "2026-07-16T19:00:00.000Z",
    },
  ];
  const beforeFinal = groupDueSessions({
    sessions,
    mode: MODE_WEEKLY,
    now: new Date("2026-07-16T18:30:00.000Z"),
    timezone: "Africa/Accra",
  });
  assert.equal(beforeFinal.length, 0);

  const afterFinal = groupDueSessions({
    sessions,
    mode: MODE_WEEKLY,
    now: new Date("2026-07-16T20:00:00.000Z"),
    timezone: "Africa/Accra",
  });
  assert.equal(afterFinal.length, 1);
  assert.deepEqual(afterFinal[0].sessions.map((item) => item.id), ["session-1", "session-2"]);
});

test("personalized emails include confirmed status and weekly totals", () => {
  const record = { session, status: "late", method: "qr", checkedAt: new Date("2026-07-14T18:20:00.000Z") };
  const eachMessage = buildEachClassMessage({ student, klass, record, replyNote: "Reply if this is wrong." });
  assert.match(eachMessage, /Hello Felix Asadu/);
  assert.match(eachMessage, /confirmed as Late/);
  assert.match(eachMessage, /QR check-in/);
  assert.match(eachMessage, /Reply if this is wrong/);

  const weeklyMessage = buildWeeklyMessage({
    student,
    klass,
    records: [
      { session, status: "present", method: "qr" },
      { session: { ...session, id: "session-2", startsAt: "2026-07-16T18:00:00.000Z" }, status: "absent", method: "none" },
    ],
  });
  assert.match(weeklyMessage, /Present: 1/);
  assert.match(weeklyMessage, /Absent: 1/);
  assert.match(weeklyMessage, /Attendance rate: 50%/);
  assert.equal(attendanceRate([{ status: "present" }, { status: "late" }, { status: "absent" }, { status: "excused" }]), 67);
});

test("delivery ids deduplicate the same student period but differ across periods", () => {
  const first = deliveryId({ classId: "class-1", mode: MODE_WEEKLY, periodKey: "2026-W29", studentKey: "uid-1" });
  const repeat = deliveryId({ classId: "class-1", mode: MODE_WEEKLY, periodKey: "2026-W29", studentKey: "uid-1" });
  const nextWeek = deliveryId({ classId: "class-1", mode: MODE_WEEKLY, periodKey: "2026-W30", studentKey: "uid-1" });
  assert.equal(first, repeat);
  assert.notEqual(first, nextWeek);
  assert.equal(first.length, 64);
});

test("the worker resolves the existing Communication webhook configuration", () => {
  const config = resolveWebhookConfig({
    communication: {
      announcement_webhook_url: "https://example.com/exec",
      announcement_webhook_token: "secret",
      announcement_sheet_name: "Announcements",
    },
  }, {});
  assert.equal(config.url, "https://example.com/exec");
  assert.equal(config.token, "secret");
  assert.equal(config.sheetName, "Announcements");
  assert.equal(weekKey("2026-07-16T18:00:00.000Z"), "2026-W29");
});

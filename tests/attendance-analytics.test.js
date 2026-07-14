import test from "node:test";
import assert from "node:assert/strict";
import {
  buildAttendanceAnalytics,
  buildAttendanceCsv,
  filterAttendanceRecords,
} from "../src/utils/attendanceAnalytics.js";

const students = [
  { id: "student-a", studentCode: "A001", name: "Ama Mensah", email: "ama@example.com" },
  { id: "student-b", studentCode: "B002", name: "Kojo Asare", email: "kojo@example.com" },
];

const sessions = [
  {
    id: "session-1",
    startsAt: "2026-07-10T09:00:00.000Z",
    endsAt: "2026-07-10T10:00:00.000Z",
    status: "completed",
    topic: "Day 1",
  },
  {
    id: "session-2",
    startsAt: "2026-07-11T09:00:00.000Z",
    endsAt: "2026-07-11T10:00:00.000Z",
    status: "completed",
    topic: "Day 2",
  },
  {
    id: "session-cancelled",
    startsAt: "2026-07-12T09:00:00.000Z",
    endsAt: "2026-07-12T10:00:00.000Z",
    status: "cancelled",
    topic: "Cancelled day",
  },
  {
    id: "session-future",
    startsAt: "2026-07-20T09:00:00.000Z",
    endsAt: "2026-07-20T10:00:00.000Z",
    status: "scheduled",
    topic: "Future day",
  },
];

const attendanceBySession = {
  "session-2": {
    classSessionId: "session-2",
    students: {
      A001: { name: "Ama Mensah", email: "ama@example.com", present: true },
      B002: { name: "Kojo Asare", email: "kojo@example.com", present: false },
    },
  },
};

const checkins = [
  {
    id: "student-a",
    uid: "student-a",
    studentCode: "A001",
    email: "ama@example.com",
    sessionId: "session-1",
    checkedInAt: { seconds: Math.floor(new Date("2026-07-10T09:05:00.000Z").getTime() / 1000) },
    method: "qr",
  },
  {
    id: "student-b",
    uid: "student-b",
    studentCode: "B002",
    email: "kojo@example.com",
    sessionId: "session-1",
    checkedInAt: "2026-07-10T09:22:00.000Z",
    source: "student_self_checkin",
  },
];

test("attendance analytics merges QR and manual attendance and detects late arrival", () => {
  const analytics = buildAttendanceAnalytics({
    sessions,
    students,
    attendanceBySession,
    checkins,
    now: "2026-07-14T12:00:00.000Z",
  });

  const ama = analytics.studentSummaries.find((student) => student.studentCode === "A001");
  const kojo = analytics.studentSummaries.find((student) => student.studentCode === "B002");

  assert.equal(analytics.classSummary.sessionsHeld, 2);
  assert.equal(ama.present, 2);
  assert.equal(ama.late, 0);
  assert.equal(ama.absent, 0);
  assert.equal(ama.attendancePercent, 100);
  assert.equal(kojo.present, 0);
  assert.equal(kojo.late, 1);
  assert.equal(kojo.absent, 1);
  assert.equal(kojo.attendancePercent, 50);
  assert.equal(kojo.consecutiveAbsences, 1);

  const qrRecord = analytics.records.find((record) => record.studentCode === "A001" && record.sessionId === "session-1");
  const manualRecord = analytics.records.find((record) => record.studentCode === "A001" && record.sessionId === "session-2");
  assert.equal(qrRecord.status, "present");
  assert.equal(qrRecord.method, "QR");
  assert.equal(manualRecord.status, "present");
  assert.equal(manualRecord.method, "Manual");
});

test("cancelled and future sessions never become absences", () => {
  const analytics = buildAttendanceAnalytics({
    sessions,
    students,
    attendanceBySession,
    checkins,
    now: "2026-07-14T12:00:00.000Z",
  });

  const cancelled = analytics.records.filter((record) => record.sessionId === "session-cancelled");
  const future = analytics.records.filter((record) => record.sessionId === "session-future");
  assert.ok(cancelled.every((record) => record.status === "cancelled"));
  assert.ok(future.every((record) => record.status === "upcoming"));
  assert.equal(analytics.studentSummaries[0].sessionsHeld, 2);
});

test("filters and CSV export preserve the selected attendance records", () => {
  const analytics = buildAttendanceAnalytics({
    sessions,
    students,
    attendanceBySession,
    checkins,
    now: "2026-07-14T12:00:00.000Z",
  });
  const absent = filterAttendanceRecords(analytics.records, { status: "absent", query: "Kojo" });
  assert.equal(absent.length, 1);
  assert.equal(absent[0].sessionId, "session-2");

  const csv = buildAttendanceCsv(absent);
  assert.match(csv, /Student,Student code/);
  assert.match(csv, /Kojo Asare/);
  assert.match(csv, /session/i);
  assert.match(csv, /absent/);
});

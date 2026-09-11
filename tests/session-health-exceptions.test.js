import assert from "node:assert/strict";
import test from "node:test";
import { buildSessionHealthExceptions } from "../src/utils/sessionHealthExceptions.js";

function baseClass(overrides = {}) {
  return {
    id: "class-a2-munich",
    name: "A2 Munich Klasse",
    status: "active",
    attendanceAutoOpenEnabled: true,
    attendanceAutoOpenLeadMinutes: 30,
    ...overrides,
  };
}

function baseSession(overrides = {}) {
  return {
    id: "session-14",
    classId: "class-a2-munich",
    classRecordId: "class-a2-munich",
    status: "scheduled",
    topic: "Day 14: Beruf und Karriere",
    assignmentIds: ["A2-5.14"],
    startsAt: "2026-09-15T19:00:00.000Z",
    endsAt: "2026-09-15T20:30:00.000Z",
    ...overrides,
  };
}

function attendance(overrides = {}) {
  return {
    id: "session-14",
    classId: "class-a2-munich",
    classSessionId: "session-14",
    sessionStatus: "scheduled",
    date: "2026-09-15",
    startsAt: "2026-09-15T19:00:00.000Z",
    endsAt: "2026-09-15T20:30:00.000Z",
    students: {},
    ...overrides,
  };
}

function health(overrides = {}) {
  const session = overrides.session || baseSession();
  const attendanceRecord = overrides.attendance === null
    ? null
    : (overrides.attendance || attendance());
  return buildSessionHealthExceptions({
    klass: overrides.klass || baseClass(),
    sessions: overrides.sessions || [session],
    attendanceBySessionId: overrides.attendanceBySessionId
      || (attendanceRecord ? { [attendanceRecord.id || session.id]: attendanceRecord } : {}),
    checkins: overrides.checkins || [],
    sessionRepair: overrides.sessionRepair || null,
    curriculumRepair: overrides.curriculumRepair || null,
    autoOpenRuntime: overrides.autoOpenRuntime || {},
    now: overrides.now || new Date("2026-09-11T08:00:00.000Z"),
  });
}

test("healthy canonical session has no operational exceptions", () => {
  const result = health();
  assert.equal(result.status, "healthy");
  assert.equal(result.label, "Healthy");
  assert.equal(result.issues.length, 0);
  assert.deepEqual(result.counts, {
    actionRequired: 0,
    needsReview: 0,
    sessions: 1,
    attendanceSessions: 1,
    checkins: 0,
  });
});

test("cancelled session flags reminder and open check-in leakage", () => {
  const result = health({
    session: baseSession({
      status: "cancelled",
      cancellationReason: "Tutor unavailable",
      cancelledAt: "2026-09-11T07:00:00.000Z",
      remindersSuppressed: false,
    }),
    attendance: attendance({
      sessionStatus: "cancelled",
      cancellationReason: "Tutor unavailable",
      remindersSuppressed: false,
      opened: true,
    }),
  });

  assert.equal(result.status, "action");
  const codes = new Set(result.actionRequired.map((issue) => issue.code));
  assert.ok(codes.has("cancelled-reminder-leak"));
  assert.ok(codes.has("cancelled-checkin-open"));
});

test("cancelled and canceled are treated as the same closed status", () => {
  const result = health({
    session: baseSession({
      status: "cancelled",
      cancellationReason: "Tutor unavailable",
      remindersSuppressed: true,
    }),
    attendance: attendance({
      sessionStatus: "canceled",
      cancellationReason: "Tutor unavailable",
      remindersSuppressed: true,
      opened: false,
    }),
  });

  assert.equal(result.issues.some((issue) => issue.code === "attendance-status-mismatch"), false);
});

test("rescheduled session detects stale attendance time", () => {
  const result = health({
    session: baseSession({
      status: "rescheduled",
      startsAt: "2026-09-16T18:00:00.000Z",
      endsAt: "2026-09-16T19:30:00.000Z",
    }),
    attendance: attendance(),
  });

  assert.equal(result.status, "action");
  assert.ok(result.actionRequired.some((issue) => issue.code === "attendance-time-mismatch"));
  assert.ok(result.needsReview.some((issue) => issue.code === "attendance-date-mismatch"));
});

test("student check-in not reflected as Present is surfaced for review", () => {
  const result = health({
    attendance: attendance({
      students: {
        STU001: { name: "Student One", present: false, status: "absent" },
      },
    }),
    checkins: [{
      id: "checkin-1",
      sessionId: "session-14",
      studentCode: "STU001",
      studentName: "Student One",
      checkedInAt: "2026-09-15T18:55:00.000Z",
    }],
  });

  assert.equal(result.status, "review");
  assert.ok(result.needsReview.some((issue) => issue.code === "checkin-not-reflected" && issue.studentKey === "STU001"));
});

test("assignment attendance evidence must resolve to Present", () => {
  const result = health({
    attendance: attendance({
      students: {
        STU002: {
          name: "Student Two",
          present: false,
          status: "present_by_assignment",
          source: "assignment_submission",
        },
      },
    }),
  });

  assert.equal(result.status, "action");
  assert.ok(result.actionRequired.some((issue) => issue.code === "assignment-attendance-not-present"));
});

test("failed communication worker is an action-required exception", () => {
  const result = health({
    klass: baseClass({
      classReminderEmailLastStatus: "failed",
      classReminderEmailLastError: "Mail provider rejected the request",
    }),
  });

  assert.equal(result.status, "action");
  const issue = result.actionRequired.find((item) => item.code === "class-reminder-email");
  assert.ok(issue);
  assert.match(issue.detail, /provider rejected/i);
});

test("past active session is surfaced as stale for review", () => {
  const staleSession = baseSession({
    startsAt: "2026-09-10T17:00:00.000Z",
    endsAt: "2026-09-10T18:30:00.000Z",
  });
  const staleAttendance = attendance({
    date: "2026-09-10",
    startsAt: staleSession.startsAt,
    endsAt: staleSession.endsAt,
  });
  const result = health({
    session: staleSession,
    attendance: staleAttendance,
    now: new Date("2026-09-11T08:00:00.000Z"),
  });

  assert.equal(result.status, "review");
  assert.ok(result.needsReview.some((issue) => issue.code === "stale-session-status"));
});

test("automatic check-in due before class is action-required when the window did not open", () => {
  const soonSession = baseSession({
    startsAt: "2026-09-11T08:20:00.000Z",
    endsAt: "2026-09-11T09:50:00.000Z",
  });
  const soonAttendance = attendance({
    date: "2026-09-11",
    startsAt: soonSession.startsAt,
    endsAt: soonSession.endsAt,
    opened: false,
  });
  const result = health({
    session: soonSession,
    attendance: soonAttendance,
    now: new Date("2026-09-11T08:00:00.000Z"),
  });

  assert.equal(result.status, "action");
  assert.ok(result.actionRequired.some((issue) => issue.code === "checkin-did-not-open"));
});

test("missed automatic check-in remains visible after the class starts", () => {
  const liveSession = baseSession({
    status: "live",
    startsAt: "2026-09-11T08:00:00.000Z",
    endsAt: "2026-09-11T09:30:00.000Z",
  });
  const liveAttendance = attendance({
    sessionStatus: "live",
    date: "2026-09-11",
    startsAt: liveSession.startsAt,
    endsAt: liveSession.endsAt,
    opened: false,
  });
  const result = health({
    session: liveSession,
    attendance: liveAttendance,
    now: new Date("2026-09-11T08:15:00.000Z"),
  });

  const issue = result.actionRequired.find((item) => item.code === "checkin-did-not-open");
  assert.ok(issue);
  assert.match(issue.title, /missed/i);
  assert.match(issue.detail, /cannot recover/i);
});

test("global auto-open disablement suppresses worker-failure exceptions", () => {
  const soonSession = baseSession({
    startsAt: "2026-09-11T08:20:00.000Z",
    endsAt: "2026-09-11T09:50:00.000Z",
  });
  const soonAttendance = attendance({
    date: "2026-09-11",
    startsAt: soonSession.startsAt,
    endsAt: soonSession.endsAt,
    opened: false,
  });
  const result = health({
    session: soonSession,
    attendance: soonAttendance,
    autoOpenRuntime: { enabled: false, leadMinutes: 30, windowMinutes: 180 },
    now: new Date("2026-09-11T08:00:00.000Z"),
  });

  assert.equal(result.issues.some((issue) => issue.code === "checkin-did-not-open"), false);
});

test("global auto-open enablement is used when the class has no explicit override", () => {
  const soonSession = baseSession({
    startsAt: "2026-09-11T08:20:00.000Z",
    endsAt: "2026-09-11T09:50:00.000Z",
  });
  const soonAttendance = attendance({
    date: "2026-09-11",
    startsAt: soonSession.startsAt,
    endsAt: soonSession.endsAt,
    opened: false,
  });
  const result = health({
    klass: baseClass({ attendanceAutoOpenEnabled: undefined, attendanceAutoOpenLeadMinutes: undefined }),
    session: soonSession,
    attendance: soonAttendance,
    autoOpenRuntime: { enabled: true, leadMinutes: 30, windowMinutes: 180 },
    now: new Date("2026-09-11T08:00:00.000Z"),
  });

  assert.ok(result.actionRequired.some((issue) => issue.code === "checkin-did-not-open"));
});

test("nested timetable overlaps are all detected", () => {
  const sessions = [
    baseSession({ id: "session-a", topic: "A", startsAt: "2026-09-15T09:00:00.000Z", endsAt: "2026-09-15T12:00:00.000Z" }),
    baseSession({ id: "session-b", topic: "B", startsAt: "2026-09-15T10:00:00.000Z", endsAt: "2026-09-15T10:30:00.000Z" }),
    baseSession({ id: "session-c", topic: "C", startsAt: "2026-09-15T11:00:00.000Z", endsAt: "2026-09-15T11:30:00.000Z" }),
  ];
  const attendanceBySessionId = Object.fromEntries(sessions.map((session) => [
    session.id,
    attendance({
      id: session.id,
      classSessionId: session.id,
      date: "2026-09-15",
      startsAt: session.startsAt,
      endsAt: session.endsAt,
    }),
  ]));

  const result = health({ sessions, attendanceBySessionId });
  const overlaps = result.actionRequired.filter((issue) => issue.code === "session-overlap");
  assert.equal(overlaps.length, 2);
  assert.ok(overlaps.some((issue) => issue.id === "session-overlap::session-a::session-b"));
  assert.ok(overlaps.some((issue) => issue.id === "session-overlap::session-a::session-c"));
});

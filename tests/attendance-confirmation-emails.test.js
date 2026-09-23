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
  loadAttendanceForSession,
  modeForClass,
  resolveWebhookConfig,
  studentBelongsToClass,
  studentBelongsToClassAt,
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

test("class transfer history keeps weekly attendance with the class active on each session date", () => {
  const transferred = {
    ...student,
    classId: "new-class",
    classRecordId: "new-class",
    className: "A1 Dortmund Klasse",
    classTransfers: [{
      id: "transfer-1",
      effectiveDate: "2026-09-23",
      fromClassId: "class-1",
      fromClassName: "A1 Munich Klasse",
      toClassId: "new-class",
      toClassName: "A1 Dortmund Klasse",
    }],
  };
  const oldClass = { ...klass, id: "class-1", name: "A1 Munich Klasse" };
  const newClass = { ...klass, id: "new-class", name: "A1 Dortmund Klasse" };

  assert.equal(studentBelongsToClassAt(transferred, oldClass, "2026-09-22T18:00:00.000Z"), true);
  assert.equal(studentBelongsToClassAt(transferred, oldClass, "2026-09-23T18:00:00.000Z"), false);
  assert.equal(studentBelongsToClassAt(transferred, newClass, "2026-09-22T18:00:00.000Z"), false);
  assert.equal(studentBelongsToClassAt(transferred, newClass, "2026-09-23T18:00:00.000Z"), true);
});

test("multiple class transfers reconstruct historical membership without rewriting old attendance", () => {
  const transferred = {
    ...student,
    classId: "class-3",
    className: "A1 Hamburg Klasse",
    classTransfers: [
      {
        effectiveDate: "2026-09-10",
        fromClassId: "class-1",
        fromClassName: "A1 Munich Klasse",
        toClassId: "class-2",
        toClassName: "A1 Dortmund Klasse",
      },
      {
        effectiveDate: "2026-09-20",
        fromClassId: "class-2",
        fromClassName: "A1 Dortmund Klasse",
        toClassId: "class-3",
        toClassName: "A1 Hamburg Klasse",
      },
    ],
  };

  assert.equal(studentBelongsToClassAt(transferred, { id: "class-1", name: "A1 Munich Klasse" }, "2026-09-09"), true);
  assert.equal(studentBelongsToClassAt(transferred, { id: "class-2", name: "A1 Dortmund Klasse" }, "2026-09-15"), true);
  assert.equal(studentBelongsToClassAt(transferred, { id: "class-3", name: "A1 Hamburg Klasse" }, "2026-09-21"), true);
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

test("manual tutor Present overrides a late self check-in in the official report", () => {
  const status = attendanceStatus({
    session,
    attendance: { students: { Felix123: { present: true, name: "Felix Asadu" } } },
    checkins: [{ uid: "uid-1", checkedInAt: "2026-07-14T18:20:00.000Z", method: "qr" }],
    student,
    lateMinutes: 15,
  });

  assert.equal(status.status, "present");
  assert.equal(status.method, "manual");
});

test("weekly worker combines manual attendance with check-ins stored under a class alias", async () => {
  const attendanceDocs = {
    "class-1": {
      students: {
        Felix123: { present: true, name: "Felix Asadu", email: "felix@example.com" },
      },
      markedBy: "teacher-1",
    },
    "A1 Munich Klasse": {
      openTo: "2026-07-14T19:15:00.000Z",
    },
  };
  const checkinsByParent = {
    "A1 Munich Klasse": [
      { id: "checkin-1", uid: "uid-1", checkedInAt: "2026-07-14T18:20:00.000Z", method: "qr" },
    ],
  };

  const db = {
    collection(name) {
      assert.equal(name, "attendance");
      return {
        doc(parentId) {
          return {
            collection(childName) {
              assert.equal(childName, "sessions");
              return {
                doc(sessionId) {
                  assert.equal(sessionId, "session-1");
                  return {
                    async get() {
                      const data = attendanceDocs[parentId];
                      return {
                        exists: Boolean(data),
                        data: () => data || {},
                      };
                    },
                    collection(grandchild) {
                      assert.equal(grandchild, "checkins");
                      return {
                        async get() {
                          return {
                            docs: (checkinsByParent[parentId] || []).map((row) => ({
                              id: row.id,
                              data: () => {
                                const { id, ...data } = row;
                                return data;
                              },
                            })),
                          };
                        },
                      };
                    },
                  };
                },
              };
            },
          };
        },
      };
    },
  };

  const loaded = await loadAttendanceForSession(db, klass, session);
  assert.equal(loaded.attendance.students.Felix123.present, true);
  assert.equal(loaded.checkins.length, 1);

  const status = attendanceStatus({
    session,
    attendance: loaded.attendance,
    checkins: loaded.checkins,
    student,
    lateMinutes: 15,
  });
  assert.equal(status.status, "present");
  assert.equal(status.method, "manual");
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

test("missed attendance summaries remain retryable for fourteen days", () => {
  const due = groupDueSessions({
    sessions: [session],
    mode: MODE_EACH_CLASS,
    now: new Date("2026-07-24T12:00:00.000Z"),
    timezone: "Africa/Accra",
  });
  assert.equal(due.length, 1);

  const expired = groupDueSessions({
    sessions: [session],
    mode: MODE_EACH_CLASS,
    now: new Date("2026-08-01T12:00:00.000Z"),
    timezone: "Africa/Accra",
  });
  assert.equal(expired.length, 0);
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
  assert.match(weeklyMessage, /attendance is normally recorded through your check-in/);
  assert.match(weeklyMessage, /a tutor may also record Present, Late or Excused manually/);
  assert.match(weeklyMessage, /If you do not check in and a tutor has not recorded another status, the app marks you Absent\./);
  assert.match(weeklyMessage, /A Late status may come from a late check-in or a tutor's manual record/);
  assert.match(weeklyMessage, /it does not necessarily mean you joined the class late\./);
  assert.match(weeklyMessage, /You are responsible for checking in for every class/);
  assert.match(weeklyMessage, /complete your check-in on time\./);
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

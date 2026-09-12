import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = new URL("../", import.meta.url);

execFileSync(process.execPath, ["scripts/patchParticipationSessionIdentity.mjs"], { cwd: root, stdio: "pipe" });
for (const patch of [
  "scripts/patchAttendanceParticipationSummaryEmail.mjs",
  "scripts/patchAttendanceParticipationCanonicalIdentity.mjs",
  "scripts/patchAttendanceNoParticipationEncouragement.mjs",
  "scripts/patchAttendanceParticipationRecapGoals.mjs",
  "scripts/patchAttendanceParticipationRecapFailSafe.mjs",
  "scripts/patchAttendanceParticipationSessionWindow.mjs",
]) {
  execFileSync(process.execPath, [patch], { cwd: root, stdio: "pipe" });
}

delete require.cache[require.resolve("../functions/classParticipationApi.js")];
delete require.cache[require.resolve("../functions/attendanceConfirmationEmails.js")];
const participationApi = require("../functions/classParticipationApi.js");
const attendance = require("../functions/attendanceConfirmationEmails.js")._test;

function stableId(...parts) {
  return crypto.createHash("sha1")
    .update(parts.map((value) => String(value || "").trim()).join("|"))
    .digest("hex");
}

function doc(id, data) {
  return { id, data: () => data, exists: true };
}

function fakeDb(classSessions = [], participationSessions = []) {
  return {
    collection(name) {
      if (name === "classSessions") {
        return {
          doc(id) {
            return {
              async get() {
                const found = classSessions.find((row) => row.id === id);
                return found ? doc(found.id, found) : { id, exists: false, data: () => ({}) };
              },
            };
          },
          where(field, op, value) {
            assert.equal(field, "classId");
            assert.equal(op, "==");
            return {
              limit() {
                return {
                  async get() {
                    return {
                      docs: classSessions
                        .filter((row) => row.classId === value)
                        .map((row) => doc(row.id, row)),
                    };
                  },
                };
              },
            };
          },
        };
      }
      if (name === "classParticipationSessions") {
        return {
          doc(id) {
            return {
              async get() {
                const found = participationSessions.find((row) => row.id === id);
                return found ? doc(found.id, found) : { id, exists: false, data: () => ({}) };
              },
            };
          },
          where(field, op, value) {
            assert.equal(op, "==");
            return {
              limit() {
                return {
                  async get() {
                    return {
                      docs: participationSessions
                        .filter((row) => String(row[field] || "") === String(value || ""))
                        .map((row) => doc(row.id, row)),
                    };
                  },
                };
              },
            };
          },
        };
      }
      if (name === "classes") {
        return {
          where() {
            return {
              limit() {
                return { async get() { return { docs: [] }; } };
              },
            };
          },
        };
      }
      throw new Error(`Unexpected collection ${name}`);
    },
  };
}

test("late marking resolves to the most recent matching scheduled class session", async () => {
  const db = fakeDb([
    {
      id: "session-sept-11",
      classId: "class-doc-1",
      startsAt: "2026-09-11T17:00:00.000Z",
      assignmentIds: ["B1-5.4"],
      status: "scheduled",
    },
    {
      id: "session-sept-18",
      classId: "class-doc-1",
      startsAt: "2026-09-18T17:00:00.000Z",
      assignmentIds: ["B1-5.4"],
      status: "scheduled",
    },
  ]);

  const resolved = await participationApi.resolveCanonicalClassSession(db, {
    classRecordId: "class-doc-1",
    classId: "B1 Bonn Klasse",
    assignmentId: "B1-5.4",
    requestedSessionDate: "2026-09-12",
  });

  assert.deepEqual(resolved, {
    classRecordId: "class-doc-1",
    classSessionId: "session-sept-11",
    sessionDate: "2026-09-11",
  });
});

test("canonical participation ID stays stable when the live class session is rescheduled", () => {
  const before = participationApi.lessonSessionId({
    classRecordId: "class-doc-1",
    classSessionId: "live-session-123",
    assignmentId: "B1-5.4",
    sessionDate: "2026-09-11",
  });
  const after = participationApi.lessonSessionId({
    classRecordId: "class-doc-1",
    classSessionId: "live-session-123",
    assignmentId: "B1-5.4",
    sessionDate: "2026-09-13",
  });

  assert.equal(after, before);
});

test("storage resolver reuses an existing canonical session after its timetable date changes", async () => {
  const db = fakeDb([], [
    {
      id: "old-date-based-storage-id",
      classSessionId: "live-session-123",
      classRecordId: "class-doc-1",
      sessionDate: "2026-09-11",
    },
  ]);

  const storageId = await participationApi.resolveParticipationSessionStorageId(db, {
    classId: "B1 Bonn Klasse",
    classRecordId: "class-doc-1",
    classSessionId: "live-session-123",
    assignmentId: "B1-5.4",
    sessionDate: "2026-09-13",
    requestedSessionDate: "2026-09-13",
  });

  assert.equal(storageId, "old-date-based-storage-id");
});

test("storage resolver restores the scheduled-day legacy key even when canonical identity exists", async () => {
  const legacyId = stableId("B1 Bonn Klasse", "B1-5.4", "2026-09-11");
  const db = fakeDb([], [
    {
      id: legacyId,
      classId: "B1 Bonn Klasse",
      assignmentId: "B1-5.4",
      sessionDate: "2026-09-11",
    },
  ]);

  const storageId = await participationApi.resolveParticipationSessionStorageId(db, {
    classId: "B1 Bonn Klasse",
    classRecordId: "class-doc-1",
    classSessionId: "live-session-123",
    assignmentId: "B1-5.4",
    sessionDate: "2026-09-11",
    requestedSessionDate: "2026-09-11",
  });

  assert.equal(storageId, legacyId);
});

test("current-session fallback always tries the legacy key when canonical state is absent", () => {
  const source = fs.readFileSync(new URL("../functions/classParticipationApi.js", import.meta.url), "utf8");
  assert.match(source, /if \(!current\.session\) \{\s+const legacySessionId = stableId\(classId, assignmentId, requestedSessionDate\);/);
  assert.doesNotMatch(source, /!current\.session && sessionDate !== requestedSessionDate/);
});

test("attendance participation matching accepts bounded legacy late marking but prefers canonical session identity", () => {
  const session = {
    id: "session-sept-11",
    startsAt: "2026-09-11T17:00:00.000Z",
    assignmentIds: ["B1-5.4"],
  };

  assert.equal(attendance.participationRecordMatchesSession({
    assignmentId: "B1-5.4",
    sessionDate: "2026-09-12",
  }, session, "Africa/Accra"), true);

  assert.equal(attendance.participationRecordMatchesSession({
    classSessionId: "another-session",
    assignmentId: "B1-5.4",
    sessionDate: "2026-09-11",
  }, session, "Africa/Accra"), false);

  assert.equal(attendance.participationRecordMatchesSession({
    classSessionId: "session-sept-11",
    assignmentId: "B1-5.4",
    sessionDate: "2026-09-12",
  }, session, "Africa/Accra"), true);

  assert.equal(attendance.participationRecordMatchesSession({
    assignmentId: "B1-5.4",
    sessionDate: "2026-09-20",
  }, session, "Africa/Accra"), false);
});

test("weekly summary does not double-count a legacy record after canonical session data exists", () => {
  const student = {
    uid: "ruth-uid",
    studentCode: "ruth-1",
    email: "ruth@example.com",
    name: "Ruth Ndekiro Shao",
  };
  const session = {
    id: "session-sept-11",
    startsAt: "2026-09-11T17:00:00.000Z",
    assignmentIds: ["B1-5.4"],
  };
  const base = {
    studentUid: "ruth-uid",
    studentCode: "ruth-1",
    studentEmail: "ruth@example.com",
    studentEmailNormalized: "ruth@example.com",
    studentName: "Ruth Ndekiro Shao",
    assignmentId: "B1-5.4",
    turns: 2,
    correct: 1,
    needsReview: 1,
    skipped: 0,
  };
  const summary = attendance.summarizeStudentParticipation({
    participationRecords: [
      { ...base, id: "legacy", sessionDate: "2026-09-12" },
      { ...base, id: "canonical", classSessionId: "session-sept-11", sessionDate: "2026-09-11" },
    ],
    student,
    sessions: [session],
    timezone: "Africa/Accra",
  });

  assert.equal(summary.trackedLessons, 1);
  assert.equal(summary.responses, 2);
  assert.equal(summary.correct, 1);
  assert.equal(summary.needsReview, 1);
});

import test from "node:test";
import assert from "node:assert/strict";
import { classReminderKey, claimClassReminderSend, findDueClassReminderSessions } from "../src/utils/classReminderDedupe.js";

function createMemoryDb() {
  const docs = new Map();
  return {
    collection: (name) => ({
      doc: (id) => ({
        path: `${name}/${id}`,
        async get() { return { exists: docs.has(`${name}/${id}`), data: () => docs.get(`${name}/${id}`) }; },
        async create(payload) {
          const key = `${name}/${id}`;
          if (docs.has(key)) throw new Error("already exists");
          docs.set(key, payload);
        },
      }),
    }),
    async runTransaction(callback) {
      return callback({
        async get(ref) { return ref.get(); },
        create(ref, payload) { docs.set(ref.path, payload); },
      });
    },
  };
}

test("10-minute class reminder is selected once per official session", () => {
  const now = new Date("2026-07-11T17:50:00.000Z");
  const sessions = [
    { id: "generated", officialSessionId: "a1-munich_2026-07-11_1800", classId: "a1-munich", startsAt: "2026-07-11T18:00:00.000Z", status: "scheduled" },
    { id: "legacy-copy", officialSessionId: "a1-munich_2026-07-11_1800", classId: "a1-munich", startsAt: "2026-07-11T18:00:00.000Z", status: "scheduled" },
  ];

  const due = findDueClassReminderSessions({ sessions, now, reminderType: "10min", targetMinutes: 10, toleranceMinutes: 0 });
  assert.deepEqual(due.map((session) => session.id), ["generated"]);
});

test("claimed reminder key prevents repeat sends", async () => {
  const db = createMemoryDb();
  const first = await claimClassReminderSend({ db, classId: "a1-munich", sessionId: "session-1", reminderType: "10min", serverTimestamp: "now" });
  const second = await claimClassReminderSend({ db, classId: "a1-munich", sessionId: "session-1", reminderType: "10min", serverTimestamp: "now" });

  assert.equal(classReminderKey("a1-munich", "session-1", "10min"), "a1-munich:session-1:10min");
  assert.equal(first.claimed, true);
  assert.equal(second.claimed, false);
});

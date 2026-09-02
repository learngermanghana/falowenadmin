import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { runClassSessionReminderEmailJob } = require("../functions/classSessionReminderEmails.js");

function createFirestore(seed = {}) {
  const collections = new Map();
  const nestedDocs = new Map();

  for (const [name, rows] of Object.entries(seed)) {
    collections.set(name, new Map(Object.entries(rows)));
  }

  function collectionMap(name) {
    if (!collections.has(name)) collections.set(name, new Map());
    return collections.get(name);
  }

  function snapshot(id, value) {
    return { id, exists: value !== undefined, data: () => value };
  }

  function collectionDocRef(name, id) {
    const map = collectionMap(name);
    return {
      id,
      async get() {
        return snapshot(id, map.get(id));
      },
      async set(value, options = {}) {
        const current = map.get(id) || {};
        map.set(id, options.merge ? { ...current, ...value } : value);
      },
    };
  }

  function nestedRef(path) {
    return {
      id: path.split("/").at(-1),
      path,
      async get() {
        return snapshot(this.id, nestedDocs.get(path));
      },
      async set(value, options = {}) {
        const current = nestedDocs.get(path) || {};
        nestedDocs.set(path, options.merge ? { ...current, ...value } : value);
      },
    };
  }

  return {
    collection(name) {
      return {
        doc(id) {
          return collectionDocRef(name, id);
        },
        async get() {
          return {
            docs: [...collectionMap(name)].map(([id, value]) => ({ id, data: () => value })),
          };
        },
      };
    },
    doc(path) {
      return nestedRef(path);
    },
    async runTransaction(callback) {
      return callback({
        get: (ref) => ref.get(),
        set: (ref, value, options) => ref.set(value, options),
      });
    },
    readNested(path) {
      return nestedDocs.get(path);
    },
  };
}

const admin = {
  firestore: {
    FieldValue: {
      serverTimestamp: () => ({ serverTimestamp: true }),
    },
    Timestamp: {
      fromMillis: (milliseconds) => ({
        milliseconds,
        toMillis: () => milliseconds,
        toDate: () => new Date(milliseconds),
      }),
    },
  },
};

test("scheduler auto-opens check-in and uses CLOUD_RUNTIME_CONFIG check-in base URL in the sent reminder", async () => {
  const classId = "Y4xjoaF5wK0RmDyIEvkY";
  const sessionId = "A2 Munich Klasse_2026-09-02_1900";
  const klass = {
    name: "A2 Munich Klasse",
    timezone: "Africa/Accra",
    status: "active",
    levelId: "A2",
  };
  const session = {
    classId,
    startsAt: "2026-09-02T19:00:00.000Z",
    endsAt: "2026-09-02T20:30:00.000Z",
    status: "scheduled",
    topic: "Day 14: Beruf und Karriere",
    assignmentIds: ["A2-5.14"],
  };
  const student = {
    classId,
    role: "student",
    status: "active",
    name: "Ama Student",
    email: "ama@example.com",
  };
  const db = createFirestore({
    classes: { [classId]: klass },
    classSessions: { [sessionId]: session },
    students: { "student-1": student },
    holidayCalendar: {},
    classReminderSends: {},
  });

  let delivered = null;
  const fetchImpl = async (url, options) => {
    delivered = { url, body: JSON.parse(options.body) };
    return {
      ok: true,
      status: 200,
      json: async () => ({ ok: true, count: 1 }),
    };
  };

  const runtimeConfig = {
    communication: {
      announcement_webhook_url: "https://mailer.example.test/class-reminder",
      class_checkin_base_url: "https://attendance.example.test/",
      class_reminder_leads_minutes: [30],
    },
  };

  const result = await runClassSessionReminderEmailJob({
    admin,
    db,
    runtimeConfig,
    now: new Date("2026-09-02T18:30:00.000Z"),
    fetchImpl,
  });

  assert.equal(result.autoOpen.opened, 1);
  assert.equal(result.sent, 1);
  assert.equal(delivered.url, "https://mailer.example.test/class-reminder");
  assert.equal(delivered.body.rows.length, 1);
  assert.match(delivered.body.rows[0].checkin_link, /^https:\/\/attendance\.example\.test\/checkin\?/);
  assert.match(delivered.body.rows[0].announcement, /https:\/\/attendance\.example\.test\/checkin\?/);

  const attendance = db.readNested(`attendance/${classId}/sessions/${sessionId}`);
  assert.equal(attendance.opened, true);
  assert.equal(attendance.assignmentId, "A2-5.14");
  assert.equal(attendance.autoOpenLeadMinutes, 30);
});

import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { runAutoOpenCheckins, _test } = require("../functions/classSessionAutoCheckin.js");

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
    return {
      id,
      exists: value !== undefined,
      data: () => value,
    };
  }

  function collectionRef(name, id) {
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
          return collectionRef(name, id);
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
    seedNested(path, value) {
      nestedDocs.set(path, value);
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

function fixture() {
  const klass = {
    id: "Y4xjoaF5wK0RmDyIEvkY",
    name: "A2 Munich Klasse",
    timezone: "Africa/Accra",
    status: "active",
  };
  const session = {
    id: "A2 Munich Klasse_2026-09-02_1900",
    classId: klass.id,
    startsAt: "2026-09-02T19:00:00.000Z",
    endsAt: "2026-09-02T20:30:00.000Z",
    status: "scheduled",
    topic: "Day 14: Beruf und Karriere",
    assignmentIds: ["A2-5.14"],
  };
  return { klass, session };
}

test("a scheduled lesson becomes eligible at 30 minutes before class", () => {
  const { klass, session } = fixture();
  assert.equal(_test.dueForAutoOpen({
    klass,
    session,
    runtimeConfig: {},
    now: new Date("2026-09-02T18:30:00.000Z"),
  }), true);
  assert.equal(_test.dueForAutoOpen({
    klass,
    session,
    runtimeConfig: {},
    now: new Date("2026-09-02T18:29:00.000Z"),
  }), false);
});

test("scheduler opens the canonical attendance session once and preserves manual close", async () => {
  const { klass, session } = fixture();
  const db = createFirestore({
    holidayCalendar: {},
    classSessions: { [session.id]: session },
  });
  const path = `attendance/${klass.id}/sessions/${session.id}`;

  const first = await runAutoOpenCheckins({
    admin,
    db,
    classes: [klass],
    sessions: [session],
    now: new Date("2026-09-02T18:30:00.000Z"),
  });
  assert.equal(first.opened, 1);
  assert.equal(db.readNested(path).opened, true);
  assert.equal(db.readNested(path).assignmentId, "A2-5.14");
  assert.equal(db.readNested(path).autoOpenLeadMinutes, 30);
  assert.equal(db.readNested(path).openFrom.toMillis(), Date.parse("2026-09-02T18:30:00.000Z"));

  const second = await runAutoOpenCheckins({
    admin,
    db,
    classes: [klass],
    sessions: [session],
    now: new Date("2026-09-02T18:35:00.000Z"),
  });
  assert.equal(second.opened, 0);
  assert.equal(second.results[0].skipped, "already_open");

  db.seedNested(path, {
    ...db.readNested(path),
    opened: false,
    closedBy: "teacher-uid",
  });
  const afterManualClose = await runAutoOpenCheckins({
    admin,
    db,
    classes: [klass],
    sessions: [session],
    now: new Date("2026-09-02T18:40:00.000Z"),
  });
  assert.equal(afterManualClose.opened, 0);
  assert.equal(afterManualClose.results[0].skipped, "manually_closed");
});

test("automatic opening can be disabled per class", async () => {
  const { klass, session } = fixture();
  const db = createFirestore({ holidayCalendar: {} });
  const result = await runAutoOpenCheckins({
    admin,
    db,
    classes: [{ ...klass, attendanceAutoOpenEnabled: false }],
    sessions: [session],
    now: new Date("2026-09-02T18:30:00.000Z"),
  });
  assert.equal(result.checked, 0);
  assert.equal(result.opened, 0);
});

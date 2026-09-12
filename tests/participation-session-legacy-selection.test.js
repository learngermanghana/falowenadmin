import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = new URL("../", import.meta.url);

execFileSync(process.execPath, ["scripts/patchClassParticipationApi.mjs"], { cwd: root, stdio: "pipe" });
delete require.cache[require.resolve("../functions/classParticipationApi.js")];
const participationApi = require("../functions/classParticipationApi.js");

function stableId(...parts) {
  return crypto.createHash("sha1")
    .update(parts.map((value) => String(value || "").trim()).join("|"))
    .digest("hex");
}

function doc(row) {
  return {
    id: row.id,
    exists: true,
    data: () => row,
  };
}

function fakeDb(participationSessions = []) {
  return {
    collection(name) {
      assert.equal(name, "classParticipationSessions");
      return {
        doc(id) {
          return {
            async get() {
              const found = participationSessions.find((row) => row.id === id);
              return found ? doc(found) : { id, exists: false, data: () => ({}) };
            },
          };
        },
        where(field, op, value) {
          assert.equal(field, "classSessionId");
          assert.equal(op, "==");
          const matchingDocs = () => participationSessions
            .filter((row) => String(row.classSessionId || "") === String(value || ""))
            .map(doc);
          return {
            async get() {
              return { docs: matchingDocs() };
            },
            limit(limit) {
              return {
                async get() {
                  return { docs: matchingDocs().slice(0, limit) };
                },
              };
            },
          };
        },
      };
    },
  };
}

test("exact current-date legacy participation ID wins before unordered classSessionId matches", async () => {
  const exactCurrentDateId = stableId("class-doc-1", "live-session-123", "2026-09-13");
  const db = fakeDb([
    {
      id: "stale-reschedule-copy",
      classSessionId: "live-session-123",
      revision: 99,
      updatedAt: "2026-09-20T12:00:00.000Z",
      sessionDate: "2026-09-11",
    },
    {
      id: exactCurrentDateId,
      classSessionId: "live-session-123",
      revision: 4,
      updatedAt: "2026-09-13T18:00:00.000Z",
      sessionDate: "2026-09-13",
    },
  ]);

  const resolved = await participationApi.resolveParticipationSessionStorageId(db, {
    classId: "B1 Bonn Klasse",
    classRecordId: "class-doc-1",
    classSessionId: "live-session-123",
    assignmentId: "B1-5.4",
    sessionDate: "2026-09-13",
    requestedSessionDate: "2026-09-13",
  });

  assert.equal(resolved, exactCurrentDateId);
});

test("broad legacy lookup chooses the highest revision deterministically", async () => {
  const db = fakeDb([
    {
      id: "older-high-time",
      classSessionId: "live-session-123",
      revision: 3,
      updatedAt: "2026-09-20T12:00:00.000Z",
      sessionDate: "2026-09-11",
    },
    {
      id: "newest-revision",
      classSessionId: "live-session-123",
      revision: 8,
      updatedAt: "2026-09-18T12:00:00.000Z",
      sessionDate: "2026-09-12",
    },
    {
      id: "middle",
      classSessionId: "live-session-123",
      revision: 5,
      updatedAt: "2026-09-19T12:00:00.000Z",
      sessionDate: "2026-09-13",
    },
  ]);

  const resolved = await participationApi.resolveParticipationSessionStorageId(db, {
    classId: "B1 Bonn Klasse",
    classRecordId: "class-doc-1",
    classSessionId: "live-session-123",
    assignmentId: "B1-5.4",
    sessionDate: "2026-09-21",
    requestedSessionDate: "2026-09-21",
  });

  assert.equal(resolved, "newest-revision");
});

test("equal revisions choose the most recently updated legacy state", async () => {
  const db = fakeDb([
    {
      id: "older-update",
      classSessionId: "live-session-123",
      revision: 6,
      updatedAt: "2026-09-18T12:00:00.000Z",
      sessionDate: "2026-09-13",
    },
    {
      id: "newer-update",
      classSessionId: "live-session-123",
      revision: 6,
      updatedAt: "2026-09-20T12:00:00.000Z",
      sessionDate: "2026-09-11",
    },
  ]);

  const resolved = await participationApi.resolveParticipationSessionStorageId(db, {
    classId: "B1 Bonn Klasse",
    classRecordId: "class-doc-1",
    classSessionId: "live-session-123",
    assignmentId: "B1-5.4",
    sessionDate: "2026-09-21",
    requestedSessionDate: "2026-09-21",
  });

  assert.equal(resolved, "newer-update");
});

test("broad legacy lookup considers every matching document before selecting newest state", async () => {
  const rows = Array.from({ length: 25 }, (_, index) => ({
    id: `legacy-${String(index + 1).padStart(2, "0")}`,
    classSessionId: "live-session-many",
    revision: index < 24 ? index + 1 : 100,
    updatedAt: `2026-09-${String(Math.min(index + 1, 28)).padStart(2, "0")}T12:00:00.000Z`,
    sessionDate: "2026-09-01",
  }));
  const db = fakeDb(rows);

  const resolved = await participationApi.resolveParticipationSessionStorageId(db, {
    classId: "B1 Bonn Klasse",
    classRecordId: "class-doc-1",
    classSessionId: "live-session-many",
    assignmentId: "B1-5.9",
    sessionDate: "2026-10-01",
    requestedSessionDate: "2026-10-01",
  });

  assert.equal(resolved, "legacy-25");
});

test("already-installed legacy selection patch returns control to its importing runner", () => {
  const output = execFileSync(process.execPath, ["scripts/patchClassParticipationApi.mjs"], {
    cwd: root,
    encoding: "utf8",
  });

  assert.match(output, /Participation legacy session selection hardening is already installed\./);
  assert.match(output, /Persistent class participation API is registered\./);
});

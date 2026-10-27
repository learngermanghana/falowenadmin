import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const participationApi = require("../functions/classParticipationApi.js");

test("student participation lookup resolves presenter records through the linked student code", async () => {
  const studentDocs = [
    {
      id: "STACY123",
      data: {
        studentCode: "STACY123",
        email: "stacy@example.com",
        name: "Stacy Quarshie",
      },
    },
  ];
  const participationDocs = [
    {
      id: "participation-1",
      data: {
        studentCode: "stacy123",
        studentName: "Stacy Quarshie",
        className: "A1 Berlin Klasse",
        assignmentId: "A1-1.1",
        sessionDate: "2026-09-23",
        turns: 1,
        correct: 1,
        needsReview: 0,
        skipped: 0,
      },
    },
  ];

  const docsFor = (rows) => rows.map((row) => ({ id: row.id, data: () => row.data }));
  const db = {
    collection(name) {
      const rows = name === "students" ? studentDocs : participationDocs;
      return {
        doc(id) {
          const found = rows.find((row) => row.id === id);
          return {
            async get() {
              return found
                ? { id: found.id, exists: true, data: () => found.data }
                : { id, exists: false, data: () => ({}) };
            },
          };
        },
        where(field, op, value) {
          assert.equal(op, "==");
          const matching = rows.filter((row) => String(row.data[field] || "") === String(value || ""));
          return {
            limit(limit) {
              return {
                async get() {
                  return { docs: docsFor(matching.slice(0, limit)) };
                },
              };
            },
          };
        },
      };
    },
  };

  const rows = await participationApi.loadStudentParticipationForUser(db, {
    uid: "auth-uid-not-on-presenter-record",
    email: "stacy@example.com",
  });

  assert.equal(rows.length, 1);
  assert.equal(rows[0].assignmentId, "A1-1.1");
  assert.equal(rows[0].turns, 1);
  assert.equal(rows[0].correct, 1);
});

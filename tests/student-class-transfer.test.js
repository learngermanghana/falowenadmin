import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

import {
  transferStudentClass,
  listStudentClassTransfers,
} from "../src/services/studentsService.js";

const require = createRequire(import.meta.url);
const transferModule = require("../functions/studentProfileUpdate.js");
const {
  normalizeClassTransferRequest,
  registerStudentProfileUpdateRoute,
} = transferModule;

function responseStub() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

function buildTransferHarness() {
  const routes = { patch: new Map(), post: new Map(), get: new Map() };
  const touchedCollections = [];
  const batchWrites = [];
  let autoId = 0;

  const studentData = {
    name: "Stacy Quarshie",
    email: "stacy@example.com",
    studentCode: "STACY001",
    classId: "old-class",
    classRecordId: "old-class",
    className: "A1 Berlin Klasse",
    level: "A1",
  };
  const classData = {
    name: "A1 Dortmund Klasse",
    levelId: "A1",
  };

  const makeRef = (collectionName, id) => ({
    id,
    path: `${collectionName}/${id}`,
    async get() {
      if (collectionName === "students" && id === "student-1") {
        return { id, exists: true, data: () => studentData };
      }
      if (collectionName === "classes" && id === "new-class") {
        return { id, exists: true, data: () => classData };
      }
      return { id, exists: false, data: () => ({}) };
    },
  });

  const db = {
    collection(name) {
      touchedCollections.push(name);
      return {
        doc(id) {
          const resolvedId = id || `auto-${++autoId}`;
          return makeRef(name, resolvedId);
        },
        where(field, op, value) {
          assert.equal(name, "studentClassTransfers");
          assert.equal(field, "studentId");
          assert.equal(op, "==");
          assert.equal(value, "student-1");
          return {
            limit(limit) {
              assert.equal(limit, 100);
              return {
                async get() {
                  return {
                    docs: [{
                      id: "transfer-history-1",
                      data: () => ({
                        studentId: "student-1",
                        effectiveDate: "2026-09-23",
                        fromClassId: "old-class",
                        fromClassName: "A1 Berlin Klasse",
                        toClassId: "new-class",
                        toClassName: "A1 Dortmund Klasse",
                      }),
                    }],
                  };
                },
              };
            },
          };
        },
      };
    },
    batch() {
      return {
        update(ref, payload) {
          batchWrites.push({ type: "update", ref, payload });
        },
        set(ref, payload) {
          batchWrites.push({ type: "set", ref, payload });
        },
        async commit() {
          batchWrites.push({ type: "commit" });
        },
      };
    },
  };

  const app = {
    patch(path, handler) { routes.patch.set(path, handler); },
    post(path, handler) { routes.post.set(path, handler); },
    get(path, handler) { routes.get.set(path, handler); },
  };
  const admin = {
    firestore: {
      FieldValue: {
        serverTimestamp: () => "SERVER_TIMESTAMP",
        arrayUnion: (value) => ({ __arrayUnion: value }),
      },
    },
  };

  registerStudentProfileUpdateRoute({
    app,
    db,
    admin,
    requireAuth: async () => ({ uid: "admin-1", email: "staff@falowen.app" }),
  });

  return { routes, db, batchWrites, touchedCollections };
}

test("class transfer validation rejects future dates", () => {
  assert.throws(
    () => normalizeClassTransferRequest({
      targetClassRecordId: "new-class",
      effectiveDate: "2999-01-01",
    }),
    /Future-dated class transfers/,
  );
});

test("class transfer changes only current membership and writes an audit trail", async () => {
  const { routes, batchWrites, touchedCollections } = buildTransferHarness();
  const handler = routes.post.get("/students/:studentId/transfer-class");
  assert.equal(typeof handler, "function");

  const response = responseStub();
  await handler({
    params: { studentId: "student-1" },
    body: {
      targetClassRecordId: "new-class",
      effectiveDate: "2026-09-23",
      reason: "Timetable conflict",
    },
  }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.student.classId, "new-class");
  assert.equal(response.body.student.className, "A1 Dortmund Klasse");
  assert.equal(response.body.transfer.fromClassName, "A1 Berlin Klasse");
  assert.equal(response.body.transfer.toClassName, "A1 Dortmund Klasse");

  const studentWrite = batchWrites.find((write) => write.type === "update" && write.ref.path === "students/student-1");
  assert.ok(studentWrite);
  assert.equal(studentWrite.payload.classId, "new-class");
  assert.equal(studentWrite.payload.classRecordId, "new-class");
  assert.equal(studentWrite.payload.className, "A1 Dortmund Klasse");
  assert.equal(studentWrite.payload.previousClassId, "old-class");
  assert.equal(studentWrite.payload.previousClassName, "A1 Berlin Klasse");
  assert.equal(studentWrite.payload.classTransferEffectiveDate, "2026-09-23");
  assert.deepEqual(studentWrite.payload.classTransfers.__arrayUnion, response.body.transfer);

  assert.ok(batchWrites.some((write) => write.type === "set" && write.ref.path.startsWith("studentClassTransfers/")));
  assert.ok(batchWrites.some((write) => write.type === "set" && write.ref.path.startsWith("auditLogs/")));

  assert.equal(touchedCollections.includes("attendance"), false);
  assert.equal(touchedCollections.includes("classParticipationRecords"), false);
  assert.equal(touchedCollections.includes("submissions"), false);
  assert.equal(touchedCollections.includes("scores"), false);
});

test("class transfer history endpoint returns prior moves without rewriting them", async () => {
  const { routes } = buildTransferHarness();
  const handler = routes.get.get("/students/:studentId/class-transfers");
  const response = responseStub();

  await handler({ params: { studentId: "student-1" } }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.transfers.length, 1);
  assert.equal(response.body.transfers[0].fromClassName, "A1 Berlin Klasse");
  assert.equal(response.body.transfers[0].toClassName, "A1 Dortmund Klasse");
});

test("browser class transfer uses authenticated same-origin endpoint", async () => {
  const calls = [];
  const result = await transferStudentClass("student/one", {
    targetClassRecordId: "class/new",
    effectiveDate: "2026-09-23",
    reason: "Schedule",
  }, {
    headersLoader: async () => ({
      "Content-Type": "application/json",
      Authorization: "Bearer token",
    }),
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        text: async () => JSON.stringify({
          ok: true,
          studentId: "student/one",
          student: { classId: "class/new" },
          transfer: { id: "transfer-1" },
        }),
      };
    },
  });

  assert.equal(result.ok, true);
  assert.equal(calls[0].url, "/api/students/student%2Fone/transfer-class");
  assert.equal(calls[0].options.method, "POST");
  assert.equal(calls[0].options.headers.Authorization, "Bearer token");
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    targetClassRecordId: "class/new",
    effectiveDate: "2026-09-23",
    reason: "Schedule",
  });
});

test("browser can load class transfer history", async () => {
  const calls = [];
  const rows = await listStudentClassTransfers("student one", {
    headersLoader: async () => ({ Authorization: "Bearer token" }),
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        text: async () => JSON.stringify({
          ok: true,
          transfers: [{ id: "transfer-1", effectiveDate: "2026-09-23" }],
        }),
      };
    },
  });

  assert.equal(calls[0].url, "/api/students/student%20one/class-transfers");
  assert.equal(calls[0].options.headers.Authorization, "Bearer token");
  assert.equal(rows.length, 1);
});

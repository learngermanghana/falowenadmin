import test from "node:test";
import assert from "node:assert/strict";

import studentProfileUpdateModule from "../functions/studentProfileUpdate.js";
import {
  parseStudentProfileUpdateResponse,
  updateStudentByIdThroughApi,
} from "../src/services/studentsService.js";

const {
  sanitizeStudentProfileUpdates,
  registerStudentProfileUpdateRoute,
} = studentProfileUpdateModule;

test("student profile sanitizer keeps level and className but blocks privileged fields", () => {
  const updates = sanitizeStudentProfileUpdates({
    level: " A2 ",
    className: " Accra Evening ",
    program: "German",
    role: "admin",
    uid: "replacement-auth-user",
    notificationsLastSeenAt: 0,
  });

  assert.deepEqual(updates, {
    level: "A2",
    className: "Accra Evening",
    program: "German",
  });
});

test("authenticated student profile route updates level and className with merge", async () => {
  let routePath = "";
  let routeHandler = null;
  const writes = [];
  const authCalls = [];
  const app = {
    patch(path, handler) {
      routePath = path;
      routeHandler = handler;
    },
  };
  const studentRef = {
    get: async () => ({ exists: true }),
    set: async (payload, options) => writes.push({ payload, options }),
  };
  const db = {
    collection(name) {
      assert.equal(name, "students");
      return {
        doc(id) {
          assert.equal(id, "student-1");
          return studentRef;
        },
      };
    },
  };
  const admin = {
    firestore: {
      FieldValue: {
        serverTimestamp: () => "SERVER_TIMESTAMP",
      },
    },
  };
  const requireAuth = async (req) => {
    authCalls.push(req);
    return { uid: "teacher-1", email: "teacher@example.com" };
  };

  registerStudentProfileUpdateRoute({ app, db, admin, requireAuth });
  assert.equal(routePath, "/students/:studentId");
  assert.equal(typeof routeHandler, "function");

  const response = {
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

  await routeHandler({
    params: { studentId: "student-1" },
    body: {
      updates: {
        level: "B1",
        className: "B1 Berlin",
        role: "admin",
      },
    },
  }, response);

  assert.equal(authCalls.length, 1);
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, {
    ok: true,
    studentId: "student-1",
    updates: { level: "B1", className: "B1 Berlin" },
  });
  assert.equal(writes.length, 1);
  assert.deepEqual(writes[0], {
    payload: {
      level: "B1",
      className: "B1 Berlin",
      updatedAt: "SERVER_TIMESTAMP",
      updatedBy: "teacher@example.com",
    },
    options: { merge: true },
  });
});

test("student profile route rejects unknown students without writing", async () => {
  let routeHandler;
  let writes = 0;
  const app = { patch: (_path, handler) => { routeHandler = handler; } };
  const db = {
    collection: () => ({
      doc: () => ({
        get: async () => ({ exists: false }),
        set: async () => { writes += 1; },
      }),
    }),
  };
  const admin = { firestore: { FieldValue: { serverTimestamp: () => "timestamp" } } };
  registerStudentProfileUpdateRoute({ app, db, admin, requireAuth: async () => ({ uid: "teacher" }) });

  const response = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  await routeHandler({ params: { studentId: "missing" }, body: { updates: { level: "A2" } } }, response);

  assert.equal(response.statusCode, 404);
  assert.equal(response.body.error, "Student not found");
  assert.equal(writes, 0);
});

test("browser student update uses authenticated same-origin PATCH", async () => {
  const calls = [];
  const result = await updateStudentByIdThroughApi("student/one", {
    level: "A2",
    className: "A2 Stuttgart",
  }, {
    headersLoader: async () => ({
      "Content-Type": "application/json",
      Authorization: "Bearer firebase-token",
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
          updates: { level: "A2", className: "A2 Stuttgart" },
        }),
      };
    },
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "/api/students/student%2Fone");
  assert.equal(calls[0].options.method, "PATCH");
  assert.equal(calls[0].options.headers.Authorization, "Bearer firebase-token");
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    updates: { level: "A2", className: "A2 Stuttgart" },
  });
  assert.equal(result.ok, true);
});

test("student update response explains an undeployed endpoint", () => {
  assert.throws(
    () => parseStudentProfileUpdateResponse({ ok: false, status: 404, statusText: "Not Found" }, "<html>not found</html>"),
    /Student update endpoint is not deployed yet/,
  );
});

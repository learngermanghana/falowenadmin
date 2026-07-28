import test from "node:test";
import assert from "node:assert/strict";

import studentProfileUpdateModule from "../functions/studentProfileUpdate.js";
import {
  parseStudentProfileUpdateResponse,
  updateStudentByIdThroughApi,
} from "../src/services/studentsService.js";

const {
  sanitizeStudentProfileUpdates,
  isStudentProfileEditor,
  registerStudentProfileUpdateRoute,
} = studentProfileUpdateModule;

function createResponse() {
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

test("student profile editor authorization is mandatory", () => {
  assert.equal(isStudentProfileEditor({ email: "student@example.com" }), false);
  assert.equal(isStudentProfileEditor({ email: "staff@falowen.app" }), true);
  assert.equal(isStudentProfileEditor({ email: "moxflex@gmail.com" }), true);
  assert.equal(isStudentProfileEditor({ email: "teacher@example.com" }, ["teacher@example.com"]), true);
  assert.equal(isStudentProfileEditor({ admin: true, email: "admin-claim@example.com" }), true);
});

test("ordinary authenticated users cannot update another student", async () => {
  let routeHandler;
  let writes = 0;
  const app = { patch: (_path, handler) => { routeHandler = handler; } };
  const db = {
    collection: () => ({
      doc: () => ({
        update: async () => { writes += 1; },
      }),
    }),
  };
  const admin = { firestore: { FieldValue: { serverTimestamp: () => "timestamp" } } };
  registerStudentProfileUpdateRoute({
    app,
    db,
    admin,
    requireAuth: async () => ({ uid: "student-user", email: "student@example.com" }),
  });

  const response = createResponse();
  await routeHandler({ params: { studentId: "student-1" }, body: { updates: { level: "B1" } } }, response);

  assert.equal(response.statusCode, 403);
  assert.equal(response.body.error, "Staff authorization required");
  assert.equal(writes, 0);
});

test("authorized staff route atomically updates level and className", async () => {
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
    update: async (payload) => writes.push(payload),
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

  registerStudentProfileUpdateRoute({
    app,
    db,
    admin,
    requireAuth,
    staffEmails: ["teacher@example.com"],
  });
  assert.equal(routePath, "/students/:studentId");
  assert.equal(typeof routeHandler, "function");

  const response = createResponse();
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
    level: "B1",
    className: "B1 Berlin",
    updatedAt: "SERVER_TIMESTAMP",
    updatedBy: "teacher@example.com",
  });
});

test("atomic update does not recreate a concurrently deleted student", async () => {
  let routeHandler;
  let updateCalls = 0;
  const app = { patch: (_path, handler) => { routeHandler = handler; } };
  const db = {
    collection: () => ({
      doc: () => ({
        update: async () => {
          updateCalls += 1;
          const error = new Error("No document to update");
          error.code = 5;
          throw error;
        },
      }),
    }),
  };
  const admin = { firestore: { FieldValue: { serverTimestamp: () => "timestamp" } } };
  registerStudentProfileUpdateRoute({
    app,
    db,
    admin,
    requireAuth: async () => ({ uid: "staff", email: "staff@falowen.app" }),
  });

  const response = createResponse();
  await routeHandler({ params: { studentId: "missing" }, body: { updates: { level: "A2" } } }, response);

  assert.equal(updateCalls, 1);
  assert.equal(response.statusCode, 404);
  assert.equal(response.body.error, "Student not found");
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

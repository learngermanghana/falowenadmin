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
  isStudentAlreadyPaid,
  makeManualTrialPatch,
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

test("student profile sanitizer keeps ordinary profile fields but forces class changes through transfer workflow", () => {
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
    program: "German",
  });
});


test("clearing contract dates stores database null without changing trial status or its timestamps", () => {
  const patch=sanitizeStudentProfileUpdates({
    contractStart:null,contractEnd:null,status:"trial_active",
    trialStartedAt:"2026-10-22T21:25:02.171Z",
    trialEndsAt:"2026-10-29T21:25:02.171Z",
  });
  assert.deepEqual(patch,{contractStart:null,contractEnd:null,status:"trial_active"});
  assert.equal(sanitizeStudentProfileUpdates({contractStart:"",contractEnd:""}).contractStart,null);
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
  const app = { patch: (_path, handler) => { routeHandler = handler; }, post: () => {}, get: () => {} };
  const db = {
    batch: () => ({}),
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

test("authorized staff route atomically updates ordinary student profile fields", async () => {
  let routePath = "";
  let routeHandler = null;
  const writes = [];
  const authCalls = [];
  const app = {
    patch(path, handler) {
      routePath = path;
      routeHandler = handler;
    },
    post() {},
    get() {},
  };
  const studentRef = {
    update: async (payload) => writes.push(payload),
  };
  const db = {
    batch: () => ({}),
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
        program: "German",
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
    updates: { level: "B1", program: "German" },
  });
  assert.equal(writes.length, 1);
  assert.deepEqual(writes[0], {
    level: "B1",
    program: "German",
    updatedAt: "SERVER_TIMESTAMP",
    updatedBy: "teacher@example.com",
  });
});

test("atomic update does not recreate a concurrently deleted student", async () => {
  let routeHandler;
  let updateCalls = 0;
  const app = { patch: (_path, handler) => { routeHandler = handler; }, post: () => {}, get: () => {} };
  const db = {
    batch: () => ({}),
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
    program: "German",
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
          updates: { level: "A2", program: "German" },
        }),
      };
    },
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "/api/students/student%2Fone");
  assert.equal(calls[0].options.method, "PATCH");
  assert.equal(calls[0].options.headers.Authorization, "Bearer firebase-token");
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    updates: { level: "A2", program: "German" },
  });
  assert.equal(result.ok, true);
});

test("student update response explains an undeployed endpoint", () => {
  assert.throws(
    () => parseStudentProfileUpdateResponse({ ok: false, status: 404, statusText: "Not Found" }, "<html>not found</html>"),
    /Student update endpoint is not deployed yet/,
  );
});


test("editing contact email preserves Firebase authentication identity", async () => {
  let routeHandler;
  const writes = [];
  const authLookups = [];
  const app = {
    patch: (_path, handler) => { routeHandler = handler; },
    post() {},
    get() {},
  };
  const studentRef = {
    async get() {
      return {
        exists: true,
        data: () => ({
          uid: "firebase-user-1",
          email: "old-contact@example.com",
        }),
      };
    },
    async update(payload) {
      writes.push(payload);
    },
  };
  const db = {
    batch: () => ({}),
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
    auth() {
      return {
        async getUser(uid) {
          authLookups.push(uid);
          return {
            uid,
            email: "original-login@example.com",
            providerData: [{ providerId: "google.com" }],
          };
        },
      };
    },
    firestore: {
      FieldValue: {
        serverTimestamp: () => "SERVER_TIMESTAMP",
      },
    },
  };

  registerStudentProfileUpdateRoute({
    app,
    db,
    admin,
    requireAuth: async () => ({ uid: "staff", email: "staff@falowen.app" }),
  });

  const response = createResponse();
  await routeHandler({
    params: { studentId: "student-1" },
    body: { updates: { email: "new-contact@example.com" } },
  }, response);

  assert.deepEqual(authLookups, ["firebase-user-1"]);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.authIdentity.uid, "firebase-user-1");
  assert.equal(response.body.authIdentity.email, "original-login@example.com");
  assert.deepEqual(response.body.authIdentity.providers, ["google.com"]);
  assert.equal(response.body.updates.email, "new-contact@example.com");
  assert.equal(response.body.updates.authEmail, "original-login@example.com");
  assert.equal(writes[0].email, "new-contact@example.com");
  assert.equal(writes[0].authEmail, "original-login@example.com");
});

test("unpaid manual trial has a fresh seven-day end and never marks tuition paid", () => {
  const date = new Date("2026-10-22T11:00:00Z");
  const patch = makeManualTrialPatch({paymentStatus:"Pending",paid:0,uid:"auth-existing"},date,{
    serverTimestamp:()=> "now", delete:()=> "DELETE",
  });
  assert.equal(patch.status,"trial_active");
  assert.equal(patch.trialStatus,"active");
  assert.equal(patch.paymentStatus,"Pending");
  assert.equal(patch.trialStartedAt,"2026-10-22T11:00:00.000Z");
  assert.equal(patch.trialEndsAt,"2026-10-29T11:00:00.000Z");
  assert.equal(patch.trialExpiredAt,"DELETE");
  assert.equal(Object.hasOwn(patch,"paid"),false);
  assert.equal(Object.hasOwn(patch,"balanceDue"),false);
  assert.equal(isStudentAlreadyPaid({paid:0,paymentStatus:"Pending"}),false);
  assert.equal(isStudentAlreadyPaid({paid:10}),true);
  assert.throws(()=>makeManualTrialPatch({paymentStatus:"Paid"},date),/already has a payment/);
  assert.throws(()=>makeManualTrialPatch({paymentStatus:"Partially Paid",paid:20},date),/already has a payment/);
});

test("manual trial route edits existing student only and writes audit on successful activation", async () => {
  let activate, writes = [];
  const user={email:"staff@falowen.app",uid:"staff-uid"};
  const app={
    patch(){},get(){},
    post(path,handler){ if(path.endsWith("/activate-trial"))activate=handler; }
  };
  const studentRef={id:"student-1",get:async()=>({exists:true,data:()=>({uid:"existing-auth",paid:0,paymentStatus:"Pending",studentCode:"student-1"})})};
  const db={
    collection(name){ return {doc:(id)=>name==="students"?studentRef:{id:id||"audit-record"}}; },
    batch(){ return {
      update:(ref,payload)=>writes.push({type:"update",ref,payload}),
      set:(ref,payload)=>writes.push({type:"audit",ref,payload}),
      commit:async()=>{},
    }; },
  };
  const admin={firestore:{FieldValue:{serverTimestamp:()=> "now",delete:()=> "delete"}}};
  registerStudentProfileUpdateRoute({app,db,admin,requireAuth:async()=>user});
  assert.equal(typeof activate,"function");
  const res=createResponse();
  await activate({params:{studentId:"student-1"}},res);
  assert.equal(res.statusCode,200);
  assert.equal(res.body.trial.status,"trial_active");
  assert.equal(writes.length,2);
  assert.equal(writes[0].payload.paymentStatus,"Pending");
  assert.equal(writes[1].payload.type,"student.manual_trial_activation");
});

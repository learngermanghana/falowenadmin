const test = require("node:test");
const assert = require("node:assert/strict");
const { lookupSignupAccount, registerSignupAccountLookup } = require("./signupAccountLookup");

function makeDb(rows = []) {
  const queries = [];
  const students = {
    where(field, op, value) {
      queries.push({ field, op, value });
      return { limit(count) { assert.equal(count, 3); return { get: async () => ({
        docs: rows.filter(row => row.data()[field] === value),
      }) }; } };
    },
    doc(id) { return { get: async () => rows.find(row => row.id === id) || { exists: false } }; },
  };
  return { db: { collection: name => { assert.equal(name, "students"); return students; } }, queries };
}
function user(uid, email) {
  return { uid, email, metadata: { creationTime: "2026-10-21T12:00:00Z" }, providerData: [{ providerId: "password" }] };
}
function makeAdmin(authUser = null, actor = {email:"moxflex@gmail.com",email_verified:true}) {
  return { auth: () => ({
    getUserByEmail: async () => {
      if (!authUser) throw { code: "auth/user-not-found" };
      return authUser;
    },
    verifyIdToken: async () => actor,
  }) };
}

test("reports Auth-only account without creating a profile", async () => {
  const { db, queries } = makeDb();
  const found = await lookupSignupAccount({ admin: makeAdmin(user("uid1", "augustina@example.com")), db, email:"augustina@example.com" });
  assert.equal(found.outcome, "auth_without_student");
  assert.equal(found.authExists, true);
  assert.equal(found.students.length, 0);
  assert.ok(queries.some(q => q.field === "uid" && q.value === "uid1"));
});

test("identifies student linked by studentCode document and UID", async () => {
  const row = { id: "STUDENTCODE", exists: true, data: () => ({ uid:"uid1",email:"augustina@example.com",studentCode:"STUDENTCODE",status:"pending" }) };
  const { db } = makeDb([row]);
  const found = await lookupSignupAccount({admin:makeAdmin(user("uid1","augustina@example.com")),db,email:"augustina@example.com"});
  assert.equal(found.outcome, "linked_student");
  assert.equal(found.students.length, 1);
  assert.equal(found.students[0].studentCode, "STUDENTCODE");
});

test("reports unregistered lead emails without claiming an Auth account exists", async () => {
  const { db } = makeDb();
  const found = await lookupSignupAccount({admin:makeAdmin(),db,email:"lead@example.com"});
  assert.equal(found.outcome, "not_found");
});

test("requires verified owner and rejects unauthorized email lookup", async () => {
  const handlers = new Map();
  registerSignupAccountLookup({get:(path,handle)=>handlers.set(path,handle)}, {admin:makeAdmin(null,{email:"teacher@example.com",email_verified:true}),db:makeDb().db});
  const handler=handlers.get("/admin/signup-account-lookup");
  assert.ok(handler);
  const response={ statusCode:200,status(n){this.statusCode=n;return this;},json(data){this.data=data;return this;},set(){return this;} };
  await handler({headers:{authorization:"Bearer valid"},query:{email:"student@example.com"}},response);
  assert.equal(response.statusCode,403);
  assert.equal(response.data.ok,false);
});


test("Admin Vercel routes the owner-only account lookup to Firebase before the catch-all API router", () => {
  const fs = require("node:fs");
  const routes = JSON.parse(fs.readFileSync("vercel.json", "utf8")).rewrites;
  const index = routes.findIndex(item => item.source === "/api/admin/signup-account-lookup");
  assert.ok(index >= 0, "missing Firebase account diagnostic rewrite");
  assert.ok(index < routes.findIndex(item => item.source === "/api/(.*)"));
  assert.equal(routes[index].destination,
    "https://us-central1-falowen-examiner-trainer.cloudfunctions.net/api/admin/signup-account-lookup");
});

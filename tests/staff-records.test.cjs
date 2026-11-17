const test = require("node:test");
const assert = require("node:assert/strict");
const { allowed, project, registerStaffRecords, editResult } = require("../functions/staffRecords");
const grant = { active: true, pages: ["students", "results"], languages: ["swahili"] };
const user = { uid: "tutor", staff: true, staffPages: grant.pages, staffLanguages: grant.languages };
const updated = { toDate: () => new Date(0), nanoseconds: 0 };
const doc = fields => ({ id: "sample", exists: true, updateTime: updated, data: () => fields });

test("page and language grants must be present on the token and active staff record", () => {
  assert.ok(allowed(user, grant, "students", "swahili"));
  assert.ok(!allowed(user, grant, "results", "german"));
  assert.ok(!allowed(user, { ...grant, active: false }, "results", "swahili"));
  assert.ok(!allowed(user, { ...grant, pages: ["students"] }, "results", "swahili"));
  assert.ok(!allowed({ ...user, staffPages: [] }, grant, "students", "swahili"));
});

test("dual-enrolled student exposes only the selected course placement", () => {
  const learner = doc({ name: "Sample", className: "German class", billing: 99,
    secondaryProgram: "swahili", coursePlacements: { swahili: { level: "A1", className: "Swahili class" } } });
  assert.deepEqual(project(learner, "students", "swahili"), {
    id: "sample", name: "Sample", code: "sample", level: "A1", className: "Swahili class",
  });
  assert.equal(project(doc({ name: "Legacy German learner" }), "students", "swahili"), null);
  assert.equal(project(doc({ program: "swahili" }), "results", "german"), null);
});

test("Students endpoint refuses writes including for a tutor with both pages", async () => {
  let handler;
  const db = { collection: () => ({ doc: () => ({ get: async () => doc(grant) }) }) };
  registerStaffRecords({ post: (_, fn) => { handler = fn; } }, { db, verifyUser: async () => user });
  const res = { set() {}, status(code) { this.code = code; return this; }, json() {} };
  await handler({ body: { action: "edit", page: "students", language: "swahili" } }, res);
  assert.equal(res.code, 403);
});

test("score edits recheck stored language and version before writing", async () => {
  const staffRef = {}, writes = [];
  const db = { collection: name => ({ doc: () => ({ path: name + "/sample" }) }),
    runTransaction: fn => fn({ get: async ref => ref === staffRef ? doc(grant) : doc({ program: language }),
      update: (_, patch) => writes.push(patch), create: (_, job) => writes.push(job) }) };
  const input = { language: "swahili", id: "sample", score: 75, comments: "Revised", version: "1970-01-01T00:00:00.000Z/0" };
  let language = "german";
  await assert.rejects(editResult(db, user, staffRef, input), { status: 403 });
  language = "swahili";
  await assert.rejects(editResult(db, user, staffRef, { ...input, version: "old" }), { status: 409 });
  assert.equal(writes.length, 0);
  await editResult(db, user, staffRef, input);
  assert.equal(writes[0].score, 75);
  assert.equal(writes[0].feedback, "Revised");
  assert.equal(writes[1].scorePath, "scores/sample");
});

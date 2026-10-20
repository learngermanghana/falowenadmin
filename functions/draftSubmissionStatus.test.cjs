const { test } = require("node:test");
const assert = require("node:assert/strict");
const { getDraftSubmissionState, queueMissingDraftMarking } = require("./draftSubmissionStatus.js");

const UID = "student-uid-1";
const KEY = "A1-10";
const draftId = "draft-id";
const draft = {
  studentId: UID, studentEmail: "student@example.com", studentCode: "STUDENT123",
  assignmentKey: KEY, submissionText: "Ich esse Brot und trinke Wasser.", status: "draft",
};
const submitted = { ...draft, status: "submitted", markingStatus: "pending", submissionId: "receipt-1" };
const path = "submissions/receipt-1";

function fakeDb(seed = {}) {
  const records = new Map(Object.entries(seed));
  const ref = p => {
    const id = p.split("/").at(-1);
    return {
      path: p, id, async get() {
        const data = records.get(p);
        return { exists: Boolean(data), id, ref: ref(p), data: () => data && { ...data } };
      },
      collection: name => collection(p + "/" + name),
    };
  };
  const collection = p => ({
    doc: name => ref(p + "/" + name),
    where(field, op, value) {
      assert.equal(op, "==");
      return { limit(n) {
        return { async get() {
          const docs = [...records.entries()].filter(([key, row]) =>
            key.startsWith(p + "/") && !key.slice(p.length + 1).includes("/") && row[field] === value)
            .slice(0, n).map(([key, row]) => ({ id: key.split("/").at(-1), ref: ref(key), data: () => ({ ...row }) }));
          return { size: docs.length, docs };
        } };
      } };
    },
  });
  return {
    records,
    collection,
    doc: ref,
    async runTransaction(cb) {
      const writes = [];
      const outcome = await cb({
        get: d => d.get(),
        create: (d, data) => writes.push({ op: "create", d, data }),
        set: (d, data, opts) => writes.push({ op: "set", d, data, opts }),
      });
      for (const w of writes) {
        if (w.op === "create" && records.has(w.d.path)) throw Error("Duplicate document");
        records.set(w.d.path, w.op === "set" && w.opts?.merge
          ? { ...(records.get(w.d.path) || {}), ...w.data } : { ...w.data });
      }
      return outcome;
    },
  };
}
const admin = { firestore: { FieldValue: { serverTimestamp: () => "server-now" } } };
const actor = { uid: "owner", email: "moxflex@gmail.com" };

test("saved cloud draft without a final submission is NOT submitted", async () => {
  const db = fakeDb({ ["submissionDrafts/" + draftId]: draft });
  const result = await getDraftSubmissionState({ db, draft });
  assert.equal(result.status, "not-submitted");
  assert.equal(result.canQueue, false);
  assert.equal([...db.records.keys()].filter(k => k.startsWith("markingJobs/")).length, 0);
});

test("existing submitted work with missing job is detected and safely queued once", async () => {
  const db = fakeDb({ ["submissionDrafts/" + draftId]: draft, [path]: submitted });
  const before = await getDraftSubmissionState({ db, draft });
  assert.equal(before.status, "submitted-unmarked");
  assert.equal(before.canQueue, true);
  const queued = await queueMissingDraftMarking({ db, admin, draftId, submissionPath: path, actor });
  assert.equal(queued.status, "marking");
  const jobs = [...db.records.entries()].filter(([key]) => key.startsWith("markingJobs/"));
  assert.equal(jobs.length, 1);
  assert.equal(jobs[0][1].automatic, true);
  assert.equal(jobs[0][1].submissionPath, path);
  assert.equal(db.records.get(path).status, "submitted");
  assert.equal(db.records.get("submissionDrafts/" + draftId).status, "draft");
  const after = await getDraftSubmissionState({ db, draft });
  assert.equal(after.status, "marking");
  await assert.rejects(
    () => queueMissingDraftMarking({ db, admin, draftId, submissionPath: path, actor }),
    /blocked|job/i,
  );
});

test("a previously saved score blocks queueing and reports marked", async () => {
  const db = fakeDb({ ["submissionDrafts/" + draftId]: draft, [path]: submitted,
    ["scores/STUDENT123__A1-10"]: { studentCode: "STUDENT123", assignmentKey: KEY, score: 40 } });
  const result = await getDraftSubmissionState({ db, draft });
  assert.equal(result.status, "marked");
  assert.equal(result.score, 40);
  assert.equal(result.canQueue, false);
  await assert.rejects(() => queueMissingDraftMarking({ db, admin, draftId, submissionPath: path, actor }), /blocked/);
});

test("a currently queued job never launches duplicate marking", async () => {
  const db = fakeDb({ ["submissionDrafts/" + draftId]: draft, [path]: submitted,
    ["markingJobs/auto_dummy"]: { status: "pending" } });
  // A job with an unrelated ID does not count as the canonical one.
  assert.equal((await getDraftSubmissionState({ db, draft })).status, "submitted-unmarked");
  const canonical = require("./automaticCourseMarking.js").idForPath(path);
  db.records.set("markingJobs/" + canonical, { status: "pending" });
  const response = await getDraftSubmissionState({ db, draft });
  assert.equal(response.status, "marking");
  assert.equal(response.canQueue, false);
});

test("tutor-review jobs do not start a second AI assessment", async () => {
  const db = fakeDb({ ["submissionDrafts/" + draftId]: draft, [path]: submitted });
  const canonical = require("./automaticCourseMarking.js").idForPath(path);
  db.records.set("markingJobs/" + canonical, { status: "needs_review" });
  const response = await getDraftSubmissionState({ db, draft });
  assert.equal(response.status, "needs-review");
  assert.equal(response.canQueue, false);
});

test("a different student's submission is not treated as this learner's work", async () => {
  const db = fakeDb({ ["submissionDrafts/" + draftId]: draft,
    [path]: { ...submitted, studentId: "another-user" } });
  const response = await getDraftSubmissionState({ db, draft });
  assert.equal(response.status, "not-submitted");
});

test("missing student code prevents unsafe automatic marking", async () => {
  const withoutCode = { ...draft, studentCode: "" };
  const db = fakeDb({ ["submissionDrafts/" + draftId]: withoutCode,
    [path]: { ...submitted, studentCode: "" } });
  const response = await getDraftSubmissionState({ db, draft: withoutCode });
  assert.equal(response.status, "needs-review");
  assert.equal(response.canQueue, false);
});

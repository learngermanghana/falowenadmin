const test = require("node:test");
const assert = require("node:assert/strict");
const { listTimedDraftRecovery, recoverTimedDraft, sanitizeDate, recoveryId } = require("./timedDraftRecovery");

function fakeFirestore(seed = {}) {
  const data = new Map();
  for (const [name, docs] of Object.entries(seed)) {
    for (const [id, record] of Object.entries(docs)) data.set(name + "/" + id, { ...record });
  }
  const ref = path => ({
    id: path.split("/").at(-1), path,
    get: async () => {
      const row = data.get(path);
      return { id: path.split("/").at(-1), ref: ref(path), exists: Boolean(row),
        data: () => row ? { ...row } : undefined };
    },
  });
  const collection = name => ({
    doc: id => ref(name + "/" + id),
    where: (field, _op, value) => query(name, [{ field, value }]),
    limit: cap => query(name, []).limit(cap),
  });
  function query(name, criteria) {
    let max = 2000;
    return {
      where: (field, _op, value) => query(name, [...criteria, { field, value }]),
      limit: value => { max = value; return { get: async () => snapshot(name, criteria, max) }; },
      get: async () => snapshot(name, criteria, max),
    };
  }
  function snapshot(name, criteria, max) {
    const docs = [...data.entries()]
      .filter(([path]) => path.startsWith(name + "/") && path.slice(name.length + 1).indexOf("/") < 0)
      .filter(([, entry]) => criteria.every(({ field, value }) => entry[field] === value))
      .slice(0, max).map(([path, record]) => ({ id: path.split("/").at(-1), ref: ref(path),
        data: () => ({ ...record }) }));
    return { docs, size: docs.length };
  }
  return {
    collection, data,
    runTransaction: async fn => {
      const operations = [];
      const answer = await fn({
        get: ref => ref.get(),
        create: (ref, value) => operations.push({ op: "create", ref, value }),
        update: (ref, value) => operations.push({ op: "update", ref, value }),
      });
      for (const { op, ref, value } of operations) {
        if (op === "create" && data.has(ref.path)) throw new Error("Already exists");
        data.set(ref.path, op === "update" ? { ...(data.get(ref.path) || {}), ...value } : { ...value });
      }
      return answer;
    },
  };
}
const UID = "student-abc";
const EMAIL = "learner@example.com";
const DATE = Date.UTC(2026, 9, 19, 21, 59);
const timerId = "timed__student-abc__a1-14.1";
const draftId = "student-abc__a1__chapter-14.1";
const oneTimer = {
  studentId: UID, studentEmail: EMAIL, assignmentKey: "A1-14.1", level: "A1",
  timerRecord: true, status: "expired", clientStartedAt: DATE, durationSeconds: 1800,
};
const oneDraft = {
  studentId: UID, studentEmail: EMAIL, studentCode: "STU-9",
  assignmentKey: "A1-14.1", assignmentTitle: "A1 Health", chapter: "14.1", day: 22,
  submissionText: "Teil 1: richtig. Teil 2: falsch. Teil 3: Ich bin krank.",
  updatedAt: DATE + 15 * 60000, status: "draft",
};
const fixtures = (timer = oneTimer, draft = oneDraft) => fakeFirestore({
  submissionLocks: { [timerId]: timer },
  submissionDrafts: { [draftId]: draft },
});

test("date input validation rejects invalid or impossible dates", () => {
  assert.equal(sanitizeDate("2026-10-19"), Date.UTC(2026, 9, 19));
  assert.throws(() => sanitizeDate("2026-02-31"));
  assert.throws(() => sanitizeDate("yesterday"));
});

test("one saved cloud draft is found and can be recovered without changing answer text", async () => {
  const db = fixtures();
  const result = await listTimedDraftRecovery({ db, date: "2026-10-19" });
  assert.equal(result.cases.length, 1);
  assert.equal(result.cases[0].state, "recoverable");
  assert.equal(result.cases[0].draftId, draftId);
  assert.match(result.cases[0].draftText, /Ich bin krank/);
  const admin = { firestore: { FieldValue: { serverTimestamp: () => "SERVER_TIME" } } };
  const recovered = await recoverTimedDraft({
    admin, db, timerId, draftId, actor: { uid: "staff", email: "staff@falowen.app" },
  });
  assert.match(recovered.submissionPath, /^submissions\/recovered_/);
  assert.equal(db.data.get(recovered.submissionPath).submissionText, oneDraft.submissionText);
  assert.equal(db.data.get(recovered.submissionPath).status, "submitted");
  assert.equal(db.data.get("submissionDrafts/" + draftId).submissionText, oneDraft.submissionText);
  assert.equal(db.data.get("submissionLocks/" + timerId).originalTimerStatus, "expired");
  assert.equal(db.data.get("submissionLocks/" + timerId).status, "submitted");
  assert.ok(db.data.has("timedDraftRecoveryAudit/" + recoveryId(draftId)));
  await assert.rejects(() => recoverTimedDraft({ admin, db, timerId, draftId, actor: { uid: "staff", email: EMAIL } }),
    /Recovery blocked/);
});

test("already submitted assignments are never proposed for recovery", async () => {
  const db = fixtures();
  db.data.set("submissions/old", { studentId: UID, studentEmail: EMAIL,
    assignmentKey: "A1-14.1", status: "submitted" });
  const { cases: [item] } = await listTimedDraftRecovery({ db, date: "2026-10-19" });
  assert.equal(item.state, "already-submitted");
  assert.deepEqual(item.submissionPaths, ["submissions/old"]);
});

test("saved scores prevent duplicate submissions even when receipt is absent", async () => {
  const db = fixtures();
  db.data.set("scores/STU-9__A1-14.1", { studentCode: "STU-9", assignmentKey: "A1-14.1", score: 48 });
  const { cases: [item] } = await listTimedDraftRecovery({ db, date: "2026-10-19" });
  assert.equal(item.state, "already-submitted");
});

test("unowned, missing and post-expiry drafts cannot be auto-recovered", async () => {
  const noDraft = fakeFirestore({ submissionLocks: { [timerId]: oneTimer } });
  assert.equal((await listTimedDraftRecovery({ db: noDraft, date: "2026-10-19" })).cases[0].state, "no-cloud-draft");
  const lateDraft = fixtures(oneTimer, { ...oneDraft, updatedAt: DATE + 38 * 60000 });
  assert.equal((await listTimedDraftRecovery({ db: lateDraft, date: "2026-10-19" })).cases[0].state, "needs-review");
  const wrongOwner = fixtures(oneTimer, { ...oneDraft, studentId: "another-student" });
  assert.equal((await listTimedDraftRecovery({ db: wrongOwner, date: "2026-10-19" })).cases[0].state, "no-cloud-draft");
});

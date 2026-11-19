const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const { createSwahiliResultWorker } = require("./swahiliResults");
const { createScoreSyncWorker } = require("./automaticCourseMarking");

for (const day of [6, 11]) test(`Day ${day} workbook reaches the marking queue and upserts the tutor score to Sheets`, async () => {
  const uid = "synthetic-student";
  const path = `users/${uid}/swahiliLessons/day-${day}`;
  const reviewPath = `swahiliTeacherReviews/${uid}_day-${day}`;
  const timestamp = (seconds) => ({
    seconds, nanoseconds: 0, toMillis: () => seconds * 1000,
    toDate: () => new Date(seconds * 1000), isEqual: other => other?.seconds === seconds,
  });
  const student = { uid, program: "swahili", studentCode: "TEST01" };
  const data = new Map([[path, {
    studentId: uid, userId: uid, program: "swahili", lessonId: `swahili-day-${day}`,
    status: "submitted", submittedAt: timestamp(10), writing: { order: "Ninaomba maji." },
  }]]);
  const snapshot = path => ({ ref: ref(path), exists: data.has(path), data: () => data.get(path) });
  const ref = path => ({
    path, id: path.split("/").at(-1), get: async () => snapshot(path),
    set: async values => data.set(path, { ...data.get(path), ...values }),
  });
  const tx = {
    get: target => target.get(),
    set: (target, values) => target.set(values),
    create: (target, values) => target.set(values),
    commit: async () => {},
  };
  const db = {
    doc: ref, runTransaction: callback => callback(tx), batch: () => tx,
    collection: name => ({
      doc: id => ref(`${name}/${id}`),
      where: () => ({ get: async () => ({ docs: [{ data: () => student }] }) }),
    }),
  };
  const context = {
    db, doc: (_, ...parts) => ref(parts.join("/")),
    collection: (_, name) => ({ name }), collectionGroup: (_, name) => ({ name }),
    query: (source, ...filters) => ({ ...source, filters }),
    or: (...parts) => parts, where: (...parts) => parts, orderBy: () => null, limit: () => null,
    getDoc: target => target.get(),
    getDocs: async query => {
      if (query.name === "students") return { docs: [{ data: () => student }], size: 1 };
      const lesson = query.filters[1][2];
      assert.deepEqual(query.filters.slice(0, 3), [
        ["program", "==", "swahili"], ["lessonId", "==", lesson], ["status", "==", "submitted"],
      ]);
      if (context.missingIndex) throw Object.assign(new Error("Index building"), { code: "failed-precondition" });
      return lesson === `swahili-day-${day}` ? { docs: [snapshot(path)], size: 1 } : { docs: [], size: 0 };
    },
    runTransaction: (_, callback) => db.runTransaction(callback),
    serverTimestamp: () => timestamp(20),
  };
  for (const file of ["utils/swahiliReviewQueue.js", "services/swahiliMarkingService.js"]) {
    const source = readFileSync(join(__dirname, "../src", file), "utf8");
    vm.runInNewContext(source.replace(/^import .*\n/gm, "").replace(/^export /gm, ""), context);
  }
  const page = await context.loadAllSwahiliMarkingPage();
  assert.equal(page.rows[0].path, path);
  assert.equal(page.rows[0].writing.order, "Ninaomba maji.");
  context.missingIndex = true;
  assert.equal((await context.loadAllSwahiliMarkingPage()).rows[0].path, path);
  await context.saveSwahiliReview({ submission: page.rows[0], day, status: "reviewed", feedback: "Good work.", score: 81 });
  const emails = [];
  await createSwahiliResultWorker({
    db, auth: { getUser: async () => ({ email: "learner@example.com" }) },
    runtimeConfig: { communication: { swahili_result_bcc: "teacher@example.com" } },
    postAnnouncement: async (_, row) => emails.push(row),
  })({ data: { after: { ...snapshot(reviewPath), id: `${uid}_day-${day}` } } });
  const jobPath = [...data.keys()].find(key => key.startsWith("automaticScoreSync/"));
  assert.ok(jobPath);
  const job = data.get(jobPath);
  const requests = [];
  const sync = createScoreSyncWorker({
    db, config: () => ({ url: "https://example.com/mock-sheet", token: "test", sheetName: "Scores" }),
    post: async (_, request) => {
      requests.push(JSON.parse(request.body));
      return { ok: true, text: async () => JSON.stringify({ ok: true, mode: "upsert" }) };
    },
  });
  await sync({ data: { ref: ref(jobPath) } });
  await sync({ data: { ref: ref(jobPath) } });
  assert.equal(requests.length, 1);
  assert.equal(requests[0].sheet_name, "Scores");
  assert.deepEqual(requests[0].dedupe_columns, ["studentcode", "assignment_id"]);
  assert.equal(requests[0].rows[0].program, "swahili");
  assert.equal(requests[0].rows[0].assignment_id, `swahili-day-${day}`);
  assert.equal(requests[0].rows[0].score, 81);
  assert.equal(requests[0].rows[0].passed, true);
  assert.equal(data.get(jobPath).status, "synced");
  assert.equal(data.get(job.scorePath).sheetSaved, true);
  assert.equal(emails.length, 1);
  const reference = data.get(reviewPath).answerReference;
  if (day === 6) assert.equal(reference.reading["read-order"].answer, "Wali na kuku");
  else {
    assert.deepEqual(Object.values(reference.reading).map(q => q.answer[0]), ["B", "B", "B", "C", "C"]);
    assert.deepEqual(Object.values(reference.listening).map(q => q.answer[0]), ["B", "C", "A", "B", "C"]);
  }
  assert.ok(emails[0].link.endsWith(`#swahili-day-${day}`));
});

const assert = require("node:assert/strict");
const { test } = require("node:test");
const { createSwahiliResultWorker } = require("./swahiliResults");

function fixture({ currentVersion = 10, program = "swahili" } = {}) {
  const docs = new Map();
  const email = [];
  const ref = (path) => ({
    path,
    set: async (value) => docs.set(path, { ...docs.get(path), ...value }),
  });
  const reviewedAt = { seconds: 20, nanoseconds: 1, isEqual: (value) => value === reviewedAt, toDate: () => new Date(20000) };
  const review = {
    studentId: "uid", program: "swahili", lessonId: "swahili-day-1",
    status: "needs_revision", score: 0, feedback: "Review the vowels.",
    submissionVersion: "10:0", reviewedAt,
  };
  docs.set("swahiliTeacherReviews/uid", review);
  docs.set("users/uid/swahiliLessons/day-1", { submittedAt: { seconds: currentVersion, nanoseconds: 0 } });
  const db = {
    doc: ref,
    collection: (name) => ({
      doc: (id) => ref(`${name}/${id}`),
      where: () => ({ get: async () => ({ docs: [{ id: "legacy-code", data: () => ({ program }) }] }) }),
    }),
    runTransaction: (work) => work({
      get: async ({ path }) => ({ exists: docs.has(path), data: () => docs.get(path) }),
      set: (target, value) => docs.set(target.path, value),
      create: (target, value) => docs.set(target.path, value),
    }),
  };
  const work = createSwahiliResultWorker({
    runtimeConfig: { communication: { swahili_result_bcc: "teacher@example.com" } },
    db, auth: { getUser: async () => ({ email: "learner@example.com" }) },
    postAnnouncement: async (_, row) => email.push(row),
  });
  const event = { data: { after: { id: "uid", ref: ref("swahiliTeacherReviews/uid"), data: () => review } } };
  return { work, event, docs, email };
}

test("publishes a zero tutor score, queues Sheet sync, and emails Results once on retry", async () => {
  const { work, event, docs, email } = fixture();
  await work(event);
  await work(event);
  const [path, score] = Array.from(docs).find(([key]) => key.startsWith("scores/"));
  assert.equal(score.score, 0);
  assert.equal(score.passed, false);
  assert.equal(score.outcome, "failed");
  assert.equal(score.assignment_id, "swahili-day-1");
  const job = Array.from(docs).find(([key]) => key.startsWith("automaticScoreSync/"))[1];
  assert.equal(job.scorePath, path);
  assert.equal(job.status, "pending");
  assert.equal(email.length, 1);
  assert.equal(email[0].email, "learner@example.com");
  assert.equal(email[0].bcc, "teacher@example.com");
  assert.match(email[0].link, /\/campus\/results#swahili-day-1$/);
});

test("skips outdated submissions and profiles enrolled in German", async () => {
  for (const options of [{ currentVersion: 11 }, { program: "german" }]) {
    const { work, event, docs, email } = fixture(options);
    await work(event);
    assert.equal(docs.size, 2);
    assert.equal(email.length, 0);
  }
});

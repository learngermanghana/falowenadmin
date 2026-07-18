const test = require("node:test");
const assert = require("node:assert/strict");

const { _test } = require("../functions/courseReviewRequestEmails.js");

const classRecord = {
  id: "class-a1-bonn",
  name: "A1 Bonn Klasse",
  level: "A1",
  status: "active",
};

const completedSession = (overrides = {}) => ({
  id: "session-24",
  classId: classRecord.id,
  curriculumIndex: 24,
  assignmentIds: ["A1-5.10"],
  status: "completed",
  startsAt: "2026-09-04T11:00:00.000Z",
  endsAt: "2026-09-04T12:00:00.000Z",
  completedAt: "2026-09-04T12:30:00.000Z",
  sequence: 2,
  ...overrides,
});

test("selects the highest curriculum lesson even when two lessons share one start time", () => {
  const final = _test.pickFinalOfficialSession([
    completedSession({ id: "day-12", curriculumIndex: 12, assignmentIds: ["A1-8"] }),
    completedSession({ id: "day-13", curriculumIndex: 13, assignmentIds: ["A1-3.5"] }),
  ]);
  assert.equal(final.id, "day-13");
});

test("prefers the newest completed alias for the same final lesson", () => {
  const final = _test.pickFinalOfficialSession([
    completedSession({ id: "old", sequence: 1, status: "scheduled", updatedAt: "2026-09-04T09:00:00.000Z" }),
    completedSession({ id: "new", sequence: 3, completedAt: "2026-09-04T12:30:00.000Z", updatedAt: "2026-09-04T12:31:00.000Z" }),
  ]);
  assert.equal(final.id, "new");
});

test("sends only after the actual final session is completed and the delay has passed", () => {
  const classes = [classRecord];
  const sessions = [
    completedSession({ id: "session-23", curriculumIndex: 23, completedAt: "2026-09-03T12:30:00.000Z" }),
    completedSession(),
  ];

  assert.equal(_test.findDueCourseReviewRequests({
    classes,
    sessions,
    now: new Date("2026-09-04T20:00:00.000Z"),
  }).length, 0);

  const due = _test.findDueCourseReviewRequests({
    classes,
    sessions,
    now: new Date("2026-09-05T10:00:00.000Z"),
  });
  assert.equal(due.length, 1);
  assert.equal(due[0].finalSession.id, "session-24");
});

test("does not send when final completion was undone, cancelled, or superseded", () => {
  ["scheduled", "cancelled", "superseded"].forEach((status) => {
    const due = _test.findDueCourseReviewRequests({
      classes: [classRecord],
      sessions: [completedSession({ status })],
      now: new Date("2026-09-06T10:00:00.000Z"),
    });
    assert.equal(due.length, 0, status);
  });
});

test("uses class-specific review link before runtime config and fallback", () => {
  assert.equal(
    _test.resolveReviewUrl({ ...classRecord, googleReviewUrl: "https://example.com/direct-review" }, {
      reviews: { google_review_url: "https://example.com/runtime" },
    }, {}),
    "https://example.com/direct-review",
  );
  assert.equal(
    _test.resolveReviewUrl(classRecord, { reviews: { google_review_url: "https://example.com/runtime" } }, {}),
    "https://example.com/runtime",
  );
  assert.match(_test.resolveReviewUrl(classRecord, {}, {}), /google\.com\/maps/);
});

test("builds an individual Apps Script row with the review button enabled", () => {
  const student = { id: "student-1", name: "Felix", email: "felix@example.com" };
  const reviewUrl = "https://example.com/review";
  const message = _test.buildReviewMessage({ student, klass: classRecord, reviewUrl });
  const row = _test.rowForReviewRequest({
    student,
    klass: classRecord,
    finalSession: completedSession(),
    reviewUrl,
    message,
  });

  assert.equal(row.email, student.email);
  assert.equal(row.delivery_mode, "individual");
  assert.equal(row.show_review, "TRUE");
  assert.equal(row.review_url, reviewUrl);
  assert.equal(row.link, reviewUrl);
  assert.match(row.announcement, /honest feedback/i);
});

test("matches students by the exact class ID when one is available", () => {
  assert.equal(_test.studentBelongsToClass({ classId: classRecord.id }, classRecord), true);
  assert.equal(_test.studentBelongsToClass({ classId: "older-duplicate", className: classRecord.name }, classRecord), false);
});

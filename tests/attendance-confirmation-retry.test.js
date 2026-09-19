import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { _test } = require("../functions/attendanceConfirmationRetry.js");
const { resolveClassWebhookConfig, resolveWebhookConfig, rowForRetry, retrySafeCombinedMessage } = _test;

test("retry rows preserve individual attendance delivery and disable marketing blocks", () => {
  const row = rowForRetry({
    mode: "weekly",
    periodKey: "2026-W29",
    message: "Hello Student, here is your attendance summary.",
    className: "A1 Hamburg Klasse",
    studentEmail: "student@example.com",
    dueAt: "2026-07-15T20:00:00.000Z",
  }, {
    id: "class-1",
    levelId: "A1",
    timezone: "Africa/Accra",
  });

  assert.equal(row.topic, "Weekly Attendance Summary — 2026-W29");
  assert.equal(row.email, "student@example.com");
  assert.equal(row.delivery_mode, "individual");
  assert.equal(row.email_type, "attendance");
  assert.equal(row.show_progress, "FALSE");
  assert.equal(row.show_review, "FALSE");
  assert.equal(row.show_app_button, "FALSE");
});

test("class webhook settings override shared runtime settings", () => {
  const fallback = resolveWebhookConfig({
    communication: {
      announcement_webhook_url: "https://fallback.example/exec",
      announcement_webhook_token: "fallback-token",
    },
  }, {});
  const selected = resolveClassWebhookConfig({
    attendanceConfirmationEmailDelivery: {
      url: "https://class.example/exec",
      token: "class-token",
      sheetName: "Announcements",
    },
  }, fallback);

  assert.equal(selected.url, "https://class.example/exec");
  assert.equal(selected.token, "class-token");
  assert.equal(selected.sheetName, "Announcements");
});


test("retry rows preserve structured participation and bypass the legacy attendance-only renderer", () => {
  const row = rowForRetry({
    mode: "weekly",
    periodKey: "2026-W38",
    message: "Hello Victoria Odoom, here is your attendance summary for A2 Berlin Klasse, covering Wed, 16 Sept 2026 to Fri, 18 Sept 2026. Present: 1; Late: 0; Excused: 0; Absent: 2. Attendance rate: 33%. Lessons: Wed: Present; Thu: Absent; Fri: Absent. Class participation this week: participation was tracked in 2 lessons. Responses: 5; Correct: 4; Needs review: 1; Skipped: 0.",
    className: "A2 Berlin Klasse",
    studentEmail: "victoria@example.com",
    dueAt: "2026-09-18T20:00:00.000Z",
    deliveryPayload: {
      schemaVersion: 2,
      kind: "attendance_participation_summary",
      attendance: { present: 1, late: 0, excused: 0, absent: 2, rate: 33, lessons: [] },
      participation: {
        trackedLessons: 2,
        participatedLessons: 2,
        responses: 5,
        correct: 4,
        needsReview: 1,
        skipped: 0,
        detailsUrl: "https://www.falowen.app/campus/account?tab=participation&sessionId=session-2",
        text: "Class participation this week: participation was tracked in 2 lessons. Responses: 5; Correct: 4; Needs review: 1; Skipped: 0.",
      },
    },
  }, {
    id: "class-a2-berlin",
    levelId: "A2",
    timezone: "Africa/Accra",
  });

  assert.equal(row.subject, "Weekly Attendance & Participation Summary — 2026-W38");
  assert.equal(row.topic, row.subject);
  assert.equal(row.email_type, "general");
  assert.equal(row.render_mode, "attendance_with_participation");
  assert.match(row.link, /tab=participation/);
  assert.match(row.participation_text, /Responses: 5/);
  assert.equal(JSON.parse(row.attendance_json).participation.correct, 4);
  assert.doesNotMatch(row.announcement, /attendance summary/i);
  assert.match(row.announcement, /attendance and participation summary/i);
});

test("retry sanitizer changes only the legacy renderer trigger phrase", () => {
  const message = retrySafeCombinedMessage(
    "Hello Victoria, here is your attendance summary. Class participation this week: Responses: 5."
  );
  assert.doesNotMatch(message, /attendance summary/i);
  assert.match(message, /attendance and participation summary/i);
  assert.match(message, /Class participation this week:/i);
});

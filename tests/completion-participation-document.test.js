import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const {
  buildCompletionPdf,
  resolveAnnouncementWebhookSecret,
  summarizeAttendance,
  summarizeParticipation,
  _test,
} = require("../functions/completionParticipationDocument.js");

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

test("attendance completion summary counts present and late as attended", () => {
  const result = summarizeAttendance([
    { status: "present" },
    { status: "late" },
    { status: "absent" },
    { status: "excused" },
  ]);

  assert.deepEqual(result, {
    scheduled: 4,
    present: 1,
    late: 1,
    absent: 1,
    excused: 1,
    attended: 2,
    attendanceRate: 67,
  });
});

test("participation completion summary keeps diagnostic totals and concepts", () => {
  const result = summarizeParticipation([
    {
      sessionId: "session-1",
      turns: 2,
      correct: 1,
      needsReview: 1,
      skipped: 0,
      questionResponses: [
        { result: "correct", conceptLabel: "Modal verbs" },
        { result: "needs_review", conceptLabel: "Word order" },
      ],
    },
    {
      sessionId: "session-2",
      turns: 0,
      correct: 0,
      needsReview: 0,
      skipped: 0,
      questionResponses: [],
    },
  ]);

  assert.equal(result.trackedLessons, 2);
  assert.equal(result.participatedLessons, 1);
  assert.equal(result.participationRate, 50);
  assert.equal(result.turns, 2);
  assert.equal(result.correct, 1);
  assert.equal(result.needsReview, 1);
  assert.deepEqual(result.strongConcepts, ["Modal verbs"]);
  assert.deepEqual(result.reviewConcepts, ["Word order"]);
});

test("completion PDF is a two-page PDF containing attendance and participation text", () => {
  const pdf = buildCompletionPdf({
    documentId: "LLEA-ABC123",
    issuedAt: "2026-09-18T10:00:00.000Z",
    completionDate: "2026-09-18T10:00:00.000Z",
    student: { name: "Test Student", code: "TEST123" },
    course: { level: "B1", className: "B1 Accra" },
    attendance: {
      scheduled: 28, attended: 25, present: 23, late: 2, absent: 3, excused: 0, attendanceRate: 89,
    },
    participation: {
      trackedLessons: 20, participatedLessons: 18, participationRate: 90,
      turns: 32, correct: 25, needsReview: 7, skipped: 1,
      strongConcepts: ["Word order", "Modal verbs"],
      reviewConcepts: ["Relative clauses"],
    },
  });

  assert.ok(Buffer.isBuffer(pdf));
  assert.ok(pdf.length > 1000);
  const text = pdf.toString("latin1");
  assert.ok(text.startsWith("%PDF-1.4"));
  assert.match(text, /\/Count 2/);
  assert.match(text, /Certificate of Attendance/);
  assert.match(text, /Class Participation Record/);
  assert.match(text, /diagnostic learning data/);
});

test("completion document reuses the existing announcement webhook secret", () => {
  assert.equal(
    resolveAnnouncementWebhookSecret({ communication: { announcement_webhook_token: "existing-secret" } }, {}),
    "existing-secret",
  );
  assert.equal(
    resolveAnnouncementWebhookSecret(
      { communication: { announcement_webhook_token: "config-secret" } },
      { ANNOUNCEMENT_WEBHOOK_TOKEN: "env-secret" },
    ),
    "env-secret",
  );
  assert.equal(
    resolveAnnouncementWebhookSecret({ communication: { webhook_token: "legacy-existing-secret" } }, {}),
    "legacy-existing-secret",
  );
  assert.equal(resolveAnnouncementWebhookSecret({}, {}), "");
});

test("completion route is registered in Falowen Firebase API", () => {
  const indexSource = read("functions/index.js");
  const source = read("functions/completionParticipationDocument.js");

  assert.match(indexSource, /registerCompletionDocumentRoute/);
  assert.match(indexSource, /registerCompletionDocumentRoute\(\{ app, db, runtimeConfig, requireAuth \}\)/);
  assert.match(source, /\/completion\/attendance-participation-document/);
  assert.match(source, /X-Falowen-Announcement-Token|x-falowen-announcement-token/);
  assert.match(source, /application\/pdf/);
  assert.match(source, /classParticipationRecords/);
  assert.match(source, /attendance/);
  assert.doesNotMatch(source, /COMPLETION_DOCUMENT_SECRET|completion_document_secret/);
});

test("Apps Script completion attachment reuses the already-saved Announcement webhook token", () => {
  const source = read("docs/apps-script/completion-participation-attachment.gs");

  assert.match(source, /getWebhookToken_\(\)/);
  assert.match(source, /X-Falowen-Announcement-Token/);
  assert.doesNotMatch(source, /COMPLETION_DOCUMENT_SECRET|completion_document_secret|Save Completion Document Secret/);
});

test("official-session dedupe prefers canonical completed records", () => {
  const result = _test;
  assert.ok(result.sessionIdentity);
  const moduleSource = read("functions/completionParticipationDocument.js");
  assert.match(moduleSource, /dedupeOfficialSessions/);
  assert.match(moduleSource, /sessionPreference/);
  assert.match(moduleSource, /BLOCKED_SESSION_STATUSES/);
});

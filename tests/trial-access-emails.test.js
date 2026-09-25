import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { TRIAL_DURATION_MS, TRIAL_RETENTION_MS } = require("../functions/pendingStudentCleanup.js");
const { _test } = require("../functions/trialAccessEmails.js");

const {
  ACCOUNT_URL,
  CAMPUS_URL,
  DAY_MS,
  buildTrialAccessMessage,
  day1LessonUrl,
  resolveTrialEmailConfig,
  rowForTrialAccessEmail,
  trialEmailStage,
} = _test;

const NOW = Date.UTC(2026, 8, 25, 8, 0, 0);

function student(overrides = {}) {
  return {
    role: "student",
    status: "pending",
    paymentStatus: "pending",
    paid: 0,
    name: "Ama Mensah",
    email: "Ama@example.com",
    level: "A1",
    className: "A1 Hamburg Klasse",
    createdAt: new Date(NOW),
    ...overrides,
  };
}

test("trial email stages follow signup, day 3, day 6 and expiry", () => {
  assert.equal(trialEmailStage(student(), NOW), "welcome");
  assert.equal(trialEmailStage(student({ createdAt: new Date(NOW - 3 * DAY_MS) }), NOW), "day3");
  assert.equal(trialEmailStage(student({ createdAt: new Date(NOW - 6 * DAY_MS) }), NOW), "day6");
  assert.equal(trialEmailStage(student({ createdAt: new Date(NOW - TRIAL_DURATION_MS) }), NOW), "expired");
});

test("trial-expired students get the expiry email during retention", () => {
  const row = student({
    status: "trial_expired",
    createdAt: new Date(NOW - TRIAL_DURATION_MS - DAY_MS),
  });
  assert.equal(trialEmailStage(row, NOW), "expired");
});

test("no trial email is due once permanent purge is due", () => {
  const row = student({
    status: "trial_expired",
    createdAt: new Date(NOW - TRIAL_DURATION_MS - TRIAL_RETENTION_MS),
  });
  assert.equal(trialEmailStage(row, NOW), "");
});

test("paid students are excluded from trial reminder emails", () => {
  assert.equal(trialEmailStage(student({ paid: 500, paymentStatus: "partial" }), NOW), "");
});

test("welcome email links a German learner directly to Day 1", () => {
  const row = student({ level: "B1" });
  assert.equal(
    day1LessonUrl(row),
    "https://www.falowen.app/campus/course/lesson/B1/1?view=workbook",
  );

  const message = buildTrialAccessMessage({ student: row, stage: "welcome" });
  assert.match(message, /7-day Falowen free trial is now active/i);
  assert.match(message, /even if you have not paid yet/i);
  assert.match(message, /campus\/course\/lesson\/B1\/1\?view=workbook/);
  assert.match(message, /campus\/account/);
});

test("non-German course falls back to the campus instead of a German Day 1 link", () => {
  assert.equal(
    day1LessonUrl(student({ level: "A1", language: "French" })),
    CAMPUS_URL,
  );
});

test("expiry email explains the 30-day recovery window and deletion date", () => {
  const row = student({
    status: "trial_expired",
    createdAt: new Date(NOW - TRIAL_DURATION_MS),
  });
  const message = buildTrialAccessMessage({ student: row, stage: "expired" });

  assert.match(message, /kept for 30 days/i);
  assert.match(message, /permanent deletion/i);
  assert.match(message, /25 October 2026/);
  assert.match(message, /campus\/account/);
});

test("announcement row targets only the student and uses the right action button", () => {
  const row = rowForTrialAccessEmail({
    student: student({ email: " AMA@EXAMPLE.COM " }),
    stage: "welcome",
    now: new Date(NOW),
  });

  assert.equal(row.email, "ama@example.com");
  assert.equal(row.delivery_mode, "individual");
  assert.equal(row.allow_bcc_fallback, "FALSE");
  assert.equal(row.email_type, "trial_access_welcome");
  assert.equal(row.button_label, "Start Day 1 lesson");
  assert.match(row.link, /campus\/course\/lesson\/A1\/1\?view=workbook/);

  const expired = rowForTrialAccessEmail({
    student: student({ status: "trial_expired", createdAt: new Date(NOW - TRIAL_DURATION_MS) }),
    stage: "expired",
    now: new Date(NOW),
  });
  assert.equal(expired.link, ACCOUNT_URL);
  assert.equal(expired.button_label, "Open account to register");
});

test("trial emails reuse the shared Announcement webhook configuration", () => {
  const config = resolveTrialEmailConfig({
    communication: {
      announcement_webhook_url: "https://script.google.com/macros/s/existing/exec",
      announcement_webhook_token: "shared-secret",
      announcement_sheet_name: "Announcements",
    },
  }, {});

  assert.equal(config.url, "https://script.google.com/macros/s/existing/exec");
  assert.equal(config.token, "shared-secret");
  assert.equal(config.sheetName, "Announcements");
});

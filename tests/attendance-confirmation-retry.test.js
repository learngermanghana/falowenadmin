import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { _test } = require("../functions/attendanceConfirmationRetry.js");
const { resolveClassWebhookConfig, resolveWebhookConfig, rowForRetry } = _test;

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

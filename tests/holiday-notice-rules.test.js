import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const {
  normalizeNoticeStatus,
  resolveHolidayNoticeUpdate,
  resolveHolidaySendOutcome,
} = require("../functions/holidayNoticeRules.js");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("closed holiday can be scheduled automatically", () => {
  assert.deepEqual(
    resolveHolidayNoticeUpdate({
      existing: { schoolClosed: true, noticeStatus: "not_scheduled" },
      schoolClosed: true,
      autoSendNotice: true,
    }),
    { schoolClosed: true, autoSendNotice: true, noticeStatus: "scheduled" },
  );
});

test("open school forces automatic holiday notice off", () => {
  assert.deepEqual(
    resolveHolidayNoticeUpdate({
      existing: { schoolClosed: true, noticeStatus: "scheduled" },
      schoolClosed: false,
      autoSendNotice: true,
    }),
    { schoolClosed: false, autoSendNotice: false, noticeStatus: "not_scheduled" },
  );
});

test("sent status remains historical when closure settings change", () => {
  assert.deepEqual(
    resolveHolidayNoticeUpdate({
      existing: { schoolClosed: true, noticeStatus: "sent" },
      schoolClosed: false,
      autoSendNotice: true,
    }),
    { schoolClosed: false, autoSendNotice: false, noticeStatus: "sent" },
  );
});

test("no recipients is a supported notice status", () => {
  assert.equal(normalizeNoticeStatus("no_recipients"), "no_recipients");
  assert.deepEqual(
    resolveHolidaySendOutcome({ sent: 0, failed: 0, skipped: 1, recipientCount: 0 }),
    {
      status: "no_recipients",
      recipientCount: 0,
      attemptedCount: 0,
      lastError: "No active recipients found for this audience.",
    },
  );
});

test("failed and partial sends produce useful status details", () => {
  assert.deepEqual(
    resolveHolidaySendOutcome({ sent: 0, failed: 3, skipped: 0, recipientCount: 3 }),
    { status: "failed", recipientCount: 0, attemptedCount: 3, lastError: "Failed: 3; skipped: 0" },
  );
  assert.deepEqual(
    resolveHolidaySendOutcome({ sent: 4, failed: 1, skipped: 0, recipientCount: 5 }),
    { status: "sent", recipientCount: 4, attemptedCount: 5, lastError: "Partial send: 1 failed; 4 sent." },
  );
});

test("manual email subject distinguishes closure from holiday update", () => {
  const appsScript = fs.readFileSync(path.join(root, "apps-script/holiday-calendar-webapp.gs"), "utf8");
  assert.match(appsScript, /schoolClosed \? 'No class notice' : 'Holiday update'/);
});

test("manual payload includes the school-closed state", () => {
  const functionsIndex = fs.readFileSync(path.join(root, "functions/index.js"), "utf8");
  assert.match(functionsIndex, /schoolClosed: Boolean\(holiday\.schoolClosed\)/);
});


test("holiday API does not report a sent timestamp when nobody received mail", () => {
  const functionsIndex = fs.readFileSync(path.join(root, "functions/index.js"), "utf8");
  assert.match(functionsIndex, /const noticeWasSent = status === "sent" && recipientCount > 0/);
  assert.match(functionsIndex, /noticeSentAt: noticeWasSent \? new Date\(\)\.toISOString\(\) : null/);
});

test("holiday page treats recipient count as successful deliveries", () => {
  const holidayPage = fs.readFileSync(path.join(root, "src/pages/HolidayCalendarPage.jsx"), "utf8");
  assert.match(holidayPage, /<div>Delivered: \{holiday\.noticeRecipientCount\}<\/div>/);
  assert.match(holidayPage, /noticeSentAt: result\.noticeSentAt \?\? null/);
});


test("holiday page preserves legacy recipient-count semantics", () => {
  const holidayPage = fs.readFileSync(path.join(root, "src/pages/HolidayCalendarPage.jsx"), "utf8");
  assert.match(
    holidayPage,
    /typeof holiday\.noticeAttemptedCount === "number"[\s\S]*<div>Delivered: \{holiday\.noticeRecipientCount\}<\/div>[\s\S]*<div>Recipients: \{holiday\.noticeRecipientCount\}<\/div>/,
  );
});

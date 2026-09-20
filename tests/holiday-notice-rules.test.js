import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const {
  HOLIDAY_NOTICE_PROTOCOL_VERSION,
  normalizeNoticeStatus,
  resolveHolidayNoticeUpdate,
  buildHolidayNoticeSubject,
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


test("holiday subject helper matches closure mode", () => {
  assert.equal(
    buildHolidayNoticeSubject({ schoolClosed: true, holidayName: "Founders' Day", date: "2026-09-21" }),
    "No class notice: Founders' Day (2026-09-21)",
  );
  assert.equal(
    buildHolidayNoticeSubject({ schoolClosed: false, holidayName: "Founders' Day", date: "2026-09-21" }),
    "Holiday update: Founders' Day (2026-09-21)",
  );
});

test("Apps Script exposes matching preview and health protocol", () => {
  const appsScript = fs.readFileSync(path.join(root, "apps-script/holiday-calendar-webapp.gs"), "utf8");
  assert.match(appsScript, new RegExp(`HOLIDAY_NOTICE_PROTOCOL_VERSION = '${HOLIDAY_NOTICE_PROTOCOL_VERSION}'`));
  assert.match(appsScript, /action === 'health'/);
  assert.match(appsScript, /action === 'previewHolidayNotice'/);
  assert.match(appsScript, /recipientCount: recipients\.length/);
  assert.match(appsScript, /sampleBody:/);
});

test("holiday API provides preview, history, health and audited sends", () => {
  const functionsIndex = fs.readFileSync(path.join(root, "functions/index.js"), "utf8");
  assert.match(functionsIndex, /app\.get\("\/holidays\/apps-script-health"/);
  assert.match(functionsIndex, /app\.post\("\/holidays\/:date\/notice-preview"/);
  assert.match(functionsIndex, /app\.get\("\/holidays\/:date\/notice-history"/);
  assert.match(functionsIndex, /\.collection\("noticeHistory"\)\.add/);
  assert.match(functionsIndex, /triggerType: "manual"/);
  assert.match(functionsIndex, /triggerType: "automatic"/);
});

test("Holiday Calendar requires a fresh preview before manual send", () => {
  const holidayPage = fs.readFileSync(path.join(root, "src/pages/HolidayCalendarPage.jsx"), "utf8");
  const holidayService = fs.readFileSync(path.join(root, "src/services/holidayCalendarService.js"), "utf8");
  assert.match(holidayPage, /Preview required to confirm recipients/);
  assert.match(holidayPage, /preview\.signature !== currentSignature/);
  assert.match(holidayPage, /View history/);
  assert.match(holidayPage, /Holiday email service:/);
  assert.match(holidayService, /notice-preview/);
  assert.match(holidayService, /notice-history/);
  assert.match(holidayService, /apps-script-health/);
});

test("Apps Script deployment workflow is safe and health-visible", () => {
  const workflow = fs.readFileSync(path.join(root, ".github/workflows/deploy-holiday-apps-script.yml"), "utf8");
  assert.match(workflow, /HOLIDAY_APPS_SCRIPT_ID/);
  assert.match(workflow, /HOLIDAY_APPS_SCRIPT_DEPLOYMENT_ID/);
  assert.match(workflow, /GOOGLE_CLASPRC_JSON/);
  assert.match(workflow, /Expected exactly one server-side source file \(\.js or \.gs\)/);
  assert.match(workflow, /clasp update-deployment/);
});


test("legacy sent summary does not claim historical recipients were delivered", () => {
  const holidayPage = fs.readFileSync(path.join(root, "src/pages/HolidayCalendarPage.jsx"), "utf8");
  assert.match(holidayPage, /Sent · \$\{count\} recipient/);
  assert.match(holidayPage, /typeof holiday\.noticeAttemptedCount === "number"/);
});


test("holiday class schedule targeting is source-owned for preview and send", () => {
  const functionsIndex = fs.readFileSync(path.join(root, "functions/index.js"), "utf8");
  const patchScript = fs.readFileSync(path.join(root, "scripts/patchHolidayClassScheduleAwareness.mjs"), "utf8");
  const holidayPage = fs.readFileSync(path.join(root, "src/pages/HolidayCalendarPage.jsx"), "utf8");

  assert.match(functionsIndex, /async function buildHolidayNoticeTargets\(\{ date, noticeConfig \}\)/);
  assert.match(functionsIndex, /previewHolidayNoticeForDoc[\s\S]*buildHolidayNoticeTargets/);
  assert.match(functionsIndex, /sendHolidayNoticeForDoc[\s\S]*buildHolidayNoticeTargets/);
  assert.doesNotMatch(patchScript, /replaceAll\("const result = await sendHolidayNoticeForDoc/);
  assert.match(patchScript, /source-owned for both preview and send/);
  assert.match(holidayPage, /Students affected on this holiday date/);
});


test("preview signature changes when the holiday name changes", () => {
  const holidayPage = fs.readFileSync(path.join(root, "src/pages/HolidayCalendarPage.jsx"), "utf8");
  const signatureStart = holidayPage.indexOf("function holidayPreviewSignature");
  const signatureEnd = holidayPage.indexOf("function formatNoticeStatus", signatureStart);
  const signatureBlock = holidayPage.slice(signatureStart, signatureEnd);

  assert.match(signatureBlock, /holidayName:/);
  assert.match(signatureBlock, /holiday\.name \|\| holiday\.localName \|\| "Holiday"/);
});

test("metadata persistence failures do not create false holiday delivery failures", () => {
  const functionsIndex = fs.readFileSync(path.join(root, "functions/index.js"), "utf8");
  const sendStart = functionsIndex.indexOf("async function sendHolidayNoticeForDoc");
  const sendEnd = functionsIndex.indexOf('app.get("/holidays/upcoming"', sendStart);
  const sendBlock = functionsIndex.slice(sendStart, sendEnd);

  assert.match(sendBlock, /holiday_notice_metadata_write_failed/);
  assert.match(sendBlock, /noticeMetadataWarning: metadataWarning/);
  assert.doesNotMatch(sendBlock, /status:\s*"failed",[\s\S]*deliveredCount:\s*0[\s\S]*noticeResult/);
});

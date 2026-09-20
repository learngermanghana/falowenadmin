import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { normalizeNoticeStatus, resolveHolidayNoticeUpdate } = require("../functions/holidayNoticeRules.js");
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
});

test("manual email subject distinguishes closure from holiday update", () => {
  const appsScript = fs.readFileSync(path.join(root, "apps-script/holiday-calendar-webapp.gs"), "utf8");
  assert.match(appsScript, /schoolClosed \? 'No class notice' : 'Holiday update'/);
});

test("manual payload includes the school-closed state", () => {
  const functionsIndex = fs.readFileSync(path.join(root, "functions/index.js"), "utf8");
  assert.match(functionsIndex, /schoolClosed: Boolean\(holiday\.schoolClosed\)/);
});

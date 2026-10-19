import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";

const require = createRequire(import.meta.url);
const {
  DEFAULT_GOETHE_EXAM_CONFIG,
  nextRegistrationForLevel,
  normalizeGoetheExamConfig,
} = require("../functions/goetheExamConfig.js");

const patchPath = new URL("../scripts/patchGoetheExamConfig.mjs", import.meta.url);
const pagePath = new URL("../src/pages/GoetheExamConfigPage.jsx", import.meta.url);
const servicePath = new URL("../src/services/goetheExamConfigService.js", import.meta.url);
const appPath = new URL("../src/App.jsx", import.meta.url);

test("shared Goethe config keeps exact level registration campaigns", () => {
  const config = normalizeGoetheExamConfig(DEFAULT_GOETHE_EXAM_CONFIG);
  assert.equal(nextRegistrationForLevel(config, "A1", new Date("2026-07-15T12:00:00Z")), "2026-08-03");
  assert.equal(nextRegistrationForLevel(config, "A2", new Date("2026-07-15T12:00:00Z")), "2026-08-04");
  assert.equal(nextRegistrationForLevel(config, "B1", new Date("2026-07-15T12:00:00Z")), "2026-08-05");
  assert.ok(config.levels.find((level) => level.level === "A2").exams.some((exam) => exam.registrationStart === "2026-10-27"));
  assert.ok(config.levels.find((level) => level.level === "B1").exams.some((exam) => exam.registrationStart === "2026-10-28"));
});

test("shared reminder defaults preserve the existing Apps Script rules", () => {
  const config = normalizeGoetheExamConfig(DEFAULT_GOETHE_EXAM_CONFIG);
  assert.deepEqual(config.reminder.reminderDays, [14, 3, 2, 1]);
  assert.equal(config.reminder.minContractWeeks, 5);
  assert.equal(config.reminder.accountSetupDaysBefore, 7);
  assert.deepEqual(config.reminder.allowedStatuses, ["active", "paid", "enrolled"]);
  assert.deepEqual(config.reminder.openingWindows.map((window) => `${window.hour}:${window.minute}`), ["17:30", "23:30", "5:30"]);
});

test("invalid registration windows are rejected before publication", () => {
  const input = structuredClone(DEFAULT_GOETHE_EXAM_CONFIG);
  input.levels[0].exams = [{ date: "2026-09-01", registrationStart: "2026-08-05", registrationEnd: "2026-08-04" }];
  assert.throws(() => normalizeGoetheExamConfig(input), /cannot be before/);
});

test("Firebase patch provides a public read and protected admin write route", async () => {
  const source = await readFile(patchPath, "utf8");
  assert.match(source, /app\.get\("\/exam-file\/config"/);
  assert.match(source, /app\.put\("\/exam-file\/config"/);
  assert.match(source, /await requireAuth\(req\)/);
  assert.match(source, /publicConfig/);
  assert.match(source, /normalizeGoetheExamConfig/);
});

test("Admin exposes the complete shared Goethe editor and endpoint service", async () => {
  const [page, service, app] = await Promise.all([
    readFile(pagePath, "utf8"),
    readFile(servicePath, "utf8"),
    readFile(appPath, "utf8"),
  ]);
  assert.match(page, /Publish once to all three systems/);
  assert.match(page, /Add exam date/);
  assert.match(page, /Daily reminder hour/);
  assert.match(page, /Daily reminder minute/);
  assert.match(page, /Urgent opening-window emails/);
  assert.match(page, /accountSetupCatchUp/);
  assert.match(page, /reminderWindow/);
  assert.match(service, /cloudfunctions\.net\/api\/exam-file\/config/);
  assert.match(service, /Authorization: `Bearer \$\{token\}`/);
  assert.match(app, /path="\/exam-file"/);
  assert.match(app, /Goethe Exam File/);
});

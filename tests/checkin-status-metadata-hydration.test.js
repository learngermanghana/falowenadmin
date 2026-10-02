import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const apiSource = fs.readFileSync(path.join(repoRoot, "functions", "index.js"), "utf8");
const autoCheckinSource = fs.readFileSync(path.join(repoRoot, "functions", "classSessionAutoCheckin.js"), "utf8");
const pageSource = fs.readFileSync(path.join(repoRoot, "src", "pages", "CheckinPage.jsx"), "utf8");
const patchSource = fs.readFileSync(path.join(repoRoot, "scripts", "patchCheckinStatusMetadataHydration.mjs"), "utf8");

test("check-in status returns authoritative session metadata for concise links", () => {
  assert.match(apiSource, /checkinMetadataHydrated: true/);
  assert.match(apiSource, /db\.collection\("classSessions"\)\.doc\(sessionId\)/);
  assert.match(apiSource, /assignmentId,/);
  assert.match(apiSource, /sessionLabel,/);
  assert.match(apiSource, /startTime:/);
  assert.match(apiSource, /endTime:/);
  assert.match(apiSource, /startsAt,/);
  assert.match(apiSource, /endsAt,/);
});

test("generated status handler preserves YYYY-MM-DD digit regex escapes", () => {
  assert.match(
    apiSource,
    /\.find\(\(value\) => \/\^\\d\{4\}-\\d\{2\}-\\d\{2\}\$\/\.test\(value\)\)/,
  );
});

test("hydration generator avoids nested status template interpolation", () => {
  assert.match(patchSource, /const statusReplacement = String\.raw`app\.get/);
  assert.match(patchSource, /return \[parts\.year, parts\.month, parts\.day\]\.join\("-"\);/);
  assert.doesNotMatch(patchSource, /return `\$\{parts\.year\}-\$\{parts\.month\}-\$\{parts\.day\}`/);
  assert.match(patchSource, /Generated check-in status date regex lost digit escapes/);
});

test("automatic attendance opening persists class metadata for future status reads", () => {
  assert.match(autoCheckinSource, /classStartsAt: startsAt\.toISOString\(\)/);
  assert.match(autoCheckinSource, /classEndsAt: sessionEnd\(session\)\?\.toISOString\(\) \|\| ""/);
  assert.match(autoCheckinSource, /startTime: formatTime24\(startsAt/);
  assert.match(autoCheckinSource, /endTime: formatTime24\(sessionEnd\(session\)/);
});

test("CheckinPage uses hydrated metadata without exposing teacher slides or internal attendance IDs", () => {
  assert.match(pageSource, /const resolvedDate/);
  assert.match(pageSource, /const resolvedAssignmentId/);
  assert.match(pageSource, /checkinStatus\?\.className/);
  assert.match(pageSource, /checkinStatus\?\.sessionLabel/);
  assert.match(pageSource, /checkinStatus\?\.startsAt/);
  assert.match(pageSource, /date: resolvedDate/);
  assert.match(pageSource, /assignmentId: resolvedAssignmentId/);
  assert.doesNotMatch(pageSource, /getTeachingSlideByAssignmentId/);
  assert.doesNotMatch(pageSource, /Download this teaching slide/);
  assert.doesNotMatch(pageSource, /Assignment ID:/);
  assert.doesNotMatch(pageSource, /Saved to:/);
  assert.doesNotMatch(pageSource, /Normalized student number/);
  assert.doesNotMatch(pageSource, /Saved under session ID/);
});


test("student check-in explains verified roster matching and supports browser autofill", () => {
  assert.match(pageSource, /verify both details against the class roster/i);
  assert.match(pageSource, /autoComplete="email"/);
  assert.match(pageSource, /autoComplete="tel"/);
  assert.match(pageSource, /Ghana local and \+233 formats are accepted/);
  assert.match(pageSource, /Attendance recorded/);
  assert.match(pageSource, /Not me/);
});

test("check-in API returns student-friendly identity and class confirmation metadata", () => {
  assert.match(apiSource, /maskedPhone:/);
  assert.match(apiSource, /studentName:/);
  assert.match(apiSource, /className:/);
  assert.match(apiSource, /not enrolled in this class/i);
  assert.match(apiSource, /do not match the same student record/i);
});

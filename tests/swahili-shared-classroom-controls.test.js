import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { inferPresenterLevel, presenterSessionMinutes } from "../src/utils/presenterSessionTiming.js";

const read = (file) => readFileSync(new URL(file, import.meta.url), "utf8");
const swahili = read("../src/components/SwahiliTeachingSlides.jsx");
const german = read("../src/components/TeachingSlidePresenter.jsx");
const studentPicker = read("../src/components/PresenterStudentPicker.jsx");
const classTimer = read("../src/components/PresenterSessionTimer.jsx");
const liveSession = read("../src/hooks/usePresenterLiveSession.js");
const activity = read("../src/components/PresenterActivityTimer.jsx");

test("Swahili receives a real named class duration from Falowen timing utility", () => {
  assert.equal(inferPresenterLevel("SWAHILI", "SWAHILI-DAY-1"), "SWAHILI");
  assert.equal(presenterSessionMinutes("SWAHILI"), 60);
  assert.equal(presenterSessionMinutes("A2"), 90);
  assert.equal(presenterSessionMinutes("B1"), 90);
});

test("German and Swahili both use the same activity timer and existing class controls", () => {
  assert.match(german, /import PresenterActivityTimer from/);
  assert.match(german, /<PresenterActivityTimer/);
  assert.match(swahili, /<PresenterActivityTimer/);
  assert.match(swahili, /<PresenterSessionTimer/);
  assert.match(swahili, /<PresenterStudentPicker/);
  assert.match(swahili, /<PresenterActions/);
  assert.match(swahili, /<PresenterStageJump/);
  assert.match(swahili, /<PresenterControls/);
  assert.match(swahili, /workbookConnection:\s*\{ workbookUrl: learnerWorkbook/);
  assert.match(activity, /Activity timer/);
  assert.match(activity, /7, 5, 3, 2, 1, 0\.5/);
});

test("Swahili cannot silently restore German class, roster or prior live session", () => {
  assert.match(studentPicker, /course === "SWAHILI" \? matches/);
  assert.match(studentPicker, /normalize\(slide\?\.course\)\.toUpperCase\(\) === "SWAHILI"/);
  assert.match(classTimer, /slide\?\.course\)\.toUpperCase\(\) === "SWAHILI"/);
  assert.match(liveSession, /isolatedLanguage = normalize\(slide\?\.course\)\.toUpperCase\(\) === "SWAHILI"/);
  assert.match(liveSession, /isolatedLanguage && !normalize\(urlIdentity\.classRecordId\)/);
});

test("class and participation identity stays stable across stages", () => {
  assert.match(swahili, /const presenterSlide = Object\.freeze/);
  assert.match(swahili, /assignmentId: "SWAHILI-DAY-1"/);
  assert.doesNotMatch(swahili, /const presenterSlide = \{ \.\.\.lesson/);
  assert.match(swahili, /onReportOpen|setReportOpen\(true\)/);
});

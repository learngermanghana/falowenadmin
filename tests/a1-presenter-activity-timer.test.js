import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  A1_ACTIVITY_TIMER_PRESETS,
  DEFAULT_A1_ACTIVITY_MINUTES,
  a1ActivityDeadline,
  a1ActivitySecondsLeft,
} from "../src/utils/a1PresenterActivityTimer.js";

const a1Presenter = () => fs.readFileSync(new URL("../src/components/A1GrammarPresenter.jsx", import.meta.url), "utf8");

test("A1 activity timer starts at five minutes and offers the A2/B1 classroom presets", () => {
  assert.deepEqual(A1_ACTIVITY_TIMER_PRESETS, [7, 5, 3, 2, 1]);
  assert.equal(DEFAULT_A1_ACTIVITY_MINUTES, 5);
  assert.equal(Object.isFrozen(A1_ACTIVITY_TIMER_PRESETS), true);
});

test("A1 activity countdown uses wall time, including when the browser delays intervals", () => {
  const start = 100000;
  const deadline = a1ActivityDeadline(5 * 60, start);
  assert.equal(deadline, start + 300000);
  assert.equal(a1ActivitySecondsLeft(deadline, start), 300);
  assert.equal(a1ActivitySecondsLeft(deadline, start + 1000), 299);
  assert.equal(a1ActivitySecondsLeft(deadline, start + 1250), 299);
  assert.equal(a1ActivitySecondsLeft(deadline, start + 299999), 1);
  assert.equal(a1ActivitySecondsLeft(deadline, start + 300000), 0);
  assert.equal(a1ActivitySecondsLeft(deadline, start + 330000), 0);
});

test("A1 activity timer can pause, resume, reset and refuses invalid durations", () => {
  const start = 100000;
  const deadline = a1ActivityDeadline(120, start);
  const pausedSeconds = a1ActivitySecondsLeft(deadline, start + 30500);
  assert.equal(pausedSeconds, 90);
  const resumedDeadline = a1ActivityDeadline(pausedSeconds, start + 200000);
  assert.equal(a1ActivitySecondsLeft(resumedDeadline, start + 200000), 90);
  assert.equal(a1ActivitySecondsLeft(resumedDeadline, start + 290000), 0);
  assert.equal(a1ActivityDeadline(0, start), 0);
  assert.equal(a1ActivityDeadline(-10, start), 0);
  assert.equal(a1ActivityDeadline(Infinity, start), 0);
  assert.equal(a1ActivitySecondsLeft(NaN, start), 0);
});

test("A1 lesson presenter has active activity controls in toolbar and full-screen", () => {
  const source = a1Presenter();
  assert.match(source, /A1_ACTIVITY_TIMER_PRESETS\.map/g);
  assert.match(source, /presenter-timer-presets/);
  assert.match(source, /presenter-focus-stage-timer/);
  assert.match(source, /presenter-has-focus-stage-timer/);
  assert.match(source, /aria-label="A1 activity timer controls"/);
  assert.match(source, /aria-label="A1 activity timer"/);
  assert.match(source, /function setActivityMinutes\(/);
  assert.match(source, /function toggleActivityTimer\(/);
  assert.match(source, /function resetActivityTimer\(/);
  assert.match(source, /setActivityDeadlineMs\(0\)/);
  assert.match(source, /\[stage\?\.id, slide\?\.assignmentId\]/);
  assert.match(source, /window\.setInterval\(update, 250\)/);
  assert.match(source, /a1ActivitySecondsLeft\(activityDeadlineMs\)/);
  assert.match(source, /aria-pressed=\{activityTimerMinutes === minutes\}/);
});

test("A1 activity timer does not replace the 60-minute class timer or student-answer controls", () => {
  const source = a1Presenter();
  assert.match(source, /<PresenterSessionTimer/);
  assert.match(source, /onTimeStateChange=\{setClassTimeState\}/);
  assert.match(source, /<PresenterStudentPicker/);
  assert.match(source, /setParticipationQuestion/);
  assert.match(source, /activityRemainingSeconds/);
  assert.match(source, /classTimeState\.remainingSeconds/);
  assert.match(source, /activitySoundRef\.current\?\.close\?\./);
});

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

test("A1 fullscreen keeps mobile picker, activity countdown and class timer in non-overlapping grid rows", () => {
  const presenter = a1Presenter();
  const css = fs.readFileSync(new URL("../src/components/TeachingSlidePresenter.css", import.meta.url), "utf8");
  assert.match(presenter, /focusMode \? "presenter-has-focus-stage-timer presenter-a1-stacked-controls" : ""/);
  const marker = "/* A1 fullscreen mobile/tablet: stack the picker, activity timer and class clock.";
  const start = css.indexOf(marker);
  assert.ok(start >= 0, "A1 responsive layout must be present");
  const layout = css.slice(start);
  const stackedMaxWidth = Number(layout.match(/@media \(max-width: (\d+)px\)/)?.[1]);
  assert.equal(stackedMaxWidth, 1350, "stacking must cover compact tablets and wide student marking controls");
  for (const width of [375, 700, 900, 912, 1024, 1180, 1250, 1280, 1350]) {
    assert.ok(width <= stackedMaxWidth, `${width}px viewport needs non-overlapping A1 controls`);
  }
  assert.ok(1351 > stackedMaxWidth, "desktop A1 layout resumes above the safe breakpoint");
  assert.match(layout, /grid-template-rows: auto auto auto minmax\(0, 1fr\)/);
  const blocks = [
    [".presenter-participation-dock", 1],
    [".presenter-focus-stage-timer", 2],
    [".presenter-focus-time", 3],
    [".presenter-content", 4],
  ];
  for (const [selector, row] of blocks) {
    const position = layout.indexOf(`> ${selector}`);
    assert.ok(position >= 0, `${selector} must be scoped to the A1 presenter`);
    const declarations = layout.slice(layout.indexOf("{", position) + 1, layout.indexOf("}", position));
    assert.match(declarations, new RegExp(`grid-row: ${row};`), `${selector} belongs in row ${row}`);
    if (row < 4) {
      assert.match(declarations, /position: relative/);
      assert.match(declarations, /inset: auto/);
    }
  }
  assert.match(layout, /pointer-events: auto/);
  assert.match(layout, /max-height: min\(24dvh, 165px\)/);
  assert.match(layout, /overflow-y: auto/);
  assert.match(layout, /\.presenter-stage\.is-focus-mode\.presenter-a1-stacked-controls > \.presenter-content/);
  assert.doesNotMatch(layout, /\.presenter-stage\.is-focus-mode\s*>\s*\.presenter-focus-stage-timer/);
});

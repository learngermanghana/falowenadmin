import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("live class creation defaults A1/A2/B1 to academy class durations", () => {
  const create = read("src/components/CreateClassCard.jsx");
  const timing = read("src/utils/presenterSessionTiming.js");

  assert.match(timing, /A1:\s*60/);
  assert.match(timing, /A2:\s*90/);
  assert.match(timing, /B1:\s*90/);
  assert.match(create, /presenterSessionMinutes\(levelId\) \|\| 120/);
  assert.match(create, /scheduleRules: \[makeRule\("A1"\)\]/);
  assert.match(create, /current\.scheduleRules\.map\(\(rule\) => \(\{ \.\.\.rule, durationMinutes \}\)\)/);
});

test("live class duration inputs can be cleared before typing a replacement", () => {
  const create = read("src/components/CreateClassCard.jsx");
  const editor = read("src/components/ClassEditorCard.jsx");

  for (const source of [create, editor]) {
    assert.match(source, /value=\{rule\.durationMinutes \?\? ""\}/);
    assert.match(source, /event\.target\.value === "" \? "" : Number\(event\.target\.value\)/);
    assert.match(source, /Enter a valid class duration of at least 30 minutes/);
  }

  assert.doesNotMatch(editor, /value=\{Number\(rule\.durationMinutes \|\| 120\)\}/);
});

test("attendance and presenter prefer level duration over a wider attendance window", () => {
  const checkin = read("src/pages/CheckinDisplayPage.jsx");
  const presenter = read("src/components/PresenterSessionTimer.jsx");

  assert.match(checkin, /const configuredLevelDurationSeconds = presenterSessionDurationSeconds\(level\)/);
  assert.match(checkin, /const durationSeconds = configuredLevelDurationSeconds \|\| attendanceDurationSeconds/);
  assert.match(presenter, /const durationSeconds = configuredDurationSeconds \|\| sharedDurationSeconds/);
});

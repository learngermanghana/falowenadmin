import test from "node:test";
import assert from "node:assert/strict";
import { sharedClassClock, formatClassCountdown, formatTeachingDuration, presenterClassMatches } from "../src/utils/presenterSessionTiming.js";
const start = Date.parse("2026-10-07T18:00:00Z");
const state = { classStartedAtMs: start, timerDurationSeconds: 3600, timerEndAt: start + 3600000, classStartSource: "checkin" };

test("attendance and slides derive the same countdown after throttling or reload", () => {
  for (const offset of [0, 1191500, 3600000, 3800000]) {
    const a = sharedClassClock(state, start + offset, { startedAtMs: start - 30000, durationSeconds: 3600 });
    const b = sharedClassClock(state, start + offset, { durationSeconds: 3600 });
    assert.equal(a.startedAtMs, start);
    assert.equal(a.remainingSeconds, b.remainingSeconds);
    assert.equal(formatClassCountdown(a.remainingSeconds), formatClassCountdown(b.remainingSeconds));
  }
  assert.equal(formatClassCountdown(sharedClassClock(state, start + 1191500).remainingSeconds), "40:09");
});

test("a shared end freezes taught time and stops the countdown with time left", () => {
  const clock = sharedClassClock({ ...state, classEndedAtMs: start + 1191000 }, start + 9999000);
  assert.equal(clock.remainingSeconds, 0);
  assert.equal(clock.elapsedSeconds, 1191);
  assert.equal(formatTeachingDuration(clock.elapsedSeconds * 1000), "19 min 51 sec");
});

test("time up does not record a class end or stop counting actual teaching time", () => {
  const clock = sharedClassClock(state, start + 3900000);
  assert.equal(clock.remainingSeconds, 0);
  assert.equal(clock.endedAtMs, 0);
  assert.equal(clock.elapsedSeconds, 3900);
});

test("shorter shared deadlines are honored and preset caps still prevent oversized timers", () => {
  assert.equal(sharedClassClock({ ...state, timerEndAt: start + 1800000 }, start, { durationSeconds: 3600 }).remainingSeconds, 1800);
  assert.equal(sharedClassClock({ ...state, timerEndAt: start + 7200000 }, start, { durationSeconds: 3600 }).remainingSeconds, 3600);
});

test("a canonical class record matches an old class alias without accepting another class", () => {
  assert.equal(presenterClassMatches("record-1", "record-1", { classId: "A1 Berlin Klasse", classRecordId: "record-1" }), true);
  assert.equal(presenterClassMatches("record-1", "record-1", { classId: "Other", classRecordId: "record-2" }), false);
  assert.equal(presenterClassMatches("Berlin", "record-1", { classId: "Berlin", classRecordId: "record-2" }), false);
});

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("class timer accepts newest shared timer even when unrelated presenter state was last updated by this device", () => {
  const source = read("src/components/PresenterSessionTimer.jsx");
  const remoteGuard = source.match(/const remoteStamp = Number\(remote\.timerUpdatedAtMs[^\n]*\);[\s\S]{0,260}?return;/)?.[0] || "";
  assert.match(remoteGuard, /presenterLive\.hasSnapshot/);
  assert.match(remoteGuard, /presenterLive\.isToday/);
  assert.match(remoteGuard, /remoteStamp/);
  assert.doesNotMatch(remoteGuard, /isRemoteState/);
  assert.match(source, /timerUpdatedBy:\s*presenterLive\.deviceId/);
  assert.match(source, /const nowMs = Date\.now\(\)/);
  assert.match(source, /remoteEndAt - nowMs/);
  assert.match(source, /Math\.min\(durationSeconds/);
});


test("presenter subscribes to the attendance-selected session instead of a stale active session", () => {
  const hook = read("src/hooks/usePresenterLiveSession.js");
  assert.match(hook, /const requestedSessionKey = normalize\(classContext\.sessionKey\)/);
  assert.match(hook, /requestedSessionKey\.startsWith\(\`\$\{sessionDate\}__\`\)/);
  assert.match(hook, /const subscriptionSessionKey/);
  assert.match(hook, /subscribePresenterLiveSession\([\s\S]*subscriptionSessionKey,[\s\S]*\);/);
  assert.match(hook, /\[classRecordId, subscriptionSessionKey\]/);
});

test("attendance-owned countdown can never display longer than the configured class duration", () => {
  const source = read("src/components/PresenterSessionTimer.jsx");
  assert.match(source, /lastRemoteTimerStampRef\.current = 0/);
  assert.match(source, /const maximumAllowedEndAt/);
  assert.match(source, /Math\.min\(candidateRemoteEndAt, maximumAllowedEndAt\)/);
  assert.match(source, /Math\.min\(durationSeconds, Math\.ceil\(\(endAt - Date\.now\(\)\) \/ 1000\)\)/);
});

test("attendance reconnect repairs stale duration even if the old shared timer is not running", () => {
  const source = read("src/pages/CheckinDisplayPage.jsx");
  assert.match(source, /shared\.classStartSource === "checkin"[\s\S]*timerDurationMismatch \|\| timerRemainingTooLong/);
  assert.match(source, /sharedIsActive && presenterLiveState\.classStartSource !== "checkin"/);
  assert.match(source, /Attendance-owned sessions are revalidated against the level duration/);
});

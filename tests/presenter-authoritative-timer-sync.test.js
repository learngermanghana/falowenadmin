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
  assert.match(source, /remoteEndAt[\s\S]{0,220}?remoteEndAt - Date\.now\(\)/);
});

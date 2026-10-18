import test from "node:test";
import assert from "node:assert/strict";
import { applySoundscapeToPcm, SCENES } from "../src/utils/hoerenSoundscape.js";
import { computeObjectiveScore } from "../src/utils/objectiveMarking.js";

const current = `TEIL 1
A1-12.1-BAHNHOF-HOEREN-V3
1. Richtig
2. Falsch
3. Falsch
4. Richtig
5. Falsch

TEIL 3
1. Richtig
2. Falsch
3. Richtig
4. Falsch
5. Richtig`;

test("new listening questions are correctly mapped to A1-12.1 without contaminating prior keys", () => {
  const result = computeObjectiveScore("A1-12.1", current);
  assert.equal(result.totalCount, 10);
  assert.equal(result.correctCount, 10);
  const wrong = current.replace("TEIL 3\n1. Richtig\n2. Falsch", "TEIL 3\n1. Richtig\n2. Richtig");
  const marked = computeObjectiveScore("A1-12.1", wrong);
  assert.equal(marked.totalCount, 10);
  assert.equal(marked.correctCount, 9);
});

test("old V2 listening answers remain independently markable", () => {
  const original = current.replace("A1-12.1-BAHNHOF-HOEREN-V3", "A1-12.1-READING-V2")
    .replace("TEIL 3\n1. Richtig\n2. Falsch\n3. Richtig\n4. Falsch\n5. Richtig",
      "TEIL 3\n1. Richtig\n2. Richtig\n3. Richtig\n4. Richtig\n5. Richtig");
  const result = computeObjectiveScore("A1-12.1", original);
  assert.equal(result.totalCount, 10);
  assert.equal(result.correctCount, 10);
});

test("soundscape defaults, mute and preset selection preserve dialogue samples", () => {
  assert.ok(Object.keys(SCENES).includes("station"));
  const silent = new Uint8Array(24000 * 2 * 4);
  assert.deepEqual(applySoundscapeToPcm(silent, { scene: "none" }), silent);
  assert.deepEqual(applySoundscapeToPcm(silent, { scene: "station", volume: 0 }), silent);
  const sounded = applySoundscapeToPcm(silent, { scene: "station", volume: 0.12, bell: true, ambience: true });
  assert.equal(sounded.length, silent.length);
  assert.notDeepEqual(sounded, silent);
  assert.equal(silent.every(byte => byte === 0), true);
});

test("voice remains unchanged when all effects are disabled", () => {
  const source = new Uint8Array(24000 * 2);
  new DataView(source.buffer).setInt16(1600, 12345, true);
  assert.deepEqual(applySoundscapeToPcm(source, { scene: "station", volume: 0.2, ambience: false, bell: false, ending: false }), source);
});

import test from "node:test";
import { buildSwahiliClassroomStages } from "../src/utils/swahiliClassroomStages.js";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { swahiliB1Day27, SWAHILI_B1_DAY27_LISTENING as listening } from "../src/data/swahiliB1Day27.js";
import { swahiliSlidePacks } from "../src/data/swahiliSlidePacks.js";
import { swahiliAudioChapters } from "../src/data/swahiliAudioChapters.js";
test("B1 Day 27 uses five transcript-backed true/false questions and the exact private recording", () => {
  assert.equal(listening.audioKey, "swahili/B1/day-27/kuntunza.mp3");
  assert.equal(listening.transcript.length, 12);
  assert.deepEqual(listening.questions.map(q => q.correctIndex), [0,1,0,1,0]);
  for (const q of listening.questions) assert.ok(listening.transcript.some(([,line]) => line === q.evidence));
  assert.equal(swahiliB1Day27.stages.find(s => s.id === "knowledge").listening, listening);
  assert.ok(swahiliB1Day27.stages.every(s => !s.radioVideoId));
});
test("B1 index preserves Day 28 and uses all curriculum chapter titles", () => {
  assert.deepEqual(swahiliSlidePacks.B1.map(s => s.dayNumber), [26,27,28]);
  assert.equal(swahiliAudioChapters.B1.length, 28);
  const source = readFileSync(new URL("../src/components/SwahiliTeachingSlides.jsx", import.meta.url), "utf8");
  assert.match(source, /swahiliAudioChapters\.B1\.map/);
  assert.match(source, /Not yet built/);
  assert.match(source, /<InteractiveLessonOpening/);
});

test("Day 27 teaches pollution causes, effects and solutions independently of Day 28", () => {
  assert.notEqual(swahiliB1Day27.title.toLowerCase(), swahiliSlidePacks.B1.find(s => s.dayNumber === 28).title.toLowerCase());
  const stages = buildSwahiliClassroomStages(swahiliB1Day27);
  const reading = stages.find(s => s.type === "classroom-reading");
  assert.match(reading.content, /mtaa wa Mtoni/);
  assert.equal(reading.checks.length, 5);
  assert.equal(reading.evidence.length, 5);
  assert.ok(reading.units.every(u => u.english));
  assert.equal(stages.find(s => s.id === "grammar").details.length, 3);
  assert.equal(stages.find(s => s.type === "classroom-roleplay").situations.length, 3);
  assert.match(stages.find(s => s.id === "writing").content, /sababu mbili/);
  assert.equal(stages.find(s => s.id === "knowledge").listening, listening);
});

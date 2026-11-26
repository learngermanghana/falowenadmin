import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SWAHILI_B1_DAY28_LISTENING as listening } from "../src/data/swahiliB1Day28Listening.js";
import { swahiliB1Day28 } from "../src/data/swahiliB1Day28.js";
import { standardizeSwahiliStages, swahiliStageSection } from "../src/utils/swahiliPresenterSequence.js";
test("B1 Day 28 uses the exact teacher-supplied audio and five transcript-backed questions", () => {
  assert.equal(listening.audioKey, "swahili/B1/day-28/swahili-listening kuntasa.mp3");
  assert.equal(listening.transcript.length, 16);
  assert.deepEqual(listening.questions.map(q => q.correctIndex), [1,0,1,0,1]);
  for (const q of listening.questions) assert.ok(listening.transcript.some(([,line]) => line === q.evidence));
  const stages = swahiliB1Day28.classroomStages;
  assert.equal(stages.find(s => s.id === "knowledge").listening, listening);
  assert.ok(stages.every(s => !s.radioVideoId && !s.id.startsWith("radio-")));
  assert.deepEqual([...new Set(standardizeSwahiliStages(stages).map(swahiliStageSection))].slice(0,4), ["intro","music","listening","reading"]);
  const source = readFileSync(new URL("../src/components/InteractiveLessonOpening.jsx", import.meta.url), "utf8");
  assert.ok(source.includes(listening.audioKey));
  assert.match(source, /SWAHILI-B1/);
});

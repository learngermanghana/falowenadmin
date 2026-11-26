import test from "node:test";
import assert from "node:assert/strict";
import { SWAHILI_B1_DAY26_LISTENING as listening, swahiliB1Day26 } from "../src/data/swahiliB1Day26.js";
import { standardizeSwahiliStages, swahiliStageSection } from "../src/utils/swahiliPresenterSequence.js";
test("Day 26 exact classroom audio and five evidence-backed questions",()=>{
 assert.equal(listening.audioKey,"swahili/B1/day-26/swahili-listening matitizo.mp3");
 assert.equal(listening.transcript.length,10);
 assert.deepEqual(listening.questions.map(q=>q.correctIndex),[0,1,0,1,0]);
 for(const q of listening.questions) assert.ok(listening.transcript.some(([,line])=>line===q.evidence));
 assert.equal(swahiliB1Day26.stages.find(s=>s.id==="knowledge").listening,listening);
 assert.deepEqual([...new Set(standardizeSwahiliStages(swahiliB1Day26.stages).map(swahiliStageSection))].slice(0,4),["intro","music","listening","reading"]);
});
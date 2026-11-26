import test from "node:test";
import assert from "node:assert/strict";
import { swahiliSlidePacks } from "../src/data/swahiliSlidePacks.js";
import { buildSwahiliClassroomStages } from "../src/utils/swahiliClassroomStages.js";
import { readingParagraphChunks, presentationPresets } from "../src/utils/swahiliGuidedClassroom.js";
import { buildFairReadingAssignments } from "../src/utils/presenterReadingShare.js";
test("all published packs have aligned translations, five evidence references, three scenarios and a presentation",()=>{
 for(const [level,lessons] of Object.entries(swahiliSlidePacks))for(const lesson of lessons){
  const stages=buildSwahiliClassroomStages(lesson);
  const reading=stages.find(s=>s.type==="classroom-reading");
  assert.ok(reading.units.length,lesson.id);
  assert.ok(reading.units.every((u,i)=>u.number===i+1&&u.english),lesson.id+" translations");
  assert.equal(reading.evidence.length,5,lesson.id);
  for(const entry of reading.evidence)for(const i of [entry].flat())assert.ok(reading.units[i],lesson.id+" evidence");
  const chunks=readingParagraphChunks(reading.units);
  assert.deepEqual(chunks.flatMap(c=>c.numbers),reading.units.map(u=>u.number));
  const assignments=buildFairReadingAssignments({chunks,roster:[{key:"a",name:"A"},{key:"b",name:"B"}],level});
  assert.equal(assignments.length,chunks.length);
  const role=stages.find(s=>s.type==="classroom-roleplay");
  assert.equal(role.situations.length,3,lesson.id);
  assert.equal(new Set(role.situations.map(s=>s.title)).size,3);
  for(const s of role.situations){assert.ok(s.roleA&&s.roleB);assert.equal(s.steps.length,3);assert.ok(s.steps.every(q=>q.question&&q.answer));}
  const presentation=stages.find(s=>s.type==="classroom-presentation");
  assert.ok(presentation.starters.length>=3&&presentation.keywords.length,lesson.id);
  assert.equal(presentation.level,level);
  assert.deepEqual(presentationPresets(level),level==="B1"?[1.5,2]:[0.5,1]);
 }
 assert.deepEqual(presentationPresets("A2"),[1,1.5]);
});

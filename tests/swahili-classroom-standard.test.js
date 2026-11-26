import test from "node:test";
import assert from "node:assert/strict";
import { swahiliSlidePacks } from "../src/data/swahiliSlidePacks.js";
import { buildSwahiliClassroomStages, isSwahiliRadioStage, splitSwahiliReading } from "../src/utils/swahiliClassroomStages.js";
test("every published Swahili lesson has a standardized reading, listening, role-play and presentation",()=>{
 for(const [level,lessons] of Object.entries(swahiliSlidePacks)){
  for(const lesson of lessons){
   const stages=buildSwahiliClassroomStages(lesson);
   const reading=stages.find(s=>s.type==="classroom-reading");
   const role=stages.find(s=>s.type==="classroom-roleplay");
   const presentation=stages.find(s=>s.id==="presentation");
   assert.ok(reading&&role&&presentation,lesson.id);
   assert.equal(reading.checks.length,5,lesson.id);
   assert.ok(reading.checks.every(([q,a])=>q&&a),lesson.id);
   assert.ok(role.roleA&&role.roleB,lesson.id);
   const tokens=splitSwahiliReading(reading.content,reading.glossary);
   assert.equal(tokens.map(t=>t.text).join(""),reading.content);
   assert.ok(tokens.some(t=>t.meaning),lesson.id);
   assert.ok(stages.indexOf(reading)<stages.indexOf(role));
   assert.ok(stages.indexOf(role)<stages.indexOf(presentation));
   assert.ok(stages.some(s=>s.id==="listening"||s.id==="teacher-listening"||s.type==="classroom-listening"),lesson.id);
   if(level==="A1")assert.ok(stages.every(s=>!isSwahiliRadioStage(s)),lesson.id);
   if(level==="B1")assert.equal(stages.find(s=>s.type==="classroom-listening").listening.questions.length,5,lesson.id);
  }
 }
});
test("glossary matches complete words case-insensitively and preserves source punctuation",()=>{
 const tokens=splitSwahiliReading("Mama, mama. mamake.",[["mama","mother"]]);
 assert.deepEqual(tokens.filter(t=>t.word).map(t=>t.text),["Mama","mama"]);
 assert.equal(tokens.map(t=>t.text).join(""),"Mama, mama. mamake.");
});

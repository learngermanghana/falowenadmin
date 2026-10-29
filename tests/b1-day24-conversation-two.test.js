import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {getSlidesByCourse} from "../src/data/teachingSlides.js";
import {buildTeachingPresenterStages} from "../src/utils/teachingPresenter.js";

test("B1 Day 24 slide three is the protected second Hören conversation",()=>{
  const slide=getSlidesByCourse("B1").find(x=>x.assignmentId==="B1-8.24");
  const stages=buildTeachingPresenterStages(slide,slide.topic);
  assert.equal(stages[2].id,"knowledge");
  assert.equal(stages[2].type,"b1-day24-listening");
  assert.equal(stages[2].audioKey,"b1/day-24/day-25.mp3");
  assert.equal(stages.filter(x=>x.type==="b1-day24-listening").length,1);
  assert.ok(stages.some(x=>x.id==="reading"),"original reading remains separate");
  const component=fs.readFileSync("src/components/B1Day24ListeningStage.jsx","utf8");
  assert.match(component,/www\.falowen\.app\/api\/course-media\/b1\/audio-url/);
  assert.match(component,/Authorization:"Bearer "/);
});
test("B1 Day 24 approved conversation key is scored as Teil 4",()=>{
  const dictionary=JSON.parse(fs.readFileSync("src/data/answers_dictionary.json","utf8"));
  const row=Object.values(dictionary).find(x=>x.assignment_id==="B1-8.24");
  assert.deepEqual(row.expectedParts,["teil2","teil3","teil4"]);
  assert.equal(row.excludedParts,undefined);
  assert.deepEqual(row.referenceAnswerParts,["teil3","teil4"]);
  assert.deepEqual(Object.values(row.answers.teil4),["B) Falsch","A) Richtig","A) Richtig","B) Falsch","A) Richtig"]);
  assert.equal(row.partGrading.teil4.gradingMode,"answer_key");
  assert.match(row.partGrading.teil4.instruction,/b1\/day-24\/day-25\.mp3/);
});

import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {A1_DAY20_ASSIGNMENT,A1_DAY20_WORKBOOK,A1_DAY20_MODELS,A1_DAY20_TRANSFORM,A1_DAY20_CONNECTORS,A1_DAY20_ERRORS,A1_DAY20_CHECKS,A1_DAY20_MOCKS,A1_DAY20_CHECKLIST,buildA1Day20ClassroomStages} from "../src/data/a1Day20Classroom.js";
import {A1_PUBLISHED_WORKBOOK_BY_ASSIGNMENT} from "../src/data/a1PublishedWorkbookRoutes.js";
import {getTeachingSlideByAssignmentId} from "../src/data/teachingSlides.js";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("Day 20 has twelve unique stages, sixty minutes and canonical workbook",()=>{
 const s=buildA1Day20ClassroomStages({song:{}});
 assert.equal(A1_DAY20_ASSIGNMENT,"A1-12.3");
 assert.equal(A1_DAY20_WORKBOOK,A1_PUBLISHED_WORKBOOK_BY_ASSIGNMENT[A1_DAY20_ASSIGNMENT]);
 assert.equal(s.length,12);assert.equal(new Set(s.map(x=>x.id)).size,12);
 assert.equal(s.reduce((sum,x)=>sum+x.suggestedMinutes,0),60);
 assert.deepEqual(s.slice(0,9).map(x=>x.step),["register","structure","phrases","understand","transform","informal","formal","connectors","errors"]);
 assert.equal(s[9].id,"grammar-check");assert.equal(s[9].type,"check");assert.equal(s[9].items.length,10);
 assert.equal(s[10].step,"mock");assert.equal(s[10].suggestedMinutes,10);
 assert.equal(s[11].workbookUrl,A1_DAY20_WORKBOOK);assert.equal(s[11].hasMusic,true);
 assert.equal(buildA1Day20ClassroomStages()[11].hasMusic,false);
 const slide=getTeachingSlideByAssignmentId(A1_DAY20_ASSIGNMENT);
 assert.equal(slide.dayNumber,20);assert.equal(slide.workbookConnection.workbookUrl,A1_DAY20_WORKBOOK);
 assert.match(slide.workbookConnection.parts[0].detailEn,/Julia/);
 assert.match(slide.workbookConnection.parts[1].detailEn,/course times and costs/);
});
test("practice letters map all three content points and avoid copying workbook solutions",()=>{
 for(const task of [...Object.values(A1_DAY20_MODELS),...Object.values(A1_DAY20_MOCKS)]){
  assert.equal(task.points.length,3);assert.equal(task.body.length,3);assert.ok(task.greeting&&task.closing&&task.name);
  assert.doesNotMatch(task.situation,/Julia|Sprachakademie München/);
 }
 assert.match(A1_DAY20_MODELS.informal.body[1],/Freitag.*19 Uhr.*bei mir/);
 assert.match(A1_DAY20_MODELS.formal.body[1],/Wann findet.*wie viel kostet/);
 assert.match(A1_DAY20_MODELS.formal.body[2],/beginnen/);
 assert.equal(A1_DAY20_TRANSFORM.length,8);assert.equal(A1_DAY20_ERRORS.length,5);
 assert.deepEqual(A1_DAY20_CONNECTORS.map(x=>x[0]),["und","aber","denn","weil"]);
 assert.equal(new Set(A1_DAY20_CHECKS.map(x=>x.questionDe)).size,10);
 assert.equal(A1_DAY20_CHECKLIST.length,6);
});
test("presenter integrates native picker and timed writing with hidden answers",()=>{
 const p=read("src/components/A1GrammarPresenter.jsx"),c=read("src/components/A1Day20ClassroomStage.jsx");
 assert.match(p,/=== A1_DAY20_ASSIGNMENT/);assert.match(p,/return buildA1Day20ClassroomStages/);
 assert.match(p,/stage.type === "a1-day20"/);assert.match(p,/stage\?\.id === "grammar-check"/);
 assert.match(c,/Date.now\(\)\+600000/);assert.match(c,/if\(left===0\)setPhase\("done"\)/);
 const writing=c.slice(c.indexOf('phase==="writing"?'),c.indexOf('Schreibzeit beendet.'));
 assert.doesNotMatch(writing,/<Reveal|<Letter/);
 assert.match(c,/type="checkbox"/);assert.match(c,/nextLyricOnly/);assert.doesNotMatch(c,/https?:\/\//);
});

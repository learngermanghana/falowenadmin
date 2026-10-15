import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {resolve,dirname} from "node:path";
import {mockScoreText,mockVerifiedScores,mockCompleteSkillCount,filterMockAttempts,MOCK_SECTIONS,MOCK_SECTION_LABELS} from "../src/utils/mockAttemptMonitoring.js";

test("completed A1 A2 and B1 mocks display four verified skills out of 25 and total out of 100",()=>{
  for(const level of ["A1","A2","B1"]){
    const results=mockVerifiedScores({
      status:"completed",level,sectionScores:{lesen:0,hoeren:18.5,schreiben:21,sprechen:25},overallScore:64.5
    });
    assert.deepEqual(results.sections,{lesen:0,hoeren:18.5,schreiben:21,sprechen:25});
    assert.equal(mockScoreText(results.sections.lesen),"0/25");
    assert.equal(mockScoreText(results.sections.hoeren),"18.5/25");
    assert.equal(mockScoreText(results.total,100),"64.5/100");
  }
});

test("absent verified section data are not displayed as zero or a fabricated score",()=>{
  const missing=mockVerifiedScores({status:"completed",sectionScores:{lesen:0},overallScore:0});
  assert.equal(mockScoreText(missing.sections.lesen),"0/25");
  assert.equal(mockScoreText(missing.sections.hoeren),"Not recorded");
  assert.equal(mockScoreText(missing.total,100),"0/100");
  assert.equal(mockScoreText(null),"Not recorded");
  assert.equal(mockScoreText(""),"Not recorded");
  assert.equal(mockScoreText(-2),"Not recorded");
  assert.equal(mockScoreText(26),"Not recorded");
  assert.equal(mockScoreText("70",100),"70/100");
  assert.equal(mockScoreText(false),"Not recorded");
  assert.equal(mockVerifiedScores({status:"in_progress",sectionScores:{lesen:25}}),null);
  assert.equal(mockVerifiedScores({status:"completed",progressSource:"browser_reported",overallScore:100}),null);
});

test("timed attempt monitor renders all section labels and a distinct total for saved completed mocks",()=>{
  const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
  const page=readFileSync(resolve(root,"src/pages/TimedAssignmentAttemptsPage.jsx"),"utf8");
  const css=readFileSync(resolve(root,"src/pages/TimedAssignmentAttemptsPage.css"),"utf8");
  assert.deepEqual(MOCK_SECTIONS,["lesen","hoeren","schreiben","sprechen"]);
  assert.equal(MOCK_SECTION_LABELS.hoeren,"Hören");
  assert.match(page,/mockVerifiedScores\(attempt\)/);
  assert.match(page,/MOCK_SECTIONS\.map\(section/);
  assert.match(page,/MOCK_SECTION_LABELS\[section\]/);
  assert.match(page,/mockScoreText\(verifiedScores\.total, 100\)/);
  assert.match(css,/monitor-mock-scores__grid/);
  assert.match(css,/grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
});

test("staff can filter completed mock skill results by A1 A2 or B1 without losing the student filter",()=>{
 const attempts=[
   {id:"a",studentName:"Ama",level:"A1",mockId:"a1-mock-01",status:"completed"},
   {id:"b",studentName:"Ama",level:"A2",mockId:"a2-mock-01",status:"completed"},
   {id:"c",studentName:"Kojo",level:"B1",mockId:"b1-mock-01",status:"in_progress"},
 ];
 assert.deepEqual(filterMockAttempts(attempts,"Ama","completed","A1").map(x=>x.id),["a"]);
 assert.deepEqual(filterMockAttempts(attempts,"","completed","A2").map(x=>x.id),["b"]);
 assert.deepEqual(filterMockAttempts(attempts,"Kojo","all","B1").map(x=>x.id),["c"]);
 assert.equal(mockCompleteSkillCount({status:"completed",sectionScores:{lesen:0,hoeren:15,schreiben:19,sprechen:25},overallScore:59}),4);
 assert.equal(mockCompleteSkillCount({status:"completed",sectionScores:{lesen:0,hoeren:null},overallScore:0}),1);
 assert.equal(mockCompleteSkillCount({status:"in_progress",sectionScores:{lesen:25}}),0);
});
test("admin page explains verified archived scores and filters by Goethe level",()=>{
 const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
 const page=readFileSync(resolve(root,"src/pages/TimedAssignmentAttemptsPage.jsx"),"utf8");
 assert.match(page,/Filter Exam Room mock level/);
 assert.match(page,/\["all","A1","A2","B1"\]/);
 assert.match(page,/mockCompleteSkillCount\(attempt\)/);
 assert.match(page,/published_final_result/);
 assert.match(page,/Skill-by-skill mock result/);
});

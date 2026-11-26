import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {A1_DAY19_ASSIGNMENT,A1_DAY19_WORKBOOK,A1_DAY19_INTRO_FIELDS,A1_DAY19_SPELLING,A1_DAY19_NUMBERS,A1_DAY19_TOPIC_CARDS,A1_DAY19_OBJECT_CARDS,A1_DAY19_SIGN_CARDS,A1_DAY19_REACTIONS,A1_DAY19_LIVE_CHECKS,A1_DAY19_MOCK_SETS,buildA1Day19ClassroomStages} from "../src/data/a1Day19Classroom.js";
import {A1_PUBLISHED_WORKBOOK_BY_ASSIGNMENT} from "../src/data/a1PublishedWorkbookRoutes.js";
import {getTeachingSlideByAssignmentId} from "../src/data/teachingSlides.js";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("Day 19 contains 12 unique 60-minute exam-readiness stages and retains the required workbook",()=>{
 const s=buildA1Day19ClassroomStages({song:{}});
 assert.equal(A1_DAY19_ASSIGNMENT,"A1-5.9");
 assert.equal(A1_DAY19_WORKBOOK,A1_PUBLISHED_WORKBOOK_BY_ASSIGNMENT[A1_DAY19_ASSIGNMENT]);
 assert.equal(s.length,12);assert.equal(new Set(s.map(x=>x.id)).size,12);
 assert.equal(s.reduce((n,x)=>n+x.suggestedMinutes,0),60);
 assert.ok(s.every(x=>x.examReadiness));
 assert.deepEqual(s.slice(0,9).map(x=>x.step),["map","intro","spelling","numbers","questions","topic-cards","objects","signs","reactions"]);
 assert.equal(s[9].id,"grammar-check");assert.equal(s[9].type,"check");
 assert.equal(s[9].items.length,14);assert.ok(s[9].items.every(x=>x.responseMode==="performance"));
 assert.equal(s[10].step,"mock");assert.equal(s[11].workbookUrl,A1_DAY19_WORKBOOK);assert.equal(s[11].hasMusic,true);
 assert.equal(buildA1Day19ClassroomStages()[11].hasMusic,false);
 const slide=getTeachingSlideByAssignmentId(A1_DAY19_ASSIGNMENT);
 assert.equal(slide.dayNumber,19);assert.ok(slide.workbookConnection.workbookUrl.endsWith(A1_DAY19_WORKBOOK));
});
test("all three exam parts have concrete practice and fresh mock cards",()=>{
 assert.equal(A1_DAY19_INTRO_FIELDS.length,7);assert.equal(A1_DAY19_SPELLING.length,5);assert.equal(A1_DAY19_NUMBERS.length,6);
 assert.equal(A1_DAY19_TOPIC_CARDS.length,12);assert.equal(A1_DAY19_OBJECT_CARDS.length,8);assert.equal(A1_DAY19_SIGN_CARDS.length,5);assert.equal(A1_DAY19_REACTIONS.length,4);
 assert.ok(A1_DAY19_TOPIC_CARDS.every(c=>c.theme&&c.word&&c.question.endsWith("?")&&c.answer));
 assert.ok(A1_DAY19_SIGN_CARDS.every(c=>c.forbidden&&/nicht|kein/.test(c.request)));
 const trainingWords=new Set(A1_DAY19_TOPIC_CARDS.map(c=>c.word)),trainingIds=new Set([...A1_DAY19_OBJECT_CARDS,...A1_DAY19_SIGN_CARDS].map(c=>c.id));
 assert.equal(A1_DAY19_MOCK_SETS.length,4);
 const words=new Set(),ids=new Set();
 for(const set of A1_DAY19_MOCK_SETS){
  assert.equal(set.topics.length,2);assert.equal(set.pictures.length,2);
  assert.ok(set.spelling.every(Boolean)&&set.number.every(Boolean));
  for(const c of set.topics){assert.ok(!trainingWords.has(c.word)&&!words.has(c.word));words.add(c.word)}
  for(const c of set.pictures){assert.ok(!trainingIds.has(c.id)&&!ids.has(c.id));ids.add(c.id)}
 }
 assert.equal(new Set(A1_DAY19_LIVE_CHECKS.map(c=>c.questionDe)).size,14);
});
test("native picker and no-hint mock use separate practice and review phases",()=>{
 const p=read("src/components/A1GrammarPresenter.jsx"),c=read("src/components/A1Day19ClassroomStage.jsx");
 assert.match(p,/return buildA1Day19ClassroomStages/);assert.match(p,/stage.type === "a1-day19"/);
 assert.match(p,/stage\?\.id === "grammar-check"/);assert.match(p,/renderQuestionExternally=\{participationCheckMode\}/);
 assert.match(c,/seconds=\{45\}/);assert.match(c,/seconds=\{300\}[^>]*autoStart/);
 assert.match(c,/phase==="running"/);assert.match(c,/Übungsrunde beendet/);
 const running=c.slice(c.indexOf('phase==="running"'),c.indexOf('Übungsrunde beendet'));
 assert.doesNotMatch(running,/<Reveal|task\.answer/);
 assert.match(c,/nextLyricOnly/);assert.doesNotMatch(c,/https?:\/\//);
});

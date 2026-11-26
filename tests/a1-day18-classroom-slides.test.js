import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import { A1_DAY18_ASSIGNMENT, A1_DAY18_WORKBOOK, A1_DAY18_PREPOSITIONS, A1_DAY18_ARTICLES, A1_DAY18_VERBS, A1_DAY18_TRANSFORM, A1_DAY18_ARTICLE_QUIZ, A1_DAY18_ROOM, A1_DAY18_ERRORS, A1_DAY18_STUDENT_CHECKS, A1_DAY18_EXIT, buildA1Day18ClassroomStages } from "../src/data/a1Day18Classroom.js";
import { A1_PUBLISHED_WORKBOOK_BY_ASSIGNMENT } from "../src/data/a1PublishedWorkbookRoutes.js";
import {getTeachingSlideByAssignmentId} from "../src/data/teachingSlides.js";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
test("A1-12.1 has 12 unique pages, sixty minutes and the existing workbook",()=>{
 const s=buildA1Day18ClassroomStages({song:{}});
 assert.equal(A1_DAY18_ASSIGNMENT,"A1-12.1");
 assert.equal(A1_DAY18_WORKBOOK,A1_PUBLISHED_WORKBOOK_BY_ASSIGNMENT[A1_DAY18_ASSIGNMENT]);
 assert.equal(s.length,12);
 assert.equal(new Set(s.map(x=>x.id)).size,12);
 assert.equal(s.reduce((sum,x)=>sum+x.suggestedMinutes,0),60);
 assert.deepEqual(s.slice(0,10).map(x=>x.step),["intro","prepositions","rule","articles","verbs","transform","compare","quiz","room","errors"]);
 assert.equal(s[10].id,"grammar-check");assert.equal(s[10].type,"check");assert.equal(s[10].items.length,10);
 assert.equal(s[11].exitCheck,true);assert.equal(s[11].items.length,6);
 assert.equal(s[11].workbookUrl,A1_DAY18_WORKBOOK);assert.equal(s[11].hasMusic,true);
 assert.equal(buildA1Day18ClassroomStages()[11].hasMusic,false);
 const slide=getTeachingSlideByAssignmentId(A1_DAY18_ASSIGNMENT);
 assert.equal(slide.dayNumber,18);assert.equal(slide.workbookConnection.workbookUrl,A1_DAY18_WORKBOOK);
 assert.match(slide.title,/Wechselpräpositionen/);
});
test("the nine prepositions and four article groups contain correct paired cases",()=>{
 assert.deepEqual(new Set(A1_DAY18_PREPOSITIONS.map(x=>x[0])),new Set(["an","auf","hinter","in","neben","über","unter","vor","zwischen"]));
 assert.deepEqual(A1_DAY18_ARTICLES.map(x=>x.slice(1,3)),[["dem","den"],["der","die"],["dem","das"],["den (+n)","die"]]);
 assert.equal(A1_DAY18_VERBS.length,4);
 assert.equal(A1_DAY18_TRANSFORM.length,6);
 assert.match(A1_DAY18_TRANSFORM[0][1],/lege das Handy auf das Bett/);
 assert.equal(A1_DAY18_ARTICLE_QUIZ.length,8);
 for(const [question,options,answer,note] of A1_DAY18_ARTICLE_QUIZ){assert.ok(question&&note);assert.equal(options.filter(x=>x===answer).length,1);}
 assert.equal(A1_DAY18_ROOM.length,7);assert.equal(A1_DAY18_ERRORS.length,5);
 assert.equal(new Set(A1_DAY18_STUDENT_CHECKS.map(x=>x.questionDe)).size,10);
 assert.deepEqual(A1_DAY18_EXIT.map(x=>x.answerDe),["den","dem","die","der","die","der"]);
});
test("presenter uses local visual diagrams, reverses sentences and preserves the native picker",()=>{
 const p=read("src/components/A1GrammarPresenter.jsx"),c=read("src/components/A1Day18ClassroomStage.jsx");
 assert.match(p,/=== A1_DAY18_ASSIGNMENT/);assert.match(p,/return buildA1Day18ClassroomStages/);
 assert.match(p,/stage.type === "a1-day18"/);assert.match(p,/stage\?\.id === "grammar-check"/);
 assert.match(c,/Wohin\? → Wo\?/);assert.match(c,/Ich laufe/);assert.match(c,/im Park/);
 assert.match(c,/nextLyricOnly/);assert.match(c,/<svg/);assert.match(c,/Lösungen anzeigen/);
 assert.doesNotMatch(c,/https?:\/\//);
});

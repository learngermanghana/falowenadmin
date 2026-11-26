import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { A1_DAY17_ASSIGNMENT, A1_DAY17_WORKBOOK, A1_DAY17_SIGNS, A1_DAY17_READING,
  A1_DAY17_SPEAKING, A1_DAY17_LISTENING, A1_DAY17_EXIT, A1_DAY17_DIALOGUE,
  A1_DAY17_IMPERATIVES, buildA1Day17ClassroomStages } from "../src/data/a1Day17Classroom.js";
import { A1_PUBLISHED_WORKBOOK_BY_ASSIGNMENT } from "../src/data/a1PublishedWorkbookRoutes.js";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
test("A1-11 uses exactly 12 unique classroom stages and the canonical workbook",()=>{
  const stages=buildA1Day17ClassroomStages({song:{type:"published-music"}});
  assert.equal(A1_DAY17_ASSIGNMENT,"A1-11");
  assert.equal(A1_DAY17_WORKBOOK,A1_PUBLISHED_WORKBOOK_BY_ASSIGNMENT["A1-11"]);
  assert.equal(stages.length,12);
  assert.equal(new Set(stages.map(s=>s.id)).size,12);
  assert.equal(stages.reduce((n,s)=>n+s.suggestedMinutes,0),60);
  assert.deepEqual(stages.slice(0,11).map(s=>s.step),["intro","directions","imperative","practice","ask","map","signs","permission","reading","speaking","listening"]);
  assert.equal(stages[10].hasMusic,true);
  assert.equal(buildA1Day17ClassroomStages()[10].hasMusic,false);
  assert.equal(stages[11].type,"check");
  assert.equal(stages[11].exitCheck,true);
  assert.equal(stages[11].items.length,6);
  assert.equal(stages[11].workbookUrl,A1_DAY17_WORKBOOK);
});
test("sign and listening questions have meaningful unique answers",()=>{
  const signs=new Map(A1_DAY17_SIGNS.map(s=>[s.id,s]));
  assert.equal(A1_DAY17_READING.length,5);
  for(const [id,statement,answer,note] of A1_DAY17_READING){
    assert.ok(signs.has(id)&&statement&&note);
    assert.equal(answer,!signs.get(id).forbidden);
  }
  assert.equal(A1_DAY17_SPEAKING.length,5);
  for(const card of A1_DAY17_SPEAKING){
    assert.ok(card.sign?signs.has(card.sign):card.icon);
    assert.match(card.answer,/Sie/);
    assert.ok(card.reaction);
  }
  assert.equal(A1_DAY17_LISTENING.length,5);
  for(const [q,options,answer] of A1_DAY17_LISTENING){
    assert.ok(q);
    assert.equal(options.filter(o=>o===answer).length,1);
  }
  assert.match(A1_DAY17_DIALOGUE.flat().join(" "),/Fotografieren ist dort verboten/);
  assert.match(A1_DAY17_DIALOGUE.flat().join(" "),/nur im Café/);
  assert.equal(A1_DAY17_EXIT.length,6);
  assert.ok(A1_DAY17_IMPERATIVES.every(([,answer])=>/^[^ ]+ Sie /.test(answer)));
  assert.match(JSON.stringify(A1_DAY17_IMPERATIVES),/Biegen Sie rechts ab/);
});
test("dedicated presenter routes A1-11 only and retains music and hidden responses",()=>{
  const presenter=read("src/components/A1GrammarPresenter.jsx");
  const component=read("src/components/A1Day17ClassroomStage.jsx");
  assert.match(presenter,/=== A1_DAY17_ASSIGNMENT/);
  assert.match(presenter,/return buildA1Day17ClassroomStages/);
  assert.match(presenter,/stage.type === "a1-day17"/);
  assert.match(component,/nextLyricOnly/);
  assert.match(component,/Transkript · Lehrkraft \/ nach dem Hören/);
  assert.match(component,/className="a1n a1d17"/);
  assert.match(component,/<details className="a1d17-reveal">/);
  assert.doesNotMatch(component,/du-Imperativ|ihr-Imperativ|Imperativ · du/);
});

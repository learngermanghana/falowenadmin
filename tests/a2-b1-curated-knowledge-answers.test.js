import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { getA2PresenterKnowledge } from "../src/data/a2PresenterKnowledge.js";
import { getB1PresenterKnowledge } from "../src/data/b1PresenterKnowledge.js";
import { A2_B1_KNOWLEDGE_ANSWERS, getA2B1KnowledgeAnswers } from "../src/data/a2B1KnowledgeAnswers.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";

test("All 56 A2 and B1 Wissensimpuls slides reveal three verified answers, never generic text guesses", () => {
 const slides=[...getSlidesByCourse("A2"),...getSlidesByCourse("B1")];
 assert.equal(slides.length,56);
 assert.equal(Object.keys(A2_B1_KNOWLEDGE_ANSWERS).length,56);
 const forbidden=/Im Wissensimpuls steht keine Referenzantwort|Offene Antwort\. Prüfe|Keine geprüfte Musterantwort verfügbar/;
 for(const slide of slides){
  const knowledge=slide.course==="A2"?getA2PresenterKnowledge(slide.assignmentId):getB1PresenterKnowledge(slide.assignmentId);
  assert.ok(knowledge,slide.assignmentId);
  const answers=getA2B1KnowledgeAnswers(slide.assignmentId);
  assert.ok(Array.isArray(answers),slide.assignmentId);
  assert.equal(knowledge.checks.length,3,slide.assignmentId);
  assert.equal(answers.length,knowledge.checks.length,slide.assignmentId);
  assert.equal(new Set(answers).size,3,slide.assignmentId);
  for(const answer of answers){
   assert.ok(answer.length>=30,slide.assignmentId+": answer must address a specific reading point");
   assert.doesNotMatch(answer,forbidden,slide.assignmentId);
  }
  const stages=buildTeachingPresenterStages(slide,slide.topic);
  assert.equal(stages.length,9,slide.assignmentId);
  const stage=stages.find(s=>s.id==="knowledge");
  assert.ok(stage,slide.assignmentId);
  assert.deepEqual(stage.items,knowledge.checks,slide.assignmentId+": do not replace learner questions");
  assert.deepEqual(stage.answerItems,answers,slide.assignmentId+": reveal only question-matched answers");
  assert.deepEqual(stages.slice(-3).map(s=>s.id),["questions","workbook","lesson-summary"],slide.assignmentId);
  assert.ok(stages.find(s=>s.id==="grammar-check"),slide.assignmentId);
  assert.ok(stages.find(s=>s.id==="phrases"),slide.assignmentId);
 }
});

test("Text-answer regressions cover specific grammar and content questions",()=>{
 const answer=(id,n)=>getA2B1KnowledgeAnswers(id)[n];
 assert.match(answer("A2-3.6",0),/Dativ|Wo\?/);
 assert.match(answer("A2-3.6",1),/Akkusativ|Wohin\?/);
 assert.match(answer("A2-4.10",1),/war.*hatte/);
 assert.match(answer("B1-3.8",0),/Empfehlung.*Notwendigkeit.*Möglichkeit.*Erlaubnis/);
 assert.match(answer("B1-4.12",1),/bevor.*nachdem.*während.*als/);
 assert.match(answer("B1-8.24",2),/Herstellung.*Nutzung.*Entsorgung/);
});

test("Model answers remain behind the existing teacher reveal UI",()=>{
 const jsx=fs.readFileSync(new URL("../src/components/TeachingSlidePresenter.jsx",import.meta.url),"utf8");
 assert.match(jsx,/stage\.answerItems/);
 assert.match(jsx,/knowledgeAnswersOpen/);
});

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";
import { B1_WARMUP_FOLLOWUPS, getB1WarmupFollowUp } from "../src/data/b1WarmupFollowUps.js";
import { B1_VOCABULARY_QUESTIONS, getB1VocabularyQuestion } from "../src/data/b1VocabularyQuestions.js";

test("Every B1 warm-up has a distinct, contextual follow-up paired with its exact source question", () => {
 const slides = getSlidesByCourse("B1");
 assert.equal(slides.length,28);
 assert.equal(Object.keys(B1_WARMUP_FOLLOWUPS).length,28);
 for(const slide of slides) {
  const stages=buildTeachingPresenterStages(slide,slide.topic);
  assert.equal(stages.length, stages.some(s=>s.id==="knowledge") ? 11 : 10, slide.assignmentId);
  const warmup=stages.find(x=>x.id==="warmup");
  const paired=B1_WARMUP_FOLLOWUPS[slide.assignmentId];
  assert.deepEqual(paired.map(x=>x.questionDe),warmup.items,slide.assignmentId);
  const followups=[];
  warmup.items.forEach((question,index)=>{
   const followup=getB1WarmupFollowUp(slide.assignmentId,question);
   assert.equal(followup,warmup.questionSupport[index].followUpDe,slide.assignmentId);
   assert.ok(followup.endsWith("?")&&followup.split(/\s+/).length>=6,slide.assignmentId);
   assert.notEqual(followup,question,slide.assignmentId);
   assert.doesNotMatch(followup,/Was kannst du dazu aus deiner eigenen Erfahrung erzählen|Was ist der wichtigste Grund für deine Antwort|Was genau meinst du damit|Nenne ein Beispiel/i,slide.assignmentId);
   followups.push(followup);
  });
  assert.equal(new Set(followups).size,followups.length,slide.assignmentId);
  assert.deepEqual(stages.slice(-4).map(x=>x.id),["questions","workbook-presentation","workbook","lesson-summary"],slide.assignmentId);
 }
});

test("B1 retains its source expressions while the vocabulary slot becomes Lesen", () => {
 for (const slide of getSlidesByCourse("B1")) {
  const stages = buildTeachingPresenterStages(slide, slide.topic);
  assert.equal(stages.some(s => s.id === "phrases"), false);
  assert.ok(stages.find(s => s.id === "reading")?.textDe);
  const entries = B1_VOCABULARY_QUESTIONS[slide.assignmentId];
  assert.ok(entries.length >= 4);
  for (const entry of entries) {
   assert.ok(slide.keyPhrasesDe.includes(entry.term));
   assert.ok(getB1VocabularyQuestion(slide.assignmentId, entry.term).endsWith("?"));
  }
 }
});

test("B1 presenter presents direct spoken questions and keeps A2, other levels unchanged",()=>{
 const jsx=fs.readFileSync(new URL("../src/components/TeachingSlidePresenter.jsx",import.meta.url),"utf8");
 assert.match(jsx,/Wie drückst du das passend aus\?/);
 assert.match(jsx,/Die Lernenden wählen A, B oder C und antworten mündlich/);
 assert.match(jsx,/Redemittel-Fragen starten/);
 assert.match(jsx,/Was sagst du in dieser Situation\?/);
});

test("B1 previous Day 15 and Day 20 comparison/method follow-up regressions remain exact",()=>{
 assert.equal(getB1WarmupFollowUp("B1-5.15","Wie kann man Arbeit und Privatleben besser trennen?"),"Welche feste Regel hilft dir, nach der Arbeit wirklich abzuschalten?");
 assert.equal(getB1WarmupFollowUp("B1-6.20","Was ist wichtiger: Ausbildung oder Erfahrung?"),"Wann ist praktische Erfahrung wichtiger als eine Ausbildung?");
});

test("B1 Day 24 sustainability follow-up asks about the selected sustainable products", () => {
 const question = "Welche nachhaltigen Produkte kaufst du bereits?";
 const followUp = getB1WarmupFollowUp("B1-8.24", question);
 assert.equal(followUp, "Warum kaufst du genau diese nachhaltigen Produkte?");
 assert.doesNotMatch(followUp, /nachhaltiger als früher/i, "Do not imply a change in purchasing behavior");
 const slide = getSlidesByCourse("B1").find(s => s.assignmentId === "B1-8.24");
 const warmup = buildTeachingPresenterStages(slide, slide.topic).find(s => s.id === "warmup");
 const index = warmup.items.indexOf(question);
 assert.ok(index >= 0);
 assert.equal(warmup.questionSupport[index].followUpDe, followUp);
});

import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {A2_GRAMMAR_TEACHER_NOTES} from "../src/data/a2GrammarTeacherNotes.js";
import {A2_B1_WORKBOOK_GRAMMAR,A2_WORKBOOK_GRAMMAR_PAGES} from "../src/data/a2B1WorkbookGrammar.js";

test("all 28 A2 lessons have a concise teacher explanation for every existing grammar page",()=>{
 assert.equal(Object.keys(A2_GRAMMAR_TEACHER_NOTES).length,28);
 let total=0;
 for(let day=1;day<=28;day++){
  const pages=A2_WORKBOOK_GRAMMAR_PAGES[day];
  if(!pages)assert.ok(A2_B1_WORKBOOK_GRAMMAR.A2[day], "Missing workbook grammar "+day);
  const notes=A2_GRAMMAR_TEACHER_NOTES[day];
  assert.equal(notes.length,pages?.length||1,"Day "+day);
  for(const note of notes){
   assert.equal(note.length,3);
   assert.ok(note.every(s=>typeof s==="string"&&s.trim()));
   assert.ok(note[1].length<=550&&note[2].length<=350);
   total++;
  }
 }
 assert.equal(total,40);
});
test("teacher explanations preserve workbook grammar pages and are expandable without network work",()=>{
 const builder=readFileSync(new URL("../src/utils/teachingPresenter.js",import.meta.url),"utf8");
 assert.match(builder,/level === "A2" \? \{ grammarTeacherNote: A2_GRAMMAR_TEACHER_NOTES\[day\]\?\.\[index\]/);
 const view=readFileSync(new URL("../src/components/TeachingSlidePresenter.jsx",import.meta.url),"utf8");
 assert.match(view,/<details className="presenter-grammar-teacher-note"/);
 assert.match(view,/stage\.grammarTeacherNote\[2\]/);
});

import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {A1_DAY22_STAGES,DAY22_POLITE_QUESTIONS,DAY22_WEIL_PRACTICE,DAY22_WORKBOOK} from "../src/data/a1Day22Classroom.js";
import {enhanceA1Days21To24Slide} from "../src/data/a1Days21To24Slides.js";

test("Day 22 has exactly twelve projector stages and weil replaces stage 09",()=>{
 assert.deepEqual(A1_DAY22_STAGES.map(s=>s.step),["intro","symptoms","weather","reasons","reschedule","polite","questions","message","weil","writing","music","exit"]);
 assert.ok(A1_DAY22_STAGES.every(s=>s.type==="a1-day22"&&s.items.length));
 assert.match(DAY22_POLITE_QUESTIONS[0][1],/^Könnten wir einen anderen Termin vereinbaren\?/);
 assert.match(DAY22_WEIL_PRACTICE[0][1],/weil ich krank bin\./);
 assert.match(DAY22_WEIL_PRACTICE[2][1],/weil es stark regnet\./);
});

test("Day 22 preserves existing workbook sections and approved published music",()=>{
 const slide=enhanceA1Days21To24Slide({assignmentId:"A1-14.1"});
 assert.equal(slide.workbookConnection.workbookUrl,DAY22_WORKBOOK);
 assert.equal(slide.workbookConnection.parts.length,3);
 const presenter=readFileSync(new URL("../src/components/A1GrammarPresenter.jsx",import.meta.url),"utf8");
 assert.match(presenter,/A1_DAY22_STAGES/);
 assert.match(presenter,/A1Day22ClassroomStage/);
 const component=readFileSync(new URL("../src/components/A1Day22ClassroomStage.jsx",import.meta.url),"utf8");
 assert.match(component,/PublishedSongLessonStage assignmentKey="A1-14.1" courseDay={22}/);
 assert.match(component,/step==="weil"/);
 assert.match(component,/Könnten wir einen anderen Termin vereinbaren/);
 assert.match(component,/DAY22_WORKBOOK/);
});

test("Day 22 replaces duplicated reasons slide with eight labeled body parts",()=>{
 const steps=A1_DAY22_STAGES.map(stage=>stage.step);
 assert.equal(steps.length,12);
 assert.equal(steps[3],"body-parts");
 assert.ok(!steps.includes("reasons"));
 const component=readFileSync(new URL("../src/components/A1Day22ClassroomStage.jsx",import.meta.url),"utf8");
 for(const part of ["der Kopf","der Hals","der Bauch","der Rücken","der Arm","die Hand","das Bein","der Fuß"])
   assert.ok(component.includes(part),"missing body part "+part);
 assert.match(component,/Meine Arme <strong>tun<\/strong> weh/);
});

import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {A1_DAY13_STAGES,DAY13_SENTENCES,DAY13_TIME_FIRST,DAY13_QUESTIONS,DAY13_W_QUESTIONS} from "../src/data/a1Day13Classroom.js";
import {enhanceA1Days11To15Slide} from "../src/data/a1Days11To15Slides.js";

test("A1 Day 13 has a dedicated sequence for statements and questions",()=>{
 const steps=A1_DAY13_STAGES.map(stage=>stage.step);
 assert.deepEqual(steps,["intro","model","verb","build","time","yesno","wquestions","ask","correct","dialogue","music","exit"]);
 assert.ok(A1_DAY13_STAGES.every(stage=>stage.type==="a1-day13"));
 assert.match(DAY13_SENTENCES[0][1],/Ich lerne Deutsch/);
 assert.match(DAY13_TIME_FIRST[0][1],/^Am Montag lerne ich/);
 assert.match(DAY13_QUESTIONS[0][1],/^Lernst du/);
 assert.match(DAY13_W_QUESTIONS[0][1],/^Wo wohnst du/);
});

test("A1 Day 13 teacher link and guidance refer to new sentence topic",()=>{
 const lesson=enhanceA1Days11To15Slide({assignmentId:"A1-3.5"});
 assert.match(lesson.workbookConnection.subtitle,/statements/);
 assert.ok(lesson.workbookConnection.parts.some(part=>part.label==="W-Fragen"));
 assert.match(lesson.wrapUpTaskDe,/Ja-\/Nein-Frage/);
 const presenter=readFileSync(new URL("../src/components/A1GrammarPresenter.jsx",import.meta.url),"utf8");
 assert.match(presenter,/A1_DAY13_STAGES/);
 assert.match(presenter,/A1Day13ClassroomStage/);
 const component=readFileSync(new URL("../src/components/A1Day13ClassroomStage.jsx",import.meta.url),"utf8");
 assert.match(component,/PublishedSongLessonStage assignmentKey="A1-3.5"/);
});

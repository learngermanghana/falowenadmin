import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { B1_DAY28_AUDIO_KEY, B1_DAY28_LISTENING } from "../src/data/b1Day28Listening.js";
import { getInteractiveLessonOpening, isInteractiveOpeningStage } from "../src/data/interactiveLessonOpenings.js";
import { b1WorkbookAlignedSlidesDays21To28 } from "../src/data/b1WorkbookAlignedSlidesDays21To28.js";

const read=(path)=>readFileSync(new URL(path,import.meta.url),"utf8");
test("B1 Day 28 Hören maps the exact teacher-approved object into the existing Knowledge stage",()=>{
 const source=getInteractiveLessonOpening("B1-10.28");
 assert.equal(source.listening,B1_DAY28_LISTENING);
 assert.equal(B1_DAY28_AUDIO_KEY,"b1/day-28/klimafreundlich-leben.mp3");
 assert.equal(source.listening.day,28);
 assert.equal(source.listening.level,"B1");
 assert.equal(isInteractiveOpeningStage("B1-10.28","knowledge"),true);
 assert.equal(isInteractiveOpeningStage("B1-10.28","warmup"),false);
 assert.equal(isInteractiveOpeningStage("B1-10.27","knowledge"),true);
});
test("Five uploaded Richtig/Falsch statements, answers and evidence stay in teacher-defined order",()=>{
 assert.deepEqual(B1_DAY28_LISTENING.questions.map(q=>q.correctIndex),[1,0,1,0,1]);
 assert.deepEqual(B1_DAY28_LISTENING.questions.map(q=>q.answer),["Falsch","Richtig","Falsch","Richtig","Falsch"]);
 assert.deepEqual(B1_DAY28_LISTENING.questions.map(q=>q.prompt),[
 "Lisa hat den Entschluss gefasst, ab sofort nie wieder Fleisch zu essen.",
 "Lisa kauft Gemüse neuerdings gerne auf dem Wochenmarkt.",
 "Jonas schlägt vor, dass man sofort perfekt leben muss.",
 "Lisa möchte in Zukunft zweimal in der Woche vegetarisch kochen.",
 "Lisa vergisst laut eigener Aussage oft, die Heizung beim Lüften auszuschalten.",
 ]);
 assert.deepEqual(B1_DAY28_LISTENING.questions.map(q=>q.evidence),[
 "Aber beim Fleischkonsum fällt es mir schwer, komplett darauf zu verzichten.",
 "Ich kaufe jetzt mehr saisonales Gemüse auf dem Wochenmarkt und nutze öfter das Fahrrad.",
 "Aber man muss ja nicht sofort perfekt sein.",
 "Mein Ziel ist es jetzt, zweimal pro Woche vegetarisch zu kochen.",
 "Ich schalte jetzt immer die Heizung aus, wenn ich lüfte, und benutze LED-Lampen.",
 ]);
 assert.ok(B1_DAY28_LISTENING.questions.every(q=>q.options.length===2));
});
test("Private classroom MP3 routes through the signer, not public music or the learner workbook",()=>{
 const src=read("../src/components/InteractiveLessonOpening.jsx");
 assert.match(src,/isB1Day28Classroom/);
 assert.match(src,/b1\/day-28\/klimafreundlich-leben\.mp3/);
 assert.match(src,/course-media\/classroom\/audio-url/);
 assert.match(src,/getIdToken\(\)/);
 const slide=b1WorkbookAlignedSlidesDays21To28.find(s=>s.id==="b1-day-28-klimafreundlich-leben");
 assert.equal(slide.assignmentId,"B1-10.28");
 assert.match(slide.workbookConnection.subtitle,/classroom Hören|Admin classroom Hören/);
 assert.match(slide.teacherNotesEn.join(" "),/separate student workbook Teil 4/);
});

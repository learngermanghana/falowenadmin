import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");
const presenter=read("../src/components/SwahiliTeachingSlides.jsx");
const stage=read("../src/components/SwahiliA2LessonStage.jsx");
const video=read("../src/components/MusicVideoEmbed.jsx");
const css=read("../src/components/SwahiliTeachingSlides.css");
const daySix=read("../src/data/swahiliDaySixTeachingSlides.js");
const dayOne=read("../src/data/swahiliTeachingSlides.js");
test("Swahili Day 1 and Day 6 reuse existing A2 presenter shell, navigation and timers",()=>{
 for(const name of ["PresenterSessionTimer","PresenterStudentPicker","PresenterActivityTimer","PresenterStageJump","PresenterControls"]) assert.ok(presenter.includes("<"+name),name);
 assert.match(presenter,/presenter-shell swahili-a2-shell/);
 assert.match(presenter,/<SwahiliA2LessonStage stage=\{stage\} grammar=\{grammar\} isDaySix=\{isDaySix\}/);
 assert.match(presenter,/slide=\{selectedPresenterSlide\}/);
 assert.match(presenter,/selectedPresenterSlide = isDaySix \? daySixPresenterSlide : presenterSlide/);
 assert.ok(dayOne.includes('id: "swahili-day-1"'));
 assert.ok(daySix.includes('id:"swahili-day-6"'));
});
test("shared A2 music/video player renders approved Day 6 Falowen Radio without making a new player",()=>{
 assert.match(stage,/import MusicVideoEmbed from "\.\/MusicVideoEmbed\.jsx"/);
 assert.match(stage,/stage\.radioUrl\.match/);
 assert.match(stage,/footerLabel="Falowen · Jifunze Kiswahili"/);
 assert.match(video,/const YOUTUBE_ID =/);
 assert.match(video,/footerLabel = "Falowen · Deutsch lernen mit Musik"/);
 assert.match(video,/youtube-nocookie\.com\/embed/);
 assert.match(stage,/No approved Day 6 song audio is connected yet/);
 assert.doesNotMatch(stage,/<audio|new Audio\(/);
});
test("Day 6 uses A2-style structured menu, dialogue, grammar and workbook tasks",()=>{
 for(const token of ["swahili-a2-presenter__menu","swahili-a2-presenter__dialogue","swahili-a2-presenter__grammar-stage","swahili-a2-presenter__task-grid","swahili-a2-presenter__word-grid"]) assert.ok(stage.includes(token),token);
 assert.match(stage,/stage\.type==="reading" && isDaySix/);
 assert.match(stage,/stage\.type==="speaking" && isDaySix/);
 assert.match(stage,/grammar\.rule/);
 assert.match(css,/\.swahili-a2-presenter__menu\{/);
 assert.match(css,/@media\(max-width:650px\)/);
 assert.match(daySix,/juisi ya embe/);
 assert.match(daySix,/ugali samaki/);
});

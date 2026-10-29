import test from "node:test";
import assert from "node:assert/strict";
import {getCuratedMusicByAssignment} from "../src/data/curatedLessonMusic.js";
import {getA1PresenterMusicStage} from "../src/data/a1PresenterMusicStage.js";
import {getReusableSongDraft} from "../src/data/reusableMusicSongbook.js";
import {getReusableMusicQuestions} from "../src/data/reusableMusicQuestions.js";
import {getSlidesByCourse} from "../src/data/teachingSlides.js";

test("A1 Day 13 uses the same published-song slide style as A1 Day 4",()=>{
 const day4=getA1PresenterMusicStage("A1-2"),day13=getA1PresenterMusicStage("A1-3.5");
 assert.ok(day4);
 assert.ok(day13);
 assert.equal(day13.type,day4.type);
 assert.equal(day13.id,"music-lesson");
 assert.equal(day13.items.length,1);
 assert.match(day13.title,/Zwei Tees/);
 const recording=getCuratedMusicByAssignment("A1-3.5");
 assert.equal(recording.objectKey,"music/a1/day-13/zwei-tees-vier-euro.mp3");
 assert.equal(recording.audioUrl,"https://www.falowen.app/api/music?track=r2-a1-day-13-zwei-tees-vier-euro");
 const slide=getSlidesByCourse("A1").find(x=>x.assignmentId==="A1-3.5");
 assert.ok(slide);
 assert.match(getReusableSongDraft("A1-3.5").lyrics,/Zwei Tees, vier Euro/);
 const questions=getReusableMusicQuestions("A1-3.5").questions;
 assert.equal(questions.length>=3,true);
 assert.ok(questions.some(x=>x.type==="listening"));
 assert.ok(questions.some(x=>x.type==="speaking"));
});

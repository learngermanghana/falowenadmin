import test from "node:test";
import assert from "node:assert/strict";
import { C1_PHASE2_LESSONS, getC1Phase2Lesson } from "../src/data/c1Phase2Lessons.js";
import { c1PresenterSlides } from "../src/data/c1PresenterSlides.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";
test("C1 academic exercises are scoped and visible in Presenter",()=>{assert.deepEqual(C1_PHASE2_LESSONS.map(x=>x.day),Array.from({length:28},(_,i)=>i+1));assert.equal(getC1Phase2Lesson(29),null);for(const lesson of C1_PHASE2_LESSONS){assert.equal(lesson.vocabulary.length,20);assert.equal(lesson.grammarChecks.length,3);const slide=c1PresenterSlides[lesson.day-1];assert.equal(slide.academicPractice,lesson);assert.ok(buildTeachingPresenterStages(slide).some(x=>x.id==="academic-practice"));for(const [,choices,correct,reason] of lesson.questions||[]){assert.ok(choices[correct] && reason);}}for(const skill of ["Lesen","Hören","Schreiben","Sprechen"]){assert.equal(C1_PHASE2_LESSONS.filter(x=>x.skill===skill).length,7);}});

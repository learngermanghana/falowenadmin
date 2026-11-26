import test from "node:test";
import assert from "node:assert/strict";
import { C1_PHASE2_LESSONS, getC1Phase2Lesson } from "../src/data/c1Phase2Lessons.js";
import { c1PresenterSlides } from "../src/data/c1PresenterSlides.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";
test("C1 academic exercises are scoped and visible in Presenter",()=>{assert.deepEqual(C1_PHASE2_LESSONS.map(x=>x.day),[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]);assert.equal(getC1Phase2Lesson(21),null);for(const lesson of C1_PHASE2_LESSONS){assert.equal(lesson.vocabulary.length,20);assert.equal(lesson.grammarChecks.length,3);const slide=c1PresenterSlides[lesson.day-1];assert.equal(slide.academicPractice,lesson);assert.ok(buildTeachingPresenterStages(slide).some(x=>x.id==="academic-practice"));for(const [,choices,correct,reason] of lesson.questions||[]){assert.ok(choices[correct] && reason);}}assert.ok(!buildTeachingPresenterStages(c1PresenterSlides[20]).some(x=>x.id==="academic-practice"));});

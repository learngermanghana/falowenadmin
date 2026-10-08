import test from "node:test";
import assert from "node:assert/strict";
import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";
import { A2_TEACHER_CHALLENGES, getA2TeacherChallenge } from "../src/data/a2TeacherChallenges.js";

const days = new Map([
 ["A2-2.4", "Meeting Planner"], ["A2-3.8","Restaurant Challenge"],
 ["A2-6.17","Pharmacy Challenge"], ["A2-7.18","Banking Emergency"],
 ["A2-7.20","Customer Service"], ["A2-9.24","Holiday Planner"],
 ["A2-3.6","Room Makeover"], ["A2-4.11","Transport Decision"],
 ["A2-5.13","Mini Interview"], ["A2-8.21","Weekend Surprise"],
 ["A2-10.27","Message Challenge"], ["A2-10.28","Future Mission"],
]);

test("All 12 A2 missions contain three distinct realistic scenarios and nine topic-specific modelled questions", () => {
 assert.equal(Object.keys(A2_TEACHER_CHALLENGES).length,12);
 for (const [id,title] of days) {
  const mission=getA2TeacherChallenge(id);
  assert.equal(mission.title,title);
  assert.equal(mission.scenarios.length,3);
  const questions=[];
  for (const scenario of mission.scenarios) {
   assert.ok(scenario.context.length > 75, id);
   assert.equal(scenario.steps.length,3);
   for (const step of scenario.steps) {
    assert.ok(step.questionDe.includes("?") && step.questionDe.length>20, id);
    assert.ok(step.modelDe.length>20 && /[.!?]$/.test(step.modelDe), id);
    questions.push(step.questionDe);
   }
  }
  assert.equal(new Set(questions).size,9,id);
 }
});

test("A2 selected days replace one practice page; all 28 retain exact nine-stage grammar and workbook spine", () => {
 for (const slide of getSlidesByCourse("A2")) {
  const stages=buildTeachingPresenterStages(slide,slide.topic);
  const ids=stages.map(x=>x.id);
  assert.equal(stages.length,9,slide.assignmentId);
  assert.deepEqual(ids.slice(0,5),["intro","warmup","knowledge","phrases","grammar-check"],slide.assignmentId);
  assert.deepEqual(ids.slice(-3),["questions","workbook","lesson-summary"],slide.assignmentId);
  assert.equal(ids[5],days.has(slide.assignmentId)?"scenario-challenge":"practice",slide.assignmentId);
  assert.equal(ids.filter(id=>["practice","scenario-challenge"].includes(id)).length,1,slide.assignmentId);
  assert.ok(stages[7].workbookUrl,slide.assignmentId);
  if(days.has(slide.assignmentId)) {
   assert.equal(stages[5].items,getA2TeacherChallenge(slide.assignmentId).scenarios);
   assert.match(stages[5].teacherPurpose.teacher,/No student login or submission/);
  }
 }
});

import test from "node:test";
import assert from "node:assert/strict";
import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";
import { A2_TEACHER_CHALLENGES, getA2TeacherChallenge } from "../src/data/a2TeacherChallenges.js";

const days = new Map([
 ["A2-1.1", "Small Talk Challenge"], ["A2-1.2", "Personen vorstellen · 3 Rollenspiele"], ["A2-1.3", "Vergleichen · 3 Alltagssituationen"], ["A2-9.23", "Pünktlich ankommen"],
 ["A2-2.4", "Meeting Planner"], ["A2-3.8","Restaurant Challenge"],
 ["A2-6.17","Pharmacy Challenge"], ["A2-7.18","Banking Emergency"],
 ["A2-7.20","Customer Service"], ["A2-9.24","Holiday Planner"], ["A2-9.25","Ein neuer Tagesplan"],
 ["A2-3.6","Room Makeover"], ["A2-4.11","Transport Decision"],
 ["A2-5.13","Mini Interview"], ["A2-8.21","Weekend Surprise"],
 ["A2-10.27","Message Challenge"], ["A2-10.28","Future Mission"],
]);

test("A2 missions contain three distinct realistic scenarios and nine topic-specific modelled questions", () => {
 assert.equal(Object.keys(A2_TEACHER_CHALLENGES).length,days.size);
 for (const [id,title] of days) {
  const mission=getA2TeacherChallenge(id);
  assert.equal(mission.title,title);
  assert.equal(mission.scenarios.length,3);
  const questions=[];
  for (const scenario of mission.scenarios) {
   assert.ok(scenario.context.length > 75, id);
   assert.equal(scenario.steps.length,3);
   for (const step of scenario.steps) {
    // A speaking step may be a German question or an imperative task (e.g. "Stelle Sarah ... vor.").
   assert.ok(step.questionDe.length > 20 && /[?.!]$/.test(step.questionDe.trim()), id);
    assert.ok(step.modelDe.length>=15 && /[.!?]$/.test(step.modelDe), id);
    questions.push(step.questionDe);
   }
  }
  assert.equal(new Set(questions).size,9,id);
 }
});

test("A2 selected days replace one practice page; all 28 retain grammar and workbook with restored reading and corrections", () => {
 for (const slide of getSlidesByCourse("A2")) {
  const stages=buildTeachingPresenterStages(slide,slide.topic);
  const ids=stages.map(x=>x.id);
  const coreIds = ["intro", "warmup", "workbook-grammar", "common-mistakes", "reading",
    "grammar-check", "workbook-presentation", "questions", "workbook", "lesson-summary"];
  // Some lessons now have an optional teacher lecture, extra grammar pages or
  // richer speaking practice; preserve core order rather than hardcoding 11 pages.
  assert.equal(new Set(ids).size, ids.length, slide.assignmentId);
  let previous = -1;
  for (const id of coreIds) {
    const position = ids.indexOf(id);
    assert.ok(position > previous, slide.assignmentId + ": " + id);
    previous = position;
  }
  assert.deepEqual(ids.slice(-4), ["workbook-presentation", "questions", "workbook", "lesson-summary"], slide.assignmentId);
  const expectedId = days.has(slide.assignmentId) ? "scenario-challenge" : "practice";
  const scenario = stages.find(stage => stage.id === expectedId);
  assert.ok(scenario, slide.assignmentId);
  assert.equal(ids.filter(id => ["practice", "scenario-challenge"].includes(id)).length, 1, slide.assignmentId);
  const clarification = stages.find(stage => stage.id === "workbook");
  assert.equal(clarification.type, "clarification", slide.assignmentId);
  assert.equal(clarification.title, "Was ist noch unklar?", slide.assignmentId);
  assert.ok(clarification.items.some(item => item.label === "Grammatik"), slide.assignmentId);
  if (days.has(slide.assignmentId)) {
    assert.equal(scenario.items, getA2TeacherChallenge(slide.assignmentId).scenarios);
    assert.match(scenario.teacherPurpose.teacher, /No student login or submission/);
  }
 }
});

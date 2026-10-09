import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { getA1GrammarChecks } from "../src/data/a1GrammarChecks.js";
import { buildTeacherSlideSupport } from "../src/data/teacherSlideSupport.js";
import { getA1PresenterUnderstandingChecks } from "../src/data/a1PresenterUnderstandingChecks.js";
import { getA1LearningPath } from "../src/data/a1LearningPath.js";
import { buildA1SlideReviewChecks } from "../src/data/a1SlideReview.js";
import { A1_PUBLISHED_WORKBOOK_BY_ASSIGNMENT } from "../src/data/a1PublishedWorkbookRoutes.js";
import { A1_DAYS16_TO20_ASSIGNMENTS, getA1Days16To20UnderstandingChecks,
  getA1Days16To20QuickChecks, getA1Days16To20ApplicationChecks } from "../src/data/a1Days16To20Understanding.js";

const target = { "A1-9":16, "A1-10":16, "A1-11":17, "A1-12.1":18, "A1-12.2":18, "A1-12.3":20 };
const slide = (id) => getSlidesByCourse("A1").find(s => s.assignmentId === id);

test("six A1 Days 16–20 regular blocks supply ninety source-backed questions and teacher explanations", () => {
  assert.deepEqual([...A1_DAYS16_TO20_ASSIGNMENTS].sort(), Object.keys(target).sort());
  let total = 0;
  for (const [id, day] of Object.entries(target)) {
    const s = slide(id);
    assert.ok(s, id);
    assert.equal(s.dayNumber, day, id);
    const chosen = getA1PresenterUnderstandingChecks(id, getA1GrammarChecks(id,s),
      { slide:s, support:buildTeacherSlideSupport(s) });
    const authored = getA1Days16To20UnderstandingChecks(id);
    assert.deepEqual(chosen, authored, id + ": Presenter must use verified lesson bank");
    assert.equal(authored.length, 11, id);
    assert.match(authored[10].questionDe, /^Exit-Check:/);
    const quick = getA1Days16To20QuickChecks(id);
    const applied = getA1Days16To20ApplicationChecks(id);
    assert.equal(quick.length, 2, id);
    assert.equal(applied.length, 2, id);
    const items = [...authored, ...quick, ...applied];
    assert.equal(new Set(items.map(x=>x.questionDe.trim().toLowerCase())).size, 15, id);
    assert.ok(items.every(x=>x.questionDe && x.answerDe && x.noteEn?.length >= 20), id);
    assert.equal(buildA1SlideReviewChecks(authored,2).length,2,id);
    total += items.length;
    assert.equal(s.workbookConnection?.workbookUrl, A1_PUBLISHED_WORKBOOK_BY_ASSIGNMENT[id]);
    assert.equal(getA1LearningPath(s)?.kind, "review",
      id + ": answer-key or AI writing scores alone do not verify manual tutor marking");
  }
  assert.equal(total, 90);
});

test("Day 16 and Day 18 remain two distinct lesson blocks each", () => {
  assert.equal(slide("A1-9").dayNumber, slide("A1-10").dayNumber);
  assert.equal(slide("A1-12.1").dayNumber, slide("A1-12.2").dayNumber);
  assert.notEqual(slide("A1-9").workbookConnection.workbookUrl, slide("A1-10").workbookConnection.workbookUrl);
  assert.notEqual(slide("A1-12.1").workbookConnection.workbookUrl, slide("A1-12.2").workbookConnection.workbookUrl);
  assert.match(JSON.stringify(getA1Days16To20UnderstandingChecks("A1-9")), /keinen Käse|nicht warm/);
  assert.match(JSON.stringify(getA1Days16To20UnderstandingChecks("A1-10")), /Morgens esse ich|stehe ich auf/);
  assert.match(JSON.stringify(getA1Days16To20UnderstandingChecks("A1-12.1")), /auf dem Tisch|auf den Tisch/);
  assert.match(JSON.stringify(getA1Days16To20UnderstandingChecks("A1-12.2")), /als Lehrer|bei einer Bank|zur Arbeit/);
});

test("Day 17 uses real Lesen/Hören workbook sections and preserves its Sie-imperative", () => {
  const s = slide("A1-11");
  const parts = s.workbookConnection.parts;
  assert.equal(parts.length, 2);
  assert.match(parts[0].label,/Lesen/);
  assert.match(parts[1].label,/Hören/);
  const data = JSON.stringify(getA1Days16To20UnderstandingChecks("A1-11"));
  assert.match(data,/Gehen Sie geradeaus/);
  assert.match(data,/Biegen Sie links ab/);
  assert.match(data,/Überqueren Sie die Straße/);
});

test("Day 20 exactly follows the informal birthday + formal language-school writing tasks", () => {
  const s = slide("A1-12.3");
  assert.equal(s.workbookConnection.parts.length, 2);
  assert.match(s.workbookConnection.parts[0].label,/Informeller/);
  assert.match(s.workbookConnection.parts[1].label,/Formeller/);
  const qs = JSON.stringify(getA1Days16To20UnderstandingChecks("A1-12.3"));
  assert.match(qs,/drei Inhaltspunkte/);
  assert.match(qs,/Anrede, Grußformel und Name/);
  assert.match(qs,/Party|Geburtstags/);
  assert.match(qs,/Wann beginnt der Kurs/);
  assert.match(qs,/Kann ich online bezahlen/);
});

test("Day 19 Goethe speaking-readiness exam stays a distinct unchanged flow", () => {
  const s = slide("A1-5.9");
  assert.ok(s);
  assert.equal(s.dayNumber,19);
  assert.equal(s.estimatedDuration,"60 minutes");
  assert.deepEqual(s.interactionFlow.map(x=>Number(x.detailEn.match(/(\d+)\s*min/i)?.[1]||0)),[5,5,10,10,10,15,5]);
  assert.equal(getA1LearningPath(s),null);
  assert.equal(getA1Days16To20UnderstandingChecks("A1-5.9"),null);
  assert.match(s.workbookConnection.subtitle,/exam-readiness lab/i);
});

test("Classroom lessons are comprehension-first; no progress systems added", () => {
  for(const id of Object.keys(target)){
    const s=slide(id);
    assert.ok(s.interactionFlow.every(x=>!/role.?play|interview|speaking round|pair performance/i.test(x.phase)),id);
    assert.ok(s.interactionFlow.every(x=>/min:/.test(x.detailEn)),id);
    assert.ok(s.teacherNotesEn.length >= 3,id);
    assert.ok(s.workbookConnection.parts.length >= 1,id);
  }
  const presenter = fs.readFileSync("src/components/A1GrammarPresenter.jsx","utf8");
  const upgrades = fs.readFileSync("src/data/a1GenericLessonUpgrades.js","utf8");
  assert.match(upgrades,/enhanceA1Days16To20Slide/);
  assert.match(presenter,/getA1Days16To20QuickChecks\(slide\.assignmentId\)/);
  assert.match(presenter,/getA1Days16To20ApplicationChecks\(slide\.assignmentId\)/);
  assert.match(presenter,/reviewChecks: buildA1SlideReviewChecks\(mainChecks, 2\)/);
  assert.doesNotMatch(presenter,/Student Learning Progress|Self-practice completion tracking/);
});

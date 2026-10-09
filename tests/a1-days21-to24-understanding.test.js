import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { buildTeacherSlideSupport } from "../src/data/teacherSlideSupport.js";
import { getA1GrammarChecks } from "../src/data/a1GrammarChecks.js";
import { getA1PresenterUnderstandingChecks } from "../src/data/a1PresenterUnderstandingChecks.js";
import { getA1LearningPath } from "../src/data/a1LearningPath.js";
import { buildA1SlideReviewChecks } from "../src/data/a1SlideReview.js";
import { A1_PUBLISHED_WORKBOOK_BY_ASSIGNMENT } from "../src/data/a1PublishedWorkbookRoutes.js";
import {
  A1_DAYS21_TO24_ASSIGNMENTS,
  getA1Days21To24AdditionalUnderstandingChecks,
  getA1Days21To24QuickChecks,
  getA1Days21To24ApplicationChecks,
} from "../src/data/a1Days21To24Understanding.js";

const slides = getSlidesByCourse("A1");
const byId = id => slides.find(s => String(s.assignmentId || "").toUpperCase() === id);
const days = { "A1-13":21, "A1-14.1":22, "A1-14.2":23, "A1-5.10":24 };

test("A1 Days 21–24 use 60 checks across existing and added authored question banks", () => {
  assert.deepEqual([...A1_DAYS21_TO24_ASSIGNMENTS].sort(), Object.keys(days).sort());
  let total = 0;
  for (const [id, day] of Object.entries(days)) {
    const slide = byId(id);
    assert.ok(slide, id);
    assert.equal(slide.dayNumber, day);
    const full = getA1PresenterUnderstandingChecks(id, getA1GrammarChecks(id, slide),
      { slide, support: buildTeacherSlideSupport(slide) });
    assert.equal(full.length,11,id);
    assert.match(full[10].questionDe,/^Exit-Check:/);
    assert.equal(new Set(full.map(x=>x.questionDe)).size,11,id);
    if(["A1-13","A1-14.1"].includes(id)) {
      assert.equal(getA1Days21To24AdditionalUnderstandingChecks(id),null,
        id+": preserve existing weather/health regression-tested bank");
    } else {
      assert.deepEqual(full,getA1Days21To24AdditionalUnderstandingChecks(id),
        id+": use new curated case/conjunction bank");
    }
    const quick = getA1Days21To24QuickChecks(id);
    const applied = getA1Days21To24ApplicationChecks(id);
    assert.equal(quick?.length,2,id);
    assert.equal(applied?.length,2,id);
    const all=[...full,...quick,...applied];
    assert.equal(new Set(all.map(x=>x.questionDe.trim().toLowerCase())).size,15,id);
    assert.ok(all.every(x=>x.questionDe && x.answerDe && x.noteEn?.length>=20),id+": missing explanation");
    assert.equal(buildA1SlideReviewChecks(full.slice(0,10),2).length,2,id);
    total+=all.length;
    assert.equal(getA1LearningPath(slide).kind,"review",id+": scoring does not prove manual tutor marking");
  }
  assert.equal(total,60);
});

test("Day 21 has exactly the four published weather/workbook grading sections", () => {
  const slide=byId("A1-13");
  assert.equal(slide.workbookConnection.workbookUrl,A1_PUBLISHED_WORKBOOK_BY_ASSIGNMENT["A1-13"]);
  const sections=slide.workbookConnection.parts;
  assert.equal(sections.length,4);
  assert.deepEqual(sections.map(x=>x.label),[
    "Teil 1 · Anzeigen","Teil 2 · Nachricht","Teil 3 · Schreiben","Teil 4 · Hören"
  ]);
  assert.match(slide.teacherNotesEn.join(" "),/concrete weather/);
  const checks=JSON.stringify(getA1PresenterUnderstandingChecks("A1-13",getA1GrammarChecks("A1-13")));
  assert.match(checks,/Es regnet/);
  assert.match(checks,/Es schneit/);
  assert.match(checks,/am Montag um 16 Uhr/);
});

test("Day 22 keeps two Lesen sections and one Hören, with existing health questions", () => {
  const slide=byId("A1-14.1");
  assert.equal(slide.workbookConnection.workbookUrl,A1_PUBLISHED_WORKBOOK_BY_ASSIGNMENT["A1-14.1"]);
  assert.deepEqual(slide.workbookConnection.parts.map(x=>x.label),[
    "Teil 1 · Lesen","Teil 2 · Lesen: Ihr Termin","Teil 3 · Hören"
  ]);
  const checks=JSON.stringify(getA1PresenterUnderstandingChecks("A1-14.1",getA1GrammarChecks("A1-14.1")));
  assert.match(checks,/Ich habe Fieber/);
  assert.match(checks,/Mein Kopf tut weh/);
  assert.match(checks,/Meine Beine tun weh/);
  assert.match(checks,/Wann haben Sie Zeit/);
});

test("Day 23 distinguishes seeing accusative and helping/thanking dative without inventing a route", () => {
  const slide=byId("A1-14.2");
  assert.equal(slide.workbookConnection.workbookUrl,"");
  assert.equal(getA1LearningPath(slide).activityUrl,"");
  const all=JSON.stringify(getA1Days21To24AdditionalUnderstandingChecks("A1-14.2"));
  for(const term of ["sehen","helfen","danken","den Mann","dem Mann","der Frau"]) {
    assert.ok(all.includes(term),term);
  }
  assert.ok(slide.interactionFlow.every(x=>!/interview|role.?play/i.test(x.phase)));
});

test("Day 24 preserves the nine-step weil course and never directs to the unrelated final mock", () => {
  const slide=byId("A1-5.10");
  assert.equal(slide.workbookConnection.grammarUrl,"/campus/course/conjunctions-5-10");
  assert.equal(slide.workbookConnection.workbookUrl,"");
  assert.equal(slide.workbookConnection.parts.length,9);
  assert.equal(slide.interactionFlow.length,9);
  assert.equal(getA1LearningPath(slide).grammarUrl,"/campus/course/conjunctions-5-10");
  assert.equal(getA1LearningPath(slide).activityUrl,"");
  assert.notEqual(slide.workbookConnection.grammarUrl,A1_PUBLISHED_WORKBOOK_BY_ASSIGNMENT["A1-5.10"]);
  assert.match(slide.teacherNotesEn.join(" "),/deshalb/);
  const all=JSON.stringify(getA1Days21To24AdditionalUnderstandingChecks("A1-5.10"));
  for(const term of ["weil ich krank bin","weil ich arbeiten muss","Können wir uns am Mittwoch treffen"]) {
    assert.ok(all.includes(term),term);
  }
});

test("A1 Days 21–24 slides use the existing Presenter without adding tracking", () => {
  const presenter=fs.readFileSync("src/components/A1GrammarPresenter.jsx","utf8");
  const upgrade=fs.readFileSync("src/data/a1GenericLessonUpgrades.js","utf8");
  assert.match(upgrade,/enhanceA1Days21To24Slide/);
  assert.match(presenter,/getA1Days21To24QuickChecks\(slide\.assignmentId\)/);
  assert.match(presenter,/getA1Days21To24ApplicationChecks\(slide\.assignmentId\)/);
  assert.match(presenter,/reviewChecks: buildA1SlideReviewChecks\(mainChecks, 2\)/);
  assert.doesNotMatch(presenter,/Student Learning Progress|Self-practice completion tracking/);
});

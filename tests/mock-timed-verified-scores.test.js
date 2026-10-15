import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {resolve,dirname} from "node:path";
import {mockScoreText,mockVerifiedScores,MOCK_SECTIONS,MOCK_SECTION_LABELS} from "../src/utils/mockAttemptMonitoring.js";

test("completed A1 A2 and B1 mocks display four verified skills out of 25 and total out of 100",()=>{
  for(const level of ["A1","A2","B1"]){
    const results=mockVerifiedScores({
      status:"completed",level,sectionScores:{lesen:0,hoeren:18.5,schreiben:21,sprechen:25},overallScore:64.5
    });
    assert.deepEqual(results.sections,{lesen:0,hoeren:18.5,schreiben:21,sprechen:25});
    assert.equal(mockScoreText(results.sections.lesen),"0/25");
    assert.equal(mockScoreText(results.sections.hoeren),"18.5/25");
    assert.equal(mockScoreText(results.total,100),"64.5/100");
  }
});

test("absent verified section data are not displayed as zero or a fabricated score",()=>{
  const missing=mockVerifiedScores({status:"completed",sectionScores:{lesen:0},overallScore:0});
  assert.equal(mockScoreText(missing.sections.lesen),"0/25");
  assert.equal(mockScoreText(missing.sections.hoeren),"Not recorded");
  assert.equal(mockScoreText(missing.total,100),"0/100");
  assert.equal(mockScoreText(null),"Not recorded");
  assert.equal(mockScoreText(""),"Not recorded");
  assert.equal(mockScoreText(-2),"Not recorded");
  assert.equal(mockScoreText(26),"Not recorded");
  assert.equal(mockScoreText("70",100),"70/100");
  assert.equal(mockScoreText(false),"Not recorded");
  assert.equal(mockVerifiedScores({status:"in_progress",sectionScores:{lesen:25}}),null);
  assert.equal(mockVerifiedScores({status:"completed",progressSource:"browser_reported",overallScore:100}),null);
});

test("timed attempt monitor renders all section labels and a distinct total for saved completed mocks",()=>{
  const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
  const page=readFileSync(resolve(root,"src/pages/TimedAssignmentAttemptsPage.jsx"),"utf8");
  const css=readFileSync(resolve(root,"src/pages/TimedAssignmentAttemptsPage.css"),"utf8");
  assert.deepEqual(MOCK_SECTIONS,["lesen","hoeren","schreiben","sprechen"]);
  assert.equal(MOCK_SECTION_LABELS.hoeren,"Hören");
  assert.match(page,/mockVerifiedScores\(attempt\)/);
  assert.match(page,/MOCK_SECTIONS\.map\(section/);
  assert.match(page,/MOCK_SECTION_LABELS\[section\]/);
  assert.match(page,/mockScoreText\(verifiedScores\.total, 100\)/);
  assert.match(css,/monitor-mock-scores__grid/);
  assert.match(css,/grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
});

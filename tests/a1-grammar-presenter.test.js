import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { courseDictionary } from "../src/data/courseDictionary.js";
import { A1_GRAMMAR_CHECKS, getA1GrammarChecks } from "../src/data/a1GrammarChecks.js";

test("every real A1 lesson has a dedicated four-item grammar or language mastery check", () => {
  const assignmentIds = Object.values(courseDictionary.A1)
    .map((entry) => String(entry.assignment_id || "").trim())
    .filter((assignmentId) => assignmentId && assignmentId.toUpperCase() !== "A1-TUTORIAL");

  assert.equal(assignmentIds.length, 28, "unexpected A1 lesson count");

  for (const assignmentId of assignmentIds) {
    const checks = getA1GrammarChecks(assignmentId);
    assert.equal(checks.length, 4, `${assignmentId} should have four mastery checks`);
    for (const item of checks) {
      assert.ok(String(item.questionDe || "").trim(), `${assignmentId} has an empty question`);
      assert.ok(String(item.answerDe || "").trim(), `${assignmentId} has an empty answer`);
    }
  }

  assert.equal(Object.keys(A1_GRAMMAR_CHECKS).length, 28);
});

test("A1 mastery checks test concepts instead of repeating workbook gap-fill drills", () => {
  const workbookDrillPattern = /\b(?:ergänze|konjugiere|setze|ordne|schreibe|bilde)\b|___/i;
  for (const [assignmentId, checks] of Object.entries(A1_GRAMMAR_CHECKS)) {
    for (const item of checks) {
      assert.doesNotMatch(
        String(item.questionDe || ""),
        workbookDrillPattern,
        `${assignmentId} should ask a concept question rather than a workbook-style drill`,
      );
    }
  }

  assert.match(A1_GRAMMAR_CHECKS["A1-1.1-PRACTICE"][0].questionDe, /concept behind W-Wörter/i);
  assert.match(A1_GRAMMAR_CHECKS["A1-9"][0].questionDe, /difference between kein and nicht/i);
  assert.match(A1_GRAMMAR_CHECKS["A1-12.1"][0].questionDe, /concept behind two-way prepositions/i);
});

test("A1 presenter uses the language-first classroom flow with retrieval, speaking and workbook transfer", () => {
  const page = fs.readFileSync(new URL("../src/pages/TeachingSlidesPage.jsx", import.meta.url), "utf8");
  const presenter = fs.readFileSync(new URL("../src/components/A1GrammarPresenter.jsx", import.meta.url), "utf8");

  assert.match(page, /import A1GrammarPresenter/);
  assert.match(page, /a1GrammarLesson/);
  assert.match(page, /<A1GrammarPresenter/);
  assert.match(page, /A1-TUTORIAL/);

  assert.match(presenter, /A1_LANGUAGE_FIRST_FLOW_VERSION/);
  assert.match(presenter, /Remember before we start/);
  assert.match(presenter, /Say it before we explain it/);
  assert.match(presenter, /1-minute knowledge/);
  assert.match(presenter, /Pronunciation focus/);
  assert.match(presenter, /Muster und Regel verstehen/);
  assert.match(presenter, /Build the sentence/);
  assert.match(presenter, /Use it in a short conversation/);
  assert.match(presenter, /up to 15 different questions/);
  assert.match(presenter, /Typical mistakes to fix/);
  assert.match(presenter, /Cumulative A1 checkpoint/);
  assert.match(presenter, /Before you leave this lesson/);
  assert.match(presenter, /Now complete the workbook/);
  assert.match(presenter, /Exit Check/);
  assert.match(presenter, /studentQuestionsDe/);
  assert.match(presenter, /Start workbook/);
  assert.doesNotMatch(presenter, /requiresQuestionModel/);
});
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

  assert.match(A1_GRAMMAR_CHECKS["A1-1.1-PRACTICE"][0].questionDe, /der, die and das/i);
  assert.match(A1_GRAMMAR_CHECKS["A1-9"][0].questionDe, /difference between kein and nicht/i);
  assert.match(A1_GRAMMAR_CHECKS["A1-12.1"][0].questionDe, /concept behind two-way prepositions/i);
});

test("A1 presenter preserves the grammar diagnostic and adds communicative missions", () => {
  const page = fs.readFileSync(new URL("../src/pages/TeachingSlidesPage.jsx", import.meta.url), "utf8");
  const presenter = fs.readFileSync(new URL("../src/components/A1GrammarPresenter.jsx", import.meta.url), "utf8");

  assert.match(page, /import A1GrammarPresenter/);
  assert.match(page, /<A1GrammarPresenter/);
  assert.match(presenter, /A1_GRAMMAR_CHECK_FLOW_VERSION = 3/);
  for (const stage of ["quick-check", "grammar-check", "mistake-fix", "mistakes", "mini-mission", "listen-respond", "exit-check"]) {
    assert.ok(presenter.includes(`id: "${stage}"`), `missing ${stage}`);
  }
  assert.doesNotMatch(presenter, /id: "sentence-build"|id: "workbook",/);
  assert.ok(presenter.includes("A1-5.9"));
  assert.match(presenter, /A1EverydaySpeakingStage/);
  assert.match(presenter, /<PresenterStudentPicker/);
});

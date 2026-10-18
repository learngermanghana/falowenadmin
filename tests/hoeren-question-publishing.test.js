import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { validateDraftQuestions, parseGeminiLessonDraft } from "../src/utils/hoerenQuestions.js";
const require = createRequire(import.meta.url);
const { extractLessonDraft, validateQuestionSet } = require("../functions/hoerenQuestions.js");

const script = "A: Guten Tag! Ich fahre morgen nach Berlin.\nB: Der Zug fährt heute um zehn Uhr.\nA: Meine Schwester sitzt am Fenster.";
const statements = [
  { question: "Die Frau reist nach Berlin.", answer: "Richtig", evidence: "nach Berlin" },
  { question: "Der Zug fährt um neun Uhr.", answer: "Falsch", evidence: "um zehn Uhr" },
  { question: "Die Frau kommt heute an.", answer: "Falsch", evidence: "morgen nach Berlin" },
  { question: "Ihre Schwester sitzt am Fenster.", answer: "Richtig", evidence: "Schwester sitzt am Fenster" },
  { question: "Der Zug fährt am Morgen.", answer: "Richtig", evidence: "heute um zehn Uhr" },
];

test("Google response includes 5 evidence-linked listening questions in same script call", () => {
  const result = extractLessonDraft({ candidates: [{ content: { parts: [{ text: JSON.stringify({
    script, kind: "richtig-falsch", questions: statements,
  }) }] } }] });
  assert.equal(result.questions.length, 5);
  assert.deepEqual(validateDraftQuestions(result), statements);
  assert.equal(parseGeminiLessonDraft(JSON.stringify(result)).script, script);
});

test("cannot approve questions without exact supporting script quotes", () => {
  const tampered = statements.map(q => ({ ...q }));
  tampered[2].evidence = "der Flug landet heute";
  assert.throws(() => validateDraftQuestions({ script, questions: tampered, kind: "richtig-falsch" }), /exact quote/);
  assert.throws(() => validateQuestionSet({ script, questions: tampered, kind: "richtig-falsch" }), /quote/);
  assert.throws(() => validateDraftQuestions({ script, questions: statements.slice(0, 4), kind: "richtig-falsch" }), /five/);
});

test("multiple-choice validates exactly three distinct choices and a correct index", () => {
  const mc = statements.map(q => ({ question: q.question, evidence: q.evidence, options: ["Berlin", "Hamburg", "München"], correctIndex: 0 }));
  assert.equal(validateDraftQuestions({ script, kind: "multiple-choice", questions: mc }).length, 5);
  mc[1].options = ["Berlin", "Berlin", "München"];
  assert.throws(() => validateDraftQuestions({ script, kind: "multiple-choice", questions: mc }), /distinct/);
});

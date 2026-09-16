import test from "node:test";
import assert from "node:assert/strict";

import { getTeachingSlideByAssignmentId } from "../src/data/teachingSlides.js";
import { getA1GrammarChecks } from "../src/data/a1GrammarChecks.js";
import { getA1PresenterUnderstandingChecks } from "../src/data/a1PresenterUnderstandingChecks.js";
import { buildTeacherSlideSupport } from "../src/data/teacherSlideSupport.js";

test("A1-9 useful language stays at A1 food and negation level", () => {
  const slide = getTeachingSlideByAssignmentId("A1-9");
  assert.ok(slide);

  const phrases = (slide.keyPhrasesDe || []).join("\n");
  assert.match(phrases, /keinen Käse/i);
  assert.match(phrases, /keine Milch/i);
  assert.match(phrases, /nicht warm|heute nicht/i);
  assert.doesNotMatch(phrases, /Ich denke, dass/i);
});

test("A1-9 class challenge tests current food and negation knowledge only", () => {
  const slide = getTeachingSlideByAssignmentId("A1-9");
  const support = buildTeacherSlideSupport(slide);
  const checks = getA1PresenterUnderstandingChecks(
    "A1-9",
    getA1GrammarChecks("A1-9", slide),
    { slide, support },
  );

  assert.ok(checks.length >= 10);
  const questions = checks.map((item) => item.questionDe).join("\n");
  assert.match(questions, /kein|nicht/i);
  assert.match(questions, /Käse|Milch|Kaffee|Suppe|Essen|food/i);
  assert.doesNotMatch(questions, /direction|location|route|Weg|geradeaus/i);
  assert.doesNotMatch(questions, /Goethe Teil 3|können \+ bitte/i);
});

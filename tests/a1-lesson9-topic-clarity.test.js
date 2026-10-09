import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

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


test("A1-9 patch remains order-independent after earlier A1 override patches", () => {
  const patch = fs.readFileSync("scripts/patchA1Lesson9Clarity.mjs", "utf8");
  const day2 = fs.readFileSync("scripts/patchA1Day2ContactChallenge.mjs", "utf8");

  assert.match(day2, /getA1Days1To5UnderstandingChecks\("A1-2"\)/);
  assert.doesNotMatch(day2, /Wie fragst du einen Freund nach seiner Telefonnummer\?/);
  assert.match(patch, /const anchor = \`const A1_PRESENTER_UNDERSTANDING_OVERRIDES = \{/);
  assert.doesNotMatch(
    patch,
    /const anchor = \`const A1_PRESENTER_UNDERSTANDING_OVERRIDES = \{[\\s\\S]{0,80}"A1-4\\.7"/,
    "Lesson 9 insertion must not assume A1-4.7 is still the first override",
  );
});

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { teachingSlides } from "../src/data/teachingSlides.js";
import { buildTeacherSlideSupport } from "../src/data/teacherSlideSupport.js";
import { getA1GrammarChecks } from "../src/data/a1GrammarChecks.js";
import { getA1PresenterUnderstandingChecks } from "../src/data/a1PresenterUnderstandingChecks.js";
import { buildA1PresenterQuestionPool } from "../src/utils/a1PresenterQuestionPool.js";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

function slideFor(assignmentId) {
  return teachingSlides.find((slide) => String(slide.assignmentId || "").toUpperCase() === assignmentId.toUpperCase());
}

function resolvedChecksFor(assignmentId) {
  const slide = slideFor(assignmentId);
  assert.ok(slide, `${assignmentId} slide missing`);
  const support = buildTeacherSlideSupport(slide);
  return getA1PresenterUnderstandingChecks(
    assignmentId,
    getA1GrammarChecks(assignmentId, slide),
    { slide, support },
  );
}

test("A1-13 core quick checks stay on weather and time grammar", () => {
  const coreChecks = getA1GrammarChecks("A1-13");
  const combined = coreChecks.map((item) => `${item.questionDe} ${item.answerDe}`).join("\n");

  assert.doesNotMatch(combined, /How many content points|What are the three Day 13 content points/i);
  assert.match(combined, /Es regnet/);
  assert.match(combined, /im Sommer|seasons and months/i);
  assert.match(combined, /am Montag|days/i);
  assert.match(combined, /16 Uhr|new day and time/i);
});

test("A1-13 understanding slides check weather grammar, cancellation and sentence building", () => {
  const checks = getA1PresenterUnderstandingChecks("A1-13", getA1GrammarChecks("A1-13"));
  const classChecks = checks.slice(0, -1);
  const exitCheck = checks.at(-1);
  const combined = checks.map((item) => `${item.questionDe} ${item.answerDe}`).join("\n");

  assert.equal(classChecks.length, 10);
  assert.equal(checks.length, 11);
  assert.equal(new Set(classChecks.map((item) => item.questionDe)).size, 10);
  assert.ok(classChecks.every((item) => String(item.answerDe || "").trim()));

  assert.match(combined, /It is raining.*Es regnet/i);
  assert.match(combined, /It is snowing.*Es schneit/i);
  assert.match(combined, /It is cold.*Es ist kalt/i);
  assert.match(combined, /Es ist regnet.*Es regnet/i);
  assert.match(combined, /im Sommer|im Januar|season.*month/i);
  assert.match(combined, /am Montag|with days/i);
  assert.match(combined, /um 8 Uhr|um 16 Uhr|clock times/i);
  assert.match(combined, /am Montag um 16 Uhr/i);

  assert.ok(classChecks.filter((item) => /^Ordne die Wörter:/.test(item.questionDe)).length >= 3);
  assert.doesNotMatch(combined, /How many CONTENT points/i);
  assert.doesNotMatch(combined, /What are the three Day 13 content points/i);
  assert.match(exitCheck.questionDe, /^Exit-Check:/);

  const pool = buildA1PresenterQuestionPool(classChecks, 10, "A1-13-grammar-check");
  assert.equal(pool.length, 10);
  assert.equal(new Set(pool.map((item) => item.sourceQuestion)).size, 10);
});

test("A1-14.1 class checks apply health grammar and practical letter questions", () => {
  const checks = resolvedChecksFor("A1-14.1");
  const classChecks = checks.slice(0, -1);
  const exitCheck = checks.at(-1);
  const combined = checks.map((item) => `${item.questionDe} ${item.answerDe}`).join("\n");

  assert.equal(classChecks.length, 10);
  assert.equal(checks.length, 11);
  assert.equal(new Set(classChecks.map((item) => item.questionDe)).size, 10);
  assert.ok(classChecks.every((item) => item.answerDe && item.noteEn));
  assert.doesNotMatch(combined, /How many CONTENT points|What are the three Day 14|what is missing|greeting.*content point/i);
  assert.match(combined, /Ich bin krank.*Ich habe Fieber/s);
  assert.match(combined, /Mein Kopf tut weh/);
  assert.match(combined, /Meine Beine tun weh/);
  assert.match(combined, /Ich kann heute nicht kommen/);
  assert.match(combined, /Wann hast du Zeit/);
  assert.match(combined, /Wann haben Sie Zeit/);
  assert.match(combined, /am Samstag um 15 Uhr/);
  assert.match(combined, /Können wir uns nächste Woche treffen/);
  assert.match(exitCheck.questionDe, /^Exit-Check:/);
  assert.match(exitCheck.answerDe, /nicht.*kommen.*Kopfschmerzen.*am Montag um 16 Uhr/s);

  const pool = buildA1PresenterQuestionPool(classChecks, 10, "A1-14.1-grammar-check");
  assert.equal(pool.length, 10);
  assert.equal(new Set(pool.map((item) => item.sourceQuestion)).size, 10);
});

test("A1-4.7 Teil 3 uses practical request-and-response understanding questions", () => {
  const resolved = resolvedChecksFor("A1-4.7");
  const questions = resolved.map((item) => `${item.questionDe} ${item.answerDe}`).join("\n");

  assert.equal(resolved.length, 11);
  assert.equal(new Set(resolved.map((item) => item.questionDe)).size, 11);
  assert.match(questions, /make a polite request|Kannst du mir bitte/i);
  assert.match(questions, /respond positively|Ja, gern|Ja, natürlich/i);
  assert.match(questions, /do not want to use können|imperative/i);
  assert.match(questions, /refuse politely|Tut mir leid/i);
  assert.doesNotMatch(questions, /Was machst du am Wochenende|make a new sentence of your own/i);
});

test("A1-5.9 Goethe speaking has ten distinct class questions plus one separate exit check", () => {
  const resolved = resolvedChecksFor("A1-5.9");
  const classChecks = resolved.slice(0, -1);
  const exitChecks = resolved.slice(-1);

  assert.equal(resolved.length, 11);
  assert.equal(classChecks.length, 10);
  assert.equal(exitChecks.length, 1);
  assert.equal(new Set(classChecks.map((item) => item.questionDe)).size, 10);
  assert.ok(classChecks.every((item) => String(item.answerDe || "").trim()));
  assert.ok(classChecks.some((item) => /frage|sprechen|bitte|partner|W-question|yes\/no/i.test(`${item.questionDe} ${item.answerDe}`)));
});

test("A1-12.3 understanding slides teach exactly three content points and separate letter form", () => {
  const resolved = resolvedChecksFor("A1-12.3");
  const classChecks = resolved.slice(0, -1);
  const exitCheck = resolved.at(-1);
  const combined = resolved.map((item) => `${item.questionDe} ${item.answerDe}`).join("\n");

  assert.equal(classChecks.length, 10);
  assert.equal(resolved.length, 11);
  assert.equal(new Set(classChecks.map((item) => item.questionDe)).size, 10);
  assert.match(combined, /genau drei|drei Inhaltspunkte/i);
  assert.match(combined, /Anrede, Grußformel und Name/);
  assert.match(combined, /Alles Gute zum Geburtstag/);
  assert.match(combined, /Gibt es eine Party/);
  assert.match(combined, /Kann meine Familie mitkommen/);
  assert.match(combined, /Wann beginnt der Kurs/);
  assert.match(combined, /Wie viel kostet der Kurs/);
  assert.match(combined, /Kann ich online bezahlen/);
  assert.ok(classChecks.some((item) => /^Ordne die Wörter:/.test(item.questionDe)));
  assert.ok(classChecks.some((item) => !/^Ordne die Wörter:/.test(item.questionDe)));
  assert.match(exitCheck.questionDe, /^Exit-Check:/);
  assert.match(exitCheck.answerDe, /Wann beginnt der Kurs/);
  assert.match(exitCheck.answerDe, /Grußformel und Name/);
});

test("A1 presenter keeps class participation available from the first slide and switches to unique questions for the understanding check", () => {
  const presenter = read("src/components/A1GrammarPresenter.jsx");

  assert.match(presenter, /getA1PresenterUnderstandingChecks/);
  assert.match(presenter, /one question per student/);
  assert.match(presenter, /10 distinct lesson questions/);
  assert.match(presenter, /Next student →/);
  assert.match(presenter, /Continue lesson →/);
  assert.match(presenter, /if \(participationCheckMode\) return;/);
  assert.match(presenter, /className="presenter-participation-dock"/);
  assert.match(presenter, /aria-label="Class participation controls"/);
  assert.match(presenter, /questionContext=\{participationCheckMode \? stage\.id : "class-participation"\}/);
  assert.doesNotMatch(presenter, /hidden={!participationCheckMode}/);
  assert.doesNotMatch(presenter, /aria-hidden={!participationCheckMode}/);
});


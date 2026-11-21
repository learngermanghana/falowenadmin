import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { A1_DAY4_CLASSROOM_STAGES, A1_DAY4_NUMBERS, A1_DAY4_QUIZ_ANSWERS } from "../src/data/a1Day4Classroom.js";
import { getA1Days1To5UnderstandingChecks } from "../src/data/a1Days1To5Understanding.js";
import { getA1WorkbookAlignedSlideDay1To5 } from "../src/data/a1WorkbookAlignedSlidesDays1To5.js";
import { getA1PresenterReadingLesson } from "../src/data/a1PresenterReadingLessons.js";
import { getA1PresenterMusicStage } from "../src/data/a1PresenterMusicStage.js";
import { getCuratedMusicByAssignment } from "../src/data/curatedLessonMusic.js";

const slide = getA1WorkbookAlignedSlideDay1To5("A1-2");
const source = readFileSync(new URL("../src/components/A1GrammarPresenter.jsx", import.meta.url), "utf8");
const visual = readFileSync(new URL("../src/components/A1Day4TeachingStage.jsx", import.meta.url), "utf8");

test("A1 Day 4 keeps exactly 12 approved pages in sequence, reusing real music and reading", () => {
  const ids = A1_DAY4_CLASSROOM_STAGES.map(stage => stage.step);
  assert.deepEqual(ids, ["intro", "basics", "teens", "tens", "compound",
    "hundreds", "thousands", "contact", "quiz"]);
  const song = getA1PresenterMusicStage("A1-2", slide.dayNumber);
  const reading = getA1PresenterReadingLesson("A1-2");
  assert.equal(A1_DAY4_CLASSROOM_STAGES.length + Number(Boolean(song)) + Number(Boolean(reading)) + 1, 12);
  assert.equal(song?.id, "music-lesson");
  assert.equal(song?.type, "published-music");
  assert.equal(reading?.title, "Zahlen und Adresse");
  assert.ok(Array.isArray(reading?.checks) && reading.checks.length > 0);
  assert.match(source, /A1_DAY4_CLASSROOM_STAGES/);
  assert.match(source, /id: "reading", type: "reading"/);
  assert.match(source, /id: "a1-day4-workbook", type: "workbook"/);
  assert.match(source, /day4FinalChallenge: true/);
  assert.match(source, /step="wrapup"/);
});

test("Day 4 uses ten verified checks and A/B/C choices with one matching answer each", () => {
  const quizStage = A1_DAY4_CLASSROOM_STAGES.at(-1);
  const verified = getA1Days1To5UnderstandingChecks("A1-2").slice(0, 10);
  assert.equal(quizStage.id, "grammar-check", "preserve existing class participation question context");
  assert.equal(quizStage.items.length, 10);
  assert.deepEqual(quizStage.items, verified);
  A1_DAY4_QUIZ_ANSWERS.forEach((options, index) => {
    assert.equal(options.length, 3);
    assert.equal(new Set(options).size, 3);
    const expected = verified[index].answerDe.replace(/[.。]+$/, "").trim().toLocaleLowerCase("de-DE");
    assert.equal(options.filter(option => option.toLocaleLowerCase("de-DE") === expected).length, 1,
      "question " + (index + 1) + " must have one verified correct option");
  });
  assert.match(visual, /question.sourceIndex/);
  assert.match(visual, /Antwort zeigen/);
  assert.match(visual, /role="status"/);
  assert.match(source, /question=\{stage.id === "grammar-check" \? activeCheck : null\}/);
});

test("number examples are accurate, and workbook has only its two assessed sections", () => {
  assert.deepEqual(A1_DAY4_NUMBERS.basics.slice(0, 3), ["null", "eins", "zwei"]);
  assert.deepEqual(A1_DAY4_NUMBERS.teens.filter(([n]) => n === 16 || n === 17),
    [[16, "sechzehn"], [17, "siebzehn"]]);
  assert.ok(A1_DAY4_NUMBERS.compound.some(([n, unit, tens]) => n === 25 && unit === "fünf" && tens === "zwanzig"));
  assert.ok(A1_DAY4_NUMBERS.thousands.some(([n, word]) => n === 2040 && word === "zweitausendvierzig"));
  assert.deepEqual(A1_DAY4_NUMBERS.finalChallenge.map(([n]) => n), [16, 98, 555, 1020, 8553]);
  assert.equal(slide.workbookConnection.parts.length, 3);
  assert.equal(slide.workbookConnection.parts.filter(item => /^Teil\s/i.test(item.label)).length, 2);
  assert.ok(slide.workbookConnection.parts.every(item => !/Hören/i.test(item.label)));
  assert.match(source, /workbook\.workbookUrl/);
  assert.match(source, /workbook\.grammarUrl/);
});

test("published Day 4 music, shared teacher timer, participation and results code remain reused", () => {
  const audio = getCuratedMusicByAssignment("A1-2");
  assert.equal(audio?.objectKey, "music/a1/day-04/Das ist meine Nummer.mp3");
  assert.equal(audio?.status, "published");
  assert.match(source, /<PublishedSongLessonStage/);
  assert.match(source, /<PresenterSessionTimer/);
  assert.match(source, /<PresenterStudentPicker/);
  assert.match(source, /questionContext=\{participationCheckMode \? stage.id : "class-participation"\}/);
  assert.match(source, /isMusicStage/);
  assert.match(source, /getA1PresenterReadingLesson\("A1-2"\)/);
});

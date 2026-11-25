import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  A1_DAY16_NEGATION_ASSIGNMENT, A1_DAY16_NEGATION_WORKBOOK,
  A1_DAY16_FOOD, A1_DAY16_NEGATION_CHOICES, A1_DAY16_NEGATION_FIXES,
  buildA1Day16NegationStages,
} from "../src/data/a1Day16NegationClassroom.js";
import { getA1Days16To20UnderstandingChecks } from "../src/data/a1Days16To20Understanding.js";
import { getA1PresenterMusicStage } from "../src/data/a1PresenterMusicStage.js";
import { getA1PresenterReadingLesson } from "../src/data/a1PresenterReadingLessons.js";
import { getCuratedMusicByAssignment } from "../src/data/curatedLessonMusic.js";
import { getTeachingSlideByAssignmentId } from "../src/data/teachingSlides.js";
import { A1_PUBLISHED_WORKBOOK_BY_ASSIGNMENT } from "../src/data/a1PublishedWorkbookRoutes.js";

const stages = () => buildA1Day16NegationStages({
  song: getA1PresenterMusicStage("A1-9", 16),
  reading: getA1PresenterReadingLesson("A1-9"),
});

test("A1-9 has exactly twelve dedicated visual, question, music/Lesen and exit pages", () => {
  const pages = stages();
  assert.equal(A1_DAY16_NEGATION_ASSIGNMENT, "A1-9");
  assert.equal(pages.length, 12);
  assert.equal(new Set(pages.map(p => p.id)).size, 12);
  assert.deepEqual(pages.map(page => page.step || page.id), [
    "intro", "food", "positive-negative", "kein-or-nicht",
    "kein-forms", "case", "nicht", "sentence-builder",
    "grammar-check", "corrections", "music-reading", "exit-check",
  ]);
  assert.ok(pages.every(p => Array.isArray(p.items) && p.items.length > 0));
  assert.ok(pages.slice(0, 8).every(p => p.type === "a1-day16-negation"));
  assert.equal(pages[8].type, "check");
  assert.equal(pages[8].items.length, 10);
  assert.equal(pages[9].type, "a1-day16-negation");
  assert.equal(pages[10].hasMusic, true);
  assert.equal(pages[10].type, "a1-day16-negation");
  assert.equal(pages[11].type, "check");
  assert.equal(pages[11].exitCheck, true);
  assert.equal(pages[11].workbookUrl, A1_DAY16_NEGATION_WORKBOOK);
});

test("student picker keeps ten source-backed unique checks and one fresh exit task", () => {
  const authored = getA1Days16To20UnderstandingChecks("A1-9");
  const slides = stages();
  assert.equal(authored.length, 11);
  assert.deepEqual(slides[8].items, authored.slice(0, 10));
  assert.deepEqual(slides[11].items, [authored[10]]);
  assert.equal(new Set(slides[8].items.map(q => q.questionDe)).size, 10);
  assert.match(slides[11].items[0].questionDe, /^Exit-Check:/);
  assert.ok(!slides[8].items.includes(slides[11].items[0]));
  assert.ok(slides[8].items.every(q => q.answerDe && q.noteEn));
  assert.match(JSON.stringify(slides[8].items), /Käse|Milch|Kaffee|Suppe/);
  assert.match(JSON.stringify(slides[8].items), /kein|nicht/);
});

test("interactive sentence-completion options have accurate and unambiguous A1 answers", () => {
  assert.equal(A1_DAY16_FOOD.length, 8);
  assert.equal(A1_DAY16_NEGATION_CHOICES.length, 8);
  const expected = ["keine", "keinen", "nicht", "kein", "keine", "nicht", "nicht", "kein"];
  assert.deepEqual(A1_DAY16_NEGATION_CHOICES.map(item => item.correct), expected);
  for (const item of A1_DAY16_NEGATION_CHOICES) {
    assert.ok(item.lead && item.tail && item.why);
    assert.ok(item.options.includes(item.correct));
    assert.equal(new Set(item.options).size, item.options.length);
    assert.equal(item.options.filter(option => option === item.correct).length, 1);
  }
  assert.match(A1_DAY16_NEGATION_CHOICES[1].lead, /Ich esse/);
  assert.equal(A1_DAY16_NEGATION_CHOICES[1].correct, "keinen");
  assert.equal(A1_DAY16_NEGATION_CHOICES[2].correct, "nicht");
  assert.equal(A1_DAY16_NEGATION_FIXES.length, 5);
  assert.ok(A1_DAY16_NEGATION_FIXES.every(item => item.wrong && item.right && item.why));
});

test("combined media reuses published A1-9 music and actual five-sentence reading", () => {
  const song = getA1PresenterMusicStage("A1-9", 16);
  const record = getCuratedMusicByAssignment("A1-9");
  const reading = getA1PresenterReadingLesson("A1-9");
  const page = stages()[10];
  assert.equal(song?.type, "published-music");
  assert.equal(record?.status, "published");
  assert.equal(record?.day, 16);
  assert.equal(page.reading, reading ? page.reading : null);
  assert.equal(page.reading.title, "Essen und Verneinung");
  assert.equal(page.reading.checks.length, 3);
  assert.match(page.reading.textDe, /keinen Kaffee/);
  assert.match(page.reading.textDe, /keine Milch/);
  assert.throws(() => buildA1Day16NegationStages({ song: null, reading }), /verified published music/);
  assert.throws(() => buildA1Day16NegationStages({ song, reading: null }), /evidence-based Lesen/);
  const src = readFileSync(new URL("../src/components/A1Day16NegationStage.jsx", import.meta.url), "utf8");
  assert.ok(src.includes("<PublishedSongLessonStage assignmentKey={assignmentKey} courseDay={courseDay} compact nextLyricOnly />"));
  assert.ok(src.includes("<InlineReadingTranslations text={reading.textDe}"));
  assert.ok(src.includes('active === "music"'));
  assert.ok(src.includes('active === "reading"'));
});

test("presenter routes only A1-9, and keeps original Course Book scoring and independent A1-10", () => {
  const negation = getTeachingSlideByAssignmentId("A1-9");
  const routines = getTeachingSlideByAssignmentId("A1-10");
  assert.equal(negation.dayNumber, 16);
  assert.equal(routines.dayNumber, 16);
  assert.equal(negation.workbookConnection.workbookUrl, A1_DAY16_NEGATION_WORKBOOK);
  assert.equal(A1_PUBLISHED_WORKBOOK_BY_ASSIGNMENT["A1-9"], A1_DAY16_NEGATION_WORKBOOK);
  assert.notEqual(routines.workbookConnection.workbookUrl, negation.workbookConnection.workbookUrl);
  assert.equal(routines.workbookConnection.workbookUrl, A1_PUBLISHED_WORKBOOK_BY_ASSIGNMENT["A1-10"]);
  assert.match(negation.workbookConnection.subtitle, /answer-key marking remain unchanged/);
  assert.equal(negation.workbookConnection.parts.length, 1);
  assert.match(negation.teacherNotesEn.join(" "), /twelve pages/i);
  const presenter = readFileSync(new URL("../src/components/A1GrammarPresenter.jsx", import.meta.url), "utf8");
  assert.ok(presenter.includes("buildA1Day16NegationStages({"));
  assert.ok(presenter.includes('stage.type === "a1-day16-negation"'));
  assert.ok(presenter.includes("<A1Day16NegationStage key={stage.id} step={stage.step}"));
  assert.ok(presenter.includes('stage?.id === "a1-day16-negation-music-reading"'));
  assert.ok(presenter.includes('stage.exitCheck && stage.workbookUrl && !stage.teil3ObjectCards'));
  assert.ok(!presenter.includes('const A1_DAY16_NEGATION_ASSIGNMENT = "A1-10"'));
});

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { getInteractiveLessonOpening, isInteractiveOpeningStage } from "../src/data/interactiveLessonOpenings.js";
import { buildTeachingPresenterStages, isB1PresenterV2Slide } from "../src/utils/teachingPresenter.js";
import { B1_DAY28_AUDIO_KEY, B1_DAY28_LISTENING, B1_DAY28_LISTENING_QUESTIONS } from "../src/data/b1Day28Listening.js";
import { getB1WorkbookAlignedSlideDay21To28 } from "../src/data/b1WorkbookAlignedSlidesDays21To28.js";

test("B1 Day 28 uses published music on slide 2 and original Hören questions on slide 3", () => {
  const slide = getSlidesByCourse("B1").find(row => row.assignmentId === "B1-10.28");
  assert.ok(slide);
  assert.equal(isB1PresenterV2Slide(slide), true);
  const stages = buildTeachingPresenterStages(slide, slide.topic);
  assert.deepEqual(stages.slice(0, 3).map(stage => stage.id), ["intro", "warmup", "knowledge"]);
  assert.equal(stages[1].variant, "interactive-music-video");
  assert.equal(stages[1].musicVideo.mediaType, "music");
  assert.equal(stages[1].musicVideo.musicLibraryUrl, "https://music.falowen.app/?level=B1&day=28");
  assert.equal(stages[1].musicVideo.youtubeId, undefined);
  assert.equal(stages[1].timingMode, "");
  assert.equal(stages[2].variant, "interactive-listening");
  assert.equal(stages[2].audioLevel, "B1");
  assert.equal(stages[2].audioDay, 28);
  assert.equal(stages[2].audioKey, "b1/day-27/umweltfreundlich-im-alltag.mp3", "Use the teacher-confirmed Hören recording despite its Day 27 folder");
  assert.equal(stages[2].listeningItems.length, 5);
  assert.deepEqual(stages[2].transcript, [], "no full transcript was provided");
  assert.equal(stages[2].musicVideo, undefined);
  assert.equal(getInteractiveLessonOpening("B1-10.28").listening, B1_DAY28_LISTENING);
  assert.equal(isInteractiveOpeningStage("B1-10.28", "warmup"), false);
  assert.equal(isInteractiveOpeningStage("B1-10.28", "knowledge"), true);
});

test("B1 Day 28 preserves all five supplied questions, evidence, options and A B C B A key", () => {
  assert.equal(B1_DAY28_AUDIO_KEY, "b1/day-27/umweltfreundlich-im-alltag.mp3");
  assert.deepEqual(B1_DAY28_LISTENING_QUESTIONS.map(q => q.correctIndex), [0,1,2,1,0]);
  assert.deepEqual(B1_DAY28_LISTENING_QUESTIONS.map(q => q.prompt), [
    "Wie reagierten die Zuhörer auf den Vortrag?",
    "Welches erste Beispiel wurde zur CO2-Einsparung genannt?",
    "Was empfiehlt Jonas bezüglich des Transports?",
    "Wann fällt es Anna schwer, mit dem Rad zu fahren?",
    "Welchen Haushalts-Tipp nennt Jonas noch?",
  ]);
  assert.deepEqual(B1_DAY28_LISTENING_QUESTIONS.map(q => q.evidence), [
    "Die Leute waren überrascht, wie viel wir im Alltag verändern können, ohne großen Aufwand.",
    "Den Fleischkonsum. Wenn man seltener Fleisch isst, spart das enorm viel CO2 ein.",
    "Wer öfter das Auto stehen lässt und stattdessen mit dem Fahrrad fährt oder die öffentlichen Verkehrsmittel nutzt, schont die Umwelt und die Gesundheit.",
    "Aber im Winter ist das oft schwer.",
    "Man kann aber auch im Haushalt Energie sparen, zum Beispiel beim Heizen oder wenn man Elektrogeräte komplett ausschaltet statt im Standby-Modus zu lassen.",
  ]);
  assert.deepEqual(B1_DAY28_LISTENING_QUESTIONS.map(q => q.options), [
    ["Sie waren überrascht über die Möglichkeiten zur Veränderung.", "Sie fanden den Vortrag langweilig und uninteressant.", "Sie wussten bereits alles über den ökologischen Fußabdruck."],
    ["Weniger oft mit dem Flugzeug in den Urlaub reisen.", "Weniger Fleisch essen, um CO2 einzusparen.", "Komplett vegan leben ohne Ausnahmen."],
    ["Ein neues Elektroauto kaufen.", "Niemals mehr öffentliche Verkehrsmittel nutzen.", "Öfter das Auto stehen lassen und Fahrrad fahren."],
    ["Im Frühling bei Regen.", "Im Winter ist das oft schwer.", "Am Wochenende in der Freizeit."],
    ["Elektrogeräte komplett ausschalten statt im Standby-Modus zu lassen.", "Alle Lampen durch Kerzen ersetzen.", "Die Heizung im Sommer komplett laufen lassen."],
  ]);
  assert.ok(B1_DAY28_LISTENING_QUESTIONS.every(q => q.answer && q.explanation));
});

test("B1 Day 28 music remains independent while Hören uses the confirmed recording", () => {
  const music = readFileSync(new URL("../src/components/LinkedPublishedSongLessonStage.jsx", import.meta.url), "utf8");
  const audio = readFileSync(new URL("../src/components/InteractiveLessonOpening.jsx", import.meta.url), "utf8");
  assert.ok(music.includes("[24,25,26,27,28].includes(day)"));
  assert.ok(music.includes("28:'B1-10.28'"));
  assert.ok(audio.includes("!lesson.listening.audioKey && !lesson.listening.youtubeId"));
  assert.ok(audio.includes("isB1Day28Classroom"));
  assert.ok(audio.includes("https://www.falowen.app/api/course-media/classroom/audio-url"));
  assert.equal(B1_DAY28_LISTENING.audioKey, "b1/day-27/umweltfreundlich-im-alltag.mp3");
  assert.ok(!B1_DAY28_LISTENING.youtubeId);
  assert.ok(!B1_DAY28_LISTENING.transcript.length);
});

test("B1 Day 28 teacher explanation keeps ungraded quiz separate from the blocked scored workbook", () => {
  const slide = getB1WorkbookAlignedSlideDay21To28("B1-10.28");
  const notes = slide.teacherNotesEn.join(" ");
  assert.match(notes, /five original Klimafreundlich leben multiple-choice questions/);
  assert.match(notes, /b1\/day-27\/umweltfreundlich-im-alltag\.mp3/);
  assert.match(notes, /staff-only signer/);
  assert.match(notes, /graded workbook Teil 4 are separate activities/);
  const workbook = slide.workbookConnection.parts.find(x => x.label === "Teil 4 · Hören");
  assert.match(workbook.detailEn, /BLOCKING MISMATCH/i);
  assert.match(workbook.detailEn, /before scoring/i);
});

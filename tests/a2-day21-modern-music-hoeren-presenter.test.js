import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getTeachingSlideByAssignmentId, getTeachingSlideById } from "../src/data/teachingSlides.js";
import { buildTeachingPresenterStages, isA2PresenterV2Slide } from "../src/utils/teachingPresenter.js";
import { selectRecordedLessonTrack } from "../src/utils/recordedLessonMusic.js";
import { getInteractiveLessonOpening, isInteractiveOpeningStage } from "../src/data/interactiveLessonOpenings.js";
import { getA2B1AdminLessonProfile } from "../src/data/a2B1LessonProfile.js";
import { A2_DAY21_CLASSROOM_LISTENING } from "../src/data/a2Day21ClassroomListening.js";

const ASSIGNMENT = "A2-8.21";
const TEACHER_KEY = "a2/day-21/ein-wochenende-planen.mp3";
const WORKBOOK_KEY = "a2/day-21/day-21.mp3";

test("A2 Day 21 uses the Day 19-style music + Hören interactive teaching stages", () => {
  const slide = getTeachingSlideByAssignmentId(ASSIGNMENT);
  assert.equal(slide.id, "a2-day-21-wochenende-planen");
  assert.equal(isA2PresenterV2Slide(slide), true);
  const stages = buildTeachingPresenterStages(slide, slide.topic);
  assert.deepEqual(stages.slice(0, 6).map(stage => stage.id), [
    "intro", "warmup", "knowledge", "common-mistakes", "reading", "grammar-check",
  ]);
  assert.equal(stages[1].variant, "interactive-music-video");
  assert.equal(stages[1].musicVideo.musicLibraryUrl, "https://music.falowen.app/?level=A2&day=21");
  assert.equal(stages[1].musicVideo.youtubeId, undefined);
  assert.equal(stages[1].musicVideo.audioUrl, undefined);
  assert.equal(stages[2].variant, "interactive-listening");
  assert.equal(stages[2].audioKey, TEACHER_KEY);
  assert.equal(stages[2].audioDay, 21);
  assert.equal(stages[2].listeningItems.length, 5);
  assert.equal(isInteractiveOpeningStage(ASSIGNMENT, "knowledge"), true);
  assert.equal(stages.length, 11, "Do not duplicate or remove presenter stages");
  assert.equal(getInteractiveLessonOpening(ASSIGNMENT).listening, A2_DAY21_CLASSROOM_LISTENING);
});

test("the exact Day 21 presenter permalink loads the same modern layout as Day 19", () => {
  const url = new URL("https://admin.falowen.app/teaching-slides/course/A2/a2-day-21-wochenende-planen?present=1&assignmentId=A2-8.21&curriculumDay=21");
  const slug = url.pathname.split("/").pop();
  const slide = getTeachingSlideById(slug);
  const day19 = getTeachingSlideByAssignmentId("A2-7.19");
  assert.equal(url.searchParams.get("present"), "1");
  assert.equal(url.searchParams.get("assignmentId"), slide.assignmentId);
  assert.equal(isA2PresenterV2Slide(slide), true);
  const newStages = buildTeachingPresenterStages(slide, slide.topic);
  const previousStages = buildTeachingPresenterStages(day19, day19.topic);
  assert.deepEqual(newStages.slice(1, 3).map(stage => stage.variant),
    previousStages.slice(1, 3).map(stage => stage.variant));
  assert.equal(newStages[1].musicVideo.title, "Endlich Wochenende!");
  assert.equal(newStages[2].audioKey, TEACHER_KEY);
});

test("Day 21 chooses its exact published song when multiple Day 21 MP3s exist", () => {
  const makeTrack = (name, id) => ({
    id: "r2-a2-day-21-" + id,
    title: name.replace(/\.mp3$/, ""),
    objectKey: "music/a2/day-21/" + name,
    level: "A2",
    day: 21,
    autoDiscovered: true,
    coursebook: true,
    audioUrl: "https://www.falowen.app/api/music?track=r2-a2-day-21-" + id,
  });
  const feed = { tracks: [
    makeTrack("Andere Aufnahme.mp3", "other"),
    makeTrack("Endlich Wochenende.mp3", "approved"),
  ] };
  const track = selectRecordedLessonTrack(feed, { level: "A2", day: 21, assignmentKey: ASSIGNMENT });
  assert.equal(track?.objectKey, "music/a2/day-21/Endlich Wochenende.mp3");
  assert.equal(track?.id, "r2-a2-day-21-approved");
});

test("Lisa–Tom recording uses all five supplied Richtig/Falsch answers with exact transcript evidence", () => {
  const task = A2_DAY21_CLASSROOM_LISTENING;
  assert.equal(task.audioKey, TEACHER_KEY);
  assert.deepEqual(task.questions.map(q => q.answer),
    ["Falsch", "Richtig", "Falsch", "Richtig", "Falsch"]);
  assert.deepEqual(task.questions.map(q => q.prompt), [
    "Lisa hat schon Pläne für das Wochenende.",
    "Tom schlägt vor, an den See zu fahren.",
    "Am Abend wollen die beiden im Restaurant essen.",
    "Tom soll Anna und Mark einladen.",
    "Sie treffen sich am Samstag um elf Uhr.",
  ]);
  const transcript = task.transcript.map(turn=>turn[1]).join(" ");
  for (const question of task.questions) {
    assert.ok(transcript.includes(question.evidence), question.prompt);
    assert.equal(question.options[question.correctIndex], question.answer);
  }
  assert.match(transcript, /Um zehn Uhr am Bahnhof/);
  assert.match(transcript, /am Abend können wir grillen/);
  assert.notEqual(task.audioKey, WORKBOOK_KEY);
});

test("Day 21 teacher notes describe the current Köln reading and separately graded workbook", () => {
  const slide = getTeachingSlideByAssignmentId(ASSIGNMENT);
  const profile = getA2B1AdminLessonProfile("A2",21);
  assert.deepEqual(profile.requiredSubmissionParts.map(p=>p.partId),["teil2","teil3","teil4"]);
  assert.equal(profile.sections.part4.mode,"graded");
  const lesen=slide.workbookConnection.parts.find(part=>part.label==="Teil 3 · Lesen");
  const hoeren=slide.workbookConnection.parts.find(part=>part.label==="Teil 4 · Hören");
  assert.match(lesen.detailEn, /Mara and Daniel/);
  assert.match(hoeren.detailEn, /Claudia–Thomas/);
  assert.match(hoeren.detailEn, /Lisa–Tom.*ungraded/);
  assert.doesNotMatch(JSON.stringify(slide), /Stefan Berger|Goethe-standard YouTube self-check/);
});

test("Day 21 music player reuses the published-song layout and teacher audio uses staff-only signing", () => {
  const player=readFileSync("src/components/LinkedPublishedSongLessonStage.jsx","utf8");
  const audio=readFileSync("src/components/InteractiveLessonOpening.jsx","utf8");
  assert.match(player,/\[19,20,21\]\.includes\(day\)/);
  assert.match(player,/day === 21 \? 'A2-8\.21'/);
  assert.match(audio,/\[18, 19, 20, 21\]\.includes\(lesson\.listening\.day\)/);
  assert.match(audio,/course-media\/a2\/classroom-audio-url/);
});

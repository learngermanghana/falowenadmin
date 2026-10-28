import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { getInteractiveLessonOpening, isInteractiveOpeningStage } from "../src/data/interactiveLessonOpenings.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";
import { A2_DAY18_BANK_AUDIO_KEY, A2_DAY18_BANK_LISTENING } from "../src/data/a2Day18BankListening.js";
import { getReusableSongDraft } from "../src/data/reusableMusicSongbook.js";
import { getReusableMusicQuestions } from "../src/data/reusableMusicQuestions.js";
import { getCuratedMusicByAssignment, getCuratedMusicForSession, CURATED_MUSIC_DAYS } from "../src/data/curatedLessonMusic.js";

test("A2 Day 18 slide 2 is real Falowen R2 music with original questions, slide 3 is original private Hören", () => {
  const slide=getSlidesByCourse("A2").find(item=>item.assignmentId==="A2-7.18");
  const stages=buildTeachingPresenterStages(slide,slide.topic);
  const opening=getInteractiveLessonOpening("A2-7.18");
  const bank=stages[1].musicVideo;
  assert.equal(stages[0].id,"intro");
  assert.equal(stages[1].id,"warmup");
  assert.equal(stages[1].variant,"interactive-music-video");
  assert.equal(bank.mediaType,"music");
  assert.equal(bank.assignmentKey,"A2-7.18");
  assert.equal(bank.title,"Die Karte funktioniert nicht");
  assert.match(bank.audioUrl,/\/api\/music\?track=a2-day-18-bank/);
  assert.equal(bank.youtubeId,undefined,"old Amir YouTube song should not be shown");
  assert.equal(bank.lyrics,getReusableSongDraft("A2-7.18").lyrics);
  assert.deepEqual(bank.questions,getReusableMusicQuestions("A2-7.18").questions);
  assert.equal(bank.questions.length,3);
  assert.equal(stages[1].suggestedMinutes,0);
  assert.equal(stages[1].timingMode,"");
  assert.equal(stages[1].challengeItems?.length||0,0);
  assert.match(stages[1].teacherPurpose.teacher,/Cloudflare|music|Musik/i);
  assert.equal(opening.musicIntro.audioUrl,bank.audioUrl);
  assert.equal(stages[2].id,"knowledge");
  assert.equal(stages[2].variant,"interactive-listening");
  assert.equal(stages[2].audioKey,"a2/day-18/bank-telefonat.mp3");
  assert.equal(stages[2].audioKey,A2_DAY18_BANK_AUDIO_KEY);
  assert.equal(stages[2].listeningItems.length,5);
  assert.strictEqual(stages[2].transcript,A2_DAY18_BANK_LISTENING.transcript);
  assert.deepEqual(stages[2].listeningItems,A2_DAY18_BANK_LISTENING.questions);
  assert.equal(stages[2].musicVideo,undefined);
  assert.equal(isInteractiveOpeningStage("A2-7.18","warmup"),false);
  assert.equal(isInteractiveOpeningStage("A2-7.18","knowledge"),true);
  assert.deepEqual(stages.slice(3).map(s=>s.id),["phrases","grammar-check","practice","questions","workbook","lesson-summary"]);
});

test("Music stage uses signed R2 music, lyrics and 3 canonical questions without breaking B1 YouTube lessons",()=>{
  const src=readFileSync(new URL("../src/components/MusicTeachingStages.jsx",import.meta.url),"utf8");
  assert.match(src,/music\?\.assignmentKey === 'A2-7\.18'/);
  assert.match(src,/<PublishedSongLessonStage assignmentKey="A2-7.18"/);
  const b1=getSlidesByCourse("B1").find(x=>x.assignmentId==="B1-8.25");
  const stages=buildTeachingPresenterStages(b1,b1.topic);
  assert.equal(stages[1].musicVideo.youtubeId,"ArWT0uVqUxo");
  assert.equal(stages[2].variant,"interactive-listening");
  assert.equal(stages[2].audioKey,"b1/day-25/day-25.mp3");
});

test("only teacher-approved selected days have in-class music, even though the full songbook is available",()=>{
  assert.equal(CURATED_MUSIC_DAYS.filter(x=>x.status==="published").length,2);
  assert.equal(getCuratedMusicByAssignment("A1-14.1").day,22);
  assert.equal(getCuratedMusicByAssignment("A2-7.18").day,18);
  assert.equal(getCuratedMusicByAssignment("A2-10.26"),null);
  assert.equal(getCuratedMusicForSession({level:"A2",day:18}).assignmentKey,"A2-7.18");
  const slides=readFileSync(new URL("../src/pages/TeachingSlidesPage.jsx",import.meta.url),"utf8");
  assert.match(slides,/getCuratedMusicByAssignment\(slide\.assignmentId\)/);
  const a1=readFileSync(new URL("../src/components/A1GrammarPresenter.jsx",import.meta.url),"utf8");
  assert.match(a1,/type: "published-music"/);
  assert.match(a1,/<PublishedSongLessonStage assignmentKey=\{slide\.assignmentId\}/);
});

test("original authorized A2 Hören can recover from unavailable Cloud Run without losing access checks",()=>{
  const src=readFileSync(new URL("../src/components/InteractiveLessonOpening.jsx",import.meta.url),"utf8");
  assert.match(src,/https:\/\/api-awc2au65xa-ew\.a\.run\.app/);
  assert.match(src,/https:\/\/www\.falowen\.app\/api/);
  assert.match(src,/getIdToken\(\)/);
  assert.match(src,/stopFallback = true/);
  assert.match(src,/course-media\/\$\{lesson\.listening\.level\.toLowerCase\(\)\}\/audio-url/);
  assert.match(src,/R2-Objekt/);
});

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { transformWithEsbuild } from "vite";
import {
  A1_DAY6_ASSIGNMENT, A1_DAY6_CLASSROOM_STAGES, A1_DAY6_FAMILY,
  A1_DAY6_POSSESSIVE_QUIZ, A1_DAY6_DISCUSSION_PROMPTS,
  A1_DAY6_LANGUAGES, A1_DAY6_YES_NO_QUESTIONS, A1_DAY6_HOBBIES,
} from "../src/data/a1Day6Classroom.js";
import { getA1Days6To10UnderstandingChecks } from "../src/data/a1Days6To10Understanding.js";
import { getA1PresenterReadingLesson } from "../src/data/a1PresenterReadingLessons.js";
import { getA1PresenterMusicStage, getA1PresenterRecording } from "../src/data/a1PresenterMusicStage.js";
import { getA1WorkbookAlignedSlideDay6To10 } from "../src/data/a1WorkbookAlignedSlidesDays6To10.js";

const presenterUrl = new URL("../src/components/A1GrammarPresenter.jsx",import.meta.url);
const presenterSource = readFileSync(presenterUrl,"utf8");
const visualSource = readFileSync(new URL("../src/components/A1Day6TeachingStage.jsx",import.meta.url),"utf8");
const mediaSource = readFileSync(new URL("../src/components/A1Day6MusicReadingStage.jsx",import.meta.url),"utf8");
const require = createRequire(import.meta.url);

async function stageList() {
  const {code}=await transformWithEsbuild(presenterSource,presenterUrl.pathname,
    {loader:"jsx",format:"cjs",jsx:"automatic"});
  const modules=new Map();
  for(const match of code.matchAll(/require\("([^"]+)"\)/g)) {
    const name=match[1];
    modules.set(name,
      name.endsWith(".css") || name.endsWith(".jsx") ? {}
      : name.startsWith(".") ? await import(new URL(name,presenterUrl)) : require(name));
  }
  const module={exports:{}};
  new Function("require","module","exports",code)(name=>modules.get(name),module,module.exports);
  return module.exports.stageList;
}

test("Day 6 has exactly the approved twelve presenter pages in order",async()=>{
  const build=await stageList();
  const slide=getA1WorkbookAlignedSlideDay6To10(A1_DAY6_ASSIGNMENT);
  assert.ok(slide,"Day 6 workbook slide must exist");
  const stages=build(slide,slide.topic);
  assert.equal(stages.length,12);
  assert.deepEqual(A1_DAY6_CLASSROOM_STAGES.map(s=>s.step),[
    "intro","family","possessives","family-writing","languages",
    "ein-bisschen","yes-no-rule","yes-no-quiz","hobbies","live-quiz",
  ]);
  assert.equal(stages[0].id,"intro");
  assert.equal(stages[0].day6VisualIntro,true);
  assert.equal(stages[9].id,"grammar-check");
  assert.equal(stages[9].type,"a1-day6");
  assert.equal(stages[10].day6CombinedReading,true);
  assert.equal(stages[11].id,"a1-day6-workbook");
  assert.equal(stages[11].type,"workbook");
  assert.equal(stages[11].day6FinalChallenge,true);
});

test("Day 6 article, language, family-writing and verb-first drills match its published course scope",()=>{
  assert.deepEqual(A1_DAY6_FAMILY.map(x=>x.noun),
    ["Mutter","Vater","Bruder","Schwester","Eltern","Kind"]);
  assert.equal(A1_DAY6_POSSESSIVE_QUIZ.length,6);
  assert.deepEqual(A1_DAY6_POSSESSIVE_QUIZ.map(x=>x.example),
    ["mein Vater","meine Mutter","mein Bruder","meine Schwester","meine Eltern","mein Kind"]);
  assert.equal(A1_DAY6_DISCUSSION_PROMPTS.length,8);
  assert.ok(A1_DAY6_LANGUAGES.some(([name,example])=>name==="Deutsch"&&example.includes("ein bisschen Deutsch")));
  assert.equal(A1_DAY6_YES_NO_QUESTIONS[0].answer,"Sprichst du Deutsch?");
  assert.ok(A1_DAY6_YES_NO_QUESTIONS.every(x=>/^[A-ZÄÖÜ]/.test(x.answer)&&x.answer.endsWith("?")));
  assert.equal(A1_DAY6_HOBBIES.length,5);
  assert.ok(A1_DAY6_HOBBIES.every(x=>x.sentence.includes(" gern")));
  assert.match(visualSource,/Das Verb steht zuerst/);
  assert.match(visualSource,/Verb \+.*gern/);
});

test("Day 6 keeps distinct verified live questions and the existing student result recorder",async()=>{
  const build=await stageList();
  const slide=getA1WorkbookAlignedSlideDay6To10(A1_DAY6_ASSIGNMENT);
  const stages=build(slide,slide.topic);
  const verified=getA1Days6To10UnderstandingChecks(A1_DAY6_ASSIGNMENT);
  assert.equal(verified.length,11);
  assert.deepEqual(stages[9].items,verified.slice(0,10));
  assert.equal(new Set(stages[9].items.map(q=>q.questionDe)).size,10);
  assert.match(presenterSource,/<PresenterSessionTimer/);
  assert.match(presenterSource,/<PresenterStudentPicker/);
  assert.match(presenterSource,/questionContext=\{participationCheckMode \? stage.id : "class-participation"\}/);
  assert.match(presenterSource,/question=\{stage.id === "grammar-check" \? activeCheck : null\}/);
  assert.match(visualSource,/Correct \/ Needs review/);
});

test("Day 6 reuses real reading and existing discovery-only music player",async()=>{
  const slide=getA1WorkbookAlignedSlideDay6To10(A1_DAY6_ASSIGNMENT);
  const stages=(await stageList())(slide,slide.topic);
  const reading=getA1PresenterReadingLesson(A1_DAY6_ASSIGNMENT);
  assert.equal(reading.title,"Familie und Hobbys");
  assert.equal(reading.checks.length,3);
  assert.match(reading.textDe,/Meine Mutter heißt Eva/);
  assert.deepEqual(stages[10].reading,reading);
  const music=getA1PresenterMusicStage(A1_DAY6_ASSIGNMENT,6);
  const recording=getA1PresenterRecording(A1_DAY6_ASSIGNMENT,6);
  assert.equal(recording?.discover,true,"planned Day 6 track must stay on exact recording discovery");
  assert.equal(recording?.audioUrl,undefined,"do not create a fake playback URL");
  assert.equal(stages[10].hasMusic,Boolean(music));
  assert.equal(stages[10].type,music?"published-music":"a1-day6-media");
  assert.match(mediaSource,/<InlineReadingTranslations/);
  assert.match(mediaSource,/<PublishedSongLessonStage/);
  assert.match(mediaSource,/reading\.answers\[i\]/);
  assert.match(mediaSource,/role="tablist"/);
  assert.match(mediaSource,/active==="music" && hasMusic/);
});

test("Day 6 workbook remains five-part self-practice and group discussion, not tutor-marked",async()=>{
  const slide=getA1WorkbookAlignedSlideDay6To10(A1_DAY6_ASSIGNMENT);
  const stages=(await stageList())(slide,slide.topic);
  const workbook=stages[11];
  assert.equal(workbook.workbookUrl,slide.workbookConnection.workbookUrl);
  assert.ok(workbook.workbookUrl.includes("a1-day-6"));
  assert.equal(slide.workbookConnection.grammarUrl,null,"Day 6 has no independent grammar page");
  assert.equal(workbook.grammarUrl,undefined,"do not invent a new grammar link");
  assert.equal(workbook.activityKind,"self-practice");
  assert.equal(workbook.items.length,5);
  assert.deepEqual(workbook.items.map(item=>item.label),slide.workbookConnection.parts.map(part=>part.label));
  assert.ok(workbook.items.every(item=>item.detail.length>20));
  assert.match(workbook.activityInstruction,/Gruppendiskussion/);
  assert.match(workbook.activityInstruction,/nicht zu einer benoteten Tutor-Abgabe/);
  assert.match(presenterSource,/stage\.day6FinalChallenge \? <A1Day6TeachingStage step="wrapup"/);
});

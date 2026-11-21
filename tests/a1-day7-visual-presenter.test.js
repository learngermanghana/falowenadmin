import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { transformWithEsbuild } from "vite";
import {
  A1_DAY7_ASSIGNMENT, A1_DAY7_CLASSROOM_STAGES, A1_DAY7_PRODUCTS,
  A1_DAY7_COST_CHOICES, A1_DAY7_PRONOUN_CHOICES,
  A1_DAY7_PREFERENCES, A1_DAY7_COMPARE, A1_DAY7_FAMILY_WRITING,
} from "../src/data/a1Day7Classroom.js";
import { getA1WorkbookAlignedSlideDay6To10 } from "../src/data/a1WorkbookAlignedSlidesDays6To10.js";
import { getA1Days6To10UnderstandingChecks } from "../src/data/a1Days6To10Understanding.js";
import { getA1PresenterReadingLesson } from "../src/data/a1PresenterReadingLessons.js";
import { getA1PresenterMusicStage, getA1PresenterRecording } from "../src/data/a1PresenterMusicStage.js";
import { getCuratedMusicByAssignment } from "../src/data/curatedLessonMusic.js";

const presenterUrl=new URL("../src/components/A1GrammarPresenter.jsx",import.meta.url);
const presenterSource=readFileSync(presenterUrl,"utf8");
const visualSource=readFileSync(new URL("../src/components/A1Day7TeachingStage.jsx",import.meta.url),"utf8");
const mediaSource=readFileSync(new URL("../src/components/A1Day7MusicReadingStage.jsx",import.meta.url),"utf8");
const require=createRequire(import.meta.url);
const slide=getA1WorkbookAlignedSlideDay6To10(A1_DAY7_ASSIGNMENT);

async function getStageList(){
  const {code}=await transformWithEsbuild(presenterSource,presenterUrl.pathname,{loader:"jsx",format:"cjs",jsx:"automatic"});
  const modules=new Map();
  for(const match of code.matchAll(/require\("([^"]+)"\)/g)){
    const name=match[1];
    modules.set(name,name.endsWith(".css")||name.endsWith(".jsx")?{}
      :name.startsWith(".")?await import(new URL(name,presenterUrl)):require(name));
  }
  const module={exports:{}};
  new Function("require","module","exports",code)(name=>modules.get(name),module,module.exports);
  return module.exports.stageList;
}

test("Day 7 routes exactly the 12 approved pages in order",async()=>{
  assert.equal(slide.assignmentId,"A1-3");
  assert.deepEqual(A1_DAY7_CLASSROOM_STAGES.map(s=>s.step),[
    "intro","products","cost-rule","price-dialogue","pronouns",
    "pronoun-quiz","mag-gern","lieber","family-writing","live-quiz",
  ]);
  const stages=(await getStageList())(slide,slide.topic);
  assert.equal(stages.length,12);
  assert.equal(stages[0].id,"intro");
  assert.equal(stages[0].day7VisualIntro,true);
  assert.equal(stages[9].id,"grammar-check");
  assert.equal(stages[9].type,"a1-day7");
  assert.equal(stages[10].day7CombinedReading,true);
  assert.equal(stages[11].id,"a1-day7-workbook");
  assert.equal(stages[11].type,"workbook");
  assert.equal(stages[11].day7FinalChallenge,true);
});

test("Price examples and noun-pronoun replacements are grammatically correct",()=>{
  assert.deepEqual(A1_DAY7_PRODUCTS.slice(0,3).map(x=>x.noun),["das Buch","die Lampe","der Stuhl"]);
  assert.equal(A1_DAY7_COST_CHOICES.length,4);
  assert.ok(A1_DAY7_COST_CHOICES.every(x=>x.answer===(x.plural?"kosten":"kostet")));
  assert.ok(A1_DAY7_COST_CHOICES.every(x=>x.sentence.includes(x.answer+" ")));
  assert.deepEqual(A1_DAY7_PRONOUN_CHOICES.map(x=>x.answer),["er","sie","es","es","sie"]);
  assert.equal(A1_DAY7_PREFERENCES.length,3);
  assert.deepEqual(A1_DAY7_COMPARE.map(x=>x.b.includes("lieber")), [true,true,true]);
  assert.equal(A1_DAY7_FAMILY_WRITING.length,5);
  assert.match(visualSource,/Dies sind Beispielpreise, keine echten Angebote/);
  assert.match(visualSource,/kostet oder kosten/);
});

test("Live class retains ten verified prompts, teacher reveals and student marking",async()=>{
  const stages=(await getStageList())(slide,slide.topic);
  const verified=getA1Days6To10UnderstandingChecks("A1-3");
  assert.equal(verified.length,11);
  assert.deepEqual(stages[9].items,verified.slice(0,10));
  assert.equal(new Set(stages[9].items.map(q=>q.questionDe)).size,10);
  assert.match(visualSource,/Correct \/ Needs review/);
  assert.match(visualSource,/aria-expanded=\{show\}/);
  assert.match(presenterSource,/<PresenterStudentPicker/);
  assert.match(presenterSource,/<PresenterSessionTimer/);
  assert.match(presenterSource,/questionContext=\{participationCheckMode \? stage.id : "class-participation"\}/);
  assert.match(presenterSource,/question=\{stage.id === "grammar-check" \? activeCheck : null\}/);
});

test("Original Mila reading and discovery-backed song are retained on page 11",async()=>{
  const stages=(await getStageList())(slide,slide.topic);
  const reading=getA1PresenterReadingLesson("A1-3");
  const music=getA1PresenterMusicStage("A1-3",7);
  const recording=getA1PresenterRecording("A1-3",7);
  assert.equal(reading.title,"Preise und Vorlieben");
  assert.equal(reading.checks.length,3);
  assert.match(reading.textDe,/Mila geht heute in ein Geschäft/);
  assert.deepEqual(stages[10].reading,reading);
  assert.equal(recording?.discover,true);
  assert.equal(recording?.audioUrl,undefined,"Never invent audio URL for on-demand discovery");
  assert.equal(getCuratedMusicByAssignment("A1-3"),null);
  assert.equal(stages[10].hasMusic,Boolean(music));
  assert.equal(stages[10].type,music?"published-music":"a1-day7-media");
  assert.match(mediaSource,/<PublishedSongLessonStage/);
  assert.match(mediaSource,/<InlineReadingTranslations/);
  assert.match(mediaSource,/reading\.answers\[index\]/);
  assert.match(mediaSource,/role="tablist"/);
  assert.match(mediaSource,/active==="music" && hasMusic/);
});

test("Day 7 keeps three tutor-marked workbook sections and original grammar route",async()=>{
  const workbook=(await getStageList())(slide,slide.topic)[11];
  const original=slide.workbookConnection;
  assert.equal(workbook.activityKind,"tutor-marked");
  assert.equal(workbook.grammarUrl,original.grammarUrl);
  assert.equal(workbook.workbookUrl,original.workbookUrl);
  assert.equal(workbook.items.length,4,"existing Grammar reference plus three assessed Teile");
  assert.deepEqual(workbook.items.map(p=>p.label),original.parts.map(p=>p.label));
  assert.deepEqual(workbook.items.filter(p=>/^Teil\s/.test(p.label)).map(p=>p.label),[
    "Teil 1 · Preise und Kosten","Teil 2 · Writing About Family","Teil 3 · Hobbys",
  ]);
  assert.ok(workbook.items.every(p=>p.detail.length>20));
  assert.match(workbook.activityInstruction,/Tutor-Bewertung/);
  assert.match(workbook.activityInstruction,/keine zusätzliche Hören-Abgabe/);
  assert.match(presenterSource,/data-a1-learning-mode=\{stage.activityKind\}/);
  assert.match(presenterSource,/stage\.day7FinalChallenge \? <A1Day7TeachingStage step="wrapup"/);
});

test("No new audio, grading API or timers are introduced by the Day 7 visual components",()=>{
  assert.doesNotMatch(visualSource+mediaSource,/fetch\(|\/api\/mark|\/api\/grade|\.mp3["']/);
  assert.match(mediaSource,/hasMusic/);
  assert.match(mediaSource,/nextLyricOnly/);
  assert.match(presenterSource,/presenter-a1-activity-disclosure/);
  assert.match(presenterSource,/onTimeStateChange=\{setClassTimeState\}/);
});

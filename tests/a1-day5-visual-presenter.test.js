import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { transformWithEsbuild } from "vite";
import {
  A1_DAY5_ASSIGNMENT,
  A1_DAY5_CLASSROOM_STAGES,
  A1_DAY5_ARTICLES,
  A1_DAY5_DESCRIPTIONS,
  A1_DAY5_WORD_ORDER,
  A1_DAY5_SELF_INTRO,
  A1_DAY5_QUESTIONS,
} from "../src/data/a1Day5Classroom.js";
import { getA1Days1To5UnderstandingChecks } from "../src/data/a1Days1To5Understanding.js";
import { getA1WorkbookAlignedSlideDay1To5 } from "../src/data/a1WorkbookAlignedSlidesDays1To5.js";
import { getA1PresenterReadingLesson } from "../src/data/a1PresenterReadingLessons.js";
import { getA1PresenterMusicStage, getA1PresenterRecording } from "../src/data/a1PresenterMusicStage.js";

const repoRoot = new URL("../", import.meta.url);
const presenterPath = new URL("../src/components/A1GrammarPresenter.jsx", import.meta.url);
const source = readFileSync(presenterPath, "utf8");
const uiSource = readFileSync(new URL("../src/components/A1Day5TeachingStage.jsx", import.meta.url), "utf8");
const mediaSource = readFileSync(new URL("../src/components/A1Day5MusicReadingStage.jsx", import.meta.url), "utf8");
const require = createRequire(import.meta.url);
const slide = getA1WorkbookAlignedSlideDay1To5(A1_DAY5_ASSIGNMENT);

async function stagesForDay5() {
  // Evaluate the real stage builder using its normal data modules, not a
  // duplicate of its intended stage sequence inside this test.
  const { code } = await transformWithEsbuild(source, presenterPath.pathname,
    { loader:"jsx", format:"cjs", jsx:"automatic" });
  const modules = new Map();
  for (const match of code.matchAll(/require\("([^"]+)"\)/g)) {
    const name = match[1];
    modules.set(name, name.endsWith(".css") || name.endsWith(".jsx")
      ? {} : name.startsWith(".")
        ? await import(new URL(name, presenterPath))
        : require(name));
  }
  const module = { exports: {} };
  new Function("require","module","exports",code)(name => modules.get(name), module, module.exports);
  return module.exports.stageList(slide,slide.topic);
}

test("Day 5 visual sequence is exactly the approved 12 pages", async () => {
  assert.deepEqual(A1_DAY5_CLASSROOM_STAGES.map(stage=>stage.step), [
    "intro","articles","article-quiz","adjectives","ist-adjective","self-intro",
    "intro-builder","w-questions","word-order","live-quiz",
  ]);
  const stages = await stagesForDay5();
  assert.equal(stages.length,12);
  assert.equal(stages[0].type,"intro");
  assert.equal(stages[9].id,"grammar-check");
  assert.equal(stages[9].type,"a1-day5");
  assert.equal(stages[10].id,"music-lesson");
  assert.equal(stages[10].type,"published-music");
  assert.equal(stages[10].day5CombinedReading,true);
  assert.equal(stages[11].id,"a1-day5-workbook");
  assert.equal(stages[11].type,"workbook");
  assert.equal(stages[11].day5FinalChallenge,true);
  assert.equal(stages[11].activityKind,"self-practice");
  assert.match(stages[11].activityInstruction,/keine tutorbenotete Abgabe/i);
});

test("article, adjective and W-question content stays inside verified Day 5 scope", () => {
  assert.equal(A1_DAY5_ARTICLES.length,6);
  assert.deepEqual(A1_DAY5_ARTICLES.slice(0,3).map(({article,noun})=>article+" "+noun),
    ["der Tisch","die Lampe","das Auto"]);
  assert.ok(A1_DAY5_DESCRIPTIONS.some(({sentence})=>sentence==="Das Haus ist klein."));
  assert.equal(A1_DAY5_SELF_INTRO.length,6);
  assert.deepEqual(A1_DAY5_QUESTIONS.map(x=>x.word),["Wie","Wo","Woher","Wer","Was"]);
  assert.equal(A1_DAY5_WORD_ORDER[0].answer,"Wo wohnst du?");
  assert.match(uiSource,/Nach.*ist/);
  assert.doesNotMatch(uiSource,/ein oder eine|adjective declension|Adjektivdeklination/i);
});

test("Day 5 live student check reuses exactly ten verified A1-1.3 questions", async () => {
  const stages=await stagesForDay5();
  const verified=getA1Days1To5UnderstandingChecks("A1-1.3");
  assert.equal(verified.length,11);
  assert.deepEqual(stages[9].items,verified.slice(0,10));
  assert.equal(new Set(stages[9].items.map(q=>q.questionDe)).size,10);
  assert.match(source,/question=\{stage.id === "grammar-check" \? activeCheck : null\}/);
  assert.match(source,/questionContext=\{participationCheckMode \? stage.id : "class-participation"\}/);
  assert.match(uiSource,/Correct \/ Needs review/);
  assert.match(uiSource,/Eine Frage pro Student|eine Frage pro Student/);
});

test("Day 5 song discovery and exact Lara reading retain the existing UI components", async () => {
  const stages=await stagesForDay5();
  const currentSong=getA1PresenterMusicStage("A1-1.3",5);
  assert.ok(currentSong,"authored Day 5 discovery music stage must still be present");
  assert.equal(getA1PresenterRecording("A1-1.3",5)?.discover,true);
  assert.equal(stages[10].reading?.title,"Sich vorstellen");
  assert.deepEqual(stages[10].reading,getA1PresenterReadingLesson("A1-1.3"));
  assert.equal(stages[10].reading.checks.length,3);
  assert.match(stages[10].reading.textDe,/ich heiße Lara/i);
  assert.match(mediaSource,/<PublishedSongLessonStage/);
  assert.match(mediaSource,/<InlineReadingTranslations/);
  assert.match(mediaSource,/reading\.answers\[index\]/);
  assert.match(mediaSource,/role="tablist"/);
  assert.match(mediaSource,/active==="music"/);
});

test("Day 5 retains original unscored practice routes and four workbook sections", async () => {
  const stages=await stagesForDay5();
  assert.equal(stages[11].grammarUrl,slide.workbookConnection.grammarUrl);
  assert.equal(stages[11].workbookUrl,slide.workbookConnection.workbookUrl);
  assert.equal(stages[11].items.length,5,"one Shared Grammar section plus four Teils");
  assert.deepEqual(stages[11].items.slice(1).map(p=>p.label),[
    "Teil 1 · Articles","Teil 2 · Adjectives",
    "Teil 3 · Personal Information","Teil 4 · Mini Dialogue / W-Fragen",
  ]);
  assert.ok(stages[11].items.every(({detail})=>detail.length>20));
  assert.ok(!stages[11].items.some(p=>/tutor-marked|Hören/i.test(p.label)));
  assert.match(source,/<PresenterSessionTimer/);
  assert.match(source,/<PresenterStudentPicker/);
  assert.match(source,/stage\.day5FinalChallenge \? <A1Day5TeachingStage step="wrapup"/);
});

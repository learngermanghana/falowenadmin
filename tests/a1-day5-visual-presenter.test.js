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
  A1_DAY5_PERSONAL_INFO,
  A1_DAY5_QUESTIONS,
} from "../src/data/a1Day5Classroom.js";
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

test("Day 5 visual sequence has 10 pages without a live diagnostic or duplicate adjective sentence slide", async () => {
  assert.deepEqual(A1_DAY5_CLASSROOM_STAGES.map(stage=>stage.step), [
    "intro","articles","article-quiz","adjectives","self-intro",
    "intro-builder","w-questions","word-order",
  ]);
  const stages = await stagesForDay5();
  assert.equal(stages.length,10);
  assert.equal(stages[0].type,"intro");
  assert.ok(!stages.some(stage=>stage.id==="grammar-check"));
  assert.equal(stages[8].id,"music-lesson");
  assert.equal(stages[8].type,"published-music");
  assert.equal(stages[8].day5CombinedReading,true);
  assert.equal(stages[9].id,"a1-day5-workbook");
  assert.equal(stages[9].type,"workbook");
  assert.equal(stages[9].day5FinalChallenge,true);
  assert.equal(stages[9].activityKind,"self-practice");
  assert.match(stages[9].activityInstruction,/keine tutorbenotete Abgabe/i);
});

test("article, adjective and W-question content stays inside verified Day 5 scope", () => {
  assert.equal(A1_DAY5_ARTICLES.length,5);
  assert.deepEqual(A1_DAY5_ARTICLES.map(({article,noun})=>article+" "+noun),
    ["der Tisch","das Auto","die Lampe","der Apfel","das Buch"]);
  assert.ok(A1_DAY5_DESCRIPTIONS.some(({sentence})=>sentence==="Das Haus ist klein."));
  assert.equal(A1_DAY5_SELF_INTRO.length,6);
  assert.deepEqual(A1_DAY5_QUESTIONS.map(x=>x.word),["Wie","Wo","Woher","Wer","Was"]);
  assert.equal(A1_DAY5_WORD_ORDER[0].answer,"Ich heiße Anna.");
  assert.ok(A1_DAY5_WORD_ORDER.some(x=>x.answer==="Wo wohnst du?" && x.kind==="W-Frage"));
  assert.doesNotMatch(uiSource,/SentenceCards|Ja\/Nein-Frage/);
  assert.doesNotMatch(uiSource,/ein oder eine|adjective declension|Adjektivdeklination/i);
});

test("Day 5 uses workbook sentence practice instead of student selection", async () => {
  const stages=await stagesForDay5();
  assert.ok(!stages.some(stage=>stage.id==="grammar-check" || stage.step==="live-quiz"));
  assert.doesNotMatch(uiSource,/Was kannst du schon\?|LiveCheck/);
  assert.equal(A1_DAY5_WORD_ORDER.length,11);
  assert.deepEqual(A1_DAY5_WORD_ORDER.map(x=>x.words.join(", ")), [
    "heiße, ich, Anna", "kommen, woher, Sie", "bin, ich, Jahre alt, 25",
    "aus, komme, ich, Deutschland", "ist, meine, Telefonnummer, 123456789",
    "Entschuldigung, heißen, Sie, wie", "wie, dir, es, geht", "wie, Ihnen, es, geht",
    "mir, gut, es, geht", "geht, mir, gut, es", "du, wohnst, wo",
  ]);
  assert.deepEqual(A1_DAY5_WORD_ORDER.map(x=>x.answer), [
    "Ich heiße Anna.", "Woher kommen Sie?", "Ich bin 25 Jahre alt.",
    "Ich komme aus Deutschland.", "Meine Telefonnummer ist 123456789.",
    "Entschuldigung, wie heißen Sie?", "Wie geht es dir?", "Wie geht es Ihnen?",
    "Es geht mir gut.", "Mir geht es gut.", "Wo wohnst du?",
  ]);
  assert.equal(A1_DAY5_WORD_ORDER[8].alternative,A1_DAY5_WORD_ORDER[9].answer);
  assert.equal(A1_DAY5_WORD_ORDER[9].alternative,A1_DAY5_WORD_ORDER[8].answer);
  assert.match(uiSource,/Aussage:.*Verb/);
  assert.match(uiSource,/W-Frage:.*Verb/);
  assert.ok(A1_DAY5_WORD_ORDER.some(x=>x.kind==="Aussage"));
  assert.ok(A1_DAY5_WORD_ORDER.some(x=>x.kind==="W-Frage"));
});

test("Day 5 song discovery and exact Lara reading retain the existing UI components", async () => {
  const stages=await stagesForDay5();
  const currentSong=getA1PresenterMusicStage("A1-1.3",5);
  assert.ok(currentSong,"authored Day 5 discovery music stage must still be present");
  assert.equal(getA1PresenterRecording("A1-1.3",5)?.discover,true);
  assert.equal(stages[8].reading?.title,"Sich vorstellen");
  assert.deepEqual(stages[8].reading,getA1PresenterReadingLesson("A1-1.3"));
  assert.equal(stages[8].reading.checks.length,3);
  assert.match(stages[8].reading.textDe,/ich heiße Lara/i);
  assert.match(mediaSource,/<PublishedSongLessonStage/);
  assert.match(mediaSource,/<InlineReadingTranslations/);
  assert.match(mediaSource,/reading\.answers\[index\]/);
  assert.match(mediaSource,/role="tablist"/);
  assert.match(mediaSource,/active==="music"/);
});

test("Day 5 retains original unscored practice routes and five workbook sections", async () => {
  const stages=await stagesForDay5();
  assert.equal(stages[9].grammarUrl,slide.workbookConnection.grammarUrl);
  assert.equal(stages[9].workbookUrl,slide.workbookConnection.workbookUrl);
  assert.equal(stages[9].items.length,6,"one Shared Grammar section plus five Teils");
  assert.deepEqual(stages[9].items.slice(1).map(p=>p.label),[
    "Teil 1 · Articles","Teil 2 · Adjectives",
    "Teil 3 · Personal Information","Teil 4 · Mini Dialogue / W-Fragen", "Teil 5 · Scrambled Sentences",
  ]);
  assert.ok(stages[9].items.every(({detail})=>detail.length>20));
  assert.ok(!stages[9].items.some(p=>/tutor-marked|Hören/i.test(p.label)));
  assert.match(source,/<PresenterSessionTimer/);
  assert.match(source,/<PresenterStudentPicker/);
  assert.match(source,/stage\.day5FinalChallenge \? <A1Day5TeachingStage step="wrapup"/);
});

test("personal information teaches the approved ten terms with bilingual starters and partner questions",()=>{
  assert.deepEqual(A1_DAY5_PERSONAL_INFO.map(x=>x[0]),["Familienname","Vorname","Herkunft","Geburtsort","Adresse","Postleitzahl","Telefonnummer","Familienstand","Kinder","Alter"]);
  assert.ok(A1_DAY5_PERSONAL_INFO.every(x=>x.length===6 && x.every(Boolean) && x[4].endsWith("?")));
  assert.match(uiSource,/function PersonalInformation/);
  assert.match(uiSource,/function PersonalQuestions/);
  assert.match(uiSource,/Satzhilfe/);
  assert.match(uiSource,/Dein Satz/);
  assert.match(uiSource,/selected\.includes\(i\)/);
});

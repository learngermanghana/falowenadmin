import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SWAHILI_DAY_ONE_ADMIN_LESSON } from "../src/data/swahiliTeachingSlides.js";
import { SWAHILI_DAY_SIX_ADMIN_LESSON } from "../src/data/swahiliDaySixTeachingSlides.js";
import {
  SWAHILI_DAY_SIX_FOOD_CARDS,
  SWAHILI_DAY_SIX_DRINK_CARDS,
  SWAHILI_DAY_SIX_RESTAURANT_SCENARIOS
} from "../src/data/swahiliDaySixVisualActivities.js";

const read = path => readFileSync(new URL(path, import.meta.url), "utf8");
const presenter=read("../src/components/SwahiliTeachingSlides.jsx");
const stage=read("../src/components/SwahiliA2LessonStage.jsx");
const challenge=read("../src/components/SwahiliRestaurantScenario.jsx");
const css=read("../src/components/SwahiliTeachingSlides.css");

test("A1 Day 6 reuses the existing stages and puts scenario directly before summary",()=>{
  assert.equal(SWAHILI_DAY_SIX_ADMIN_LESSON.stages.length,15);
  assert.deepEqual(SWAHILI_DAY_SIX_ADMIN_LESSON.stages.map(x=>x.id),[
    "intro","music","listening",
    "radio-first-listening","radio-second-listening","radio-drinks-and-preferences",
    "radio-ordering","radio-write","radio-speak","grammar","reading","speaking","writing","presentation","summary"
  ]);
  const scenario=SWAHILI_DAY_SIX_ADMIN_LESSON.stages.at(-2);
  assert.equal(scenario.type,"scenario");
  assert.equal(scenario.scenarios,SWAHILI_DAY_SIX_RESTAURANT_SCENARIOS);
  assert.equal(SWAHILI_DAY_SIX_ADMIN_LESSON.stages[0].foodCards,SWAHILI_DAY_SIX_FOOD_CARDS);
  assert.equal(SWAHILI_DAY_SIX_ADMIN_LESSON.stages.find(stage => stage.id === "reading").foodCards,SWAHILI_DAY_SIX_FOOD_CARDS);
  assert.equal(SWAHILI_DAY_SIX_ADMIN_LESSON.stages.find(stage => stage.id === "reading").drinkCards,SWAHILI_DAY_SIX_DRINK_CARDS);
  assert.equal(SWAHILI_DAY_ONE_ADMIN_LESSON.stages.length,9);
  assert.equal(SWAHILI_DAY_ONE_ADMIN_LESSON.stages.at(-2).type,"presentation");
});

test("Food photo cards are source-aligned, representative images with visible Commons attribution",()=>{
  assert.deepEqual(SWAHILI_DAY_SIX_FOOD_CARDS.map(c=>c.sw),[
    "Wali kuku","Ugali samaki","Ugali nyama","Pilau nyama"
  ]);
  for(const item of SWAHILI_DAY_SIX_FOOD_CARDS){
    assert.match(item.image,/^https:\/\/commons\.wikimedia\.org\/wiki\/Special:FilePath\//);
    assert.match(item.credit,/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
    assert.ok(item.author);
    assert.ok(item.en);
  }
  assert.deepEqual(SWAHILI_DAY_SIX_DRINK_CARDS.map(c=>c.sw),["Maji","Juisi","Soda"]);
  assert.match(stage,/className="swahili-a2-presenter__food-photo-card"/);
  assert.match(stage,/onError=\{event=>/);
  assert.match(stage,/card\.credit && <a/);
  assert.match(stage,/swahili-a2-presenter__menu-drink/);
});

test("Five ungraded teacher-led restaurant scenarios reuse German A2 model-reveal workflow",()=>{
  assert.deepEqual(SWAHILI_DAY_SIX_RESTAURANT_SCENARIOS.map(s=>s.id),[
    "chicken-rice","no-meat","another-dish","two-people","only-drink"
  ]);
  for(const item of SWAHILI_DAY_SIX_RESTAURANT_SCENARIOS){
    assert.ok(item.steps.length>=4);
    assert.equal(new Set(item.steps.map(step=>step.id)).size,item.steps.length);
    assert.ok(item.steps.every(step=>step.action && step.question && step.answer));
    assert.match(item.steps.at(-1).answer,/bili/);
  }
  assert.match(challenge,/presenter-career-hero/);
  assert.match(challenge,/presenter-career-roadmap/);
  assert.match(challenge,/presenter-career-question/);
  assert.match(challenge,/setRevealed/);
  assert.match(challenge,/Math\.random\(\)/);
  assert.match(challenge,/onClick=\{nextScenario\}/);
  assert.match(challenge,/Teacher-led, ungraded oral practice/);
  assert.doesNotMatch(challenge,/setDoc|addDoc|fetch\(|getDoc|firebase/);
});

test("Responsive photo and scenario layouts are scoped to Swahili without new player or workbook writes",()=>{
  assert.match(stage,/stage\.type==="scenario" && isDaySix/);
  assert.match(css,/\.swahili-a2-presenter__food-cards\.is-compact/);
  assert.match(css,/\.swahili-restaurant-challenge__selectors/);
  assert.match(css,/@media\(max-width:700px\)/);
  assert.match(presenter,/<PresenterStudentPicker/);
  assert.match(presenter,/slide=\{selectedPresenterSlide\}/);
  assert.match(presenter,/<PresenterSessionTimer/);
  assert.match(presenter,/<PresenterActivityTimer/);
  assert.match(stage,/MusicVideoEmbed/);
});

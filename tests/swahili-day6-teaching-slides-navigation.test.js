import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const index = readFileSync(new URL("../src/pages/TeachingSlidesPage.jsx",import.meta.url),"utf8");
const swahili = readFileSync(new URL("../src/components/SwahiliTeachingSlides.jsx",import.meta.url),"utf8");

test("Teaching Slides root offers a direct Day 6 presenter link even when German is selected",()=>{
 const chooser=index.indexOf('aria-label="Teaching language"');
 const shortcut=index.indexOf('aria-label="Quick access to Kiswahili A1 Lesson 6"');
 const branch=index.indexOf('language === "swahili" ?');
 assert.ok(chooser>=0 && chooser<shortcut && shortcut<branch,"root quick link must be outside language filter");
 assert.match(index,/Swahili A1 · Day 6 — Mgahawani · Present/);
 assert.match(index,/\/teaching-slides\/course\/SWAHILI\/swahili-day-6\?present=1/);
});
test("Swahili filter lists Days 1 and 6 with working Open and Present links",()=>{
 for(const day of [1,6]){
   assert.match(index,new RegExp(`Open Day ${day}`));
   assert.match(index,new RegExp(`/teaching-slides/course/SWAHILI/swahili-day-${day}\\?present=1`));
 }
 assert.match(index,/Days 2–5 have not been published/);
 assert.doesNotMatch(index,/Day 1: Alfabeti, sauti na matamshi · 10 classroom presentation slides/);
 assert.match(swahili,/daySixRoot \+ "\?present=1"/);
});

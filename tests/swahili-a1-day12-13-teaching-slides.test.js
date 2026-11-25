import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { swahiliSlidePacks } from "../src/data/swahiliSlidePacks.js";
import { SWAHILI_DAY_ELEVEN_ADMIN_LESSON as day11 } from "../src/data/swahiliDayElevenTeachingSlides.js";
import { SWAHILI_DAY_TWELVE_ADMIN_LESSON as day12, SWAHILI_DAY_THIRTEEN_ADMIN_LESSON as day13 } from "../src/data/swahiliDayTwelveThirteenTeachingSlides.js";
const keys=JSON.parse(readFileSync(new URL("../functions/swahili-answers.json",import.meta.url),"utf8"));
const presenter=readFileSync(new URL("../src/components/SwahiliTeachingSlides.jsx",import.meta.url),"utf8");
for (const lesson of [day12,day13]) {
 test(`A1 Day ${lesson.dayNumber} uses the existing classroom flow and its own workbook`,()=>{
  assert.ok(swahiliSlidePacks.A1.includes(lesson));
  assert.deepEqual(lesson.stages.map(s=>s.id),day11.stages.map(s=>s.id));
  assert.equal(lesson.stages.find(s=>s.id==="grammar").details.length,6);
  assert.ok(lesson.stages.find(s=>s.id==="grammar").details.every(s=>s.rule&&s.body&&s.question&&s.answer));
  assert.match(presenter,/calendarRoutinePresenters\[slideId\]/);
  assert.ok(lesson.stages.find(s=>s.id==="listening").listeningWorkbookUrl.endsWith(`day-${lesson.dayNumber}?view=hoeren`));
 });
 test(`Day ${lesson.dayNumber} uses the correct media slots and tutor references`,()=>{
  const music = lesson.stages.find(s => s.id === "music");
  if (lesson.dayNumber === 12) {
   assert.equal(music.type, "music");
   assert.equal(music.audio.id, "swahili-a1-day-12");
   const radio = lesson.stages.find(s => s.id === "radio");
   assert.equal(radio.type, "radio-questions");
   assert.equal(radio.radioVideoId, "QdpRliUlbMA");
   assert.deepEqual(radio.radioActivities.map(group => group.activities.length), [2, 2, 1]);
   assert.ok(radio.radioActivities.flatMap(group => group.activities).every(activity => activity.answer));
   assert.equal(music.audio.objectKey, "swahili/music/A1/day-12/Angalia Kalenda.mp3.mpeg");
  }
  for(const id of lesson.dayNumber === 12 ? ["ai-video"] : ["ai-video","music","radio"]) {
   const s=lesson.stages.find(s=>s.id===id);
   assert.equal(s.type,"media-pending");
   assert.equal(s.status,"pending-media");
   assert.ok(!s.audio&&!s.videoId&&!s.radioVideoId);
  }
  const ref=keys[lesson.id];
  for(const [section,id] of [["reading","reading"],["listening","listening"]]) {
   const s=lesson.stages.find(s=>s.id===id);
   for(const q of Object.values(ref[section])) assert.ok(s.notes.includes(q.prompt)&&s.notes.includes(q.answer));
  }
  assert.ok(lesson.stages.find(s=>s.id==="listening").notes.includes(lesson.stages.find(s=>s.id==="dialogue").content));
  assert.match(lesson.stages.find(s=>s.id==="listening").kicker,/Recorded listening/);
  assert.equal(lesson.stages.find(s=>s.id==="writing").answer,ref.writing.Kuandika);
 });
}

import test from "node:test";
import assert from "node:assert/strict";
import { lessonGrammarAudioScript } from "../src/utils/lessonGrammarAudioScript.js";
import { parseGrammarAudioScript, planGrammarAudio } from "../src/utils/grammarAudio.js";
import { getGrammarAudioLessonCatalog } from "../src/utils/grammarAudioLessonCatalog.js";
import { getSlidesByCourse } from "../src/data/teachingSlides.js";

test("complete A1 Day 2 stays one lesson under speech limits", () => {
  const script = lessonGrammarAudioScript([
    {course:"A1",day:"Day 2",assignmentId:"A1-0.2_1.1",title:"Alphabet, Personalpronomen und erste Verben"}
  ]);
  const plan = planGrammarAudio(parseGrammarAudioScript(script));
  assert.ok(script.length < 6500);
  assert.ok(plan.filter(x=>x.type==="speech").length <= 36);
  assert.equal((script.match(/herzlich willkommen/gi)||[]).length, 1);
  assert.equal((script.match(/Bis zum nächsten Mal/gi)||[]).length, 1);
  assert.ok(script.includes("ich, du, er, sie, es, wir, ihr, sie, Sie"));
  assert.ok(!script.includes("Willkommen zurück"));
});

test("individual course lessons produce a short bilingual draft", () => {
  const script = lessonGrammarAudioScript({
    course:"A2", day:"Day 6", title:"Two-way prepositions",
    teacherSupport:{grammarFocusEn:["Explain location versus direction."],modelExamplesDe:["Ich bin in der Küche.","Ich gehe in die Küche."]}
  });
  assert.ok(planGrammarAudio(parseGrammarAudioScript(script)).filter(x=>x.type==="speech").length<=36);
  assert.ok(script.includes("DE: Ich bin in der Küche."));
});

test("A1 Day 2 resolves the canonical combined lesson and produces the full three-topic script", () => {
  const catalog = getGrammarAudioLessonCatalog(getSlidesByCourse);
  const day2 = catalog.filter(item => item.course === "A1" && item.day === 2);
  assert.equal(day2.length, 1, "One official Day 2 selection, no retired duplicates");
  assert.deepEqual(day2[0].assignments, ["A1-0.2_1.1"]);
  assert.deepEqual(day2[0].lessons.map(item => item.assignmentId), ["A1-0.2_1.1"]);
  const script = lessonGrammarAudioScript(day2[0].lessons);
  assert.match(script, /German alphabet/);
  assert.match(script, /personal pronouns/i);
  assert.match(script, /regular verb lernen/i);
  assert.match(script, /du lernst/);
  assert.match(script, /ihr lernt/);
  assert.match(script, /capital Sie/);
  assert.doesNotMatch(script, /articles der, die, das|Day 3/);
  assert.equal((script.match(/herzlich willkommen/g) || []).length, 1);
  assert.equal((script.match(/Bis zum nächsten Mal/g) || []).length, 1);
  assert.ok(script.length <= 6500);
  assert.ok(planGrammarAudio(parseGrammarAudioScript(script)).filter(item => item.type === "speech").length <= 36);
});

test("A1 Day 3 stays separate in dictionary audio selection", () => {
  const catalog = getGrammarAudioLessonCatalog(getSlidesByCourse);
  const day3 = catalog.filter(item => item.course === "A1" && item.day === 3);
  assert.equal(day3.length, 1);
  assert.deepEqual(day3[0].assignments, ["A1-1.2"]);
  assert.ok(day3[0].lessons.every(item => item.assignmentId !== "A1-0.2_1.1"));
});

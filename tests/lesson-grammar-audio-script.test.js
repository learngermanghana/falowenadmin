import test from "node:test";
import assert from "node:assert/strict";
import { lessonGrammarAudioScript } from "../src/utils/lessonGrammarAudioScript.js";
import { parseGrammarAudioScript, planGrammarAudio } from "../src/utils/grammarAudio.js";

test("complete A1 Day 2 stays one lesson under speech limits", () => {
  const script = lessonGrammarAudioScript([
    {course:"A1",day:"Day 2",title:"Deutsches Alphabet"},
    {course:"A1",day:"Day 2",title:"Personalpronomen und Verbkonjugation"}
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

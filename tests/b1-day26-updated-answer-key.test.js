import test from "node:test";
import assert from "node:assert/strict";
import dictionary from "../src/data/answers_dictionary.json" with { type: "json" };
import { getB1WritingTaskSpec } from "../src/data/b1WritingTaskSpecs.js";
import { evaluateB1WritingTaskEvidence } from "../src/utils/b1WritingTaskEvidence.js";
import { validateAnswerEntry } from "../src/utils/answerKeyIntegrity.js";

const [label,entry]=Object.entries(dictionary).find(([,row])=>row.assignment_id==="B1-9.26");

test("B1 Day 26 has matching A C B E Lesen answers and no obsolete seven-question key",()=>{
 assert.deepEqual(Object.values(entry.answers.teil3).map(x=>x[0]),["A","C","B","E"]);
 assert.equal(Object.keys(entry.answers.teil3).length,4);
 assert.deepEqual(entry.expectedParts,["teil2","teil3","teil4"]);
 assert.deepEqual(entry.writingParts,["teil2"]);
 assert.deepEqual(entry.aiGradedParts,["teil2"]);
 assert.deepEqual(entry.referenceAnswerParts,["teil3","teil4"]);
 assert.equal(validateAnswerEntry(label,entry).errors.length,0);
});

test("B1 Day 26 marks five Richtig/Falsch items A B B B A",()=>{
 assert.deepEqual(Object.values(entry.answers.teil4).map(x=>x[0]),["A","B","B","B","A"]);
 assert.equal(entry.partGrading.teil4.gradingMode,"answer_key");
 assert.match(entry.partGrading.teil4.instruction,/b1\/day-26\/day-26\.mp3/);
});

test("B1 Day 26 marks the forum response to Markus, not a personal letter",()=>{
 const task=getB1WritingTaskSpec("B1-9.26");
 assert.equal(task.textType,"opinion_essay");
 assert.equal(task.register,"neutral");
 assert.equal(task.taskPoints.length,3);
 assert.match(task.taskText,/Markus/i);
 assert.doesNotMatch(task.taskText,/Max or Lisa/);
 const text="Meiner Meinung nach sollte man trotz Verspätungen weiter reisen. Einmal habe ich meinen Koffer verloren. Das war sehr stressig, weil ich lange warten musste. Deshalb sollte man den Fahrplan vorher prüfen und einen Zeitpuffer einplanen. Man könnte außerdem den Kundenservice kontaktieren.";
 const evidence=evaluateB1WritingTaskEvidence(task,text);
 assert.deepEqual(evidence.map(x=>x.status),["met","met","met"]);
});

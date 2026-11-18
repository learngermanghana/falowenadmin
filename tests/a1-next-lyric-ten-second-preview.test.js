import test from "node:test";
import assert from "node:assert/strict";
import {threeVerifiedNextLyricQuestions} from "../src/utils/nextLyricQuestions.js";

const lines=Array.from({length:16},(_,i)=>"Hier ist die einzigartige Zeile "+String(i+1)+".");
const cues=lines.map((text,i)=>({text,start:i*3,end:i*3+2.8}));
const pack={questionEndings:[lines[7],lines[10],lines[13]],objectKey:"music/a1/day-99/verified.mp3",lyrics:lines.join("\n"),cues,timingStatus:"audio-aligned",transcriptionStatus:"reviewed",referenceOnly:false};
const recording={objectKey:pack.objectKey};

test("next-lyric quiz leads in for approximately ten seconds and never leaks the answer",()=>{
 const questions=threeVerifiedNextLyricQuestions(pack,recording);
 assert.equal(questions.length,3);
 for(const q of questions){
  const index=lines.indexOf(q.evidence);
  assert.equal(q.answer,lines[index+1]);
  assert.ok(q.previewRange.end-q.previewRange.start>=9.5);
  assert.ok(q.previewRange.end-q.previewRange.start<=11);
  assert.ok(q.previewRange.end<q.continuationRange.start);
  assert.equal(q.options.length,3);
  assert.equal(q.options[q.correctIndex],q.answer);
  assert.equal(q.options.filter(x=>x===q.answer).length,1);
  assert.equal(new Set(q.options).size,3);
 }
});

test("unverified recordings cannot produce multiple-choice lyric predictions",()=>{
 for(const altered of [
  {...pack,objectKey:"music/a1/day-99/other.mp3"},
  {...pack,transcriptionStatus:"automatic"},
  {...pack,timingStatus:"estimated"},
  {...pack,referenceOnly:true},
  {...pack,cues:cues.slice(0,8)},
 ]) assert.deepEqual(threeVerifiedNextLyricQuestions(altered,recording),[]);
});

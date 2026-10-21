import test from "node:test";
import assert from "node:assert/strict";
import {MOCK_LEVELS,MOCK_SECTIONS,newMockDraft,validateMockDraft,exportMockDraft} from "../src/utils/mockFactoryDraft.js";

for(const level of MOCK_LEVELS){
 test(`${level}: new mock creates four private sections with locked release checks`,()=>{
  const draft=newMockDraft(level,3);
  assert.equal(draft.id,`${level.toLowerCase()}-mock-03`);
  assert.equal(draft.status,"draft");
  assert.deepEqual(Object.keys(draft.sections),MOCK_SECTIONS);
  assert.ok(validateMockDraft(draft).some(s=>/live backend deployment/.test(s)));
  assert.ok(JSON.parse(exportMockDraft(draft)).status==="draft");
 });
}

test("A2 Mock 3 detects missing listening audio, keys and saved student results",()=>{
 const draft=newMockDraft("A2",3);
 const errors=validateMockDraft(draft).join(" | ");
 assert.match(errors,/hoeren: verify R2 audio/);
 assert.match(errors,/hoeren: add the answer count/);
 assert.match(errors,/hoeren: attach the server answer-key draft/);
 assert.match(errors,/student result/);
 assert.match(errors,/idempotent result recovery/);
});
test("no draft may masquerade as a directly published mock",()=>{
 const draft=newMockDraft("C2",1);
 draft.status="published";
 assert.match(validateMockDraft(draft).join(" "),/Only draft\/review/);
 const exported=JSON.parse(exportMockDraft(draft));
 assert.equal(exported.status,"draft");
});
test("complete teacher checklist does not create publication permission",()=>{
 const draft=newMockDraft("B1",4);
 for(const name of MOCK_SECTIONS){
  const count=name==="sprechen"?3:name==="schreiben"?2:3;
  draft.sections[name]={...draft.sections[name],ready:true,questionCount:count,
   tasksJson:JSON.stringify(Array.from({length:count},(_,i)=>({id:String(i+1),prompt:"A task"}))),
   answerKeyCount:count,answerKeyJson:JSON.stringify(Object.fromEntries(Array.from({length:count},(_,i)=>[String(i+1),"a"]))),
   answerKeyVerified:true,audioVerified:true,audioManifestJson:'[{"objectKey":"mock-hoeren/mock-04/teil-1.mp3"}]',rubricVerified:true};
 }
 for(const key of Object.keys(draft.qa))draft.qa[key]=true;
 assert.deepEqual(validateMockDraft(draft),[]);
 assert.equal(exportMockDraft(draft).includes('"status": "draft"'),true);
});

test("an empty 0/0 key count is never treated as a valid objective section",()=>{
 const draft=newMockDraft("A2",3);
 draft.sections.hoeren.questionCount=0;
 draft.sections.hoeren.answerKeyCount=0;
 assert.match(validateMockDraft(draft).join(" | "),/hoeren: add the answer count/);
 draft.sections.hoeren.questionCount=20;
 draft.sections.hoeren.answerKeyCount=19;
 assert.match(validateMockDraft(draft).join(" | "),/hoeren: answer count does not match questions/);
 draft.sections.hoeren.answerKeyCount=20;
 assert.doesNotMatch(validateMockDraft(draft).join(" | "),/hoeren: add the answer count|hoeren: answer count does not match questions/);
});

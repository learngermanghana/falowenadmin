import test from "node:test";
import assert from "node:assert/strict";
import { validateApplication, buildTeacherEmailBatch, confirmedTeacherEmailBatch } from "../api/teacher-applications.js";
const sample={name:"Example Teacher",email:"Teacher@example.com",country:"Ghana",languages:"German",levels:["A1","A2","A1"],qualifications:"C1",experience:"Two years",availability:"GMT evenings",rate:"15 EUR/hour",videoUrl:"https://youtu.be/example",consent:true,website:""};
test("teacher application normalizes email and levels, ignores privileged fields",()=>{const item=validateApplication({...sample,status:"approved",notes:"injected"});assert.equal(item.email,"teacher@example.com");assert.equal(item.levels,"A1, A2");assert.equal(item.status,undefined);assert.equal(item.notes,undefined);});
test("teacher application rejects unsafe links, missing consent, invalid levels and oversized fields",()=>{for(const patch of [{videoUrl:"javascript:alert(1)"},{videoUrl:"https://youtu.be.evil.example/a"},{videoUrl:"https://user:pass@youtu.be/a"},{consent:false},{levels:[]},{levels:["Z1"]},{experience:"x".repeat(2001)},{website:"spam"},{email:"invalid"}]) assert.throws(()=>validateApplication({...sample,...patch}));});

test("teacher email batch is explicit, safe, fixed-owner and stable",()=>{
 const item={...validateApplication(sample),id:"a".repeat(64),createdAt:"2026-11-28T10:00:00Z"};
 const batch=buildTeacherEmailBatch(item,"owner@example.com");
 assert.equal(batch.rows.length,2);
 assert.equal(batch.rows[0].email,"teacher@example.com");
 assert.equal(batch.rows[1].email,"owner@example.com");
 assert.equal(batch.rows[1].link,"https://admin.falowen.app/teacher-applications");
 assert.notEqual(batch.rows[0].event_id,batch.rows[1].event_id);
 assert.deepEqual(batch,buildTeacherEmailBatch(item,"owner@example.com"));
 assert.notEqual(batch.event_id,buildTeacherEmailBatch({...item,createdAt:"2026-11-29T10:00:00Z"},"owner@example.com").event_id);
 for(const row of batch.rows)assert.equal(row.attach_certificate,"FALSE");
 for(const email of ["a,b@example.com","=a@example.com","a;b@example.com","a\n@example.com"])assert.throws(()=>validateApplication({...sample,email}));
});
test("both announcement rows must be confirmed, including duplicates",()=>{
 for(const receipt of [{ok:true,count:2},{ok:true,count:1,duplicates:1},{ok:true,count:0,duplicates:2}])assert.equal(confirmedTeacherEmailBatch(receipt),true);
 for(const receipt of [{ok:true},{ok:true,count:1},{ok:false,count:2},{ok:true,count:3}])assert.equal(confirmedTeacherEmailBatch(receipt),false);
});

import test from "node:test";
import assert from "node:assert/strict";
import { validateApplication } from "../api/teacher-applications.js";
const sample={name:"Example Teacher",email:"Teacher@example.com",country:"Ghana",languages:"German",levels:["A1","A2","A1"],qualifications:"C1",experience:"Two years",availability:"GMT evenings",rate:"15 EUR/hour",videoUrl:"https://youtu.be/example",consent:true,website:""};
test("teacher application normalizes email and levels, ignores privileged fields",()=>{const item=validateApplication({...sample,status:"approved",notes:"injected"});assert.equal(item.email,"teacher@example.com");assert.equal(item.levels,"A1, A2");assert.equal(item.status,undefined);assert.equal(item.notes,undefined);});
test("teacher application rejects unsafe links, missing consent, invalid levels and oversized fields",()=>{for(const patch of [{videoUrl:"javascript:alert(1)"},{videoUrl:"https://youtu.be.evil.example/a"},{videoUrl:"https://user:pass@youtu.be/a"},{consent:false},{levels:[]},{levels:["Z1"]},{experience:"x".repeat(2001)},{website:"spam"},{email:"invalid"}]) assert.throws(()=>validateApplication({...sample,...patch}));});

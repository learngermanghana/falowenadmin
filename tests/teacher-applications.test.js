import test from "node:test";
import assert from "node:assert/strict";
import handler, { validateApplication, newApplicationCountQuery, parseNewApplicationCount } from "../api/teacher-applications.js";
const sample={name:"Example Teacher",email:"Teacher@example.com",country:"Ghana",languages:"German",levels:["A1","A2","A1"],qualifications:"C1",experience:"Two years",availability:"GMT evenings",rate:"15 EUR/hour",videoUrl:"https://youtu.be/example",consent:true,website:""};
test("teacher application normalizes email and levels, ignores privileged fields",()=>{const item=validateApplication({...sample,status:"approved",notes:"injected"});assert.equal(item.email,"teacher@example.com");assert.equal(item.levels,"A1, A2");assert.equal(item.status,undefined);assert.equal(item.notes,undefined);});
test("teacher application rejects unsafe links, missing consent, invalid levels and oversized fields",()=>{for(const patch of [{videoUrl:"javascript:alert(1)"},{videoUrl:"https://youtu.be.evil.example/a"},{videoUrl:"https://user:pass@youtu.be/a"},{consent:false},{levels:[]},{levels:["Z1"]},{experience:"x".repeat(2001)},{website:"spam"},{email:"invalid"}]) assert.throws(()=>validateApplication({...sample,...patch}));});

test("new application counter queries only new status via aggregation",()=>{
 const {structuredAggregationQuery:q}=newApplicationCountQuery();
 assert.deepEqual(q.structuredQuery.from,[{collectionId:"falowenTeacherApplications"}]);
 assert.deepEqual(q.structuredQuery.where.fieldFilter,{field:{fieldPath:"status"},op:"EQUAL",value:{stringValue:"new"}});
 assert.deepEqual(q.aggregations,[{alias:"newCount",count:{}}]);
});
test("aggregation decodes real zero and counts; missing/malformed counts fail",()=>{
 for(const count of ["0","8","120"])assert.equal(parseNewApplicationCount([{result:{aggregateFields:{newCount:{integerValue:count}}}}]),Number(count));
 for(const rows of [[],{},[{result:{aggregateFields:{newCount:{integerValue:"-1"}}}}],[{result:{aggregateFields:{newCount:{integerValue:"9007199254740992"}}}}]])assert.throws(()=>parseNewApplicationCount(rows));
});
test("anonymous count is denied before accessing Firestore",async()=>{
 let status,data;const res={setHeader(){},status(n){status=n;return this;},json(v){data=v;return this;}};
 await handler({method:"GET",url:"/api/teacher-applications?view=count",query:{view:"count"},headers:{}},res);
 assert.equal(status,401);assert.equal(data.ok,false);assert.equal(data.newCount,undefined);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {build} from 'esbuild';
import {JSDOM} from 'jsdom';
import React,{act,StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter} from 'react-router-dom';
const require=createRequire(import.meta.url);
const bundle=await build({entryPoints:['src/components/DashboardReviewNotifications.jsx'],bundle:true,write:false,format:'cjs',jsx:'automatic',platform:'node',packages:'external',plugins:[{name:'notification-double',setup(b){
 b.onResolve({filter:/dashboardReviewNotifications\.js$/},args=>({path:args.path,namespace:'fake'}));
 b.onLoad({filter:/.*/,namespace:'fake'},()=>({contents:'export const loadDashboardExamNotifications = () => globalThis.loadExamAlerts(); export const loadDashboardAiNotifications = () => globalThis.loadAiAlerts();',loader:'js'}));
}}]});
async function mount({failure=false,user={uid:'owner'}}={}){
 const dom=new JSDOM('<div id="root"></div>',{url:'https://admin.falowen.app'});globalThis.window=dom.window;globalThis.document=dom.window.document;globalThis.IS_REACT_ACT_ENVIRONMENT=true;
 let examCalls=0,aiCalls=0;
 globalThis.loadExamAlerts=async()=>{examCalls++;if(failure)throw new Error('Exam snapshot unavailable');return {sampled:25,capped:true,rows:[{id:'exam',name:'Exam learner',level:'A2',title:'Lesen',percent:40}]};};
 globalThis.loadAiAlerts=async()=>{aiCalls++;return {sampled:25,capped:true,rows:Array.from({length:8},(_,id)=>({id:String(id),studentName:'AI learner '+id,assignmentId:'A2-8.21'}))};};
 const module={exports:{}};new Function('require','module','exports',bundle.outputFiles[0].text)(require,module,module.exports);
 const root=createRoot(document.getElementById('root'));const render=()=>root.render(React.createElement(StrictMode,null,React.createElement(MemoryRouter,null,React.createElement(module.exports.default,{user}))));
 await act(async()=>render());return {get calls(){return [examCalls,aiCalls];},text:()=>document.body.textContent,async rerender(){await act(async()=>render());},async close(){await act(async()=>root.unmount());dom.window.close();}};
}
test('exam and AI snapshots load only once per open, including StrictMode replay',async()=>{const page=await mount();try{await page.rerender();assert.deepEqual(page.calls,[1,1]);assert.match(page.text(),/8 needing review in this snapshot of 25/);assert.equal(document.querySelectorAll('li').length,6);assert.ok(document.querySelector('a[href="/marking?tab=automatic"]'));assert.ok(document.querySelector('a[href="/exam-tracking"]'));}finally{await page.close();}});
test('failure of exam alerts leaves the AI queue visible and does not claim zero exams',async()=>{const page=await mount({failure:true});try{assert.match(document.querySelector('[role=alert]').textContent,/Exam snapshot unavailable/);assert.match(page.text(),/AI learner 0/);assert.doesNotMatch(page.text(),/No practice scores below/);}finally{await page.close();}});
test('signed-out homepage makes no snapshot reads',async()=>{const page=await mount({user:null});try{assert.deepEqual(page.calls,[0,0]);}finally{await page.close();}});
const serviceBundle=await build({entryPoints:['src/services/dashboardReviewNotifications.js'],bundle:true,write:false,format:'cjs',platform:'node',packages:'external',plugins:[{name:'firestore-double',setup(b){
 b.onResolve({filter:/^firebase\/firestore$|\/firebase\.js$/},args=>({path:args.path,namespace:'fake'}));
 b.onLoad({filter:/.*/,namespace:'fake'},args=>({contents:args.path==='firebase/firestore'?`export const {collection,getDocs,limit,orderBy,query,where}=globalThis.notificationDb;`:'export const db={};',loader:'js'}));
}}]});
function service(){let queries=[];globalThis.notificationDb={collection:(_db,name)=>name,limit:n=>({limit:n}),where:(field,op,value)=>({field,op,value}),orderBy:(field,direction)=>({field,direction}),query:(name,...constraints)=>({name,constraints}),getDocs:async q=>{queries.push(q);const rows=q.name==='scores'?[{source:'exam_room_practice',examSection:'lesen',level:'A2',percent:0,studentName:'Zero'},{source:'exam_room_practice',examSection:'lesen',level:'A2',percent:80},{source:'exam_room_practice',examSection:'lesen',level:'A2',percent:null}]:[{source:'automatic_course_marking',sentToStudent:false},{source:'automatic_course_marking',sentToStudent:true},{source:'automatic_course_marking',reviewClosedAt:'2026-11-05'},{source:'manual'}];return {size:rows.length,docs:rows.map((row,i)=>({id:String(i),data:()=>row}))};}};
 const module={exports:{}};new Function('require','module','exports',serviceBundle.outputFiles[0].text)(require,module,module.exports);return {api:module.exports,queries};}
test('two capped database queries filter zero exam marks and unpublished AI work without joins',async()=>{const s=service();const exam=await s.api.loadDashboardExamNotifications(),ai=await s.api.loadDashboardAiNotifications();assert.equal(exam.rows.length,1);assert.equal(exam.rows[0].percent,0);assert.equal(ai.rows.length,1);assert.equal(s.queries.length,2);for(const q of s.queries)assert.ok(q.constraints.some(c=>c.limit===25));assert.ok(s.queries[0].constraints.some(c=>c.field==='source'&&c.value==='exam_room_practice'));assert.ok(s.queries[1].constraints.some(c=>c.field==='createdAt'&&c.direction==='desc'));});

import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {build} from 'esbuild';
import {JSDOM} from 'jsdom';
import React,{act,StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter} from 'react-router-dom';
const require=createRequire(import.meta.url);
const bundle=await build({entryPoints:['src/components/DashboardPartnershipRequests.jsx'],bundle:true,write:false,format:'cjs',jsx:'automatic',platform:'node',packages:'external',plugins:[{name:'request-double',setup(b){
 b.onResolve({filter:/organisationEnrolmentRequest\.js$/},args=>({path:args.path,namespace:'fake'}));
 b.onLoad({filter:/.*/,namespace:'fake'},()=>({contents:'export const organisationEnrolmentRequest = (...args) => globalThis.dashboardRequest(...args);',loader:'js'}));
}}]});
async function mount({user={uid:'owner',email:'moxflex@gmail.com',emailVerified:true,getIdToken:async()=> 'owner-token'},data={rows:[]},failure=null}={}){
 const dom=new JSDOM('<div id="root"></div>',{url:'https://admin.falowen.app'});globalThis.window=dom.window;globalThis.document=dom.window.document;globalThis.IS_REACT_ACT_ENVIRONMENT=true;
 let calls=0;globalThis.dashboardRequest=async(path,body,options)=>{calls++;assert.equal(path,'admin/referrals/applications');assert.equal(body,null);assert.equal(options.staff,true);assert.equal(await options.getToken(),'owner-token');if(failure)throw new Error(failure);return data;};
 const module={exports:{}};new Function('require','module','exports',bundle.outputFiles[0].text)(require,module,module.exports);
 const root=createRoot(document.getElementById('root'));const render=()=>root.render(React.createElement(StrictMode,null,React.createElement(MemoryRouter,null,React.createElement(module.exports.default,{user}))));
 await act(async()=>render());
 return {get calls(){return calls;},text:()=>document.body.textContent,async rerender(){await act(async()=>render());},async close(){await act(async()=>root.unmount());dom.window.close();}};
}
test('owner panel loads once even with StrictMode replay and rerender',async()=>{const page=await mount();try{assert.equal(page.calls,1);await page.rerender();assert.equal(page.calls,1);assert.match(page.text(),/No pending partnerships in this recent batch/);}finally{await page.close();}});
test('partnership preview filters pending organisations and limits visible rows',async()=>{const page=await mount({data:{rows:[...Array.from({length:7},(_,id)=>({id:String(id),kind:'institutional',status:'pending',name:'Pending '+id})),{id:'approved',kind:'institutional',status:'approved',name:'Approved'},{id:'legacy',kind:'referral',status:'pending',name:'Legacy'}],cursor:'older'}});try{assert.match(page.text(),/7 pending partnership requests in the latest 9 applications/);assert.equal(document.querySelectorAll('li').length,5);assert.doesNotMatch(page.text(),/Approved|Legacy/);assert.match(page.text(),/older requests/);}finally{await page.close();}});
test('staff and unverified sessions do not fetch owner-only requests',async()=>{for(const user of [{uid:'staff',email:'staff@falowen.app',emailVerified:true},{uid:'owner',email:'moxflex@gmail.com',emailVerified:false}]){const page=await mount({user});try{assert.equal(page.calls,0);assert.equal(page.text(),'');}finally{await page.close();}}});
test('a failed load is displayed as an error, never as zero pending requests',async()=>{const page=await mount({failure:'Service unavailable'});try{assert.match(document.querySelector('[role=alert]').textContent,/Service unavailable/);assert.doesNotMatch(page.text(),/0 pending|No pending/);}finally{await page.close();}});

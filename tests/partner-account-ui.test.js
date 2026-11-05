import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {build} from 'esbuild';
import {JSDOM} from 'jsdom';
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
const require=createRequire(import.meta.url);
const bundle=await build({entryPoints:['src/components/PartnerAccount.jsx'],bundle:true,write:false,format:'cjs',jsx:'automatic',platform:'node',packages:'external',loader:{'.css':'empty'},plugins:[{name:'fake-auth',setup(b){
 b.onResolve({filter:/^firebase\/auth$|organisationPartnerAccount\.js$/},args=>({path:args.path,namespace:'fake'}));
 b.onLoad({filter:/.*/,namespace:'fake'},args=>({contents:args.path==='firebase/auth'?`export const {onAuthStateChanged,signInWithEmailAndPassword,createUserWithEmailAndPassword,sendEmailVerification,sendPasswordResetEmail,reload,signOut}=globalThis.partnerMock;`:`export const {partnerAuth,partnerRequest,downloadPartnerAgreement}=globalThis.partnerMock;`,loader:'js'}));
}}]});
async function render({verified=true,profile=null}={}) {
 const dom=new JSDOM('<div id="root"></div>',{url:'https://www.falowen.app/partnerships'});
 globalThis.window=dom.window;globalThis.document=dom.window.document;globalThis.IS_REACT_ACT_ENVIRONMENT=true;
 const current={uid:'partner',email:'partner@example.test',emailVerified:verified,getIdToken:async()=> 'token'};
 const calls=[];globalThis.partnerMock={partnerAuth:{currentUser:current},onAuthStateChanged:(_a,fn)=>{fn(current);return()=>{};},partnerRequest:async(path)=>{calls.push(path);if(!profile)throw Object.assign(new Error('not linked'),{status:404});return {profile};},downloadPartnerAgreement:async()=>{},signInWithEmailAndPassword:async()=>{},createUserWithEmailAndPassword:async()=>{},sendEmailVerification:async()=>{},sendPasswordResetEmail:async()=>{},reload:async()=>{},signOut:async()=>{}};
 const module={exports:{}};new Function('require','module','exports',bundle.outputFiles[0].text)(require,module,module.exports);
 const root=createRoot(document.getElementById('root'));
 return {calls,async mount(enrolment){await act(async()=>{root.render(React.createElement(module.exports.default,{enrolment,children:()=>React.createElement('p',null,'PRIVATE STUDENT FORM')}));});},text:()=>document.body.textContent,async close(){await act(async()=>root.unmount());dom.window.close();}};
}
test('unverified partner never fetches company details or mounts student form',async()=>{const page=await render({verified:false});try{await page.mount(true);assert.match(page.text(),/Verify your partner email/);assert.doesNotMatch(page.text(),/PRIVATE STUDENT FORM/);assert.deepEqual(page.calls,[]);}finally{await page.close();}});
test('pending agreement blocks student form while showing saved profile',async()=>{const page=await render({profile:{id:'fixed',name:'School',email:'partner@example.test',agreement:{status:'pending'}}});try{await page.mount(true);assert.match(page.text(),/needs Falowen approval/);assert.doesNotMatch(page.text(),/PRIVATE STUDENT FORM/);}finally{await page.close();}});
test('approved partner can add students but is never asked to re-sign',async()=>{const page=await render({profile:{id:'fixed',name:'School',email:'partner@example.test',agreement:{status:'approved'}}});try{await page.mount(true);assert.match(page.text(),/PRIVATE STUDENT FORM/);await page.mount(false);assert.doesNotMatch(page.text(),/PRIVATE STUDENT FORM/);assert.match(page.text(),/No need|Your organisation is approved/);}finally{await page.close();}});
test('unlinked verified login offers registration and existing-profile activation guidance',async()=>{const page=await render();try{await page.mount(true);assert.match(page.text(),/activate that existing profile/);assert.doesNotMatch(page.text(),/PRIVATE STUDENT FORM/);}finally{await page.close();}});

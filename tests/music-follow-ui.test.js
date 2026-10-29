import test from 'node:test';
import assert from 'node:assert/strict';
import Module from 'node:module';
import {resolve} from 'node:path';
import {buildSync} from 'esbuild';
import {JSDOM} from 'jsdom';
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {getCuratedMusicByAssignment} from '../src/data/curatedLessonMusic.js';
function component(path){
 const code=buildSync({entryPoints:[path],bundle:true,platform:'node',format:'cjs',packages:'external',jsx:'automatic',loader:{'.css':'empty'},write:false}).outputFiles[0].text;
 const m=new Module(resolve('tests/compiled-music-test.cjs'));m.paths=Module._nodeModulePaths(process.cwd());m._compile(code,resolve('tests/compiled-music-test.cjs'));return m.exports.default;
}
const Published=component('src/components/PublishedSongLessonStage.jsx');
const Linked=component('src/components/LinkedPublishedSongLessonStage.jsx');
for(const [level,day,assignmentKey] of [['A1',14,'A1-3.6'],['A2',18,'A2-7.18'],['B1',24,'B1-8.24']]){
 test(level+' slide follows playback, seek and repeat; questions select and reveal',async()=>{
  const dom=new JSDOM('<div id="root"></div>',{url:'https://admin.falowen.app'});const w=dom.window;
  Object.assign(globalThis,{window:w,document:w.document,localStorage:w.localStorage,IS_REACT_ACT_ENVIRONMENT:true});
  w.matchMedia=()=>({matches:true});let scrolls=0;
  w.HTMLElement.prototype.scrollTo=function({top}){scrolls++;this.scrollTop=top;};
  w.HTMLElement.prototype.getBoundingClientRect=function(){return {top:Number(this.dataset.line||0)*120};};
  Object.defineProperty(w.HTMLElement.prototype,'clientHeight',{get(){return 80;}});
  const recording=level==='B1'?{objectKey:'music/b1/day-24/Weniger kaufen.mp3'}:getCuratedMusicByAssignment(assignmentKey);
  const lyrics=['Heute fahren wir gemeinsam nach Berlin.','Am Bahnhof wartet unser guter Freund.','Heute fahren wir gemeinsam nach Berlin.'];
  const pack={objectKey:recording.objectKey,lyrics:lyrics.join('\n'),cues:lyrics.map((text,i)=>({start:10+i*5,end:14+i*5,text}))};
  globalThis.fetch=async url=>({ok:true,json:async()=>String(url).includes('attendance-music-library')?{tracks:[{id:'r2-b1-day-24-weniger-kaufen',title:'Weniger kaufen',level,day,objectKey:recording.objectKey,audioUrl:'https://www.falowen.app/api/music?track=r2-b1-day-24-weniger-kaufen',autoDiscovered:true,coursebook:true}]}:pack});
  const root=createRoot(w.document.getElementById('root'));
  await act(async()=>{root.render(level==='B1'?React.createElement(Linked,{music:{level,day,title:'Weniger kaufen'}}):React.createElement(Published,{assignmentKey}));});
  const buttons=()=>[...w.document.querySelectorAll('button')];
  const click=async text=>{const b=buttons().find(b=>b.textContent.includes(text));assert.ok(b,text);await act(async()=>b.click());return b;};
  await click('2 · Liedtext');const checkbox=w.document.querySelector('input[type=checkbox]');assert.equal(checkbox.disabled,false);
  const audio=w.document.querySelector('audio');
  const at=async seconds=>act(async()=>{audio.currentTime=seconds;audio.dispatchEvent(new w.Event('timeupdate',{bubbles:true}));});
  await at(10.1);assert.equal(w.document.querySelector('[aria-current="true"]').dataset.line,'0');
  await at(20.1);assert.equal(w.document.querySelector('[aria-current="true"]').dataset.line,'2');assert.ok(scrolls>0);
  await act(async()=>checkbox.click());const before=scrolls;await at(15.1);assert.equal(scrolls,before);
  await act(async()=>checkbox.click());assert.ok(scrolls>before);
  await act(async()=>w.document.querySelector('[data-line="2"]').click());assert.equal(audio.currentTime,20);
  await at(0);assert.equal(w.document.querySelector('[aria-current="true"]'),null);
  await click('3 · Fragen');const reveal=buttons().find(b=>b.textContent.includes('Musterlösung für Lehrkraft'));assert.equal(reveal.disabled,true);
  const option=w.document.querySelector('.published-song-lesson__options button');assert.ok(option);
  await act(async()=>option.click());assert.equal(reveal.disabled,false);await act(async()=>reveal.click());assert.ok(w.document.querySelector('.published-song-lesson__answer'));
  await act(async()=>root.unmount());dom.window.close();
 });
}
test('a slide without complete timings disables Follow and lyric seeking',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://admin.falowen.app'});
 Object.assign(globalThis,{window:dom.window,document:dom.window.document,localStorage:dom.window.localStorage,IS_REACT_ACT_ENVIRONMENT:true});
 globalThis.fetch=async()=>({ok:false});
 const root=createRoot(document.getElementById('root'));
 await act(async()=>root.render(React.createElement(Published,{assignmentKey:'A1-3.5'})));
 await act(async()=>[...document.querySelectorAll('button')].find(b=>b.textContent.includes('2 · Liedtext')).click());
 const checkbox=document.querySelector('input[type=checkbox]');assert.equal(checkbox.disabled,true);assert.equal(checkbox.checked,false);
 assert.ok([...document.querySelectorAll('.lesson-song-lyrics button')].every(b=>b.disabled));
 await act(async()=>root.unmount());dom.window.close();
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import Module from 'node:module';
import {resolve} from 'node:path';
import {buildSync} from 'esbuild';
import {JSDOM} from 'jsdom';
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import useLobbySlideshow from '../src/hooks/useLobbySlideshow.js';
import useSongTiming from '../src/hooks/useSongTiming.js';
const code=buildSync({entryPoints:['src/components/WaitingRoomLyricsSlide.jsx'],bundle:true,platform:'node',format:'cjs',packages:'external',jsx:'automatic',write:false}).outputFiles[0].text;
const compiled=new Module(resolve('tests/waiting-lyrics-compiled.cjs'));compiled.paths=Module._nodeModulePaths(process.cwd());compiled._compile(code,resolve('tests/waiting-lyrics-compiled.cjs'));
const Lyrics=compiled.exports.default;
function setup(){
 const dom=new JSDOM('<div id="root"></div>',{url:'https://admin.falowen.app'});
 Object.assign(globalThis,{window:dom.window,document:dom.window.document,localStorage:dom.window.localStorage,IS_REACT_ACT_ENVIRONMENT:true});
 return {dom,root:createRoot(document.getElementById('root'))};
}
const cues=[{start:18.48,end:21.5,text:'Im Café sind wir zu zweit.'},{start:21.5,end:26.14,text:'Zwei Tees stehen auf dem Tisch.'},{start:28.76,end:31.12,text:'Die Uhr zeigt halb drei.'}];
test('lyric card shows previous/current/next, clears instrumental gaps and resets on repeat/stop',async()=>{
 const {dom,root}=setup();
 const render=async(time,playing=true)=>act(async()=>root.render(React.createElement(Lyrics,{title:'Zwei Tees, vier Euro',cues,time,playing})));
 await render(0);assert.match(document.body.textContent,/Listen to the music/);assert.equal(document.querySelector('[aria-current]'),null);
 await render(22);assert.equal(document.querySelector('[aria-current=true]').textContent,cues[1].text);
 assert.deepEqual([...document.querySelectorAll('.checkin-display-lyric-window p')].map(p=>p.textContent),cues.map(c=>c.text));
 await render(27);assert.match(document.body.textContent,/Listen to the music/);assert.equal(document.querySelector('.checkin-display-lyric-window'),null);
 await render(29);assert.equal(document.querySelector('[aria-current=true]').textContent,cues[2].text);
 await render(0);assert.equal(document.querySelector('[aria-current]'),null);
 await render(22,false);assert.match(document.body.textContent,/Music paused/);assert.equal(document.querySelector('[aria-current]'),null);
 await act(async()=>root.unmount());dom.window.close();
});
test('rotation holds lyrics, preserves selection across adaptive ordering, and resumes after Next',async()=>{
 const {dom,root}=setup();let state;const timers=new Map();let sequence=0;
 window.setInterval=callback=>{timers.set(++sequence,callback);return sequence;};window.clearInterval=id=>timers.delete(id);
 const slides=[{id:'checkin'},{id:'lesson'},{id:'lyrics'}];
 function Harness({items=slides,paused=false,started=false}){
  state=useLobbySlideshow(items,{paused,started});
  return React.createElement('main',null,React.createElement('aside',{'aria-label':'Attendance QR'},'QR · 2 / 9'),React.createElement('p',null,'Countdown 05:27'),React.createElement('section',null,state.active?.id));
 }
 const render=async props=>act(async()=>root.render(React.createElement(Harness,props)));
 const tick=async()=>act(async()=>{[...timers.values()].forEach(fn=>fn());});
 await render({});assert.equal(state.active.id,'checkin');await tick();assert.equal(state.active.id,'lesson');await tick();assert.equal(state.active.id,'lyrics');assert.equal(timers.size,0);
 await tick();assert.equal(state.active.id,'lyrics');assert.ok(document.querySelector('[aria-label="Attendance QR"]'));assert.match(document.body.textContent,/Countdown/);
 await render({items:[slides[1],slides[2]]});assert.equal(state.active.id,'lyrics','attendance/start-time reordering keeps Lyrics selected');assert.equal(state.index,1);
 await act(async()=>state.setIndex(i=>i+1));assert.equal(state.active.id,'lesson');assert.equal(timers.size,1);
 await render({items:[slides[1],slides[2]],paused:true});assert.equal(timers.size,0);
 await render({items:[slides[1],slides[2]],started:true});assert.equal(timers.size,0);
 await render({items:[slides[1],slides[2]]});await act(async()=>state.setIndex(1));
 await render({items:[slides[0],slides[1]]});assert.equal(state.lyricsHeld,false);assert.equal(timers.size,1,'removing a stopped/missing song unblocks rotation');
 await act(async()=>root.unmount());assert.equal(timers.size,0);dom.window.close();
});
test('playing-track metadata loads without draft lyrics and rejects a different recording',async()=>{
 const {dom,root}=setup();let state;const requested=[];
 const key='music/a1/day-13/Zwei Tees, vier Euro.mp3';
 globalThis.fetch=async url=>{requested.push(url);return {ok:true,json:async()=>({objectKey:key,lyrics:cues.map(c=>c.text).join('\n'),cues})};};
 function Harness({objectKey=key}){state=useSongTiming({id:'playing-song',objectKey,lyrics:''});return null;}
 await act(async()=>root.render(React.createElement(Harness)));
 assert.equal(state[0].length,3);assert.match(state[2],/Café/);assert.equal(requested.length,1);assert.ok(decodeURIComponent(requested[0]).includes(key));
 await act(async()=>root.render(React.createElement(Harness,{objectKey:'music/a2/day-01/Other.mp3'})));
 assert.deepEqual(state[0],[]);assert.equal(state[2],'','never show the previous song text for a new recording');
 await act(async()=>root.unmount());dom.window.close();
});
test('production lobby puts the lyric card in its stage beside the single persistent QR rail',()=>{
 const page=readFileSync('src/pages/CheckinDisplayPage.jsx','utf8');
 const lobby=page.slice(page.indexOf('<section className="checkin-display-smart-lobby"'),page.indexOf('<div className="checkin-display-lobby-footer">'));
 assert.match(lobby,/Always-visible attendance QR/);assert.match(lobby,/attendanceCountLabel/);
 assert.match(lobby,/activeSmartLobbySlide.id === "lyrics"/);assert.match(lobby,/<WaitingRoomLyricsSlide/);
 assert.equal((lobby.match(/QRCodeCanvas/g)||[]).length,1);
 assert.match(page,/onTimeUpdate: setSongPosition/);assert.match(page,/hasCompleteSongTiming\(songCues,recordedSongLyrics\)/);
});

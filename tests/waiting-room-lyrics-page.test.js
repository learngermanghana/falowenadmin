import test from 'node:test';
import assert from 'node:assert/strict';
import Module from 'node:module';
import {resolve} from 'node:path';
import {build} from 'esbuild';
import {JSDOM} from 'jsdom';
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter} from 'react-router-dom';

const mocks={
 'attendanceService.js':'export const subscribeSessionCheckins=({onChange})=>{onChange([{name:"Student one"},{name:"Student two"}]);return ()=>{};};',
 'classesService.js':'export const listClasses=async()=>[];',
 'lessonSongService.js':'export const prepareLessonSong=async()=>"";',
 'presenterLiveSessionService.js':`export const presenterLocalDateKey=()=>"2026-10-29";
 export const subscribePresenterLiveSession=()=>()=>{};
 export const readPresenterLiveSession=async()=>null;
 export const endPresenterLiveSession=async()=>({});
 export const publishPresenterLiveSession=async()=>({});
 export const setPresenterClassContext=()=>{};
 export const startPresenterLiveSession=async()=>({});`,
 'pianoAudio.js':`export const stopWaitingMusicPlaylist=()=>{};
 export const skipWaitingMusicPlaylist=async()=>{};
 export const startWaitingMusicPlaylist=async(context,gain,options)=>{globalThis.__lobbyPlayer=options;options.onTrackChange(options.playlist[0]);options.onTimeUpdate(0);};`,
 'qrcode.react':`import React from 'react';export const QRCodeCanvas=()=>React.createElement('div',{'aria-label':'Attendance QR graphic'});`,
};
const bundle=await build({entryPoints:['src/pages/CheckinDisplayPage.jsx'],bundle:true,platform:'node',format:'cjs',packages:'external',jsx:'automatic',loader:{'.css':'empty'},define:{'import.meta.env':'{}'},write:false,plugins:[{name:'mock-external-lobby-services',setup(b){
 b.onResolve({filter:/services\/.*\.js$|pianoAudio\.js$|^qrcode\.react$/},args=>{
  const name=args.path.split('/').at(-1);return mocks[name]?{path:name,namespace:'lobby-mock'}:undefined;
 });
 b.onLoad({filter:/.*/,namespace:'lobby-mock'},args=>({contents:mocks[args.path],loader:'js',resolveDir:process.cwd()}));
}}]});
const compiled=new Module(resolve('tests/lobby-page-compiled.cjs'));compiled.paths=Module._nodeModulePaths(process.cwd());compiled._compile(bundle.outputFiles[0].text,resolve('tests/lobby-page-compiled.cjs'));
const Page=compiled.exports.default;
test('actual attendance page shows synced lyrics beside QR/countdown, holds them with controls hidden, and removes them on stop',async(t)=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://admin.falowen.app'});const w=dom.window;
 Object.assign(globalThis,{window:w,document:w.document,localStorage:w.localStorage,IS_REACT_ACT_ENVIRONMENT:true});
 w.matchMedia=()=>({matches:false});w.scrollTo=()=>{};
 const param={setValueAtTime(){},setTargetAtTime(){}};
 w.AudioContext=class {state='running';currentTime=0;destination={};createGain(){return {gain:param,connect(){}};}createDynamicsCompressor(){return {threshold:param,knee:param,ratio:param,attack:param,release:param,connect(){}};}async resume(){}async close(){this.state='closed';}};
 const key='music/a1/day-13/Zwei Tees, vier Euro.mp3';const id='r2-a1-day-13-b64_WndlaSBUZWVzLCB2aWVyIEV1cm8ubXAz';
 const cues=[{start:18.48,end:21.5,text:'Im Café sind wir zu zweit.'},{start:21.5,end:26.14,text:'Zwei Tees stehen auf dem Tisch.'},{start:28.76,end:31.12,text:'Die Uhr zeigt halb drei.'}];
 globalThis.fetch=async url=>({ok:true,json:async()=>String(url).includes('music-lyrics')?{objectKey:key,lyrics:cues.map(c=>c.text).join('\n'),cues}:String(url).includes('music-library')?{ok:true,tracks:[{id,title:'Zwei Tees, vier Euro',level:'A1',day:13,objectKey:key,audioUrl:'https://www.falowen.app/api/music?track='+id,autoDiscovered:true,coursebook:true}]}:{serverTime:Date.now()}});
 const root=createRoot(document.getElementById('root'));
 t.after(async()=>{await act(async()=>root.unmount());delete globalThis.__lobbyPlayer;dom.window.close();});
 const click=async label=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===label);assert.ok(b,label);await act(async()=>b.click());};
 await act(async()=>root.render(React.createElement(MemoryRouter,{initialEntries:['/checkin/display?classId=lobby-test&sessionId=A1+Hamburg+Klasse_2026-10-29_1800&date=2026-10-29&assignmentId=A1-3.5&sessionLabel=Day+13&startTime=23:59&endTime=23:59&expectedCount=9']},React.createElement(Page))));
 assert.ok(document.querySelector('.checkin-display-lobby-qr-rail'));assert.ok(document.querySelector('.checkin-display-timing'));
 await click('Teacher controls');await click('Start waiting music');await click('Show lyrics');
 assert.ok(document.querySelector('.checkin-display-lobby-stage .checkin-display-lobby-lyrics'));
 await act(async()=>globalThis.__lobbyPlayer.onTimeUpdate(22));
 assert.equal(document.querySelector('.checkin-display-lyric-window [aria-current=true]').textContent,cues[1].text);
 assert.match(document.querySelector('.checkin-display-lobby-verified-count').textContent,/2 \/ 9/);
 await click('Hide teacher controls');assert.ok(document.querySelector('.checkin-display-lobby-lyrics'));assert.ok(document.querySelector('.checkin-display-lobby-qr-rail'));assert.ok(document.querySelector('.checkin-display-timing'));
 await act(async()=>globalThis.__lobbyPlayer.onTimeUpdate(27));assert.match(document.querySelector('.checkin-display-lyrics-break').textContent,/Listen to the music/);
 await click('Next');assert.equal(document.querySelector('.checkin-display-lobby-lyrics'),null);
 await click('Show lyrics');await click('Teacher controls');await click('Stop music');assert.equal(document.querySelector('.checkin-display-lobby-lyrics'),null);

});

import test from 'node:test';
import assert from 'node:assert/strict';
import Module from 'node:module';
import {resolve} from 'node:path';
import {build} from 'esbuild';
import {JSDOM} from 'jsdom';
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {getSlidesByCourse} from '../src/data/teachingSlides.js';
import {buildTeachingPresenterStages} from '../src/utils/teachingPresenter.js';
import {PRESENTER_READING_TRANSLATIONS} from '../src/data/presenterReadingTranslations.js';

// Keep the real presenter, numbered reading, navigation and translation controls.
// Unrelated media/roster widgets cannot contact external services during this test.
const leaves=new Set(['LessonSongStage.jsx','C2GrammarTeaching.jsx','B1HousingChoicePractice.jsx','B1SustainabilityDecisions.jsx','A2SportMatchmaker.jsx','InteractiveLessonOpening.jsx','PresenterStudentPicker.jsx','PresenterSessionTimer.jsx']);
const bundle=await build({entryPoints:['src/components/TeachingSlidePresenter.jsx'],bundle:true,platform:'node',format:'cjs',packages:'external',jsx:'automatic',loader:{'.css':'empty'},define:{'import.meta.env':'{}'},write:false,plugins:[{name:'unrelated-presenter-widgets',setup(b){
 b.onResolve({filter:/\.jsx$/},args=>leaves.has(args.path.split('/').at(-1))?{path:args.path,namespace:'presenter-leaf'}:args.path.endsWith('MusicTeachingStages.jsx')?{path:args.path,namespace:'presenter-music'}:undefined);
 b.onLoad({filter:/.*/,namespace:'presenter-leaf'},()=>({contents:'export default function Widget(){return null;}',loader:'js'}));
 b.onLoad({filter:/.*/,namespace:'presenter-music'},()=>({contents:'export const MusicVideoStage=()=>null;export const MusicReadingStage=()=>null;',loader:'js'}));
}}]});
const compiled=new Module(resolve('tests/reading-presenter-compiled.cjs'));compiled.paths=Module._nodeModulePaths(process.cwd());compiled._compile(bundle.outputFiles[0].text,resolve('tests/reading-presenter-compiled.cjs'));
const Presenter=compiled.exports.default;
for(const level of ['A2','B1'])test(level+' all 28 real reading slides reveal only the selected sentence and reset on navigation',async(t)=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://admin.falowen.app',pretendToBeVisual:true});const w=dom.window;
 Object.assign(globalThis,{window:w,document:w.document,localStorage:w.localStorage,IS_REACT_ACT_ENVIRONMENT:true});
 w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
 w.HTMLElement.prototype.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
 globalThis.ResizeObserver=class {observe(){}disconnect(){}};
 let fetches=0;globalThis.fetch=()=>{fetches++;throw Error('Saved translations must not call an API');};
 const root=createRoot(document.getElementById('root'));t.after(async()=>{await act(async()=>root.unmount());dom.window.close();});
 const click=async node=>{assert.ok(node);await act(async()=>node.click());};
 const button=text=>[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===text);
 for(const slide of getSlidesByCourse(level)){
  await act(async()=>root.render(React.createElement(Presenter,{slide,onExit(){}})));
  const stages=buildTeachingPresenterStages(slide);const index=stages.findIndex(s=>s.variant==='lesson-reading');
  const jump=document.querySelector('.presenter-stage-jump select');assert.ok(jump,slide.assignmentId);
  await act(async()=>{jump.value=String(index);jump.dispatchEvent(new w.Event('change',{bubbles:true}));});
  assert.ok(document.querySelector('.presenter-knowledge.has-saved-translations'),slide.assignmentId);
  assert.equal(document.querySelector('.presenter-translation-meaning'),null,'English is hidden on each new slide');
  assert.equal(button('Select a sentence to translate').disabled,true);
  await click(document.querySelector('[aria-label="Highlight sentence 3"]'));
  assert.equal(document.querySelector('.presenter-translation-meaning'),null,'selecting alone does not reveal English');
  await click(button('Translate sentence 3'));
  const saved=PRESENTER_READING_TRANSLATIONS[slide.assignmentId].reading;
  assert.equal(document.querySelector('.presenter-translation-meaning p').textContent,saved[2].en);
  assert.equal(document.querySelectorAll('.presenter-translation-meaning').length,1);
  await click(document.querySelector('[aria-label="Highlight sentence 4"]'));
  assert.equal(document.querySelector('.presenter-translation-meaning p').textContent,saved[3].en,'a new selection replaces the one translation');
  assert.ok(document.querySelector('.presenter-knowledge-text').textContent.includes(saved[2].de),'German stays visible');
  await click(button('Hide translation'));assert.equal(document.querySelector('.presenter-translation-meaning'),null);
  await click(button('Translate sentence 4'));
  await click(button('Next slide →'));
  assert.equal(document.querySelector('.presenter-translation-meaning'),null,'next slide clears English');
  await act(async()=>{jump.value=String(index);jump.dispatchEvent(new w.Event('change',{bubbles:true}));});
  assert.equal(document.querySelector('.presenter-translation-meaning'),null,'returning to the reading keeps English hidden');
  assert.equal(button('Select a sentence to translate').disabled,true);
 }
 assert.equal(fetches,0);
});

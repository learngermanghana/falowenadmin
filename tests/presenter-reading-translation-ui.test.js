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
import {B1_WORKBOOK_PRESENTATIONS} from '../src/data/b1WorkbookPresentations.js';
import {A2_WORKBOOK_PRESENTATIONS} from '../src/data/a2WorkbookPresentations.js';
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
  if(level==='B1'){
   const navigate=async id=>{await act(async()=>{jump.value=String(stages.findIndex(s=>s.id===id));jump.dispatchEvent(new w.Event('change',{bubbles:true}));});};
   await navigate('common-mistakes');
   assert.equal(document.querySelector('.presenter-grammar-check h1').textContent,'Common mistakes · Häufige Fehler');
   await navigate('workbook-presentation');
   const task=B1_WORKBOOK_PRESENTATIONS[slide.dayNumber],panel=()=>document.querySelector('[role="tabpanel"]');
   const tab=text=>[...document.querySelectorAll('[role="tab"]')].find(b=>b.textContent===text);
   assert.equal(document.querySelector('.presenter-b1-presentation h2').textContent,task.choices?.[0].prompt||task.prompt);
   assert.ok(panel().textContent.includes(task.instructions));
   assert.equal(document.querySelector('.presenter-b1-presentation-outline'),null,'outline is hidden until requested');
   await click(tab('Gliederung'));
   assert.equal(document.querySelectorAll('.presenter-b1-presentation-outline > li').length,task.structure.length);
   const starter=panel().querySelector('details');if(starter){assert.equal(starter.open,false);await click(starter.querySelector('summary'));assert.equal(starter.open,true);}
   if(tab('Ideen & Redemittel')){await click(tab('Ideen & Redemittel'));const idea=panel().querySelector('details');assert.equal(idea.open,false);await click(idea.querySelector('summary'));assert.equal(idea.open,true);}
   if(task.choices){
    const select=document.querySelector('.presenter-b1-presentation-choice select');
    await act(async()=>{select.value='1';select.dispatchEvent(new w.Event('change',{bubbles:true}));});
    assert.equal(document.querySelector('.presenter-b1-presentation h2').textContent,task.choices[1].prompt);
    assert.equal(tab('Aufgabe').getAttribute('aria-selected'),'true');
   }
   await click(tab('Gliederung'));
   await act(async()=>tab('Gliederung').dispatchEvent(new w.KeyboardEvent('keydown',{key:'Home',bubbles:true})));
   assert.equal(tab('Aufgabe').getAttribute('aria-selected'),'true','keyboard tab navigation selects task');
   await click(button('Next slide →'));assert.equal(document.querySelector('[aria-label="B1 workbook presentation"]'),null);
   await navigate('workbook-presentation');assert.equal(tab('Aufgabe').getAttribute('aria-selected'),'true','navigation resets the panel');
   const select=document.querySelector('.presenter-b1-presentation-choice select');if(select)assert.equal(select.value,'0');
  }
  if(level==='A2'){
   const navigate=async id=>{await act(async()=>{jump.value=String(stages.findIndex(s=>s.id===id));jump.dispatchEvent(new w.Event('change',{bubbles:true}));});};
   await navigate('common-mistakes');
   assert.equal(document.querySelector('.presenter-grammar-check h1').textContent,'Common mistakes · Häufige Fehler');
   const correction=document.querySelector('.presenter-grammar-check details');
   assert.equal(correction.open,false);
   await click(correction.querySelector('summary'));assert.equal(correction.open,true);
   await navigate('workbook-presentation');
   const task=A2_WORKBOOK_PRESENTATIONS[slide.dayNumber];
   assert.ok(document.querySelector('[aria-label="Workbook presentation"]'));
   if(task.mode!=='speaking-mock'){
    assert.equal(document.querySelector('.presenter-workbook-presentation h2').textContent,task.prompt);
    assert.equal(document.querySelectorAll('.presenter-presentation-points li').length,task.branches.length);
    const starter=document.querySelector('.presenter-presentation-points details');
    if(starter){assert.equal(starter.open,false);await click(starter.querySelector('summary'));assert.equal(starter.open,true);
    assert.equal(starter.querySelector('p').textContent,task.branches[0].starter);}
   }else{
    const select=document.querySelector('.presenter-presentation-choice select');
    assert.equal(select.options.length,task.choices.length);
    await act(async()=>{select.value='1';select.dispatchEvent(new w.Event('change',{bubbles:true}));});
    assert.equal(document.querySelector('.presenter-workbook-presentation h2').textContent,task.choices[1].prompt);
   }
   await click(button('Next slide →'));
   assert.equal(document.querySelector('[aria-label="Workbook presentation"]'),null);
   await navigate('workbook-presentation');
   assert.ok(document.querySelector('[aria-label="Workbook presentation"]'));
   const select=document.querySelector('.presenter-presentation-choice select');
   if(select)assert.equal(select.value,'0','mock selection resets on navigation');
  }
 }
 assert.equal(fetches,0);
});

import {build} from 'esbuild';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import Module from 'node:module';
import {execFileSync} from 'node:child_process';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {JSDOM} from 'jsdom';
const root=resolve(process.argv[2]||'../falowenexamtrainer');
const course=readFileSync(resolve(root,'web/src/components/CourseLessonPage.js'),'utf8');
const imports=new Map([...course.matchAll(/import (B1Day\w+WorkbookPage) from "\.\/(\w+)"/g)].map(m=>[m[1],m[2]]));
const routes=[...course.match(/const B1_WORKBOOK_PAGES = \{([\s\S]*?)\};/)[1].matchAll(/(\d+): (\w+)/g)];
const standardStub=`import React from 'react';export default function Workbook(props){globalThis.__b1WorkbookConfig=props.config;return props.renderSections?React.createElement(props.renderSections,{activeTab:'sprechen',displayedActiveTab:'sprechen',prepared:{},setPreparedFor:()=>()=>{}}):null;}`;
const leafStub=`import React from 'react';export default function Leaf({children}){return children||null;}export const A2B1WorkbookGuidance=()=>null;export const WorkbookSubmissionReminder=()=>null;`;
const taskStub=`import React from 'react';export const STANDARD_WORKBOOK_TABS=[];export const WorkbookTabNav=()=>null;export function WorkbookTaskCard(p){return React.createElement('article',{'data-workbook-task':true},React.createElement('h3',null,p.title),React.createElement('p',{'data-submission-note':true},p.submissionNote),p.children);}`;
async function load(path,stubs=false){
 const result=await build({entryPoints:[resolve(root,path)],bundle:true,platform:'node',format:'cjs',packages:'external',jsx:'automatic',loader:{'.js':'jsx','.css':'empty'},write:false,plugins:stubs?[{name:'capture-workbook-content',setup(b){
  b.onResolve({filter:/^react(?:\/|$)/},args=>({path:args.path,external:true}));
  b.onResolve({filter:/.*/},args=>{
   if(args.kind==='entry-point'||!args.path.startsWith('.'))return;
   if(args.path.endsWith('B1StandardWorkbookPage'))return {path:args.path,namespace:'standard'};
   if(args.path.endsWith('StandardWorkbookComponents'))return {path:args.path,namespace:'task'};
   if(args.resolveDir.includes('/components')&&args.path.startsWith('./'))return {path:args.path,namespace:'leaf'};
  });
  for(const [namespace,contents]of[['standard',standardStub],['task',taskStub],['leaf',leafStub]])b.onLoad({filter:/.*/,namespace},()=>({contents,loader:'js'}));
 }}]:[]});
 const compiled=new Module(resolve('tests/b1-source-snapshot.cjs'));compiled.paths=Module._nodeModulePaths(process.cwd());compiled._compile(result.outputFiles[0].text,compiled.filename||resolve('tests/b1-source-snapshot.cjs'));return compiled.exports;
}
const {speakingQuestionDictionary}=await load('web/src/data/speakingDictionary.js');
const runtime=readFileSync(resolve(root,'web/src/b1SpeakingStructureRuntime.js'),'utf8');
const standardStructure=JSON.parse(runtime.match(/const STANDARD_ITEMS = (\[[\s\S]*?\n\]);/)[1].replace(/,\s*\]/g,']')).map(([label,starter])=>({label,starter}));
const lessons={};
for(const [,dayText,name]of routes){
 const day=Number(dayText),path='web/src/components/'+imports.get(name)+'.js';
 if(!imports.get(name))throw Error('Missing current B1 route '+day);
 if(day===23){lessons[day]={day,sourcePath:path,sourcePoolPath:'web/src/data/speakingDictionary.js',mode:'speaking-mock',prompt:'Ein Thema präsentieren · B1 Speaking Mock',instructions:'Wähle ein Thema aus dem Workbook-Aufgabenpool. Die persönliche Prüfungsaufgabe wird im Workbook ausgewählt; diese Folie dient der Unterrichtsübung.',choices:speakingQuestionDictionary.filter(q=>q.level==='B1'&&q.teilId==='teil-2').map(q=>({id:q.id,prompt:q.topicPrompt,keywords:q.keywordSubtopic})),structure:standardStructure};continue;}
 delete globalThis.__b1WorkbookConfig;
 const page=await load(path,true);const html=renderToStaticMarkup(React.createElement(page.default));const config=globalThis.__b1WorkbookConfig;
 if(!config||config.day!==day)throw Error('Uncaptured B1 workbook '+day);
 const speaking=config.speaking;
 if(speaking){
  lessons[day]={day,sourcePath:path,mode:'presentation',prompt:speaking.question,instructions:speaking.instructions||'Use the idea bank and answer structure below to prepare a clear B1 response.',duration:speaking.submissionNote||'Prepare a 90–120 second answer for class. Teil 1 is not submitted.',structure:standardStructure,ideas:(speaking.ideaGroups||[]).map(g=>({title:g.title,items:g.items})),phrases:speaking.usefulPhrases||['Meiner Meinung nach …','Einerseits …, andererseits …','Ein Vorteil/Nachteil ist, dass …','Ich finde … wichtig, weil …']};
 }else{
  const dom=new JSDOM(html);const doc=dom.window.document;const task=doc.querySelector('[data-workbook-task]');
  if(!task)throw Error('Missing preserved speaking task '+day);
  const instructions=[...task.children].filter(e=>e.tagName!=='H3'&&!e.hasAttribute('data-submission-note')).map(e=>e.textContent.trim()).join(' ');
  const headings=[...doc.querySelectorAll('h3,h4,strong')];const outline=headings.find(h=>/^(Suggested answer structure|Nutze diese Struktur|Suggested role-play structure|Suggested speaking structure)$/i.test(h.textContent.trim()));
  if(!outline)throw Error('Missing workbook structure '+day);
  const ideas=[...doc.querySelectorAll('ul')].filter(list=>['STRONG','H3','H4'].includes(list.previousElementSibling?.tagName)).map(list=>({title:(list.previousElementSibling.tagName==='STRONG'&&list.parentElement.querySelector(':scope > h3')?list.parentElement.querySelector(':scope > h3').textContent+' · ':'')+list.previousElementSibling.textContent,items:[...list.children].map(li=>li.textContent.trim())}));
  const roleplay=/role-play/i.test(outline.textContent);
  const standardized=/^(Suggested answer structure|Nutze diese Struktur)$/i.test(outline.textContent.trim());
  const structure=standardized?standardStructure:[...outline.nextElementSibling.children].map(li=>({label:li.textContent.trim(),starter:''}));
  lessons[day]={day,sourcePath:path,mode:'presentation',prompt:task.querySelector('h3').textContent,instructions,duration:task.querySelector('[data-submission-note]').textContent,structure,ideas,phrases:[],roleplay};
  dom.window.close();
 }
 if(!lessons[day].prompt||!lessons[day].instructions)throw Error('Empty task '+day);
 console.log(day,lessons[day].prompt);
}
if(Object.keys(lessons).length!==28)throw Error('Expected all 28 B1 workbook tasks');
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const output='// Saved from current B1 workbook tasks and their live speaking structure.\nexport const B1_PRESENTATION_SOURCE_SHA = '+JSON.stringify(sha)+';\nexport const B1_WORKBOOK_PRESENTATIONS = '+JSON.stringify(lessons,null,2)+';\n';
if(process.argv.includes('--check')){if(readFileSync('src/data/b1WorkbookPresentations.js','utf8')!==output)throw Error('B1 presentation snapshot differs from source');}else writeFileSync('src/data/b1WorkbookPresentations.js',output);

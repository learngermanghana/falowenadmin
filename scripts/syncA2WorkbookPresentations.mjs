import {build} from 'esbuild';
import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
const root=resolve(process.argv[2]||'../falowenexamtrainer');
async function bundled(path){
 const result=await build({entryPoints:[resolve(root,path)],bundle:true,platform:'node',format:'esm',write:false});
 return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}
const {a2SpeakingMindMaps}=await bundled('web/src/data/speakingMindMaps/a2/index.js');
const {speakingQuestionDictionary}=await bundled('web/src/data/speakingDictionary.js');
const pages=new Map();
for(const name of readdirSync(resolve(root,'web/src/components')).filter(n=>n.includes('Workbook')&&/Page\.(js|jsx)$/.test(n))){
 const path='web/src/components/'+name,source=readFileSync(resolve(root,path),'utf8');
 const props=source.match(/<A2StandardTabbedWorkbookPage\b([\s\S]*?)\/>/)?.[1];
 const day=Number(props?.match(/\bday=\{(\d+)\}/)?.[1]);
 if(day)pages.set(day,{path,source,prompt:props.match(/topicPrompt="([^"]+)"/)?.[1]||''});
}
const lessons={};
for(const c of a2SpeakingMindMaps){
 if(c.day===22){
  lessons[c.day]={day:22,sourcePath:'web/src/components/CourseSpeakingMockAssignment.jsx',sourcePoolPath:'web/src/data/speakingDictionary.js',mode:'speaking-mock',prompt:'Von sich erzählen · Goethe A2 Speaking Mock',instruction:'Wähle eine Frage aus dem Aufgabenpool des Workbooks. Dies ist eine Unterrichtsübung; die persönliche Prüfungsaufgabe wird im Workbook ausgewählt.',choices:speakingQuestionDictionary.filter(q=>q.level==='A2'&&q.teilId==='teil-2').map(q=>({id:q.id,prompt:q.topicPrompt,keywords:q.keywordSubtopic}))};
  continue;
 }
 const page=pages.get(c.day);if(!page)throw Error('Missing workbook for day '+c.day);
 if(c.day===8){
  const spoken=page.source.split('const sprechenContent =')[1]?.split('export default')[0];
  if(!spoken?.includes('Restaurant-Rollenspiel'))throw Error('Review Day 8 custom workbook speaking task');
  const plain=text=>text.replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim();
  const paragraphs=[...spoken.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)].map(m=>plain(m[1]));
  const steps=[...spoken.matchAll(/<li>([\s\S]*?)<\/li>/g)].map(m=>plain(m[1]));
  lessons[c.day]={day:c.day,sourcePath:page.path,mode:'roleplay',prompt:page.prompt,situation:paragraphs[0],instruction:paragraphs.at(-1),branches:steps.map((question,index)=>({id:'step-'+(index+1),label:'Schritt '+(index+1),question}))};
  continue;
 }

 lessons[c.day]={day:c.day,sourcePath:page.path,sourceMindMapPath:'web/src/data/speakingMindMaps/a2/index.js',mode:'presentation',prompt:page.prompt&&page.prompt!==c.title&&page.prompt.length>30?page.prompt:c.centralQuestion,centralQuestion:c.centralQuestion,branches:c.branches.map(b=>({id:b.id,label:b.label,question:b.guidingQuestion,starter:b.sentenceStarter})),instruction:'Einleitung → 2–3 Details → Beispiel → kurzer Schluss. Sprich 30–60 Sekunden. Nutze und, oder, weil oder deshalb.'};
}
if(Object.keys(lessons).length!==28)throw Error('Expected all 28 A2 lessons');
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const output='// Saved from the existing A2 workbook speaking tasks. No runtime requests.\nexport const A2_PRESENTATION_SOURCE_SHA = '+JSON.stringify(sha)+';\nexport const A2_WORKBOOK_PRESENTATIONS = '+JSON.stringify(lessons,null,2)+';\n';
if(process.argv.includes('--check')){
 if(readFileSync('src/data/a2WorkbookPresentations.js','utf8')!==output)throw Error('Workbook presentation snapshot differs from source');
}else writeFileSync('src/data/a2WorkbookPresentations.js',output);
console.log('A2 workbook presentations: 28 lessons at '+sha);

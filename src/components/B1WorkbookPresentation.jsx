import {useId,useState} from 'react';
import './B1WorkbookPresentation.css';

export default function B1WorkbookPresentation({stage}) {
 const task=stage.presentation;
 const id=useId();
 const [view,setView]=useState('task');
 const [choice,setChoice]=useState(0);
 const selected=task.choices?.[choice]||task.choices?.[0];
 const tabs=[['task','Aufgabe'],['structure','Gliederung'],['ideas','Ideen & Redemittel']].filter(([key])=>key!=='ideas'||task.ideas?.length||task.phrases?.length);
 function handleTabKey(event){
  const index=tabs.findIndex(([key])=>key===view);
  const next={ArrowRight:(index+1)%tabs.length,ArrowLeft:(index+tabs.length-1)%tabs.length,Home:0,End:tabs.length-1}[event.key];
  if(next===undefined)return;
  event.preventDefault();setView(tabs[next][0]);event.currentTarget.parentElement.querySelectorAll('[role="tab"]')[next].focus();
 }
 return <section className="presenter-b1-presentation" aria-label="B1 workbook presentation">
  <header><span>Workbook · B1 Sprechen</span><h1>{stage.title}</h1></header>
  {selected && <label className="presenter-b1-presentation-choice">Workbook-Thema
   <select value={choice} onChange={event=>{setChoice(Number(event.target.value));setView('task');}}>
    {task.choices.map((item,index)=><option key={item.id} value={index}>{item.prompt}</option>)}
   </select>
  </label>}
  <h2>{selected?.prompt||task.prompt}</h2>
  <div className="presenter-b1-presentation-tabs" role="tablist" aria-label="B1 presentation support">
   {tabs.map(([key,label])=><button type="button" role="tab" key={key} id={`${id}-${key}`} aria-controls={`${id}-panel`} aria-selected={view===key} tabIndex={view===key?0:-1} onKeyDown={handleTabKey} onClick={()=>setView(key)}>{label}</button>)}
  </div>
  <div className="presenter-b1-presentation-panel" id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-${view}`} tabIndex={0}>
   {view==='task' && <>
    <p className="presenter-b1-presentation-task">{task.instructions}</p>
    {selected?.keywords && <p><strong>Stichpunkte:</strong> {selected.keywords}</p>}
    {task.duration && <small>{task.duration}</small>}
   </>}
   {view==='structure' && <ol className="presenter-b1-presentation-outline">{task.structure.map((step,index)=><li key={index}>
    <strong>{step.label}</strong>
    {step.starter && <details><summary>Redemittel zeigen</summary><p>{step.starter}</p></details>}
   </li>)}</ol>}
   {view==='ideas' && <div className="presenter-b1-presentation-ideas">
    {task.ideas?.map((group,index)=><details key={index}><summary>{group.title}</summary><ul>{group.items?.map((item,i)=><li key={i}>{item}</li>)}</ul></details>)}
    {Boolean(task.phrases?.length) && <details><summary>Nützliche Redemittel</summary><ul>{task.phrases.map((item,i)=><li key={i}>{item}</li>)}</ul></details>}
   </div>}
  </div>
  <small>Unterrichtsübung · keine Abgabe auf dieser Folie</small>
 </section>;
}

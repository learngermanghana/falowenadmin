import {useState} from 'react';
import './A2WorkbookPresentation.css';

export default function A2WorkbookPresentation({stage}) {
 const task=stage.presentation;
 const [choice,setChoice]=useState(0);
 const selected=task.choices?.[choice]||task.choices?.[0];
 return <section className="presenter-workbook-presentation" aria-label="Workbook presentation">
  <header><span>{stage.kicker}</span><h1>{stage.title}</h1></header>
  {selected && <label className="presenter-presentation-choice">Workbook question
   <select value={choice} onChange={event=>setChoice(Number(event.target.value))}>
    {task.choices.map((item,index)=><option key={item.id} value={index}>{item.prompt}</option>)}
   </select>
  </label>}
  <h2>{selected?.prompt||task.prompt}</h2>
  {task.situation && <p className="presenter-presentation-instruction">{task.situation}</p>}
  {selected ? <p className="presenter-presentation-keywords">{selected.keywords}</p> :
   <ol className="presenter-presentation-points">{task.branches.map(item=><li key={item.id}>
    <strong>{item.label}</strong><p>{item.question}</p>
    {item.starter && <details><summary>Satzanfang zeigen</summary><p>{item.starter}</p></details>}
   </li>)}</ol>}
  <p className="presenter-presentation-instruction">{task.instruction}</p>
  <small>{selected?'Aus dem Workbook-Aufgabenpool · unbewertete Unterrichtsübung':'Workbook · Teil 1 Sprechen · Gruppenübung'}</small>
 </section>;
}

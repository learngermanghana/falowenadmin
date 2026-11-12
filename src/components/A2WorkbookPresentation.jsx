import {useState} from 'react';
import PresentationFollowUpQuestions from './PresentationFollowUpQuestions.jsx';
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
  {task.presentationPractice && <section aria-label="Individual presentation practice">
   <strong>Präsentation · Von sich erzählen · Übung zu Goethe A2 Teil 2</strong>
   <h2>{task.presentationPractice.prompt}</h2>
   <p>{task.presentationPractice.instruction}</p>
   <p lang="en">{task.presentationPractice.instructionEn}</p>
   <p className="presenter-presentation-keywords">Stichpunkte: {task.presentationPractice.keywords.join(' · ')}</p>
   <details><summary>Beispiel zeigen</summary><p>{task.presentationPractice.branches.map(point=>point.modelSentence).join(' ')}</p></details>
   <h2>Zusatzübung · Restaurant-Rollenspiel</h2>
  </section>}
  <h2>{selected?.prompt||task.prompt}</h2>
  {task.keywords && <p className="presenter-presentation-keywords">{task.keywords.length} Stichpunkte · Satzanfänge einzeln öffnen</p>}
  {task.instructionEn && <p lang="en" className="presenter-presentation-instruction">{task.instructionEn}</p>}
  {task.situation && <p className="presenter-presentation-instruction">{task.situation}</p>}
  {selected ? <p className="presenter-presentation-keywords">{selected.keywords}</p> :
   <ol className="presenter-presentation-points">{task.branches.map(item=><li key={item.id}>
    <strong>{item.label}</strong><p>{item.question}</p>
    {item.starter && <details><summary>Satzanfang zeigen</summary><p>{item.starter}</p></details>}
   </li>)}</ol>}
  <p className="presenter-presentation-instruction">{task.instruction}</p>
  <PresentationFollowUpQuestions level="A2" day={task.day}/>
  <small>{selected?'Aus dem Workbook-Aufgabenpool · unbewertete Unterrichtsübung':'Workbook · Präsentationsübung zu Goethe A2 Teil 2'}</small>
 </section>;
}

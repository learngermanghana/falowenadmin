import { useState } from "react";
import { splitSwahiliReading } from "../utils/swahiliClassroomStages.js";

export function SwahiliClassroomReading({stage, children}) {
  const [word,setWord] = useState(null);
  const [review,setReview] = useState(false);
  const [index,setIndex] = useState(0);
  const [revealed,setRevealed] = useState(false);
  const checks = stage.checks || [];
  const current = checks[index];
  const paragraphs = String(stage.content || "").split(/\n+/).filter(Boolean);
  function go(n){setIndex(Math.max(0,Math.min(checks.length-1,n)));setRevealed(false);}
  return <section className="swahili-classroom-reading">
    <p className="swahili-classroom-instruction">Soma maandishi. Bonyeza maneno yaliyoangaziwa ili kuona maana yake.</p>
    <div className="swahili-classroom-passage">
      {paragraphs.map((paragraph,i)=><p key={i}>{splitSwahiliReading(paragraph,stage.glossary || []).map((token,j)=>token.word ?
        <button type="button" className="swahili-classroom-word" aria-pressed={word?.word===token.word} key={j} onClick={()=>setWord(word?.word===token.word?null:token)}>{token.text}</button> : <span key={j}>{token.text}</span>)}</p>)}
    </div>
    {word && <div className="swahili-classroom-meaning" role="status"><strong>{word.word}</strong><span lang="en">{word.meaning}</span><button type="button" onClick={()=>setWord(null)} aria-label="Ficha maana">×</button></div>}
    {children && <details><summary>Picha za menyu</summary>{children}</details>}
    {checks.length>0 && <div className="swahili-classroom-check">
      <div className="swahili-classroom-check-head"><strong>Maswali ya ufahamu · {checks.length}</strong>
        <button type="button" onClick={()=>{setReview(v=>!v);go(0);}}>{review?"Onyesha maswali yote":"Jadili majibu moja baada ya jingine"}</button></div>
      {review && current ? <>
        <p className="swahili-classroom-instruction">Swali {index+1} / {checks.length}</p><h2>{current[0]}</h2>
        <button type="button" aria-expanded={revealed} onClick={()=>setRevealed(v=>!v)}>{revealed?"Ficha jibu":"Onyesha jibu"}</button>
        {revealed && <p role="status" className="swahili-a2-presenter__answer">{current[1]}</p>}
        <div className="swahili-classroom-check-head"><button type="button" disabled={index===0} onClick={()=>go(index-1)}>← Rudi</button><button type="button" disabled={index===checks.length-1} onClick={()=>go(index+1)}>Swali linalofuata →</button></div>
      </> : <ol>{checks.map(([question],i)=><li key={i}>{question}</li>)}</ol>}
    </div>}
  </section>;
}

export function SwahiliClassroomRoleplay({stage}) {
  return <section className="swahili-classroom-roleplay">
    <p className="swahili-classroom-instruction">Fanyeni kazi kwa jozi. Badilishaneni majukumu baada ya mazungumzo.</p>
    <div className="swahili-classroom-role-grid">
      <article><strong>Mwanafunzi A</strong><p>{stage.roleA}</p></article>
      <article><strong>Mwanafunzi B</strong><p>{stage.roleB}</p></article>
    </div>
    <div className="swahili-classroom-meaning"><strong>Misemo ya kusaidia</strong><span>{stage.phrase}</span></div>
    {stage.content && <details><summary>Maelekezo zaidi</summary><p style={{whiteSpace:"pre-line"}}>{stage.content}</p></details>}
  </section>;
}

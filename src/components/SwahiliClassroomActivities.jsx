import { useState } from "react";
import { splitSwahiliReading } from "../utils/swahiliClassroomStages.js";
import { presentationPresets } from "../utils/swahiliGuidedClassroom.js";
import PresenterActivityTimer, { usePresenterActivityTimer } from "./PresenterActivityTimer.jsx";

export function SwahiliClassroomReading({stage, children, readingPhase, onReadingPhase, assignment}) {
  const [word,setWord] = useState(null);
  const [translation,setTranslation] = useState(null);
  const [review,setReview] = useState(false);
  const [index,setIndex] = useState(0);
  const [revealed,setRevealed] = useState(false);
  const checks = stage.checks || [];
  const current = checks[index];
  const units = stage.units || [];
  const activeNumbers=readingPhase==="share"?assignment?.chunk?.numbers||[]:[];
  const evidenceIndexes = Array.isArray(stage.evidence?.[index]) ? stage.evidence[index] : [stage.evidence?.[index]];
  const evidenceUnits = review&&revealed?units.filter((u,i)=>evidenceIndexes.includes(i)):[];
  function go(n){setIndex(Math.max(0,Math.min(checks.length-1,n)));setRevealed(false);}
  return <section className="swahili-classroom-reading">
    <div className="swahili-classroom-check-head">
      <button type="button" onClick={()=>onReadingPhase("silent")}>Anza kusoma kimya</button>
      <button type="button" onClick={()=>onReadingPhase("share")}>Gawa sehemu kwa wanafunzi</button>
      {readingPhase!=="idle"&&<button type="button" onClick={()=>onReadingPhase("idle")}>Maliza kusoma</button>}
    </div>
    {readingPhase==="silent"&&<p className="swahili-classroom-instruction">Soma kimya. Tumia Activity timer kupanga muda.</p>}
    {readingPhase==="share"&&<div className="swahili-classroom-meaning" role="status">{assignment?<><strong>{assignment.reader?.name}</strong><span>{assignment.chunk?.label} · Sentensi {activeNumbers.join(", ")}</span></>:<span>Chagua darasa kwenye orodha ya wanafunzi ili kugawa sehemu.</span>}</div>}
    <p className="swahili-classroom-instruction">Soma maandishi. Bonyeza maneno yaliyoangaziwa ili kuona maana yake.</p>
    <div className="swahili-classroom-passage">
      {units.map((unit,i)=><div key={unit.number} className={"swahili-reading-unit"+(activeNumbers.includes(unit.number)?" is-assigned":"")+(evidenceUnits.includes(unit)?" is-evidence":"")}>
        <span className="swahili-reading-number">{unit.number}</span>
        <div><p>{splitSwahiliReading(unit.text,stage.glossary || []).map((token,j)=>token.word ?
        <button type="button" className="swahili-classroom-word" aria-pressed={word?.word===token.word} key={j} onClick={()=>setWord(word?.word===token.word?null:token)}>{token.text}</button> : <span key={j}>{token.text}</span>)}</p>
        {unit.english&&<button type="button" className="swahili-reading-translation" aria-expanded={translation===i} onClick={()=>setTranslation(translation===i?null:i)}>{translation===i?"Ficha tafsiri":"English"}</button>}
        {translation===i&&unit.english&&<p className="swahili-reading-english" lang="en">{unit.english}</p>}</div>
      </div>)}
    </div>
    {word && <div className="swahili-classroom-meaning" role="status"><strong>{word.word}</strong><span lang="en">{word.meaning}</span><button type="button" onClick={()=>setWord(null)} aria-label="Ficha maana">×</button></div>}
    {children && <details><summary>Picha za menyu</summary>{children}</details>}
    {checks.length>0 && <div className="swahili-classroom-check">
      <div className="swahili-classroom-check-head"><strong>Maswali ya ufahamu · {checks.length}</strong>
        <button type="button" onClick={()=>{setReview(v=>!v);go(0);}}>{review?"Onyesha maswali yote":"Jadili majibu moja baada ya jingine"}</button></div>
      {review && current ? <>
        <p className="swahili-classroom-instruction">Swali {index+1} / {checks.length}</p><h2>{current[0]}</h2>
        <button type="button" aria-expanded={revealed} onClick={()=>setRevealed(v=>!v)}>{revealed?"Ficha jibu":"Onyesha jibu"}</button>
        {revealed && <><p role="status" className="swahili-a2-presenter__answer">{current[1]}</p>{evidenceUnits.length>0&&<div className="swahili-reading-evidence"><strong>Ushahidi katika maandishi</strong>{evidenceUnits.map(u=><p key={u.number}>{u.number}. {u.text}</p>)}</div>}</>}
        <div className="swahili-classroom-check-head"><button type="button" disabled={index===0} onClick={()=>go(index-1)}>← Rudi</button><button type="button" disabled={index===checks.length-1} onClick={()=>go(index+1)}>Swali linalofuata →</button></div>
      </> : <ol>{checks.map(([question],i)=><li key={i}>{question}</li>)}</ol>}
    </div>}
  </section>;
}

export function SwahiliClassroomRoleplay({stage}) {
  const [selected,setSelected]=useState(0);
  const [step,setStep]=useState(0);
  const [revealed,setRevealed]=useState(false);
  const situations=stage.situations||[];
  const scenario=situations[selected]||{title:stage.title,roleA:stage.roleA,roleB:stage.roleB,steps:[]};
  const current=scenario.steps[step];
  const select=i=>{setSelected(i);setStep(0);setRevealed(false);};
  const next=()=>{setStep(v=>v+1);setRevealed(false);};
  const random=()=>{if(situations.length>1)select((selected+1+Math.floor(Math.random()*(situations.length-1)))%situations.length);};
  return <section className="swahili-classroom-roleplay">
    <p className="swahili-classroom-instruction">Fanyeni kazi kwa jozi. Badilishaneni majukumu baada ya mazungumzo.</p>
    <div className="swahili-classroom-check-head">{situations.map((s,i)=><button type="button" key={s.id} aria-pressed={selected===i} onClick={()=>select(i)}>{i+1}. {s.title}</button>)}{situations.length>1&&<button type="button" onClick={random}>↻ Hali nyingine</button>}</div>
    <h2>{scenario.title}</h2>
    <div className="swahili-classroom-role-grid">
      <article><strong>Mwanafunzi A</strong><p>{scenario.roleA}</p></article>
      <article><strong>Mwanafunzi B</strong><p>{scenario.roleB}</p></article>
    </div>
    {current?<section className="swahili-classroom-check"><p>Swali {step+1} / {scenario.steps.length}</p><h2>{current.question}</h2><button type="button" aria-expanded={revealed} onClick={()=>setRevealed(v=>!v)}>{revealed?"Ficha mfano":"Onyesha mfano wa jibu"}</button>{revealed&&<p className="swahili-a2-presenter__answer">{current.answer}</p>}<button type="button" onClick={next}>{step===scenario.steps.length-1?"Maliza hali hii":"Swali linalofuata →"}</button></section>:scenario.steps.length>0&&<div className="swahili-classroom-meaning">Umekamilisha hali hii. Badilishaneni majukumu au chagua hali nyingine.<button type="button" onClick={()=>select(selected)}>Rudia</button></div>}
    <details><summary>Misemo ya kusaidia</summary><p>{stage.phrase}</p></details>
  </section>;
}
export function SwahiliClassroomPresentation({stage,children}) {
  const presets=presentationPresets(stage.level);
  const timer=usePresenterActivityTimer(presets[0]);
  return <section className="swahili-classroom-roleplay">
    <PresenterActivityTimer remaining={timer.remaining} running={timer.running} minutes={timer.minutes} presets={presets} onDurationChange={timer.chooseDuration} onToggle={timer.toggle} onReset={timer.reset} expired={timer.remaining===0}/>
    {timer.remaining===0&&<p role="status">Muda umekwisha.</p>}
    {children || <div className="swahili-classroom-passage">{String(stage.content||"").split("\n").filter(Boolean).map((line,i)=><p key={i}>{line.replace(/sekunde 60–90/g,stage.level==="B1"?"sekunde 90–120":"sekunde 30–60")}</p>)}</div>}
    <div className="swahili-classroom-role-grid"><article><strong>Mianzio ya sentensi</strong>{stage.starters?.map(s=><p key={s}>{s}</p>)}</article><article><strong>Msamiati muhimu</strong><p>{stage.keywords?.join(" · ")}</p></article></div>
    <details><summary>Orodha ya kujikagua</summary><p>Nimejibu mada. Nimetumia msamiati wa somo. Nimezungumza kwa uwazi.</p></details>
  </section>;
}

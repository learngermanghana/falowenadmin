import { useState } from "react";
import PublishedSongLessonStage from "./PublishedSongLessonStage.jsx";
import {
  A1_DAY17_SIGNS, A1_DAY17_DIRECTIONS, A1_DAY17_IMPERATIVES,
  A1_DAY17_READING, A1_DAY17_SPEAKING, A1_DAY17_DIALOGUE, A1_DAY17_LISTENING,
} from "../data/a1Day17Classroom.js";
import "./A1Day16NegationStage.css";
import "./A1Day17ClassroomStage.css";

const byId=id=>A1_DAY17_SIGNS.find(sign=>sign.id===id);
function Panel({children,className=""}) { return <div className={"a1n-panel "+className}>{children}</div>; }
function Reveal({answer,note="",label="Antwort anzeigen"}) {
  return <details className="a1d17-reveal"><summary>{label}</summary><div className="a1n-answer"><strong>{answer}</strong>{note&&<small>{note}</small>}</div></details>;
}
function Sign({id,showLabel=false}) {
  const sign=byId(id);
  if(!sign) return null;
  return <div className="a1d17-sign-wrap">
    <div role="img" aria-label={sign.sign} className={"a1d17-sign "+(sign.forbidden?"a1d17-forbidden":"a1d17-allowed")+(id==="parking"?" a1d17-parking":"")}>
      <span aria-hidden="true">{sign.icon}</span>
      {sign.forbidden&&id!=="entry"&&<i aria-hidden="true"/>}
    </div>
    {showLabel&&<strong>{sign.sign}</strong>}
  </div>;
}
function Intro(){return <>
  <h1>Was sehen Sie?</h1>
  <p className="a1n-lead">Schilder verstehen · nach dem Weg fragen · höfliche Anweisungen geben</p>
  <div className="a1d17-grid">
    <Panel><Sign id="smoking"/><h2>Was bedeutet das Schild?</h2><Reveal answer="Rauchen ist verboten."/></Panel>
    <Panel><span className="a1d17-arrow" aria-hidden="true">⬅</span><h2>Wohin gehen Sie?</h2><Reveal answer="Nach links. / Gehen Sie nach links."/></Panel>
    <Panel><Sign id="photo"/><h2>Ist Fotografieren erlaubt?</h2><Reveal answer="Nein, Fotografieren ist verboten."/></Panel>
  </div>
  <div className="a1n-note"><b>Lernziel:</b> Gehen Sie … · Darf ich …? · Das ist verboten / erlaubt.</div>
</>;}
function Directions(){return <>
  <h1>Anweisungen und Richtungen</h1><p className="a1n-lead">Sprechen Sie die Wörter laut. Zeigen Sie die Richtung.</p>
  <div className="a1d17-vocab">{A1_DAY17_DIRECTIONS.map(([icon,word,en])=><Panel key={word}><span className="a1d17-arrow" aria-hidden="true">{icon}</span><h2>{word}</h2><small>{en}</small></Panel>)}</div>
</>;}
function Imperative(){return <>
  <h1>Imperativ mit Sie</h1><p className="a1n-lead">Eine höfliche Anweisung: Das Verb steht an Position 1.</p>
  <div className="a1d17-frame"><b>Verb</b><b>Sie</b><span>Rest</span></div>
  <div className="a1d17-table"><table><thead><tr><th>Aussage</th><th>Anweisung</th></tr></thead><tbody>
    {[
      ["Sie gehen geradeaus.","Gehen Sie bitte geradeaus!"],
      ["Sie warten hier.","Warten Sie bitte hier!"],
      ["Sie öffnen das Fenster.","Öffnen Sie bitte das Fenster!"],
      ["Sie biegen rechts ab.","Biegen Sie rechts ab!"],
    ].map(([a,b])=><tr key={a}><td>{a}</td><td><strong>{b}</strong></td></tr>)}
  </tbody></table></div>
  <div className="a1n-note"><b>bitte</b> macht eine Anweisung höflicher. <b>abbiegen → Biegen Sie … ab.</b> Das Präfix steht am Ende.</div>
</>;}
function Practice(){return <>
  <h1>Geben Sie Anweisungen</h1><p className="a1n-lead">Bilden Sie einen Satz mit dem höflichen Imperativ.</p>
  <div className="a1d17-grid">{A1_DAY17_IMPERATIVES.map(([prompt,answer])=><Panel key={prompt}><h2>{prompt}</h2><Reveal answer={answer}/></Panel>)}</div>
</>;}
function Ask(){return <>
  <h1>Nach dem Weg fragen</h1>
  <div className="a1d17-table"><table><thead><tr><th>Deutsch</th><th>English</th></tr></thead><tbody>{[
    ["Entschuldigung, wo ist der Bahnhof?","Excuse me, where is the station?"],
    ["Wie komme ich zum Bahnhof?","How do I get to the station?"],
    ["Wie komme ich zur nächsten Apotheke?","How do I get to the nearest pharmacy?"],
    ["Ist das weit von hier?","Is it far from here?"],
    ["Können Sie mir bitte helfen?","Can you please help me?"],
  ].map(([a,b])=><tr key={a}><td><b>{a}</b></td><td>{b}</td></tr>)}</tbody></table></div>
  <div className="a1n-compare"><Panel><h2>zum = zu dem</h2><p>zum Bahnhof · zum Supermarkt · zum Hotel</p></Panel><Panel><h2>zur = zu der</h2><p>zur Apotheke · zur Bank · zur Schule</p></Panel></div>
  <Reveal label="Musterfrage zur Bank" answer="Entschuldigung, wie komme ich zur Bank?"/>
</>;}
const places=[
  {x:18,y:12,w:116,n:"Bahnhof",icon:"🚉"},{x:246,y:12,w:116,n:"Apotheke",icon:"💊"},
  {x:18,y:121,w:116,n:"Supermarkt",icon:"🛒"},{x:246,y:121,w:116,n:"Hotel",icon:"🏨"},
  {x:18,y:236,w:116,n:"Bank",icon:"🏦"},{x:246,y:236,w:116,n:"Schule",icon:"🏫"},
];
function CityMap(){
  const [destination,setDestination]=useState("Apotheke");
  const routes={
    Apotheke:"Gehen Sie geradeaus. Biegen Sie an der zweiten Kreuzung rechts ab. Die Apotheke ist auf der linken Seite.",
    Bahnhof:"Gehen Sie geradeaus. Biegen Sie an der zweiten Kreuzung links ab. Der Bahnhof ist auf der rechten Seite.",
    Hotel:"Gehen Sie geradeaus. Biegen Sie an der ersten Kreuzung rechts ab. Das Hotel ist auf der linken Seite.",
    Supermarkt:"Gehen Sie geradeaus. Biegen Sie an der ersten Kreuzung links ab. Der Supermarkt ist auf der rechten Seite.",
  };
  return <><h1>Beschreiben Sie den Weg</h1>
    <div className="a1d17-map-layout"><svg className="a1d17-map" viewBox="0 0 380 320" role="img" aria-label="Stadtplan: Start unten, Blick nach oben. Erste Kreuzung vor Supermarkt und Hotel; zweite Kreuzung vor Bahnhof und Apotheke.">
      <rect width="380" height="320" rx="12" fill="#e4ede0"/>
      <path d="M190 0V320M0 92H380M0 207H380" stroke="#7b8794" strokeWidth="38"/>
      <path d="M190 0V320M0 92H380M0 207H380" stroke="white" strokeWidth="2" strokeDasharray="8 7"/>
      {places.map(p=><g key={p.n}><rect x={p.x} y={p.y} width={p.w} height="55" rx="7" fill={p.n===destination?"#dbeafe":"white"} stroke={p.n===destination?"#2563eb":"#9ca3af"} strokeWidth={p.n===destination?3:1}/><text x={p.x+p.w/2} y={p.y+23} textAnchor="middle" fontSize="21">{p.icon}</text><text x={p.x+p.w/2} y={p.y+43} fill="#172b4d" fontSize="13" fontWeight="bold" textAnchor="middle">{p.n}</text></g>)}
      <circle cx="190" cy="284" r="10" fill="#2563eb" stroke="white" strokeWidth="2"/>
      <path d="M190 271V249M181 258L190 249L199 258" fill="none" stroke="#2563eb" strokeWidth="4"/>
      <text x="190" y="309" fill="white" fontWeight="bold" fontSize="11" textAnchor="middle">START ↑</text>
    </svg><Panel><h2>Person A fragt</h2><div className="a1n-actions">{Object.keys(routes).map(place=><button type="button" key={place} aria-pressed={destination===place} className={destination===place?"a1n-picked":"a1n-secondary"} onClick={()=>setDestination(place)}>{place}</button>)}</div><Reveal key={destination+"question"} label="Musterfrage zeigen" answer={"Entschuldigung, wie komme ich "+(destination==="Apotheke"?"zur Apotheke?":"zum "+destination+"?")}/>
      <h2>Person B antwortet</h2><Reveal key={destination+"route"} label="Musterweg zeigen" answer={routes[destination]}/><small>Danach Rollen wechseln. Start: unten, Blick nach oben.</small></Panel></div>
  </>;
}
function Signs(){return <>
  <h1>Verboten oder erlaubt?</h1><p className="a1n-lead">Was bedeutet das Schild? Sagen Sie einen ganzen Satz.</p>
  <div className="a1d17-grid">{A1_DAY17_SIGNS.slice(0,6).map(sign=><Panel key={sign.id}><Sign id={sign.id}/><Reveal label="Bedeutung zeigen" answer={sign.sentence} note={sign.modal}/></Panel>)}</div>
</>;}
function Permission(){return <>
  <h1>Verboten, erlaubt und dürfen</h1>
  <div className="a1n-compare"><Panel><Sign id="smoking"/><h2>Verboten</h2><p><b>Rauchen ist verboten.</b></p><p>Man darf hier nicht rauchen.</p><p>Rauchen Sie hier bitte nicht!</p></Panel>
    <Panel><div className="a1d17-sign a1d17-allowed" role="img" aria-label="Rauchen erlaubt">🚬</div><h2>Erlaubt</h2><p><b>Rauchen ist erlaubt.</b></p><p>Man darf hier rauchen.</p><p>Sie dürfen hier rauchen.</p></Panel></div>
  <div className="a1n-note"><b>Frage:</b> Darf ich hier parken? · <b>Ja, natürlich.</b> / Nein, das ist verboten.<br/>darf / dürfen + Infinitiv am Ende. Bei einem Verbot: nicht oder kein.</div>
  <div className="a1n-compare"><Panel><p>Parken ist verboten. Sagen Sie es mit <b>dürfen</b>.</p><Reveal answer="Sie dürfen hier nicht parken."/></Panel><Panel><p>Formulieren Sie eine Bitte: nicht parken.</p><Reveal answer="Parken Sie hier bitte nicht!"/></Panel></div>
</>;}
function Quiz({items,signs=false}){
  const [answers,setAnswers]=useState({});
  const [index,setIndex]=useState(0);
  const [idOrQuestion,statementOrOptions,right,note]=items[index];
  const options=signs?["Richtig","Falsch"]:statementOrOptions;
  const correct=signs?(right?"Richtig":"Falsch"):right;
  const answer=answers[index];
  return <div className="a1d17-quiz">
    <div className="a1n-actions"><strong>Aufgabe {index+1}/{items.length} · {Object.keys(answers).length}/{items.length} beantwortet</strong><button type="button" className="a1n-secondary" onClick={()=>{setAnswers({});setIndex(0);}}>Neu starten</button></div>
    <Panel><div className="a1d17-quiz-row">{signs&&<Sign id={idOrQuestion} showLabel/>}<div><h2>{index+1}. {signs?statementOrOptions:idOrQuestion}</h2><div className="a1n-actions">{options.map(option=><button type="button" key={option} aria-pressed={answer===option} className={answer===option?"a1n-picked":"a1n-secondary"} onClick={()=>setAnswers(old=>({...old,[index]:option}))}>{option}</button>)}</div>
      {answer&&<p role="status" className={answer===correct?"a1n-correct":"a1n-error"}>{answer===correct?"Richtig!":"Noch nicht. Lösung: "+correct}{note?" · "+note:""}</p>}</div></div></Panel>
    <div className="a1n-actions"><button type="button" className="a1n-secondary" disabled={index===0} onClick={()=>setIndex(i=>i-1)}>Vorherige Aufgabe</button><button type="button" disabled={index===items.length-1} onClick={()=>setIndex(i=>i+1)}>Nächste Aufgabe</button></div>
  </div>;
}
function Reading(){return <><h1>Lesen · Richtig oder falsch?</h1><p className="a1n-lead">Lesen Sie das Schild und die Aussage. Entscheiden Sie.</p><Quiz items={A1_DAY17_READING} signs/></>;}
function Speaking(){
  const [index,setIndex]=useState(0);const card=A1_DAY17_SPEAKING[index];
  return <><h1>Sprechen Teil 3 · Bitten und reagieren</h1><p className="a1n-lead">Sehen Sie das Bild. Formulieren Sie eine höfliche Bitte. Ihr Partner reagiert.</p>
    <Panel className="a1d17-speaking">{card.sign?<Sign id={card.sign}/>:<span className="a1d17-large-icon" role="img" aria-label={card.label}>{card.icon}</span>}<h2>Welche Bitte passt?</h2><Reveal key={index} answer={card.answer} note={"Reaktion: "+card.reaction}/></Panel>
    <div className="a1n-actions"><button type="button" disabled={index===0} className="a1n-secondary" onClick={()=>setIndex(i=>i-1)}>Zurück</button><strong>Bildkarte {index+1}/{A1_DAY17_SPEAKING.length}</strong><button type="button" onClick={()=>setIndex(i=>(i+1)%A1_DAY17_SPEAKING.length)}>Nächste Bildkarte</button></div>
    <div className="a1n-note">Eine passende höfliche Bitte mit <b>Sie</b> oder <b>Können Sie bitte …?</b> und eine kurze Reaktion genügen.</div>
  </>;
}
function Listening({hasMusic,assignmentKey,courseDay}){
  const [mode,setMode]=useState("dialogue");
  return <><h1>Anweisungen verstehen</h1>
    {hasMusic&&<div className="a1n-actions"><button type="button" aria-pressed={mode==="dialogue"} className={mode==="dialogue"?"a1n-picked":"a1n-secondary"} onClick={()=>setMode("dialogue")}>Hören · Dialog</button><button type="button" aria-pressed={mode==="music"} className={mode==="music"?"a1n-picked":"a1n-secondary"} onClick={()=>setMode("music")}>Falowen Music · Wo ist der Bahnhof?</button></div>}
    <div hidden={mode!=="dialogue"}><p className="a1n-lead">Hören Sie den Dialog zweimal. Wählen Sie die richtige Antwort.</p><Quiz items={A1_DAY17_LISTENING}/>
      <details className="a1d17-reveal"><summary>Transkript · Lehrkraft / nach dem Hören</summary><p><small>Die Lehrkraft liest den Dialog zweimal vor, ohne den Text vorher zu projizieren.</small></p>{A1_DAY17_DIALOGUE.map(([speaker,line],i)=><p key={i}><b>{speaker}:</b> {line}</p>)}</details></div>
    {mode==="music"&&hasMusic&&<PublishedSongLessonStage assignmentKey={assignmentKey} courseDay={courseDay} compact nextLyricOnly/>}
  </>;
}
const components={intro:Intro,directions:Directions,imperative:Imperative,practice:Practice,ask:Ask,map:CityMap,signs:Signs,permission:Permission,reading:Reading,speaking:Speaking,listening:Listening};
export default function A1Day17ClassroomStage({step,hasMusic,assignmentKey,courseDay}){
  const Stage=components[step];
  return Stage?<section className="a1n a1d17" lang="de"><Stage hasMusic={hasMusic} assignmentKey={assignmentKey} courseDay={courseDay}/></section>:null;
}

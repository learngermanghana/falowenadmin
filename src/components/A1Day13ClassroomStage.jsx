import {useEffect,useState} from "react";
import PublishedSongLessonStage from "./PublishedSongLessonStage.jsx";
import {DAY13_SENTENCES,DAY13_TIME_FIRST,DAY13_QUESTIONS,DAY13_W_QUESTIONS,DAY13_CORRECTIONS} from "../data/a1Day13Classroom.js";
import "./A1Day13ClassroomStage.css";
const Card=({children})=><div className="a1day13-card">{children}</div>;
function Practice({items,instruction}){
 const [index,setIndex]=useState(0),[show,setShow]=useState(false);
 return <Card><p>{instruction}</p><strong className="a1day13-prompt">{items[index][0]}</strong>
 {show?<strong role="status" className="a1day13-answer">{items[index][1]}</strong>:<p className="a1day13-muted">Erst selbst sprechen. Dann die Lösung zeigen.</p>}
 <div className="a1day13-actions"><button type="button" onClick={()=>setShow(v=>!v)}>{show?"Antwort verbergen":"Antwort zeigen"}</button><button type="button" onClick={()=>{setIndex(i=>(i+1)%items.length);setShow(false);}}>Nächste Aufgabe →</button></div></Card>;
}
export default function A1Day13ClassroomStage({step}){
 const [show,setShow]=useState(false);
 useEffect(()=>setShow(false),[step]);
 if(step==="music")return <PublishedSongLessonStage assignmentKey="A1-3.5" courseDay={13} compact nextLyricOnly />;
 return <section className="a1day13" lang="de">
 {step==="intro"&&<><h1>Aussagesätze und Fragen bilden</h1><p>Heute kannst du selbst kurze Sätze sagen und Fragen stellen.</p><div className="a1day13-grid">
 <Card><span className="a1day13-illustration" aria-hidden="true">🧑🏾‍🎓 📖</span><h2>Ich lerne Deutsch.</h2><p>Eine Aussage</p></Card>
 <Card><span className="a1day13-illustration" aria-hidden="true">🙋🏽‍♀️ ❓</span><h2>Lernst du Deutsch?</h2><p>Eine Frage</p></Card></div></>}
 {step==="model"&&<><h1>Wer macht was?</h1><div className="a1day13-grid">
 <Card><span className="a1day13-illustration" aria-hidden="true">👩🏾‍🏫 📚</span><h2>Die Lehrerin erklärt die Aufgabe.</h2><p>Wer? Die Lehrerin · Was macht sie? erklärt</p></Card>
 <Card><span className="a1day13-illustration" aria-hidden="true">🧑🏿‍🍳 ☕</span><h2>Der Mann trinkt Kaffee.</h2><p>Wer? Der Mann · Was macht er? trinkt</p></Card></div></>}
 {step==="verb"&&<><h1>Das Verb steht auf Position 2</h1><div className="a1day13-words"><span>1 · Ich</span><strong>2 · lerne</strong><span>3 · Deutsch.</span></div><Card><h2>Ich lerne Deutsch.</h2><p>Subjekt + konjugiertes Verb + weitere Information.</p><p><strong>Position 2</strong> bedeutet: Das Verb ist das zweite Satzglied, nicht immer das zweite einzelne Wort.</p></Card></>}
 {step==="build"&&<><h1>Bau einen ganzen Satz</h1><Practice key={step} instruction="Ordne die Wörter. Sprich einen vollständigen Satz." items={DAY13_SENTENCES}/></>}
 {step==="time"&&<><h1>Beginne mit einer Zeitangabe</h1><div className="a1day13-words"><span>1 · Heute</span><strong>2 · lerne</strong><span>3 · ich Deutsch.</span></div><Practice key={step} instruction="Beginne mit der Zeit. Was passiert mit dem Subjekt?" items={DAY13_TIME_FIRST}/></>}
 {step==="yesno"&&<><h1>Ja-/Nein-Fragen</h1><div className="a1day13-words"><strong>1 · Lernst</strong><span>2 · du</span><span>3 · Deutsch?</span></div><p>Bei Ja-/Nein-Fragen steht das Verb zuerst.</p><Practice key={step} instruction="Mach aus der Aussage eine Frage." items={DAY13_QUESTIONS}/></>}
 {step==="wquestions"&&<><h1>W-Fragen bilden</h1><div className="a1day13-words"><span>1 · Wo</span><strong>2 · wohnst</strong><span>3 · du?</span></div><div className="a1day13-grid"><Card><h2>Wo?</h2><p>Ort · place</p></Card><Card><h2>Wann?</h2><p>Zeit · time</p></Card><Card><h2>Wie?</h2><p>Art und Weise · how</p></Card><Card><h2>Was?</h2><p>Sache · what</p></Card></div></>}
 {step==="ask"&&<><h1>Stelle eine passende Frage</h1><Practice key={step} instruction="Lies die Antwort und stelle die richtige W-Frage." items={DAY13_W_QUESTIONS}/></>}
 {step==="correct"&&<><h1>Finde den Fehler</h1><Practice key={step} instruction="Verbessere die Wortstellung. Erkläre, wo das Verb steht." items={DAY13_CORRECTIONS}/></>}
 {step==="dialogue"&&<><h1>Frage deinen Partner</h1><div className="a1day13-grid">
 <Card><span className="a1day13-illustration" aria-hidden="true">👥</span><h2>Person A</h2><p>Frage: Wo wohnst du? Wann lernst du Deutsch? Trinkst du gern Tee?</p></Card>
 <Card><span className="a1day13-illustration" aria-hidden="true">💬</span><h2>Person B</h2><p>Antworte in ganzen Sätzen. Dann tauscht ihr die Rollen.</p></Card></div></>}
 {step==="exit"&&<><h1>Drei Sätze, zwei Fragen</h1><Card><p>Sprich über dich: deinen Wohnort, deinen Deutschkurs und deinen Alltag. Stelle danach eine W-Frage und eine Ja-/Nein-Frage.</p>
 <button type="button" onClick={()=>setShow(v=>!v)}>{show?"Beispiel verbergen":"Beispiel zeigen"}</button>
 {show&&<div className="a1day13-answer"><p>Ich wohne in Accra. Ich lerne heute Deutsch. Am Abend trinke ich Tee.</p><p>Wo wohnst du? Lernst du heute Deutsch?</p></div>}</Card>
 <a href="https://www.falowen.app/campus/course/a1-day-13-revision-numbers-time-and-prices-workbook" target="_blank" rel="noreferrer">Kursbuch öffnen</a></>}
 </section>;
}

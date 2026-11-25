import {useState} from "react";
import {QRCodeCanvas} from "qrcode.react";
import {grammarCards} from "../data/a2InteractiveGrammar.js";
import {presentationContext} from "../utils/classPresentation.js";
import GrammarConjugationCarousel from "./GrammarConjugationCarousel.jsx";
import "./A2LivePresentation.css";
import "./A2GrammarTools.css";

export default function A2GrammarTools({assignmentId,stage}){
 const cards=grammarCards(assignmentId,stage.id);
 const checks=(stage.items||[]).filter(item=>item.answer&&item.prompt);
 const context=presentationContext(typeof window==="undefined"?"":window.location.search,assignmentId);
 return <>
  {assignmentId.toUpperCase()==="A2-4.10"&&stage.id==="workbook-grammar-2"?<GrammarConjugationCarousel/>:cards.length>0?<GrammarCards cards={cards}/>:null}
  {checks.length>0&&context&&<GrammarPractice key={stage.id} checks={checks} context={context} stageId={stage.id}/>}
 </>;
}
function GrammarCards({cards}){
 const [index,setIndex]=useState(0);
 const card=cards[index];
 return <section className="presenter-conjugation-carousel" aria-label="Grammatik-Tabelle">
  <header className="presenter-conjugation-header">
   <h2>{card.title}</h2>
   {cards.length>1&&<div className="presenter-conjugation-navigation">
    <button type="button" disabled={index===0} onClick={()=>setIndex(i=>i-1)}>← Zurück</button>
    <strong aria-live="polite">{index+1}/{cards.length}</strong>
    <button type="button" disabled={index===cards.length-1} onClick={()=>setIndex(i=>i+1)}>Weiter →</button>
   </div>}
  </header>
  <div className="a2-grammar-table-wrap"><table className="a2-grammar-table"><thead><tr>{card.headers.map(h=><th key={h} scope="col">{h}</th>)}</tr></thead><tbody>{card.rows.map((row,i)=><tr key={i}>{row.map((cell,j)=><td key={j}>{cell}</td>)}</tr>)}</tbody></table></div>
  <p className="presenter-conjugation-example"><strong>Beispiel:</strong> {card.example}</p>
 </section>;
}
export function grammarExercisePayload(context,stageId,checks,index){
 const check=checks[index];
 return {...context,choice:"grammar-"+stageId+"-"+(index+1),prompt:check.prompt,keywords:[],questions:[]};
}
function GrammarPractice({checks,context,stageId}){
 const [index,setIndex]=useState(0),[active,setActive]=useState(false);
 return <section className="a2-grammar-live">
  <button type="button" className="a2-grammar-toggle" aria-expanded={active} onClick={()=>setActive(v=>!v)}>{active?"Klassenübung ausblenden":"Klassenübung · Antworten sammeln"}</button>
  {active&&<><label className="a2-grammar-choice">Aufgabe {checks.length>1?<select value={index} onChange={e=>setIndex(Number(e.target.value))}>{checks.map((c,i)=><option key={i} value={i}>Kurzcheck {i+1}</option>)}</select>:null}</label>
  <GrammarSession key={index} payload={grammarExercisePayload(context,stageId,checks,index)} model={checks[index].answer}/></>}
 </section>;
}
function GrammarSession({payload,model}){
 const [session,setSession]=useState(null),[rows,setRows]=useState([]),[selected,setSelected]=useState(""),[showQr,setShowQr]=useState(true),[showName,setShowName]=useState(false),[showModel,setShowModel]=useState(false),[busy,setBusy]=useState(""),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const response=rows.find(row=>row.id===selected);
 const link=session?window.location.origin+"/class-presentation/"+session.id:"";
 const api=async(path,body)=>(await import("../services/classPresentationService.js")).presentationRequest(path,body);
 async function run(name,fn){if(busy)return;setBusy(name);setError("");setNotice("");try{await fn();}catch(e){setError(e.message||"Bitte erneut versuchen.");}finally{setBusy("");}}
 async function refresh(id){const result=await api("teacher/"+id);setRows(result.responses||[]);}
 async function open(){await run("open",async()=>{const result=await api("open",payload);setSession(result.session);await refresh(result.session.id);setNotice("Link bereit.");});}
 return <div className="a2-live-presentation">
  <p className="a2-grammar-prompt">{payload.prompt}</p>
  {!session?<button type="button" disabled={!!busy} onClick={open}>{busy?"Wird geöffnet…":"QR & Link erstellen"}</button>:<>
   <div className="a2-live-actions">
    <button type="button" disabled={!!busy} onClick={()=>run("copy",async()=>{await navigator.clipboard.writeText(link);setNotice("Link kopiert.");})}>Zoom-Link kopieren</button>
    <button type="button" onClick={()=>setShowQr(v=>!v)}>{showQr?"QR ausblenden":"QR zeigen"}</button>
    <button type="button" disabled={!!busy} onClick={()=>run("refresh",async()=>{await refresh(session.id);setNotice("Antworten aktualisiert.");})}>{busy==="refresh"?"Lädt…":"Antworten aktualisieren"}</button>
   </div>
   {showQr&&!response&&<div className="a2-live-share"><QRCodeCanvas value={link} size={160} marginSize={4}/><div><strong>Scannen · anmelden · antworten</strong><p>Schreibe eine kurze Antwort und speichere sie.</p><a href={link} target="_blank" rel="noreferrer">Aufgabe öffnen</a></div></div>}
   <div className="a2-live-picker"><label>{rows.length} gespeichert <select value={selected} onChange={e=>{setSelected(e.target.value);setShowQr(false);setShowModel(false);setShowName(false);}}><option value="">Antwort auswählen</option>{rows.map((row,i)=><option value={row.id} key={row.id}>Antwort {i+1}</option>)}</select></label><button type="button" onClick={()=>{setSelected("");setShowQr(true);setShowModel(false);setShowName(false);}}>Zurück zur Aufgabe</button></div>
   {response&&<div className="a2-live-answer"><small>{showName?response.studentName:"Anonyme Antwort"} · Gemeinsam korrigieren</small><button type="button" onClick={()=>setShowName(v=>!v)}>{showName?"Name ausblenden":"Name zeigen"}</button><p>{response.answer}</p></div>}
   <button type="button" aria-expanded={showModel} onClick={()=>setShowModel(v=>!v)}>{showModel?"Musterlösung ausblenden":"Musterlösung zeigen"}</button>
   {showModel&&<p className="a2-grammar-model"><strong>Musterlösung:</strong> {model}</p>}
  </>}
  {notice&&<p role="status" className="a2-live-notice">{notice}</p>}{error&&<p role="alert" className="a2-live-error">{error}</p>}
 </div>;
}

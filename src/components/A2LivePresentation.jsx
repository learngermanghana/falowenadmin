import {useState} from "react";
import {QRCodeCanvas} from "qrcode.react";
import {presentationContext,presentationPrompt} from "../utils/classPresentation.js";
import PresentationFollowUpQuestions from "./PresentationFollowUpQuestions.jsx";
import "./A2LivePresentation.css";

export default function A2LivePresentation({task,choice,assignmentId,children}){
 const context=presentationContext(typeof window==="undefined"?"":window.location.search,assignmentId);
 const prompt=presentationPrompt(task,choice);
 const key=[context?.classId,context?.sessionId,assignmentId,prompt.choice].join("|");
 return <LiveSession key={key} context={context} prompt={prompt} task={task}>{children}</LiveSession>;
}
function LiveSession({context,prompt,task,children}){
 const [session,setSession]=useState(null),[canEmail,setCanEmail]=useState(false),[rows,setRows]=useState([]),[selected,setSelected]=useState(""),[busy,setBusy]=useState(""),[notice,setNotice]=useState(""),[error,setError]=useState(""),[showQr,setShowQr]=useState(true),[showTask,setShowTask]=useState(false);
 const answer=rows.find(row=>row.id===selected);
 const link=session?window.location.origin+"/class-presentation/"+session.id:"";
 async function action(name,fn){if(busy)return;setBusy(name);setError("");setNotice("");try{await fn();}catch(e){setError(e.message||"Please try again.");}finally{setBusy("");}}
 const api=async(path,body)=>(await import("../services/classPresentationService.js")).presentationRequest(path,body);
 async function open(){await action("open",async()=>{const result=await api("open",{...context,...prompt});setSession(result.session);setCanEmail(result.canEmail===true);setShowQr(true);const data=await api("teacher/"+result.session.id);setRows(data.responses||[]);setNotice("Link ready. Share it with your class.");});}
 async function refresh(){await action("refresh",async()=>{const data=await api("teacher/"+session.id);setRows(data.responses||[]);setNotice("Responses refreshed.");});}
 async function copy(){await action("copy",async()=>{await navigator.clipboard.writeText(link);setNotice("Link copied. Paste into Zoom chat.");});}
 async function email(){if(!window.confirm("Send the presentation link to the students in "+session.className+"?"))return;await action("email",async()=>{const {emailPresentationLink}=await import("../services/classPresentationService.js");await emailPresentationLink(session,link);setNotice("Email request accepted by the communication service.");});}
 if(!context)return <>{children}<small>Open this lesson from the class schedule to collect saved presentations.</small></>;
 return <section className="a2-live-presentation">
  {!session?<><div className="a2-live-toolbar"><strong>Schreiben → Speichern → Präsentieren</strong><button type="button" onClick={open} disabled={!!busy}>{busy==="open"?"Opening…":"Start writing · Link erstellen"}</button></div>{children}</>:
  <>
   <div className="a2-live-toolbar"><strong>{session.prompt}</strong><div className="a2-live-actions">
    <button type="button" onClick={copy} disabled={!!busy}>Copy Zoom link</button>
    <button type="button" onClick={()=>setShowQr(v=>!v)} aria-expanded={showQr}>{showQr?"Hide QR":"Show QR"}</button>
    {canEmail&&<button type="button" onClick={email} disabled={!!busy}>Email class</button>}
    <button type="button" onClick={refresh} disabled={!!busy}>{busy==="refresh"?"Loading…":"Refresh answers"}</button>
   </div></div>
   {showQr&&!answer&&<div className="a2-live-share"><QRCodeCanvas value={link} size={180} marginSize={4}/><div><h2>Schreibe 5–7 Sätze.</h2><p>Scan, sign in, write and save. Take 3–5 minutes.</p><p>{session.keywords.join(" · ")}</p><a href={link} target="_blank" rel="noreferrer">Open student page</a></div></div>}
   <div className="a2-live-picker"><label>{rows.length} saved · Choose student <select value={selected} onChange={e=>{setSelected(e.target.value);setShowQr(false);}}><option value="">No student selected</option>{rows.map(row=><option key={row.id} value={row.id}>{row.studentName}</option>)}</select></label><button type="button" onClick={()=>{setSelected("");setShowQr(true);}}>Back to writing</button></div>
   {answer?<div className="a2-live-answer"><small>{answer.studentName} · Lies deinen Text laut vor.</small><p>{answer.answer}</p><PresentationFollowUpQuestions level="A2" day={task.day}/></div>:<p className="a2-live-hint">Click Refresh answers when students finish. Select one student to display only their text.</p>}
   <button type="button" className="a2-live-task-toggle" onClick={()=>setShowTask(v=>!v)} aria-expanded={showTask}>{showTask?"Hide original workbook task":"Show original workbook task"}</button>{showTask&&children}
  </>}
  {notice&&<p role="status" className="a2-live-notice">{notice}</p>}{error&&<p role="alert" className="a2-live-error">{error}</p>}
 </section>;
}

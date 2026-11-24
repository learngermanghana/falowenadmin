import { useState } from "react";
import { auth } from "../firebase";
const endpoint = String(import.meta.env.VITE_MOCK_MONITOR_URL || "https://www.falowen.app/api/internal/mock-attempts").replace(/\/internal\/mock-attempts(?:\?.*)?$/, "/internal/mock-writing-tutor");
async function request(path, body) {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Sign in to open tutor marking.");
  const response = await fetch(endpoint + path, {method:body ? "POST" : "GET", cache:"no-store",
    headers:{Authorization:"Bearer "+token,Accept:"application/json",...(body?{"Content-Type":"application/json"}:{})},...(body?{body:JSON.stringify(body)}:{})});
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
}
export default function MockWritingTutorQueue() {
  const [rows,setRows]=useState(null), [selected,setSelected]=useState(null), [busy,setBusy]=useState(false), [notice,setNotice]=useState(""), [error,setError]=useState("");
  const [sms,setSms]=useState(""), [email,setEmail]=useState(""), [feedback,setFeedback]=useState(""), [attempt,setAttempt]=useState("");
  const run=async fn=>{setBusy(true);setError("");setNotice("");try{await fn()}catch(e){setError(e.message)}finally{setBusy(false)}};
  const load=async()=>{const data=await request("-queue");setRows(data.rows);if(data.partial)setNotice("Showing up to 50 pending reviews. Refresh after marking.");};
  const open= id=>run(async()=>{setSelected(await request("-item?id="+encodeURIComponent(id)));setSms("");setEmail("");setFeedback("");});
  const publish=()=>run(async()=>{await request("-publish",{id:selected.id,smsScore:Number(sms),emailScore:Number(email),feedback});setSelected(null);await load();setNotice("Tutor grade saved and verified mock result published.");});
  const recover=()=>run(async()=>{const data=await request("-recover",{attempt:attempt.trim()});setAttempt("");await load();setNotice(data.queued?"Saved attempt added to tutor marking.":"No pending review was created; the writing may already be graded.");});
  const valid=sms.trim()!==""&&email.trim()!==""&&Number.isFinite(Number(sms))&&Number.isFinite(Number(email))&&Number(sms)>=0&&Number(sms)<=10&&Number(email)>=0&&Number(email)<=15&&feedback.trim();
  return <section style={{border:"1px solid #ddd",borderRadius:12,padding:16,display:"grid",gap:12}}>
    <h2>Mock exams · Tutor marking</h2>
    <p>Failed AI writing assessments are sent here. Mark the original work and publish the verified result after the learner finishes the exam.</p>
    <button type="button" disabled={busy} onClick={()=>run(load)}>{rows===null?"Load pending mock reviews":"Refresh queue"}</button>
    {error&&<p role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}
    {rows!==null&&<>
      {rows.length===0?<p>No pending mock reviews.</p>:rows.map(row=><button key={row.id} type="button" disabled={busy} onClick={()=>open(row.id)} style={{textAlign:"left"}}>{row.studentEmail} · {row.mockId} · Schreiben pending</button>)}
      <details><summary>Recover an earlier failed mock</summary><label>Attempt identifier from mock monitoring <input value={attempt} onChange={e=>setAttempt(e.target.value)} placeholder="A2:uid:attemptId"/></label><button type="button" disabled={busy||!attempt.trim()} onClick={recover}>Send saved work to marking</button></details>
    </>}
    {selected&&<div style={{display:"grid",gap:12}}>
      <h3>{selected.studentEmail} · {selected.mockId}</h3>
      <details open><summary>Exam tasks</summary><pre style={{whiteSpace:"pre-wrap",fontFamily:"inherit"}}>{selected.task}</pre></details>
      <label>Teil 1 · SMS<textarea readOnly rows={5} value={selected.answers.sms} style={{width:"100%"}}/></label>
      <label>Teil 1 score /10 <input type="number" min="0" max="10" step="0.5" value={sms} onChange={e=>setSms(e.target.value)}/></label>
      <label>Teil 2 · E-Mail<textarea readOnly rows={7} value={selected.answers.email} style={{width:"100%"}}/></label>
      <label>Teil 2 score /15 <input type="number" min="0" max="15" step="0.5" value={email} onChange={e=>setEmail(e.target.value)}/></label>
      <label>Tutor feedback<textarea rows={5} value={feedback} onChange={e=>setFeedback(e.target.value)} style={{width:"100%"}}/></label>
      <strong>Total: {valid?Number((Number(sms)+Number(email)).toFixed(1)):"—"}/25</strong>
      {!selected.ready&&<p role="status">The remaining exam modules are not yet verified. Reopen this review after the student finishes.</p>}
      <button type="button" disabled={busy||!valid||!selected.ready} onClick={publish}>Publish verified result</button>
    </div>}
  </section>;
}

import {useEffect,useState} from "react";
import {auth} from "../firebase.js";
const initial={program:"german",level:"A1",tuitionFee:"3000",className:"",contractStart:"",contractEnd:"",paymentDeadline:""};
async function request(id,body){
 const token=await auth.currentUser?.getIdToken();
 const response=await fetch("/api/students/"+encodeURIComponent(id)+"/level-enrollments",{method:body?"POST":"GET",headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},...(body?{body:JSON.stringify(body)}:{})});
 const result=await response.json().catch(()=>({}));
 if(!response.ok||!result.ok)throw new Error(result.error||"Enrollment API unavailable ("+response.status+")");
 return result;
}
export default function StudentLevelEnrollments({student,pushToast}){
 const [rows,setRows]=useState([]),[draft,setDraft]=useState(initial),[open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const id=student.id;
 useEffect(()=>{let live=true;setRows([]);setError("");setOpen(false);setBusy(true);request(id).then(r=>{if(live)setRows(r.enrollments)}).catch(e=>{if(live)setError(e.message)}).finally(()=>{if(live)setBusy(false)});return()=>{live=false};},[id]);
 const save=async()=>{setBusy(true);try{const r=await request(id,draft);setRows(old=>[...old,r.enrollment]);setOpen(false);setDraft(initial);pushToast?.({type:"success",message:"Level enrollment created"});}catch(e){pushToast?.({type:"error",message:e.message});}finally{setBusy(false);}};
 const change=(key,value)=>setDraft(old=>({...old,[key]:value}));
 return <div style={{display:"grid",gap:12}}>
 <h3>Level enrollments</h3>
 <p style={{margin:0}}>One student, separate records for each language and level. New records are planned enrollments until payment, access and sheet integration is enabled.</p>
 <div style={{border:"1px solid #e2e8f0",padding:12,borderRadius:10}}><strong>Existing account (legacy)</strong><div>{student.paidLevel||student.level||"Unknown level"} · {student.className||"No class"}</div><small>Historical payments remain on the original account. No automatic allocation has been made.</small></div>
 {busy&&<p>Loading…</p>}{error&&<p role="alert">{error}</p>}
 {rows.map(row=><div key={row.id} style={{border:"1px solid #e2e8f0",borderRadius:10,padding:12}}><strong>{row.program} · {row.level}</strong><div>{row.className||"No class"} · {row.status}</div><div>Tuition: GH₵{row.tuitionFee} · Paid: GH₵{row.paid} · Balance: GH₵{row.balanceDue}</div><small>Payment deadline: {row.paymentDeadline||"Not set"}</small></div>)}
 <button type="button" disabled={busy||Boolean(error)} onClick={()=>setOpen(!open)}>{open?"Cancel":"+ Add level"}</button>
 {open&&<div className="student-detail-fields">
 <label>Language<select value={draft.program} onChange={e=>change("program",e.target.value)}><option value="german">German</option><option value="swahili">Kiswahili</option></select></label>
 <label>Level<select value={draft.level} onChange={e=>change("level",e.target.value)}>{["A1","A2","B1","B2","C1","C2"].map(l=><option key={l}>{l}</option>)}</select></label>
 <label>Tuition fee<input type="number" min="0" step="0.01" value={draft.tuitionFee} onChange={e=>change("tuitionFee",e.target.value)}/></label>
 <label>Class<input value={draft.className} onChange={e=>change("className",e.target.value)}/></label>
 {["contractStart","contractEnd","paymentDeadline"].map(k=><label key={k}>{({contractStart:"Contract start",contractEnd:"Contract end",paymentDeadline:"Payment deadline"})[k]}<input type="date" value={draft[k]} onChange={e=>change(k,e.target.value)}/></label>)}
 <button type="button" disabled={busy} onClick={save}>Add enrollment</button></div>}
 </div>;
}

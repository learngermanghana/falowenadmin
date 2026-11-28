import { useCallback,useEffect,useState } from "react";
import { auth } from "../firebase.js";
import "./Appointments.css";
const statuses=["new","reviewing","shortlisted","approved","declined"];
async function request(method="GET",body,pageToken=""){
 const token=await auth.currentUser?.getIdToken();if(!token)throw new Error("Please sign in.");
 const res=await fetch("/api/teacher-applications"+(pageToken?"?pageToken="+encodeURIComponent(pageToken):""),{method,headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},cache:"no-store",...(body?{body:JSON.stringify(body)}:{})});
 const data=await res.json();if(!res.ok||!data.ok)throw new Error(data.error||"Request failed.");return data;
}
function Application({item,onSave,onDelete,busy}){
 const [status,setStatus]=useState(item.status),[notes,setNotes]=useState(item.notes||"");
 return <article className="appt-panel" style={{overflowWrap:"anywhere"}}><h2>{item.name}</h2><p>{item.email} · {item.country} · {item.createdAt?.slice(0,10)}</p>
 <dl>{[["Languages",item.languages],["Levels",item.levels],["Qualifications",item.qualifications],["Experience",item.experience],["Availability",item.availability],["Hourly rate",item.rate]].map(([label,value])=><div key={label}><dt><strong>{label}</strong></dt><dd style={{whiteSpace:"pre-wrap",margin:"0 0 12px"}}>{value}</dd></div>)}</dl>
 <p><a href={item.videoUrl} target="_blank" rel="noopener noreferrer">Open reference video ↗</a> · <a href={"mailto:"+item.email}>Contact applicant</a></p>
 <form className="appt-form" onSubmit={e=>{e.preventDefault();onSave({id:item.id,status,notes});}}>
 <label>Review status<select value={status} onChange={e=>setStatus(e.target.value)}>{statuses.map(s=><option key={s}>{s}</option>)}</select></label>
 <label>Private review notes<textarea value={notes} maxLength={2000} onChange={e=>setNotes(e.target.value)} rows={3}/></label>
 <button disabled={busy} type="submit">Save review</button><button disabled={busy} type="button" onClick={()=>{if(window.confirm("Permanently delete this application?"))onDelete(item.id);}}>Delete application</button></form></article>;
}
export default function TeacherApplicationsPage(){
 const [items,setItems]=useState([]),[next,setNext]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState(""),[filter,setFilter]=useState("all");
 const load=useCallback(async(page="")=>{setBusy(true);setError("");try{const data=await request("GET",null,page);setItems(old=>page?[...old,...data.applications]:data.applications);setNext(data.nextPageToken);}catch(e){setError(e.message);}finally{setBusy(false);}},[]);
 useEffect(()=>{load();},[load]);
 async function save(body){setBusy(true);setError("");setNotice("");try{const data=await request("PATCH",body);setItems(old=>old.map(x=>x.id===body.id?data.application:x));setNotice("Review saved.");}catch(e){setError(e.message);}finally{setBusy(false);}}
 async function remove(id){setBusy(true);setError("");setNotice("");try{await request("DELETE",{id});setItems(old=>old.filter(x=>x.id!==id));setNotice("Application deleted.");}catch(e){setError(e.message);}finally{setBusy(false);}}
 return <main className="appt-root"><header className="appt-header"><h1>Teacher applications</h1><p>Review educators who want to collaborate with Falowen. Approval does not create a staff account.</p><a href="https://www.falowen.app/teach" target="_blank" rel="noopener noreferrer">Open public application page ↗</a></header>
 {error&&<p role="alert" className="appt-message error">{error}</p>}{notice&&<p role="status" className="appt-message success">{notice}</p>}
 <section className="appt-panel"><label>Filter loaded applications <select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All</option>{statuses.map(s=><option key={s}>{s}</option>)}</select></label> <button disabled={busy} onClick={()=>load()}>Refresh</button><p>{items.length} loaded</p></section>
 {busy&&<p role="status">Loading or saving…</p>}{!busy&&!items.length&&!error&&<p>No teacher applications yet.</p>}
 {items.filter(x=>filter==="all"||x.status===filter).map(item=><Application key={item.id} item={item} onSave={save} onDelete={remove} busy={busy}/>)}
 {next&&<button disabled={busy} onClick={()=>load(next)}>Load more</button>}</main>;
}
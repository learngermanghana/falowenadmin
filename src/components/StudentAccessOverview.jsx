import { useEffect, useState } from "react";
import { auth } from "../firebase.js";
import { loadAccessSubscriptions } from "../services/studentsService.js";

function dateMs(value) {
  if (!value) return NaN;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.seconds === "number") return value.seconds*1000;
  return typeof value === "number" ? value : Date.parse(value);
}
const fmt = value => Number.isFinite(dateMs(value)) ? new Date(dateMs(value)).toLocaleDateString("en-GB") : "Not recorded";
const label = program => program==="swahili"?"Kiswahili":"German";
export function studentAccessRows(student, now=Date.now()) {
  const rows=[];
  const primary=student.program||"german";
  const add=(program,record)=>{
    if(!record) return;
    const trialEnd=dateMs(record.trialEndsAt);
    const end=dateMs(record.contractEnd);
    const paid=Number(record.paid||0)>0 || ["paid","partial","partially paid","partially_paid"].includes(String(record.paymentStatus||"").toLowerCase());
    const complimentary=record.accessType==="complimentary";
    let state="Unconfirmed";
    let expiry=record.contractEnd;
    if(complimentary && Number.isFinite(end)) state=end>now?"Complimentary":"Expired";
    else if(paid && Number.isFinite(end)) state=end>now?"Paid contract":"Expired";
    else if(!paid && Number.isFinite(trialEnd)) {state=trialEnd>now?"Trial":"Expired";expiry=record.trialEndsAt;}
    else if(paid) state="Payment recorded";
    rows.push({program,level:record.level,state,expiry});
  };
  if(student.accountType!=="exam_only") add(primary,student);
  if(student.secondaryProgram && student.secondaryProgram!==primary) add(student.secondaryProgram,student.coursePlacements?.[student.secondaryProgram]);
  return rows;
}

export default function StudentAccessOverview({student,students=[],onManage}) {
  const owner=auth.currentUser?.emailVerified===true && auth.currentUser.email?.toLowerCase()==="moxflex@gmail.com";
  const [state,setState]=useState({loading:true,rows:[]});
  const [filter,setFilter]=useState("all");
  const [attempt,setAttempt]=useState(0);
  const id=student?.id||"";
  useEffect(()=>{
    if(!owner) return undefined;
    let mounted=true;
    setState({loading:true,rows:[]});
    loadAccessSubscriptions({studentId:id}).then(data=>{if(mounted)setState({loading:false,rows:data.subscriptions,next:data.nextCursor,identityUnavailable:data.identityUnavailable});})
      .catch(error=>{if(mounted)setState({loading:false,rows:[],error:error.message});});
    return ()=>{mounted=false;};
  },[id,owner,attempt]);
  const more=async()=>{
    if(!state.next||state.loadingMore)return;
    setState(prev=>({...prev,loadingMore:true}));
    try {const data=await loadAccessSubscriptions({studentId:id,cursor:state.next});
      setState(prev=>({...prev,rows:[...prev.rows,...data.subscriptions.filter(row=>!prev.rows.some(old=>old.id===row.id))],next:data.nextCursor,loadingMore:false}));
    } catch(error){setState(prev=>({...prev,loadingMore:false,error:error.message}));}
  };
  const courseRows=student?studentAccessRows(student):students.flatMap(s=>studentAccessRows(s).map(row=>({...row,student:s})));
  const shown=courseRows.filter(row=>filter==="all"||row.state===filter||(filter==="Expiring"&&dateMs(row.expiry)>Date.now()&&dateMs(row.expiry)<=Date.now()+7*86400000));
  const status=row=>row.status==="active" && Number(row.expiresAtMs)>Date.now()?"Active":row.status==="active"?"Expired":row.status||"Unknown";
  return <section style={{display:"grid",gap:12}}>
    <h3 style={{margin:0}}>{student?"Course and subscription access":"Subscription overview"}</h3>
    <p>Course records and standalone exam subscriptions are separate. These summaries do not grant access.</p>
    {!student && <label>Course filter <select value={filter} onChange={e=>setFilter(e.target.value)}>{["all","Paid contract","Trial","Complimentary","Expiring","Expired","Payment recorded","Unconfirmed"].map(v=><option key={v} value={v}>{v==="all"?"All course records":v}</option>)}</select></label>}
    <div style={{overflowX:"auto"}}>
      <table style={{width:"100%"}}><thead><tr>{!student&&<th>Student</th>}<th>Course</th><th>Status</th><th>End date</th></tr></thead>
      <tbody>{shown.map((row,i)=><tr key={(row.student?.id||id)+row.program+i}>{!student&&<td>{row.student.name||row.student.studentCode||row.student.id}</td>}<td>{label(row.program)} {row.level}</td><td>{row.state}</td><td>{fmt(row.expiry)}</td></tr>)}</tbody></table>
      {!shown.length&&<p>No matching course records.</p>}
    </div>
    {student && <div style={{display:"flex",gap:8,flexWrap:"wrap"}}><button type="button" onClick={()=>onManage("class")}>Manage language access and contracts</button><button type="button" onClick={()=>onManage("payments")}>Billing records</button></div>}
    <h3>Standalone exam subscriptions</h3>
    {!owner?<p>Verified owner access is required to view subscription records.</p>:state.loading?<p role="status">Loading subscriptions…</p>:<>
      {state.error&&<p role="alert">{state.error}</p>}
      {state.identityUnavailable&&<p>Student login is not linked. Subscription status is unknown.</p>}
      {!state.rows.length&&!state.error&&!state.identityUnavailable&&<p>No subscription records found.</p>}
      {state.rows.map(row=>{const linked=students.find(s=>s.uid===row.uid);return <div key={row.id} style={{border:"1px solid #dbe4ee",borderRadius:8,padding:10}}>{!student&&<strong>{linked?.name||"Unmatched student" } · </strong>}{row.level} · {row.scope==="trial"?"Exam trial":"Monthly exam"} · {status(row)} · Ends {fmt(row.expiresAtMs)}</div>;})}
      {state.next&&<button type="button" onClick={more} disabled={state.loadingMore}>{state.loadingMore?"Loading…":"Load next 50 subscriptions"}</button>}
      <button type="button" onClick={()=>setAttempt(x=>x+1)}>Refresh subscriptions</button>
    </>}
  </section>;
}

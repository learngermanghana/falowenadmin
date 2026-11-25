import { useMemo, useState } from "react";
import { auth } from "../firebase.js";
import { readyWeeklyPeriods } from "../utils/weeklyAttendanceOutbox.js";

export default function AttendanceWeeklyEmailOutbox({ classes = [], sessionsByClass = {}, loading = false }) {
  const [sentKeys,setSentKeys]=useState({});
  const [busy,setBusy]=useState("");
  const [message,setMessage]=useState("");
  const pending=useMemo(()=>classes.flatMap(klass=>readyWeeklyPeriods(klass,sessionsByClass[klass.id||klass.classRecordId||klass.classId]))
    .filter(row=>!sentKeys[row.classId+"::"+row.weekStart]),[classes,sessionsByClass,sentKeys]);
  async function reviewAndSend(row){
    const key=row.classId+"::"+row.weekStart;
    if(busy)return;
    setBusy(key);setMessage("");
    try{
      const user=auth.currentUser;
      if(!user)throw new Error("Sign in as administrator.");
      const token=await user.getIdToken();
      const params=new URLSearchParams({classId:row.classId,weekStart:row.weekStart});
      const request=async (query,method="GET")=>{
        const response=await fetch("/api/weekly-engagement-summary?"+query,{method,headers:{Authorization:"Bearer "+token}});
        const result=await response.json().catch(()=>({}));
        if(!response.ok||!result.ok)throw new Error(result.error||"Email request failed.");
        return result;
      };
      const preview=await request(new URLSearchParams({...Object.fromEntries(params),preview:"1"}));
      if(!preview.sendEnabled)throw new Error("Weekly email sending is disabled. Verify the Apps Script setup in Communication first.");
      if(!preview.eligibleRecipients)throw new Error("No eligible recipients, or this report was already sent. Reload Attendance to check.");
      if(!window.confirm("Send "+preview.eligibleRecipients+" weekly summaries for "+row.className+" ("+row.weekStart+" to "+row.weekEnd+")?"))return;
      const result=await request(new URLSearchParams({...Object.fromEntries(params),send:"1",recipients:String(preview.eligibleRecipients)}),"POST");
      setSentKeys(old=>({...old,[key]:true}));
      setMessage(row.className+": "+result.sent+" sent, "+result.skipped+" already delivered. Removed from pending.");
    }catch(error){setMessage(error.message||"Could not send. Report remains pending.");}
    finally{setBusy("");}
  }
  return <section aria-label="Pending attendance emails" style={{margin:"16px 0",padding:14,border:"1px solid #dbe3ee",borderRadius:12,background:"#fff"}}>
    <h2 style={{margin:"0 0 6px",fontSize:18}}>Attendance emails to send ({pending.length})</h2>
    <p style={{margin:"0 0 10px",fontSize:13,color:"#475569"}}>Weekly reports appear after the last scheduled lesson is completed. Send manually via Apps Script; confirmed reports disappear from this list.</p>
    {loading?<p>Checking loaded class schedules…</p>:null}
    {!loading&&!pending.length?<p>No weekly reports ready to send.</p>:null}
    {pending.map(row=>{const key=row.classId+"::"+row.weekStart;return <div key={key} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,padding:"10px 0",borderTop:"1px solid #e2e8f0",flexWrap:"wrap"}}>
      <div><strong>{row.className}</strong><div style={{fontSize:13}}>{row.weekStart} to {row.weekEnd} · {row.lessons} completed lessons</div></div>
      <button type="button" disabled={Boolean(busy)} onClick={()=>reviewAndSend(row)}>{busy===key?"Checking / sending…":"Review & send"}</button>
    </div>;})}
    {message?<p role="status">{message}</p>:null}
  </section>;
}

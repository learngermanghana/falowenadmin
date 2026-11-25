import { useMemo, useState } from "react";
import { auth } from "../firebase.js";
import { manualAttendanceWeeks } from "../utils/weeklyAttendanceOutbox.js";

const classKey=klass=>String(klass.id||klass.classRecordId||klass.classId||"");
export default function AttendanceWeeklyEmailOutbox({ classes = [], sessionsByClass = {}, loading = false, onRefresh }) {
  const [selectedClass,setSelectedClass]=useState("");
  const [from,setFrom]=useState("");
  const [through,setThrough]=useState("");
  const [busy,setBusy]=useState("");
  const [message,setMessage]=useState("");
  const [preview,setPreview]=useState(null);
  const [sentKeys,setSentKeys]=useState({});
  const klass=classes.find(item=>classKey(item)===selectedClass)||(classes.length===1?classes[0]:null);
  const classId=klass?classKey(klass):"";
  const weeks=manualAttendanceWeeks(klass,sessionsByClass[classId]);
  const start=weeks.some(w=>w.weekStart===from)?from:weeks.at(-1)?.weekStart||"";
  const finish=weeks.some(w=>w.weekStart===through&&w.weekStart>=start)?through:start;
  const rangeLength=start&&finish?Math.round((Date.parse(finish)-Date.parse(start))/604800000)+1:0;
  const sentHistory=useMemo(()=>{
    const history=new Map(Object.entries(sentKeys));
    for(const item of classes){
      for(const receipt of Object.values(item.weeklyEngagementSentWeeks||{})){
        if(receipt?.status!=="sent"||!receipt.weekStart)continue;
        history.set(classKey(item)+"::"+receipt.weekStart,{...receipt,className:item.name||item.className||classKey(item)});
      }
    }
    return [...history.values()].sort((a,b)=>b.weekStart.localeCompare(a.weekStart));
  },[classes,sentKeys]);
  function reset(){setPreview(null);setMessage("");}
  async function request(params,method="GET"){
    const user=auth.currentUser;
    if(!user)throw new Error("Sign in as administrator.");
    const token=await user.getIdToken();
    const response=await fetch("/api/weekly-engagement-summary?"+new URLSearchParams(params),{method,headers:{Authorization:"Bearer "+token}});
    const result=await response.json().catch(()=>({}));
    if(!response.ok||!result.ok)throw new Error(result.error||"Email request failed.");
    return result;
  }
  const params={classId,weekStart:start,throughWeekStart:finish,manualRange:"1"};
  async function review(){
    if(busy||!classId||rangeLength<1||rangeLength>16)return;
    setBusy("preview");reset();
    try{setPreview(await request({...params,preview:"1"}));}
    catch(error){setMessage(error.message||"Could not preview the report.");}
    finally{setBusy("");}
  }
  async function send(){
    if(busy||!preview?.sendEnabled||!preview.eligibleRecipients)return;
    if(!window.confirm("Send "+preview.eligibleRecipients+" student emails for the selected weeks? Already-sent weeks are excluded."))return;
    setBusy("send");setMessage("");
    try{
      const result=await request({...params,send:"1",recipients:String(preview.eligibleRecipients),signature:preview.signature},"POST");
      setSentKeys(old=>({...old,...Object.fromEntries((result.weeks||[]).map(w=>[classId+"::"+w.weekStart,{className:klass.name||klass.className||classId,weekStart:w.weekStart,recipients:w.eligibleRecipients,status:"sent"}]))}));
      setPreview(null);
      setMessage(result.sent+" sent · "+result.skipped+" already delivered.");
    }catch(error){setPreview(null);setMessage(error.message||"Could not send. Preview again to retry safely.");}
    finally{setBusy("");}
  }
  return <section aria-label="Attendance emails" style={{margin:"16px 0",padding:14,border:"1px solid #dbe3ee",borderRadius:12,background:"#fff"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
      <h2 style={{margin:"0 0 6px",fontSize:18}}>Send attendance emails</h2>
      {onRefresh?<button type="button" disabled={loading||Boolean(busy)} onClick={()=>{reset();onRefresh();}}>Refresh reports</button>:null}
    </div>
    <p style={{margin:"0 0 12px",fontSize:13,color:"#475569"}}>Choose a class and the week or weeks you want to send. No need to wait for class completion. Only past lessons with recorded attendance or confirmed completion count.</p>
    <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"end"}}>
      <label style={{flex:"2 1 200px",display:"grid",gap:4}}>Class
        <select value={classId} disabled={loading||Boolean(busy)} onChange={event=>{setSelectedClass(event.target.value);setFrom("");setThrough("");reset();}}>
          <option value="">Choose a class</option>
          {classes.map(item=><option key={classKey(item)} value={classKey(item)}>{item.name||item.className||classKey(item)}</option>)}
        </select>
      </label>
      <label style={{flex:"1 1 170px",display:"grid",gap:4}}>From week
        <select value={start} disabled={!weeks.length||Boolean(busy)} onChange={event=>{setFrom(event.target.value);setThrough(event.target.value);reset();}}>
          {weeks.map(w=><option key={w.weekStart} value={w.weekStart}>Week {w.week} · {w.weekStart}</option>)}
        </select>
      </label>
      <label style={{flex:"1 1 170px",display:"grid",gap:4}}>To week
        <select value={finish} disabled={!weeks.length||Boolean(busy)} onChange={event=>{setThrough(event.target.value);reset();}}>
          {weeks.filter(w=>w.weekStart>=start).map(w=><option key={w.weekStart} value={w.weekStart}>Week {w.week} · {w.weekEnd}</option>)}
        </select>
      </label>
      <button type="button" disabled={!classId||!rangeLength||rangeLength>16||Boolean(busy)} onClick={review}>{busy==="preview"?"Preparing…":"Preview report"}</button>
    </div>
    {rangeLength>16?<p role="status">Select up to 16 weeks at a time.</p>:null}
    {preview?<div style={{marginTop:14,borderTop:"1px solid #e2e8f0",paddingTop:12}}>
      <strong>{preview.eligibleRecipients} emails ready</strong>
      {(preview.weeks||[]).map(w=><div key={w.weekStart} style={{fontSize:13,padding:"5px 0"}}>{w.weekStart} – {w.weekEnd}: {w.alreadySent?"Already sent":w.skipped?"Email disabled":w.eligibleRecipients+" recipients · "+(w.lessonsHeld||0)+" lessons"}{w.unverifiedLessons?" · "+w.unverifiedLessons+" past lessons without attendance excluded":""}</div>)}
      <p style={{fontSize:13}}>One summary per student per selected week. Already-sent weeks are skipped. If you send this week early, it will count as sent.</p>
      {!preview.sendEnabled?<p role="status">Weekly email sending is disabled. Check the existing Apps Script integration.</p>:null}
      <button type="button" disabled={Boolean(busy)||!preview.sendEnabled||!preview.eligibleRecipients} onClick={send}>{busy==="send"?"Sending…":"Send emails"}</button>
    </div>:null}
    {message?<p role="status">{message}</p>:null}
    {sentHistory.length>0&&<details style={{marginTop:10}}><summary>Sent reports ({sentHistory.length})</summary>{sentHistory.map((row,index)=><div key={row.className+"::"+row.weekStart+"::"+index} style={{padding:"6px 0",fontSize:13}}>{row.className} · Week of {row.weekStart} · {row.recipients} recipients</div>)}</details>}
  </section>;
}

import {useState} from "react";
import {auth} from "../firebase";
import {loadSpeakingPracticeReview} from "../services/speakingPracticeReviewService";

const panel={border:"1px solid #dbe4ef",borderRadius:14,background:"#fff",padding:18,display:"grid",gap:12};
const sub={color:"#475569",fontSize:14,lineHeight:1.6,margin:0};
const label={display:"grid",gap:6,fontWeight:650,fontSize:14};
const button={border:0,borderRadius:10,padding:"11px 16px",cursor:"pointer",background:"#1d4ed8",color:"#fff",fontWeight:750};
const fmtDate=value=>value&&!Number.isNaN(Date.parse(value))?new Date(value).toLocaleString("en-GB",{dateStyle:"medium",timeStyle:"short"}):"Not recorded";
const sourceLabel=source=>source==="course_book"?"Course Book":"Exams Room";

export default function SpeakingPracticeReviewPage(){
  const [student,setStudent]=useState("");
  const [level,setLevel]=useState("all");
  const [data,setData]=useState(null);
  const [working,setWorking]=useState(false);
  const [error,setError]=useState("");
  const check=async(view)=>{
    if(working)return;
    setWorking(true);setError("");setData(null);
    try{setData(await loadSpeakingPracticeReview({auth,student,level,view}));}
    catch(err){setError(err?.message||"Could not load speaking activity.");}
    finally{setWorking(false);}
  };
  const overview=data?.view==="activity";
  const activity=data?.activity||[];
  return <main style={{maxWidth:1100,margin:"0 auto",padding:"24px 16px",display:"grid",gap:16}}>
    <header>
      <h1 style={{margin:"0 0 6px"}}>Student speaking results</h1>
      <p style={sub}>See student names and saved speaking practice scores for A1–B2 Exams Room and Course Book sessions.</p>
    </header>
    <section style={panel} aria-label="Speaking activity controls">
      <div style={{display:"flex",gap:12,flexWrap:"wrap",alignItems:"end"}}>
        <label style={{...label,flex:"1 1 130px"}}>Level
          <select value={level} onChange={e=>setLevel(e.target.value)} style={{padding:10,border:"1px solid #94a3b8",borderRadius:8}}>
            <option value="all">A1–B2</option>
            {["A1","A2","B1","B2"].map(v=><option value={v} key={v}>{v}</option>)}
          </select>
        </label>
        <button type="button" onClick={()=>check("activity")} disabled={working} style={button}>{working?"Checking saved activity…":"Load / refresh speaking results"}</button>
      </div>
      <form onSubmit={e=>{e.preventDefault();check("student");}} style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"end"}}>
        <label style={{...label,flex:"2 1 280px"}}>Optional: look up one student
          <input minLength={3} maxLength={150} required value={student} onChange={e=>setStudent(e.target.value)}
            placeholder="Registered email, student code or UID"
            style={{padding:10,border:"1px solid #94a3b8",borderRadius:8}}/>
        </label>
        <button type="submit" disabled={working} style={{...button,background:"#334155"}}>View student's scores</button>
      </form>
      <p style={sub}>Results update when you press Refresh. Sessions without a saved mark show “Not scored yet”.</p>
    </section>
    {error&&<p role="alert" style={{...panel,color:"#b91c1c"}}>{error}</p>}
    {data&&<section aria-label="Speaking monitoring results" style={{display:"grid",gap:16}}>
      <p style={sub}>Checked {fmtDate(data.checkedAt)}.{data.limited ? " Showing the latest available records." : ""}</p>
      {overview?<section style={panel}>
        <h2 style={{margin:0}}>Recent student results · A1–B2</h2>
        {!activity.length&&<p style={sub}>No recent Live AI examiner session records were returned for this filter.</p>}
        {activity.map((item,i)=><article key={item.uid+"-"+item.assignmentKey+"-"+i}
          style={{padding:12,border:"1px solid #e2e8f0",borderRadius:10,display:"grid",gap:5}}>
          <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
            <strong>{item.studentName || item.studentEmail || "Student name unavailable"}</strong>
            <span style={{...sub,color:item.state==="processing"?"#9a3412":"#475569"}}>{item.state==="processing"?"AI response processing":item.state==="session_open"?"Session open":"Ended / expired"}</span>
          </div>
          <p style={sub}>{item.level} · {sourceLabel(item.source)}{item.assignmentKey ? " · " + item.assignmentKey : ""} · {fmtDate(item.startedAt)}</p>
          <strong>Practice score: {item.score === null || item.score === undefined ? "Not scored yet" : `${Number(item.score.toFixed(2))}%`}</strong>
        </article>)}
      </section>:<section style={panel}>
        <h2 style={{margin:0}}>Student speaking progress</h2>
        <p style={sub}>{data.student?.name||data.student?.email||"Student name unavailable"} · {data.results?.length||0} recent completed examiner snapshots</p>
        {data.course?.length>0&&data.course.map(item=><div key={item.assignmentKey}>
          <strong>{item.assignmentKey} · {item.status==="completed"?"Final score saved":"Final score pending"}</strong>
          <p style={sub}>Verified parts in recent results: {item.savedPartCount}/3 · Score: {item.score??"Not saved"}</p>
        </div>)}
        {(data.results||[]).map(item=><div key={item.id} style={{padding:12,border:"1px solid #e2e8f0",borderRadius:9}}>
          <strong>{item.level} · {sourceLabel(item.source)} · {item.teil||"Practice"}</strong>
          <p style={sub}>{fmtDate(item.createdAt)} · {item.answeredQuestions} confirmed answers · Mark: {item.score===null?"Not available":item.score+"%"} · {item.completed?"Completed":"Unverified completion"}</p>
        </div>)}
        {!data.results?.length&&<p style={sub}>No completed examiner snapshots found for this student. This does not prove they never practised.</p>}
      </section>}
    </section>}
  </main>;
}

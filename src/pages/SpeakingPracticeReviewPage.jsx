import {useState} from "react";
import {auth} from "../firebase";
import {loadSpeakingPracticeReview} from "../services/speakingPracticeReviewService";

const panel={border:"1px solid #dbe4ef",borderRadius:14,background:"#fff",padding:16,display:"grid",gap:12};
const textStyle={color:"#475569",fontSize:14,lineHeight:1.6,margin:0};
const label={display:"grid",gap:5,fontWeight:700,fontSize:14,color:"#334155"};
const button={background:"#1d4ed8",color:"#fff",fontWeight:750,padding:"11px 16px",border:0,borderRadius:9,cursor:"pointer"};
const fmtDate=value=>value?new Date(value).toLocaleString("en-GB",{dateStyle:"medium",timeStyle:"short"}):"Not recorded";
const niceSource=value=>value==="course_book"?"Course Book":"Exams Room";

export default function SpeakingPracticeReviewPage(){
  const [student,setStudent]=useState("");
  const [level,setLevel]=useState("all");
  const [data,setData]=useState(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const run=async event=>{
    event.preventDefault();
    if(loading)return;
    setData(null);setError("");setLoading(true);
    try{setData(await loadSpeakingPracticeReview({auth,student,level}));}
    catch(err){setError(err?.message||"Unable to read saved speaking attempts.");}
    finally{setLoading(false);}
  };
  return <main style={{maxWidth:1120,margin:"0 auto",padding:"24px 16px",display:"grid",gap:17}}>
    <header style={{display:"grid",gap:5}}>
      <h1 style={{margin:0,fontSize:26}}>Speaking Practice Review</h1>
      <p style={textStyle}>Review students' actual confirmed German answers in A1–B2 Live AI examiner sessions, including Course Book and Exams Room. Nothing is loaded until you search.</p>
    </header>
    <form onSubmit={run} style={panel} aria-label="Find student speaking work">
      <div style={{display:"flex",flexWrap:"wrap",gap:12,alignItems:"end"}}>
        <label style={{...label,flex:"2 1 260px"}}>
          Student login email, UID, student code, or exact full name
          <input type="text" required minLength={3} maxLength={150} value={student} onChange={e=>setStudent(e.target.value)}
            placeholder="Search one student…" aria-label="Student speaking review search"
            style={{padding:11,borderRadius:8,border:"1px solid #94a3b8",fontSize:15}}/>
        </label>
        <label style={{...label,flex:"1 1 110px"}}>Level
          <select value={level} onChange={e=>setLevel(e.target.value)} style={{padding:11,borderRadius:8,border:"1px solid #94a3b8",background:"white"}}>
            <option value="all">A1–B2</option><option value="A1">A1</option><option value="A2">A2</option>
            <option value="B1">B1</option><option value="B2">B2</option>
          </select>
        </label>
        <button type="submit" style={button} disabled={loading}>{loading?"Loading saved work…":"View saved speaking"}</button>
      </div>
      <p style={textStyle}>On-demand only · No background polling · No new transcription or AI marking calls. Student answers remain read-only.</p>
    </form>
    {error&&<section role="alert" style={{...panel,borderColor:"#fecaca",color:"#991b1b"}}>{error}</section>}
    {data&&<section style={{display:"grid",gap:16}} aria-label="Saved speaking practice">
      <div style={panel}>
        <h2 style={{margin:0,fontSize:19}}>{data.student?.name||data.student?.email||"Student speaking history"}</h2>
        <p style={textStyle}>{data.student?.email||data.student?.uid} · Checked {fmtDate(data.checkedAt)} · {data.results?.length||0} saved examiner result(s)</p>
        <p style={{...textStyle,color:"#92400e"}}>
          <strong>Voice recording availability:</strong> Older Live examiner microphone recordings were transcribed, not saved as playable files. Below are the student's genuine confirmed transcripts—not AI-generated audio or reconstructed recordings.
        </p>
        {data.limited&&<p role="status" style={textStyle}>Showing a bounded selection of saved attempts. Older results may not be included; search is not proof that other practice never happened.</p>}
      </div>
      {data.course?.length>0&&<section style={panel} aria-label="Course speaking mock status">
        <h2 style={{margin:0,fontSize:18}}>Course Book · Graded speaking mock</h2>
        {data.course.map(row=><div key={row.assignmentKey} style={{padding:11,borderRadius:9,background:"#f8fafc",display:"grid",gap:5}}>
          <strong>{row.assignmentKey} · {row.status==="completed"?"Final score saved":"Final score not yet saved"}</strong>
          <span style={textStyle}>Verified speaking snapshots found: {row.savedPartCount}/3 · Final score: {row.score===null?"Not recorded":row.score+"/100"}</span>
          {row.sectionScores&&<span style={textStyle}>Teil 1: {row.sectionScores.teil1??"—"} · Teil 2: {row.sectionScores.teil2??"—"} · Teil 3: {row.sectionScores.teil3??"—"}</span>}
          {row.status!=="completed"&&<small>Partial progress is not a failed result. Do not ask the student to repeat existing marked recordings before reviewing the recovered parts.</small>}
        </div>)}
      </section>}
      <section style={panel}>
        <h2 style={{margin:0,fontSize:18}}>Verified Live AI examiner practice</h2>
        {!data.results?.length&&<p style={textStyle}>No completed Live AI examiner snapshots were returned for this student and level. This does not cover older offline/device-only practice or every legacy mock system.</p>}
        {(data.results||[]).map(item=><article key={item.id} style={{padding:14,border:"1px solid #e2e8f0",borderRadius:10,display:"grid",gap:9}}>
          <div style={{display:"flex",justifyContent:"space-between",gap:8,flexWrap:"wrap"}}>
            <strong>{niceSource(item.source)} · {item.level} · {item.teil||"Speaking practice"}</strong>
            <span style={{...textStyle,fontWeight:600}}>{fmtDate(item.createdAt)}</span>
          </div>
          {item.assignmentKey&&<small>Assignment: {item.assignmentKey}</small>}
          {item.taskTitle&&<p style={textStyle}><strong>Task:</strong> {item.taskTitle}</p>}
          <p style={textStyle}><strong>Examiner mark:</strong> {item.score===null?"Not available":item.score+"%"} · {item.completed?"Task completed":"Completion not verified"} · Audio replay not available</p>
          <details>
            <summary style={{cursor:"pointer",fontWeight:750}}>Read student's confirmed German answers ({item.answers?.length||0})</summary>
            <ol style={{display:"grid",gap:7,paddingLeft:23}}>
              {(item.answers||[]).map((answer,i)=><li key={i} style={{lineHeight:1.6,whiteSpace:"pre-wrap"}}>{answer}</li>)}
            </ol>
            {!item.answers?.length&&<p style={textStyle}>No confirmed answers in this snapshot.</p>}
          </details>
          <details>
            <summary style={{cursor:"pointer",fontWeight:750}}>Examiner conversation and feedback</summary>
            <div style={{display:"grid",gap:9,marginTop:9}}>
              {(item.dialogue||[]).map((turn,i)=><p key={i} style={{...textStyle,background:turn.role==="student"?"#eff6ff":"#f8fafc",padding:9,borderRadius:8,whiteSpace:"pre-wrap"}}><strong>{turn.role==="student"?"Student":"Examiner"}:</strong> {turn.text}</p>)}
              {item.feedback&&<p style={{...textStyle,whiteSpace:"pre-wrap"}}><strong>Marking feedback:</strong> {item.feedback}</p>}
            </div>
          </details>
        </article>)}
      </section>
    </section>}
  </main>;
}

import {useState} from 'react';
import {auth} from '../firebase';
import {loadExamRoomPracticeSubmissions} from '../services/studentResultsService';
import {loadSpeakingPracticeReview} from '../services/speakingPracticeReviewService';
import {trackingRows,filterTracking} from '../utils/examTracking';
import SpeakingPracticeReviewPage from './SpeakingPracticeReviewPage';
import TimedAssignmentAttemptsPage from './TimedAssignmentAttemptsPage';
const box={border:'1px solid #dbe4ef',borderRadius:12,padding:16,background:'#fff'};
const labels={all:'All activity',lesen:'Lesen',hoeren:'Hören',schreiben:'Schreiben',sprechen:'Sprechen',mock:'Full mocks',mixed:'Mixed'};
const mockUrl=String(import.meta.env.VITE_MOCK_MONITOR_URL||'https://www.falowen.app/api/internal/mock-attempts').trim();
export default function ExamTrackingPage(){
  const [tab,setTab]=useState('overview');
  const [rows,setRows]=useState([]),[search,setSearch]=useState(''),[level,setLevel]=useState('all'),[skill,setSkill]=useState('all');
  const [followUp,setFollowUp]=useState(false),[busy,setBusy]=useState(false),[messages,setMessages]=useState([]),[checked,setChecked]=useState('');
  const refresh=async()=>{
    if(busy)return;setBusy(true);setMessages([]);
    const sources=await Promise.allSettled([
      loadExamRoomPracticeSubmissions(),
      loadSpeakingPracticeReview({auth,view:'activity'}),
      (async()=>{const token=await auth.currentUser.getIdToken();const response=await fetch(mockUrl,{headers:{Authorization:`Bearer ${token}`},cache:'no-store'});
        const data=await response.json();if(!response.ok||data.ok===false)throw new Error(data.error||'Mock results unavailable');return data;})(),
    ]);
    const errors=[],data=sources.map((result,i)=>{
      if(result.status==='rejected'){errors.push(`${['Practice scores','Speaking activity','Full mocks'][i]} unavailable: ${result.reason?.message||'Please retry'}`);return null;}
      if(result.value.partial||result.value.limited)errors.push(`${['Practice scores','Speaking activity','Full mocks'][i]}: limited recent-history window.`);
      return result.value;
    });
    setRows(trackingRows(data[0]?.rows,data[1]?.activity,data[2]?.attempts));setMessages(errors);setChecked(new Date().toLocaleString());setBusy(false);
  };
  const filtered=filterTracking(rows,{search,level,skill,followUp});
  return <main style={{maxWidth:1200,margin:'auto',padding:16,display:'grid',gap:16}}>
    <header><h1>Exam Tracking</h1><p>Student practice scores and mock progress in one place. Search a student to review their activity and decide who needs follow-up.</p></header>
    <nav aria-label="Exam tracking views" style={{display:'flex',gap:8,flexWrap:'wrap'}}>
      {[['overview','All skills & follow-up'],['speaking','Speaking details'],['mocks','Mocks & timers']].map(([key,title])=><button key={key} type="button" aria-pressed={tab===key} onClick={()=>setTab(key)}>{title}</button>)}
    </nav>
    {tab==='speaking'&&<SpeakingPracticeReviewPage/>}
    {tab==='mocks'&&<TimedAssignmentAttemptsPage/>}
    {tab==='overview'&&<>
      <section style={{...box,display:'flex',gap:12,flexWrap:'wrap',alignItems:'center'}}>
        <button type="button" disabled={busy} onClick={refresh}>{busy?'Loading…':'Load / refresh results'}</button>
        <label>Find student <input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Name, email, student code"/></label>
        <label>Level <select value={level} onChange={e=>setLevel(e.target.value)}>{['all','A1','A2','B1','B2','C1','C2'].map(v=><option key={v} value={v}>{v==='all'?'All levels':v}</option>)}</select></label>
        <label>Practice <select value={skill} onChange={e=>setSkill(e.target.value)}>{Object.entries(labels).map(([v,label])=><option key={v} value={v}>{label}</option>)}</select></label>
        <label><input type="checkbox" checked={followUp} onChange={e=>setFollowUp(e.target.checked)}/> Needs follow-up: below 60% or no saved score</label>
      </section>
      <p>{checked?`Last checked: ${checked} · ${filtered.length} matching records`:'Press Load to check saved records.'} Updates are on demand.</p>
      {messages.map(message=><p role="status" key={message}>{message}</p>)}
      <p>Practice marks are separate from verified mock results. Missing records do not prove a student has not practised. Older writing attempts may only be in writing history.</p>
      {checked&&!filtered.length&&<p>No saved activity matches these filters.</p>}
      {filtered.map(row=><article key={row.skill+row.id} style={box}>
        <strong>{row.name||row.email||row.studentCode||'Student name unavailable'}</strong>
        <p>{row.email||row.studentCode} · {row.level} · {labels[row.skill]} · {row.title}</p>
        <p><strong>{row.score==null?'Not scored yet':`${row.score}%`}</strong> · {row.status} · {row.date?new Date(row.date).toLocaleString():'Date not recorded'}</p>
        {row.email&&<a href={`mailto:${encodeURIComponent(row.email)}`}>Email student</a>}
      </article>)}
    </>}
  </main>;
}

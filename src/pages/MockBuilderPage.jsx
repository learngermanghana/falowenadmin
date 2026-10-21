import {useEffect,useMemo,useState} from "react";
import {collection,doc,getDocs,serverTimestamp,setDoc} from "firebase/firestore";
import {db} from "../firebase";
import {useAuth} from "../context/AuthContext";
import {MOCK_LEVELS,MOCK_SECTIONS,newMockDraft,validateMockDraft,exportMockDraft} from "../utils/mockFactoryDraft";
import "./MockBuilderPage.css";

const names={lesen:"Lesen",hoeren:"Hören",schreiben:"Schreiben",sprechen:"Sprechen"};
const detail={
  lesen:"Texts, question options and answer key · server will own final marks",
  hoeren:"Four Teile, protected R2 MP3 references, scripts and validated correct answers",
  schreiben:"Prompt wording and level-specific OpenAI scoring rubric",
  sprechen:"Examiner questions/parts and verified speaking receipt/rubric requirements",
};
const yes=["ready","answerKeyVerified","audioVerified","rubricVerified"];
const labelName={ready:"Content checked",answerKeyVerified:"Answer key checked",audioVerified:"R2 file + playback verified",rubricVerified:"Rubric reviewed"};
const qaLabels={studentResultSaved:"Student sees verified result",adminResultSaved:"Admin result saved",safeRetry:"Retry does not repeat grading",backendVerified:"Production Firebase API verified",frontendVerified:"Production Falowen site verified"};
const field=(title,children)=><label className="mock-builder-field"><span>{title}</span>{children}</label>;

function SectionEditor({section,part,onChange}){
  const json=String(part?.tasksJson||"");
  const taskCount=(()=>{try{const data=JSON.parse(json);return Array.isArray(data)?data.length:0;}catch{return 0;}})();
  const addTask=()=>{
    let tasks=[];try{const v=JSON.parse(json);if(Array.isArray(v))tasks=v;}catch{tasks=[];}
    tasks.push({id:`${section}-${tasks.length+1}`,prompt:"",options:[],part:1});
    onChange({tasksJson:JSON.stringify(tasks,null,2),questionCount:tasks.length});
  };
  return <section className="mock-builder-section">
    <div className="mock-builder-section-title"><div><h3>{names[section]}</h3><p>{detail[section]}</p></div>
      <span>{taskCount} tasks entered</span></div>
    <div className="mock-builder-grid">
      {field("Question/task count",<input type="number" min="0" value={part.questionCount||0} onChange={e=>onChange({questionCount:Math.max(0,Number(e.target.value))})}/>)}
      {(section==="lesen"||section==="hoeren")?field("Correct-answer count",<input type="number" min="0" value={part.answerKeyCount||0} onChange={e=>onChange({answerKeyCount:Math.max(0,Number(e.target.value))})}/>):null}
    </div>
    {field("Exam questions / tasks (editable JSON array)",<textarea rows={9} spellCheck={false} value={json} placeholder={'[{"id":"1","prompt":"...","part":1,"options":["a","b","c"]}]'} onChange={e=>onChange({tasksJson:e.target.value})}/>)}
    <button type="button" className="mock-builder-quiet" onClick={addTask}>+ Add question or task</button>
    {(section==="lesen"||section==="hoeren")&&field("Correct answers (JSON by question ID — kept in staff-only drafts)",
      <textarea rows={5} spellCheck={false} placeholder={'{"1":"a","2":"b"}'} value={part.answerKeyJson||""} onChange={e=>onChange({answerKeyJson:e.target.value})}/>)}
    {section==="hoeren"&&field("Protected Cloudflare R2 MP3 manifest (JSON array)",
      <textarea rows={5} spellCheck={false} placeholder={'[{"teil":1,"objectKey":"mock-hoeren/mock-03/teil-1.mp3"}]'} value={part.audioManifestJson||""} onChange={e=>onChange({audioManifestJson:e.target.value})}/>)}
    {(section==="schreiben"||section==="sprechen")&&field("Level-specific grading rubric and task notes",
      <textarea rows={4} value={part.rubricNotes||""} onChange={e=>onChange({rubricNotes:e.target.value})} placeholder="Describe evidence required for automated grading. The backend must separately verify this rubric."/>)}
    {field("Teacher review notes",<textarea rows={2} value={part.notes||""} onChange={e=>onChange({notes:e.target.value})} placeholder="Audio QA, confusing questions, corrections and remaining work"/>)}
    <div className="mock-builder-checks">
      {yes.filter(key=>key==="ready"||(key==="answerKeyVerified"&&["lesen","hoeren"].includes(section))||(key==="audioVerified"&&section==="hoeren")||(key==="rubricVerified"&&["schreiben","sprechen"].includes(section))).map(key=><label key={key}><input type="checkbox" checked={Boolean(part[key])} onChange={e=>onChange({[key]:e.target.checked})}/>{labelName[key]}</label>)}
    </div>
  </section>;
}

export default function MockBuilderPage(){
  const {user}=useAuth();
  const [drafts,setDrafts]=useState([]);
  const [selected,setSelected]=useState("a2-mock-03");
  const [level,setLevel]=useState("A2");
  const [number,setNumber]=useState(3);
  const [draft,setDraft]=useState(()=>newMockDraft("A2",3));
  const [section,setSection]=useState("hoeren");
  const [status,setStatus]=useState("");
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);
  const errors=useMemo(()=>validateMockDraft(draft),[draft]);
  const finished=MOCK_SECTIONS.filter(key=>draft.sections?.[key]?.ready).length;

  const refresh=async()=>{
    const snaps=await getDocs(collection(db,"mockFactoryDrafts"));
    const records=snaps.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>String(a.id).localeCompare(String(b.id)));
    setDrafts(records);
    return records;
  };
  useEffect(()=>{
    let active=true;
    refresh().then(items=>{
      if(!active)return;
      const prev=items.find(x=>x.id==="a2-mock-03");
      if(prev){setDraft(prev);setSelected(prev.id);}
    }).catch(e=>{if(active)setError(e.message||"Could not load saved mocks.");});
    return()=>{active=false;};
  },[]);

  const choose=(id)=>{
    const match=drafts.find(item=>item.id===id);
    if(match){setDraft(match);setSelected(id);setSection("hoeren");setStatus("");setError("");}
  };
  const create=()=>{
    try{
      const item=newMockDraft(level,number);
      const saved=drafts.find(x=>x.id===item.id);
      if(saved){choose(item.id);return;}
      setDraft(item);setSelected(item.id);setSection("lesen");setError("");setStatus("New draft. Save to keep your work across devices.");
    }catch(e){setError(e.message);}
  };
  const change=(data)=>setDraft(prev=>({...prev,...data}));
  const changePart=(data)=>setDraft(prev=>({...prev,sections:{...prev.sections,[section]:{...prev.sections[section],...data}}}));
  const save=async()=>{
    if(!user?.uid){setError("Sign in as Falowen staff to save drafts.");return;}
    if(!["draft","review"].includes(draft.status)){setError("Only draft and review statuses can be saved.");return;}
    setBusy(true);setError("");setStatus("");
    try{
      const clean={...draft,updatedBy:user.uid,updatedAt:serverTimestamp()};
      await setDoc(doc(db,"mockFactoryDrafts",draft.id),clean,{merge:false});
      const items=await refresh();
      const found=items.find(x=>x.id===draft.id);
      if(found)setDraft(found);
      setStatus("Draft saved privately. It has not been published to students.");
    }catch(e){setError(e.message||"Could not save draft. Confirm staff access and Firestore rules.");}
    finally{setBusy(false);}
  };
  const download=()=>{
    const blob=new Blob([exportMockDraft(draft)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const anchor=document.createElement("a");
    anchor.href=url;anchor.download=`${draft.id}-teacher-draft.json`;anchor.click();
    URL.revokeObjectURL(url);
    setStatus("Teacher draft exported. This file is not a public exam.");
  };
  const active=draft.sections?.[section]||newMockDraft(draft.level||"A2",draft.mockNumber||3).sections[section];
  return <main className="mock-builder">
    <header className="mock-builder-header">
      <div><p className="mock-builder-eyebrow">FALOWEN ADMIN · EXAM FACTORY</p><h1>Mock Exam Builder</h1>
        <p>Create A1–C2 exam content without duplicating the marking engine. Drafts stay private until a tested runtime and verified production release exist.</p></div>
      <span className="mock-builder-draft">DRAFT-ONLY</span>
    </header>
    <div className="mock-builder-layout">
      <aside className="mock-builder-panel">
        <h2>Your mock drafts</h2>
        <p>Continue existing work or create another level.</p>
        {drafts.length?drafts.map(item=><button type="button" className={`mock-builder-draft-row ${item.id===selected?"active":""}`} key={item.id} onClick={()=>choose(item.id)}>
          <strong>{item.title||item.id}</strong><small>{item.status||"draft"} · {item.level}</small></button>):<p>No saved drafts yet. Mock 3 is prepared as a new local draft.</p>}
        <h3>New mock</h3>
        {field("Level",<select value={level} onChange={e=>setLevel(e.target.value)}>{MOCK_LEVELS.map(x=><option key={x}>{x}</option>)}</select>)}
        {field("Mock number",<input value={number} min="1" max="999" type="number" onChange={e=>setNumber(Number(e.target.value))}/>)}
        <button type="button" className="mock-builder-primary" onClick={create}>Create or open draft</button>
      </aside>
      <div className="mock-builder-body">
        <section className="mock-builder-panel">
          <div className="mock-builder-overview">
            <div><span className="mock-builder-eyebrow">{draft.id}</span>
            {field("Exam title",<input value={draft.title||""} onChange={e=>change({title:e.target.value})}/>)}</div>
            <div><strong>{finished} / 4</strong><span>Sections content-reviewed</span></div>
          </div>
          <div className="mock-builder-progress"><span style={{width:`${finished/4*100}%`}}/></div>
          <p><strong>Publication:</strong> Unavailable in Admin until server-side marking, results persistence, QA and both live deployments are verified in Falowen's code. These checkboxes are review notes, not publication authorization.</p>
          {draft.id==="a2-mock-03"&&<p className="mock-builder-note">Mock 3 Hören Teil 4 draft: <a href="https://github.com/learngermanghana/falowenexamtrainer/pull/3080" target="_blank" rel="noreferrer">Ein neuer Job — PR #3080</a>. Review the ambiguous first Richtig/Falsch answer against the audio before finishing.</p>}
          {field("Internal review status",<select value={draft.status||"draft"} onChange={e=>change({status:e.target.value})}><option value="draft">Draft</option><option value="review">Teacher review</option></select>)}
        </section>
        <div className="mock-builder-tabs" role="tablist" aria-label="Exam modules">
          {MOCK_SECTIONS.map(key=><button key={key} type="button" role="tab" aria-selected={section===key} className={section===key?"active":""} onClick={()=>setSection(key)}>{names[key]} {draft.sections?.[key]?.ready?"✓":""}</button>)}
        </div>
        <SectionEditor section={section} part={active} onChange={changePart}/>
        <section className="mock-builder-panel">
          <h2>Full-exam release gate</h2><p>Use the same completion, result saving and retry verification for every Goethe level. This is a teacher checklist, not a substitute for CI.</p>
          <div className="mock-builder-checks">
            {Object.entries(qaLabels).map(([key,label])=><label key={key}><input type="checkbox" checked={Boolean(draft.qa?.[key])} onChange={e=>change({qa:{...draft.qa,[key]:e.target.checked}})}/>{label}</label>)}
          </div>
          <strong>{errors.length===0?"Content QA complete — runtime approval still required":`${errors.length} release checks remaining`}</strong>
          {errors.length>0?<details><summary>View outstanding checks</summary><ul>{errors.map((message,i)=><li key={i}>{message}</li>)}</ul></details>:null}
        </section>
        {error?<p role="alert" className="mock-builder-error">{error}</p>:null}
        {status?<p role="status" className="mock-builder-success">{status}</p>:null}
        <div className="mock-builder-actions"><button type="button" disabled={busy} className="mock-builder-primary" onClick={save}>{busy?"Saving…":"Save private draft"}</button>
          <button type="button" className="mock-builder-quiet" onClick={download}>Export teacher JSON</button>
          <button type="button" disabled title="Requires verified engine, published backend and frontend, and end-to-end CI">Publish exam · locked</button>
        </div>
      </div>
    </div>
  </main>;
}

import {useEffect,useRef,useState} from "react";
import {getStudioStatus,makeListeningScript,makeListeningQuestions,makeSpeechClip} from "../services/hoerenStudioService";
import {parseStudioTranscript,repairUnlabelledStudioLines,base64WavToBytes,assembleListeningExam} from "../utils/hoerenAudio";
import {assignGoetheSpeakers} from "../utils/hoerenProductionDefaults";
import {buildStudioSpeechPlan,assemblyScenePlan,sceneVoiceKey} from "../utils/hoerenSpeechPlan";
import {getSavedVoice,saveVoice} from "../utils/hoerenVoiceCache";
import {validateDraftQuestions} from "../utils/hoerenQuestions";
import {encodeWavAsMp3} from "../utils/hoerenMp3";
import {buildExamZip} from "../utils/hoerenExamBundle";
import {bundleKey,loadExamParts,saveExamParts,deleteExamParts} from "../utils/hoerenExamBundleCache";
const LEVELS=["A1","A2","B1","B2","C1","C2"];
const keysOf=p=>Object.keys(p||{}).sort((a,b)=>Number(a)-Number(b));
function countScripts(level,missing) {
  return missing.reduce((n,p)=>n+(level==="B1"&&p==="1"?2:1),0);
}
function noteFor(part){
  if(part?.kind==="richtig-falsch")return part.answer||"";
  const index=Number(part?.correctIndex);
  return Number.isInteger(index)&&index>=0&&index<3?"abc"[index]:"";
}
function PartAudio({blob,label}){
  const [src,setSrc]=useState("");
  useEffect(()=>{
    if(!(blob instanceof Blob)){setSrc("");return;}
    const url=URL.createObjectURL(blob);setSrc(url);
    return()=>URL.revokeObjectURL(url);
  },[blob]);
  return src?<audio aria-label={label} controls preload="none" src={src}/>:null;
}
export default function HoerenBatchPanel({profiles={},ready=false,initialLevel="B1"}){
  const [level,setLevel]=useState(initialLevel);
  const [mock,setMock]=useState("03");
  const [topic,setTopic]=useState("Alltag, Reisen, Gesellschaft und Arbeit");
  const [engine,setEngine]=useState("lite");
  const [includeSlides,setIncludeSlides]=useState(true);
  const [records,setRecords]=useState({});
  const [loading,setLoading]=useState(true);
  const [working,setWorking]=useState("");
  const [notice,setNotice]=useState("");
  const [error,setError]=useState("");
  const [quota,setQuota]=useState(null);
  const [storageWarning,setStorageWarning]=useState("");
  const cacheRef=useRef({});
  const cancelRef=useRef(false);
  const key=bundleKey(level,mock);
  const profile=profiles?.[level]||{};
  const indexes=keysOf(profile);
  const complete=indexes.length>0&&indexes.every(i=>records[i]?.audio instanceof Blob&&records[i]?.questions?.length&&records[i]?.approved);
  const missing=indexes.filter(i=>!records[i]?.script);
  useEffect(()=>{
    let active=true;
    setLoading(true);setError("");setNotice("");setRecords({});cacheRef.current={};
    loadExamParts(key).then(x=>{if(active){cacheRef.current=x;setRecords(x)}})
      .catch(()=>{if(active)setStorageWarning("Persistent storage is unavailable. Keep this tab open and download the ZIP before closing.")})
      .finally(()=>{if(active)setLoading(false)});
    return()=>{active=false};
  },[key]);
  async function savePart(index,change){
    const next={...cacheRef.current,[index]:{...cacheRef.current[index],...change}};
    cacheRef.current=next;setRecords(next);
    try{await saveExamParts(key,next)}
    catch{setStorageWarning("Could not save this exam in browser storage; download it before leaving this tab.")}
    return next[index];
  }
  function checkReady(){
    if(!ready||!indexes.length)throw new Error("Choose a supported level and check the AI Studio key.");
    if(loading)throw new Error("Saved work is still loading.");
  }
  async function generatePart(index){
    const preset=profile[index];
    const existing=cacheRef.current[index]||{};
    if(existing.audio instanceof Blob&&existing.questions?.length)return;
    let state=existing;
    if(!state.script){
      setWorking(`Teil ${index}: script and questions`);
      const quota=await getStudioStatus();
      const needed=level==="B1"&&index==="1"?2:1;
      if(quota.remaining.script<needed)throw new Error(`Teil ${index} needs ${needed} script requests; only ${quota.remaining.script} remain. Resume after quota reset.`);
      const reply=await makeListeningScript({
        topic:`${topic}. Independent Teil ${index}; no repeated scenarios between parts.`,
        type:preset.type,level,part:index,mode:"goethe",kind:preset.kind
      });
      const script=assignGoetheSpeakers(repairUnlabelledStudioLines(reply.script));
      const base=validateDraftQuestions({script,questions:reply.questions,kind:preset.kind,expectedCount:preset.questionCount});
      let all=base.map(q=>({...q,kind:preset.kind}));
      if(level==="B1"&&index==="1"){
        setWorking("Teil 1: generating five additional a–c questions for the five announcements");
        // Current single-Teil preset produces five R/F tasks; the full B1
        // practice pack needs five paired a–c tasks as well.
        const second=await makeListeningQuestions({
          script,kind:"multiple-choice",level,mode:"course"
        });
        const extra=validateDraftQuestions({script,questions:second.questions,
          kind:"multiple-choice",expectedCount:5}).map(q=>({...q,kind:"multiple-choice"}));
        all=base.flatMap((q,i)=>[{...q,kind:"richtig-falsch"},extra[i]]);
      }
      state=await savePart(index,{
        script,questions:all,topic:preset.topic,repeats:preset.repeats,
        audio:null,approved:false,error:"",createdAt:Date.now()
      });
    }
    if(cancelRef.current)return;
    const parsed=parseStudioTranscript(state.script);
    const plan=buildStudioSpeechPlan(parsed);
    const scenes=plan.filter(item=>item.type==="speech");
    if(!scenes.length||scenes.length>72)throw new Error("Generated script has an invalid voice plan.");
    const remaining=await getStudioStatus();
    const voiceKeys=scenes.map(scene=>sceneVoiceKey(engine,scene));
    const cached=await Promise.all(voiceKeys.map(getSavedVoice));
    const needNew=voiceKeys.filter((k,i)=>!cached[i]);
    if(new Set(needNew).size>remaining.remaining.speech)throw new Error(
      `Teil ${index} needs ${new Set(needNew).size} voice requests but only ${remaining.remaining.speech} remain. Cached scenes are safe; resume later.`
    );
    const wavClips=[];
    for(let i=0;i<scenes.length;i++){
      if(cancelRef.current)return;
      let wav=cached[i];
      if(!wav){
        setWorking(`Teil ${index}: voice scene ${i+1}/${scenes.length}`);
        const reply=await makeSpeechClip({turns:scenes[i].turns,engine});
        wav=base64WavToBytes(reply.audioBase64);
        if(!await saveVoice(voiceKeys[i],wav))
          setStorageWarning("Voice-scene storage is unavailable. Avoid refreshing before this Teil is exported.");
      }
      wavClips.push(wav);
    }
    if(cancelRef.current)return;
    setWorking(`Teil ${index}: assembling MP3 locally`);
    const wav=assembleListeningExam(assemblyScenePlan(plan),wavClips,{
      repeats:preset.repeats,lineGap:0.7,repeatGap:6,
      soundscape:{scene:"none",bell:false,ambience:false,ending:false}
    });
    const audio=await encodeWavAsMp3(wav);
    await savePart(index,{audio,approved:false,error:""});
  }
  async function run(partIndex=null){
    if(working)return;
    try{
      checkReady();cancelRef.current=false;setError("");setNotice("");
      const quota=await getStudioStatus();setQuota(quota.remaining);
      const targets=partIndex?[partIndex]:indexes.filter(i=>!(cacheRef.current[i]?.audio instanceof Blob));
      const required=countScripts(level,targets.filter(i=>!cacheRef.current[i]?.script));
      if(quota.remaining.script<required)throw new Error(
        `This run needs up to ${required} script requests, but ${quota.remaining.script} remain. Generate fewer Teile or resume after the reset.`
      );
      for(const index of targets){
        if(cancelRef.current)break;
        try{await generatePart(index)}
        catch(err){await savePart(index,{error:err.message});throw err}
      }
      setNotice(cancelRef.current?"Paused. Generated parts have been saved; use Resume when ready.":"Generation complete. Listen to each MP3, review answers and approve the parts before exporting.");
    }catch(err){setError(err.message)}
    finally{setWorking("");}
  }
  async function exportBundle(){
    if(working||!complete)return;
    setWorking("Creating ZIP, PDFs and PNG slides on this device");setError("");
    try{
      const bundle=await buildExamZip({
        level,mock,parts:indexes.map(i=>({...records[i],label:profile[i].examLabel,part:i})),includeSlides
      });
      const url=URL.createObjectURL(bundle.blob);
      const a=document.createElement("a");a.href=url;a.download=bundle.filename;
      document.body.appendChild(a);a.click();a.remove();
      window.setTimeout(()=>URL.revokeObjectURL(url),30000);
      setNotice(`Exported ${bundle.questionCount} questions and ${indexes.length} MP3 files in one ZIP. No further AI requests.`);
    }catch(err){setError(err.message)}finally{setWorking("")}
  }
  async function clear(){
    if(!window.confirm("Delete all locally saved parts of this mock? This cannot be undone."))return;
    try{await deleteExamParts(key)}
    catch(err){setError(err.message);return;}
    cacheRef.current={};setRecords({});setNotice("Local mock cleared.");
  }
  return <section className="hoeren-panel hoeren-batch" aria-label="Complete Goethe Hören exam ZIP generator">
    <div className="hoeren-batch-head">
      <div><span className="hoeren-kicker">NEW · COMPLETE EXAM PACK</span>
        <h2>Generate all Hören Teile → one ZIP</h2>
        <p className="hoeren-hint">One workflow, individual resumable recordings, local MP3/PDF/PNG export. No automatic student publication.</p>
      </div>
      <span className="hoeren-batch-pill">{indexes.filter(i=>records[i]?.audio instanceof Blob).length}/{indexes.length||"—"} audio ready</span>
    </div>
    <div className="hoeren-input-grid">
      <label>Level<select value={level} disabled={!!working} onChange={e=>setLevel(e.target.value)}>
        {LEVELS.map(value=><option key={value}>{value}</option>)}</select></label>
      <label>Mock number<select value={mock} disabled={!!working} onChange={e=>setMock(e.target.value)}>
        {Array.from({length:15},(_,i)=>String(i+1).padStart(2,"0")).map(n=><option key={n} value={n}>Mock {n}</option>)}
      </select></label>
      <label>Voice quality<select value={engine} disabled={!!working} onChange={e=>setEngine(e.target.value)}>
        <option value="lite">Flash Lite (budget)</option><option value="flash">Flash (higher quality)</option>
      </select></label>
    </div>
    <label>Theme across the mock<input value={topic} maxLength={210} disabled={!!working}
      onChange={e=>setTopic(e.target.value)}/></label>
    <label className="hoeren-batch-check"><input type="checkbox" checked={includeSlides} disabled={!!working}
      onChange={e=>setIncludeSlides(e.target.checked)}/> Include editable-free 1920×1080 question/answer slide PNGs for CapCut</label>
    <p className="hoeren-hint">Estimated script requests for unfinished parts: <strong>{countScripts(level,missing)}</strong>.
      Speech requests depend on the generated dialogues. Cached scenes are reused, pauses and repeats cost no extra Gemini calls.
      {level==="B1"?" B1 Teil 1 uses an additional request for five paired multiple-choice questions (30 total across B1).":""}
    </p>
    <div className="hoeren-batch-grid">
      {indexes.map(i=>{
        const p=profile[i],r=records[i],hasAudio=r?.audio instanceof Blob;
        return <article key={i} className="hoeren-batch-part">
          <div className="hoeren-batch-part-head"><strong>{p.examLabel} {i}: {p.label}</strong>
            <small>{hasAudio?"MP3 ready":r?.script?"Script saved":"Not generated"}</small></div>
          <p>{r?.questions?.length||p.questionCount} questions · {p.repeats===2?"2 plays":"1 play"}</p>
          {r?.error?<p role="alert" className="hoeren-validation">{r.error}</p>:null}
          {hasAudio?<PartAudio blob={r.audio} label={`Teil ${i} generated audio`}/>:null}
          {r?.questions?.length?<details><summary>Review questions and answer key ({r.questions.length})</summary>
            <ol>{r.questions.map((q,j)=><li key={j}>{q.question}
              <small> Answer: {noteFor(q)} {q.evidence?"· evidence: "+q.evidence:""}</small>
            </li>)}</ol>
          </details>:null}
          <label className="hoeren-batch-check"><input type="checkbox" checked={!!r?.approved}
            disabled={!hasAudio||!!working} onChange={e=>savePart(i,{approved:e.target.checked})}/>
            I listened and approved the questions, answers and MP3</label>
          {!hasAudio?<button type="button" className="hoeren-quiet" disabled={!!working||!ready||loading}
            onClick={()=>run(i)}>Generate / resume Teil {i}</button>:null}
        </article>
      })}
    </div>
    {storageWarning?<p role="alert" className="hoeren-validation">{storageWarning}</p>:null}
    {error?<p role="alert" className="hoeren-validation">{error}</p>:null}
    {notice?<p role="status" className="hoeren-hint">{notice}</p>:null}
    {working?<p role="status" className="hoeren-batch-progress">{working}</p>:null}
    <div className="hoeren-batch-actions">
      <button type="button" className="hoeren-button" disabled={!!working||!ready||loading||!indexes.length}
        onClick={()=>run()}>{working?"Generating…":"Generate / resume complete exam"}</button>
      {working?<button type="button" className="hoeren-quiet" onClick={()=>{cancelRef.current=true}}>
        Stop after current request</button>:null}
      <button type="button" className="hoeren-button" disabled={!complete||!!working} onClick={exportBundle}>
        Download complete ZIP</button>
      <button type="button" className="hoeren-quiet" disabled={!!working||loading} onClick={clear}>Clear local mock</button>
    </div>
    <p className="hoeren-hint">Saved on this browser via IndexedDB. Review every part before exporting.
      The ZIP includes scripts, MP3s, Fragen.pdf, Lösungen.pdf, teacher-only answer keys, R2 upload paths and optional CapCut slides.
      These are independently generated practice tasks, not official Goethe-Institut recordings.
      Google quota and pay-as-you-go costs remain separate from Falowen's daily safety limits.</p>
  </section>;
}

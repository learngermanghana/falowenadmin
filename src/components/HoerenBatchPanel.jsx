import {useEffect,useRef,useState} from "react";
import {getStudioStatus,makeListeningScript,makeListeningQuestions,makeSpeechClip} from "../services/hoerenStudioService";
import {parseStudioTranscript,repairUnlabelledStudioLines,base64WavToBytes,assembleListeningExam} from "../utils/hoerenAudio";
import {assignGoetheSpeakers,suggestRecordingScene} from "../utils/hoerenProductionDefaults";
import {buildStudioSpeechPlan,assemblyScenePlan,sceneVoiceKey} from "../utils/hoerenSpeechPlan";
import {prepareSavedBatchTranscript,shouldGenerateBatchAudio} from "../utils/hoerenBatchWorkflow";
import {getSavedVoice,saveVoice} from "../utils/hoerenVoiceCache";
import {validateDraftQuestions} from "../utils/hoerenQuestions";
import {encodeWavAsMp3} from "../utils/hoerenMp3";
import {buildExamZip} from "../utils/hoerenExamBundle";
import {bundleKey,loadExamParts,saveExamParts,deleteExamParts} from "../utils/hoerenExamBundleCache";
const LEVELS=["A1","A2","B1","B2","C1","C2"];
const keysOf=p=>Object.keys(p||{}).sort((a,b)=>Number(a)-Number(b));
function scriptRequestsNeeded(level,index,part={}) {
  if (!part.script) return level==="B1"&&index==="1" ? 2 : 1;
  if (level==="B1"&&index==="1") return part.questions?.length===10 ? 0 : part.questions?.length===5 ? 1 : 2;
  return part.questions?.length ? 0 : 1;
}
function downloadBlob(blob,filename) {
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;a.download=filename;
  document.body.appendChild(a);a.click();a.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url),30000);
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
  const [lineGap,setLineGap]=useState(0.7);
  const [repeatGap,setRepeatGap]=useState(6);
  const [useAtmosphere,setUseAtmosphere]=useState(true);
  const [soundVolume,setSoundVolume]=useState(12);
  const [scriptEdits,setScriptEdits]=useState({});
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
  const estimatedScripts=indexes.reduce((n,i)=>n+scriptRequestsNeeded(level,i,records[i]),0);
  useEffect(()=>{
    let active=true;
    setLoading(true);setError("");setNotice("");setRecords({});setScriptEdits({});cacheRef.current={};
    loadExamParts(key).then(x=>{if(active){cacheRef.current=x;setRecords(x)}})
      .catch(()=>{if(active)setStorageWarning("Persistent storage is unavailable. Keep this tab open and download the ZIP before closing.")})
      .finally(()=>{if(active)setLoading(false)});
    return()=>{active=false};
  },[key]);
  async function savePart(index,change){
    const next={...cacheRef.current,[index]:{...cacheRef.current[index],...change}};
    cacheRef.current=next;setRecords(next);
    try {
      await saveExamParts(key,next);
      setStorageWarning("");
    } catch (error) {
      const quota = error?.name === "QuotaExceededError";
      setStorageWarning(quota
        ? "Browser storage is full. Completed MP3s may not survive a refresh. Download each finished Teil now, clear space outside this tab, and retry saving. Do not clear Falowen site data."
        : "Browser storage did not save this exam (" + (error?.name || "storage unavailable") + "). Keep this tab open and download completed MP3s before leaving. Check private browsing and site storage permissions.");
    }
    return next[index];
  }
  function checkReady(){
    if(!ready||!indexes.length)throw new Error("Choose a supported level and check the AI Studio key.");
    if(loading)throw new Error("Saved work is still loading.");
  }
  async function generatePart(index,{regenerateAudio=false}={}){
    const preset=profile[index];
    const existing=cacheRef.current[index]||{};
    if(!shouldGenerateBatchAudio(existing,regenerateAudio))return;
    let state=existing;
    if(!state.script){
      setWorking(`Teil ${index}: script and questions`);
      const quota=await getStudioStatus();
      const needed=1;
      if(quota.remaining.script<needed)throw new Error(`Teil ${index} needs ${needed} script requests; only ${quota.remaining.script} remain. Resume after quota reset.`);
      const reply=await makeListeningScript({
        topic:`${topic}. Independent Teil ${index}; no repeated scenarios between parts.`,
        type:preset.type,level,part:index,mode:"goethe",kind:preset.kind
      });
      const script=assignGoetheSpeakers(repairUnlabelledStudioLines(reply.script));
      const base=validateDraftQuestions({script,questions:reply.questions,kind:preset.kind,expectedCount:preset.questionCount});
      state=await savePart(index,{
        script,questions:base.map(q=>({...q,kind:preset.kind})),
        topic:topic.trim(),repeats:preset.repeats,
        audio:null,approved:false,error:"",createdAt:Date.now()
      });
    }
    if(!state.questions?.length){
      const remaining=await getStudioStatus();
      if(remaining.remaining.script<1)throw new Error(`Teil ${index} needs one question request; resume after quota reset.`);
      setWorking(`Teil ${index}: questions for saved transcript`);
      const reply=await makeListeningQuestions({
        script:state.script,kind:preset.kind,level,part:index,mode:"goethe"
      });
      const reviewed=validateDraftQuestions({script:state.script,questions:reply.questions,
        kind:preset.kind,expectedCount:preset.questionCount});
      state=await savePart(index,{questions:reviewed.map(q=>({...q,kind:preset.kind})),approved:false,error:""});
    }
    if(level==="B1"&&index==="1"&&state.questions?.length===5){
      const remaining=await getStudioStatus();
      if(remaining.remaining.script<1)throw new Error("One script request is needed for the five additional B1 Teil 1 a–c questions. Your first five questions are saved; resume later.");
      setWorking("Teil 1: adding five multiple-choice questions to the saved script");
      const second=await makeListeningQuestions({
        script:state.script,kind:"multiple-choice",level,mode:"course"
      });
      const extra=validateDraftQuestions({script:state.script,questions:second.questions,
        kind:"multiple-choice",expectedCount:5}).map(q=>({...q,kind:"multiple-choice"}));
      const all=state.questions.flatMap((q,i)=>[q,extra[i]]);
      state=await savePart(index,{questions:all,approved:false,error:""});
    }
    if(level==="B1"&&index==="1"&&state.questions?.length!==10)
      throw new Error("B1 Teil 1 must have ten paired questions before producing audio.");
    if(state.questions?.length!==(level==="B1"&&index==="1"?10:preset.questionCount))
      throw new Error(`Teil ${index} has an incomplete question set. Review before producing audio.`);
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
    const generatedThisRun=new Map();
    for(let i=0;i<scenes.length;i++){
      if(cancelRef.current)return;
      let wav=cached[i]||generatedThisRun.get(voiceKeys[i]);
      if(!wav){
        setWorking(`Teil ${index}: voice scene ${i+1}/${scenes.length}`);
        const reply=await makeSpeechClip({turns:scenes[i].turns,engine});
        wav=base64WavToBytes(reply.audioBase64);
        generatedThisRun.set(voiceKeys[i],wav);
        if(!await saveVoice(voiceKeys[i],wav))
          setStorageWarning("Voice-scene storage is unavailable. Avoid refreshing before this Teil is exported.");
      }
      wavClips.push(wav);
    }
    if(cancelRef.current)return;
    setWorking(`Teil ${index}: assembling MP3 locally`);
    const audio=await assemblePart(index,plan,wavClips);
    await savePart(index,{audio,approved:false,error:""});
  }
  async function assemblePart(index,plan,clips){
    const part=cacheRef.current[index];
    const preset=profile[index];
    const scene=useAtmosphere?suggestRecordingScene({
      script:part.script,topic:part.topic||topic,type:preset.type,mode:"goethe"
    }):"none";
    const wav=assembleListeningExam(assemblyScenePlan(plan),clips,{
      repeats:preset.repeats,lineGap,repeatGap,
      soundscape:{scene,ambience:useAtmosphere,bell:false,ending:false,volume:soundVolume/100}
    });
    return encodeWavAsMp3(wav);
  }
  async function remixPart(index){
    if(working)return;
    setWorking(`Teil ${index}: remixing saved voices`);setError("");
    try{
      const plan=buildStudioSpeechPlan(parseStudioTranscript(cacheRef.current[index].script));
      const scenes=plan.filter(item=>item.type==="speech");
      const clips=await Promise.all(scenes.map(scene=>getSavedVoice(sceneVoiceKey(engine,scene))));
      if(clips.some(x=>!x))throw new Error(`Teil ${index}: saved voice clips for this quality are missing or expired. Use Regenerate Teil ${index} audio below. Your current MP3 remains available until replacement succeeds.`);
      const audio=await assemblePart(index,plan,clips);
      await savePart(index,{audio,approved:false,error:""});
      setNotice(`Teil ${index} remixed with the current playback settings, no Gemini requests.`);
    }catch(err){setError(err.message)}
    finally{setWorking("")}
  }
  async function saveTranscript(index){
    const current=cacheRef.current[index];
    if(!current?.script)return;
    try{
      const {next,changed,wordsUnchanged}=prepareSavedBatchTranscript(current.script,scriptEdits[index]);
      if(!changed)return;
      await savePart(index,{
        script:next,audio:null,approved:false,error:"",
        ...(wordsUnchanged?{}:{questions:[]})
      });
      setScriptEdits(old=>({...old,[index]:next}));
      setNotice(wordsUnchanged
        ?`Teil ${index}: speaker changes saved. Regenerate audio using cached voice scenes where possible.`
        :`Teil ${index}: transcript changed. The old answers were cleared; resume to regenerate questions and audio.`);
    }catch(err){setError(`Teil ${index}: ${err.message}`)}
  }
  async function run(partIndex=null,{regenerateAudio=false}={}){
    if(working)return;
    try{
      checkReady();cancelRef.current=false;setError("");setNotice("");setWorking("Checking available Gemini requests");
      const quota=await getStudioStatus();setQuota(quota.remaining);
      const targets=partIndex?[partIndex]:indexes.filter(i=>!(cacheRef.current[i]?.audio instanceof Blob));
      const failures=[];
      for(const index of targets){
        if(cancelRef.current)break;
        try{await generatePart(index,{regenerateAudio:regenerateAudio&&index===partIndex})}
        catch(err){
          await savePart(index,{error:err.message});
          failures.push(`Teil ${index}: ${err.message}`);
          // A transient provider failure should not block other independent Teile.
          // Daily quota exhaustion is not transient; stop to avoid futile requests.
          if(partIndex || /daily .*limit|only 0 remain|rate limit 429|quota reset/i.test(err.message))break;
        }
      }
      if(failures.length)setError(failures.join(" | "));
      setNotice(cancelRef.current?"Paused. Completed MP3s can already be downloaded."
        :failures.length?"Some Teile failed. Existing MP3s remain downloadable; retry only failed Teile."
        :regenerateAudio
        ?`Teil ${partIndex} audio regenerated. Script and questions are preserved; listen and re-approve for ZIP export.`
        :"Generation complete. Download each MP3 now or review and approve for the ZIP.");
    }catch(err){setError(err.message)}
    finally{setWorking("");}
  }
  function downloadDraftBackup() {
    const parts = Object.fromEntries(Object.entries(cacheRef.current).map(([part, record]) => [
      part, {
        script: record.script || "",
        questions: record.questions || [],
        topic: record.topic || "",
        repeats: record.repeats,
        approved: false,
        error: record.error || ""
      }
    ]));
    downloadBlob(new Blob([JSON.stringify({ level, mock, createdAt: new Date().toISOString(), parts }, null, 2)], { type: "application/json" }),
      `Falowen-${level}-Mock-${mock}-Hoeren-draft-backup.json`);
    setNotice("Transcript and question backup downloaded. MP3s must be downloaded separately.");
  }
  async function exportBundle(){
    if(working||!complete)return;
    setWorking("Creating ZIP, PDFs and PNG slides on this device");setError("");
    try{
      const bundle=await buildExamZip({
        level,mock,parts:indexes.map(i=>({...records[i],label:profile[i].examLabel,part:i})),includeSlides
      });
      downloadBlob(bundle.blob,bundle.filename);
      setNotice(`Exported ${bundle.questionCount} questions and ${indexes.length} MP3 files in one ZIP. No further AI requests.`);
    }catch(err){setError(err.message)}finally{setWorking("")}
  }
  async function clear(){
    if(!window.confirm("Delete all locally saved parts of this mock? This cannot be undone."))return;
    try{await deleteExamParts(key)}
    catch(err){setError(err.message);return;}
    cacheRef.current={};setRecords({});setScriptEdits({});setNotice("Local mock cleared.");
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
    <p className="hoeren-hint">Estimated script requests for unfinished parts: <strong>{estimatedScripts}</strong>.
      Speech requests depend on the generated dialogues. Cached scenes are reused, pauses and repeats cost no extra Gemini calls.
      {level==="B1"?" B1 Teil 1 uses an additional request for five paired multiple-choice questions (30 total across B1).":""}
    </p>
    <div className="hoeren-input-grid">
      <label>Gap between speaking scenes (seconds)
        <input type="number" min="0" max="5" step="0.1" value={lineGap} disabled={!!working}
          onChange={e=>setLineGap(Math.max(0,Math.min(5,Number(e.target.value)||0)))}/>
      </label>
      <label>Gap before second playback (seconds)
        <input type="number" min="0" max="20" step="1" value={repeatGap} disabled={!!working}
          onChange={e=>setRepeatGap(Math.max(0,Math.min(20,Number(e.target.value)||0)))}/>
      </label>
      <label>Automatic scene background
        <select value={useAtmosphere?"auto":"none"} disabled={!!working}
          onChange={e=>setUseAtmosphere(e.target.value==="auto")}>
          <option value="auto">Auto detect (same as individual Studio)</option>
          <option value="none">Clean exam audio (no background)</option>
        </select>
      </label>
      <label>Background effects volume
        <input type="range" min="0" max="35" step="1" value={soundVolume} disabled={!!working||!useAtmosphere}
          onChange={e=>setSoundVolume(Number(e.target.value))}/>
        <small>{soundVolume}%</small>
      </label>
    </div>
    <p className="hoeren-hint">Narrator A is reserved for instructions; task speakers rotate B/C/D between independent scenes. Speaker voices and automatic soundscape match the individual Studio. Teacher-selected speakers are preserved. Remix with existing clips for free; if clips are missing or quality changes, use Regenerate Teil (may use Gemini quota).</p>
    {quota?<p className="hoeren-hint">Last quota check: {quota.script} script requests, {quota.speech} voice requests remaining.</p>:null}
    <div className="hoeren-batch-grid">
      {indexes.map(i=>{
        const p=profile[i],r=records[i],hasAudio=r?.audio instanceof Blob;
        return <article key={i} className="hoeren-batch-part">
          <div className="hoeren-batch-part-head"><strong>{p.examLabel} {i}: {p.label}</strong>
            <small>{hasAudio?"MP3 ready":r?.script?"Script saved":"Not generated"}</small></div>
          <p>{r?.questions?.length||p.questionCount} questions · {p.repeats===2?"2 plays":"1 play"}</p>
          {r?.error?<p role="alert" className="hoeren-validation">{r.error}</p>:null}
          {hasAudio?<PartAudio blob={r.audio} label={`Teil ${i} generated audio`}/>:null}
          {hasAudio?<div className="hoeren-batch-part-actions">
            <button type="button" className="hoeren-button" onClick={()=>downloadBlob(r.audio,`Falowen-${level}-Mock-${mock}-Teil-${i}.mp3`)}>
              Download Teil {i} MP3
            </button>
            <button type="button" className="hoeren-quiet" disabled={!!working} onClick={()=>remixPart(i)}>
              Remix Teil {i} · no AI calls
            </button>
            <button type="button" className="hoeren-quiet"
              disabled={!!working||!ready||loading||(scriptEdits[i]??r.script)!==r.script}
              onClick={()=>run(i,{regenerateAudio:true})}>
              Regenerate Teil {i} audio · may use Gemini
            </button>
            <small>Only this Teil is regenerated; existing MP3 stays until replacement succeeds. Keep the transcript and questions. Save edits first and re-approve the new audio.</small>
          </div>:null}
          {r?.script?<details>
            <summary>Review / edit transcript and voices (Teil {i})</summary>
            <p className="hoeren-hint">One line per speaker: A for examiner instructions, B/C/D for task voices, and [PAUSE 3] on its own line. Saving changes to spoken words clears outdated answer keys.</p>
            <textarea rows={9} lang="de" aria-label={`Teil ${i} transcript`}
              value={scriptEdits[i]??r.script} disabled={!!working}
              onChange={e=>setScriptEdits(old=>({...old,[i]:e.target.value}))}/>
            <button type="button" className="hoeren-quiet" disabled={!!working}
              onClick={()=>saveTranscript(i)}>Save transcript &amp; speaker changes · free</button>
          </details>:null}
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
    <button type="button" className="hoeren-quiet" onClick={downloadDraftBackup}>Download transcript &amp; question backup (JSON) · no AI calls</button>
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
      Each completed MP3 can be downloaded during generation, without teacher approval. Approval is only needed for the combined ZIP. These are independently generated practice tasks, not official Goethe-Institut recordings.
      Google quota and pay-as-you-go costs remain separate from Falowen's daily safety limits.</p>
  </section>;
}

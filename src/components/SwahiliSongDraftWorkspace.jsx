import { useEffect, useState } from "react";
import MusicLyricsVideoStudio from "./MusicLyricsVideoStudio.jsx";
import { SWAHILI_SONG_DRAFTS, getSwahiliSongDraft } from "../data/swahiliSongDrafts.js";
import { loadSavedSwahiliLyrics, overwriteSavedSwahiliLyrics } from "../services/musicStudioService.js";

// Curriculum text is editorial material, not a verified recording or R2 sidecar.
const LOCAL_KEY = "falowen-swahili-song-draft-edits:v1";
function readEdits() {
  try { const value=JSON.parse(localStorage.getItem(LOCAL_KEY)||"{}"); return value && typeof value==="object" && !Array.isArray(value) ? value : {}; }
  catch { return {}; }
}
const dayLabel = day => "Day " + String(day).padStart(2,"0");
export default function SwahiliSongDraftWorkspace({ active = true }) {
  const [level,setLevel]=useState("A1");
  const [day,setDay]=useState(2);
  const [edits,setEdits]=useState(readEdits);
  const [notice,setNotice]=useState("");
  const [cloudSaved,setCloudSaved]=useState({});
  const [cloudStatus,setCloudStatus]=useState({});
  const [saving,setSaving]=useState(false);
  const songs=SWAHILI_SONG_DRAFTS.filter(song=>song.level===level);
  const selected=getSwahiliSongDraft(level,day) || songs[0];
  const id=selected?.id||"";
  const lyrics=Object.prototype.hasOwnProperty.call(edits,id) ? edits[id] : Object.prototype.hasOwnProperty.call(cloudSaved,id) && cloudSaved[id] ? cloudSaved[id] : selected?.lyrics||"";
  const isDirty=lyrics !== (cloudSaved[id] || selected?.lyrics || "");
  const loadStatus=cloudStatus[id] || "loading";
  const saveEdit=value=>{
    setEdits(previous=>{
      const next={...previous,[id]:value};
      try {localStorage.setItem(LOCAL_KEY,JSON.stringify(next));setNotice("Draft saved on this device only.");}
      catch {setNotice("Could not save on this device. Copy or download your draft.");}
      return next;
    });
  };
  const download=()=>{
    const blob=new Blob([`Kiswahili ${level} · ${dayLabel(selected.day)}\n${selected.topic}\n${selected.musicStyle}\n\n${lyrics}\n`],{type:"text/plain;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const link=document.createElement("a");link.href=url;link.download=`swahili-${level.toLowerCase()}-day-${String(selected.day).padStart(2,"0")}-draft.txt`;
    document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);
  };
  useEffect(()=>{
    setNotice("");
    if (!selected) return;
    let cancelled=false;
    setCloudStatus(previous=>({...previous,[id]:"loading"}));
    loadSavedSwahiliLyrics(selected.level, selected.day).then(data=>{
      if(cancelled)return;
      setCloudSaved(previous=>({...previous,[id]:data.found?data.lyrics:""}));
      setCloudStatus(previous=>({...previous,[id]:"ready"}));
    }).catch(error=>{
      if(cancelled)return;
      setCloudStatus(previous=>({...previous,[id]:"error"}));
      setNotice("Could not load saved lyrics: "+error.message+". Local edits remain available.");
    });
    return ()=>{cancelled=true;};
  },[id]);
  const overwriteCloud=async()=>{
    if (!selected || saving || loadStatus!=="ready" || !isDirty)return;
    setNotice("");
    if(!lyrics.trim() || lyrics.length>5500 || lyrics.split("\n").length>220){
      setNotice("Enter between 1 and 5,500 characters, with at most 220 lines.");return;
    }
    setSaving(true);
    const savedId=id, savedText=lyrics;
    try{
      const result=await overwriteSavedSwahiliLyrics(selected.level, selected.day, savedText);
      setCloudSaved(previous=>({...previous,[savedId]:result.lyrics}));
      setNotice("Kiswahili lyrics saved permanently to Falowen. You can reopen them on another device.");
    }catch(error){setNotice("Cloud save failed: "+error.message+". Your local edits were kept.");}
    finally{setSaving(false);}
  };
  const reloadCloud=()=>{
    if(loadStatus!=="ready" || saving)return;
    const saved=cloudSaved[id] || selected.lyrics;
    saveEdit(saved);
    setNotice("Latest loaded cloud lyrics restored in the editor. No recording was modified.");
  };
  if(!selected)return <p>No Swahili lyrics found for this level.</p>;
  return <div className="swahili-song-workspace" style={{padding:"16px 0"}}>
    <section className="music-card" aria-label="Swahili course lyric drafts" style={{marginBottom:20,padding:20}}>
      <h2>Swahili A1–B1 lyrics library</h2>
      <p>Original teaching drafts by lesson. A1 Days 1, 5 and 6 retain their existing songs and are not replaced here. A2/B1 lessons are currently titles-only; Dr. Ruth should review the language before any audio is published.</p>
      <div style={{display:"flex",gap:12,flexWrap:"wrap",margin:"14px 0"}}>
        <label>Level <select aria-label="Swahili song level" value={level} onChange={event=>{const next=event.target.value;setLevel(next);setDay(next==="A1"?2:1);}}>
          <option>A1</option><option>A2</option><option>B1</option>
        </select></label>
        <label>Lesson <select aria-label="Swahili song lesson" value={selected.day} onChange={event=>setDay(Number(event.target.value))}>
          {songs.map(song=><option key={song.id} value={song.day}>{dayLabel(song.day)} · {song.topic}</option>)}
        </select></label>
      </div>
      <h3>{selected.title}</h3>
      <p><strong>Suggested musical direction:</strong> {selected.musicStyle}</p>
      <label htmlFor="swahili-course-lyrics">Editable Kiswahili lyrics</label>
      <textarea id="swahili-course-lyrics" lang="sw" value={lyrics} onChange={event=>saveEdit(event.target.value)} rows={18} maxLength={5500} style={{width:"100%",boxSizing:"border-box"}}/>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:10}}>
        <button type="button" onClick={async()=>{try{if(!navigator.clipboard?.writeText)throw Error("Clipboard unavailable");await navigator.clipboard.writeText(lyrics);setNotice("Lyrics copied.");}catch{setNotice("Copy was blocked; select and copy the lyrics manually.");}}}>Copy lyrics</button>
        <button type="button" onClick={download}>Download lyrics</button>
        <button type="button" onClick={overwriteCloud} disabled={saving || loadStatus!=="ready" || !isDirty || !lyrics.trim() || lyrics.length>5500}>{saving?"Saving…":"Overwrite Lyrics · Save permanently"}</button>
        <button type="button" onClick={reloadCloud} disabled={saving || loadStatus!=="ready"}>Reload saved lyrics</button>
        <button type="button" onClick={()=>saveEdit(selected.lyrics)}>Restore original draft</button>
      </div>
      <p><small>{loadStatus==="loading"?"Checking permanently saved lyrics…":loadStatus==="error"?"Cloud unavailable; changes remain local until reconnected.":isDirty?"Unsaved changes · click Save permanently":"Cloud lyrics checked · no unsaved changes"}</small></p>
      {notice&&<p role="status">{notice}</p>}
      <p><small>Edits are kept locally until you click Save permanently. Cloud drafts are private and separate from verified published song lyrics. Saving text does not modify any MP3, lyric timestamps or public track. The video studio below requires an actual MP3 and reviewed lyric timing.</small></p>
    </section>
    <MusicLyricsVideoStudio key={id} active={active} swahili title={selected.title} level={level} day={selected.day} lyrics={lyrics} />
  </div>;
}

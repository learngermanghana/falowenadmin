import { useEffect, useState } from "react";
import MusicLyricsVideoStudio from "./MusicLyricsVideoStudio.jsx";
import { SWAHILI_SONG_DRAFTS, getSwahiliSongDraft } from "../data/swahiliSongDrafts.js";

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
  const songs=SWAHILI_SONG_DRAFTS.filter(song=>song.level===level);
  const selected=getSwahiliSongDraft(level,day) || songs[0];
  const id=selected?.id||"";
  const lyrics=Object.prototype.hasOwnProperty.call(edits,id) ? edits[id] : selected?.lyrics||"";
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
  useEffect(()=>{setNotice("");},[id]);
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
      <label htmlFor="swahili-course-lyrics">Editable Kiswahili lyrics (local draft)</label>
      <textarea id="swahili-course-lyrics" lang="sw" value={lyrics} onChange={event=>saveEdit(event.target.value)} rows={18} maxLength={9000} style={{width:"100%",boxSizing:"border-box"}}/>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:10}}>
        <button type="button" onClick={()=>navigator.clipboard?.writeText(lyrics).then(()=>setNotice("Lyrics copied."),()=>setNotice("Copy was blocked; select and copy the lyrics manually."))}>Copy lyrics</button>
        <button type="button" onClick={download}>Download lyrics</button>
        <button type="button" onClick={()=>saveEdit(selected.lyrics)}>Restore original draft</button>
      </div>
      {notice&&<p role="status">{notice}</p>}
      <p><small>Draft changes are stored only in this browser. No music is generated or published automatically. The video studio below requires an actual MP3 and reviewed lyric timing.</small></p>
    </section>
    <MusicLyricsVideoStudio key={id} active={active} swahili title={selected.title} level={level} day={selected.day} lyrics={lyrics} />
  </div>;
}

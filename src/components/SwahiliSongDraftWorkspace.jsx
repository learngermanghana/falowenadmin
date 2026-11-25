import { useEffect, useState } from "react";
import { SWAHILI_MUSIC_TRACKS } from "../data/swahiliMusicTracks.js";
import MusicLyricsVideoStudio from "./MusicLyricsVideoStudio.jsx";
import { SWAHILI_SONG_DRAFTS, getSwahiliSongDraft } from "../data/swahiliSongDrafts.js";

// Curriculum text is editorial material, not a verified recording or R2 sidecar.
const LOCAL_KEY = "falowen-swahili-song-draft-edits:v1";
function readEdits() {
  try {
    const value = JSON.parse(localStorage.getItem(LOCAL_KEY) || "{}");
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    for (const track of SWAHILI_MUSIC_TRACKS) {
      if (typeof value[track.id] === "string" && !value[track.id].trim()) delete value[track.id];
    }
    return value;
  }
  catch { return {}; }
}
const dayLabel = day => "Day " + String(day).padStart(2,"0");
export default function SwahiliSongDraftWorkspace({ active = true }) {
  const [level,setLevel]=useState("A1");
  const [day,setDay]=useState(2);
  const [edits,setEdits]=useState(readEdits);
  const [notice,setNotice]=useState("");
  const [workspace,setWorkspace]=useState("library");
  const [published,setPublished]=useState(null);
  const songs=SWAHILI_SONG_DRAFTS.filter(song=>song.level===level);
  const selected=getSwahiliSongDraft(level,day) || songs[0];
  const id=selected?.id||"";
  const recording = SWAHILI_MUSIC_TRACKS.find(track => track.id === id);
  const objectKey = recording?.objectKey;
  const publishedLyrics = published?.objectKey === objectKey ? published?.lyrics : "";
  const originalLyrics = publishedLyrics || selected?.lyrics || "";
  const localLyrics = typeof edits[id] === "string" ? edits[id] : undefined;
  const lyrics = localLyrics ?? originalLyrics;

  useEffect(() => {
    if (!active || workspace !== "library" || !objectKey) return;
    const controller = new AbortController();
    fetch("https://www.falowen.app/api/music-lyrics?key=" + encodeURIComponent(objectKey), {
      cache: "no-cache",
      signal: controller.signal,
    }).then(response => {
      if (!response.ok) throw Error("Published lyrics unavailable");
      return response.json();
    }).then(data => {
      if (data?.objectKey !== objectKey || typeof data.lyrics !== "string" || !data.lyrics.trim()) {
        throw Error("Published lyrics unavailable");
      }
      if (!controller.signal.aborted) setPublished(data);
    }).catch(() => {
      if (!controller.signal.aborted) setPublished({ objectKey, unavailable: true });
    });
    return () => controller.abort();
  }, [active, workspace, objectKey]);
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
    <nav aria-label="Swahili Music workspaces" className="music-studio-tabs" style={{display:"flex",flexWrap:"wrap",gap:10,marginBottom:20}}>
      <button type="button" className={workspace==="library"?"is-active":""} aria-current={workspace==="library"?"page":undefined} onClick={()=>setWorkspace("library")}>1. Song lyrics &amp; drafts</button>
      <button type="button" className={workspace==="video"?"is-active":""} aria-current={workspace==="video"?"page":undefined} onClick={()=>setWorkspace("video")}>2. Load music &amp; create lyrics video</button>
    </nav>
    <div hidden={workspace!=="library"}>
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
        <button type="button" onClick={async()=>{try{if(!navigator.clipboard?.writeText)throw Error("Clipboard unavailable");await navigator.clipboard.writeText(lyrics);setNotice("Lyrics copied.");}catch{setNotice("Copy was blocked; select and copy the lyrics manually.");}}}>Copy lyrics</button>
        <button type="button" onClick={download}>Download lyrics</button>
        <button type="button" onClick={()=>saveEdit(originalLyrics)}>Restore original lyrics</button>
      </div>
      {objectKey && !originalLyrics && <p role="status">{published?.objectKey === objectKey && published.unavailable
        ? "Published lyrics are unavailable. Open the video studio to retry."
        : "Loading published lyrics…"}</p>}
      {notice&&<p role="status">{notice}</p>}
      <p><small>Draft changes are stored only in this browser. No music is generated or published automatically. Open “Load music & create lyrics video” to select a published recording or use an approved MP3, review timing and export.</small></p>
      <button type="button" onClick={()=>setWorkspace("video")}>Continue to music &amp; video studio</button>
    </section>
    </div>
    <div hidden={workspace!=="video"}>
      <MusicLyricsVideoStudio key={id} active={active && workspace==="video"} swahili title={selected.title} level={level} day={selected.day} lyrics={lyrics} />
    </div>
  </div>;
}

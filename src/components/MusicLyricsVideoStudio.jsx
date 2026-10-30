import fixWebmDuration from "fix-webm-duration";
import SongTimingEditor from "./SongTimingEditor.jsx";
import { A1_DAY5_FINAL_RECORDING } from "../data/a1Day5FinalRecording.js";
import { A1_DAY6_FINAL_RECORDING } from "../data/a1Day6FinalRecording.js";
import { A1_DAY7_FINAL_RECORDING } from "../data/a1Day7FinalRecording.js";
import { A1_DAY8_FINAL_RECORDING } from "../data/a1Day8FinalRecording.js";
import { A1_DAY10_FINAL_RECORDING } from "../data/a1Day10FinalRecording.js";
import { A2_DAY21_FINAL_RECORDING } from "../data/a2Day21FinalRecording.js";
import { A2_DAY22_FINAL_RECORDING } from "../data/a2Day22FinalRecording.js";
import { getReusableSongDraft } from "../data/reusableMusicSongbook.js";
import { readSongCues, validateLyricCues } from "../utils/songLyrics.js";
import { useEffect, useMemo, useRef, useState } from "react";
import { videoLyricLines, lyricScenes, findLyricScene, videoRecorderFormat, drawMusicVideoFrame, isRealMp4Blob, timedLyricsPack, verifiedPublishedVideoTiming, musicVideoSocialCopy } from "../utils/musicLyricsVideo.js";

const frameStyle = {width:"min(100%,270px)",aspectRatio:"9/16",borderRadius:14,background:"#102f34",boxShadow:"0 6px 20px #102f3426"};
const fieldStyle = {width:"100%",maxWidth:520,padding:"8px",borderRadius:8,border:"1px solid #cbd5e1",boxSizing:"border-box"};
function saveBlob(blob, name) {
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download=name;
  document.body.appendChild(a);a.click();a.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url),5000);
}
// Check actual local decoding before telling the owner a recorded file is playable.
async function canReadVideoBlob(blob) {
  if (!blob || blob.size < 1000) return false;
  const url=URL.createObjectURL(blob);
  const video=document.createElement("video");
  return new Promise(resolve=>{
    let finished=false;
    const timer=window.setTimeout(()=>finish(false),12000);
    function finish(ok) {
      if(finished)return;
      finished=true;
      window.clearTimeout(timer);
      video.onloadeddata=null;
      video.onerror=null;
      video.removeAttribute("src");
      video.load();
      URL.revokeObjectURL(url);
      resolve(ok);
    }
    video.muted=true;
    video.preload="auto";
    video.onloadeddata=()=>finish(video.videoWidth>0&&video.videoHeight>0);
    video.onerror=()=>finish(false);
    video.src=url;
    video.load();
  });
}
function nameSlug(value) {
  return String(value||"song").normalize("NFKD").replace(/[\u0300-\u036f]/g,"")
    .toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,70)||"song";
}
function audioFilenameObjectKey(text) {
  const key=String(text||"").trim();
  return /^music\/(a1|a2|b1|b2|c1|c2)\/day-(0[1-9]|1[0-9]|2[0-8])\/[^/]{1,150}\.mp3$/i.test(key) ? key : "";
}
export default function MusicLyricsVideoStudio({ generated = null, lyrics = "", title = "Falowen Music", level = "", day = "", onOverwriteLyrics = null, savingLyrics = false, loadingLyrics = false, lyricsSaveNotice = "", assignmentKey = "", active = true }) {
  const [file,setFile] = useState(null);
  const [tracks,setTracks] = useState([]);
  const [publishedTrack,setPublishedTrack] = useState(null);
  const [loadingTracks,setLoadingTracks] = useState(false);
  const [catalogRequested,setCatalogRequested] = useState(false);
  const [timingStatus,setTimingStatus] = useState("");
  const [fileUrl,setFileUrl] = useState("");
  const [lyricText,setLyricText] = useState(lyrics || "");
  const [duration,setDuration] = useState(0);
  const [starts,setStarts] = useState([]);
  const [cues,setCues] = useState([]);
  const [error,setError] = useState("");
  const [message,setMessage] = useState("");
  const [exporting,setExporting] = useState(false);
  const [progress,setProgress] = useState(0);
  const [objectKey,setObjectKey] = useState("");
  const [postingTitle,setPostingTitle] = useState("");
  const [postingDescription,setPostingDescription] = useState("");
  const [copyNotice,setCopyNotice] = useState("");
  const [timingReview,setTimingReview] = useState(false);
  const [recordingFingerprint,setRecordingFingerprint] = useState("");
  const [allowWebm,setAllowWebm] = useState(false);
  const [exportedVideo,setExportedVideo] = useState(null);
  const exportedUrlRef=useRef(null);
  const canvasRef=useRef(null), audioRef=useRef(null), cancelRef=useRef(null);
  const previousEditorLyrics=useRef(lyrics), currentLyricText=useRef(lyrics || "");
  const activeUrl=fileUrl || publishedTrack?.audioUrl || generated?.url || "";
  const videoTitle=publishedTrack?.title || title;
  const videoLevel=publishedTrack?.level || level;
  const videoDay=publishedTrack?.day ?? day;
  const postingDefaults=useMemo(()=>musicVideoSocialCopy({title:videoTitle,level:videoLevel,day:videoDay}),
    [videoTitle,videoLevel,videoDay]);
  useEffect(()=>{
    // Reset only when the selected recording changes, never after an edit to the posting text.
    setPostingTitle(postingDefaults.title);
    setPostingDescription(postingDefaults.description);
    setCopyNotice("");
  },[postingDefaults]);
  async function copyPostingText(value,what) {
    try {
      if(!value.trim() || !navigator.clipboard?.writeText) throw Error("Clipboard unavailable");
      await navigator.clipboard.writeText(value);
      setCopyNotice(what+" copied. Paste it when uploading your video.");
    } catch {
      setCopyNotice("Copy was blocked by your browser. Select the text above and copy it manually.");
    }
  }
  useEffect(()=>{
    const editorChanged=lyrics !== previousEditorLyrics.current;
    previousEditorLyrics.current=lyrics;
    // Published recordings have their own recorded lyrics, not necessarily the songbook draft.
    if (publishedTrack?.objectKey) return;
    const next=editorChanged ? lyrics || "" : generated?.lyrics || lyrics || "";
    // Saving the same text from this video editor must not clear hand-marked timing.
    if (next !== currentLyricText.current) {
      currentLyricText.current=next;
      setLyricText(next);
      setStarts([]);
    }
  },[lyrics,generated?.url,generated?.lyrics,publishedTrack?.objectKey]);

  // Record-specific provisional timing is never applied to a different MP3 take.
  useEffect(()=>{
    const reference=[A1_DAY5_FINAL_RECORDING,A1_DAY6_FINAL_RECORDING,A1_DAY7_FINAL_RECORDING,A1_DAY8_FINAL_RECORDING,A1_DAY10_FINAL_RECORDING,A2_DAY21_FINAL_RECORDING,A2_DAY22_FINAL_RECORDING].find(x=>x.assignmentKey===assignmentKey);
    if(!file||!reference)return undefined;
    let cancelled=false;
    async function loadRecordedTiming(){
      try{
        if(!window.crypto?.subtle)return;
        const digest=await window.crypto.subtle.digest("SHA-256",await file.arrayBuffer());
        if(cancelled)return;
        const hash=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,"0")).join("");
        if(hash!==reference.sha256)return;
        const recordedLyrics=getReusableSongDraft(reference.assignmentKey)?.lyrics || "";
        const recordedLines=videoLyricLines(recordedLyrics);
        if(recordedLines.length!==reference.cueStarts.length)throw Error("Recorded lyrics and draft timestamp counts do not match.");
        const estimated=recordedLines.map((text,i)=>({text,start:reference.cueStarts[i]}));
        const key="falowen-video-timing:"+assignmentKey;
        let reviewed=false,selected=estimated;
        try{
          const stored=JSON.parse(localStorage.getItem(key)||"null");
          const checked=validateLyricCues(stored?.cues,recordedLines);
          reviewed=stored?.recordingHash===hash && stored?.reviewed===true &&
            stored?.lyrics===recordedLyrics && checked.length===recordedLines.length;
          if(reviewed)selected=checked;
          else localStorage.setItem(key,JSON.stringify({lyrics:recordedLyrics,cues:estimated,recordingHash:hash,reviewed:false}));
        }catch{}
        if(cancelled)return;
        setRecordingFingerprint(hash);
        setObjectKey(reference.objectKey||"");
        currentLyricText.current=recordedLyrics;
        setLyricText(recordedLyrics);
        setCues(selected);
        setStarts([]);
        setTimingReview(!reviewed);
        setTimingStatus(reviewed?"local":"estimated");
        setMessage(reviewed
          ?"Previously reviewed timings restored for this exact MP3."
          :"Draft timing loaded for this exact MP3. Listen to all lyric lines, correct their starts and confirm before publishing shared timing.");
      }catch(cause){if(!cancelled)setError(cause.message||"Could not load the recording timing.");}
    }
    loadRecordedTiming();
    return ()=>{cancelled=true;};
  },[file,assignmentKey]);
  useEffect(()=>{
    if(!file){setFileUrl("");return undefined;}
    const url=URL.createObjectURL(file);setFileUrl(url);
    return ()=>URL.revokeObjectURL(url);
  },[file]);
  const lines=useMemo(()=>videoLyricLines(lyricText),[lyricText]);
  const completeCues=lines.length>0 && validateLyricCues(cues,lines).length===lines.length;
  const scenes=useMemo(()=>lyricScenes(lyricText,duration,
    completeCues ? cues.filter((_,i)=>i%3===0).map(c=>c.start) : starts),[lyricText,duration,starts,cues,completeCues]);
  const timingKey="falowen-video-timing:"+(publishedTrack?.objectKey || assignmentKey || objectKey || "custom");
  useEffect(()=>{
    // The published recording's verified timings are hydrated separately below.
    if (publishedTrack?.objectKey) return;
    try {
      const saved=JSON.parse(localStorage.getItem(timingKey)||"null");
      setCues(saved?.lyrics===lyricText ? validateLyricCues(saved.cues,lines) : []);
    } catch { setCues([]); }
  },[timingKey,lyricText,lines,publishedTrack?.objectKey]);
  useEffect(()=>{
    if (!active || catalogRequested) return;
    setCatalogRequested(true);
    loadTracks();
  },[active,catalogRequested]);
  useEffect(()=>{
    const key=publishedTrack?.objectKey;
    if (!key) {setTimingStatus("");return undefined;}
    const controller=new AbortController();
    setTimingStatus("loading");
    setError("");
    setStarts([]);
    setCues([]);
    setLyricText("");
    currentLyricText.current="";
    async function restorePublishedTiming() {
      let responseData=null, failed=false;
      try {
        const response=await fetch("https://www.falowen.app/api/music-lyrics?key="+encodeURIComponent(key),
          {cache:"no-cache",signal:controller.signal});
        if (!response.ok) throw Error("Shared timing unavailable");
        responseData=await response.json();
      } catch (cause) {
        if (controller.signal.aborted) return;
        failed=true;
      }
      if (controller.signal.aborted) return;
      const published=verifiedPublishedVideoTiming(responseData,key);
      // Use the recorded text only for this exact R2 object. Never borrow a different lesson's draft.
      const recordedLyrics=published?.lyrics || (responseData?.objectKey===key && typeof responseData?.lyrics==="string"
        ? responseData.lyrics : publishedTrack?.lyrics || "");
      const local=readSongCues({id:publishedTrack?.id || "",objectKey:key,lyrics:recordedLyrics});
      const lineCount=videoLyricLines(recordedLyrics).length;
      const localComplete=lineCount>0 && local.length===lineCount;
      const restored=localComplete ? local : published?.cues || [];
      // These approved songbook lyrics supersede the older short published
      // catalog metadata. We have not received their MP3 bytes, so the
      // owner's timing editor must remain blank until real audio is marked.
      const approvedUnreviewedSong={
        "music/a1/day-11/Mein Tag – Von morgens bis.mp3":"A1-7",
        "music/a1/day-12/Zeit und Datum.mp3":"A1-8",
      };
      const approvedAssignment=approvedUnreviewedSong[key];
      if(approvedAssignment){
        const approvedLyrics=getReusableSongDraft(approvedAssignment)?.lyrics||"";
        if(approvedLyrics && recordedLyrics!==approvedLyrics){
          currentLyricText.current=approvedLyrics;
          setLyricText(approvedLyrics);
          setCues([]);
          setTimingStatus("missing");
          setMessage("Approved lesson lyrics loaded for the R2 song. No unverified timestamps have been inserted. Play the published MP3 and mark each line before saving the shared timing.");
          return;
        }
      }
      // Only hydrate draft timing when the exact published MP3 bytes match a teacher recording.
      const draftReference=[A1_DAY5_FINAL_RECORDING,A1_DAY6_FINAL_RECORDING,A1_DAY7_FINAL_RECORDING,A1_DAY8_FINAL_RECORDING,A1_DAY10_FINAL_RECORDING,A2_DAY21_FINAL_RECORDING,A2_DAY22_FINAL_RECORDING]
        .find(x=>x.objectKey===key || (!x.objectKey && x.level===publishedTrack?.level && Number(x.day)===Number(publishedTrack?.day)));
      if(!published&&!localComplete&&draftReference&&window.crypto?.subtle){
        try{
          const remote=await fetch(publishedTrack.audioUrl,{signal:controller.signal});
          if(!remote.ok)throw Error("Audio unavailable");
          const digest=await window.crypto.subtle.digest("SHA-256",await remote.arrayBuffer());
          if(controller.signal.aborted)return;
          const hash=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,"0")).join("");
          if(hash===draftReference.sha256){
            const draftLyrics=getReusableSongDraft(draftReference.assignmentKey)?.lyrics||"";
            const draftLines=videoLyricLines(draftLyrics);
            if(draftLines.length!==draftReference.cueStarts.length)throw Error("Recorded song lyric count has changed.");
            const estimated=draftLines.map((text,i)=>({text,start:draftReference.cueStarts[i]}));
            const localKey="falowen-video-timing:"+key;
            const stored=JSON.parse(localStorage.getItem(localKey)||"null");
            const checked=validateLyricCues(stored?.cues,draftLines);
            const reviewed=stored?.recordingHash===hash&&stored?.reviewed===true&&stored?.lyrics===draftLyrics&&checked.length===draftLines.length;
            if(!reviewed)localStorage.setItem(localKey,JSON.stringify({lyrics:draftLyrics,cues:estimated,recordingHash:hash,reviewed:false}));
            currentLyricText.current=draftLyrics;
            setLyricText(draftLyrics);
            setCues(reviewed?checked:estimated);
            setRecordingFingerprint(hash);
            setTimingReview(!reviewed);
            setTimingStatus(reviewed?"local":"estimated");
            setMessage(reviewed?"Reviewed timing restored for the matching R2 song."
              :"Published audio matches the teacher MP3. Provisional lyric timings loaded; listen to every line before confirming and exporting R2 timing.");
            return;
          }
        }catch(e){if(controller.signal.aborted)return;/* Do not guess timings for mismatched R2 audio. */}
      }
      currentLyricText.current=recordedLyrics;
      setLyricText(recordedLyrics);
      setCues(restored);
      setTimingStatus(localComplete ? "local" : published ? "published" : failed ? "unavailable" : "missing");
    }
    restorePublishedTiming();
    return ()=>controller.abort();
  },[publishedTrack?.objectKey]);
  function saveCues(next){
    const checked=validateLyricCues(next,lines);
    if(checked.length!==next.length)return false;
    setCues(checked);
    if (publishedTrack?.objectKey || timingStatus==="estimated") setTimingStatus(checked.length===lines.length ? "local" : "edited");
    try {
      localStorage.setItem(timingKey,JSON.stringify({lyrics:lyricText,cues:checked,recordingHash:recordingFingerprint || undefined,reviewed:!timingReview}));
      if(audioFilenameObjectKey(objectKey) && !timingReview){
        localStorage.setItem("falowen-song-timing:"+objectKey,JSON.stringify({objectKey,cues:checked}));
        window.dispatchEvent(new CustomEvent("falowen-song-cues-changed",{detail:objectKey}));
      }
      return true;
    }catch{return false;}
  }
  const hasLyrics=videoLyricLines(lyricText).length>0;
  const drawAt=(seconds)=>{
    const canvas=canvasRef.current,ctx=canvas?.getContext("2d");
    if(ctx) drawMusicVideoFrame(ctx,{title:videoTitle,level:videoLevel,day:videoDay,scenes,time:seconds,duration});
  };
  useEffect(()=>{if(!exporting)drawAt(audioRef.current?.currentTime||0);},[scenes,videoTitle,videoLevel,videoDay,duration,exporting]);
  useEffect(()=>()=>{cancelRef.current?.();if(exportedUrlRef.current)URL.revokeObjectURL(exportedUrlRef.current);},[]);
  function exportLyricsSidecar(){
    const key=audioFilenameObjectKey(objectKey);
    if(!key || !hasLyrics || !completeCues){setError("Enter the exact R2 MP3 key and mark every lyric line before exporting shared timing.");return;}
    const payload=timedLyricsPack(key,lyricText,cues);
    saveBlob(new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}),
      key.split("/").pop().replace(/\.mp3$/i,".lyrics.json"));
    setMessage("Downloaded the timed lyrics sidecar for music, course book and slides. Upload it alongside the matching MP3 in R2.");
    setError("");
  }
  async function loadTracks(){
    setLoadingTracks(true);setError("");
    try {
      const response=await fetch("https://www.falowen.app/api/music-library");
      if(!response.ok)throw Error("Could not load the public song catalog.");
      const data=await response.json();
      setTracks((data.tracks||[]).filter(track=>audioFilenameObjectKey(track.objectKey) &&
        track.audioUrl==="https://www.falowen.app/api/music?track="+track.id));
    }catch(cause){setError(cause.message);}
    finally{setLoadingTracks(false);}
  }
  async function exportVideo(){
    if(exporting||!activeUrl||!hasLyrics)return;
    setError("");setMessage("");setProgress(0);
    const canvas=canvasRef.current;
    if(!canvas?.captureStream || typeof MediaRecorder==="undefined" || !MediaRecorder.isTypeSupported){
      setError("This browser cannot record canvas video. Try an up-to-date Chrome or Edge browser.");return;
    }
    const format=videoRecorderFormat(mime=>MediaRecorder.isTypeSupported(mime));
    if(!format){setError("No supported video recording format is available in this browser.");return;}
    if(format.extension==="webm"&&!allowWebm){
      setError("This browser cannot export MP4 directly. For a widely playable video, open Falowen Music Studio in a browser with MP4 recording support. Choose WebM only if your player accepts WebM/VP8 or VP9.");
      return;
    }
    const AudioContextClass=window.AudioContext||window.webkitAudioContext;
    if(!AudioContextClass){setError("Browser audio mixing is unavailable.");return;}
    let context=null,canvasStream=null,source=null,recorder=null,animation=0,cancelled=false,started=false,recordingStart=0,visibilityChanged=null;
    const release=()=>{
      clearInterval(animation);
      if(visibilityChanged)document.removeEventListener("visibilitychange",visibilityChanged);canvasStream?.getTracks().forEach(track=>track.stop());
      try{source?.disconnect();}catch{}
      if(context && context.state!=="closed")context.close().catch(()=>{});
      cancelRef.current=null;
      setExporting(false);
    };
    try{
      const audioResponse=await fetch(activeUrl);
      if(!audioResponse.ok)throw Error("Unable to read the MP3 for local video export. Upload the MP3 from your computer.");
      const bytes=await audioResponse.arrayBuffer();
      if(bytes.byteLength>40_000_000)throw Error("The selected audio is too large for browser-only rendering (40 MB maximum).");
      context=new AudioContextClass();
      const buffer=await context.decodeAudioData(bytes);
      if(!Number.isFinite(buffer.duration)||buffer.duration<1||buffer.duration>600)throw Error("Use an audio track between 1 second and 10 minutes.");
      if(completeCues && cues.at(-1).start>=buffer.duration)
        throw Error("The last lyric mark is outside this recording. Check the MP3 and timing marks.");
      await context.resume();
      // Record a dedicated canvas: preview effects cannot overwrite export frames.
      const exportCanvas=document.createElement("canvas");
      exportCanvas.width=canvas.width;exportCanvas.height=canvas.height;
      const exportContext=exportCanvas.getContext("2d");
      const exportScenes=lyricScenes(lyricText,buffer.duration,
        completeCues ? cues.filter((_,i)=>i%3===0).map(c=>c.start) : starts);
      drawMusicVideoFrame(exportContext,{title:videoTitle,level:videoLevel,day:videoDay,scenes:exportScenes,time:0,duration:buffer.duration});
      canvasStream=exportCanvas.captureStream(24);
      const destination=context.createMediaStreamDestination();
      source=context.createBufferSource();source.buffer=buffer;source.connect(destination);
      const stream=new MediaStream([...canvasStream.getVideoTracks(),...destination.stream.getAudioTracks()]);
      recorder=new MediaRecorder(stream,{mimeType:format.mime,videoBitsPerSecond:1800000,audioBitsPerSecond:128000});
      const chunks=[];
      const complete=new Promise((resolve,reject)=>{
        recorder.ondataavailable=event=>{if(event.data?.size)chunks.push(event.data);};
        recorder.onerror=event=>reject(Error(event.error?.message||"Browser video recording failed."));
        recorder.onstop=()=>cancelled?reject(Error("Export cancelled.")):resolve(new Blob(chunks,{type:recorder.mimeType||format.mime}));
      });
      cancelRef.current=()=>{
        cancelled=true;
        try{if(started)source.stop();}catch{}
        try{if(recorder.state!=="inactive")recorder.stop();}catch{}
      };
      audioRef.current?.pause();
      visibilityChanged=()=>{
        if(document.hidden){cancelRef.current?.();setError("Export stopped because this tab was hidden. Keep it visible for the complete recording.");}
      };
      document.addEventListener("visibilitychange",visibilityChanged);
      recordingStart=performance.now();
      recorder.start();
      started=true;
      const startAt=context.currentTime+0.08;
      const draw=()=>{
        const t=Math.max(0,context.currentTime-startAt);
        drawMusicVideoFrame(exportContext,{title:videoTitle,level:videoLevel,day:videoDay,scenes:exportScenes,time:t,duration:buffer.duration});
        canvas.getContext("2d").drawImage(exportCanvas,0,0);
        setProgress(previous=>Math.abs(previous-t)>0.5?Math.min(buffer.duration,t):previous);

      };
      draw();
      animation=window.setInterval(draw,1000/24);
      source.onended=()=>{
        if(recorder.state!=="inactive")window.setTimeout(()=>{
          if(recorder.state!=="inactive")recorder.stop();
        },220);
      };
      source.start(startAt);
      setExporting(true);
      let blob=await complete;
      if(!blob.size)throw Error("Video export returned an empty file.");
      if(format.extension==="mp4" && !(await isRealMp4Blob(blob)))
        throw Error("The browser returned a video that is not a valid MP4. No mislabeled file was downloaded.");
      if(format.extension==="webm"){
        // Some WebM duration repairs produce containers that other players reject.
        // Keep the original recording and fall back to it if the repaired copy cannot decode.
        try {
          const repaired=await fixWebmDuration(blob,performance.now()-recordingStart,{logger:false});
          if(await canReadVideoBlob(repaired))blob=repaired;
        } catch { /* The original WebM can still be checked for playback. */ }
      }
      if(!(await canReadVideoBlob(blob)))
        throw Error("The recording could not be played back in this browser. Nothing was downloaded. Try an MP4-capable browser (Chrome or Edge may support it), then export again.");
      const extension=format.extension;
      if(exportedUrlRef.current)URL.revokeObjectURL(exportedUrlRef.current);
      const previewUrl=URL.createObjectURL(blob);
      exportedUrlRef.current=previewUrl;
      const filename="falowen-lyrics-"+nameSlug(videoTitle)+"."+extension;
      setExportedVideo({url:previewUrl,blob,filename,format:extension});
      saveBlob(blob,filename);
      setMessage(extension==="mp4"
        ? "MP4 was checked for playback in this browser and downloaded. Preview the result below before sharing."
        : "WebM was checked for playback in this browser and downloaded. Many default phone and Windows players do not support WebM; use an MP4-capable browser for an MP4 export.");
    }catch(cause){setError(cause.message||"Unable to export this song video.");}
    finally{release();}
  }
  const supported=typeof MediaRecorder!=="undefined" && typeof MediaRecorder.isTypeSupported==="function"
    ?videoRecorderFormat(mime=>MediaRecorder.isTypeSupported(mime)):null;
  return <section className="music-card" aria-label="Lyrics video studio" style={{marginTop:18,padding:18,display:"grid",gap:14}}>
    <div><h2 style={{margin:"0 0 6px"}}>Lyrics Video Studio</h2>
      <p style={{margin:0}}>Choose a published recording to load its saved lyrics and verified timing automatically, then preview and export three lyric lines per screen. New tracks can still be marked manually. No extra AI generation or cloud rendering.</p>
    </div>
    <div>
      <button type="button" disabled={exporting||loadingTracks} onClick={loadTracks}>{loadingTracks?"Loading songs…":"Load available Falowen songs"}</button>
      {!!tracks.length && <label>Published recording <select disabled={exporting} value={publishedTrack?.objectKey||""} onChange={event=>{
        const track=tracks.find(row=>row.objectKey===event.target.value)||null;
        setPublishedTrack(track);setFile(null);setDuration(0);setStarts([]);setCues([]);setTimingReview(false);setRecordingFingerprint("");
        setObjectKey(track?.objectKey||"");setError("");
      }}><option value="">Choose a recording</option>{tracks.map(track=><option key={track.objectKey} value={track.objectKey}>{track.level} · Day {track.day} · {track.title}</option>)}</select></label>}
    </div>
    <label style={{display:"grid",gap:5,maxWidth:540,fontWeight:700}}>Audio source
      <input type="file" accept="audio/mpeg,audio/mp3,.mp3" disabled={exporting}
        onChange={event=>{setFile(event.target.files?.[0]||null);setPublishedTrack(null);setObjectKey("");setCues([]);setStarts([]);setDuration(0);setError("");setTimingReview(false);setRecordingFingerprint("");}} />
      <small>{file?"Using uploaded MP3: "+file.name:generated?.url?"Using the generated track shown above. You can also upload a final MP3.":"Upload the approved final MP3 to make a video. No audio is uploaded to Falowen."}</small>
    </label>
    {activeUrl?<audio ref={audioRef} src={activeUrl} controls preload="metadata"
      onSeeked={event=>{if(!exporting)drawAt(event.currentTarget.currentTime);}}
      onLoadedMetadata={event=>{const value=event.currentTarget.duration;setDuration(Number.isFinite(value)?value:0);}}
      onTimeUpdate={event=>{if(!exporting)drawAt(event.currentTarget.currentTime);}} />:null}
    <label style={{display:"grid",gap:5,fontWeight:700}}>Lyrics for this recording (editable)
      <textarea rows={9} style={{...fieldStyle,maxWidth:"100%",fontFamily:"inherit"}} disabled={exporting}
        value={lyricText} onChange={event=>{currentLyricText.current=event.target.value;setLyricText(event.target.value);setStarts([]);if(publishedTrack?.objectKey){setCues([]);setTimingStatus("edited");}}} />
    </label>
    {onOverwriteLyrics && <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
      <button type="button" disabled={!hasLyrics || savingLyrics || loadingLyrics || exporting || lyricText === lyrics}
        onClick={()=>onOverwriteLyrics(lyricText)}>{savingLyrics ? "Saving lyrics…" : "Overwrite Lyrics · Save permanently"}</button>
      <small>Save the edited lyric layers for this course lesson. It does not alter the MP3 or your timing marks.</small>
      {lyricsSaveNotice && <p role="status" style={{width:"100%",fontSize:13}}>{lyricsSaveNotice}</p>}
    </div>}
    {publishedTrack?.objectKey && <p role="status" className={completeCues ? "music-video-timing-ready" : "music-video-timing-review"}>
      {timingStatus==="loading" ? "Loading the published recording's lyrics and timing…" :
        completeCues ? "Timing ready: "+cues.length+"/"+lines.length+" lines from "+(timingStatus==="local" ? "saved corrections" : "the published recording")+". No new marking needed." :
        timingStatus==="unavailable" ? "Could not reach the published lyrics file. You can import saved timings or retry selecting the song." :
        timingStatus==="missing" ? "No matching verified timing found for this recording. Add or import line timings before exporting." :
        "Lyrics have changed. Review or re-import timing before exporting."}
    </p>}
    <p style={{margin:0,fontSize:13,color:"#765616"}}>Check every lyric against the actual finished audio. A course-song draft may differ from what the singer recorded. Existing published timing is reused only when the recording and every lyric line match.</p>
    <div style={{display:"flex",flexWrap:"wrap",gap:18,alignItems:"start"}}>
      <canvas ref={canvasRef} width="720" height="1280" style={frameStyle} aria-label="Vertical lyric video preview" />
      <div style={{display:"grid",gap:9,flex:"1 1 280px",maxHeight:500,overflowY:"auto"}}>
        <strong>Lyric layers · {scenes.length} screens (up to 3 lines each)</strong>
        {scenes.map((scene,index)=><div key={index} style={{padding:9,border:"1px solid #d1e5da",borderRadius:10,display:"grid",gap:4}}>
          <strong style={{fontSize:12}}>Screen {index+1}</strong>
          <div style={{fontSize:13,whiteSpace:"pre-line"}}>{scene.lines.join("\n")}</div>
          <div style={{display:"flex",gap:7,alignItems:"center",flexWrap:"wrap"}}>
            <label style={{fontSize:12}}>Start (seconds) <input style={{width:90,padding:5}} type="number" min="0" step="0.1"
              max={duration||600} value={scene.start} disabled={exporting||completeCues}
              onChange={event=>{const v=Number(event.target.value);setStarts(old=>scenes.map((s,i)=>i===index?(Number.isFinite(v)?v:0):s.start));}} /></label>
            <button type="button" disabled={!activeUrl||exporting||completeCues} onClick={()=>{
              const t=Math.round((audioRef.current?.currentTime||0)*10)/10;
              setStarts(scenes.map((s,i)=>i===index?t:s.start));
            }}>Mark at player time</button>
            <button type="button" disabled={!activeUrl||exporting} onClick={()=>{
              if(audioRef.current){audioRef.current.currentTime=scene.start;drawAt(scene.start);}
            }}>Preview</button>
          </div>
        </div>)}
      </div>
    </div>
    {!exporting && <SongTimingEditor song={{lyrics:lyricText,objectKey:audioFilenameObjectKey(objectKey)}} audio={audioRef} cues={cues} onSave={saveCues}/>}
    {timingReview && completeCues && <div role="group" style={{border:"1px solid #e0c88b",padding:12,borderRadius:12,display:"grid",gap:8}}>
      <strong>Time marks still require listening review</strong>
      <p style={{margin:0,fontSize:13}}>Open the teacher timing editor above, play this uploaded MP3, adjust each sung line and confirm only after you have checked the whole recording. The published R2 timing file stays blocked until then.</p>
      <button type="button" disabled={exporting} onClick={()=>{
        setTimingReview(false);
        setTimingStatus("local");
        try{
          localStorage.setItem(timingKey,JSON.stringify({lyrics:lyricText,cues,recordingHash:recordingFingerprint,reviewed:true}));
          if(audioFilenameObjectKey(objectKey)){
            localStorage.setItem("falowen-song-timing:"+objectKey,JSON.stringify({objectKey,cues}));
            window.dispatchEvent(new CustomEvent("falowen-song-cues-changed",{detail:objectKey}));
          }
        }catch{}
        setMessage("You confirmed this MP3 timing. Export its matching .lyrics.json sidecar and upload it beside the approved R2 audio file.");
      }}>I reviewed and confirmed all lyric time marks</button>
    </div>}}
    <p role="status">Shared line timing: {cues.length}/{lines.length} marked. {timingReview ? "Estimated timing for this exact MP3 — not yet verified. Listen, adjust and save the marks below." : completeCues ? "Ready to use in the video." : "Mark missing lines or import a matching timing file."}</p>
    <p style={{margin:0,fontSize:12,color:"#52635e"}}>{completeCues ? "Your saved timing is applied automatically. Open the teacher timing editor only if it needs correction." : "Play the song and mark each lyric line's beginning. Timings must increase in order."} Keep this browser tab open while exporting; recording runs in real time.</p>
    {exporting?<div role="status"><strong>Rendering locally… {Math.floor(progress)}s / {Math.ceil(duration)}s</strong>
      <button type="button" style={{marginLeft:12}} onClick={()=>cancelRef.current?.()}>Cancel export</button></div>:null}
    {supported?.extension==="webm" && <div className="music-video-format-warning" role="note">
      <strong>MP4 is not available in this browser.</strong>
      <p>WebM videos may not open in your Windows or phone video player even when the file contains valid audio and video. For a widely supported MP4, export in a browser that supports native MP4 recording (often Chrome or Edge).</p>
      <label><input type="checkbox" checked={allowWebm} onChange={event=>setAllowWebm(event.target.checked)}/> I understand — export WebM anyway</label>
    </div>}
    <button type="button" className="music-generate" disabled={!activeUrl||!hasLyrics||!supported||exporting||timingStatus==="loading"||(!!publishedTrack && !completeCues)||(supported?.extension==="webm"&&!allowWebm)||scenes.some((scene,i)=>i>0&&scene.start<=scenes[i-1].start)}
      onClick={exportVideo}>{exporting?"Recording music video…":"Export "+(supported?.extension==="mp4"?"MP4":supported?.extension==="webm"?"WebM":"video")+" · 9:16 with MP3"}</button>
    {exportedVideo && <section className="music-video-export-preview" aria-label="Verify downloaded video">
      <h3>Check your exported video</h3>
      <video controls playsInline preload="metadata" src={exportedVideo.url}/>
      <p>The downloaded {exportedVideo.format.toUpperCase()} file was checked in this browser. Play it here before uploading. To make another copy, use the button below.</p>
      <button type="button" onClick={()=>saveBlob(exportedVideo.blob,exportedVideo.filename)}>Download video again</button>
    </section>}
    <section className="music-video-posting" aria-label="Video title and description for publishing">
      <h3>Video title & description · ready to copy</h3>
      <p>Prepared from this song and lesson. Edit the wording for YouTube, TikTok or Instagram before copying.</p>
      <label htmlFor="music-video-post-title">Video title
        <input id="music-video-post-title" type="text" maxLength={150} value={postingTitle}
          onChange={event=>setPostingTitle(event.target.value)} />
      </label>
      <button type="button" onClick={()=>copyPostingText(postingTitle,"Title")}>Copy title</button>
      <label htmlFor="music-video-post-description">Video description
        <textarea id="music-video-post-description" rows={7} value={postingDescription}
          onChange={event=>setPostingDescription(event.target.value)} />
      </label>
      <div className="music-video-posting-buttons">
        <button type="button" onClick={()=>copyPostingText(postingDescription,"Description")}>Copy description</button>
        <button type="button" onClick={()=>copyPostingText(postingTitle+"\n\n"+postingDescription,"Title and description")}>Copy both</button>
      </div>
      {copyNotice && <p role="status">{copyNotice}</p>}
    </section>
    <details><summary>Publish matching lyrics to Falowen Music (optional)</summary>
      <p>Mark each sung line above to publish one timing layer for all players. Enter the exact R2 key for the published recording, export the JSON, and upload the file beside its MP3 in the existing Cloudflare bucket. This does not upload anything automatically.</p>
      <label style={{display:"grid",gap:5}}>Published R2 MP3 object key
        <input style={fieldStyle} value={objectKey} disabled={exporting} onChange={event=>setObjectKey(event.target.value)}
          placeholder="music/a1/day-13/your-approved-song.mp3" />
      </label>
      <button type="button" disabled={!audioFilenameObjectKey(objectKey)||!completeCues||exporting||timingReview} onClick={exportLyricsSidecar}>
        Download matching .lyrics.json
      </button>
    </details>
    {error?<p role="alert" style={{color:"#b91c1c",margin:0}}>{error}</p>:null}
    {message?<p role="status" style={{color:"#166534",margin:0}}>{message}</p>:null}
  </section>;
}

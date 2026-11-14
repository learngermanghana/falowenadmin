import { SWAHILI_MUSIC_TRACKS } from "../data/swahiliMusicTracks.js";
import fixWebmDuration from "fix-webm-duration";
import SongTimingEditor from "./SongTimingEditor.jsx";
import { savePublishedMusicTiming } from "../services/musicStudioService.js";
import { A1_DAY5_FINAL_RECORDING } from "../data/a1Day5FinalRecording.js";
import { A1_DAY6_FINAL_RECORDING } from "../data/a1Day6FinalRecording.js";
import { A1_DAY7_FINAL_RECORDING } from "../data/a1Day7FinalRecording.js";
import { A1_DAY8_FINAL_RECORDING } from "../data/a1Day8FinalRecording.js";
import { A1_DAY10_FINAL_RECORDING } from "../data/a1Day10FinalRecording.js";
import { A1_DAY17_FINAL_RECORDING } from "../data/a1Day17FinalRecording.js";
import { A1_DAY18_FINAL_RECORDING } from "../data/a1Day18FinalRecording.js";
import { A1_DAY22_FINAL_RECORDING } from "../data/a1Day22FinalRecording.js";
import { A2_DAY21_FINAL_RECORDING } from "../data/a2Day21FinalRecording.js";
import { A2_DAY22_FINAL_RECORDING } from "../data/a2Day22FinalRecording.js";
import { getReusableSongDraft } from "../data/reusableMusicSongbook.js";
import { matchingMusicEnglishDraft } from "../utils/musicEnglishDrafts.js";
import { readSongCues, validateLyricCues } from "../utils/songLyrics.js";
import { useEffect, useMemo, useRef, useState } from "react";
import { videoLyricLines, lyricScenes, findLyricScene, videoRecorderFormat, drawMusicVideoFrame, isRealMp4Blob, timedLyricsPack, verifiedPublishedVideoTiming, musicVideoSocialCopy, resolveMusicVideoGenre, MUSIC_VIDEO_GENRE_SUGGESTIONS, videoEnglishLines, publishedVideoEnglish, musicVideoAudioUrl, VIDEO_EXPORT_PRESETS } from "../utils/musicLyricsVideo.js";

const frameStyle = {width:"min(100%,440px)",borderRadius:14,background:"#102f34",boxShadow:"0 6px 20px #102f3426"};
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
  if (SWAHILI_MUSIC_TRACKS.some((track) => track.objectKey === key)) return key;
  return /^music\/(a1|a2|b1|b2|c1|c2)\/day-(0[1-9]|1[0-9]|2[0-8])\/[^/]{1,150}\.mp3$/i.test(key) ? key : "";
}
export default function MusicLyricsVideoStudio({ generated = null, lyrics = "", title = "Falowen Music", level = "", day = "", onOverwriteLyrics = null, savingLyrics = false, loadingLyrics = false, lyricsSaveNotice = "", assignmentKey = "", active = true, swahili = false }) {
  const [file,setFile] = useState(null);
  const [tracks,setTracks] = useState([]);
  const [publishedTrack,setPublishedTrack] = useState(null);
  const [loadingTracks,setLoadingTracks] = useState(false);
  const [catalogError,setCatalogError] = useState("");
  const [catalogLoaded,setCatalogLoaded] = useState(false);
  const [catalogRequested,setCatalogRequested] = useState(false);
  const [timingStatus,setTimingStatus] = useState("");
  const [fileUrl,setFileUrl] = useState("");
  const [lyricText,setLyricText] = useState(lyrics || "");
  const [englishText,setEnglishText] = useState("");
  const [publishedMetadata,setPublishedMetadata] = useState(null);
  const [showEnglish,setShowEnglish] = useState(true);
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
  const [postingGenreOverride,setPostingGenreOverride] = useState(null);
  const [copyNotice,setCopyNotice] = useState("");
  const [timingReview,setTimingReview] = useState(false);
  const [recordingFingerprint,setRecordingFingerprint] = useState("");
  const [allowWebm,setAllowWebm] = useState(false);
  const [videoPresetId,setVideoPresetId] = useState("youtube");
  const [savingTiming,setSavingTiming] = useState(false);
  const videoPreset=VIDEO_EXPORT_PRESETS[videoPresetId];
  const [exportedVideo,setExportedVideo] = useState(null);
  const exportedUrlRef=useRef(null);
  const [coverImage,setCoverImage]=useState(null);
  const [coverNotice,setCoverNotice]=useState('');
  const [customCover,setCustomCover]=useState('');
  const canvasRef=useRef(null), audioRef=useRef(null), cancelRef=useRef(null);
  const previousEditorLyrics=useRef(lyrics), currentLyricText=useRef(lyrics || "");
  const activeUrl=fileUrl || publishedTrack?.audioUrl || generated?.url || "";
  const videoTitle=publishedTrack?.title || title;
  useEffect(()=>{
    let cancelled=false;
    setCoverImage(null);setCoverNotice('');
    (async()=>{
      let source=customCover;
      if(!source){
        try {
          const response=await fetch('https://music.falowen.app/music/covers/artwork-map.json');
          if(!response.ok)throw Error('Artwork unavailable');
          const map=await response.json();
          const name=map.byObjectKey?.[publishedTrack?.objectKey] || map.default || 'music';
          if(!/^[a-z-]+$/.test(name))throw Error('Invalid artwork');
          source='https://music.falowen.app/music/covers/photos/'+name+'.jpg';
        }catch{if(!cancelled)setCoverNotice('Using the Falowen gradient. Choose artwork below to add a background.');return;}
      }
      const image=new Image();image.crossOrigin='anonymous';
      image.onload=()=>{if(!cancelled)setCoverImage(image);};
      image.onerror=()=>{if(!cancelled)setCoverNotice('Artwork could not load safely for export. Choose a local image or use the gradient.');};
      image.src=source;
    })();
    return()=>{cancelled=true;};
  },[publishedTrack?.objectKey,customCover]);
  useEffect(()=>()=>{if(customCover)URL.revokeObjectURL(customCover);},[customCover]);

  const videoLevel=publishedTrack?.level || level;
  const videoDay=publishedTrack?.day ?? day;
  const draftGenre=getReusableSongDraft(publishedTrack?.assignmentKey || assignmentKey)?.genre || "";
  // The creator confirmed this song's palm-wine/Afrobeat arrangement.
  // Every other track uses published recording metadata, then the saved draft.
  const titleGenre=resolveMusicVideoGenre({title:videoTitle});
  const defaultPostingGenre=titleGenre || publishedTrack?.genre || draftGenre || "";
  const selectedPostingGenre=postingGenreOverride === null ? defaultPostingGenre : postingGenreOverride;
  useEffect(()=>{setPostingGenreOverride(null);},[videoTitle,publishedTrack?.objectKey]);

  const englishStorageKey="falowen-video-english:"+(publishedTrack?.objectKey || assignmentKey || videoLevel+"-"+videoDay+"-"+videoTitle);
  useEffect(()=>{
    // Exact lyric matching prevents a different recording's English from surviving a song change.
    let saved=null;
    try{saved=JSON.parse(localStorage.getItem(englishStorageKey)||"null");}catch{}
    const approved = publishedVideoEnglish(publishedMetadata,publishedTrack?.objectKey,lyricText);
    const songbook = matchingMusicEnglishDraft(assignmentKey,lyricText);
    setEnglishText(saved?.lyrics===lyricText && typeof saved?.english==="string"
      ? saved.english : (approved || songbook?.text || ""));
  },[englishStorageKey,lyricText,publishedMetadata,publishedTrack?.objectKey,assignmentKey]);
  const postingDefaults=useMemo(()=>musicVideoSocialCopy({
    title:videoTitle,level:videoLevel,day:videoDay,genre:selectedPostingGenre,
    topic:publishedTrack?.topic || "",
  }),[videoTitle,videoLevel,videoDay,selectedPostingGenre,publishedTrack?.topic]);
  useEffect(()=>{
    // A new recording or deliberate genre edit regenerates the suggested copy.
    // Typing in the title/description itself never replaces a manual wording edit.
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
    const reference=[A1_DAY5_FINAL_RECORDING,A1_DAY6_FINAL_RECORDING,A1_DAY7_FINAL_RECORDING,A1_DAY8_FINAL_RECORDING,A1_DAY10_FINAL_RECORDING,A1_DAY17_FINAL_RECORDING,A1_DAY18_FINAL_RECORDING,A1_DAY22_FINAL_RECORDING,A2_DAY21_FINAL_RECORDING,A2_DAY22_FINAL_RECORDING].find(x=>x.assignmentKey===assignmentKey);
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
  const englishLines=useMemo(()=>videoEnglishLines(englishText,lines),[englishText,lines]);
  const scenes=useMemo(()=>lyricScenes(lyricText,duration,
    completeCues ? cues.filter((_,i)=>i%3===0).map(c=>c.start) : starts,
    completeCues ? cues : [], showEnglish ? englishLines : []),
    [lyricText,duration,starts,cues,completeCues,showEnglish,englishLines]);
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
    setPublishedMetadata(null);
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
      setPublishedMetadata(responseData);
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
        "music/a1/day-02/Ich heiße Bina.mp3":"A1-0.2",
        "music/a1/day-03/Wer bist du_ Sag es mir!.mp3":"A1-1.1",
        "music/a1/day-04/Meine Nummer, meine Adresse.mp3":"A1-2",
        "music/a2/day-23/Fahrrad zur Schule.mp3":"A2-9.23",
        "music/a2/day-24/Endlich Urlaub.mp3":"A2-9.24",
        "music/a2/day-25/Endlich Urlaub.mp3":"A2-9.25",
        "music/a1/day-11/Mein Tag – Von morgens bis.mp3":"A1-7",
        "music/a1/day-12/Zeit und Datum.mp3":"A1-8",
        "music/a1/day-21/Heute kann ich leider nicht.mp3":"A1-13",
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
      const draftReference=[A1_DAY5_FINAL_RECORDING,A1_DAY6_FINAL_RECORDING,A1_DAY7_FINAL_RECORDING,A1_DAY8_FINAL_RECORDING,A1_DAY10_FINAL_RECORDING,A1_DAY17_FINAL_RECORDING,A1_DAY18_FINAL_RECORDING,A1_DAY22_FINAL_RECORDING,A2_DAY21_FINAL_RECORDING,A2_DAY22_FINAL_RECORDING]
        .find(x=>x.objectKey===key || (!x.objectKey && x.level===publishedTrack?.level && Number(x.day)===Number(publishedTrack?.day)));
      // Day 22 replaced a previously published short song. Check the new MP3
      // even when an old sidecar is present, so stale lyrics/cues cannot win.
      const day22Replacement=draftReference?.assignmentKey==="A1-14.1" &&
        recordedLyrics!==getReusableSongDraft("A1-14.1")?.lyrics;
      if(((!published&&!localComplete)||day22Replacement)&&draftReference&&window.crypto?.subtle){
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
      if(day22Replacement){
        // Fail closed: if the new R2 audio is inaccessible or doesn't match the
        // user-uploaded take, show the approved text but never borrow old cues.
        const approvedLyrics=getReusableSongDraft("A1-14.1")?.lyrics||"";
        if(approvedLyrics){
          currentLyricText.current=approvedLyrics;
          setLyricText(approvedLyrics);
          setCues([]);
          setTimingStatus("missing");
          setMessage("Day 22 approved lyrics are loaded. The published MP3 could not be verified against the supplied recording, so no timing was attached. Upload the same MP3 here or check its R2 URL.");
          return;
        }
      }
      currentLyricText.current=recordedLyrics;
      setLyricText(recordedLyrics);
      setCues(restored);
      const estimated = !localComplete && published?.timingStatus === "estimated";
      setTimingReview(estimated);
      setRecordingFingerprint(published?.recordingSha256 || "");
      setTimingStatus(localComplete ? "local" : estimated ? "estimated" : published ? "published" : failed ? "unavailable" : "missing");
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
  const reviewNote=publishedMetadata?.transcriptionStatus==='automatic' ? 'Automatic lyric draft' : timingReview ? 'Estimated timing' : '';
  const hasLyrics=videoLyricLines(lyricText).length>0;
  const drawAt=(seconds)=>{
    const canvas=canvasRef.current,ctx=canvas?.getContext("2d");
    if(ctx) drawMusicVideoFrame(ctx,{title:videoTitle,level:videoLevel,day:videoDay,scenes,time:seconds,duration,artwork:coverImage,reviewNote});
  };
  useEffect(()=>{if(!exporting)drawAt(audioRef.current?.currentTime||0);},[scenes,videoTitle,videoLevel,videoDay,duration,exporting,videoPresetId,coverImage,reviewNote]);
  useEffect(()=>()=>{cancelRef.current?.();if(exportedUrlRef.current)URL.revokeObjectURL(exportedUrlRef.current);},[]);
  async function publishTimingDirectly(){
    if(savingTiming || exporting || timingReview)return;
    setError("");setMessage("");
    try {
      const key=audioFilenameObjectKey(objectKey);
      if(!key || !completeCues)throw Error("Choose the exact published MP3 and mark every sung line first.");
      setSavingTiming(true);
      const payload=timedLyricsPack(key,lyricText,cues);
      const result=await savePublishedMusicTiming(payload);
      setTimingStatus("published");
      setMessage("Saved "+result.cueCount+" reviewed lyric timestamps directly to Cloudflare R2. Falowen Music, course book and slides can now use the matching timing file.");
    }catch(cause){setError(cause.message||"Could not save timing. Your local marks are still here.");}
    finally{setSavingTiming(false);}
  }
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
    setLoadingTracks(true);setCatalogError("");setCatalogLoaded(false);
    try {
      if (swahili) {
        setTracks(SWAHILI_MUSIC_TRACKS);
        setCatalogLoaded(true);
        return;
      }
      const response=await fetch("/api/attendance-music-library", {cache:"no-cache",signal:AbortSignal.timeout(15000)});
      if(!response.ok)throw Error("Could not load the public song catalog.");
      const data=await response.json();
      if (!Array.isArray(data.tracks) || data.ok === false) throw Error("The song catalog is unavailable. Please retry.");
      setTracks(data.tracks.filter(track=>audioFilenameObjectKey(track.objectKey) &&
        track.audioUrl==="https://www.falowen.app/api/music?track="+track.id));
      setCatalogLoaded(true);
    }catch(cause){setCatalogError("Could not load Falowen songs. Check your connection and retry. " + (cause.message || ""));}
    finally{setLoadingTracks(false);}
  }
  async function exportVideo(){
    if(exporting||!activeUrl||!hasLyrics)return;
    if(!completeCues){setError("This recording has no complete line-by-line lyric timing. Mark each sung line in the timing editor before exporting; screen timings alone cannot highlight the current lyric accurately.");return;}
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
      let audioResponse;
      try {
        audioResponse=await fetch(musicVideoAudioUrl(activeUrl,publishedTrack), {signal:AbortSignal.timeout(45000)});
      } catch {
        throw Error("Could not download the MP3 for video export. Retry while connected; if this continues, the published music download service needs deployment or is unavailable.");
      }
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
      exportCanvas.width=videoPreset.width;exportCanvas.height=videoPreset.height;
      const exportContext=exportCanvas.getContext("2d");
      const exportScenes=lyricScenes(lyricText,buffer.duration,
        cues.filter((_,i)=>i%3===0).map(c=>c.start),
        cues, showEnglish ? englishLines : []);
      drawMusicVideoFrame(exportContext,{title:videoTitle,level:videoLevel,day:videoDay,scenes:exportScenes,time:0,duration:buffer.duration,artwork:coverImage,reviewNote});
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
        drawMusicVideoFrame(exportContext,{title:videoTitle,level:videoLevel,day:videoDay,scenes:exportScenes,time:t,duration:buffer.duration,artwork:coverImage,reviewNote});
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
      const filename="falowen-lyrics-"+nameSlug(videoTitle)+"-"+videoPreset.suffix+"."+extension;
      setExportedVideo({url:previewUrl,blob,filename,format:extension,preset:videoPreset.label});
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
      {catalogError && <p role="alert" style={{color:"#b91c1c"}}>{catalogError}</p>}
      {catalogLoaded && <p role="status">{tracks.length ? tracks.length+" published songs loaded. Choose a recording below to load its lyrics and timing." : "No published songs are available. Retry loading the catalog."}</p>}
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
    <section aria-label="English subtitles" style={{display:"grid",gap:7,border:"1px solid #b5d7ba",borderRadius:12,padding:12}}>
      <label style={{display:"flex",gap:8,alignItems:"center",fontWeight:700}}>
        <input type="checkbox" checked={showEnglish} disabled={exporting} onChange={event=>setShowEnglish(event.target.checked)}/>
        Show English translation below the highlighted German line
      </label>
      <label style={{display:"grid",gap:5,fontWeight:600,fontSize:13}}>English translation · one line for each German sung line ({lines.length} lines)
        <textarea rows={5} style={{...fieldStyle,maxWidth:"100%",fontFamily:"inherit",fontSize:13}}
          disabled={exporting} value={englishText} placeholder="Enter one English translation per German sung line, without verse/chorus headings."
          onChange={event=>{
            const next=event.target.value;
            setEnglishText(next);
            try{localStorage.setItem(englishStorageKey,JSON.stringify({lyrics:lyricText,english:next}));}catch{}
          }}/>
      </label>
      <small role="status" style={{color:englishLines.length===lines.length?"#24613a":"#715826"}}>
        {englishLines.length===lines.length
          ? "English lines match this song. They will appear under the active German line when Show English is checked."
          : "No complete matching English translation for this recording. You can enter or paste one translation for each German line. No AI or additional cloud cost."}
      </small>
      {publishedMetadata?.englishTranslation?.source==="course-draft" &&
        publishedVideoEnglish(publishedMetadata,publishedTrack?.objectKey,lyricText) &&
        <small>English translates the matching course draft; it is not a teacher-verified recording transcript.</small>}
    </section>
        {onOverwriteLyrics && <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
      <button type="button" disabled={!hasLyrics || savingLyrics || loadingLyrics || exporting || lyricText === lyrics}
        onClick={()=>onOverwriteLyrics(lyricText)}>{savingLyrics ? "Saving lyrics…" : "Overwrite Lyrics · Save permanently"}</button>
      <small>Save the edited lyric layers for this course lesson. It does not alter the MP3 or your timing marks.</small>
      {lyricsSaveNotice && <p role="status" style={{width:"100%",fontSize:13}}>{lyricsSaveNotice}</p>}
    </div>}
    {publishedTrack?.objectKey && <p role="status" className={completeCues ? "music-video-timing-ready" : "music-video-timing-review"}>
      {timingStatus==="loading" ? "Loading the published recording's lyrics and timing…" :
        timingStatus === "estimated" ? "Approximate timing loaded for this recording. Listen and correct delayed lines before confirming or saving." :
        completeCues ? "Timing ready: "+cues.length+"/"+lines.length+" lines from "+(timingStatus==="local" ? "saved corrections" : "the published recording")+". No new marking needed." :
        timingStatus==="unavailable" ? "Could not reach the published lyrics file. You can import saved timings or retry selecting the song." :
        timingStatus==="missing" ? "No matching verified timing found for this recording. Add or import line timings before exporting." :
        "Lyrics have changed. Review or re-import timing before exporting."}
    </p>}
    <p style={{margin:0,fontSize:13,color:"#765616"}}>Check every lyric against the actual finished audio. A course-song draft may differ from what the singer recorded. Existing published timing is reused only when the recording and every lyric line match.</p>
    <label style={{display:"grid",gap:5,maxWidth:410,fontWeight:700}} htmlFor="music-video-aspect">Video format
      <select id="music-video-aspect" value={videoPresetId} disabled={exporting} onChange={event=>{
        setVideoPresetId(event.target.value);
        if(exportedUrlRef.current){URL.revokeObjectURL(exportedUrlRef.current);exportedUrlRef.current=null;}
        setExportedVideo(null);
      }} style={fieldStyle}>
        {Object.entries(VIDEO_EXPORT_PRESETS).map(([id,preset])=><option key={id} value={id}>{preset.label} · {preset.width}×{preset.height}</option>)}
      </select>
      <small>Choose YouTube for normal widescreen videos, or vertical for TikTok, YouTube Shorts and Reels. The downloaded video uses this exact ratio.</small>
    </label>
    <label style={{display:'grid',gap:6}}>Video artwork (optional)
      <input type="file" accept="image/png,image/jpeg,image/webp" disabled={exporting} onChange={event=>{
        const file=event.target.files?.[0];
        if(!file)return;
        if(!['image/png','image/jpeg','image/webp'].includes(file.type) || file.size>10*1024*1024){setCoverNotice('Choose a PNG, JPEG or WebP image under 10 MB.');return;}
        setCustomCover(URL.createObjectURL(file));
      }}/>
      <small>{coverNotice || 'Published song artwork loads automatically when available. Your selected image stays in this browser.'}</small>
      {customCover && <button type="button" disabled={exporting} onClick={()=>setCustomCover('')}>Use song artwork instead</button>}
      <a href="https://music.falowen.app/music/covers/credits.html" target="_blank" rel="noopener noreferrer">Song artwork credits</a>
    </label>
    <div style={{display:"flex",flexWrap:"wrap",gap:18,alignItems:"start"}}>
      <canvas ref={canvasRef} width={videoPreset.width} height={videoPreset.height}
        style={{...frameStyle,aspectRatio:videoPreset.ratio,width:videoPresetId==="youtube"?"min(100%,440px)":"min(100%,270px)"}} aria-label={videoPreset.label+" lyric video preview"} />
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
        setMessage("Timing review confirmed. Click Save Timing to Falowen to publish it directly to the matching R2 song.");
      }}>I reviewed and confirmed all lyric time marks</button>
    </div>}}
    <p role="status">Shared line timing: {cues.length}/{lines.length} marked. {timingReview ? "Estimated timing for this exact MP3 — not yet verified. Listen, adjust and save the marks below." : completeCues ? "Ready to use in the video." : "Mark missing lines or import a matching timing file."}</p>
    <div style={{display:"grid",gap:6,border:"1px solid #b5d7ba",borderRadius:12,padding:12}}>
      <strong>Save timing to Falowen Music</strong>
      <p style={{margin:0,fontSize:13}}>When every sung line is marked and reviewed, save directly beside the published MP3 in Cloudflare. No JSON download or manual upload is needed. Your local marks remain available if publishing fails.</p>
      <button type="button" disabled={savingTiming||exporting||timingReview||!completeCues||!audioFilenameObjectKey(objectKey)}
        onClick={publishTimingDirectly}>{savingTiming?"Saving to Cloudflare…":"Save Timing to Falowen · Cloudflare R2"}</button>
      {!audioFilenameObjectKey(objectKey) && <small>Select a published song or enter its exact R2 MP3 key in the backup section below.</small>}
    </div>
    <p style={{margin:0,fontSize:12,color:"#52635e"}}>{completeCues
      ? "The exported video follows each sung line using its saved timing, including the matching English translation when enabled."
      : "To export real active-line highlighting, play the song and mark every lyric line's beginning in the timing editor. Screen-only estimates are not sufficient."} Keep this browser tab open while exporting; recording runs in real time.</p>
    {exporting?<div role="status"><strong>Rendering locally… {Math.floor(progress)}s / {Math.ceil(duration)}s</strong>
      <button type="button" style={{marginLeft:12}} onClick={()=>cancelRef.current?.()}>Cancel export</button></div>:null}
    {supported?.extension==="webm" && <div className="music-video-format-warning" role="note">
      <strong>MP4 is not available in this browser.</strong>
      <p>WebM videos may not open in your Windows or phone video player even when the file contains valid audio and video. For a widely supported MP4, export in a browser that supports native MP4 recording (often Chrome or Edge).</p>
      <label><input type="checkbox" checked={allowWebm} onChange={event=>setAllowWebm(event.target.checked)}/> I understand — export WebM anyway</label>
    </div>}
    <button type="button" className="music-generate" disabled={!activeUrl||!hasLyrics||!supported||exporting||timingStatus==="loading"||!completeCues||(supported?.extension==="webm"&&!allowWebm)||scenes.some((scene,i)=>i>0&&scene.start<=scenes[i-1].start)}
      onClick={exportVideo}>{exporting?"Recording music video…":"Export "+(supported?.extension==="mp4"?"MP4":supported?.extension==="webm"?"WebM":"video")+" · "+(videoPresetId==="youtube"?"16:9 YouTube":videoPresetId==="tiktok"?"9:16 vertical":"1:1 square")+" with MP3"}</button>
    {exportedVideo && <section className="music-video-export-preview" aria-label="Verify downloaded video">
      <h3>Check your exported video</h3>
      <video controls playsInline preload="metadata" src={exportedVideo.url}/>
      <p>The {exportedVideo.preset} {exportedVideo.format.toUpperCase()} file was checked in this browser. Play it here before uploading. To make another copy, use the button below.</p>
      <button type="button" onClick={()=>saveBlob(exportedVideo.blob,exportedVideo.filename)}>Download video again</button>
    </section>}
    <section className="music-video-posting" aria-label="Video title and description for publishing">
      <h3>Video title & description · ready to copy</h3>
      <p>Prepared from the song's own genre and lesson (not a generic Afrobeat label). Edit the style, title or description before copying to YouTube, TikTok or Instagram.</p>
      <label htmlFor="music-video-post-genre">Musical genre for this recording
        <input id="music-video-post-genre" type="text" list="music-video-genre-options"
          maxLength={68} value={selectedPostingGenre}
          placeholder="Select or type the verified music style"
          onChange={event=>setPostingGenreOverride(event.target.value)}/>
        <datalist id="music-video-genre-options">
          {MUSIC_VIDEO_GENRE_SUGGESTIONS.map(genre=><option key={genre} value={genre}/>)}
        </datalist>
      </label>
      <small>Use the actual sound of this recording. Changing the genre regenerates the suggested title and description; you can edit both afterwards.</small>
      <label htmlFor="music-video-post-title">Video title
        <input id="music-video-post-title" type="text" maxLength={100} value={postingTitle}
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
    <details><summary>R2 object key and manual JSON backup (optional)</summary>
      <p>Normally use Save Timing to Falowen above. This optional backup downloads the same .lyrics.json file if you want a manual copy.</p>
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

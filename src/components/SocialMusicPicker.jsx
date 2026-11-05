import { useRef, useState } from "react";
import { SOCIAL_MUSIC_TRACKS, loadSocialCloudflareTracks, selectedSocialTrack, socialMusicRange } from "../utils/socialMusicLibrary.js";

const field = { width: "100%", boxSizing: "border-box", borderRadius: 8, padding: "8px 10px", border: "1px solid #cbd5e1", background: "#fff" };
export const EMPTY_SOCIAL_MUSIC = Object.freeze({ id: "none", start: 0, end: 0, track: null });

/** Same vetted Cloudflare library and loop controls everywhere a social video uses music. */
export default function SocialMusicPicker({ selection = EMPTY_SOCIAL_MUSIC, onChange, disabled = false, label = "Falowen background song for video" }) {
  const [cloudTracks, setCloudTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);
  const track = selectedSocialTrack(selection, cloudTracks);
  const choices = [...SOCIAL_MUSIC_TRACKS, ...cloudTracks];
  if (track && !choices.some(item => item.id === track.id)) choices.push(track);
  const start = Number(selection.start) || 0;
  const end = Number(selection.end) || 0;
  const update = (key, value) => onChange?.({ ...selection, [key]: value });
  const changeTrack = (id) => {
    const next = selectedSocialTrack(id, cloudTracks);
    setDuration(0);setError("");
    onChange?.({ id, start: 0, end: 0, track: next?.objectKey ? next : null });
  };
  const loadCloudflare = async () => {
    if (loading || disabled) return;
    setLoading(true);setError("");
    try {
      const next = await loadSocialCloudflareTracks();
      setCloudTracks(next);setLoaded(true);
      if (!next.length) setError("No published Cloudflare MP3s were returned.");
    } catch (cause) { setError(cause.message || "Could not load the song library."); }
    finally { setLoading(false); }
  };
  const previewLoop = async () => {
    const audio = audioRef.current;
    if (!audio || disabled) return;
    try {
      socialMusicRange(selection, audio.duration);
      audio.currentTime = start;
      await audio.play();
      setError("");
    } catch (cause) { setError(cause.message || "This song could not be previewed."); }
  };
  return <section className="social-cloudflare-music" aria-label={label} style={{ display:"grid", gap: 9, padding: 12, borderRadius: 12, border: "1px solid #bfd8eb", background: "#f5faff", minWidth: 0 }}>
    <strong style={{fontSize:14}}>♫ {label}</strong>
    <div style={{display:"flex",flexWrap:"wrap",gap:8,alignItems:"center"}}>
      <button type="button" disabled={disabled || loading} onClick={loadCloudflare}>{loading ? "Loading songs…" : loaded ? "Refresh Cloudflare songs" : "Load songs from Cloudflare"}</button>
      <small>{loaded ? cloudTracks.length + " Cloudflare songs loaded" : "Loads published recordings only when clicked"}</small>
    </div>
    <label style={{display:"grid",gap:4,fontSize:13}}>Song
      <select style={field} disabled={disabled} value={selection.id || "none"} onChange={event=>changeTrack(event.target.value)}>
        {choices.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}
      </select>
    </label>
    {track?.src ? <>
      <audio key={track.src} ref={audioRef} src={track.src} controls preload="metadata"
        style={{width:"100%",maxWidth:"100%"}}
        onLoadedMetadata={event=>setDuration(Number(event.currentTarget.duration)||0)}
        onTimeUpdate={event=>{const audio=event.currentTarget; if(audio.duration && audio.currentTime >= (end || audio.duration) - .06){audio.currentTime=start; if(!audio.paused)audio.play().catch(()=>{});}}}
        onError={()=>setError("Cannot preview this song. Check that the published music API permits playback.")}/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:8}}>
        <label style={{display:"grid",gap:4,fontSize:12}}>Loop start (seconds)
          <input type="number" min="0" max={duration||undefined} step="0.1" disabled={disabled} value={selection.start ?? 0} onChange={event=>update("start",event.target.value)} style={field}/>
        </label>
        <label style={{display:"grid",gap:4,fontSize:12}}>Loop end (seconds)
          <input type="number" min="0" max={duration||undefined} step="0.1" disabled={disabled} value={selection.end ?? 0} onChange={event=>update("end",event.target.value)} style={field}/>
        </label>
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
        <button type="button" disabled={disabled || !duration} onClick={()=>update("start",Number(audioRef.current?.currentTime||0).toFixed(1))}>Set start at playhead</button>
        <button type="button" disabled={disabled || !duration} onClick={()=>update("end",Number(audioRef.current?.currentTime||0).toFixed(1))}>Set end at playhead</button>
        <button type="button" disabled={disabled || !duration} onClick={previewLoop}>▶ Preview selected loop</button>
        <button type="button" disabled={disabled} onClick={()=>onChange?.({...selection,start:0,end:0})}>Use full song</button>
      </div>
      <small>End 0 means the end of the song. The selected section repeats until the video finishes. {duration ? "Song length: "+duration.toFixed(1)+" seconds." : ""}</small>
    </> : <small>Choose a song to set and preview the section you want to repeat.</small>}
    {error && <small role="alert" style={{color:"#b91c1c"}}>{error}</small>}
  </section>;
}

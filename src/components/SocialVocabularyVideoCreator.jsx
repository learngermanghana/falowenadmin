import {chooseSocialVideoFormat, requireValidSocialVideo} from "../utils/socialMp4Export.js";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  VIDEO_DURATIONS, VIDEO_THEMES, MUSIC_CHOICES,
  chooseVocabularyVideoMime, originalMusicNotes, renderVocabularyFrame, videoFileStem,
} from "../utils/socialVocabularyVideo.js";
import "./SocialVocabularyVideoCreator.css";
import { SOCIAL_MUSIC_TRACKS, addSocialMusic } from "../utils/socialMusicLibrary.js";
import SocialMusicPicker, { EMPTY_SOCIAL_MUSIC } from "./SocialMusicPicker.jsx";
import { SOCIAL_VIDEO_ASPECTS, SOCIAL_VIDEO_QUALITIES, socialVideoDimensions, drawSocialPosterVideoFrame } from "../utils/socialVideoFormats.js";

const CTA = "social-vocab-video-button";
const WAIT = "Keep this tab open and the screen awake until the recording finishes.";
const readableError = error => error?.message || "Video export failed. Please try again on a current desktop browser.";
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = filename;
  document.body.appendChild(anchor); anchor.click(); anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}
// Keep the full 9:16 vocabulary composition visible when exported as 4:5,
 // square or landscape; never stretch the word art or cut off text.
function renderVocabularyAspectFrame(canvas, word, settings, seconds, aspect, sourceCanvas) {
  if (aspect === "tiktok") return renderVocabularyFrame(canvas, word, settings, seconds);
  const base = sourceCanvas || document.createElement("canvas");
  if (base.width !== 540 || base.height !== 960) { base.width = 540; base.height = 960; }
  renderVocabularyFrame(base, word, settings, seconds);
  const ctx = canvas.getContext("2d");
  if (ctx) drawSocialPosterVideoFrame(ctx, base, canvas.width, canvas.height, seconds, settings.duration);
}
const videoSupported = () => typeof HTMLCanvasElement !== "undefined"
  && typeof HTMLCanvasElement.prototype.captureStream === "function"
  && typeof MediaRecorder !== "undefined"
  && typeof MediaRecorder.isTypeSupported === "function";

function scheduleSound(context, target, duration, style, wordAudio) {
  const master = context.createGain();
  master.gain.value = .75;
  master.connect(target);
  const start = context.currentTime + .08;
  if (style !== "none") {
    for (const note of originalMusicNotes(duration, style)) {
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = note.oscillator;
      osc.frequency.value = note.frequency;
      gain.gain.setValueAtTime(0, start + note.time);
      gain.gain.linearRampToValueAtTime(note.volume, start + note.time + .035);
      gain.gain.exponentialRampToValueAtTime(.0001, start + note.time + note.length);
      osc.connect(gain); gain.connect(master);
      osc.start(start + note.time); osc.stop(start + note.time + note.length + .02);
    }
  }
  if (wordAudio) {
    const source = context.createBufferSource();
    const volume = context.createGain();
    source.buffer = wordAudio;
    volume.gain.value = .85;
    source.connect(volume); volume.connect(master);
    source.start(start + duration * .27, 0, Math.max(.1, Math.min(wordAudio.duration, duration * .58)));
  }
}

export default function SocialVocabularyVideoCreator({ word }) {
  const canvasRef = useRef(null);
  const recordingRef = useRef(null);
  const [theme, setTheme] = useState("blue");
  const [duration, setDuration] = useState(12);
  const [quality, setQuality] = useState("standard");
  const [videoAspect, setVideoAspect] = useState("tiktok");
  const [exportFormat, setExportFormat] = useState("auto");
  const [music, setMusic] = useState("gentle");
  const [falowenSelection, setFalowenSelection] = useState(EMPTY_SOCIAL_MUSIC);
  const falowenTrack = falowenSelection.id;
  const [voiceFile, setVoiceFile] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const canvasSupported = typeof HTMLCanvasElement !== "undefined";
  const mime = videoSupported() ? chooseSocialVideoFormat(type => MediaRecorder.isTypeSupported(type), exportFormat, { audioRequired: music !== "none" || !!voiceFile || falowenTrack !== "none" }) : null;
  const currentSettings = { theme, duration };
  const videoSize = socialVideoDimensions(videoAspect, quality);

  useEffect(() => {
    if (canvasRef.current && word && !playing) {
      const canvas = canvasRef.current;
      canvas.width = 540; canvas.height = Math.round(540 * videoSize.height / videoSize.width);
      renderVocabularyAspectFrame(canvas, word, currentSettings, Number(duration) * .67, videoAspect);
    }
  }, [word, theme, duration, videoAspect, playing]);

  useEffect(() => {
    if (!playing || !word) return undefined;
    const start = performance.now();
    let id = 0, lastUpdate = 0;
    const preview = canvasRef.current;
    if (preview) { preview.width = 540; preview.height = Math.round(540 * videoSize.height / videoSize.width); }
    const sourceCanvas = document.createElement("canvas");
    const frame = now => {
      const time = ((now - start) / 1000) % Number(duration);
      if (canvasRef.current) renderVocabularyAspectFrame(canvasRef.current, word, currentSettings, time, videoAspect, sourceCanvas);
      if (now - lastUpdate > 200) { setPreviewTime(time); lastUpdate = now; }
      id = window.requestAnimationFrame(frame);
    };
    id = window.requestAnimationFrame(frame);
    return () => window.cancelAnimationFrame(id);
  }, [playing, word, duration, theme, videoAspect]);

  useEffect(() => () => {
    if (recordingRef.current) {
      const { recorder, stream, context, cancel } = recordingRef.current;
      cancel?.();
      if (recorder.state !== "inactive") recorder.stop();
      stream.getTracks().forEach(track => track.stop());
      context?.close().catch(() => {});
    }
  }, []);

  const announceGerman = () => {
    if (!("speechSynthesis" in window)) { setError("German speech preview is unavailable in this browser."); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(String(word?.german || ""));
    utterance.lang = "de-DE"; utterance.rate = .78;
    window.speechSynthesis.speak(utterance);
    setMessage("Device pronunciation plays for preview only. Attach an approved audio file to include a voice in the export.");
  };

  const exportPng = useCallback(() => {
    if (!word) return;
    try {
      const canvas = document.createElement("canvas");
      const size = socialVideoDimensions(videoAspect, "full");
      canvas.width = size.width; canvas.height = size.height;
      renderVocabularyAspectFrame(canvas, word, currentSettings, Number(duration) * .69, videoAspect);
      canvas.toBlob(blob => {
        if (blob) { downloadBlob(blob, videoFileStem(word) + "-" + videoAspect + ".png"); setMessage(size.width + " × " + size.height + " PNG exported."); }
        else setError("PNG encoding is unavailable on this device.");
      }, "image/png");
    } catch (cause) { setError(readableError(cause)); }
  }, [word, theme, duration, videoAspect]);

  const exportVideo = async () => {
    if (!word || busy) return;
    setError(""); setMessage(""); setPlaying(false);
    if (!videoSupported() || !mime) {
      setError("The selected format cannot include the chosen audio in this browser. Choose Auto or WebM, or export without audio.");
      return;
    }
    let context = null, stream = null, recorder = null, timer = null, frameId = null;
    let cancelled = false, wake = null;
    const cancel = () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
      wake?.();
    };
    const waitForRecording = () => new Promise(resolve => {
      wake = resolve;
      timer = window.setTimeout(resolve, Number(duration) * 1000 + 180);
    });
    setBusy(true);
    try {
      // MediaRecorder encodes a real-time canvas stream entirely on this device.
      const resolution = socialVideoDimensions(videoAspect, quality);
      const canvas = document.createElement("canvas");
      const sourceCanvas = document.createElement("canvas");
      canvas.width = resolution.width; canvas.height = resolution.height;
      renderVocabularyAspectFrame(canvas, word, currentSettings, 0, videoAspect, sourceCanvas);
      const visualStream = canvas.captureStream(30);
      const tracks = [...visualStream.getVideoTracks()];
      if (!tracks.length) throw new Error("This device did not provide a video track.");
      const Context = window.AudioContext || window.webkitAudioContext;
      if ((music !== "none" || voiceFile || falowenTrack !== "none") && !Context)
        throw new Error("Your browser cannot mix audio into a video. Set music to None or use a newer browser.");
      let buffer = null;
      if (Context && (music !== "none" || voiceFile || falowenTrack !== "none")) {
        context = new Context();
        await context.resume();
        if (voiceFile) {
          if (voiceFile.size > 15 * 1024 * 1024) throw new Error("Use an audio file smaller than 15 MB.");
          try {
            buffer = await context.decodeAudioData(await voiceFile.arrayBuffer());
          } catch { throw new Error("Cannot decode pronunciation file. Try MP3, M4A or WAV."); }
        }
        const output = context.createMediaStreamDestination();
        tracks.push(...output.stream.getAudioTracks());
        stream = new MediaStream(tracks);
        // Start oscillator notes once the video recorder has started.
        const trackMime = mime.mime;
        recorder = new MediaRecorder(stream, { mimeType: trackMime, videoBitsPerSecond: quality === "full" ? 5500000 : 3000000 });
        const resultPromise = new Promise((resolve, reject) => {
          const blobs = [];
          recorder.ondataavailable = event => { if (event.data.size) blobs.push(event.data); };
          recorder.onerror = event => reject(event.error || new Error("MediaRecorder encoding error."));
          recorder.onstop = () => blobs.length ? resolve(new Blob(blobs, { type: recorder.mimeType || trackMime }))
            : reject(new Error("No video frames were encoded."));
        });
        const soundtrack = await addSocialMusic(context, output, falowenTrack, Number(duration), 0.22, { selection: falowenSelection, tracks: [falowenSelection.track].filter(Boolean) });
        await context.resume();
        if (context.state !== "running") throw new Error("Audio is paused by this browser. Keep the tab active and try export again.");
        recorder.start(300);
        soundtrack?.start();
        scheduleSound(context, output, Number(duration), falowenTrack !== "none" ? "none" : music, buffer);
        const start = performance.now();
        const frame = now => {
          const elapsed = Math.min(Number(duration), (now - start) / 1000);
          renderVocabularyAspectFrame(canvas, word, currentSettings, elapsed, videoAspect, sourceCanvas);
          if (recorder.state === "recording" && elapsed < Number(duration)) frameId = requestAnimationFrame(frame);
        };
        frameId = requestAnimationFrame(frame);
        recordingRef.current = { recorder, stream, context, cancel };
        setMessage("Recording " + duration + " seconds locally. " + WAIT);
        await waitForRecording();
        if (cancelled) return;
        renderVocabularyFrame(canvas, word, currentSettings, duration);
        if (recorder.state === "recording") recorder.stop();
        const blob = await resultPromise;
        await requireValidSocialVideo(blob, mime);
        downloadBlob(blob, videoFileStem(word) + "-" + videoAspect + "-" + duration + "s." + mime.extension);
        setMessage(mime.extension.toUpperCase() + " video exported with " + (falowenTrack !== "none" ? (falowenSelection.track?.label || SOCIAL_MUSIC_TRACKS.find(track => track.id === falowenTrack)?.label || "Falowen song") : music === "none" ? "no music" : "original Falowen music")
          + (voiceFile ? " and your attached German audio." : ".")
);
      } else {
        stream = new MediaStream(tracks);
        recorder = new MediaRecorder(stream, { mimeType: mime.mime, videoBitsPerSecond: quality === "full" ? 5500000 : 3000000 });
        const resultPromise = new Promise((resolve, reject) => {
          const blobs = [];
          recorder.ondataavailable = event => { if (event.data.size) blobs.push(event.data); };
          recorder.onerror = event => reject(event.error || new Error("MediaRecorder encoding error."));
          recorder.onstop = () => blobs.length ? resolve(new Blob(blobs, { type: recorder.mimeType || mime.mime }))
            : reject(new Error("No video frames were encoded."));
        });
        recorder.start(300);
        const start = performance.now();
        const frame = now => {
          const elapsed = Math.min(Number(duration), (now - start) / 1000);
          renderVocabularyAspectFrame(canvas, word, currentSettings, elapsed, videoAspect, sourceCanvas);
          if (recorder.state === "recording" && elapsed < Number(duration)) frameId = requestAnimationFrame(frame);
        };
        frameId = requestAnimationFrame(frame);
        recordingRef.current = { recorder, stream, context, cancel };
        setMessage("Recording " + duration + " seconds locally. " + WAIT);
        await waitForRecording();
        if (cancelled) return;
        renderVocabularyFrame(canvas, word, currentSettings, duration);
        if (recorder.state === "recording") recorder.stop();
        const blob = await resultPromise;
        await requireValidSocialVideo(blob, mime);
        downloadBlob(blob, videoFileStem(word) + "-" + videoAspect + "-" + duration + "s." + mime.extension);
        setMessage(mime.extension.toUpperCase() + " video exported.");
      }
    } catch (cause) { setError(readableError(cause)); setMessage(""); }
    finally {
      if (timer) window.clearTimeout(timer);
      if (frameId) window.cancelAnimationFrame(frameId);
      if (recorder && recorder.state !== "inactive") { try { recorder.stop(); } catch { /* stopped already */ } }
      stream?.getTracks().forEach(track => track.stop());
      if (context) await context.close().catch(() => {});
      recordingRef.current = null;
      if (!cancelled) setBusy(false);
    }
  };

  return <section className="social-vocab-video" aria-label="Animated vocabulary video studio">
    <div className="social-vocab-video-header">
      <div>
        <h3>Animated Vocabulary of the Day</h3>
        <p>Branded intro → German word → meaning → example → ending. No paid video API.</p>
      </div>
      <span className="social-vocab-video-pill">{videoSize.label}</span>
    </div>
    <div className="social-vocab-video-layout">
      <div className="social-vocab-video-controls">
        <label>Visual style
          <select value={theme} disabled={busy} onChange={e => setTheme(e.target.value)}>
            {VIDEO_THEMES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
        <label>Video duration
          <select value={duration} disabled={busy} onChange={e => setDuration(Number(e.target.value))}>
            {VIDEO_DURATIONS.map(value => <option key={value} value={value}>{value} seconds</option>)}
          </select>
        </label>
        <label>Export aspect ratio / social platform
          <select value={videoAspect} disabled={busy} onChange={e => setVideoAspect(e.target.value)}>
            {SOCIAL_VIDEO_ASPECTS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
        <label>Video resolution
          <select value={quality} disabled={busy} onChange={e => setQuality(e.target.value)}>
            {SOCIAL_VIDEO_QUALITIES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
        <small className="social-vocab-video-note">Video output: {videoSize.width} × {videoSize.height}px. TikTok uses 9:16, with all vocabulary text kept visible in other ratios.</small>
        <label>Video file format
          <select value={exportFormat} disabled={busy} onChange={e => setExportFormat(e.target.value)}>
            <option value="auto">Auto (MP4 preferred, WebM fallback)</option>
            <option value="mp4">MP4 · H.264 (where supported)</option>
            <option value="webm">WebM · Chrome/Firefox compatible</option>
          </select>
        </label>
        <label>Background music
          <select value={music} disabled={busy} onChange={e => setMusic(e.target.value)}>
            {MUSIC_CHOICES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
        <SocialMusicPicker label="Falowen song for video export" selection={falowenSelection} onChange={setFalowenSelection} disabled={busy} />
        <label>German pronunciation recording · optional
          <input type="file" disabled={busy} accept="audio/mpeg,audio/mp4,audio/wav,audio/x-wav,audio/aac,.mp3,.m4a,.wav"
            onChange={e => setVoiceFile(e.target.files?.[0] || null)}/>
        </label>
        {voiceFile && <button type="button" className={CTA} disabled={busy} onClick={() => setVoiceFile(null)}>Remove pronunciation audio</button>}
        <button type="button" className={CTA} disabled={!word || busy} onClick={announceGerman}>
          Hear German pronunciation (device preview)
        </button>
        <p className="social-vocab-video-note">Choose a built-in or Cloudflare Falowen song and select the part to loop in the video, or keep the original tones. Auto uses WebM when this browser cannot record MP4 with audio. When a Falowen song is selected, it replaces the generated tones. No paid music API is required. Device text-to-speech is only for preview. Attach an approved voice recording to embed pronunciation in the video.</p>
      </div>
      <div className="social-vocab-video-preview">
        <div className="social-vocab-video-screen" style={{aspectRatio: videoSize.width + " / " + videoSize.height}}>
          <canvas ref={canvasRef} width={540} height={960} aria-label="Animated vocabulary video preview"/>
        </div>
        <div className="social-vocab-video-actions">
          <button type="button" className={CTA} disabled={busy || !word} onClick={() => { setPlaying(x => !x); setError(""); }}>
            {playing ? "Pause preview" : "Play animation"}
          </button>
          <button type="button" className={CTA} disabled={busy || !word || !canvasSupported} onClick={exportPng}>Export {videoAspect === "tiktok" ? "TikTok 9:16" : videoAspect} PNG</button>
          <button type="button" className={CTA + " primary"} disabled={busy || !word || !mime} onClick={exportVideo}>
            {busy ? "Encoding video…" : `Export ${videoAspect === "tiktok" ? "TikTok 9:16" : videoAspect} ${mime?.extension?.toUpperCase() || "video"}`}
          </button>
        </div>
        {playing && <small aria-live="off">Preview · {previewTime.toFixed(1)}s / {duration}s</small>}
        {!mime && <p role="alert" className="social-vocab-video-warning">The selected format is unavailable with these audio settings. Choose Auto or WebM. MP4 with music requires H.264 and AAC recording support.</p>}
        
        {message && <p className="social-vocab-video-success" role="status">{message}</p>}
        {error && <p className="social-vocab-video-warning" role="alert">{error}</p>}
        <small className="social-vocab-video-note">Export runs locally and takes the selected duration. Keep this tab visible until it finishes. No video or audio is uploaded to Falowen.</small>
      </div>
    </div>
  </section>;
}

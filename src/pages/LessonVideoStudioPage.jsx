import { useEffect, useMemo, useRef, useState } from "react";
import {
  activeLessonHighlights, activeLessonSlide, downloadLessonBlob, importLessonImages,
  importLessonPowerPoint, prepareLessonScript, recordLessonVideo, safeLessonFilename,
  spreadLessonSlides, timeLabel,
} from "../utils/lessonVideoStudio.js";
import "./LessonVideoStudioPage.css";

const MAX_AUDIO = 80 * 1024 * 1024;
const initialMessage = "Import slides, attach a recording, then mark slide changes and highlight areas while listening.";
const uid = () => typeof crypto !== "undefined" && crypto.randomUUID
  ? crypto.randomUUID() : String(Date.now()) + "-" + Math.random().toString(16).slice(2);
function asDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Unable to read the chosen file."));
    reader.readAsDataURL(file);
  });
}
function rounded(value) { return Math.round(Number(value) * 10) / 10; }
function NumberInput({ label, value, onChange, min = 0, max, step = 0.1 }) {
  return <label className="lvs-number">{label}
    <input type="number" min={min} max={max} step={step} value={value}
      onChange={event => onChange(Number(event.target.value))} />
  </label>;
}
export default function LessonVideoStudioPage() {
  const [title, setTitle] = useState("German lesson video");
  const [slides, setSlides] = useState([]);
  const [selected, setSelected] = useState(0);
  const [highlights, setHighlights] = useState([]);
  const [audioData, setAudioData] = useState("");
  const [audioName, setAudioName] = useState("");
  const [duration, setDuration] = useState(0);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [follow, setFollow] = useState(false);
  const [fullScript, setFullScript] = useState("");
  const [status, setStatus] = useState(initialMessage);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [aspect, setAspect] = useState("landscape");
  const [quality, setQuality] = useState("standard");
  const [drag, setDrag] = useState(null);
  const [recording, setRecording] = useState(false);
  const audioRef = useRef(null);
  const imageRef = useRef(null);
  const recorderRef = useRef(null);
  const micRef = useRef(null);
  const chunksRef = useRef([]);
  const current = slides[selected];
  const activeIndex = activeLessonSlide(slides, time);
  const visibleHighlights = useMemo(() => activeLessonHighlights(highlights, selected, time), [highlights, selected, time]);

  useEffect(() => () => {
    window.speechSynthesis?.cancel();
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    micRef.current?.getTracks().forEach(track => track.stop());
  }, []);
  function success(message) { setError(""); setStatus(message); }
  function failure(exception) { setError(exception?.message || String(exception)); setLoading(false); }
  async function importPresentation(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setLoading(true); setError("");
    try {
      if (!/\.pptx$/i.test(file.name)) throw new Error("Please choose a .pptx PowerPoint file.");
      const result = await importLessonPowerPoint(file);
      setSlides(result.slides); setSelected(0); setHighlights([]); setFollow(false); setFullScript("");
      setTitle(file.name.replace(/\.pptx$/i, ""));
      if (duration) setSlides(previous => spreadLessonSlides(previous, duration));
      success(result.slides.length + " slides imported on your device." +
        (result.approximate ? " " + result.approximate + " slides have approximated layouts; use PNG slide exports for exact fidelity." : " Original image slides preserved."));
    } catch (exception) { failure(exception); }
    finally { setLoading(false); }
  }
  async function importImages(event) {
    const files = event.target.files;
    event.target.value = "";
    if (!files?.length) return;
    setLoading(true); setError("");
    try {
      const imported = await importLessonImages(files);
      setSlides(duration ? spreadLessonSlides(imported, duration) : imported);
      setSelected(0); setHighlights([]); setFollow(false); setFullScript("");
      success(imported.length + " slide images imported. Their appearance will be preserved in the video.");
    } catch (exception) { failure(exception); }
    finally { setLoading(false); }
  }
  async function attachAudio(file) {
    if (!file) return;
    if (file.size > MAX_AUDIO) { failure(new Error("Choose an audio recording smaller than 80 MB.")); return; }
    setLoading(true); setError("");
    try {
      const data = await asDataUrl(file);
      setAudioData(data); setAudioName(file.name); setTime(0); setDuration(0);
      if (audioRef.current) audioRef.current.pause();
      success("Narration attached. Listen, adjust slide markers and draw timed highlights.");
    } catch (exception) { failure(exception); }
    finally { setLoading(false); }
  }
  async function recordMicrophone() {
    setError("");
    if (recording) {
      recorderRef.current?.stop();
      return;
    }
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined")
        throw new Error("Microphone recording requires a supported browser over HTTPS.");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micRef.current = stream;
      chunksRef.current = [];
      const type = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus" : "";
      const recorder = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
      recorderRef.current = recorder;
      recorder.ondataavailable = e => { if (e.data?.size) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        setRecording(false);
        stream.getTracks().forEach(track => track.stop());
        micRef.current = null;
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        if (blob.size) await attachAudio(new File([blob], "falowen-microphone-recording.webm", { type: blob.type }));
      };
      recorder.onerror = () => failure(new Error("Microphone recording failed."));
      recorder.start(1000);
      setRecording(true);
      success("Microphone recording is active. Read your script, then click Stop recording.");
    } catch (exception) { failure(exception); setRecording(false); }
  }
  function updateSlide(index, patch) {
    setSlides(previous => previous.map((slide, i) => i === index ? { ...slide, ...patch } : slide));
  }
  function markSlide(index, seconds) {
    const previous = index === 0 ? 0 : Number(slides[index - 1]?.start || 0);
    const next = index === slides.length - 1 ? Math.max(duration, seconds) : Number(slides[index + 1]?.start || 0);
    if (seconds < previous || (index < slides.length - 1 && seconds > next)) {
      setError("Slide markers must stay in order. Adjust the neighbouring slide time first, or spread all slides evenly.");
      return;
    }
    updateSlide(index, { start: rounded(index === 0 ? 0 : Math.max(0, seconds)) });
    success("Slide " + (index + 1) + " begins at " + timeLabel(seconds) + ".");
  }
  function seek(seconds) {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(duration, seconds));
    setTime(audioRef.current.currentTime);
  }
  function point(event) {
    const rect = imageRef.current?.getBoundingClientRect();
    if (!rect?.width || !rect?.height) return null;
    return { x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)) };
  }
  function pointerDown(event) {
    if (!audioData || !current) { setError("Attach narration before creating timed highlights."); return; }
    const p = point(event);
    if (!p) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ origin: p, end: p });
  }
  function pointerMove(event) {
    if (!drag) return;
    const p = point(event);
    if (p) setDrag(previous => previous ? { ...previous, end: p } : null);
  }
  function pointerUp(event) {
    if (!drag) return;
    const p = point(event) || drag.end;
    const x = Math.min(drag.origin.x, p.x), y = Math.min(drag.origin.y, p.y);
    const w = Math.abs(drag.origin.x - p.x), h = Math.abs(drag.origin.y - p.y);
    setDrag(null);
    if (w < 0.008 || h < 0.008) return;
    const from = rounded(time);
    const to = rounded(Math.max(from + 0.2, Math.min(duration || from + 3, from + 3)));
    setHighlights(previous => [...previous, {
      id: uid(), slide: selected, x, y, w, h, start: from, end: to, label: "Highlight " + (previous.length + 1),
    }]);
    success("Highlight added at " + timeLabel(from) + ". Edit its end time or click Set end at playhead.");
  }
  function editHighlight(id, patch) {
    setHighlights(previous => previous.map(h => h.id === id ? { ...h, ...patch } : h));
  }
  async function loadTranscript(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setFullScript(await file.text());
    success("Narration transcript imported. Edit it here or export it as a text file.");
  }
  function scriptOutline() {
    setSlides(previous => previous.map((s, i) => s.script ? s : ({
      ...s, script: s.text
        ? "Let's look at slide " + (i + 1) + ". " + s.text + " Take a moment to read the example."
        : "Slide " + (i + 1) + ". [Describe the picture, explain the German examples, then pause.]",
    })));
    success("A free editable script outline was prepared from available slide text. Image-only slides need your descriptions.");
  }
  function downloadScript() {
    const value = fullScript.trim() || prepareLessonScript(slides);
    downloadLessonBlob(new Blob([value], { type: "text/plain;charset=utf-8" }), safeLessonFilename(title) + "-script.txt");
  }
  function saveProject() {
    if (!slides.length) { setError("Import slides before saving a project."); return; }
    const project = { type: "falowen-lesson-video", version: 1, title, slides, highlights,
      audioData, audioName, fullScript, aspect, quality };
    downloadLessonBlob(new Blob([JSON.stringify(project)], { type: "application/json" }),
      safeLessonFilename(title) + "-project.json");
    success("The editable project has been saved, including local slides, audio and highlights.");
  }
  async function loadProject(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setLoading(true);
    try {
      if (file.size > 130 * 1024 * 1024) throw new Error("Project files must be smaller than 130 MB.");
      const project = JSON.parse(await file.text());
      if (project.type !== "falowen-lesson-video" || project.version !== 1 ||
          !Array.isArray(project.slides) || !project.slides.length || project.slides.length > 160 ||
          !project.slides.every(slide => /^data:image\/(png|jpeg|webp|gif);base64,/.test(slide.image)))
        throw new Error("This is not a supported Falowen Lesson Video project.");
      setTitle(String(project.title || "German lesson video").slice(0, 100));
      setSlides(project.slides.map((slide, i) => ({
        id: "imported-" + i, image: slide.image, text: String(slide.text || ""),
        script: String(slide.script || ""), start: Number(slide.start) || 0,
      })));
      setHighlights(Array.isArray(project.highlights) ? project.highlights.filter(h =>
        Number.isInteger(h.slide) && h.slide >= 0 && h.slide < project.slides.length &&
        [h.x, h.y, h.w, h.h, h.start, h.end].every(v => Number.isFinite(Number(v)))) : []);
      setAudioData(/^data:audio\//.test(project.audioData || "") ? project.audioData : "");
      setAudioName(String(project.audioName || ""));
      setFullScript(String(project.fullScript || ""));
      setAspect(["landscape", "tiktok"].includes(project.aspect) ? project.aspect : "landscape");
      setQuality(project.quality === "full" ? "full" : "standard");
      setSelected(0); setTime(0); setFollow(false);
      success("Project restored. Your narration, slide starts and highlights are ready to review.");
    } catch (exception) { failure(exception); }
    finally { setLoading(false); }
  }
  function speakPreview() {
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
      setError("Your browser does not support voice preview.");
      return;
    }
    const script = current?.script || fullScript || "";
    if (!script.trim()) { setError("Write or paste some narration text first."); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(script.slice(0, 3000));
    utterance.rate = 0.93;
    window.speechSynthesis.speak(utterance);
    success("Browser voice preview only: it does not replace the attached recording in video exports.");
  }
  async function exportVideo() {
    setError("");
    if (!slides.length || !audioData) {
      setError("Add your slides and narration audio before exporting."); return;
    }
    if (recording) { setError("Finish the microphone recording before exporting."); return; }
    setExporting(true); setExportProgress(0);
    audioRef.current?.pause();
    window.speechSynthesis?.cancel();
    try {
      const result = await recordLessonVideo({ slides, highlights, audioData, aspect, quality, onProgress: setExportProgress });
      downloadLessonBlob(result.blob, safeLessonFilename(title) + "." + result.extension);
      success("Video exported: " + result.dims.width + " × " + result.dims.height + ", " +
        timeLabel(result.duration) + ", ." + result.extension + ".");
    } catch (exception) { failure(exception); }
    finally { setExporting(false); }
  }
  function displaySlide(index) {
    setSelected(index); setFollow(false);
    if (audioData) seek(Number(slides[index]?.start || 0));
  }
  const dragStyle = drag ? {
    left: (Math.min(drag.origin.x, drag.end.x) * 100) + "%",
    top: (Math.min(drag.origin.y, drag.end.y) * 100) + "%",
    width: (Math.abs(drag.origin.x - drag.end.x) * 100) + "%",
    height: (Math.abs(drag.origin.y - drag.end.y) * 100) + "%",
  } : null;
  return <div className="lvs-page">
    <header className="lvs-header">
      <div>
        <p className="lvs-kicker">FALOWEN CREATOR STUDIO</p>
        <h1>Lesson Video Studio</h1>
        <p>PowerPoint + narration + live highlight markers → ready-to-share teaching video.</p>
      </div>
      <div className="lvs-header-actions">
        <label className="lvs-button lvs-muted">Open saved project
          <input type="file" accept=".json,application/json" hidden onChange={loadProject} disabled={loading || exporting} />
        </label>
        <button type="button" onClick={saveProject} disabled={loading || exporting || !slides.length}>Save editable project</button>
      </div>
    </header>

    {error ? <div className="lvs-alert" role="alert">{error}</div> : null}
    <div className="lvs-status" role="status">{loading ? "Processing your files locally…" : status}</div>

    <section className="lvs-steps" aria-label="Set up your lesson">
      <div className="lvs-panel">
        <span className="lvs-step">01 · Slides</span><h2>Import presentation</h2>
        <label className="lvs-button lvs-primary">Choose PowerPoint (.pptx)
          <input type="file" accept=".pptx" hidden onChange={importPresentation} disabled={loading || exporting} />
        </label>
        <label className="lvs-button lvs-muted">Or import PNG/JPG slides
          <input type="file" accept="image/png,image/jpeg,image/webp" multiple hidden onChange={importImages} disabled={loading || exporting} />
        </label>
        <p className="lvs-help">Image-only slides preserve their appearance. For complex charts or animations, export slide PNGs from PowerPoint first.</p>
        <strong>{slides.length} slides ready</strong>
      </div>
      <div className="lvs-panel">
        <span className="lvs-step">02 · Script</span><h2>Prepare teaching narration</h2>
        <button type="button" onClick={scriptOutline} disabled={!slides.length || exporting}>Create free script outline</button>
        <label className="lvs-button lvs-muted">Import your script (.txt)
          <input type="file" accept=".txt,text/plain" hidden onChange={loadTranscript} />
        </label>
        <button type="button" onClick={downloadScript} disabled={!slides.length && !fullScript}>Download script</button>
        <p className="lvs-help">Edit the script below. PowerPoint image slides require manual narration text; no AI credit is used.</p>
      </div>
      <div className="lvs-panel">
        <span className="lvs-step">03 · Voice</span><h2>Attach real narration</h2>
        <label className="lvs-button lvs-primary">Upload MP3, WAV or M4A
          <input type="file" accept="audio/*,.mp3,.wav,.m4a,.webm" hidden
            onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; attachAudio(file); }} disabled={loading || exporting} />
        </label>
        <button type="button" onClick={recordMicrophone} disabled={exporting} className={recording ? "lvs-recording" : ""}>
          {recording ? "■ Stop recording" : "● Record my own voice"}
        </button>
        <p className="lvs-help">{audioName || "Your narration is recorded or uploaded locally. No third-party voice subscription is required."}</p>
      </div>
    </section>

    <div className="lvs-titlefield"><label>Project title
      <input value={title} maxLength={100} onChange={event => setTitle(event.target.value)} />
    </label></div>
    <section className="lvs-editor">
      <div className="lvs-panel lvs-main">
        <div className="lvs-panel-heading">
          <h2>Slide preview & highlights</h2>
          <span>{slides.length ? "Slide " + (selected + 1) + " / " + slides.length : "No slides yet"}</span>
        </div>
        <div className="lvs-preview">
          {current ? <div className="lvs-image-wrap" ref={imageRef}>
            <img src={current.image} alt={"Slide " + (selected + 1)} draggable="false" />
            <div className="lvs-hitarea" role="group" aria-label="Drag here to add a timed highlight"
              onPointerDown={pointerDown} onPointerMove={pointerMove}
              onPointerUp={pointerUp} onPointerCancel={() => setDrag(null)} />
            {visibleHighlights.map(h => <div key={h.id} className="lvs-highlight"
              style={{ left: (h.x * 100) + "%", top: (h.y * 100) + "%",
                width: (h.w * 100) + "%", height: (h.h * 100) + "%" }} />)}
            {dragStyle && <div className="lvs-highlight lvs-drawing" style={dragStyle} />}
          </div> : <div className="lvs-empty">Upload your PowerPoint or slide images to begin.</div>}
        </div>
        <p className="lvs-help">While narration is playing, drag a rectangle over the text or diagram to highlight it. A timed marker is created automatically.</p>

        <audio ref={audioRef} src={audioData || undefined} controls className="lvs-audio"
          onLoadedMetadata={event => {
            const seconds = event.currentTarget.duration;
            if (Number.isFinite(seconds)) {
              setDuration(seconds);
              setSlides(previous => previous.length && previous.every(s => !s.start)
                ? spreadLessonSlides(previous, seconds) : previous);
            }
          }}
          onTimeUpdate={event => {
            const nextTime = event.currentTarget.currentTime;
            setTime(nextTime);
            if (follow) setSelected(activeLessonSlide(slides, nextTime));
          }}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
        />
        <div className="lvs-tools">
          <button type="button" onClick={() => audioRef.current?.paused ? audioRef.current?.play().catch(failure) : audioRef.current?.pause()} disabled={!audioData}>
            {playing ? "Pause" : "Play narration"}
          </button>
          <button type="button" onClick={() => markSlide(selected, time)} disabled={!slides.length || !audioData}>Mark slide here</button>
          <button type="button" onClick={() => setSlides(previous => spreadLessonSlides(previous, duration))}
            disabled={!slides.length || !duration}>Space slide times evenly</button>
          <label className="lvs-follow"><input type="checkbox" checked={follow} onChange={event => setFollow(event.target.checked)} />
            Follow narration
          </label>
        </div>
        <div className="lvs-progress"><span>{timeLabel(time)} / {timeLabel(duration)}</span>
          <input aria-label="Seek narration" type="range" min="0" max={duration || 1} step="0.1"
            value={time} onChange={event => seek(Number(event.target.value))} disabled={!audioData} />
        </div>
        <div className="lvs-thumbnails">
          {slides.map((slide, index) => <button type="button" key={slide.id || index}
            className={index === selected ? "lvs-thumb lvs-current" : "lvs-thumb"}
            onClick={() => displaySlide(index)}>
            <img src={slide.image} alt="" loading="lazy" />
            <span>#{index + 1} · {timeLabel(slide.start)}</span>
          </button>)}
        </div>
      </div>

      <aside className="lvs-side">
        <div className="lvs-panel">
          <h2>Timing markers</h2>
          <p className="lvs-help">Click a slide, play the audio to the exact moment, then click Mark slide here.</p>
          {current ? <>
            <NumberInput label={"Slide " + (selected + 1) + " starts (seconds)"}
              value={current.start} onChange={seconds => markSlide(selected, seconds)}
              min={0} max={duration || undefined} />
            <div className="lvs-hmark"><h3>Highlights on this slide</h3>
              {highlights.filter(h => h.slide === selected).length ? highlights.filter(h => h.slide === selected).map(h =>
                <div className="lvs-marker" key={h.id}>
                  <input aria-label="Highlight name" value={h.label} onChange={e => editHighlight(h.id, { label: e.target.value })} />
                  <div className="lvs-marker-grid">
                    <NumberInput label="Start (s)" value={h.start}
                      onChange={value => editHighlight(h.id, { start: rounded(Math.max(0, value)) })} />
                    <NumberInput label="End (s)" value={h.end}
                      onChange={value => editHighlight(h.id, { end: rounded(Math.max(h.start + 0.1, value)) })} />
                  </div>
                  <div className="lvs-marker-actions">
                    <button type="button" onClick={() => editHighlight(h.id, { end: rounded(Math.max(h.start + 0.1, time)) })}>
                      Set end at playhead
                    </button>
                    <button type="button" onClick={() => { setHighlights(previous => previous.filter(item => item.id !== h.id)); }}>
                      Delete
                    </button>
                  </div>
                </div>) : <p className="lvs-help">No highlights yet. Drag over the slide while listening.</p>}
            </div>
          </> : <p className="lvs-help">Add a presentation to start marking.</p>}
        </div>
        <div className="lvs-panel">
          <h2>Script editor</h2>
          <label className="lvs-script-label">Narration for selected slide
            <textarea rows={7} placeholder="Write what the teacher should explain on this slide…"
              value={current?.script || ""} disabled={!current}
              onChange={event => updateSlide(selected, { script: event.target.value })} />
          </label>
          <button type="button" onClick={speakPreview} disabled={!current?.script && !fullScript}>Preview browser voice</button>
          <p className="lvs-help">Voice preview is optional; export uses your actual attached audio, not the browser's synthesized voice.</p>
          <label className="lvs-script-label">Full narration transcript
            <textarea rows={7} placeholder="Paste your full lesson transcript here, including German example sentences…"
              value={fullScript} onChange={event => setFullScript(event.target.value)} />
          </label>
        </div>
      </aside>
    </section>
    <section className="lvs-panel lvs-export">
      <div><span className="lvs-step">04 · Export</span><h2>Export lesson video</h2>
        <p>Video recording happens locally in your browser, with your narration and slide highlights synchronized. Keep the tab open and active during recording.</p>
      </div>
      <div className="lvs-export-settings">
        <label>Format
          <select value={aspect} onChange={event => setAspect(event.target.value)}>
            <option value="landscape">YouTube / lesson · 16:9</option>
            <option value="tiktok">TikTok / Reels · 9:16</option>
          </select>
        </label>
        <label>Quality
          <select value={quality} onChange={event => setQuality(event.target.value)}>
            <option value="standard">HD · faster</option>
            <option value="full">Full HD</option>
          </select>
        </label>
        <button type="button" className="lvs-primary" onClick={exportVideo}
          disabled={exporting || loading || !slides.length || !audioData}>
          {exporting ? "Recording video… " + Math.round(exportProgress * 100) + "%" : "Export video with narration"}
        </button>
        <p className="lvs-help">MP4 with AAC where supported; otherwise a genuine WebM file. No mislabeled exports and no paid video service.</p>
      </div>
    </section>
  </div>;
}
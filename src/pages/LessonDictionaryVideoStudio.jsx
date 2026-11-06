import { useEffect, useMemo, useRef, useState } from "react";
import LessonTextToSpeech from "../components/LessonTextToSpeech.jsx";
import { activeLessonSlide, downloadLessonBlob, recordLessonVideo, safeLessonFilename, timeLabel } from "../utils/lessonVideoStudio.js";
import {
  STARTER_DICTIONARIES, DICTIONARY_SCHEMA_VERSION, currentDictionaryQuarter,
  dictionaryStoryboard, renderDictionarySlide, validateDictionaries,
} from "../utils/lessonDictionaryStudio.js";
import "./LessonDictionaryVideoStudio.css";

const PACKS_STORAGE = "falowen.lesson-video-dictionaries.v1";
const SCRIPTS_STORAGE = "falowen.lesson-video-dictionary-scripts.v1";
const AUDIO_LIMIT = 80 * 1024 * 1024;
const editingFields = [
  ["title", "Lesson title"], ["goal", "Learning goal"], ["intro", "Introduction / hook"],
  ["vocabulary", "Vocabulary (one per line; German — English)"],
  ["grammar", "Grammar explanations (one point per line)"],
  ["examples", "Examples (German | English, one per line)"],
  ["mistakes", "Common mistakes (incorrect | correct | reason)"],
  ["practice", "Practice activity"], ["recap", "Key takeaway"],
];
function initialPacks() {
  try {
    const saved = window.localStorage.getItem(PACKS_STORAGE);
    if (saved) return validateDictionaries(JSON.parse(saved));
  } catch { /* Invalid or unavailable browser storage: use source curriculum. */ }
  return STARTER_DICTIONARIES.map(item => ({ ...item }));
}
function initialScripts() {
  try {
    const value = JSON.parse(window.localStorage.getItem(SCRIPTS_STORAGE) || "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch { return {}; }
}
function blobToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Cannot read the audio file."));
    reader.readAsDataURL(file);
  });
}
function downloadText(name, contents, type) {
  downloadLessonBlob(new Blob([contents], { type }), name);
}
export default function LessonDictionaryVideoStudio() {
  const [packs, setPacks] = useState(initialPacks);
  const [scripts, setScripts] = useState(initialScripts);
  const [packId, setPackId] = useState("a1-greetings");
  const [search, setSearch] = useState("");
  const [aspect, setAspect] = useState("landscape");
  const [quality, setQuality] = useState("standard");
  const [theme, setTheme] = useState("night");
  const [selected, setSelected] = useState(0);
  const [slides, setSlides] = useState([]);
  const [starts, setStarts] = useState({});
  const [audioData, setAudioData] = useState("");
  const [audioName, setAudioName] = useState("");
  const [duration, setDuration] = useState(0);
  const [playhead, setPlayhead] = useState(0);
  const [follow, setFollow] = useState(true);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [notice, setNotice] = useState("Choose a dictionary, edit its teaching notes, then generate the slides and narration.");
  const [error, setError] = useState("");
  const audioRef = useRef(null);
  const pack = packs.find(item => item.id === packId) || packs[0];
  const activeScripts = scripts[pack?.id] || {};
  const storyboard = useMemo(() => dictionaryStoryboard(pack, activeScripts), [pack, activeScripts]);
  const filtered = useMemo(() => packs.filter(item => (item.title + " " + item.level).toLowerCase().includes(search.toLowerCase())), [packs, search]);
  const current = slides[selected];
  useEffect(() => {
    try { window.localStorage.setItem(PACKS_STORAGE, JSON.stringify(packs)); }
    catch { /* Export JSON works when browser storage is unavailable. */ }
  }, [packs]);
  useEffect(() => {
    try { window.localStorage.setItem(SCRIPTS_STORAGE, JSON.stringify(scripts)); }
    catch { /* Explicit export remains available. */ }
  }, [scripts]);
  useEffect(() => {
    try {
      setSlides(storyboard.map(slide => ({
        ...slide,
        image: renderDictionarySlide(slide, { aspect, theme, level: pack?.level, quarter: pack?.quarter }),
        start: Number(starts[slide.kind] || 0),
      })));
    } catch (exception) { setError(exception.message); }
  }, [storyboard, aspect, theme, pack?.level, pack?.quarter, starts]);
  useEffect(() => { setSelected(0); setAudioData(""); setAudioName(""); setStarts({}); setDuration(0); setPlayhead(0); }, [packId]);
  function updateField(key, value) {
    setPacks(prev => prev.map(item => item.id === pack.id ? { ...item, [key]: value } : item));
    clearNarration();
  }
  function clearNarration() {
    audioRef.current?.pause();
    setAudioData(""); setAudioName(""); setStarts({}); setDuration(0); setPlayhead(0);
  }
  function updateScript(value) {
    setScripts(prev => ({ ...prev, [pack.id]: { ...(prev[pack.id] || {}), [storyboard[selected].kind]: value } }));
    clearNarration();
  }
  function restoreScript() {
    setScripts(prev => {
      const next = { ...(prev[pack.id] || {}) };
      delete next[storyboard[selected].kind];
      return { ...prev, [pack.id]: next };
    });
    clearNarration();
  }
  function switchPack(id) {
    if (id === pack.id || busy || exporting) return;
    setPackId(id);
    setError("");
  }
  function downloadLibrary() {
    downloadText("falowen-lesson-dictionaries-" + currentDictionaryQuarter() + ".json",
      JSON.stringify({ type: "falowen-lesson-dictionaries", version: DICTIONARY_SCHEMA_VERSION, dictionaries: packs, scripts }, null, 2),
      "application/json;charset=utf-8");
    setNotice("Dictionary backup downloaded. It includes your revised content and narration scripts.");
  }
  async function importLibrary(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      if (file.size > 1024 * 1024) throw new Error("Dictionary backups must be smaller than 1 MB.");
      const parsed = JSON.parse(await file.text());
      if (parsed.type !== "falowen-lesson-dictionaries" || parsed.version !== DICTIONARY_SCHEMA_VERSION)
        throw new Error("This is not a compatible Falowen lesson dictionary backup.");
      const clean = validateDictionaries(parsed);
      const scriptMap = parsed.scripts && typeof parsed.scripts === "object" && !Array.isArray(parsed.scripts) ? parsed.scripts : {};
      for (const [id, overrides] of Object.entries(scriptMap)) {
        if (!clean.some(item => item.id === id) || !overrides || typeof overrides !== "object" || Array.isArray(overrides))
          throw new Error("A saved narration script is invalid.");
        for (const [section, content] of Object.entries(overrides)) {
          if (!["intro", "vocabulary", "grammar", "examples", "mistakes", "practice"].includes(section)
            || typeof content !== "string" || content.length > 12000)
            throw new Error("A saved narration script is invalid.");
        }
      }
      setPacks(clean); setScripts(scriptMap); setPackId(clean[0].id); setSelected(0); clearNarration();
      setNotice("The dictionary library and editable scripts were restored.");
      setError("");
    } catch (exception) { setError(exception.message); }
  }
  function markReviewed() {
    updateField("quarter", currentDictionaryQuarter());
    setNotice(pack.title + " marked reviewed for " + currentDictionaryQuarter() + ".");
  }
  function downloadScript() {
    const content = storyboard.map((slide, index) =>
      "SLIDE " + (index + 1) + " — " + slide.heading + "\n" + slide.script).join("\n\n");
    downloadText(safeLessonFilename(pack.title) + "-script.txt", content, "text/plain;charset=utf-8");
  }
  async function acceptNarration({ wav, timing, source }) {
    if (!(wav instanceof Blob) || wav.size > AUDIO_LIMIT) throw new Error("Narration is too large.");
    setAudioData(await blobToDataUrl(wav));
    setAudioName("Generated narration.wav");
    if (source === "slides") {
      const next = {};
      storyboard.forEach((slide, index) => { next[slide.kind] = timing.starts.get(index) ?? 0; });
      setStarts(next);
    }
    setFollow(true); setSelected(0); setError("");
    setNotice("Generated narration was automatically inserted. The six slide changes use the actual audio timings.");
  }
  async function attachAudio(file) {
    if (!file) return;
    try {
      if (file.size > AUDIO_LIMIT || !/^audio\//.test(file.type)) throw new Error("Choose an audio file smaller than 80 MB.");
      setAudioData(await blobToDataUrl(file)); setAudioName(file.name); setStarts({}); setPlayhead(0); setDuration(0);
      setNotice("External audio attached. Slide timings need checking before export.");
      setError("");
    } catch (exception) { setError(exception.message); }
  }
  async function exportVideo() {
    if (!audioData || !slides.length) { setError("Generate or attach narration before exporting."); return; }
    setExporting(true); setProgress(0); setError("");
    try {
      audioRef.current?.pause();
      const result = await recordLessonVideo({ slides, highlights: [], audioData, aspect, quality, onProgress: setProgress });
      downloadLessonBlob(result.blob, safeLessonFilename(pack.title) + "." + result.extension);
      setNotice("Export complete: " + result.dims.width + " × " + result.dims.height + ", " + timeLabel(result.duration) + ".");
    } catch (exception) { setError(exception?.message || "Video export failed."); }
    finally { setExporting(false); }
  }
  function setSelectedSlide(index) {
    setSelected(index); setFollow(false);
    if (audioRef.current && audioData) audioRef.current.currentTime = Number(slides[index]?.start || 0);
  }
  return <div className="ldvs">
    <div className="ldvs-heading">
      <div><span className="ldvs-eyebrow">FALOWEN / CURRICULUM CREATOR</span>
        <h2>Dictionary → lesson video</h2>
        <p>Quarterly teaching libraries that become scripted, narrated slides. No PowerPoint required.</p>
      </div>
      <div className="ldvs-actions">
        <button type="button" onClick={downloadLibrary}>Export library JSON</button>
        <label className="ldvs-file">Import library JSON<input type="file" hidden accept=".json,application/json" onChange={importLibrary} disabled={busy || exporting} /></label>
      </div>
    </div>
    {error && <p role="alert" className="ldvs-error">{error}</p>}
    {notice && <p role="status" className="ldvs-notice">{notice}</p>}
    <div className="ldvs-layout">
      <aside className="ldvs-panel ldvs-library">
        <div className="ldvs-panel-header"><h3>Lesson dictionaries</h3><strong>{packs.length}</strong></div>
        <input type="search" placeholder="Search by title or level" aria-label="Search lesson dictionaries" value={search} onChange={event => setSearch(event.target.value)} />
        <div className="ldvs-packlist">
          {filtered.map(item => <button type="button" key={item.id} className={pack.id === item.id ? "ldvs-pack ldvs-selected" : "ldvs-pack"} onClick={() => switchPack(item.id)}>
            <span className="ldvs-level">{item.level}</span><span>{item.title}<small>Reviewed {item.quarter}</small></span>
          </button>)}
          {!filtered.length && <p>No matching dictionaries.</p>}
        </div>
        <p className="ldvs-hint">Starter collection: 10 editable German lessons, A1–C1. Updates are saved in this browser; export the JSON as your quarterly master backup.</p>
      </aside>
      <section className="ldvs-panel ldvs-content">
        <div className="ldvs-panel-header"><div><span className="ldvs-eyebrow">{pack.level} · TEACHING CONTENT</span><h3>{pack.title}</h3></div>
          <button type="button" disabled={busy || exporting} onClick={markReviewed}>Mark reviewed · {currentDictionaryQuarter()}</button>
        </div>
        <div className="ldvs-fields">
          {editingFields.map(([key, label]) => <label key={key}>{label}
            {["title", "goal", "intro", "practice", "recap"].includes(key)
              ? <input value={pack[key]} maxLength={key === "title" ? 100 : 1000} disabled={busy || exporting} onChange={e => updateField(key, e.target.value)} />
              : <textarea rows={key === "grammar" || key === "mistakes" ? 4 : 3} maxLength={12000} value={pack[key]} disabled={busy || exporting} onChange={e => updateField(key, e.target.value)} />}
          </label>)}
        </div>
        <p className="ldvs-hint">All slide layouts and draft narration update from these fields automatically. Review German accuracy before generating paid audio.</p>
      </section>
      <section className="ldvs-panel ldvs-producer">
        <div className="ldvs-panel-header"><div><span className="ldvs-eyebrow">AUTO STORYBOARD</span><h3>Slides & narration</h3></div><strong>{slides.length} slides</strong></div>
        <div className="ldvs-controls">
          <label>Video ratio<select value={aspect} disabled={exporting} onChange={e => setAspect(e.target.value)}>
            <option value="landscape">YouTube · 16:9</option><option value="tiktok">TikTok / Reels · 9:16</option>
          </select></label>
          <label>Slide theme<select value={theme} disabled={exporting} onChange={e => setTheme(e.target.value)}>
            <option value="night">Midnight blue</option><option value="paper">Light classroom</option><option value="forest">Forest green</option>
          </select></label>
          <label>Quality<select value={quality} disabled={exporting} onChange={e => setQuality(e.target.value)}>
            <option value="standard">HD</option><option value="full">Full HD</option>
          </select></label>
        </div>
        <div className="ldvs-preview">{current ? <img src={current.image} alt={"Slide " + (selected + 1) + ": " + current.heading} /> : <p>Preparing slides…</p>}</div>
        <div className="ldvs-filmstrip">{slides.map((slide, index) => <button type="button" key={slide.id} className={index === selected ? "ldvs-shot is-active" : "ldvs-shot"} onClick={() => setSelectedSlide(index)}>
          <img src={slide.image} alt="" /><span>{index + 1}. {slide.heading}</span></button>)}</div>
        <label className="ldvs-script">Editable narrator script for slide {selected + 1}
          <textarea rows={5} disabled={busy || exporting || !storyboard[selected]} value={storyboard[selected]?.script || ""} onChange={e => updateScript(e.target.value)} />
        </label>
        <div className="ldvs-actions"><button type="button" onClick={restoreScript} disabled={busy || exporting || !Object.prototype.hasOwnProperty.call(activeScripts, storyboard[selected]?.kind || "")}>Restore suggested script</button>
          <button type="button" onClick={downloadScript}>Download full script</button></div>
        <div className="ldvs-voice">
          <LessonTextToSpeech slides={slides} fullScript="" title={pack.title} disabled={exporting || !slides.length}
            onBusyChange={setBusy} onGenerated={acceptNarration} />
        </div>
        <div className="ldvs-audio">
          <h3>Voice attached to video</h3>
          <audio ref={audioRef} controls src={audioData || undefined}
            onLoadedMetadata={e => { const seconds = e.currentTarget.duration; if (Number.isFinite(seconds)) setDuration(seconds); }}
            onTimeUpdate={e => { const t = e.currentTarget.currentTime; setPlayhead(t); if (follow) setSelected(activeLessonSlide(slides, t)); }} />
          <p className="ldvs-hint">{audioName || "Generate speech above to attach and align it automatically."} {audioData ? "· " + timeLabel(playhead) + " / " + timeLabel(duration) : ""}</p>
          <label className="ldvs-checkbox"><input type="checkbox" checked={follow} onChange={e => setFollow(e.target.checked)} /> Follow audio during preview</label>
          <label className="ldvs-file">Or attach existing MP3 / WAV<input type="file" hidden accept="audio/*" disabled={busy || exporting} onChange={e => { const f = e.target.files?.[0]; e.target.value = ""; attachAudio(f); }} /></label>
          {audioData && Object.keys(starts).length === 0 && <p className="ldvs-warning">External audio does not include verified per-slide timings. Use generated per-slide narration for accurate automatic video synchronization.</p>}
        </div>
        <button type="button" className="ldvs-export" onClick={exportVideo} disabled={!audioData || !slides.length || busy || exporting}>
          {exporting ? "Rendering in this browser · " + Math.round(progress * 100) + "%" : "Export narrated lesson video"}
        </button>
        <p className="ldvs-hint">Slides and video are rendered in your browser. Only deliberate speech-generation requests use the existing Hören Studio allowance; video export uses no extra rendering service. Keep this tab active during real-time export.</p>
      </section>
    </div>
  </div>;
}

import { useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "../context/ToastContext";
import { makeGrammarScript, makeSpeechClip, getStudioStatus } from "../services/hoerenStudioService";
import { assembleListeningExam, base64WavToBytes } from "../utils/hoerenAudio";
import { encodeWavAsMp3 } from "../utils/hoerenMp3";
import { getSavedVoice, saveVoice } from "../utils/hoerenVoiceCache";
import { parseGrammarAudioScript, planGrammarAudio, grammarAudioCacheKey, grammarAssemblyPlan, optimizeGrammarAudioScript } from "../utils/grammarAudio";
import { getSlidesByCourse } from "../data/teachingSlides";
import { lessonGrammarAudioScript } from "../utils/lessonGrammarAudioScript";

const SAMPLE = [
  "DE: Hallo und herzlich willkommen bei Falowen!",
  "EN: Today we will learn how to use je and desto in German.",
  "DE: Je mehr ich Deutsch übe, desto besser spreche ich.",
  "EN: The more I practise German, the better I speak it.",
  "EN: In the je clause, the conjugated verb goes to the end.",
  "DE: Je mehr ich Deutsch übe,",
  "EN: In the desto clause, the comparative expression comes first, then the conjugated verb.",
  "DE: desto besser spreche ich.",
  "[PAUSE 2]",
  "EN: Now it's your turn. Complete this sentence.",
  "DE: Je früher ich lerne, desto ...",
  "[PAUSE 3]",
  "DE: Je früher ich lerne, desto mehr Zeit habe ich später.",
  "EN: Write your own example in the comments."
].join("\n");

function download(data, filename, mimeType) {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function safeName(topic, level) {
  const slug = topic.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 55) || "grammar";
  return "Falowen-" + level + "-Grammar-" + slug;
}

export default function GrammarAudioStudio({ ready, status, onStatusChange, onBusyChange }) {
  const toast = useToast();
  const [topic, setTopic] = useState("je … desto");
  const [lessonChoice, setLessonChoice] = useState("");
  const lessons = useMemo(() => ["A1", "A2", "B1", "B2", "C1", "C2"].flatMap(getSlidesByCourse), []);
  const [level, setLevel] = useState("B1");
  const [languageMode, setLanguageMode] = useState("bilingual");
  const [engine, setEngine] = useState("lite");
  const [script, setScript] = useState(SAMPLE);
  const [lineGap, setLineGap] = useState(0.45);
  const [busy, setBusy] = useState("");
  const [progress, setProgress] = useState("");
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState("");
  const voiceCache = useRef(new Map());
  const [cacheLoaded, setCacheLoaded] = useState(false);
  const [, updateCacheRevision] = useState(0);
  const [generationConfirmed, setGenerationConfirmed] = useState(false);
  const scriptError = useMemo(() => {
    try {
      const parsed = parseGrammarAudioScript(script);
      return { parsed, plan: planGrammarAudio(parsed), error: "" };
    } catch (error) {
      return { parsed: [], plan: [], error: error.message };
    }
  }, [script]);
  const plan = scriptError.plan;
  const scenes = useMemo(() => plan.filter(part => part.type === "speech"), [plan]);
  const cacheKey = scene => grammarAudioCacheKey(engine, scene);
  const sceneKeys = scenes.map(cacheKey);
  const missingKeys = [...new Set(sceneKeys)].filter(key => !voiceCache.current.has(key));
  const remaining = Number(status?.remaining?.speech ?? 0);

  useEffect(() => {
    let active = true;
    setCacheLoaded(false);
    Promise.all(scenes.map(async scene => {
      const key = grammarAudioCacheKey(engine, scene);
      if (voiceCache.current.has(key)) return;
      const saved = await getSavedVoice(key);
      if (saved && active) voiceCache.current.set(key, saved);
    })).then(() => { if (active) { setCacheLoaded(true); updateCacheRevision(x => x + 1); } });
    return () => { active = false; };
  }, [engine, scenes]);

  useEffect(() => onBusyChange(Boolean(busy)), [busy, onBusyChange]);
  useEffect(() => () => { if (audioUrl) URL.revokeObjectURL(audioUrl); }, [audioUrl]);

  const invalidate = () => {
    setAudioBlob(null);
    setAudioUrl("");
    setProgress("");
    setGenerationConfirmed(false);
  };

  const refreshBudget = async () => {
    try {
      const next = await getStudioStatus();
      onStatusChange(next);
    } catch {
      // The main studio displays provider or account status.
    }
  };

  function loadLessonDraft() {
    if (!lessonChoice || busy) return;
    const selected = lessonChoice === "a1-day-2-complete"
      ? lessons.filter(item => item.course === "A1" && item.day === "Day 2")
      : lessons.filter(item => item.id === lessonChoice);
    if (!selected.length) return;
    try {
      const draft = lessonGrammarAudioScript(selected);
      const planned = planGrammarAudio(parseGrammarAudioScript(draft));
      const count = planned.filter(item => item.type === "speech").length;
      if (count > 36) throw new Error("Lesson draft is too long.");
      setScript(draft);
      setTopic(lessonChoice === "a1-day-2-complete" ? "A1 Day 2 · Full grammar lesson" : selected[0].topic);
      setLevel(selected[0].course);
      setLanguageMode("bilingual");
      invalidate();
      toast.success("Lesson-based script ready · " + count + " voice scenes. Review the German pronunciation before generation.");
    } catch (error) { toast.error(error.message); }
  }

  function optimizeCurrentScript() {
    if (busy || scriptError.error) return;
    try {
      const result = optimizeGrammarAudioScript(script);
      if (!result.saved) {
        toast.success("The narration is already batched as tightly as the language and scene limits allow. No content changed.");
        return;
      }
      if (!window.confirm("Remove " + result.removed.length + " redundant listening cue(s)? Voice scenes: " + result.before + " → " + result.after + ". The German examples and grammar rules stay unchanged.")) return;
      setScript(result.script);
      invalidate();
      toast.success("Reduced from " + result.before + " to " + result.after + " scenes without changing lesson examples.");
    } catch (error) { toast.error(error.message); }
  }

  async function generateScript() {
    if (!topic.trim() || !ready || busy) return;
    if (!window.confirm("Generate a new draft? This will replace the text in the grammar script editor and use one of today's script requests.")) return;
    setBusy("script");
    setProgress("Preparing a grammar explanation and German examples…");
    try {
      const result = await makeGrammarScript({ topic, level, languageMode });
      parseGrammarAudioScript(result.script);
      setScript(result.script);
      invalidate();
      onStatusChange(previous => previous && ({ ...previous, remaining: { ...previous.remaining, script: result.remaining } }));
      toast.success("Draft ready. Edit and check every example before generating the audio.");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy("");
      await refreshBudget();
    }
  }

  async function assemble() {
    const clips = scenes.map(scene => voiceCache.current.get(cacheKey(scene)));
    if (clips.some(clip => !clip)) throw new Error("Some scenes have changed. Generate their voice clips first.");
    const blob = assembleListeningExam(grammarAssemblyPlan(plan), clips,
      { repeats: 1, lineGap, soundscape: { scene: "none" } });
    setAudioBlob(blob);
    setAudioUrl(URL.createObjectURL(blob));
    return blob;
  }

  async function generateAudio() {
    if (!cacheLoaded || !ready || busy || scriptError.error) return;
    if (missingKeys.length > remaining) {
      toast.error("This lesson needs " + missingKeys.length + " new voice calls but only " + remaining + " remain today.");
      return;
    }
    if (!generationConfirmed && missingKeys.length) {
      toast.error("Please check the script and confirm that it is ready to narrate.");
      return;
    }
    setBusy("audio");
    invalidate();
    try {
      let newClips = 0;
      for (const [index, scene] of scenes.entries()) {
        const key = cacheKey(scene);
        if (voiceCache.current.has(key)) continue;
        setProgress("Generating scene " + (index + 1) + " of " + scenes.length + " (" + (scene.language === "de-DE" ? "German" : "English") + ")…");
        const result = await makeSpeechClip({
          turns: scene.turns, engine, style: "grammar", language: scene.language
        });
        const bytes = base64WavToBytes(result.audioBase64);
        voiceCache.current.set(key, bytes);
        const saved = await saveVoice(key, bytes);
        if (!saved) setProgress("Your browser could not save the clips. Download the audio before leaving.");
        updateCacheRevision(x => x + 1);
        newClips += 1;
        onStatusChange(previous => previous && ({ ...previous, remaining: { ...previous.remaining, speech: result.remaining } }));
      }
      setProgress("Combining narration and pauses locally…");
      await assemble();
      toast.success("Grammar narration ready. " + newClips + " new voice calls; " + (scenes.length - newClips) + " cached scenes reused.");
    } catch (error) {
      toast.error(error.message + " Successfully generated scenes remain cached.");
    } finally {
      setBusy("");
      setProgress("");
      await refreshBudget();
    }
  }

  async function exportMp3() {
    if (!audioBlob) return;
    setBusy("mp3");
    try {
      const mp3 = await encodeWavAsMp3(audioBlob);
      download(mp3, safeName(topic, level) + ".mp3", "audio/mpeg");
    } catch (error) {
      toast.error(error.message);
    } finally { setBusy(""); }
  }

  return (
    <div className="hoeren-columns" aria-label="Grammar Audio Generator">
      <section className="hoeren-panel">
        <h2>1. Write your grammar lesson</h2>
        <p className="hoeren-hint">Create narrated lessons for YouTube, course grammar pages or classroom slides. English explanations and natural German examples use the same existing Falowen Gemini infrastructure.</p>
        <div className="hoeren-exam-schema">
          <strong>Use an existing Falowen lesson</strong>
          <p>Build a short script directly from the authored teaching curriculum, without using a paid script request. One welcome and one goodbye per complete lesson.</p>
          <label>Choose a course lesson
            <select value={lessonChoice} disabled={!!busy} onChange={e => setLessonChoice(e.target.value)}>
              <option value="">Select a lesson</option>
              <option value="a1-day-2-complete">A1 Day 2 · Alphabet, pronouns and verbs (complete)</option>
              {lessons.map(item => <option key={item.id} value={item.id}>{item.course} · {item.day} · {item.topic || item.title}</option>)}
            </select>
          </label>
          <button type="button" className="hoeren-quiet" disabled={!lessonChoice || !!busy} onClick={loadLessonDraft}>
            Build short lesson audio script · free
          </button>
        </div>
        <div className="hoeren-input-grid">
          <label>Grammar topic
            <input maxLength={160} value={topic} disabled={!!busy} onChange={e => setTopic(e.target.value)} placeholder="e.g. je … desto, Konjunktiv II" />
          </label>
          <label>CEFR level
            <select value={level} disabled={!!busy} onChange={e => { setLevel(e.target.value); invalidate(); }}>
              {["A1", "A2", "B1", "B2", "C1", "C2"].map(item => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label>Narration language
            <select value={languageMode} disabled={!!busy} onChange={e => { setLanguageMode(e.target.value); invalidate(); }}>
              <option value="bilingual">English explanation + German examples</option>
              <option value="german">German only</option>
            </select>
          </label>
          <label>Speech model
            <select value={engine} disabled={!!busy} onChange={e => { setEngine(e.target.value); invalidate(); }}>
              <option value="lite">Gemini Flash-Lite · lower cost</option>
              <option value="flash">Gemini Flash · expressive</option>
            </select>
          </label>
        </div>
        <button type="button" className="hoeren-quiet" onClick={generateScript}
          disabled={!ready || !!busy || topic.trim().length < 4 || !status?.remaining?.script}>
          {busy === "script" ? "Writing grammar lesson…" : "Generate grammar script · 1 script request"}
        </button>
        <label>Editable narration script
          <textarea value={script} rows={16} disabled={!!busy} spellCheck onChange={e => { setScript(e.target.value); invalidate(); }}
            placeholder={"EN: Today we're learning German grammar.\nDE: Je mehr ich lerne, desto besser spreche ich.\n[PAUSE 2]"} />
        </label>
        <p className="hoeren-hint"><strong>Language markers are not spoken.</strong> Start each spoken line with <code>EN:</code> for natural English or <code>DE:</code> for German. Put <code>[PAUSE 2]</code> on a separate line for two seconds of silence. Long sentences are split without removing words.</p>
        <div className="hoeren-exam-schema">
          <strong>Grammar quality review</strong>
          <p>Keep words visibly separate: <strong>je mehr</strong> and <strong>desto besser</strong>, never combined. Review conjugated-verb placement, grammar explanations and translations before generating.</p>
          {scriptError.error ? <p className="hoeren-validation" role="alert">{scriptError.error}</p> :
            <p>{scriptError.parsed.filter(line => line.type === "speech").length} spoken segments · {scenes.length} voice scenes · {scriptError.parsed.filter(line => line.type === "pause").length} timed pauses</p>}
        </div>
        <button type="button" className="hoeren-quiet" disabled={!!busy} onClick={() => {
          if (script.trim() && !window.confirm("Replace the current text with the free je … desto example?")) return;
          setScript(SAMPLE); setTopic("je … desto"); setLevel("B1"); setLanguageMode("bilingual"); invalidate();
        }}>Load sample: je … desto · free</button>
      </section>
      <section className="hoeren-panel">
        <h2>2. Generate &amp; download audio</h2>
        <div className="hoeren-exam-schema">
          <strong>Cost preview</strong>
          <p>{cacheLoaded ? (scenes.length - missingKeys.length) + " of " + scenes.length + " scenes already saved on this device" : "Checking saved voice scenes…"}</p>
          <p><strong>{cacheLoaded ? missingKeys.length : "—"} new Gemini speech call(s)</strong> · {remaining} Falowen calls left today.</p>
          {cacheLoaded && missingKeys.length > remaining ? <p role="alert" className="hoeren-validation">Short by {missingKeys.length - remaining} speech call(s). Use the free optimizer or select the improved lesson draft; review the new cost preview before generating.</p> : null}
          <p>Each English/German segment is synthesized in its own language. Editing one segment reuses all unchanged recorded scenes.</p>
        </div>
        <label>Pause between scenes (seconds)
          <input type="number" min="0" max="5" step="0.05" value={lineGap} disabled={!!busy}
            onChange={e => { setLineGap(Math.max(0, Math.min(5, Number(e.target.value) || 0))); setAudioBlob(null); setAudioUrl(""); }} />
        </label>
        <label className="hoeren-effect-option">
          <input type="checkbox" checked={generationConfirmed} disabled={!!busy || !script.trim()} onChange={e => setGenerationConfirmed(e.target.checked)} />
          I have reviewed the German examples and English explanations.
        </label>
        <button type="button" className="hoeren-button" disabled={!ready || !!busy || !cacheLoaded || !!scriptError.error || missingKeys.length > remaining || (missingKeys.length > 0 && !generationConfirmed)} onClick={generateAudio}>
          {busy === "audio" ? "Generating narration…" : missingKeys.length ? "Generate " + missingKeys.length + " missing scene(s)" : "Assemble saved scenes · free"}
        </button>
        {progress ? <p className="hoeren-hint" role="status">{progress}</p> : null}
        <p className="hoeren-hint">Generated speech is saved in your browser for up to 14 days; WAV and MP3 files are assembled and exported locally. No ElevenLabs account, upload, or extra storage service is required. Google Gemini requests can still incur charges.</p>
        {audioBlob ? <div className="hoeren-output">
          <h3>3. Listen before publishing</h3>
          <audio controls preload="metadata" src={audioUrl} aria-label="Preview grammar narration" />
          <p>{(audioBlob.size / 1_000_000).toFixed(1)} MB · 24 kHz WAV</p>
          <div className="hoeren-downloads">
            <button className="hoeren-button" type="button" disabled={!!busy} onClick={exportMp3}>{busy === "mp3" ? "Converting MP3…" : "Download MP3"}</button>
            <button className="hoeren-quiet" type="button" disabled={!!busy} onClick={() => download(audioBlob, safeName(topic, level) + ".wav", "audio/wav")}>Download WAV</button>
            <button className="hoeren-quiet" type="button" onClick={() => download(script, safeName(topic, level) + ".txt", "text/plain;charset=utf-8")}>Download script</button>
          </div>
        </div> : <div className="hoeren-placeholder">Generated grammar narration will appear here. Nothing is published to student pages automatically.</div>}
      </section>
    </div>
  );
}

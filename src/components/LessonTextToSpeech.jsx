import { useEffect, useMemo, useRef, useState } from "react";
import { getStudioStatus, makeSpeechClip } from "../services/hoerenStudioService.js";
import { base64WavToBytes } from "../utils/hoerenAudio.js";
import { getSavedVoice, saveVoice } from "../utils/hoerenVoiceCache.js";
import { sceneVoiceKey } from "../utils/hoerenSpeechPlan.js";
import {
  buildLessonNarrationPlan, lessonNarrationSlideStarts, assembleLessonNarration,
} from "../utils/lessonSpeechSynthesis.js";
import { downloadLessonBlob, safeLessonFilename } from "../utils/lessonVideoStudio.js";

const VOICES = Object.freeze([
  { key: "A", label: "Kore · teacher voice" },
  { key: "D", label: "Zephyr · bright voice" },
  { key: "B", label: "Puck · conversational voice" },
  { key: "C", label: "Charon · deep voice" },
]);

export default function LessonTextToSpeech({ slides, fullScript, title, disabled = false, onGenerated }) {
  const [source, setSource] = useState("auto");
  const [engine, setEngine] = useState("lite");
  const [speaker, setSpeaker] = useState("A");
  const [status, setStatus] = useState(null);
  const [serverError, setServerError] = useState("");
  const [cacheReady, setCacheReady] = useState(false);
  const [cacheRevision, setCacheRevision] = useState(0);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [notice, setNotice] = useState("");
  const [generatedWav, setGeneratedWav] = useState(null);
  const cachedClips = useRef(new Map());
  const activeRef = useRef(true);
  useEffect(() => () => { activeRef.current = false; }, []);

  const plan = useMemo(() => {
    try { return { value: buildLessonNarrationPlan({ slides, fullScript, source, engine, speaker }), error: "" }; }
    catch (error) { return { value: null, error: error.message }; }
  }, [slides, fullScript, source, engine, speaker]);

  const refreshQuota = async () => {
    try {
      const current = await getStudioStatus();
      if (activeRef.current) { setStatus(current); setServerError(""); }
      return current;
    } catch (error) {
      if (activeRef.current) setServerError(error.message);
      throw error;
    }
  };
  useEffect(() => {
    let active = true;
    getStudioStatus().then(result => {
      if (active) setStatus(result);
    }).catch(error => { if (active) setServerError(error.message); });
    return () => { active = false; };
  }, []);

  // Reuse IndexedDB scene recordings created here or in the existing Hören Studio.
  useEffect(() => {
    let active = true;
    setCacheReady(false);
    Promise.all((plan.value?.uniqueKeys || []).map(async key => {
      if (cachedClips.current.has(key)) return;
      const saved = await getSavedVoice(key);
      if (active && saved) cachedClips.current.set(key, saved);
    })).finally(() => {
      if (active) { setCacheRevision(revision => revision + 1); setCacheReady(true); }
    });
    return () => { active = false; };
  }, [plan.value]);

  const missingKeys = useMemo(() => (plan.value?.uniqueKeys || []).filter(key => !cachedClips.current.has(key)),
    [plan.value, cacheRevision]);
  const required = missingKeys.length;
  const remaining = status?.remaining?.speech ?? 0;
  const canGenerate = !disabled && !busy && cacheReady && status?.ready && !!plan.value && required <= remaining;

  async function generate() {
    if (!canGenerate) return;
    const prepared = plan.value; // Keep a fixed copy of the teacher-approved text.
    setBusy(true); setNotice(""); setServerError(""); setProgress("Checking the shared Hören Studio allowance…");
    try {
      const fresh = await refreshQuota();
      if (!fresh.ready) throw new Error("Hören Studio TTS is not configured for this account.");
      const pending = prepared.uniqueKeys.filter(key => !cachedClips.current.has(key));
      if (pending.length > fresh.remaining.speech)
        throw new Error("This recording needs " + pending.length + " new speech calls but only " +
          fresh.remaining.speech + " remain in today's shared Hören Studio limit.");
      let generated = 0;
      const clips = [];
      for (const [index, scene] of prepared.scenes.entries()) {
        const key = sceneVoiceKey(prepared.engine, scene);
        let wav = cachedClips.current.get(key);
        if (!wav) {
          setProgress("Generating scene " + (index + 1) + " of " + prepared.scenes.length + "…");
          const reply = await makeSpeechClip({ turns: scene.turns, engine: prepared.engine });
          wav = base64WavToBytes(reply.audioBase64);
          cachedClips.current.set(key, wav);
          const saved = await saveVoice(key, wav);
          if (!saved) setNotice("Browser voice cache is unavailable. Save the finished audio to avoid regenerating it.");
          generated += 1;
          setCacheRevision(revision => revision + 1);
          setStatus(previous => previous
            ? { ...previous, remaining: { ...previous.remaining, speech: reply.remaining } }
            : previous);
        } else {
          setProgress("Reusing saved scene " + (index + 1) + " of " + prepared.scenes.length + "…");
        }
        clips.push(wav);
      }
      setProgress("Assembling narration and aligning slide timestamps locally…");
      const timing = lessonNarrationSlideStarts(prepared, clips);
      const result = assembleLessonNarration(prepared, clips);
      await onGenerated({ wav: result, timing, source: prepared.source });
      setGeneratedWav(result);
      setNotice("Narration ready: " + generated + " new Google request(s), " +
        (prepared.scenes.length - generated) + " reused voice scene(s)." +
        (prepared.source === "slides" ? " Slide changes aligned to the recording." : " Set slide changes with the marker tool."));
    } catch (error) {
      setServerError((error?.message || "Voice generation failed.") +
        " Successful voice scenes are cached; retry only after resolving the issue.");
    } finally {
      setBusy(false); setProgress("");
    }
  }

  return <div className="lvs-tts" aria-label="Hören Studio text to speech">
    <h3>Convert script to speech</h3>
    <div className="lvs-tts-settings">
      <label>Text source
        <select value={source} disabled={disabled || busy} onChange={event => setSource(event.target.value)}>
          <option value="auto">Auto · use slide scripts if available</option>
          <option value="slides">Each slide's narration text</option>
          <option value="full">Full narration transcript</option>
        </select>
      </label>
      <label>Voice model
        <select value={engine} disabled={disabled || busy} onChange={event => setEngine(event.target.value)}>
          <option value="lite">Flash-Lite · Budget</option>
          <option value="flash">Flash · Higher fidelity / cost</option>
        </select>
      </label>
      <label>German narrator
        <select value={speaker} disabled={disabled || busy} onChange={event => setSpeaker(event.target.value)}>
          {VOICES.map(option => <option key={option.key} value={option.key}>{option.label}</option>)}
        </select>
      </label>
    </div>
    {plan.value ? <p className="lvs-help">
      {plan.value.scenes.length} speech scenes · {cacheReady ? required : "…"} new Google requests
      · {cacheReady ? plan.value.scenes.length - required : "…"} reusable.
      Shared Hören allowance: {status?.remaining?.speech ?? "…"} remaining today.
    </p> : <p className="lvs-help">{plan.error}</p>}
    <button type="button" className="lvs-primary" disabled={!canGenerate} onClick={generate}>
      {busy ? "Generating audio…" : required ? "Generate audio from text" : "Assemble saved narration · no new calls"}
    </button>
    {progress ? <p role="status" className="lvs-tts-progress">{progress}</p> : null}
    {notice ? <p role="status" className="lvs-tts-progress">{notice}</p> : null}
    {serverError ? <p role="alert" className="lvs-tts-error">{serverError}</p> : null}
    {generatedWav ? <button type="button" onClick={() =>
      downloadLessonBlob(generatedWav, safeLessonFilename(title) + "-narration.wav")}>
      Download generated WAV
    </button> : null}
    <button type="button" className="lvs-tts-refresh" disabled={disabled || busy} onClick={() => refreshQuota().catch(() => {})}>
      Refresh shared voice allowance
    </button>
    <p className="lvs-help">Uses the existing owner-only Hören Studio API, voice cache and daily budget.
      Google TTS may incur provider charges. Add [PAUSE 2] in the text for two seconds of silence.
      This endpoint currently uses German (de-DE) voices, so mixed English narration may need review.</p>
  </div>;
}

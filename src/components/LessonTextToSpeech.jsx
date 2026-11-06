import { useEffect, useMemo, useRef, useState } from "react";
import { getStudioStatus, makeSpeechClip } from "../services/hoerenStudioService.js";
import { base64WavToBytes } from "../utils/hoerenAudio.js";
import { getSavedVoice, saveVoice } from "../utils/hoerenVoiceCache.js";
import { sceneVoiceKey } from "../utils/hoerenSpeechPlan.js";
import {
  buildLessonNarrationPlan, lessonNarrationSlideStarts, assembleLessonNarration, recoverLessonNarrationPrefix,
} from "../utils/lessonSpeechSynthesis.js";
import { downloadLessonBlob, safeLessonFilename } from "../utils/lessonVideoStudio.js";

const VOICES = Object.freeze([
  { key: "A", label: "Kore · teacher voice" },
  { key: "D", label: "Zephyr · bright voice" },
  { key: "B", label: "Puck · conversational voice" },
  { key: "C", label: "Charon · deep voice" },
]);

export default function LessonTextToSpeech({ slides, fullScript, title, disabled = false, onGenerated, onBusyChange }) {
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
  const recoveredAudio = useMemo(
    () => cacheReady ? recoverLessonNarrationPrefix(plan.value, key => cachedClips.current.get(key)) : null,
    [plan.value, cacheReady, cacheRevision],
  );
  const [providerBlocked, setProviderBlocked] = useState(false);
  const canGenerate = !disabled && !busy && cacheReady && status?.ready && !!plan.value &&
    required <= remaining && !providerBlocked;
  // Explain the exact readiness condition instead of showing an inert grey button.
  // A disabled button must not silently send new quota-consuming requests.
  const blockedReason = busy ? "Audio is currently being generated."
    : disabled ? "Slide preparation or video export is still running."
      : !plan.value ? (plan.error || "A valid narration script is required.")
        : !cacheReady ? "Checking the saved voice clips for this script."
          : providerBlocked ? "Google declined a voice request (429). Check the provider quota before re-enabling requests below."
            : !status ? (serverError ? "Cannot check the Hören Studio service: " + serverError
              : "Checking the Hören Studio connection and daily allowance.")
              : !status.ready ? "The Hören Studio speech service is not configured. Check the Gemini API key."
                : required > remaining ? "This script needs " + required + " new voice request(s), but only "
                  + remaining + " remain in today's shared 72-request Hören Studio allowance."
                  : "";


  async function generate() {
    if (!canGenerate) return;
    const prepared = plan.value; // Keep a fixed copy of the teacher-approved text.
    setBusy(true); onBusyChange?.(true); setNotice(""); setServerError(""); setProgress("Checking the shared Hören Studio allowance…");
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
      if (error?.status === 429) {
        // Google 429 and Falowen's 72-scenes/day safety cap are independent.
        // Neither should cause an automatic retry.
        setProviderBlocked(true);
        const fromGoogle = /Google rate limit \(429\)/i.test(error?.message || "");
        setServerError(fromGoogle
          ? "Google declined another voice request (429). No automatic retries will run. " +
            "Check the selected project's TTS rate limits and billing in Google AI Studio. " +
            "Already completed scenes are safe on this browser. You can download the completed part below."
          : (error?.message || "Falowen's shared daily speech allowance was reached.") +
            " Existing voice scenes are still saved. Check your Falowen quota before attempting another generation.");
      } else {
        setServerError((error?.message || "Voice generation failed.") +
          " Successful voice scenes are cached; retry only after resolving the issue.");
      }
    } finally {
      setBusy(false); onBusyChange?.(false); setProgress("");
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
    {blockedReason ? <p role="status" className="lvs-tts-progress">
      Generate audio unavailable: {blockedReason}
    </p> : null}
    {progress ? <p role="status" className="lvs-tts-progress">{progress}</p> : null}
    {notice ? <p role="status" className="lvs-tts-progress">{notice}</p> : null}
    {serverError ? <p role="alert" className="lvs-tts-error">{serverError}</p> : null}
    {generatedWav ? <button type="button" onClick={() =>
      downloadLessonBlob(generatedWav, safeLessonFilename(title) + "-narration.wav")}>
      Download generated WAV
    </button> : null}
    {recoveredAudio && !recoveredAudio.complete ? <div className="lvs-tts-checkpoint">
      <strong>{recoveredAudio.scenes} of {recoveredAudio.total} scenes safely recovered</strong>
      <p className="lvs-help">This is an incomplete narration, not the final video audio. Keep the same browser to reuse the recorded scenes.</p>
      <button type="button" onClick={() =>
        downloadLessonBlob(recoveredAudio.audio, safeLessonFilename(title) + "-partial-narration.wav")}>
        Download completed narration (partial WAV)
      </button>
    </div> : null}
    {providerBlocked ? <div className="lvs-tts-checkpoint">
      <p className="lvs-help"><strong>Further paid voice requests are paused.</strong> Check your Google TTS model quota, billing/spend cap and project first. Refreshing Falowen's quota does not reset Google's quota.</p>
      <button type="button" disabled={disabled || busy} onClick={() => {
        setProviderBlocked(false); setServerError("");
        setNotice("Voice requests re-enabled. Only continue after confirming that Google's quota is available.");
      }}>I've checked Google's quota · Allow another attempt</button>
    </div> : null}
    <button type="button" className="lvs-tts-refresh" disabled={disabled || busy} onClick={() => refreshQuota().catch(() => {})}>
      Refresh shared Falowen allowance
    </button>
    <p className="lvs-help">Uses the existing owner-only Hören Studio API, voice cache and daily budget.
      Google TTS may incur provider charges. Add [PAUSE 2] in the text for two seconds of silence.
      This endpoint currently uses German (de-DE) voices, so mixed English narration may need review.</p>
  </div>;
}

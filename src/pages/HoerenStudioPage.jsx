import { useEffect, useMemo, useState } from "react";
import { useToast } from "../context/ToastContext";
import { getStudioStatus, makeListeningScript, makeSpeechClip } from "../services/hoerenStudioService";
import { assembleListeningExam, base64WavToBytes, parseStudioTranscript } from "../utils/hoerenAudio";
import "./HoerenStudioPage.css";

const TEMPLATES = {
  dialogue: "A: Guten Tag! Ich möchte eine Fahrkarte nach Berlin kaufen.\nB: Möchten Sie heute oder morgen fahren?\nA: Morgen früh, bitte.\nB: Der Zug fährt um acht Uhr fünfzehn.\n[PAUSE 3]\nA: Vielen Dank!",
  announcement: "A: Achtung, liebe Fahrgäste! Der Zug nach Berlin fährt heute nicht von Gleis eins, sondern von Gleis vier.\n[PAUSE 3]\nA: Bitte beachten Sie die geänderte Abfahrtszeit um neun Uhr zwanzig.",
  telephone: "A: Guten Tag, hier spricht Anna Müller. Ich kann heute leider nicht zum Deutschkurs kommen.\n[PAUSE 3]\nA: Bitte rufen Sie mich morgen nach zehn Uhr zurück. Vielen Dank!",
};
const LEVELS = ["A1", "A2", "B1", "B2"];
const TYPE_LABELS = { dialogue: "Two-person conversation", announcement: "Public announcement", telephone: "Telephone message" };

function downloadFile(data, filename, mimeType) {
  const url = URL.createObjectURL(data instanceof Blob ? data : new Blob([data], { type: mimeType }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10000);
}
function safeFileName(level, topic) {
  const suffix = topic.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 44) || "listening";
  return `falowen-${level.toLowerCase()}-hoeren-${suffix}`;
}

export default function HoerenStudioPage() {
  const toast = useToast();
  const [level, setLevel] = useState("A1");
  const [type, setType] = useState("dialogue");
  const [topic, setTopic] = useState("Eine Fahrkarte am Bahnhof kaufen");
  const [engine, setEngine] = useState("lite");
  const [script, setScript] = useState(TEMPLATES.dialogue);
  const [lineGap, setLineGap] = useState(0.7);
  const [repeats, setRepeats] = useState(2);
  const [repeatGap, setRepeatGap] = useState(6);
  const [status, setStatus] = useState(null);
  const [serverError, setServerError] = useState("");
  const [busy, setBusy] = useState("");
  const [progress, setProgress] = useState("");
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState("");

  useEffect(() => {
    let alive = true;
    getStudioStatus().then((data) => {
      if (alive) { setStatus(data); setServerError(""); }
    }).catch((error) => { if (alive) setServerError(error.message); });
    return () => { alive = false; };
  }, []);
  useEffect(() => () => { if (audioUrl) URL.revokeObjectURL(audioUrl); }, [audioUrl]);

  const transcript = useMemo(() => {
    try { return { lines: parseStudioTranscript(script), error: "" }; }
    catch (error) { return { lines: [], error: error.message }; }
  }, [script]);
  const spokenLines = transcript.lines.filter((line) => line.type === "speech");
  const ready = Boolean(status?.ready);
  const filename = safeFileName(level, topic);

  function clearAudio() {
    setAudioBlob(null);
    setAudioUrl("");
  }
  function setTypeAndTemplate(next) {
    setType(next);
    setScript(TEMPLATES[next]);
    clearAudio();
  }
  async function reloadStatus() {
    try { setStatus(await getStudioStatus()); setServerError(""); }
    catch (error) { setServerError(error.message); }
  }
  async function generateScript() {
    setBusy("script"); setProgress(""); clearAudio();
    try {
      const result = await makeListeningScript({ topic, type, level });
      setScript(result.script);
      setStatus((previous) => previous && ({ ...previous, remaining: { ...previous.remaining, script: result.remaining } }));
      toast.success("German listening script generated. Please review it before creating audio.");
    } catch (error) { toast.error(error.message); }
    finally { setBusy(""); await reloadStatus(); }
  }
  async function generateAudio() {
    if (transcript.error || !spokenLines.length) return;
    if (spokenLines.length > 18) { toast.error("For cost control, use at most 18 spoken lines per recording."); return; }
    if (spokenLines.some((line) => line.text.length > 320)) { toast.error("Split long spoken lines into shorter sentences."); return; }
    setBusy("audio"); setProgress(""); clearAudio();
    try {
      const clips = [];
      for (const [index, line] of spokenLines.entries()) {
        setProgress(`Generating spoken line ${index + 1} of ${spokenLines.length}…`);
        const reply = await makeSpeechClip({ text: line.text, speaker: line.speaker, engine });
        clips.push(base64WavToBytes(reply.audioBase64));
        setStatus((previous) => previous && ({ ...previous, remaining: { ...previous.remaining, speech: reply.remaining } }));
      }
      setProgress("Assembling pauses and repeats on your device…");
      const blob = assembleListeningExam(transcript.lines, clips, { repeats, lineGap, repeatGap });
      setAudioBlob(blob);
      setAudioUrl(URL.createObjectURL(blob));
      toast.success("Your Hören recording is ready. Download the WAV to keep it.");
    } catch (error) {
      toast.error(`${error.message} Audio generation stopped; any successful clips still count toward today's limit.`);
    } finally { setBusy(""); setProgress(""); await reloadStatus(); }
  }

  return (
    <div className="hoeren-studio">
      <header className="hoeren-hero">
        <div className="hoeren-kicker">FALOWEN · PRIVATE AI STUDIO</div>
        <h1>Hören Studio</h1>
        <p>Create original Goethe-style German listening practice. Review the transcript, generate natural voices, add exact pauses and download an exam-ready WAV.</p>
        <div className="hoeren-tags"><span>Owner account only</span><span>No audio stored online</span><span>Daily budget limits</span></div>
      </header>
      {serverError ? <div className="hoeren-alert" role="alert">Studio setup: {serverError}. Access is disabled until the owner UID and Gemini API key are configured securely.</div> : null}
      {status && !ready ? <div className="hoeren-alert" role="alert">The Gemini API secret has not been configured. Script and audio generation are disabled.</div> : null}
      <section className="hoeren-usage" aria-label="Daily API limits">
        <div><strong>{status ? status.remaining.script : "—"}</strong><span>scripts remaining today</span></div>
        <div><strong>{status ? status.remaining.speech : "—"}</strong><span>voice clips remaining today</span></div>
        <div className="hoeren-usage-note">The limit resets daily (UTC). A generation request may use Google's paid quota if your Google project has billing enabled. Files are not saved on the server.</div>
        <button type="button" className="hoeren-quiet" onClick={reloadStatus}>Refresh quota</button>
      </section>
      <div className="hoeren-columns">
        <section className="hoeren-panel">
          <h2>1. Prepare the recording</h2>
          <div className="hoeren-input-grid">
            <label>German level<select value={level} disabled={!!busy} onChange={(event) => { setLevel(event.target.value); clearAudio(); }}>{LEVELS.map((choice) => <option key={choice}>{choice}</option>)}</select></label>
            <label>Recording type<select value={type} disabled={!!busy} onChange={(event) => setTypeAndTemplate(event.target.value)}>{Object.entries(TYPE_LABELS).map(([value, name]) => <option key={value} value={value}>{name}</option>)}</select></label>
          </div>
          <label>Topic for an original script<input value={topic} disabled={!!busy} maxLength={240} onChange={(event) => { setTopic(event.target.value); clearAudio(); }} placeholder="e.g. Shopping at a supermarket" /></label>
          <button className="hoeren-button" type="button" disabled={!ready || !!busy || topic.trim().length < 4 || !status?.remaining.script} onClick={generateScript}>{busy === "script" ? "Generating script…" : "Generate Goethe-style script"}</button>
          <p className="hoeren-hint">You can also write or paste your own script without using Google's script-generation quota.</p>
          <label>Transcript — edit before creating audio
            <textarea rows={13} spellCheck lang="de" value={script} disabled={!!busy} onChange={(event) => { setScript(event.target.value); clearAudio(); }} />
          </label>
          <p className="hoeren-hint"><strong>Format:</strong> One line per turn, starting with <code>A:</code> or <code>B:</code>. Insert <code>[PAUSE 3]</code> as its own line for three seconds of silence. Two distinct German voices are used for A and B.</p>
          {transcript.error ? <p className="hoeren-validation" role="alert">{transcript.error}</p> : <p className="hoeren-hint">{spokenLines.length} spoken lines · {transcript.lines.filter((line) => line.type === "pause").length} custom pauses</p>}
        </section>
        <section className="hoeren-panel">
          <h2>2. Audio settings</h2>
          <fieldset className="hoeren-fieldset"><legend>Google voice model</legend>
            <label className="hoeren-choice"><input type="radio" name="engine" checked={engine === "lite"} disabled={!!busy} onChange={() => { setEngine("lite"); clearAudio(); }} /><span><strong>Flash-Lite · Budget</strong><small>Recommended for your first tests</small></span></label>
            <label className="hoeren-choice"><input type="radio" name="engine" checked={engine === "flash"} disabled={!!busy} onChange={() => { setEngine("flash"); clearAudio(); }} /><span><strong>Flash · Higher fidelity</strong><small>More expressive, higher API cost</small></span></label>
          </fieldset>
          <div className="hoeren-input-grid">
            <label>Line spacing (seconds)<input type="number" value={lineGap} step="0.1" min="0" max="5" disabled={!!busy} onChange={(event) => { setLineGap(Number(event.target.value)); clearAudio(); }} /></label>
            <label>Play the full audio<select value={repeats} disabled={!!busy} onChange={(event) => { setRepeats(Number(event.target.value)); clearAudio(); }}><option value={1}>Once</option><option value={2}>Twice (Goethe-style)</option></select></label>
          </div>
          {repeats === 2 ? <label>Silence before second playback (seconds)<input type="number" min="0" max="30" step="1" value={repeatGap} disabled={!!busy} onChange={(event) => { setRepeatGap(Number(event.target.value)); clearAudio(); }} /></label> : null}
          <p className="hoeren-hint">Repeats and pauses are added locally after synthesis. Playing the recording twice does not double the Google API charge.</p>
          <div className="hoeren-divider" />
          <button type="button" className="hoeren-button" disabled={!ready || !!busy || !!transcript.error || !spokenLines.length || spokenLines.length > 18 || spokenLines.length > (status?.remaining.speech ?? 0)} onClick={generateAudio}>
            {busy === "audio" ? "Generating German audio…" : "Generate Hören recording"}
          </button>
          {progress ? <p role="status" aria-live="polite">{progress}</p> : null}
          {!transcript.error && spokenLines.length > 18 ? <p className="hoeren-validation">Maximum 18 spoken lines per recording, to prevent accidental high-cost requests.</p> : null}
          <p className="hoeren-hint">Google returns WAV audio. No MP3 encoding or automatic student publication is included in this first version.</p>
          {audioBlob ? <div className="hoeren-output">
            <h3>3. Preview and download</h3>
            <audio controls preload="metadata" src={audioUrl} aria-label="Preview generated Hören recording" />
            <p>{(audioBlob.size / 1_000_000).toFixed(1)} MB · WAV · 24 kHz</p>
            <div className="hoeren-downloads">
              <button type="button" className="hoeren-button" onClick={() => downloadFile(audioBlob, `${filename}.wav`, "audio/wav")}>Download audio</button>
              <button type="button" className="hoeren-quiet" onClick={() => downloadFile(script, `${filename}.txt`, "text/plain;charset=utf-8")}>Download transcript</button>
            </div>
          </div> : <div className="hoeren-placeholder">Your approved recording will appear here for playback and download.</div>}
        </section>
      </div>
      <p className="hoeren-footer">Practice recordings are original teaching materials and not official Goethe-Institut exam audio. Listen and check all numbers, names and pronunciation before use.</p>
    </div>
  );
}

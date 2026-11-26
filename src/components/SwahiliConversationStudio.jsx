import { useEffect, useState } from "react";
import { makeSpeechClip, makeSwahiliScript } from "../services/hoerenStudioService";
import { assembleListeningExam, base64WavToBytes, parseStudioTranscript } from "../utils/hoerenAudio";
import { assemblyScenePlan, buildStudioSpeechPlan, sceneVoiceKey } from "../utils/hoerenSpeechPlan";
import { getSavedVoice, saveVoice } from "../utils/hoerenVoiceCache";
import { encodeWavAsMp3 } from "../utils/hoerenMp3";
import { swahiliAudioChapters } from "../data/swahiliAudioChapters.js";
import { swahiliAudioFileBase } from "../utils/swahiliAudioFilename.js";

const ENGINE = "lite";
const TEMPLATE = "A: Habari za asubuhi!\nB: Nzuri, asante. Unaenda wapi?\nA: Ninaenda sokoni kununua matunda.\nB: Twende pamoja!";

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export default function SwahiliConversationStudio({ ready, remaining, refreshStatus, onBusyChange }) {
  const [level, setLevel] = useState("A1");
  const chapters = swahiliAudioChapters[level];
  const [lessonId, setLessonId] = useState(chapters[0].assignment_id);
  const [topic, setTopic] = useState("");
  const [format, setFormat] = useState("dialogue");
  const [script, setScript] = useState("");
  const [recording, setRecording] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [progress, setProgress] = useState("");
  const lesson = chapters.find((entry) => entry.assignment_id === lessonId);
  const focus = topic.trim();
  const fileBase = swahiliAudioFileBase(level, lesson, focus);
  const scriptTopic = lesson
    ? `${lesson.assignment_id} · ${lesson.en}${focus ? ` · Focus: ${focus}` : ""}`
    : focus;

  useEffect(() => () => { if (recording) URL.revokeObjectURL(recording.url); }, [recording]);

  function updateScript(value) {
    setScript(value);
    setRecording(null);
  }

  async function run(action, work, usesQuota = true) {
    if (busy) return;
    setBusy(action);
    onBusyChange(true);
    setError("");
    try {
      await work();
    } catch (cause) {
      setError(cause.message || "Could not complete this step. Try again.");
    } finally {
      if (usesQuota) await refreshStatus();
      setBusy("");
      setProgress("");
      onBusyChange(false);
    }
  }

  async function generateAudio() {
    const lines = parseStudioTranscript(script);
    const speakers = new Set(lines.filter((line) => line.type === "speech").map((line) => line.speaker));
    if (speakers.size !== 2 || !speakers.has("A") || !speakers.has("B")) throw new Error("Use speaking lines for both A and B.");
    const plan = buildStudioSpeechPlan(lines);
    const scenes = plan.filter((scene) => scene.type === "speech");
    const keys = scenes.map((scene) => "swahili:" + sceneVoiceKey(ENGINE, scene));
    const cached = new Map();
    for (const key of new Set(keys)) cached.set(key, await getSavedVoice(key));
    const required = [...cached.values()].filter((bytes) => !bytes).length;
    if (required > (remaining?.speech ?? 0)) throw new Error("This script needs more speech requests than are available today.");

    const clips = [];
    for (const [index, scene] of scenes.entries()) {
      const key = keys[index];
      setProgress(`Preparing scene ${index + 1} of ${scenes.length}…`);
      let bytes = cached.get(key);
      if (!bytes) {
        const result = await makeSpeechClip({ turns: scene.turns, engine: ENGINE, style: "swahili" });
        bytes = base64WavToBytes(result.audioBase64);
        cached.set(key, bytes);
        await saveVoice(key, bytes);
      }
      clips.push(bytes);
    }
    const wav = assembleListeningExam(assemblyScenePlan(plan), clips, { repeats: 1, lineGap: 0.4 });
    setRecording({ wav, url: URL.createObjectURL(wav), fileBase });
  }

  return <section className="hoeren-panel" aria-label="Swahili conversation studio">
    <h2>Swahili listening audio</h2>
    <div className="hoeren-input-grid">
      <label>Course level
        <select value={level} disabled={!!busy} onChange={(event) => {
          const nextLevel = event.target.value;
          setLevel(nextLevel);
          setLessonId(swahiliAudioChapters[nextLevel][0].assignment_id);
          setTopic("");
        }}>
          {Object.keys(swahiliAudioChapters).map(value => <option key={value}>{value}</option>)}
        </select>
      </label>
      <label>Format
        <select value={format} disabled={!!busy} onChange={(event) => setFormat(event.target.value)}>
          <option value="dialogue">Two-person conversation</option>
          <option value="podcast">Two-host podcast</option>
        </select>
      </label>
      <label>Swahili Course Book chapter
        <select value={lessonId} disabled={!!busy} onChange={(event) => { setLessonId(event.target.value); setTopic(""); }}>
          {chapters.map(({ assignment_id, en }) => (
            <option key={assignment_id} value={assignment_id}>{en}</option>
          ))}
          <option value="">Custom topic</option>
        </select>
      </label>
      <label>{lesson ? "Optional focus" : "Topic"}
        <input maxLength={lesson ? 140 : 240} value={topic} disabled={!!busy} onChange={(event) => setTopic(event.target.value)}
          placeholder={lesson ? "e.g. practise a polite request" : "Ordering lunch at a restaurant"} />
      </label>
    </div>
    <button type="button" className="hoeren-button" disabled={!ready || !!busy || scriptTopic.length < 4 || !remaining?.script}
      onClick={() => run("script", async () => updateScript((await makeSwahiliScript({ topic: scriptTopic, format, level })).script))}>
      {busy === "script" ? "Generating script…" : "Generate script"}
    </button>
    <label>Editable transcript
      <textarea lang="sw" rows={12} value={script} disabled={!!busy} onChange={(event) => updateScript(event.target.value)}
        placeholder={TEMPLATE} />
    </label>
    <p className="hoeren-hint">Start each line with A: or B:. Add a separate [PAUSE 2] line for two seconds of silence.</p>
    <button type="button" className="hoeren-button" disabled={!ready || !!busy || !script.trim()} onClick={() => run("audio", generateAudio)}>
      {busy === "audio" ? "Generating audio…" : "Generate audio"}
    </button>
    {progress && <p role="status">{progress}</p>}
    {error && <p className="hoeren-alert" role="alert">{error}</p>}
    {recording && <div className="hoeren-output">
      <p className="hoeren-hint">{recording.fileBase}</p>
      <audio controls src={recording.url} aria-label="Preview generated Swahili recording" />
      <button type="button" className="hoeren-quiet" disabled={!!busy}
        onClick={() => run("download", async () => download(await encodeWavAsMp3(recording.wav), `${recording.fileBase}.mp3`), false)}>Download MP3</button>
      <button type="button" className="hoeren-quiet" disabled={!!busy}
        onClick={() => download(recording.wav, `${recording.fileBase}.wav`)}>Download WAV</button>
    </div>}
    {script.trim() && <button type="button" className="hoeren-quiet" disabled={!!busy}
      onClick={() => download(new Blob([script], { type: "text/plain;charset=utf-8" }), `${fileBase}-transcript.txt`)}>Download transcript</button>}
  </section>;
}

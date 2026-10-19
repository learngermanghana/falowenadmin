import { useEffect, useMemo, useState } from "react";
import { useToast } from "../context/ToastContext";
import { getStudioStatus, makeListeningScript, makeSpeechClip, makeListeningQuestions, publishListeningLesson, getHoerenPublishCatalog } from "../services/hoerenStudioService";
import { QUESTION_KINDS, validateDraftQuestions } from "../utils/hoerenQuestions";
import { assembleListeningExam, base64WavToBytes, parseStudioTranscript } from "../utils/hoerenAudio";
import { SCENES, decodeLocalAtmosphere } from "../utils/hoerenSoundscape";
import { encodeWavAsMp3 } from "../utils/hoerenMp3";
import "./HoerenStudioPage.css";

const TEMPLATES = {
  dialogue: "A: Guten Tag! Ich möchte eine Fahrkarte nach Berlin kaufen.\nB: Möchten Sie heute oder morgen fahren?\nA: Morgen früh, bitte.\nB: Der Zug fährt um acht Uhr fünfzehn.\n[PAUSE 3]\nA: Vielen Dank!",
  announcement: "A: Achtung, liebe Fahrgäste! Der Zug nach Berlin fährt heute nicht von Gleis eins, sondern von Gleis vier.\n[PAUSE 3]\nA: Bitte beachten Sie die geänderte Abfahrtszeit um neun Uhr zwanzig.",
  telephone: "A: Guten Tag, hier spricht Anna Müller. Ich kann heute leider nicht zum Deutschkurs kommen.\n[PAUSE 3]\nA: Bitte rufen Sie mich morgen nach zehn Uhr zurück. Vielen Dank!",
};
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
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
function safeFileName(level, topic, part) {
  const suffix = topic.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 44) || "listening";
  return `falowen-${level.toLowerCase()}-hoeren${part ? `-teil-${part}` : ""}-${suffix}`;
}

export default function HoerenStudioPage() {
  const toast = useToast();
  const [level, setLevel] = useState("A1");
  const [examPart, setExamPart] = useState("");
  const [type, setType] = useState("dialogue");
  const [topic, setTopic] = useState("Eine Fahrkarte am Bahnhof kaufen");
  const [engine, setEngine] = useState("lite");
  const [script, setScript] = useState(TEMPLATES.dialogue);
  const [lineGap, setLineGap] = useState(0.7);
  const [repeats, setRepeats] = useState(2);
  const [repeatGap, setRepeatGap] = useState(6);
  const [scene, setScene] = useState("station");
  const [useAtmosphere, setUseAtmosphere] = useState(true);
  const [openingBell, setOpeningBell] = useState(true);
  const [endingSound, setEndingSound] = useState(true);
  const [soundVolume, setSoundVolume] = useState(12);
  const [atmosphereFile, setAtmosphereFile] = useState(null);
  const [status, setStatus] = useState(null);
  const [serverError, setServerError] = useState("");
  const [busy, setBusy] = useState("");
  const [progress, setProgress] = useState("");
  const [audioBlob, setAudioBlob] = useState(null);
  const [generatedClips, setGeneratedClips] = useState(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [questions, setQuestions] = useState([]);
  const [questionKind, setQuestionKind] = useState("richtig-falsch");
  const [questionScript, setQuestionScript] = useState("");
  const [teacherApproved, setTeacherApproved] = useState(false);
  const [publishDay, setPublishDay] = useState(18);
  const [assignmentKey, setAssignmentKey] = useState("A1-12.1");
  const [published, setPublished] = useState(null);
  const [courseLessons, setCourseLessons] = useState([]);
  const [courseLessonsError, setCourseLessonsError] = useState("");

  useEffect(() => {
    let alive = true;
    getStudioStatus().then((data) => {
      if (alive) { setStatus(data); setServerError(""); }
    }).catch((error) => { if (alive) setServerError(error.message); });
    return () => { alive = false; };
  }, []);
  useEffect(() => () => { if (audioUrl) URL.revokeObjectURL(audioUrl); }, [audioUrl]);
  useEffect(() => {
    let active = true;
    getHoerenPublishCatalog().then(lessons => {
      if (active) { setCourseLessons(lessons); setCourseLessonsError(""); }
    }).catch(error => { if (active) setCourseLessonsError(error.message); });
    return () => { active = false; };
  }, []);

  const transcript = useMemo(() => {
    try { return { lines: parseStudioTranscript(script), error: "" }; }
    catch (error) { return { lines: [], error: error.message }; }
  }, [script]);
  const spokenLines = transcript.lines.filter((line) => line.type === "speech");
  const selectedProfile = status?.profiles?.[level]?.[examPart] || null;
  const questionCount = selectedProfile?.questionCount || 5;
  const ready = Boolean(status?.ready);
  const filename = safeFileName(level, topic, examPart);
  const reviewedQuestions = useMemo(() => {
    try { return { data: validateDraftQuestions({ script, questions, kind: questionKind, expectedCount: questionCount }), error: "" }; }
    catch (error) { return { data: [], error: error.message }; }
  }, [script, questions, questionKind, questionCount]);
  const questionsMatchScript = questionScript === script;
  const availableDays = [...new Set(courseLessons.filter(item => item.level === level).map(item => Number(item.day)))].sort((a, b) => a - b);
  const filteredAssignments = courseLessons.filter(item => item.level === level && Number(item.day) === Number(publishDay));
  const selectedAssignment = filteredAssignments.find(item => item.assignmentKey === assignmentKey);
  const canPublish = !!audioBlob && !!reviewedQuestions.data.length && questionsMatchScript &&
    teacherApproved && !busy && ["A1", "A2", "B1"].includes(level) && questionCount === 5 &&
    !!selectedAssignment && Number.isInteger(Number(publishDay));
  const updateQuestions = (index, changes) => {
    setQuestions(existing => existing.map((q, i) => i === index ? { ...q, ...changes } : q));
    setTeacherApproved(false); setPublished(null);
  };


  function clearAudio(keepGenerated = false) {
    setAudioBlob(null);
    setAudioUrl("");
    if (!keepGenerated) setGeneratedClips(null);
  }
  async function assembleCachedClips(clips) {
    const userAudio = scene !== "none" && useAtmosphere && atmosphereFile ? await decodeLocalAtmosphere(atmosphereFile) : null;
    const soundscape = { scene, ambience: useAtmosphere, bell: openingBell, ending: endingSound, volume: soundVolume / 100, userAudio };
    return assembleListeningExam(transcript.lines, clips, { repeats, lineGap, repeatGap, soundscape });
  }
  function setLevelAndPart(nextLevel, nextPart) {
    const profile = status?.profiles?.[nextLevel]?.[nextPart];
    setLevel(nextLevel); setExamPart(nextLevel === "A1" ? "" : nextPart);
    if (profile) {
      setType(profile.type); setTopic(profile.topic); setScript(profile.preview);
      setQuestionKind(profile.kind); setRepeats(profile.repeats);
      setScene("none"); setUseAtmosphere(false);
    } else if (nextLevel === "A1") {
      setType("dialogue"); setQuestionKind("richtig-falsch");
      setTopic("Eine Fahrkarte am Bahnhof kaufen"); setScript(TEMPLATES.dialogue);
      setRepeats(2);
    }
    setQuestions([]); setQuestionScript(""); setTeacherApproved(false); setPublished(null);
    clearAudio();
  }
  function setTypeAndTemplate(next) {
    setType(next);
    setScript(TEMPLATES[next]);
    setQuestions([]); setQuestionScript(""); setTeacherApproved(false); setPublished(null);
    clearAudio();
  }
  async function reloadStatus() {
    try { setStatus(await getStudioStatus()); setServerError(""); }
    catch (error) { setServerError(error.message); }
  }
  async function generateScript() {
    setBusy("script"); setProgress(""); clearAudio();
    try {
      const result = await makeListeningScript({ topic, type, level, part: examPart });
      setScript(result.script);
      setQuestions(result.questions || []);
      setQuestionKind(result.kind || "richtig-falsch");
      setQuestionScript(result.script);
      setTeacherApproved(false); setPublished(null);
      setStatus((previous) => previous && ({ ...previous, remaining: { ...previous.remaining, script: result.remaining } }));
      toast.success(`Script and ${questionCount} Hören questions generated. Review the answers before approving.`);
    } catch (error) { toast.error(error.message); }
    finally { setBusy(""); await reloadStatus(); }
  }
  async function generateQuestions() {
    if (script.trim().length < 35 || !ready) return;
    setBusy("questions"); setProgress("");
    try {
      const result = await makeListeningQuestions({ script, kind: questionKind, level, part: examPart });
      setQuestions(result.questions);
      setQuestionScript(script);
      setTeacherApproved(false); setPublished(null);
      toast.success(`${questionCount} listening questions generated. Check answers and supporting quotes.`);
    } catch (error) { toast.error(error.message); }
    finally { setBusy(""); await reloadStatus(); }
  }
  async function publishToCourseBook() {
    if (!canPublish) return;
    setBusy("publish"); setProgress("Preparing MP3 locally and uploading to Falowen…");
    try {
      const mp3 = await encodeWavAsMp3(audioBlob);
      const result = await publishListeningLesson({
        mp3,
        metadata: {
          level, day: Number(publishDay), assignmentKey: assignmentKey.trim().toUpperCase(),
          title: topic.trim(), script, kind: questionKind,
          questions: reviewedQuestions.data, teacherApproved,
        },
      });
      setPublished(result);
      toast.success("Published! The reviewed questions are now available in the selected Course Book lesson.");
    } catch (error) { toast.error(error.message); }
    finally { setBusy(""); setProgress(""); }
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
      setGeneratedClips(clips);
      setProgress("Assembling dialogue and locally mixing atmosphere…");
      const blob = await assembleCachedClips(clips);
      setAudioBlob(blob);
      setAudioUrl(URL.createObjectURL(blob));
      toast.success("Your Hören recording is ready. Download WAV or export an MP3.");
    } catch (error) {
      toast.error(`${error.message} Audio generation stopped; any successful clips still count toward today's limit.`);
    } finally { setBusy(""); setProgress(""); await reloadStatus(); }
  }

  async function remixWithoutGoogle() {
    if (!generatedClips?.length) return;
    setBusy("remix");
    setProgress("Mixing existing voices without Google API requests…");
    try {
      const blob = await assembleCachedClips(generatedClips);
      setAudioBlob(blob);
      setAudioUrl(URL.createObjectURL(blob));
      toast.success("Remixed using cached voice clips. No Gemini quota used.");
    } catch (error) { toast.error(error.message); }
    finally { setBusy(""); setProgress(""); }
  }

  async function downloadMp3() {
    if (!audioBlob) return;
    setBusy("mp3");
    try {
      const mp3 = await encodeWavAsMp3(audioBlob);
      downloadFile(mp3, `${filename}.mp3`, "audio/mpeg");
      toast.success("MP3 exported on your device. No additional Gemini credits used.");
    } catch (error) { toast.error(error.message); }
    finally { setBusy(""); }
  }

  return (
    <div className="hoeren-studio">
      <header className="hoeren-hero">
        <div className="hoeren-kicker">FALOWEN · PRIVATE AI STUDIO</div>
        <h1>Hören Studio</h1>
        <p>Create original Goethe-style German listening practice. Review the transcript, generate natural voices, add subtle atmosphere and download exam-ready MP3 or WAV.</p>
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
            <label>German level<select value={level} disabled={!!busy} onChange={event => setLevelAndPart(event.target.value, event.target.value === "A1" ? "" : "1")}>{LEVELS.map(choice => <option key={choice}>{choice}</option>)}</select></label>
            {level !== "A1" ? <label>Hören {level === "C2" ? "Aufgabe" : "Teil"}<select value={examPart} disabled={!!busy || !status?.profiles?.[level]} onChange={event => setLevelAndPart(level, event.target.value)}>
              {Object.entries(status?.profiles?.[level] || {}).map(([part, profile]) => <option key={part} value={part}>{profile.examLabel} {part} · {profile.label}</option>)}
            </select></label> : <label>Recording type<select value={type} disabled={!!busy} onChange={event => setTypeAndTemplate(event.target.value)}>{Object.entries(TYPE_LABELS).map(([value,name]) => <option key={value} value={value}>{name}</option>)}</select></label>}
          </div>
          {selectedProfile ? <div className="hoeren-placeholder">
            <strong>{level} Hören · {selectedProfile.examLabel} {examPart} — {selectedProfile.label}</strong>
            <p>{selectedProfile.structure}</p>
            <p>{questionCount} questions · {selectedProfile.repeats === 1 ? "Listen once" : "Listen twice"} · target ~{selectedProfile.wordTarget} spoken words. Original Falowen practice, not an official Goethe recording.</p>
            {level === "C1" && examPart === "1" ? <p><strong>Book matching:</strong> 3 original books (Buch 1, Buch 2, Buch 3), 6 statements, one play. Exam reading time: 60 seconds.</p> : null}
          </div> : null}
          <div className="hoeren-input-grid">
            <label>Recording style<input value={selectedProfile?.type || type} readOnly /></label>
            <label>Voice segments budget<input value={`Up to 18 speech clips · ${status?.remaining.speech ?? "—"} left today`} readOnly /></label>
          </div>
          <label>Topic for an original script<input value={topic} disabled={!!busy} maxLength={240} onChange={(event) => { setTopic(event.target.value); clearAudio(); }} placeholder="e.g. Shopping at a supermarket" /></label>
          <button className="hoeren-button" type="button" disabled={!ready || !!busy || topic.trim().length < 4 || !status?.remaining.script || (level !== "A1" && !selectedProfile)} onClick={generateScript}>{busy === "script" ? "Generating script…" : "Generate Goethe-style script"}</button>
          <p className="hoeren-hint">You can also write or paste your own script without using Google's script-generation quota.</p>
          <label>Transcript — edit before creating audio
            <textarea rows={13} spellCheck lang="de" value={script} disabled={!!busy} onChange={(event) => { setScript(event.target.value); setTeacherApproved(false); setPublished(null); clearAudio(); }} />
          </label>
          <p className="hoeren-hint"><strong>Format:</strong> One line per turn, starting with <code>A:</code> or <code>B:</code>. Insert <code>[PAUSE 3]</code> as its own line for three seconds of silence. Up to three German voices are used for A, B and C.</p>
          {transcript.error ? <p className="hoeren-validation" role="alert">{transcript.error}</p> : <p className="hoeren-hint">{spokenLines.length} spoken lines · {transcript.lines.filter((line) => line.type === "pause").length} custom pauses</p>}
          <fieldset className="hoeren-fieldset">
            <legend>2. Generate &amp; review Hören questions</legend>
            <label>Question format
              <select value={questionKind} disabled={!!busy || !!selectedProfile} onChange={(event) => {
                setQuestionKind(event.target.value); setQuestions([]); setQuestionScript(""); setTeacherApproved(false); setPublished(null);
              }}>{Object.entries(QUESTION_KINDS).map(([kind, label]) => <option key={kind} value={kind}>{label}</option>)}</select>
            </label>
            <p className="hoeren-hint">The selected Teil determines the question format and count. AI creates the script and questions in one request. Regenerating questions from edited text uses one of your five daily script requests.</p>
            <button type="button" className="hoeren-quiet" disabled={!ready || !!busy || !status?.remaining.script || script.trim().length < 35} onClick={generateQuestions}>
              {busy === "questions" ? "Creating questions…" : "Generate {questionCount} questions · one script quota"}
            </button>
            {questions.length ? <>
              {!questionsMatchScript ? <p className="hoeren-validation">The script changed. Review the questions and regenerate them, or restore the reviewed script before publishing.</p> : null}
              {questions.map((q, index) => <div className="hoeren-question" key={index}>
                <strong>Question {index + 1}</strong>
                <label>Statement / question
                  <textarea rows={2} value={q.question || ""} disabled={!!busy} onChange={e => updateQuestions(index, { question: e.target.value })} />
                </label>
                {questionKind === "richtig-falsch" ? <label>Correct answer
                  <select value={q.answer || ""} disabled={!!busy} onChange={e => updateQuestions(index, { answer: e.target.value })}>
                    <option value="">Choose</option><option>Richtig</option><option>Falsch</option>
                  </select>
                </label> : <>
                  {(q.options || ["", "", ""]).map((option, optionIndex) => <label key={optionIndex}>
                    Option {optionIndex + 1}
                    <input value={option} disabled={!!busy} onChange={e => updateQuestions(index, {
                      options: [0, 1, 2].map(i => i === optionIndex ? e.target.value : (q.options?.[i] || "")),
                    })} />
                  </label>)}
                  <label>Correct option
                    <select value={Number.isInteger(q.correctIndex) ? q.correctIndex : ""} disabled={!!busy}
                      onChange={e => updateQuestions(index, { correctIndex: Number(e.target.value) })}>
                      <option value="">Choose</option><option value="0">Option 1</option><option value="1">Option 2</option><option value="2">Option 3</option>
                    </select>
                  </label>
                </>}
                <label>Exact supporting quote from the spoken script
                  <textarea rows={2} value={q.evidence || ""} disabled={!!busy} onChange={e => updateQuestions(index, { evidence: e.target.value })} />
                </label>
              </div>)}
              {reviewedQuestions.error ? <p className="hoeren-validation" role="alert">{reviewedQuestions.error}</p> : <p className="hoeren-hint">All {questionCount} questions have structurally valid answers and matching supporting quotes. Check their meaning before approving.</p>}
            </> : <p className="hoeren-hint">Your {questionCount} questions and their source quotes will appear here for editing.</p>}
          </fieldset>
        </section>
        <section className="hoeren-panel">
          <h2>2. Audio settings</h2>
          <fieldset className="hoeren-fieldset"><legend>Google voice model</legend>
            <label className="hoeren-choice"><input type="radio" name="engine" checked={engine === "lite"} disabled={!!busy} onChange={() => { setEngine("lite"); clearAudio(); }} /><span><strong>Flash-Lite · Budget</strong><small>Recommended for your first tests</small></span></label>
            <label className="hoeren-choice"><input type="radio" name="engine" checked={engine === "flash"} disabled={!!busy} onChange={() => { setEngine("flash"); clearAudio(); }} /><span><strong>Flash · Higher fidelity</strong><small>More expressive, higher API cost</small></span></label>
          </fieldset>
          <div className="hoeren-input-grid">
            <label>Line spacing (seconds)<input type="number" value={lineGap} step="0.1" min="0" max="5" disabled={!!busy} onChange={(event) => { setLineGap(Number(event.target.value)); clearAudio(true); }} /></label>
            <label>Play the full audio<select value={repeats} disabled={!!busy} onChange={(event) => { setRepeats(Number(event.target.value)); clearAudio(true); }}><option value={1}>Once</option><option value={2}>Twice (exam replay or manual)</option></select></label>
          </div>
          {repeats === 2 ? <label>Silence before second playback (seconds)<input type="number" min="0" max="30" step="1" value={repeatGap} disabled={!!busy} onChange={(event) => { setRepeatGap(Number(event.target.value)); clearAudio(true); }} /></label> : null}
          <p className="hoeren-hint">Repeats and pauses are added locally after synthesis. Playing the recording twice does not double the Google API charge. {selectedProfile ? `The selected exam format normally plays ${selectedProfile.repeats === 1 ? "once" : "twice"}.` : ""}</p>
          <fieldset className="hoeren-fieldset hoeren-atmosphere">
            <legend>Sound effects &amp; atmosphere · no extra AI credits</legend>
            <label>Recording environment
              <select value={scene} disabled={!!busy} onChange={(event) => { setScene(event.target.value); clearAudio(true); }}>
                {Object.entries(SCENES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            {scene !== "none" ? <>
              <label className="hoeren-effect-option"><input type="checkbox" checked={useAtmosphere} disabled={!!busy} onChange={(event) => { setUseAtmosphere(event.target.checked); clearAudio(true); }} /> Ambient background</label>
              <label className="hoeren-effect-option"><input type="checkbox" checked={openingBell} disabled={!!busy} onChange={(event) => { setOpeningBell(event.target.checked); clearAudio(true); }} /> {scene === "station" ? "Station announcement bell" : "Short opening chime"}</label>
              {scene === "station" ? <label className="hoeren-effect-option"><input type="checkbox" checked={endingSound} disabled={!!busy} onChange={(event) => { setEndingSound(event.target.checked); clearAudio(true); }} /> Gentle departing-train cue</label> : null}
              <label>Effects volume: {soundVolume}%
                <input type="range" min="0" max="35" step="1" value={soundVolume} disabled={!!busy} onChange={(event) => { setSoundVolume(Number(event.target.value)); clearAudio(true); }} />
              </label>
              <label>Optional real-life ambience (MP3/WAV, up to 15 MB)
                <input type="file" accept="audio/mpeg,audio/mp3,audio/wav,audio/mp4,audio/ogg,.mp3,.wav,.m4a,.ogg" disabled={!!busy} onChange={(event) => { setAtmosphereFile(event.target.files?.[0] || null); clearAudio(true); }} />
              </label>
              {atmosphereFile ? <button className="hoeren-quiet" type="button" disabled={!!busy} onClick={() => { setAtmosphereFile(null); clearAudio(true); }}>Remove background recording ({atmosphereFile.name})</button> : null}
              <p className="hoeren-hint">Built-in sounds are simple, locally generated ambience. For a truly realistic station, upload a sound you recorded or have permission to reuse. Atmosphere is mixed quietly beneath the voices, and your uploaded sound stays in your browser.</p>
            </> : null}
          </fieldset>
          <div className="hoeren-divider" />
          {generatedClips?.length && !audioBlob ? <button type="button" className="hoeren-button" disabled={!!busy} onClick={remixWithoutGoogle}>Remix existing recording · no Gemini credits</button> : null}
          <button type="button" className="hoeren-button" disabled={!ready || !!busy || !!transcript.error || !spokenLines.length || spokenLines.length > 18 || spokenLines.length > (status?.remaining.speech ?? 0)} onClick={generateAudio}>
            {busy === "audio" ? "Generating German audio…" : generatedClips?.length ? "Regenerate voices · uses Google quota" : "Generate Hören recording"}
          </button>
          {progress ? <p role="status" aria-live="polite">{progress}</p> : null}
          {!transcript.error && spokenLines.length > 18 ? <p className="hoeren-validation">Maximum 18 spoken lines per recording, to prevent accidental high-cost requests.</p> : null}
          <p className="hoeren-hint">Audio and atmosphere are mixed in your browser. Download WAV or convert to MP3 locally; no separate Google API charge for either format. MP3 conversion needs internet access once to load its encoder.</p>
          {audioBlob ? <div className="hoeren-output">
            <h3>3. Preview and download</h3>
            <audio controls preload="metadata" src={audioUrl} aria-label="Preview generated Hören recording" />
            <p>{(audioBlob.size / 1_000_000).toFixed(1)} MB · WAV · 24 kHz</p>
            <div className="hoeren-downloads">
              {questions.length && !reviewedQuestions.error ? <button type="button" className="hoeren-quiet" onClick={() => downloadFile(JSON.stringify({ level, examPart, title: topic, kind: questionKind, questions: reviewedQuestions.data }, null, 2), `${filename}-questions-key.json`, "application/json")}>Download questions &amp; answer key</button> : null}
              <button type="button" className="hoeren-button" disabled={!!busy} onClick={downloadMp3}>{busy === "mp3" ? "Converting to MP3…" : "Download MP3"}</button>
              <button type="button" className="hoeren-quiet" disabled={!!busy} onClick={() => downloadFile(audioBlob, `${filename}.wav`, "audio/wav")}>Download WAV</button>
              <button type="button" className="hoeren-quiet" onClick={() => downloadFile(script, `${filename}.txt`, "text/plain;charset=utf-8")}>Download transcript</button>
            </div>
          </div> : <div className="hoeren-placeholder">Your approved recording will appear here for playback and download.</div>}
        </section>
      </div>
      <section className="hoeren-panel">
        <h2>4. Teacher approval &amp; publish to Course Book</h2>
        {questionCount !== 5 || !["A1", "A2", "B1"].includes(level) ? <p className="hoeren-hint">This {level} {selectedProfile?.examLabel || "Teil"} {examPart} template supports creation and local export. Direct Course Book publishing is disabled until the student player can handle this exercise format.</p> : null}
        <p className="hoeren-hint">Publish only after listening to the final MP3 and checking all answers. Course Book publishing currently supports five-question A1–B1 activities; higher-level or longer exam Teils can be downloaded but not yet published. This does not overwrite existing tutor assignments.</p>
        <div className="hoeren-input-grid">
          <label>Falowen level
            <input value={level} readOnly aria-label="Selected course level" />
          </label>
          <label>Course Book day
            <select value={availableDays.includes(Number(publishDay)) ? String(publishDay) : ""} disabled={!!busy || !availableDays.length}
              onChange={e => {
                const day = Number(e.target.value);
                const first = courseLessons.find(item => item.level === level && Number(item.day) === day);
                setPublishDay(day); setAssignmentKey(first?.assignmentKey || "");
                setTeacherApproved(false); setPublished(null);
              }}>
              <option value="">Select day</option>
              {availableDays.map(day => <option key={day} value={day}>Day {day}</option>)}
            </select>
          </label>
        </div>
        <label>Falowen assignment
          <select value={selectedAssignment ? assignmentKey : ""} disabled={!!busy || !filteredAssignments.length}
            onChange={e => { setAssignmentKey(e.target.value); setTeacherApproved(false); setPublished(null); }}>
            <option value="">Select assignment</option>
            {filteredAssignments.map(item => <option key={item.assignmentKey} value={item.assignmentKey}>
              {item.assignmentKey} · {item.title}
            </option>)}
          </select>
        </label>
        {courseLessonsError ? <p className="hoeren-validation" role="alert">{courseLessonsError}</p> : null}
        {selectedAssignment ? <p className="hoeren-hint">Course Book: {selectedAssignment.route}</p> : null}
        <label className="hoeren-effect-option">
          <input type="checkbox" checked={teacherApproved} disabled={!!busy || !audioBlob || !!reviewedQuestions.error || !questionsMatchScript}
            onChange={e => setTeacherApproved(e.target.checked)} />
          I listened to the full recording and personally checked all five questions, answers and quotes.
        </label>
        <button type="button" className="hoeren-button" disabled={!canPublish} onClick={publishToCourseBook}>
          {busy === "publish" ? "Publishing to Falowen…" : "Publish approved MP3 + 5 questions"}
        </button>
        {published ? <div className="hoeren-output" role="status">Published to {published.assignmentKey} · Day {published.day} · Revision {published.revision.slice(0, 8)}. The student practice will appear in the Course Book.</div> : null}
        <p className="hoeren-hint">No Google generation occurs during publishing. Cloudflare R2 and Firebase may charge their normal storage or request costs.</p>
      </section>
      <p className="hoeren-footer">Practice recordings are original teaching materials and not official Goethe-Institut exam audio. Listen and check all numbers, names and pronunciation before use.</p>
    </div>
  );
}

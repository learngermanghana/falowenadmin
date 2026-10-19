import { useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "../context/ToastContext";
import { getStudioStatus, makeListeningScript, makeSpeechClip, makeListeningQuestions, publishListeningLesson, getHoerenPublishCatalog } from "../services/hoerenStudioService";
import { QUESTION_KINDS, validateDraftQuestions } from "../utils/hoerenQuestions";
import { inspectHoerenDraft } from "../utils/hoerenDraftQuality.js";
import { getStudioCourseCatalog, getStudioCourseContext, resolveStudioCourseModeLesson } from "../utils/hoerenCourseCatalog.js";
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

function SpeechSegmentEditor({ line, index, onSave, hasAudio, disabled }) {
  const [text, setText] = useState(line.text);
  const [speaker, setSpeaker] = useState(line.speaker);
  useEffect(() => { setText(line.text); setSpeaker(line.speaker); }, [line.text, line.speaker]);
  const dirty = text !== line.text || speaker !== line.speaker;
  return <div className="hoeren-segment">
    <div className="hoeren-segment-top">
      <strong>Voice segment {index + 1}</strong>
      <span>{hasAudio ? "Voice cached · free to reuse" : "Voice not yet generated"}</span>
    </div>
    <label>Speaker <select value={speaker} disabled={disabled} onChange={e => setSpeaker(e.target.value)}>
      <option value="A">A</option><option value="B">B</option><option value="C">C</option>
    </select></label>
    <label>Spoken words <textarea rows={2} value={text} disabled={disabled} maxLength={320} onChange={e => setText(e.target.value)} /></label>
    <div className="hoeren-segment-bottom">
      <small>{text.length}/320 characters</small>
      <button type="button" className="hoeren-quiet" disabled={disabled || !dirty || !text.trim()} onClick={() => onSave(index, text, speaker)}>Apply sentence edit</button>
    </div>
  </div>;
}

export default function HoerenStudioPage() {
  const toast = useToast();
  const [mode, setMode] = useState("course");
  const [level, setLevel] = useState("A1");
  const [examPart, setExamPart] = useState("");
  const [type, setType] = useState("dialogue");
  const [topic, setTopic] = useState("Wechselpräpositionen und Dativpräpositionen");
  const [engine, setEngine] = useState("lite");
  const [script, setScript] = useState("");
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
  const voiceClipCache = useRef(new Map());
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
  const [lessonSearch, setLessonSearch] = useState("");

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
  const selectedProfile = mode === "goethe" ? (status?.profiles?.[level]?.[examPart] || null) : null;
  const questionCount = selectedProfile?.questionCount || 5;
  const ready = Boolean(status?.ready);
  const filename = safeFileName(level, topic, examPart);
  const reviewedQuestions = useMemo(() => {
    try { return { data: validateDraftQuestions({ script, questions, kind: questionKind, expectedCount: questionCount }), error: "" }; }
    catch (error) { return { data: [], error: error.message }; }
  }, [script, questions, questionKind, questionCount]);
  const questionsMatchScript = questionScript === script;
  const draftAudit = useMemo(() => inspectHoerenDraft({
    script, kind: questionKind, questions, expectedCount: questionCount,
    profile: selectedProfile, mode, questionScript,
  }), [script, questionKind, questions, questionCount, selectedProfile, mode, questionScript]);
  const clipKey = line => JSON.stringify([engine, line.speaker, line.text]);
  const cachedVoiceCount = spokenLines.filter(line => voiceClipCache.current.has(clipKey(line))).length;
  const missingVoiceKeys = [...new Set(spokenLines.map(clipKey))].filter(key => !voiceClipCache.current.has(key));
  const clipsToGenerate = missingVoiceKeys.length;
  // The complete dictionary is the browsing source; the student API only
  // confirms which lessons currently support direct publication.
  const courseCatalog = useMemo(() => getStudioCourseCatalog(level, courseLessons), [level, courseLessons]);
  const selectedCourseEntry = courseCatalog.find(entry => entry.assignmentKey.toUpperCase() === assignmentKey.toUpperCase()) || null;
  const selectedAssignment = selectedCourseEntry?.publishable
    ? courseLessons.find(item => String(item.level).toUpperCase() === level &&
        String(item.assignmentKey).toUpperCase() === selectedCourseEntry.assignmentKey.toUpperCase() &&
        Number(item.day) === selectedCourseEntry.publishDay)
    : null;
  const filteredCatalog = courseCatalog.filter(entry => {
    const query = lessonSearch.toLocaleLowerCase().trim();
    return !query || [entry.assignmentKey, entry.chapter, entry.title, entry.germanTitle, entry.englishTitle]
      .some(value => String(value || "").toLocaleLowerCase().includes(query));
  });
  const canPublish = !!audioBlob && !!reviewedQuestions.data.length && questionsMatchScript &&
    teacherApproved && !busy && mode === "course" && ["A1", "A2", "B1"].includes(level) && questionCount === 5 &&
    !!selectedAssignment && !!selectedCourseEntry?.publishable && Number(publishDay) === Number(selectedCourseEntry.publishDay) && Number.isInteger(Number(publishDay));
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
  function chooseCourseLesson(nextKey, nextLevel = level) {
    const choice = getStudioCourseCatalog(nextLevel, courseLessons).find(entry =>
      entry.assignmentKey.toUpperCase() === String(nextKey || "").toUpperCase());
    setLevel(nextLevel);
    setLessonSearch("");
    setAssignmentKey(choice?.assignmentKey || "");
    setPublishDay(choice?.publishDay ?? choice?.day ?? 0);
    setTopic(choice?.germanTitle || "");
    setScript("");
    setQuestions([]); setQuestionScript(""); setTeacherApproved(false); setPublished(null);
    clearAudio();
  }
  function changeProductionMode(nextMode) {
    if (nextMode === mode) return;
    setMode(nextMode);
    if (nextMode === "goethe") {
      const examLevel = level === "A1" ? "A2" : level;
      setLevelAndPart(examLevel, "1");
    } else {
      setExamPart("");
      setType("dialogue"); setQuestionKind("richtig-falsch"); setRepeats(2);
      const courseLesson = resolveStudioCourseModeLesson(level, assignmentKey, courseLessons);
      chooseCourseLesson(courseLesson?.assignmentKey);
    }
  }
  function updateSpokenSegment(spokenIndex, text, speaker) {
    if (!text.trim() || text.trim().length > 320) {
      toast.error("A spoken segment needs 1–320 characters.");
      return;
    }
    let index = 0;
    const changed = transcript.lines.map(line => {
      if (line.type === "pause") return `[PAUSE ${line.seconds}]`;
      const newLine = index === spokenIndex ? `${speaker}: ${text.trim()}` : `${line.speaker}: ${line.text}`;
      index += 1;
      return newLine;
    }).join("\n");
    setScript(changed); setTeacherApproved(false); setPublished(null); clearAudio();
    toast.success("Sentence updated. Unchanged voice clips remain cached.");
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
      const result = await makeListeningScript({ topic, type, level, part: mode === "goethe" ? examPart : "", mode, kind: questionKind,
        lessonContext: mode === "course" ? getStudioCourseContext(selectedCourseEntry) : null });
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
      const result = await makeListeningQuestions({ script, kind: questionKind, level, part: mode === "goethe" ? examPart : "", mode,
        lessonContext: mode === "course" ? getStudioCourseContext(selectedCourseEntry) : null });
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
          title: selectedCourseEntry?.germanTitle || topic.trim(), script, kind: questionKind,
          questions: reviewedQuestions.data, teacherApproved,
        },
      });
      setPublished(result);
      toast.success("Published! The reviewed questions are now available in the selected Course Book lesson.");
    } catch (error) { toast.error(error.message); }
    finally { setBusy(""); setProgress(""); }
  }
  async function generateAudio() {
    if (!ready || !!busy || !draftAudit.readyForVoice) {
      toast.error(draftAudit.errors[0] || "Finish the exam questions before making audio.");
      return;
    }
    if (clipsToGenerate > (status?.remaining.speech ?? 0)) {
      toast.error(`You need ${clipsToGenerate} new voice clips but only ${status?.remaining.speech ?? 0} remain today.`);
      return;
    }
    setBusy("audio"); setProgress(""); clearAudio();
    try {
      const clips = [];
      const newKeys = new Set();
      for (const [index, line] of spokenLines.entries()) {
        const key = clipKey(line);
        let wav = voiceClipCache.current.get(key);
        if (!wav) {
          setProgress(`Generating missing voice segment ${index + 1} of ${spokenLines.length}…`);
          const reply = await makeSpeechClip({ text: line.text, speaker: line.speaker, engine });
          wav = base64WavToBytes(reply.audioBase64);
          voiceClipCache.current.set(key, wav);
          newKeys.add(key);
          setStatus(previous => previous && ({ ...previous, remaining: { ...previous.remaining, speech: reply.remaining } }));
        } else {
          setProgress(`Reusing previously generated segment ${index + 1} of ${spokenLines.length}…`);
        }
        clips.push(wav);
      }
      setGeneratedClips(clips);
      setProgress("Assembling recording using cached and new voices…");
      const blob = await assembleCachedClips(clips);
      setAudioBlob(blob);
      setAudioUrl(URL.createObjectURL(blob));
      toast.success(`Recording ready. Reused ${spokenLines.length - newKeys.size} segment(s); generated ${newKeys.size} new voice clip(s).`);
    } catch (error) {
      toast.error(`${error.message} Successful clips were cached in this browser session and can be reused.`);
    } finally { setBusy(""); setProgress(""); await reloadStatus(); }
  }

  async function remixWithoutGoogle() {
    if (!generatedClips?.length) return;
    setBusy("remix");
    setProgress("Mixing existing voices without Google API requests…");
    try {
      const clips = spokenLines.map(line => voiceClipCache.current.get(clipKey(line)));
      if (clips.some(clip => !clip)) throw new Error("One or more sentence recordings have changed. Generate the missing clips first.");
      const blob = await assembleCachedClips(clips);
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
        <p>Make everyday Course Book audio or build Goethe-style Hören practice automatically from a selected level and exam Teil. Edit only the sentences that need new voices.</p>
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
      <section className="hoeren-mode-picker" aria-label="Audio production workflow">
        <button type="button" className={`hoeren-mode-choice ${mode === "course" ? "is-active" : ""}`}
          aria-pressed={mode === "course"} disabled={!!busy} onClick={() => changeProductionMode("course")}>
          <strong>Course Book Audio</strong>
          <span>Flexible German listening activities for everyday Falowen assignments. Choose the question format when needed.</span>
        </button>
        <button type="button" className={`hoeren-mode-choice ${mode === "goethe" ? "is-active" : ""}`}
          aria-pressed={mode === "goethe"} disabled={!!busy || !status?.profiles} onClick={() => changeProductionMode("goethe")}>
          <strong>Goethe Exam Audio</strong>
          <span>Pick a CEFR level and Teil. Questions, format and replay settings follow the exam template automatically.</span>
        </button>
      </section>
      <div className="hoeren-columns">
        <section className="hoeren-panel">
          <h2>1. {mode === "goethe" ? "Select the Goethe exam Teil" : "Prepare Course Book audio"}</h2>
          <div className="hoeren-input-grid">
            <label>German level<select value={level} disabled={!!busy} onChange={event => {
              const next = event.target.value;
              if (mode === "goethe") setLevelAndPart(next, "1");
              else {
                const first = getStudioCourseCatalog(next, courseLessons).find(entry => entry.chapter !== "0");
                chooseCourseLesson(first?.assignmentKey, next);
              }
            }}>{LEVELS.filter(choice => mode === "course" || choice !== "A1").map(choice => <option key={choice}>{choice}</option>)}</select></label>
            {mode === "goethe" ? <label>Hören {level === "C2" ? "Aufgabe" : "Teil"}
              <select value={examPart} disabled={!!busy || !status?.profiles?.[level]} onChange={event => setLevelAndPart(level, event.target.value)}>
                {Object.entries(status?.profiles?.[level] || {}).map(([part, profile]) => <option key={part} value={part}>{profile.examLabel} {part} · {profile.label}</option>)}
              </select>
            </label> : <label>Recording type<select value={type} disabled={!!busy} onChange={event => setTypeAndTemplate(event.target.value)}>
              {Object.entries(TYPE_LABELS).map(([value, name]) => <option key={value} value={value}>{name}</option>)}
            </select></label>}
          </div>
          {selectedProfile ? <div className="hoeren-placeholder">
            <strong>{level} Hören · {selectedProfile.examLabel} {examPart} — {selectedProfile.label}</strong>
            <p>{selectedProfile.structure}</p>
            <p>{questionCount} questions · {selectedProfile.repeats === 1 ? "Listen once" : "Listen twice"} · target ~{selectedProfile.wordTarget} spoken words. Original Falowen practice, not an official Goethe recording.</p>
            {level === "C1" && examPart === "1" ? <p><strong>Book matching:</strong> 3 original books (Buch 1, Buch 2, Buch 3), 6 statements, one play. Exam reading time: 60 seconds.</p> : null}
          </div> : null}
          {mode === "course" ? <div className="hoeren-course-destination">
            <h3>Choose a Course Book chapter by title</h3>
            <p className="hoeren-hint">All {courseCatalog.length} {level} dictionary lessons are available for generating audio, including chapters not yet in the student publish catalogue. The lesson title and ID guide the AI automatically.</p>
            <label>Search chapter, lesson title or assignment ID
              <input type="search" value={lessonSearch} disabled={!!busy}
                onChange={e => setLessonSearch(e.target.value)}
                placeholder="e.g. B1-10.28, Klimafreundlich leben" />
            </label>
            <label>Dictionary lesson title
              <select value={filteredCatalog.some(item => item.assignmentKey === assignmentKey) ? assignmentKey : ""}
                disabled={!!busy || !courseCatalog.length}
                onChange={e => chooseCourseLesson(e.target.value)}>
                <option value="">Select a lesson by title</option>
                {filteredCatalog.map(item => <option key={item.assignmentKey} value={item.assignmentKey}>{item.label}</option>)}
              </select>
            </label>
            {filteredCatalog.length === 0 ? <p className="hoeren-hint">No matching titles. Clear your search to show the complete dictionary.</p> : null}
            {selectedCourseEntry ? <div className="hoeren-exam-schema">
              <strong>{selectedCourseEntry.assignmentKey} · {selectedCourseEntry.germanTitle}</strong>
              <p>Chapter {selectedCourseEntry.chapter} · {selectedCourseEntry.englishTitle}</p>
              <p>{selectedCourseEntry.publishable && ["A1", "A2", "B1"].includes(level)
                ? "This lesson has a supported student publishing destination."
                : "Available for script, questions and audio export. Direct publishing is not available for this lesson."}</p>
              {selectedCourseEntry.publishRoute ? <p>Course Book location: {selectedCourseEntry.publishRoute}</p> : null}
            </div> : null}
            {courseLessonsError ? <p className="hoeren-hint">Publishing status unavailable: {courseLessonsError}. The full course dictionary remains available for audio creation.</p> : null}
          </div> : <div className="hoeren-exam-schema">
            <strong>Goethe Hören preset is locked</strong>
            <p>{selectedProfile ? `${selectedProfile.questionCount} questions · ${QUESTION_KINDS[selectedProfile.kind]} · play ${selectedProfile.repeats === 1 ? "once" : "twice"}` : "Select an exam Teil to load its rules."}</p>
          </div>}
          <div className="hoeren-input-grid">
            <label>Recording style<input value={selectedProfile?.type || type} readOnly /></label>
            <label>Voice segments budget<input value={`Up to 18 speech clips · ${status?.remaining.speech ?? "—"} left today`} readOnly /></label>
          </div>
          <label>{mode === "course" ? "Lesson-aligned audio topic (optional subtopic)" : "Topic for an original exam script"}<input value={topic} disabled={!!busy} maxLength={240} onChange={(event) => { setTopic(event.target.value); clearAudio(); }} placeholder="e.g. Shopping at a supermarket" /></label>
          <button className="hoeren-button" type="button" disabled={!ready || !!busy || topic.trim().length < 4 || !status?.remaining.script || (mode === "goethe" && !selectedProfile) || (mode === "course" && !selectedCourseEntry)} onClick={generateScript}>{busy === "script" ? "Generating script…" : mode === "goethe" ? "Generate complete Goethe task" : "Generate Course Book script + questions"}</button>
          <p className="hoeren-hint">{mode === "course" ? "The selected dictionary chapter, assignment ID and German/English titles are passed to the AI so the recording and questions stay aligned with that course lesson." : "You can also write or paste your own script without spending a script-generation request."}</p>
          <label>Transcript — edit before creating audio
            <textarea rows={13} spellCheck lang="de" value={script} disabled={!!busy} onChange={(event) => { setScript(event.target.value); setTeacherApproved(false); setPublished(null); clearAudio(); }} />
          </label>
          <p className="hoeren-hint"><strong>Transcript format:</strong> Start spoken segments with <code>A:</code>, <code>B:</code> or <code>C:</code>. Add <code>[PAUSE 3]</code> on its own line. A, B and C use distinct voices.</p>
          {!transcript.error && spokenLines.length ? <details className="hoeren-sentence-editor">
            <summary>Edit individual voice segments · reuse unchanged audio</summary>
            <p className="hoeren-hint">Apply a correction to just one sentence. Previously generated unchanged speech stays cached in this browser session, so only changed sentences need another Google request. Keep the transcript and questions aligned.</p>
            {spokenLines.map((line, index) => <SpeechSegmentEditor key={index} line={line} index={index}
              onSave={updateSpokenSegment} disabled={!!busy} hasAudio={voiceClipCache.current.has(clipKey(line))} />)}
          </details> : null}
          {transcript.error ? <p className="hoeren-validation" role="alert">{transcript.error}</p> : <p className="hoeren-hint">{spokenLines.length} spoken lines · {transcript.lines.filter((line) => line.type === "pause").length} custom pauses</p>}
          <fieldset className="hoeren-fieldset">
            <legend>{mode === "goethe" ? "2. Review automatic Goethe questions" : "2. Generate & review Course Book questions"}</legend>
            {mode === "course" ? <label>Question format
              <select value={questionKind} disabled={!!busy} onChange={(event) => {
                setQuestionKind(event.target.value); setQuestions([]); setQuestionScript(""); setTeacherApproved(false); setPublished(null);
              }}>{Object.entries(QUESTION_KINDS).map(([kind, label]) => <option key={kind} value={kind}>{label}</option>)}</select>
            </label> : <div className="hoeren-exam-schema">
              <strong>Preset · {questionCount} questions · {QUESTION_KINDS[questionKind]}</strong>
              <p>The selected Goethe {level === "C2" ? "Aufgabe" : "Teil"} determines the question type and number automatically. No manual format selection.</p>
            </div>}
            <p className="hoeren-hint">AI creates the script and questions together in one request. Regenerating questions from edited text uses one of your five daily script requests. Review the answer key and evidence before using any activity.</p>
            <button type="button" className="hoeren-quiet" disabled={!ready || !!busy || !status?.remaining.script || script.trim().length < 35} onClick={generateQuestions}>
              {busy === "questions" ? "Creating questions…" : `Generate ${questionCount} questions · one script quota`}
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
            {mode === "course" ? <label>Play the full audio<select value={repeats} disabled={!!busy} onChange={(event) => { setRepeats(Number(event.target.value)); clearAudio(true); }}><option value={1}>Once</option><option value={2}>Twice</option></select></label> : <div className="hoeren-exam-schema"><strong>Exam playback: {repeats === 1 ? "Once" : "Twice"}</strong><p>Chosen automatically for this Goethe Teil.</p></div>}
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
          <div className="hoeren-quality" role="status">
            <h3>{mode === "goethe" ? "Pre-audio exam quality check" : "Pre-audio checks"}</h3>
            <p>{draftAudit.wordCount} spoken words · {spokenLines.length} voice segments · {draftAudit.pauseCount} pauses</p>
            {draftAudit.errors.map((issue, i) => <p key={`error-${i}`} className="hoeren-validation">Fix: {issue}</p>)}
            {draftAudit.warnings.map((issue, i) => <p key={`warn-${i}`} className="hoeren-hint">Review: {issue}</p>)}
            {!draftAudit.errors.length ? <p className="hoeren-hint">Structure checks passed. Correct answers and pronunciation still need a teacher review.</p> : null}
          </div>
          <div className="hoeren-exam-schema">
            <strong>Audio cost preview</strong>
            <p>{cachedVoiceCount} of {spokenLines.length} voice segments already cached · {clipsToGenerate} new speech request(s) needed · {status?.remaining.speech ?? "—"} remain today.</p>
          </div>
          <div className="hoeren-divider" />
          {generatedClips?.length && !audioBlob ? <button type="button" className="hoeren-button" disabled={!!busy} onClick={remixWithoutGoogle}>Remix existing recording · no Gemini credits</button> : null}
          <button type="button" className="hoeren-button" disabled={!ready || !!busy || !draftAudit.readyForVoice || clipsToGenerate > (status?.remaining.speech ?? 0)} onClick={generateAudio}>
            {busy === "audio" ? "Preparing German audio…" : clipsToGenerate ? `Generate ${clipsToGenerate} missing voice clip(s)` : "Assemble saved voices · no Gemini credits"}
          </button>
          {progress ? <p role="status" aria-live="polite">{progress}</p> : null}
          {!transcript.error && spokenLines.length > 18 ? <p className="hoeren-validation">Maximum 18 spoken lines per recording, to prevent accidental high-cost requests.</p> : null}
          <p className="hoeren-hint">Audio and atmosphere are mixed in your browser. Download WAV or convert to MP3 locally; no separate Google API charge for either format. MP3 conversion needs internet access once to load its encoder.</p>
          {audioBlob ? <div className="hoeren-output">
            <h3>3. Preview and download</h3>
            <audio controls preload="metadata" src={audioUrl} aria-label="Preview generated Hören recording" />
            <p>{(audioBlob.size / 1_000_000).toFixed(1)} MB · WAV · 24 kHz</p>
            <div className="hoeren-downloads">
              {questions.length && !reviewedQuestions.error ? <button type="button" className="hoeren-quiet" onClick={() => downloadFile(JSON.stringify({ mode, level, examPart, title: topic, kind: questionKind, questions: reviewedQuestions.data }, null, 2), `${filename}-questions-key.json`, "application/json")}>Download questions &amp; answer key</button> : null}
              <button type="button" className="hoeren-button" disabled={!!busy} onClick={downloadMp3}>{busy === "mp3" ? "Converting to MP3…" : "Download MP3"}</button>
              <button type="button" className="hoeren-quiet" disabled={!!busy} onClick={() => downloadFile(audioBlob, `${filename}.wav`, "audio/wav")}>Download WAV</button>
              <button type="button" className="hoeren-quiet" onClick={() => downloadFile(script, `${filename}.txt`, "text/plain;charset=utf-8")}>Download transcript</button>
            </div>
          </div> : <div className="hoeren-placeholder">Your approved recording will appear here for playback and download.</div>}
        </section>
      </div>
      {mode === "course" ? <section className="hoeren-panel">
        <h2>4. Teacher approval &amp; publish to Course Book</h2>
        {!["A1", "A2", "B1"].includes(level) ? <p className="hoeren-hint">This Course Book level can export audio, but direct publishing is currently supported only for A1–B1 activities.</p> : null}
        <p className="hoeren-hint">Publish only after listening to the final MP3 and checking all answers. Course Book publishing currently supports five-question A1–B1 activities; higher-level or longer exam Teils can be downloaded but not yet published. This does not overwrite existing tutor assignments.</p>
        <label className="hoeren-effect-option">
          <input type="checkbox" checked={teacherApproved} disabled={!!busy || !audioBlob || !!reviewedQuestions.error || !questionsMatchScript}
            onChange={e => setTeacherApproved(e.target.checked)} />
          I listened to the recording and checked the five Course Book questions, correct answers and supporting quotes.
        </label>
        <button type="button" className="hoeren-button" disabled={!canPublish} onClick={publishToCourseBook}>
          {busy === "publish" ? "Publishing to Falowen…" : "Publish approved MP3 + 5 questions"}
        </button>
        {published ? <div className="hoeren-output" role="status">Published to {published.assignmentKey} · Day {published.day} · Revision {published.revision.slice(0, 8)}. The student practice will appear in the Course Book.</div> : null}
        <p className="hoeren-hint">No Google generation occurs during publishing. Cloudflare R2 and Firebase may charge their normal storage or request costs.</p>
      </section> : <section className="hoeren-panel">
        <h2>4. Download Goethe exam materials</h2>
        <p className="hoeren-hint">This Goethe exam builder prepares downloadable audio, transcript and question key. Direct Exams Room publication is not yet supported for these preset formats. Nothing is uploaded automatically.</p>
        <p className="hoeren-hint">For a full exam set, prepare each Teil separately. Teachers should verify the correct answers, task authenticity and recording quality.</p>
      </section>}
      <p className="hoeren-footer">Practice recordings are original teaching materials and not official Goethe-Institut exam audio. Listen and check all numbers, names and pronunciation before use.</p>
    </div>
  );
}

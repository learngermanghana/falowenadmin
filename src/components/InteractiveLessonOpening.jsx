import { useEffect, useRef, useState } from "react";
import { auth } from "../firebaseAuth.js";
import "./A2Day17Activities.css";
import { getInteractiveLessonOpening } from "../data/interactiveLessonOpenings.js";
import MusicVideoEmbed from "./MusicVideoEmbed.jsx";

// Classroom audio URLs are signed by the current Cloud Run API deployed in
// europe-west1, not the older us-central1 Cloud Functions endpoint. The
// private R2 bucket remains protected and no public audio URLs are embedded.
const AUDIO_API = (import.meta.env.VITE_FALOWEN_COURSE_MEDIA_API_URL
  || "https://api-awc2au65xa-ew.a.run.app").replace(/[/]+$/, "");

function RevealPanel({ activity, swahili = false }) {
  return <div className="pharm-reveal" role="status">
    <span className="pharm-eyebrow">{swahili ? "JIBU SAHIHI" : activity.openResponse ? "BESPRECHUNGSHINWEIS" : "MUSTERLÖSUNG"}</span>
    <p className="pharm-answer">{activity.answer}</p>
    {activity.explanation && <small>{activity.explanation}</small>}
  </div>;
}

export default function InteractiveLessonOpening({ stage, slide }) {
  const swahili = stage.type === "classroom-listening" && slide?.course === "SWAHILI";
  const lesson = swahili ? { title: stage.title, listening: stage.listening } : getInteractiveLessonOpening(slide?.assignmentId);
  const tr = (de, sw) => swahili ? sw : de;
  const listening = stage.id === "knowledge" && Boolean(lesson?.listening);
  const music = listening && lesson.listening.mediaType === "music";
  const [step, setStep] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [selected, setSelected] = useState(-1);
  const [audioUrl, setAudioUrl] = useState("");
  const [audioError, setAudioError] = useState("");
  const [audioBusy, setAudioBusy] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [autoReview, setAutoReview] = useState(false);
  const requestCounter = useRef(0);
  const audioRef = useRef(null);

  useEffect(() => {
    setStep(0); setShowAnswer(false); setShowHint(false); setShowTranscript(false);
    setSelected(-1); setAudioUrl(""); setAudioError(""); setAudioBusy(false);
    setReviewMode(false); setAutoReview(false);
    requestCounter.current += 1;
  }, [slide?.assignmentId, stage.id, stage.variant]);

  const items = listening ? (stage.listeningItems?.length ? stage.listeningItems : lesson?.listening?.questions || []) : (stage.challengeItems?.length ? stage.challengeItems : lesson?.warmup || []);
  const activity = items[step] || items[0];
  if (!lesson || !activity) return null;

  function chooseStep(n) {
    setStep(Math.max(0, Math.min(items.length - 1, n)));
    setShowAnswer(false); setShowHint(false); setSelected(-1);
  }

  async function prepareAudio() {
    if (!listening || !lesson?.listening?.audioKey) return;
    const requestId = ++requestCounter.current;
    setAudioBusy(true);
    setAudioError("");
    try {
      const user = auth.currentUser;
      if (!user) throw new Error(tr("Bitte zuerst in Falowen Admin anmelden.", "Ingia kwenye Falowen Admin kwanza."));
      const params = new URLSearchParams({ day: String(lesson.listening.day), key: lesson.listening.audioKey });
      // B1 Day 25 is a separate, private classroom conversation. The old
      // Cloud Run B1 signer lacks storage configuration, so use the already
      // configured Falowen R2 server with an exact-key teacher-only allowlist.
      // Keep other B1 workbook and course signing routes unchanged.
      const isB1Day25Classroom = lesson.listening.level === "B1"
        && lesson.listening.day === 25
        && lesson.listening.audioKey === "b1/day-25/online-shopping-verbraucherservice.mp3";
      // The Day 26 recording was deliberately uploaded under a2/day-26.
      // Route it as B1 Day 26 using only the exact teacher-approved object.
      const isB1Day26Classroom = lesson.listening.level === "B1"
        && lesson.listening.day === 26
        && lesson.listening.audioKey === "a2/day-26/reiseprobleme-und-losungen.mp3";
      const isB1Day27Classroom = lesson.listening.level === "B1"
        && lesson.listening.day === 27
        && lesson.listening.audioKey === "b1/day-27/umweltfreundlich-im-alltag.mp3";
      const isB1Day28Classroom = lesson.listening.level === "B1"
        && lesson.listening.day === 28
        && lesson.listening.audioKey === "b1/day-28/klimafreundlich-leben.mp3";
      const isB1Classroom = isB1Day25Classroom || isB1Day26Classroom || isB1Day27Classroom || isB1Day28Classroom;
      const isSwahiliClassroom = swahili && lesson.listening.level === "B1" && (
        (lesson.listening.day === 27 && lesson.listening.audioKey === "swahili/B1/day-27/kuntunza.mp3")
        || (lesson.listening.day === 28 && lesson.listening.audioKey === "swahili/B1/day-28/swahili-listening kuntasa.mp3")
      );
      const isSwahiliDay26Classroom = swahili && lesson.listening.level === "B1" && lesson.listening.day === 26 && lesson.listening.audioKey === "swahili/B1/day-26/swahili-listening matitizo.mp3";
      if (isB1Classroom) params.set("level", "B1");
      if (isSwahiliClassroom || isSwahiliDay26Classroom) params.set("level", "SWAHILI-B1");
      const audioEndpoint = isB1Classroom || isSwahiliClassroom || isSwahiliDay26Classroom
        ? "https://www.falowen.app/api/course-media/classroom/audio-url"
        : lesson.listening.level === "A2" && [1, 2, 3, 4, 5, 7, 8, 9, 10, 18, 19, 20, 21, 23, 24, 25, 26, 27, 28].includes(lesson.listening.day)
          ? "https://www.falowen.app/api/course-media/a2/classroom-audio-url"
          : `${AUDIO_API}/course-media/${lesson.listening.level.toLowerCase()}/audio-url`;
      const requestSignedAudio = async (endpoint) => {
        const response = await fetch(`${endpoint}?${params}`, {
          method: "GET",
          headers: { Authorization: `Bearer ${await user.getIdToken()}` },
          cache: "no-store",
        });
        const data = await response.json().catch(() => ({}));
        return { response, data };
      };
      let { response, data } = await requestSignedAudio(audioEndpoint);
      // The Falowen classroom allowlist may lag behind recently uploaded
      // lesson recordings. Try the existing authenticated Cloud Run signer
      // only for a missing/invalid classroom route; never expose the R2 key
      // through a public object URL or bypass staff authentication.
      const classroomSignerUnavailable = response.status === 404
        || (response.status === 400 && /invalid .*audio request/i.test(String(data.error || "")));
      if (lesson.listening.level === "A2" && classroomSignerUnavailable
          && audioEndpoint.includes("/a2/classroom-audio-url")) {
        const fallback = await requestSignedAudio(`${AUDIO_API}/course-media/a2/audio-url`);
        if (fallback.response.ok && fallback.data.url) {
          ({ response, data } = fallback);
        }
      }
      if (!response.ok || !data.url) {
        const reason = response.status === 400 && /invalid .*audio request/i.test(String(data.error || ""))
          ? "Die Audiofreigabe ist auf dem Server noch nicht aktiv. Bitte die API-Bereitstellung prüfen."
          : response.status === 404 && !data.error
            ? "Der Audio-Endpunkt ist auf dem Server nicht verfügbar (HTTP 404). Bitte die aktuelle Cloud-Run-API prüfen."
            : data.error || `Audio konnte nicht geladen werden (HTTP ${response.status}).`;
        throw new Error(swahili ? `Sauti haikupatikana (HTTP ${response.status}). Hakikisha API imewekwa na faili imeruhusiwa.` : reason);
      }
      if (requestId !== requestCounter.current) return;
      setAudioUrl(String(data.url));
    } catch (error) {
      if (requestId === requestCounter.current) setAudioError(error?.message || "Audio ist im Moment nicht erreichbar.");
    } finally {
      if (requestId === requestCounter.current) setAudioBusy(false);
    }
  }

  return <section className="pharm-activity" aria-label={music ? `${lesson.listening.title} Musik` : listening ? `${lesson.listening.title} ${tr("Hören", "Kusikiliza")}` : `${lesson.title} Warm-up`}>
    <div className="pharm-head">
      <div>
        <span className="pharm-eyebrow">{swahili ? "KISWAHILI B1 · SOMO LA" : `${slide.course} · TAG`} {slide.dayNumber} · {swahili ? "KUSIKILIZA" : music ? "MUSIK / LIED VERSTEHEN" : listening ? "HÖREN / HÖRDETEKTIV" : "INTERAKTIVER WARM-UP"}</span>
        <h1>{listening ? lesson.listening.title : lesson.title}</h1>
      </div>
    </div>
    {listening && <div className="pharm-audio">
      <div className="pharm-audio-label"><span aria-hidden="true">♫</span><div><strong>{lesson.listening.title}</strong><small>{music ? "Höre das Lied und beantworte die Fragen. Das Video zeigt den Liedtext." : tr("Lies zuerst die Fragen. Höre danach ohne das Skript zu.", "Soma maswali kwanza. Sikiliza bila kusoma maandishi.")}</small></div></div>
      {lesson.listening.playbackNote ? <p className="pharm-playback-note" role="note">{lesson.listening.playbackNote} · {tr("Fragen bleiben während des Abspielens sichtbar.", "Maswali yanabaki wazi wakati wa kusikiliza.")}</p> : null}
      {lesson.listening.youtubeId ? (
        <MusicVideoEmbed videoId={lesson.listening.youtubeId} title={lesson.listening.title} variant="listening" />
      ) : !audioUrl ? (
        <button type="button" className="pharm-btn pharm-btn-primary" onClick={prepareAudio} disabled={audioBusy}>{audioBusy ? tr("Audio wird vorbereitet…", "Sauti inaandaliwa…") : tr("▶ Audio laden", "▶ Pakia sauti")}</button>
      ) : <>
        <audio key={audioUrl} ref={audioRef} src={audioUrl} controls preload="none" aria-label={`${lesson.listening.title} Audio`} onError={() => setAudioError(tr("Der signierte Audiolink kann nicht abgespielt werden. Bitte prüfen, ob das R2-Objekt existiert und die Audiodatei verfügbar ist.", "Sauti haiwezi kuchezwa. Hakikisha faili ipo kwenye R2."))} onEnded={() => { if (autoReview) { setReviewMode(true); chooseStep(0); } }} />
        <button type="button" className="pharm-btn pharm-btn-soft" onClick={() => { audioRef.current?.pause(); setAudioUrl(""); prepareAudio(); }}>{tr("↻ Audiolink erneuern", "↻ Pakia sauti tena")}</button>
      </>}
      {audioError && <p className="pharm-audio-error" role="alert">{audioError} · R2-Objekt: {lesson.listening.audioKey}</p>}
      {lesson.listening.youtubeId
        ? <p className="pharm-playback-note">Nach dem Hören: Klick auf „Antworten einzeln besprechen“. Die Lösungen bleiben zunächst verborgen.</p>
        : <label className="pharm-review-checkbox"><input type="checkbox" checked={autoReview} onChange={(event) => setAutoReview(event.target.checked)} /> {tr("Nach Audioende automatisch zu Frage 1 wechseln (optional)", "Nenda kwenye swali la kwanza sauti ikiisha (hiari)")}</label>}
      {(stage.transcript?.length || lesson.listening.transcript?.length) ? (
        <details className="pharm-script" open={showTranscript} onToggle={(event) => setShowTranscript(event.currentTarget.open)}>
          <summary>{showTranscript ? (music ? "Liedtext-Auszüge ausblenden" : tr("Skript ausblenden", "Ficha maandishi")) : (music ? "Liedtext-Auszüge anzeigen" : tr("Skript für die Klasse anzeigen", "Onyesha maandishi ya mazungumzo"))} <span>OPTIONAL</span></summary>
          <div className="pharm-transcript" lang={swahili ? "sw" : "de"}>{(stage.transcript?.length ? stage.transcript : lesson.listening.transcript).map(([speaker, line],index)=>
            <p key={index}><b className={speaker === "A" ? "is-a" : "is-b"}>{speaker}</b> <span>{line}</span></p>
          )}</div>
        </details>
      ) : null}
    </div>}
    {(!listening || reviewMode) ? <>
    {listening && <button type="button" className="pharm-btn pharm-btn-soft" onClick={() => setReviewMode(false)}>{music ? "← Alle Musikfragen anzeigen" : tr("← Alle Hörfragen anzeigen", "← Onyesha maswali yote")}</button>}
    <div className="pharm-progress" aria-label="Activity step selection">
      {items.map((item,index)=><button type="button" key={index} className={index === step ? "is-current" : index < step ? "is-done" : ""} onClick={() => chooseStep(index)} aria-current={index === step ? "step" : undefined}>
        <span className="pharm-progress-bar" /><span>{index+1}{!listening ? ` · ${item.minutes} min` : ""}</span>
      </button>)}
    </div>
    <div className="pharm-challenge">
      <div className="pharm-challenge-kicker"><span>{tr("AUFGABE", "SWALI")} {step+1} / {items.length}</span><span>{music ? "LIED VERSTEHEN" : listening ? tr("HÖRVERSTEHEN", "KUSIKILIZA") : `${activity.minutes} MIN · ${activity.label.toUpperCase()}`}</span></div>
      {activity.context && <div className="pharm-context">{activity.context}</div>}
      <h2>{activity.prompt}</h2>
      {Array.isArray(activity.options) && <div className="pharm-options">
        {activity.options.map((option,index)=><button key={index} type="button" className={selected === index ? "is-picked" : ""} onClick={() => setSelected(index)} aria-pressed={selected === index}>
          <span>{String.fromCharCode(65+index)}</span>{option}
        </button>)}
      </div>}
      {Array.isArray(activity.lines) && <div className="pharm-lines">{activity.lines.map((line,index)=><p key={index}>{line}</p>)}</div>}
      {showAnswer && <RevealPanel activity={activity} swahili={swahili}/>}
      <div className="pharm-actions">
        <button type="button" className="pharm-btn pharm-btn-primary" onClick={() => setShowAnswer(!showAnswer)}>{showAnswer ? tr("Hinweis verbergen", "Ficha") : activity.openResponse ? "Besprechungshinweis zeigen" : tr("✓ Musterlösung zeigen", "✓ Onyesha jibu")}</button>
        <button type="button" className="pharm-btn pharm-btn-soft" onClick={() => setShowHint(!showHint)}>{showHint ? tr("Hinweis verbergen", "Ficha") : tr("💡 Lehrerhinweis", "💡 Dokezo")}</button>
      </div>
      {showHint && <p className="pharm-hint"><b>{tr("Lehrer:", "Dokezo:")}</b> {listening ? activity.hint : activity.teacherHint}</p>}
    </div>
    <div className="pharm-bottom">
      <button type="button" className="pharm-btn pharm-btn-soft" disabled={step===0} onClick={() => chooseStep(step-1)}>{tr("← Zurück", "← Rudi")}</button>
      <span>{step+1} / {items.length}</span>
      <button type="button" className="pharm-btn pharm-btn-next" onClick={() => chooseStep(step===items.length-1 ? 0 : step+1)}>{step===items.length-1 ? tr("Neu starten ↻", "Anza tena ↻") : tr("Nächste Aufgabe →", "Swali linalofuata →")}</button>
    </div>
    </> : <section className="pharm-overview" aria-label={tr("Alle Hörfragen vor dem Hören", "Maswali yote ya kusikiliza")}>
      <div className="pharm-overview-head"><div><span className="pharm-eyebrow">{music ? "VOR DEM LIED" : tr("VOR DEM HÖREN", "KABLA YA KUSIKILIZA")} · 1 MIN</span><h2>{tr("Lies zuerst alle Fragen", "Soma kauli zote kwanza")}</h2><p>{tr("Notiere nur kurze Antworten oder die Buchstaben – nicht die ganzen Fragen.", "Andika A au B kwa kila kauli.")}</p></div><button type="button" className="pharm-btn pharm-btn-primary" onClick={() => { setReviewMode(true); chooseStep(0); }}>{tr("Antworten einzeln besprechen →", "Jadili majibu moja baada ya jingine →")}</button></div>
      {lesson.listening.previewWords?.length ? <div className="pharm-word-list"><b>{tr("Wichtige Wörter:", "Maneno muhimu:")}</b> {lesson.listening.previewWords.map(word => <span key={word}>{word}</span>)}</div> : null}
      <ol className="pharm-question-overview">{items.map((q,index) => <li key={index}><strong>{index + 1}. {q.prompt}</strong><div>{(q.options || []).map((option,i) => <span key={i}>{String.fromCharCode(65+i)}. {option}</span>)}</div></li>)}</ol>
    </section>}
    <p className="pharm-footnote">{tr("Lehrer steuert die Antworten. Die Fragen wechseln nicht automatisch.", "Mwalimu anaongoza majibu. Maswali hayabadiliki yenyewe.")} {swahili ? "Zoezi la darasani; halina alama." : music ? "Musiktraining über YouTube – unbewertete Unterrichtsübung." : "Keine Schülerbewertung."}</p>
  </section>;
}

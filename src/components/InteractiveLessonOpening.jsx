import { useEffect, useRef, useState } from "react";
import { auth } from "../firebaseAuth.js";
import "./A2Day17Activities.css";
import { getInteractiveLessonOpening } from "../data/interactiveLessonOpenings.js";

const AUDIO_API = (import.meta.env.VITE_FALOWEN_COURSE_API_URL || "https://www.falowen.app/api").replace(/[/]+$/, "");

function RevealPanel({ activity }) {
  return <div className="pharm-reveal" role="status">
    <span className="pharm-eyebrow">MUSTERLÖSUNG</span>
    <p className="pharm-answer">{activity.answer}</p>
    {activity.explanation && <small>{activity.explanation}</small>}
  </div>;
}

export default function InteractiveLessonOpening({ stage, slide }) {
  const lesson = getInteractiveLessonOpening(slide?.assignmentId);
  const listening = stage.id === "knowledge" && Boolean(lesson?.listening);
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
      if (!user) throw new Error("Bitte zuerst in Falowen Admin anmelden.");
      const params = new URLSearchParams({ day: String(lesson.listening.day), key: lesson.listening.audioKey });
      const response = await fetch(`${AUDIO_API}/course-media/${lesson.listening.level.toLowerCase()}/audio-url?${params}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${await user.getIdToken()}` },
        cache: "no-store",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.url) throw new Error(data.error || `Audio konnte nicht geladen werden (HTTP ${response.status}).`);
      if (requestId !== requestCounter.current) return;
      setAudioUrl(String(data.url));
    } catch (error) {
      if (requestId === requestCounter.current) setAudioError(error?.message || "Audio ist im Moment nicht erreichbar.");
    } finally {
      if (requestId === requestCounter.current) setAudioBusy(false);
    }
  }

  return <section className="pharm-activity" aria-label={listening ? "Apotheken-Detektiv Hören" : "Apotheken-Challenge Warm-up"}>
    <div className="pharm-head">
      <div>
        <span className="pharm-eyebrow">{slide.course} · TAG {slide.dayNumber} · {listening ? "HÖREN / HÖRDETEKTIV" : "INTERAKTIVER WARM-UP"}</span>
        <h1>{listening ? lesson.listening.title : lesson.title}</h1>
        <p>{listening ? "Zuerst zuhören. Dann verstehen, entscheiden und begründen." : "Vier Aufgaben · eine Unterrichtsphase · gemeinsam sprechen."}</p>
      </div>
      <div className="pharm-duration"><strong>{stage.suggestedMinutes || (listening ? 6 : 10)}</strong><span>MINUTEN</span></div>
    </div>
    {listening && <div className="pharm-audio">
      <div className="pharm-audio-label"><span aria-hidden="true">♫</span><div><strong>{lesson.listening.title}</strong><small>Lies zuerst die Fragen. Höre danach ohne das Skript zu.</small></div></div>
      {!audioUrl ? (
        <button type="button" className="pharm-btn pharm-btn-primary" onClick={prepareAudio} disabled={audioBusy}>{audioBusy ? "Audio wird vorbereitet…" : "▶ Audio laden"}</button>
      ) : <>
        <audio key={audioUrl} ref={audioRef} src={audioUrl} controls preload="none" aria-label={`${lesson.listening.title} Audio`} onEnded={() => { if (autoReview) { setReviewMode(true); chooseStep(0); } }} />
        <button type="button" className="pharm-btn pharm-btn-soft" onClick={() => { audioRef.current?.pause(); setAudioUrl(""); prepareAudio(); }}>↻ Audiolink erneuern</button>
      </>}
      {audioError && <p className="pharm-audio-error" role="alert">{audioError} · R2-Objekt: {lesson.listening.audioKey}</p>}
      <label className="pharm-review-checkbox"><input type="checkbox" checked={autoReview} onChange={(event) => setAutoReview(event.target.checked)} /> Nach Audioende automatisch zu Frage 1 wechseln (optional)</label>
      <details className="pharm-script" open={showTranscript} onToggle={(event) => setShowTranscript(event.currentTarget.open)}>
        <summary>{showTranscript ? "Skript ausblenden" : "Skript für die Klasse anzeigen"} <span>OPTIONAL</span></summary>
        <div className="pharm-transcript" lang="de">{(stage.transcript?.length ? stage.transcript : lesson.listening.transcript).map(([speaker, line],index)=>
          <p key={index}><b className={speaker === "A" ? "is-a" : "is-b"}>{speaker}</b> <span>{line}</span></p>
        )}</div>
      </details>
    </div>}
    {(!listening || reviewMode) ? <>
    {listening && <button type="button" className="pharm-btn pharm-btn-soft" onClick={() => setReviewMode(false)}>← Alle Hörfragen anzeigen</button>}
    <div className="pharm-progress" aria-label="Activity step selection">
      {items.map((item,index)=><button type="button" key={index} className={index === step ? "is-current" : index < step ? "is-done" : ""} onClick={() => chooseStep(index)} aria-current={index === step ? "step" : undefined}>
        <span className="pharm-progress-bar" /><span>{index+1}{!listening ? ` · ${item.minutes} min` : ""}</span>
      </button>)}
    </div>
    <div className="pharm-challenge">
      <div className="pharm-challenge-kicker"><span>AUFGABE {step+1} VON {items.length}</span><span>{listening ? "HÖRVERSTEHEN" : `${activity.minutes} MIN · ${activity.label.toUpperCase()}`}</span></div>
      {activity.context && <div className="pharm-context">{activity.context}</div>}
      <h2>{activity.prompt}</h2>
      {Array.isArray(activity.options) && <div className="pharm-options">
        {activity.options.map((option,index)=><button key={index} type="button" className={selected === index ? "is-picked" : ""} onClick={() => setSelected(index)} aria-pressed={selected === index}>
          <span>{String.fromCharCode(65+index)}</span>{option}
        </button>)}
      </div>}
      {Array.isArray(activity.lines) && <div className="pharm-lines">{activity.lines.map((line,index)=><p key={index}>{line}</p>)}</div>}
      {showAnswer && <RevealPanel activity={activity}/>}
      <div className="pharm-actions">
        <button type="button" className="pharm-btn pharm-btn-primary" onClick={() => setShowAnswer(!showAnswer)}>{showAnswer ? "Lösung verbergen" : "✓ Musterlösung zeigen"}</button>
        <button type="button" className="pharm-btn pharm-btn-soft" onClick={() => setShowHint(!showHint)}>{showHint ? "Hinweis verbergen" : "💡 Lehrerhinweis"}</button>
      </div>
      {showHint && <p className="pharm-hint"><b>Lehrer:</b> {listening ? activity.hint : activity.teacherHint}</p>}
    </div>
    <div className="pharm-bottom">
      <button type="button" className="pharm-btn pharm-btn-soft" disabled={step===0} onClick={() => chooseStep(step-1)}>← Zurück</button>
      <span>{step+1} / {items.length}</span>
      <button type="button" className="pharm-btn pharm-btn-next" onClick={() => chooseStep(step===items.length-1 ? 0 : step+1)}>{step===items.length-1 ? "Neu starten ↻" : "Nächste Aufgabe →"}</button>
    </div>
    </> : <section className="pharm-overview" aria-label="Alle Hörfragen vor dem Hören">
      <div className="pharm-overview-head"><div><span className="pharm-eyebrow">VOR DEM HÖREN · 1 MINUTE</span><h2>Lies zuerst alle Fragen</h2><p>Notiere nur kurze Antworten oder die Buchstaben – nicht die ganzen Fragen.</p></div><button type="button" className="pharm-btn pharm-btn-primary" onClick={() => { setReviewMode(true); chooseStep(0); }}>Antworten einzeln besprechen →</button></div>
      {lesson.listening.previewWords?.length ? <div className="pharm-word-list"><b>Wichtige Wörter:</b> {lesson.listening.previewWords.map(word => <span key={word}>{word}</span>)}</div> : null}
      <ol className="pharm-question-overview">{items.map((q,index) => <li key={index}><strong>{index + 1}. {q.prompt}</strong><div>{(q.options || []).map((option,i) => <span key={i}>{String.fromCharCode(65+i)}. {option}</span>)}</div></li>)}</ol>
    </section>}
    <p className="pharm-footnote">Lehrer steuert die Antworten. Während des Hörens wechseln die Fragen nicht automatisch. Keine Schülerbewertung.</p>
  </section>;
}

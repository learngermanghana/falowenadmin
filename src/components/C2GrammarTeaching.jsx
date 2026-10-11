import React, { useState } from "react";
import { getC2GrammarTeaching } from "../data/c2GrammarTeaching.js";

const box = { border: "1px solid #cbd5e1", borderRadius: 12, padding: "clamp(12px, 2vw, 24px)", background: "#fff", color: "#0f172a", lineHeight: 1.65 };
export default function C2GrammarTeaching({ day, compact = false }) {
  const lesson = getC2GrammarTeaching(day);
  if (!lesson) return null;
  return <TeachingLesson key={day} lesson={lesson} compact={compact} />;
}
function TeachingLesson({ lesson, compact }) {
  const [selected, setSelected] = useState(null);
  const [step, setStep] = useState(0);
  const check = lesson.check;
  return <div data-c2-grammar-teaching="true" style={{ display: "grid", gap: 12 }}>
    {compact ? <nav aria-label="Grammatik-Lernschritte" style={{display:"flex",gap:8,flexWrap:"wrap"}}>{["Verstehen", "Satz bauen", "Gemeinsam prüfen", "Selbst anwenden"].map((label,index)=><button type="button" key={label} aria-pressed={step===index} onClick={()=>setStep(index)} style={{...box,cursor:"pointer",font:"inherit",fontWeight:step===index?800:400}}>{index+1}. {label}</button>)}</nav> : null}
    <article hidden={compact && step !== 0} style={box}><h2 style={{ marginTop: 0 }}>1. Verstehen · Was bedeutet das?</h2><p>{lesson.definitionDe}</p><p><strong>English support:</strong> {lesson.supportEn}</p></article>
    <article hidden={compact && step !== 1} style={box}><h2 style={{ marginTop: 0 }}>2. Satz bauen · Schritt für Schritt</h2><p>{lesson.structureDe}</p><h3>Beispiel mit Erklärung</h3><p>{lesson.workedExample}</p><p><strong>Warum?</strong> {lesson.explanationDe}</p></article>
    <article hidden={compact && step !== 2} style={box}><h2 style={{ marginTop: 0 }}>3. Gemeinsam prüfen</h2><p>{check.question}</p>
      <div role="group" aria-label="Grammatikantworten" style={{ display: "grid", gap: 8 }}>
        {check.options.map((option, index) => <button key={option} type="button" aria-pressed={selected === index} onClick={() => setSelected(index)} style={{ ...box, cursor: "pointer", textAlign: "left", font: "inherit", borderWidth: 2, background: selected !== null && index === check.answerIndex ? "#dcfce7" : selected === index ? "#fee2e2" : "#f8fafc" }}>{String.fromCharCode(65 + index)}. {option}</button>)}
      </div>
      {selected !== null ? <div role="status"><p><strong>{selected === check.answerIndex ? "Richtig!" : "Noch nicht richtig."}</strong> Passende Antwort: {check.options[check.answerIndex]}</p><p>{check.explanation}</p></div> : null}
    </article>
    <details hidden={compact && step !== 3} open={compact ? true : undefined} style={box}><summary style={{ cursor: "pointer", fontWeight: 800 }}>4. Jetzt selbst anwenden · nach dem gemeinsamen Check</summary><p>{lesson.independentTask}</p><p><strong>Hilfe:</strong> Nutze das erklärte Muster oben. Kontrolliere Bedeutung und Satzbau. Begründe deine Wortwahl.</p></details>
  </div>;
}

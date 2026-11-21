import { useState } from "react";
import InlineReadingTranslations from "./InlineReadingTranslations.jsx";
import PublishedSongLessonStage from "./PublishedSongLessonStage.jsx";
import "./A1Day7TeachingStage.css";

// Music is mounted only on its tab; navigating to Lesen stops playback.
// Preserve the actual recording discovery in PublishedSongLessonStage:
// no invented track ID, URL, lyrics timing or second discovery request.
// Lesen uses the existing verified passage, glossary and three answer checks.
export default function A1Day7MusicReadingStage({ reading, assignmentKey, courseDay, hasMusic }) {
  const [tab,setTab]=useState("reading");
  const active=hasMusic?tab:"reading";
  return <section className="a1-day7-media" aria-label="A1 Day 7 Musik und Lesen">
    <div role="tablist" className="a1-day7-media-tabs" aria-label="Musik und Lesen">
      <button id="a1-day7-reading-tab" type="button" role="tab"
        aria-selected={active==="reading"} aria-controls="a1-day7-media-panel"
        className={active==="reading"?"is-selected":""} onClick={()=>setTab("reading")}>
        Lesen · Preise und Vorlieben
      </button>
      {hasMusic?<button id="a1-day7-music-tab" type="button" role="tab"
        aria-selected={active==="music"} aria-controls="a1-day7-media-panel"
        className={active==="music"?"is-selected":""} onClick={()=>setTab("music")}>
        Musik · Was kostet das?
      </button>:null}
    </div>
    <div id="a1-day7-media-panel" role="tabpanel"
      aria-labelledby={active==="music"?"a1-day7-music-tab":"a1-day7-reading-tab"}>
      {active==="music" && hasMusic
        ? <PublishedSongLessonStage assignmentKey={assignmentKey} courseDay={courseDay} compact nextLyricOnly/>
        : <div className="a1-day7-reading">
          <span className="a1-day7-kicker">Lesen · Text verstehen</span>
          <h1>{reading?.title || "Preise und Vorlieben"}</h1>
          {reading?<>
            <p className="a1-day7-lead">{reading.readingPurpose}</p>
            <div className="a1-day7-reading-text" lang="de">
              <InlineReadingTranslations text={reading.textDe} level="A1"
                day={courseDay} assignmentId={assignmentKey}/>
            </div>
            <ol className="a1-day7-reading-checks">
              {reading.checks.map((question,index)=><li key={question}>
                <details><summary>{question}</summary><p>{reading.answers[index]}</p></details>
              </li>)}
            </ol>
          </>:<p>Der verifizierte Lesetext ist nicht verfügbar.</p>}
          <small className="a1-day7-note">Musik und Lesen sind Unterrichtsaktivitäten, keine zusätzlichen benoteten Hören-Aufgaben.</small>
        </div>}
    </div>
  </section>;
}

import { useState } from "react";
import InlineReadingTranslations from "./InlineReadingTranslations.jsx";
import PublishedSongLessonStage from "./PublishedSongLessonStage.jsx";
import "./A1Day6TeachingStage.css";

// Preserve on-demand MP3 discovery: this component never supplies guessed URLs.
// Reading remains useful even while the Day 6 recording is absent or pending.
export default function A1Day6MusicReadingStage({ reading, assignmentKey, courseDay, hasMusic }) {
  const [tab,setTab]=useState("reading");
  const active=hasMusic ? tab : "reading";
  return <section className="a1-day6-media" aria-label="Day 6 Lesen und Musik">
    <div className="a1-day6-media-tabs" role="tablist" aria-label="Lesen und Musik">
      <button id="a1-day6-reading-tab" type="button" role="tab"
        aria-selected={active==="reading"} aria-controls="a1-day6-media-panel"
        className={active==="reading"?"is-selected":""}
        onClick={()=>setTab("reading")}>Lesen · Familie und Hobbys</button>
      {hasMusic?<button id="a1-day6-music-tab" type="button" role="tab"
        aria-selected={active==="music"} aria-controls="a1-day6-media-panel"
        className={active==="music"?"is-selected":""} onClick={()=>setTab("music")}>
        Musik · Hören
      </button>:null}
    </div>
    <div id="a1-day6-media-panel" role="tabpanel"
      aria-labelledby={active==="music"?"a1-day6-music-tab":"a1-day6-reading-tab"}>
      {active==="music" && hasMusic
        ? <PublishedSongLessonStage assignmentKey={assignmentKey} courseDay={courseDay} compact nextLyricOnly/>
        : <div className="a1-day6-reading">
          <span className="a1-day6-eyebrow">Lesen · Familie und Hobbys</span>
          <h1>{reading?.title || "Familie und Hobbys"}</h1>
          {reading?<>
            <p className="a1-day6-lead">{reading.readingPurpose}</p>
            <div className="a1-day6-reading-text" lang="de">
              <InlineReadingTranslations text={reading.textDe} level="A1"
                day={courseDay} assignmentId={assignmentKey}/>
            </div>
            <ol className="a1-day6-reading-checks">
              {reading.checks.map((prompt,i)=><li key={prompt}>
                <details><summary>{prompt}</summary><p>{reading.answers[i]}</p></details>
              </li>)}
            </ol>
          </>:<p>Der verifizierte Lesetext ist nicht verfügbar.</p>}
          {hasMusic?<small className="a1-day6-note">Musik ist ein separates, unbenotetes Hörtraining. Audio wird nur nach Prüfung der vorhandenen Aufnahme geladen.</small>:null}
        </div>}
    </div>
  </section>;
}

import { useState } from "react";
import InlineReadingTranslations from "./InlineReadingTranslations.jsx";
import PublishedSongLessonStage from "./PublishedSongLessonStage.jsx";
import "./A1Day5TeachingStage.css";

// One presenter page with two independently accessible activities. The music
// player is mounted only on its tab, so switching to Lesen stops playback.
// Reading uses the same verified text, answers and inline translation tool as
// the standard A1 presenter. No separate audio URLs or fetches are introduced.
export default function A1Day5MusicReadingStage({ reading, assignmentKey, courseDay }) {
  const [active, setActive] = useState("music");
  return <section className="a1-day5-media" aria-label="Falowen Music und Lesen">
    <div role="tablist" aria-label="Musik und Lesen" className="a1-day5-media-tabs">
      <button id="a1-day5-music-tab" type="button" role="tab" aria-selected={active==="music"}
        aria-controls="a1-day5-media-content" className={active==="music"?"is-selected":""}
        onClick={()=>setActive("music")}>Musik · Hören</button>
      <button id="a1-day5-reading-tab" type="button" role="tab" aria-selected={active==="reading"}
        aria-controls="a1-day5-media-content" className={active==="reading"?"is-selected":""}
        onClick={()=>setActive("reading")}>Lesen · Sich vorstellen</button>
    </div>
    <div id="a1-day5-media-content" role="tabpanel" aria-labelledby={active==="music"?"a1-day5-music-tab":"a1-day5-reading-tab"}>
      {active==="music"
        ? <PublishedSongLessonStage assignmentKey={assignmentKey} courseDay={courseDay} compact nextLyricOnly/>
        : <div className="a1-day5-reading">
          <span className="a1-day5-tag">Lesen · Text verstehen</span>
          <h1>{reading?.title || "Sich vorstellen"}</h1>
          {reading ? <>
            <p className="a1-day5-lead">{reading.readingPurpose}</p>
            <div className="a1-day5-reading-text" lang="de">
              <InlineReadingTranslations text={reading.textDe} level="A1" day={courseDay} assignmentId={assignmentKey}/>
            </div>
            <ol className="a1-day5-reading-questions">
              {reading.checks.map((prompt,index)=><li key={prompt}>
                <details><summary>{prompt}</summary><p>{reading.answers[index]}</p></details>
              </li>)}
            </ol>
          </>:<p>Der verifizierte Lesetext ist nicht verfügbar.</p>}
        </div>}
    </div>
  </section>;
}

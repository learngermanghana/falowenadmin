import React, { useEffect, useState } from "react";
import "./SwahiliRestaurantSong.css";

const track = "swahili-a1-day-06";
const musicOrigin = "https://www.falowen.app";
const tabs = [["listen", "Listen"], ["lyrics", "Lyrics"], ["questions", "Questions"]];

export default function SwahiliRestaurantSong() {
  const [view, setView] = useState("listen");
  const [pack, setPack] = useState(null);
  const [questions, setQuestions] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [choice, setChoice] = useState(null);
  const [audioError, setAudioError] = useState(false);
  const [time, setTime] = useState(-1);

  useEffect(() => {
    if (view === "listen") return undefined;
    const controller = new AbortController();
    const load = async (url, update) => {
      try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error("Music resource unavailable");
        const data = await response.json();
        if (!controller.signal.aborted) update(data);
      } catch {
        if (!controller.signal.aborted) update(false);
      }
    };
    if (view === "lyrics") load(musicOrigin + "/api/music-lyrics?track=" + track, setPack);
    if (view === "questions") load(musicOrigin + "/music/swahili-day-06-questions.json", setQuestions);
    return () => controller.abort();
  }, [view]);

  const question = questions?.[questionIndex];
  const currentCue = pack?.cues?.findLast(cue => cue.start <= time && time < (cue.end ?? Infinity));
  const moveQuestion = offset => {
    setQuestionIndex(index => index + offset);
    setChoice(null);
  };
  let lineIndex = 0;

  return <section className="restaurant-song" aria-label="Falowen Music · Day 6">
    <header><small>FALOWEN MUSIC · A1 · DAY 6</small><h2>Chakula Kizuri Mgahawani</h2></header>
    <div className="restaurant-song__panel">
      <audio controls preload="none" aria-label="Chakula Kizuri Mgahawani"
        src={musicOrigin + "/api/music?track=" + track}
        onTimeUpdate={event => setTime(event.currentTarget.currentTime)}
        onEnded={() => setTime(-1)} onError={() => setAudioError(true)} />
      <a href={"https://music.falowen.app/song/" + track} target="_blank" rel="noreferrer">Open in Falowen Music</a>
      {audioError && <p role="alert">The recording could not load. Try again or open Falowen Music.</p>}
    </div>
    <div className="restaurant-song__tabs" role="group" aria-label="Music practice">
      {tabs.map(([id, label], index) => <button type="button" key={id} onClick={() => setView(id)} aria-pressed={view === id}>{index + 1} · {label}</button>)}
    </div>
    {view === "listen" && <div className="restaurant-song__panel">
      <h3>Listen first</h3>
      <p>Listen for what the customer orders and how they ask for the bill. Listen again with the lyrics, then try the questions.</p>
      <button type="button" onClick={() => setView("lyrics")}>Next · Lyrics</button>
    </div>}
    {view === "lyrics" && <div className="restaurant-song__panel">
      <h3>Lyrics · Maneno ya wimbo</h3>
      {!pack?.lyrics && <p role="status">{pack === null ? "Loading lyrics…" : "Lyrics are unavailable. Try again or open Falowen Music."}</p>}
      {pack?.lyrics && <div className="restaurant-song__lyrics">
        {pack.lyrics.split("\n").filter(Boolean).map((line, index) => {
          if (line.startsWith("[")) return <h4 key={index}>{line.slice(1, -1)}</h4>;
          const cue = pack.cues?.[lineIndex];
          const translation = pack.englishTranslation?.lines?.[lineIndex++];
          return <p key={index} className={cue && currentCue === cue ? "is-current" : undefined}>
            <span lang="sw">{line}</span>
            {translation?.de === line && <small lang="en">{translation.en}</small>}
          </p>;
        })}
      </div>}
    </div>}
    {view === "questions" && <div className="restaurant-song__panel">
      {!question && <p role="status">{questions === null ? "Loading questions…" : "Questions are unavailable. Try again."}</p>}
      {question && <>
        <small>Question {questionIndex + 1} of {questions.length}</small>
        <h3>{question.prompt}</h3>
        <div className="restaurant-song__options">
          {question.options.map((option, index) => <button type="button" key={option} aria-pressed={choice === index} onClick={() => setChoice(index)}>{option}</button>)}
        </div>
        {choice !== null && <p role="status"><strong>{choice === question.answer ? "Correct." : "Answer: " + question.options[question.answer] + "."}</strong> <span lang="sw">{question.evidence}</span></p>}
        <div className="restaurant-song__options">
          <button type="button" disabled={questionIndex === 0} onClick={() => moveQuestion(-1)}>Previous question</button>
          <button type="button" disabled={questionIndex === questions.length - 1} onClick={() => moveQuestion(1)}>Next question</button>
        </div>
      </>}
    </div>}
  </section>;
}

import { useEffect, useRef, useState } from "react";
import LessonSongLyrics from "./LessonSongLyrics.jsx";
import { hasCompleteSongTiming, lyricLines } from "../utils/songLyrics.js";
import "./PublishedSongLessonStage.css";
import "./LessonSongStage.css";

const B1_DAY_28_QUESTIONS = [
  {
    prompt: "Taja njia mbili za kutunza mazingira zilizotajwa katika wimbo.",
    answer: "Tunaweza kupanda miti na kuweka taka kwenye pipa.",
  },
  {
    prompt: "Kwa nini tunapaswa kupunguza matumizi ya plastiki?",
    answer: "Tunapaswa kupunguza plastiki kwa sababu inachafua mazingira na inaweza kuwadhuru wanyama.",
  },
  {
    prompt: "Wewe unafanya nini katika maisha yako ya kila siku ili kutunza mazingira?",
    answer: "Katika maisha yangu ya kila siku, ninaweka taka kwenye pipa na ninatumia mfuko unaoweza kutumiwa tena. Pia ninazima taa wakati sizitumii.",
  },
  {
    prompt: "Ni tatizo gani kubwa la mazingira katika eneo lako? Linaweza kutatuliwa kwa njia gani?",
    answer: "Katika eneo langu, taka za plastiki ni tatizo kubwa. Tunaweza kuongeza mapipa, kupunguza plastiki na kutoa elimu kuhusu mazingira.",
  },
];

export default function SwahiliSlideMusic({ track, questions }) {
  if (!track?.objectKey) return <p role="status">Hakuna rekodi iliyochapishwa kwa somo hili.</p>;
  return <RecordingLyrics key={track.objectKey} track={track} lessonQuestions={questions} />;
}

function RecordingLyrics({ track, lessonQuestions }) {
  const audioRef = useRef(null);
  const excerptEnd = useRef(null);
  const [pack, setPack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(0);
  const [view, setView] = useState(track.id === "swahili-a1-day-12" ? "lyrics" : "listen");
  const [follow, setFollow] = useState(true);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [excerptStart, setExcerptStart] = useState(0);
  const [selectedLine, setSelectedLine] = useState(-1);
  const [audioError, setAudioError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetch("https://www.falowen.app/api/music-lyrics?key=" + encodeURIComponent(track.objectKey),
      { signal: controller.signal })
      .then(response => response.ok ? response.json() : null)
      .then(result => {
        if (!controller.signal.aborted && result?.objectKey === track.objectKey
          && typeof result.lyrics === "string") setPack(result);
      })
      .catch(() => {})
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [track.objectKey]);

  const lines = lyricLines(pack?.lyrics);
  const matched = hasCompleteSongTiming(pack?.cues, pack?.lyrics);
  const isB1Day28 = track.id === "swahili-b1-day-28";
  const questions = pack?.practiceQuestions ??
    (Array.isArray(lessonQuestions) ? lessonQuestions : isB1Day28 ? B1_DAY_28_QUESTIONS : []);
  const question = questions[questionIndex];
  const openView = next => {
    excerptEnd.current = null;
    if (view === "questions" || next === "questions") audioRef.current?.pause();
    setView(next);
    setShowAnswer(false);
  };
  const playExcerpt = () => {
    const player = audioRef.current;
    if (!player || !Number.isFinite(player.duration)) return;
    const start = Math.min(Math.max(0, excerptStart), Math.max(0, player.duration - 7));
    excerptEnd.current = Math.min(player.duration, start + 7);
    player.currentTime = start;
    player.play()?.catch(() => { excerptEnd.current = null; });
  };
  const updateTime = event => {
    const player = event.currentTarget;
    setTime(player.ended ? -1 : player.currentTime);
    if (excerptEnd.current !== null && player.currentTime >= excerptEnd.current) {
      player.pause();
      excerptEnd.current = null;
    }
  };

  return <section className="published-song-lesson" lang="sw"
    aria-label={`Falowen Music · Kiswahili ${track.level} · Day ${track.day}`}>
    <header className="published-song-lesson__head">
      <div><span>FALOWEN MUSIC · KISWAHILI {track.level} · SOMO LA {track.day}</span>
        <h2>{track.title}</h2>
        <p>Kusikiliza · Maneno ya wimbo · Maswali</p>
      </div>
    </header>
    <div className="published-song-lesson__player">
      <div><strong>♫ Sikiliza wimbo</strong>
        <small>Wimbo uliochapishwa katika Falowen Music · Si zoezi la Kusikiliza la mtihani</small>
      </div>
      <audio ref={audioRef} controls preload="metadata" src={track.audioUrl}
        aria-label={track.title} onTimeUpdate={updateTime} onSeeked={updateTime}
        onSeeking={() => { excerptEnd.current = null; }}
        onEnded={() => { excerptEnd.current = null; setTime(-1); }}
        onError={() => setAudioError("Rekodi haipatikani. Angalia kiungo cha MP3 katika Falowen Music.")}/>
      {audioError && <p role="alert">{audioError}</p>}
      <a href={`https://music.falowen.app/song/${encodeURIComponent(track.id)}`}
        target="_blank" rel="noopener noreferrer">Fungua katika Falowen Music</a>
    </div>

    <div className="published-song-lesson__tabs" role="group" aria-label="Hatua za mazoezi ya wimbo">
      <button type="button" className={view === "listen" ? "is-active" : ""}
        aria-pressed={view === "listen"} onClick={() => openView("listen")}>1 · Sikiliza</button>
      <button type="button" className={view === "lyrics" ? "is-active" : ""}
        aria-pressed={view === "lyrics"} onClick={() => openView("lyrics")}>2 · Maneno</button>
      <button type="button" className={view === "questions" ? "is-active" : ""}
        aria-pressed={view === "questions"} onClick={() => openView("questions")}>3 · Maswali</button>
    </div>

    {view === "listen" && <div className="published-song-lesson__section">
      {pack?.story && <details>
        <summary>Kuhusu wimbo · <span lang="en">Behind the Song</span></summary>
        <p>{pack.story.sw}</p>
        <p lang="en">{pack.story.en}</p>
        <h4>Utakachojifunza · <span lang="en">What you’ll practise</span></h4>
        <p>{pack.story.focusSw}</p>
        <p lang="en">{pack.story.focusEn}</p>
      </details>}
      <h3>Sikiliza kwanza.</h3>
      <p>{isB1Day28 ? "Wimbo unataja njia gani za kutunza mazingira?" :
        "Sikiliza wimbo. Ni maneno gani unayosikia?"}</p>
      <p>Sikiliza mara ya kwanza bila kusoma maneno. Kisha sikiliza tena na ufuatilie maneno.</p>
      <button type="button" onClick={() => openView("lyrics")}>Endelea · Maneno ya wimbo</button>
    </div>}

    {view === "lyrics" && <div className="published-song-lesson__section">
      <h3>Maneno ya wimbo · {track.title}</h3>
      {loading && <p role="status">Maneno ya wimbo yanapakiwa…</p>}
      {!loading && !pack?.lyrics && <p role="status">
        Hakuna maneno yaliyothibitishwa kwa rekodi hii bado. Hakuna maneno kutoka kwa rasimu nyingine yatakayoonyeshwa.
      </p>}
      {pack?.lyrics && <>
        {pack.transcriptionStatus === "automatic" && <p role="status">
          Rasimu ya maneno ya wimbo imetolewa kiotomatiki; mwalimu ahakikishe usahihi wake.
        </p>}
        {!matched && <p role="status">
          Alama za muda zilizokaguliwa kwa rekodi hii hazijakamilika. Maneno yanaonyeshwa bila kuangaziwa kiotomatiki.
        </p>}
        <label><input type="checkbox" checked={follow} disabled={!matched}
          onChange={event => setFollow(event.target.checked)}/> Fuata maneno yanayoimbwa</label>
        {matched && pack.timingStatus === "estimated" && <small>Muda wa kila mstari ni wa kukadiria.</small>}
        <LessonSongLyrics audioRef={audioRef} song={pack} cues={pack.cues} time={time} follow={follow}
          language="sw" label="Maneno yanayoimbwa"
          onSeek={start => { if (audioRef.current) audioRef.current.currentTime = start; }} />
      </>}
      <button type="button" onClick={() => openView("questions")}>Endelea · Maswali</button>
    </div>}

    {view === "questions" && <div className="published-song-lesson__section published-song-lesson__quiz">
      {question ? <>
        <div className="published-song-lesson__quizmeta">
          <strong>SWALI {questionIndex + 1} / {questions.length}</strong>
          <span>{question.section || (questionIndex < 2 ? "UFAHAMU WA WIMBO" : "KUZUNGUMZA")}</span>
        </div>
        <h3>{question.prompt}</h3>
        {question.english && <p lang="en"><em>{question.english}</em></p>}
        {Array.isArray(question.instructions) && question.instructions.length > 0 &&
          <ul>{question.instructions.map((step, index) => <li key={index}>{step}</li>)}</ul>}
        <p>Jibu kwa Kiswahili. Mwalimu anaweza kuonyesha mfano wa jibu baada ya majadiliano.</p>
        <button type="button" onClick={() => setShowAnswer(value => !value)}>
          {showAnswer ? "Ficha mfano wa jibu" : "Onyesha mfano wa jibu"}
        </button>
        {showAnswer && <div className="published-song-lesson__answer" role="status">
          <strong>Mfano wa jibu</strong><p style={{ whiteSpace: "pre-line" }}>{question.answer}</p>
        </div>}
        <div className="published-song-lesson__quiznav">
          <button type="button" disabled={questionIndex === 0}
            onClick={() => { setQuestionIndex(i => i - 1); setShowAnswer(false); }}>← Swali lililotangulia</button>
          <button type="button" disabled={questionIndex === questions.length - 1}
            onClick={() => { setQuestionIndex(i => i + 1); setShowAnswer(false); }}>Swali linalofuata →</button>
        </div>
      </> : <p>Maswali ya somo hili yanaonyeshwa kwenye slaidi inayofuata.</p>}
      <div className="published-song-lesson__section">
        <h3>Jaribio la kusikiliza · Sekunde 7</h3>
        <p>Chagua sehemu ya rekodi, sikiliza sekunde saba, kisha waulize wanafunzi ni maneno gani wamesikia.</p>
        <label>Mwanzo (sekunde) <input type="number" min="0" step="1" value={excerptStart}
          onChange={event => { setExcerptStart(Math.max(0, Number(event.target.value) || 0)); setSelectedLine(-1); }}/></label>
        <button type="button" onClick={playExcerpt}>▶ Sikiliza sekunde 7</button>
        {lines.length > 0 && <>
          <p>Ni mstari gani umesikika? Mwalimu ahakikishe jibu kwa kusikiliza rekodi.</p>
          <div className="published-song-lesson__options" role="group" aria-label="Mistari ya wimbo">
            {lines.slice(0,3).map((line,index) => <button type="button" key={index}
              aria-pressed={selectedLine === index}
              className={selectedLine === index ? "is-selected" : ""}
              onClick={() => setSelectedLine(index)}>
              <strong>{String.fromCharCode(65+index)}.</strong> {line}
            </button>)}
          </div>
          <small>Chaguo hizi ni kwa mazoezi ya mwalimu tu; hazipimwi kiotomatiki bila muda uliothibitishwa.</small>
        </>}
      </div>
    </div>}
  </section>;
}

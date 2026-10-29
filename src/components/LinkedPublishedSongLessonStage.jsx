import { useState } from 'react';
import './PublishedSongLessonStage.css';

// Same published-song lesson shell as A2 Day 18. For Days 19 and 20 the
// public Falowen Music library discovers uploaded R2 audio on demand; its
// exact recording metadata, lyrics and cues are authoritative. Do NOT use
// the editable Admin songbook lyrics or invent a filename for these tracks.
const DAY_DISCUSSION = Object.freeze({
  19: [
    { question: 'Welche Einkaufsmöglichkeiten hörst du oder kennst du?',
      guide: 'Sammelt konkrete Orte oder Möglichkeiten. Nennt nur das, was ihr im Lied wirklich hört.' },
    { question: 'Kaufst du lieber online oder im Geschäft? Begründe deine Wahl.',
      guide: 'Zum Beispiel: Ich gehe lieber ins Geschäft, denn ich möchte die Schuhe anprobieren.' },
    { question: 'Wie kann man beim Einkaufen Geld sparen?',
      guide: 'Zum Beispiel: Ich vergleiche zuerst die Preise und kaufe nur, was ich brauche.' },
  ],
  20: [
    { question: 'Welches Problem gibt es mit einem gekauften Kleidungsstück?',
      guide: 'Beschreibt die Situation nur mit Informationen aus dem gehörten Lied.' },
    { question: 'Was sagst du höflich im Geschäft, wenn die Größe nicht passt?',
      guide: 'Zum Beispiel: Entschuldigung, die Jacke ist zu klein. Kann ich sie bitte umtauschen?' },
    { question: 'Was würdest du als Verkäuferin oder Verkäufer antworten?',
      guide: 'Zum Beispiel: Natürlich. Haben Sie den Kassenbon dabei?' },
  ],
});

export default function LinkedPublishedSongLessonStage({ music }) {
  const [view, setView] = useState('listen');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [showGuide, setShowGuide] = useState(false);
  const day = Number(music?.day);
  const allowed = music?.level === 'A2'
    && [19, 20].includes(day)
    && music?.musicLibraryUrl === `https://music.falowen.app/?level=A2&day=${day}`;
  if (!allowed) return null;
  const questions = DAY_DISCUSSION[day];
  const current = questions[questionIndex];
  const embeddedUrl = `${music.musicLibraryUrl}&embedded=1`;

  return (
    <section className="published-song-lesson published-song-lesson--linked"
      aria-label={`Falowen Music for A2 Day ${day}`}>
      <header className="published-song-lesson__head">
        <div>
          <span>FALOWEN MUSIC · A2 · DAY {day}</span>
          <h2>{music.title}</h2>
          <p>Hören · Liedtext verstehen · Sprechen</p>
        </div>
      </header>

      <div className="published-song-lesson__player">
        <div>
          <strong>♫ Lied anhören</strong>
          <small>Die veröffentlichte Aufnahme aus Falowen Music · keine Goethe-Hörprüfung</small>
        </div>
        <iframe className="published-song-lesson__music-room"
          title={`Falowen Music A2 Day ${day} · veröffentlichte Aufnahme und Original-Liedtext`}
          src={embeddedUrl} loading="eager" allow="autoplay" referrerPolicy="strict-origin-when-cross-origin" />
        <a href={music.musicLibraryUrl} target="_blank" rel="noopener noreferrer">
          In Falowen Music öffnen, falls der eingebettete Player nicht angezeigt wird
        </a>
      </div>

      <div className="published-song-lesson__tabs" role="group" aria-label="Musik-Lernschritte">
        <button type="button" className={view === 'listen' ? 'is-active' : ''}
          aria-pressed={view === 'listen'} onClick={() => setView('listen')}>1 · Hören</button>
        <button type="button" className={view === 'lyrics' ? 'is-active' : ''}
          aria-pressed={view === 'lyrics'} onClick={() => setView('lyrics')}>2 · Liedtext</button>
        <button type="button" className={view === 'questions' ? 'is-active' : ''}
          aria-pressed={view === 'questions'} onClick={() => setView('questions')}>3 · Fragen</button>
      </div>

      {view === 'listen' && <div className="published-song-lesson__section">
        <h3>Höre zuerst zu.</h3>
        <p>{music.introQuestion}</p>
        <p>Wähle im Player das Lied für A2 Day {day} und höre es an. Beim ersten Mal hörst du ohne den Text.</p>
        <button type="button" onClick={() => setView('lyrics')}>Weiter · Liedtext ansehen</button>
      </div>}

      {view === 'lyrics' && <div className="published-song-lesson__section">
        <h3>Liedtext · {music.title}</h3>
        <p>Öffne im eingebetteten Musikplayer den Liedtext. Die Wörter und gegebenenfalls ihre Zeitmarken stammen aus der veröffentlichten Aufnahme, nicht aus einem neuen Admin-Entwurf.</p>
        <p>Welche Wörter aus der heutigen Lektion hörst du? Lies mit und erkläre die Situation in eigenen Worten.</p>
        <button type="button" onClick={() => { setView('questions'); setQuestionIndex(0); setShowGuide(false); }}>
          Weiter · Fragen beantworten
        </button>
      </div>}

      {view === 'questions' && <div className="published-song-lesson__section published-song-lesson__quiz">
        <div className="published-song-lesson__quizmeta">
          <strong>FRAGE {questionIndex + 1} / {questions.length}</strong><span>UNBEWERTETE SPRECHÜBUNG</span>
        </div>
        <h3 lang="de">{current.question}</h3>
        <p>Besprecht eure Antworten in der Klasse. Diese Fragen prüfen keine automatisch erkannten Lieddetails.</p>
        <button type="button" onClick={() => setShowGuide(v => !v)}
          aria-pressed={showGuide}>{showGuide ? 'Lehrerhinweis verbergen' : 'Lehrerhinweis zeigen'}</button>
        {showGuide && <div className="published-song-lesson__answer" role="status">
          <strong>Lehrerhinweis</strong><p>{current.guide}</p>
        </div>}
        <div className="published-song-lesson__quiznav">
          <button type="button" disabled={questionIndex === 0}
            onClick={() => { setQuestionIndex(i => Math.max(0, i - 1)); setShowGuide(false); }}>← Vorherige</button>
          <button type="button" onClick={() => {
            if (questionIndex === questions.length - 1) { setView('listen'); setQuestionIndex(0); }
            else setQuestionIndex(i => i + 1);
            setShowGuide(false);
          }}>{questionIndex === questions.length - 1 ? 'Wiederholen' : 'Nächste Frage →'}</button>
        </div>
      </div>}
      <p className="published-song-lesson__note">Der Musikplayer bleibt beim Wechsel der Tabs geladen. Das separate Hören-Gespräch kommt auf der nächsten Folie. Keine Aufnahme, Veröffentlichung oder Änderung der Liedtexte.</p>
    </section>
  );
}

import { useEffect, useState } from 'react';
import { formatReusableMusicQuestions, getReusableMusicQuestions } from '../data/reusableMusicQuestions.js';
import './ReusableMusicQuestions.css';

function exportText(text, name) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/**
 * Shared static song-question bank for the Admin Music Studio and teaching
 * slides. Students/projectors see no answers unless a teacher reveals them.
 * This never contacts an AI provider, uploads audio, or edits the lesson.
 */
export default function ReusableMusicQuestions({ assignmentKey, projector = false, lyricsChanged = false }) {
  const data = getReusableMusicQuestions(assignmentKey);
  const [answersVisible, setAnswersVisible] = useState(false);
  const [feedback, setFeedback] = useState('');
  useEffect(() => {
    setAnswersVisible(false);
    setFeedback('');
  }, [assignmentKey]);
  if (!data) return null;

  const stem = `falowen-${data.level.toLowerCase()}-${String(data.assignmentKey).toLowerCase().replace(/[^a-z0-9]+/g, '-')}-song-questions`;

  async function copyQuestions(includeAnswers) {
    const text = formatReusableMusicQuestions(assignmentKey, { includeAnswers });
    try {
      await navigator.clipboard.writeText(text);
      setFeedback(includeAnswers ? 'Questions and answer key copied.' : 'Student questions copied for slides.');
    } catch {
      exportText(text, `${stem}${includeAnswers ? '-answer-key' : '-slides'}.txt`);
      setFeedback('Clipboard unavailable — downloaded the question sheet.');
    }
  }
  return (
    <section className={`reusable-music-questions${projector ? ' reusable-music-questions--projector' : ''}`}
      aria-label={`Song questions for ${data.songTitle}`} data-song-assignment={data.assignmentKey}>
      <div className="reusable-music-questions__heading">
        <div>
          <span className="reusable-music-questions__eyebrow">FALOWEN · LISTEN, THINK & SPEAK</span>
          <h2>Song questions · {data.songTitle}</h2>
          <p>{data.level} · {data.assignmentKey} · 2 listening questions + 1 speaking task</p>
        </div>
        <span className="reusable-music-questions__count">3 questions</span>
      </div>
      <p className="reusable-music-questions__instruction">Play the matching Falowen song before asking these questions. These exercises refer to the <strong>original song draft</strong>, not automatically to another recorded version.</p>
      {lyricsChanged && <p role="note" className="reusable-music-questions__warning">You changed the lyrics. Check the questions and answers against your edited or generated version before using them with students.</p>}
      <ol className="reusable-music-questions__list">
        {data.questions.map((question) => (
          <li key={question.id}>
            <div className="reusable-music-questions__tag">{question.type === 'listening' ? 'Hörverstehen' : 'Sprechen'}</div>
            <p className="reusable-music-questions__prompt">{question.prompt}</p>
            {answersVisible && <div className="reusable-music-questions__answer">
              {question.type === 'listening' ? <>
                <strong>Erwartete Antwort:</strong> {question.answer}
                <details><summary>Textbeleg ansehen</summary><blockquote>{question.evidence}</blockquote></details>
              </> : <><strong>Teacher guidance:</strong> {question.teacherNote}</>}
            </div>}
          </li>
        ))}
      </ol>
      <div className="reusable-music-questions__actions">
        <button type="button" onClick={() => setAnswersVisible(v => !v)} aria-pressed={answersVisible}>
          {answersVisible ? 'Hide answer key' : 'Show answer key'}
        </button>
        <button type="button" onClick={() => copyQuestions(false)}>Copy questions for slides</button>
        <button type="button" onClick={() => copyQuestions(true)}>Copy with answer key</button>
        <button type="button" onClick={() => exportText(formatReusableMusicQuestions(assignmentKey, {includeAnswers:true}),`${stem}-teacher.txt`)}>
          Download teacher questions (.txt)
        </button>
      </div>
      {feedback && <p className="reusable-music-questions__feedback" role="status">{feedback}</p>}
    </section>
  );
}

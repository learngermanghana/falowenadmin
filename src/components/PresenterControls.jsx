import { useEffect } from 'react';
import './PresenterControls.css';

export function usePresenterKeyboard({ previous, next, first, last, blocked = false, preventNext = false }) {
  useEffect(() => {
    function handleKey(event) {
      if (blocked || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey ||
        event.target?.closest?.('input, textarea, select, button, a, summary, dialog, [contenteditable="true"]')) return;
      const actions = { ArrowRight: next, PageDown: next, ' ': next, ArrowLeft: previous, PageUp: previous, Home: first, End: last };
      const action = actions[event.key];
      if (!action) return;
      event.preventDefault();
      if (preventNext && ['ArrowRight', 'PageDown', ' '].includes(event.key)) return;
      action();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [previous, next, first, last, blocked, preventNext]);
}

export function PresenterActions({ onPresent, onExit, onReport }) {
  return <>
    <button type="button" className="presenter-session-present" onClick={onPresent}>Present full screen</button>
    <button type="button" onClick={onReport}>Lesson report</button>
    <button type="button" className="presenter-session-exit" onClick={onExit}>Exit presenter</button>
  </>;
}

export function PresenterStageJump({ stages, index, onChange }) {
  return <label className="presenter-stage-jump"><span>Jump to</span>
    <select value={index} onChange={event => onChange(Number(event.target.value))}>
      {stages.map((stage, i) => <option key={stage.id} value={i}>{i + 1}. {stage.title}</option>)}
    </select>
  </label>;
}

export default function PresenterControls({ focus = false, compact = false, index, total, atStart, atEnd,
  onPrevious, onNext, onRestore, onReport, nextLabel = 'Next slide →', nextTitle = '', nextLessonHref = '', nextLessonLabel = '' }) {
  const Tag = focus ? 'nav' : 'footer';
  return <Tag className={focus ? 'presenter-focus-dock presenter-shared-controls' : `presenter-footer presenter-shared-controls${compact ? ' is-compact' : ''}`} aria-label="Lesson navigation">
    <button type="button" onClick={onPrevious} disabled={atStart} aria-label="Previous slide">← Previous</button>
    {!compact && <div className="presenter-progress-wrap" aria-label={`Slide ${index + 1} of ${total}`}>
      <span>{index + 1} / {total}</span>
      {!focus && <div className="presenter-progress-track"><div className="presenter-progress-bar" style={{ width: `${total ? (index + 1) / total * 100 : 0}%` }} /></div>}
    </div>}
    {focus && <button type="button" className="presenter-restore-control" onClick={onRestore} aria-label="Restore presenter controls">Restore controls</button>}
    {!atEnd && <button type="button" onClick={onReport}>Lesson report</button>}
    <button type="button" onClick={atEnd ? onReport : onNext} title={nextTitle}>{atEnd ? 'Finish lesson · report' : nextLabel}</button>
    {!focus && nextLessonHref && <a className="presenter-next-lesson" href={nextLessonHref}>Next lesson{nextLessonLabel ? ` · ${nextLessonLabel}` : ''} →</a>}
  </Tag>;
}

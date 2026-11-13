import { useEffect, useState } from "react";

// Shared A2-style activity countdown. Keep it local to the presenter: it does
// not start, end or modify the official class-session clock.
export const ACTIVITY_TIMER_PRESETS = Object.freeze([7, 5, 3, 2, 1, 0.5]);

export function formatActivityTime(totalSeconds = 0) {
  const safe = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}

export function usePresenterActivityTimer(initialMinutes = 7) {
  const [minutes, setMinutes] = useState(initialMinutes);
  const [remaining, setRemaining] = useState(Math.round(initialMinutes * 60));
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running || remaining <= 0) return undefined;
    const started = Date.now();
    const startRemaining = remaining;
    const tick = () => {
      const next = Math.max(0, startRemaining - Math.floor((Date.now() - started) / 1000));
      setRemaining(next);
      if (!next) setRunning(false);
    };
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [running, remaining === 0]);

  const chooseDuration = (value) => {
    setMinutes(value);
    setRemaining(Math.round(value * 60));
    setRunning(false);
  };
  const reset = () => {
    setRemaining(Math.round(minutes * 60));
    setRunning(false);
  };
  const toggle = () => {
    if (remaining > 0) setRunning(value => !value);
  };
  return { minutes, remaining, running, chooseDuration, reset, toggle };
}

// Uses the same CSS classes as the A2/B1 TeachingSlidePresenter controls.
// The optional callbacks keep the existing German timer behavior unchanged.
export default function PresenterActivityTimer({
  remaining, running, minutes, presets = ACTIVITY_TIMER_PRESETS,
  onDurationChange, onToggle, onReset, expired = false,
}) {
  return (
    <div className={`presenter-timer ${expired ? "presenter-timer-expired" : ""}`}>
      <span className="presenter-timer-mode">Activity timer</span>
      <strong>{formatActivityTime(remaining)}</strong>
      <div className="presenter-timer-presets" role="group" aria-label="Activity timer duration">
        {presets.map(value => (
          <button key={value} type="button"
            className={minutes === value ? "is-active" : ""}
            aria-pressed={minutes === value}
            onClick={() => onDurationChange?.(value)}>
            {value < 1 ? `${value * 60}s` : `${value}m`}
          </button>
        ))}
      </div>
      <button type="button" disabled={remaining <= 0} onClick={onToggle}>{running ? "Pause" : "Start"}</button>
      <button type="button" onClick={onReset}>Reset</button>
    </div>
  );
}

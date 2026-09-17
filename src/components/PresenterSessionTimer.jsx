import { useEffect, useMemo, useState } from "react";
import "./PresenterSessionTimer.css";

export const SESSION_MINUTES_BY_LEVEL = Object.freeze({
  A1: 60,
  A2: 90,
  B1: 90,
});

function normalize(value) {
  return String(value || "").trim();
}

export function presenterSessionMinutes(level = "") {
  return SESSION_MINUTES_BY_LEVEL[normalize(level).toUpperCase()] || 0;
}

function localDateKey(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatSessionTime(totalSeconds = 0) {
  const safe = Math.max(0, Math.floor(Number(totalSeconds || 0)));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function timerStorageKey(slide = {}) {
  const level = normalize(slide.course).toUpperCase() || "course";
  const lesson = normalize(slide.assignmentId || slide.id || slide.day || slide.title || "lesson");
  return `falowen:presenter:class-timer:${level}:${lesson}`;
}

function readStoredTimer(key, durationSeconds) {
  if (typeof window === "undefined") return { remaining: durationSeconds, running: false, endAt: 0 };
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(key) || "{}");
    if (saved.date !== localDateKey()) return { remaining: durationSeconds, running: false, endAt: 0 };
    if (saved.running && Number(saved.endAt) > 0) {
      const remaining = Math.max(0, Math.ceil((Number(saved.endAt) - Date.now()) / 1000));
      return { remaining, running: remaining > 0, endAt: remaining > 0 ? Number(saved.endAt) : 0 };
    }
    const remaining = Math.max(0, Math.min(durationSeconds, Number(saved.remaining ?? durationSeconds)));
    return { remaining, running: false, endAt: 0 };
  } catch {
    return { remaining: durationSeconds, running: false, endAt: 0 };
  }
}

export default function PresenterSessionTimer({ slide }) {
  const level = normalize(slide?.course).toUpperCase();
  const durationMinutes = presenterSessionMinutes(level);
  const durationSeconds = durationMinutes * 60;
  const storageKey = useMemo(() => timerStorageKey(slide), [slide]);
  const [remaining, setRemaining] = useState(durationSeconds);
  const [running, setRunning] = useState(false);
  const [endAt, setEndAt] = useState(0);

  useEffect(() => {
    if (!durationSeconds) return;
    const restored = readStoredTimer(storageKey, durationSeconds);
    setRemaining(restored.remaining);
    setRunning(restored.running);
    setEndAt(restored.endAt);
  }, [durationSeconds, storageKey]);

  useEffect(() => {
    if (!durationSeconds || typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(storageKey, JSON.stringify({
        date: localDateKey(),
        remaining,
        running,
        endAt,
      }));
    } catch {
      // The timer still works if session storage is unavailable.
    }
  }, [durationSeconds, storageKey, remaining, running, endAt]);

  useEffect(() => {
    if (!running || !endAt) return undefined;
    const tick = () => {
      const next = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setRemaining(next);
      if (next <= 0) {
        setRunning(false);
        setEndAt(0);
      }
    };
    tick();
    const timer = window.setInterval(tick, 500);
    return () => window.clearInterval(timer);
  }, [running, endAt]);

  if (!durationSeconds) return null;

  const expired = remaining <= 0;
  const warning = !expired && remaining <= 10 * 60;

  function startOrResume() {
    const seconds = remaining > 0 ? remaining : durationSeconds;
    const nextEndAt = Date.now() + seconds * 1000;
    setRemaining(seconds);
    setEndAt(nextEndAt);
    setRunning(true);
  }

  function pause() {
    if (!running) return;
    const next = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
    setRemaining(next);
    setRunning(false);
    setEndAt(0);
  }

  function reset() {
    setRemaining(durationSeconds);
    setRunning(false);
    setEndAt(0);
  }

  return (
    <div className={`presenter-session-timer ${expired ? "is-expired" : warning ? "is-warning" : ""}`} aria-live="polite">
      <div className="presenter-session-timer-copy">
        <span>Class time · {level} · {durationMinutes} min</span>
        <strong>{expired ? "TIME UP" : formatSessionTime(remaining)}</strong>
        <small>{expired ? "Class time is up." : running ? "Time remaining" : "Ready to start"}</small>
      </div>
      <div className="presenter-session-timer-actions">
        <button type="button" onClick={running ? pause : startOrResume}>{running ? "Pause" : expired ? "Restart" : remaining === durationSeconds ? "Start class" : "Resume"}</button>
        <button type="button" onClick={reset}>Reset</button>
      </div>
    </div>
  );
}

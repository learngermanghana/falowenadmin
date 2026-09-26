import { useEffect, useMemo, useRef, useState } from "react";
import usePresenterLiveSession from "../hooks/usePresenterLiveSession.js";
import { startPresenterLiveSession } from "../services/presenterLiveSessionService.js";
import {
  SESSION_MINUTES_BY_LEVEL,
  inferPresenterLevel,
  presenterSessionMinutes,
} from "../utils/presenterSessionTiming.js";
import "./PresenterSessionTimer.css";

export { SESSION_MINUTES_BY_LEVEL, presenterSessionMinutes };

export const CLASS_WARNING_MINUTES = Object.freeze([30, 15, 10, 5, 0]);

const SOUND_PREFERENCE_KEY = "falowen:presenter:class-timer:sound";
const LAST_CLASS_KEY = "falowen:presenter:last-class";

function normalize(value) {
  return String(value || "").trim();
}

function localDateKey(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function currentPresenterClassId() {
  if (typeof window === "undefined") return "unassigned";
  try {
    return normalize(window.localStorage.getItem(LAST_CLASS_KEY)) || "unassigned";
  } catch {
    return "unassigned";
  }
}

function formatSessionTime(totalSeconds = 0) {
  const safe = Math.max(0, Math.floor(Number(totalSeconds || 0)));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function presenterClassTimerStorageKey(level = "", classId = "", now = new Date(), sessionKey = "") {
  const safeLevel = normalize(level).toUpperCase() || "course";
  const safeClass = encodeURIComponent(normalize(classId) || "unassigned");
  const safeSession = encodeURIComponent(normalize(sessionKey) || "legacy");
  return `falowen:presenter:class-timer:${localDateKey(now)}:${safeLevel}:${safeClass}:${safeSession}`;
}

function warningSeconds() {
  return CLASS_WARNING_MINUTES.map((minutes) => minutes * 60);
}

function warningLabel(thresholdSeconds) {
  const minutes = Math.round(Number(thresholdSeconds || 0) / 60);
  return minutes > 0 ? `${minutes} minutes left` : "Class time is up.";
}

function baselineWarnings(remaining) {
  return warningSeconds().filter((threshold) => remaining <= threshold);
}

function readSoundPreference() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(SOUND_PREFERENCE_KEY) === "on";
  } catch {
    return false;
  }
}

function readStoredTimer(key, durationSeconds) {
  if (typeof window === "undefined") {
    return { remaining: durationSeconds, running: false, endAt: 0, warned: [] };
  }
  try {
    const saved = JSON.parse(window.localStorage.getItem(key) || "{}");
    if (saved.date !== localDateKey()) {
      return { remaining: durationSeconds, running: false, endAt: 0, warned: [] };
    }
    if (saved.running && Number(saved.endAt) > 0) {
      const nowMs = Date.now();
      const remaining = Math.max(
        0,
        Math.min(durationSeconds, Math.ceil((Number(saved.endAt) - nowMs) / 1000)),
      );
      const warned = Array.isArray(saved.warned) ? saved.warned.map(Number).filter(Number.isFinite) : baselineWarnings(remaining);
      return {
        remaining,
        running: remaining > 0,
        endAt: remaining > 0 ? Math.min(Number(saved.endAt), nowMs + (durationSeconds * 1000)) : 0,
        warned,
      };
    }
    const remaining = Math.max(0, Math.min(durationSeconds, Number(saved.remaining ?? durationSeconds)));
    const warned = Array.isArray(saved.warned) ? saved.warned.map(Number).filter(Number.isFinite) : baselineWarnings(remaining);
    return { remaining, running: false, endAt: 0, warned };
  } catch {
    return { remaining: durationSeconds, running: false, endAt: 0, warned: [] };
  }
}

function visualWarningClass(remaining) {
  if (remaining <= 0) return "is-expired";
  if (remaining <= 5 * 60) return "is-critical";
  if (remaining <= 10 * 60) return "is-warning";
  if (remaining <= 15 * 60) return "is-caution";
  if (remaining <= 30 * 60) return "is-notice";
  return "";
}

export default function PresenterSessionTimer({ slide }) {
  const presenterLive = usePresenterLiveSession(slide);
  const level = inferPresenterLevel(
    slide?.course,
    slide?.levelId,
    slide?.assignmentId,
    slide?.id,
    slide?.title,
    slide?.topic,
    presenterLive.liveState?.timerLevel,
    presenterLive.liveState?.level,
  );
  const configuredDurationMinutes = presenterSessionMinutes(level);
  const configuredDurationSeconds = configuredDurationMinutes * 60;
  const rawSharedDurationSeconds = Number(presenterLive.liveState?.timerDurationSeconds || 0);
  const sharedTimerLevel = normalize(presenterLive.liveState?.timerLevel).toUpperCase();
  const sharedDurationSeconds = presenterLive.isToday
    && sharedTimerLevel === level
    && Number.isFinite(rawSharedDurationSeconds)
    && rawSharedDurationSeconds > 0
    ? rawSharedDurationSeconds
    : 0;
  // Academy presets cap oversized shared durations, but deliberately shorter
  // live-class sessions (for example a 45-minute A1 class) remain shorter.
  const durationSeconds = configuredDurationSeconds > 0 && sharedDurationSeconds > 0
    ? Math.min(configuredDurationSeconds, sharedDurationSeconds)
    : sharedDurationSeconds || configuredDurationSeconds;
  const durationMinutes = durationSeconds / 60;
  const liveState = presenterLive.liveState || {};
  const attendanceControlsTimer = presenterLive.isToday
    && liveState.classStartSource === "checkin"
    && Number(liveState.classStartedAtMs || 0) > 0
    && normalize(liveState.sessionTimingAuthority || "attendance") === "attendance";
  const attendanceSessionEnded = liveState.classLifecycleStatus === "ended"
    || liveState.classStatus === "ended"
    || Number(liveState.classEndedAtMs || 0) > 0;
  const attendanceTimerNeedsManualStart = attendanceControlsTimer
    && !attendanceSessionEnded
    && !Boolean(liveState.timerRunning)
    && Number(liveState.timerEndAt || 0) <= 0;
  const agendaAutoStartRequested = typeof window !== "undefined"
    && new URLSearchParams(window.location.search).get("autostart") === "1";
  const [classId, setClassId] = useState(currentPresenterClassId);
  const storageKey = useMemo(
    () => presenterClassTimerStorageKey(level, classId, new Date(), presenterLive.sessionKey),
    [level, classId, presenterLive.sessionKey],
  );
  const [remaining, setRemaining] = useState(durationSeconds);
  const [running, setRunning] = useState(false);
  const [endAt, setEndAt] = useState(0);
  const [warnedMilestones, setWarnedMilestones] = useState([]);
  const [notice, setNotice] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(readSoundPreference);
  const [hydratedKey, setHydratedKey] = useState("");
  const previousRemainingRef = useRef(durationSeconds);
  const audioContextRef = useRef(null);
  const lastRemoteTimerStampRef = useRef(0);
  const expiryPublishedRef = useRef(false);
  const agendaAutoStartHandledRef = useRef(false);
  const manualAttendanceRepairRef = useRef(false);

  useEffect(() => {
    const next = normalize(presenterLive.classContext?.classId) || currentPresenterClassId();
    setClassId((current) => current === next ? current : next);
  }, [presenterLive.classContext?.classId]);

  useEffect(() => {
    setHydratedKey("");
    lastRemoteTimerStampRef.current = 0;
    if (!durationSeconds) return;
    const restored = readStoredTimer(storageKey, durationSeconds);
    setRemaining(restored.remaining);
    setRunning(restored.running);
    setEndAt(restored.endAt);
    setWarnedMilestones(restored.warned);
    setNotice(restored.remaining <= 0 ? "Class time is up." : "");
    previousRemainingRef.current = restored.remaining;
    expiryPublishedRef.current = restored.remaining <= 0;
    setHydratedKey(storageKey);
  }, [durationSeconds, storageKey]);

  useEffect(() => {
    if (!durationSeconds || hydratedKey !== storageKey || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({
        date: localDateKey(),
        remaining,
        running,
        endAt,
        warned: warnedMilestones,
      }));
    } catch {
      // The timer still works when browser storage is unavailable.
    }
  }, [durationSeconds, storageKey, hydratedKey, remaining, running, endAt, warnedMilestones]);

  useEffect(() => {
    const remote = presenterLive.liveState || {};
    const remoteStamp = Number(remote.timerUpdatedAtMs || 0);
    if (!presenterLive.hasSnapshot || !presenterLive.isToday || !remoteStamp) return;
    if (normalize(remote.timerLevel).toUpperCase() !== level) return;
    if (remoteStamp <= lastRemoteTimerStampRef.current) return;

    lastRemoteTimerStampRef.current = remoteStamp;
    const remoteEnded = remote.classLifecycleStatus === "ended"
      || remote.classStatus === "ended"
      || Number(remote.classEndedAtMs || 0) > 0;
    const remoteRunning = !remoteEnded && Boolean(remote.timerRunning);
    const nowMs = Date.now();
    const rawRemoteEndAt = Math.max(0, Number(remote.timerEndAt || 0));
    const remoteDurationSeconds = Math.max(0, Number(remote.timerDurationSeconds || 0));
    const checkinStartedAtMs = remote.classStartSource === "checkin"
      ? Math.max(0, Number(remote.classStartedAtMs || 0))
      : 0;
    const derivedCheckinEndAt = checkinStartedAtMs > 0 && durationSeconds > 0
      ? checkinStartedAtMs + (durationSeconds * 1000)
      : 0;
    const candidateRemoteEndAt = remoteRunning
      ? (checkinStartedAtMs > 0 && configuredDurationSeconds > 0
        ? derivedCheckinEndAt
        : (rawRemoteEndAt || derivedCheckinEndAt))
      : 0;
    const maximumAllowedEndAt = checkinStartedAtMs > 0 && durationSeconds > 0
      ? checkinStartedAtMs + (durationSeconds * 1000)
      : nowMs + (durationSeconds * 1000);
    const remoteEndAt = candidateRemoteEndAt > 0 && durationSeconds > 0
      ? Math.min(candidateRemoteEndAt, maximumAllowedEndAt)
      : candidateRemoteEndAt;
    const remoteRemaining = remoteRunning && remoteEndAt
      ? Math.max(0, Math.min(durationSeconds, Math.ceil((remoteEndAt - nowMs) / 1000)))
      : Math.max(0, Math.min(durationSeconds, Number(remote.timerRemaining ?? remoteDurationSeconds ?? durationSeconds)));
    const remoteWarned = Array.isArray(remote.timerWarned)
      ? remote.timerWarned.map(Number).filter(Number.isFinite)
      : baselineWarnings(remoteRemaining);

    previousRemainingRef.current = remoteRemaining;
    expiryPublishedRef.current = remoteRemaining <= 0;
    setRemaining(remoteRemaining);
    setRunning(remoteRunning && remoteRemaining > 0);
    setEndAt(remoteRunning && remoteRemaining > 0 ? remoteEndAt : 0);
    setWarnedMilestones(remoteWarned);
    setNotice(
      remoteEnded
        ? "Class ended from check-in"
        : remoteRemaining <= 0
          ? "Class time is up."
          : remote.classStartSource === "checkin"
            ? "Running from Attendance"
            : presenterLive.isRemoteState
              ? "Updated from other device"
              : "Timer synchronized",
    );
  }, [presenterLive.liveState?.timerUpdatedAtMs, presenterLive.hasSnapshot, presenterLive.isToday, presenterLive.isRemoteState, presenterLive.publish, level, durationSeconds]);

  useEffect(() => {
    if (!presenterLive.classRecordId || !presenterLive.hasSnapshot || !durationSeconds) return;
    if (attendanceControlsTimer) return;
    const remote = presenterLive.liveState || {};
    const hasRemoteTimer = presenterLive.isToday
      && normalize(remote.timerLevel).toUpperCase() === level
      && Number(remote.timerUpdatedAtMs || 0) > 0;
    if (hasRemoteTimer) return;
    presenterLive.publish({
      timerLevel: level,
      timerDurationSeconds: durationSeconds,
      timerRunning: running,
      timerEndAt: Number(endAt || 0),
      timerRemaining: Number(remaining || 0),
      timerWarned: warnedMilestones,
      timerExpired: remaining <= 0,
      timerUpdatedAtMs: Date.now(),
    });
  }, [presenterLive.classRecordId, presenterLive.hasSnapshot, presenterLive.isToday, presenterLive.liveState?.timerUpdatedAtMs, presenterLive.publish, attendanceControlsTimer, durationSeconds, level, running, endAt, remaining, warnedMilestones]);

  function publishTimerState(patch = {}) {
    if (!presenterLive.classRecordId || attendanceControlsTimer) return;
    presenterLive.publish({
      timerLevel: level,
      timerDurationSeconds: durationSeconds,
      timerWarned: warnedMilestones,
      timerUpdatedAtMs: Date.now(),
      ...patch,
    });
  }

  function ensureAudioContext() {
    if (typeof window === "undefined") return null;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioContextRef.current) audioContextRef.current = new AudioContextClass();
    return audioContextRef.current;
  }

  async function playWarningTone(thresholdSeconds, force = false) {
    if (!force && !soundEnabled) return;
    try {
      const context = ensureAudioContext();
      if (!context) return;
      if (context.state === "suspended") await context.resume();
      const pulses = thresholdSeconds <= 0 ? 2 : 1;
      for (let index = 0; index < pulses; index += 1) {
        const start = context.currentTime + index * 0.18;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.frequency.value = thresholdSeconds <= 0 ? 660 : 520;
        gain.gain.setValueAtTime(0.035, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.12);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(start);
        oscillator.stop(start + 0.13);
      }
    } catch {
      // Visible warnings remain available when the browser blocks audio.
    }
  }

  function recordCrossedWarnings(previous, next) {
    const crossed = warningSeconds().filter(
      (threshold) => previous > threshold && next <= threshold && !warnedMilestones.includes(threshold),
    );
    if (!crossed.length) return;
    setWarnedMilestones((current) => [...new Set([...current, ...crossed])]);
    const mostUrgent = Math.min(...crossed);
    setNotice(warningLabel(mostUrgent));
    playWarningTone(mostUrgent);
  }

  useEffect(() => {
    if (!running || !endAt) return undefined;
    const tick = () => {
      const next = Math.max(0, Math.min(durationSeconds, Math.ceil((endAt - Date.now()) / 1000)));
      const previous = previousRemainingRef.current;
      recordCrossedWarnings(previous, next);
      previousRemainingRef.current = next;
      setRemaining(next);
      if (next <= 0) {
        setRunning(false);
        setEndAt(0);
        if (!expiryPublishedRef.current) {
          expiryPublishedRef.current = true;
          if (!attendanceControlsTimer) publishTimerState({
            timerRunning: false,
            timerEndAt: 0,
            timerRemaining: 0,
            timerExpired: true,
          });
        }
      }
    };
    tick();
    const timer = window.setInterval(tick, 500);
    return () => window.clearInterval(timer);
  }, [running, endAt, durationSeconds, warnedMilestones, soundEnabled, presenterLive.classRecordId, attendanceControlsTimer]);

  useEffect(() => () => {
    try {
      audioContextRef.current?.close?.();
    } catch {
      // Nothing to clean up when audio is unavailable.
    }
  }, []);

  if (!durationSeconds) return null;

  const expired = remaining <= 0;
  const warningClass = visualWarningClass(remaining);

  async function startTimerSession(seconds, nextEndAt, nextWarned = warnedMilestones, { source = "presenter" } = {}) {
    const nowMs = Date.now();
    const safeSeconds = Math.max(0, Math.min(durationSeconds, Number(seconds || 0)));
    if (safeSeconds <= 0) {
      setRemaining(0);
      setRunning(false);
      setEndAt(0);
      setNotice("Class time is up.");
      return;
    }

    expiryPublishedRef.current = false;
    previousRemainingRef.current = safeSeconds;
    setRemaining(safeSeconds);
    setEndAt(nextEndAt);
    setRunning(true);
    if (source === "attendance-repair") setNotice("Timer started manually from the slide.");

    const patch = {
      classLifecycleStatus: "running",
      timerLevel: level,
      timerDurationSeconds: durationSeconds,
      timerRunning: true,
      timerEndAt: nextEndAt,
      timerRemaining: safeSeconds,
      timerWarned: nextWarned,
      timerExpired: false,
      timerUpdatedAtMs: nowMs,
    };

    if (source === "attendance-repair") {
      manualAttendanceRepairRef.current = true;
      await presenterLive.publish({
        ...patch,
        sessionTimingAuthority: "attendance",
        timerRepairSource: "presenter-manual-fallback",
      });
      return;
    }

    const remoteStartedAt = Number(liveState.classStartedAtMs || 0);
    if (presenterLive.classRecordId && presenterLive.sessionKey && remoteStartedAt <= 0) {
      const startResult = await startPresenterLiveSession(
        presenterLive.classRecordId,
        presenterLive.sessionKey,
        {
          sessionDate: presenterLive.sessionDate,
          level,
          lessonId: normalize(slide?.id || slide?.assignmentId),
          assignmentId: normalize(slide?.assignmentId || slide?.id),
          classStartedAtMs: nowMs,
          classStartSource: "presenter",
          classStartUpdatedAtMs: nowMs,
          sessionTimingAuthority: "presenter",
          ...patch,
        },
      );
      if (startResult?.ok) return;
    }

    publishTimerState(patch);
  }

  async function startAttendanceTimerManually() {
    if (!attendanceTimerNeedsManualStart || !durationSeconds) return;
    const nowMs = Date.now();
    const classStartedAtMs = Math.max(0, Number(liveState.classStartedAtMs || 0));
    const targetEndAt = classStartedAtMs > 0
      ? classStartedAtMs + (durationSeconds * 1000)
      : nowMs + (durationSeconds * 1000);
    const seconds = Math.max(0, Math.min(durationSeconds, Math.ceil((targetEndAt - nowMs) / 1000)));
    await startTimerSession(seconds, targetEndAt, baselineWarnings(seconds), { source: "attendance-repair" });
    if (soundEnabled) ensureAudioContext()?.resume?.().catch?.(() => {});
  }

  function startOrResume() {
    if (attendanceControlsTimer) return;
    const restarting = remaining <= 0;
    const seconds = restarting ? durationSeconds : remaining;
    const nextWarned = restarting ? [] : warnedMilestones;
    if (restarting) {
      setWarnedMilestones([]);
      setNotice("");
    }
    const nextEndAt = Date.now() + seconds * 1000;
    void startTimerSession(seconds, nextEndAt, nextWarned);
    if (soundEnabled) ensureAudioContext()?.resume?.().catch?.(() => {});
  }

  useEffect(() => {
    if (!agendaAutoStartRequested || agendaAutoStartHandledRef.current || !durationSeconds) return;
    if (hydratedKey !== storageKey) return;
    if (attendanceControlsTimer) {
      agendaAutoStartHandledRef.current = true;
      return;
    }
    if (presenterLive.classRecordId && !presenterLive.hasSnapshot) return;
    agendaAutoStartHandledRef.current = true;
    startOrResume();
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("autostart");
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    } catch {
      // Autostart is already guarded in-memory if URL cleanup is unavailable.
    }
  }, [
    agendaAutoStartRequested,
    attendanceControlsTimer,
    durationSeconds,
    hydratedKey,
    presenterLive.classRecordId,
    presenterLive.hasSnapshot,
    storageKey,
  ]);

  function pause() {
    if (attendanceControlsTimer || !running) return;
    const next = Math.max(0, Math.min(durationSeconds, Math.ceil((endAt - Date.now()) / 1000)));
    previousRemainingRef.current = next;
    setRemaining(next);
    setRunning(false);
    setEndAt(0);
    publishTimerState({
      classLifecycleStatus: "paused",
      timerRunning: false,
      timerEndAt: 0,
      timerRemaining: next,
      timerExpired: next <= 0,
    });
  }

  function reset() {
    if (attendanceControlsTimer) return;
    previousRemainingRef.current = durationSeconds;
    expiryPublishedRef.current = false;
    setRemaining(durationSeconds);
    setRunning(false);
    setEndAt(0);
    setWarnedMilestones([]);
    setNotice("");
    publishTimerState({
      classLifecycleStatus: "waiting",
      timerRunning: false,
      timerEndAt: 0,
      timerRemaining: durationSeconds,
      timerWarned: [],
      timerExpired: false,
    });
  }

  function toggleSound() {
    const next = !soundEnabled;
    setSoundEnabled(next);
    try {
      window.localStorage.setItem(SOUND_PREFERENCE_KEY, next ? "on" : "off");
    } catch {
      // Sound preference remains usable for this page even without storage.
    }
    if (next) playWarningTone(10 * 60, true);
  }

  const syncLabel = !presenterLive.classRecordId
    ? ""
    : presenterLive.syncState === "live"
      ? " · computer ↔ iPad live"
      : presenterLive.syncState === "connecting"
        ? " · connecting remote"
        : presenterLive.syncState === "offline"
          ? " · remote offline"
          : "";
  const statusText = attendanceControlsTimer
    ? (expired
      ? "Class time is up."
      : attendanceTimerNeedsManualStart
        ? "Attendance marked the class started, but the timer is not running."
        : notice || (running ? "Running from Attendance" : "Attendance timer stopped"))
    : expired
      ? "Class time is up."
      : notice
        || (running ? "Time remaining" : remaining < durationSeconds ? "Paused" : "Ready to start");

  return (
    <div className={`presenter-session-timer ${warningClass}`} aria-live="polite">
      <div className="presenter-session-timer-copy">
        <span>Class time · {level} · {durationMinutes} min</span>
        <strong>{expired ? "TIME UP" : formatSessionTime(remaining)}</strong>
        <small>{statusText}{syncLabel}</small>
      </div>
      <div className="presenter-session-timer-actions">
        {attendanceControlsTimer ? (
          attendanceTimerNeedsManualStart ? (
            <button
              type="button"
              className="presenter-session-start is-attendance-repair"
              onClick={startAttendanceTimerManually}
              title="Attendance marked the class started, but its timer did not start. Start the timer from this slide using the original class start time."
            >
              Start timer manually
            </button>
          ) : (
            <button
              type="button"
              className="presenter-session-start is-attendance-active"
              disabled
              title="The class timer was started from Attendance."
            >
              {expired ? "Class ended" : "Class started"}
            </button>
          )
        ) : (
          <>
            <button type="button" className="presenter-session-start" onClick={running ? pause : startOrResume}>{running ? "Pause" : expired ? "Restart" : remaining === durationSeconds ? "Start class" : "Resume"}</button>
            <button type="button" onClick={reset}>Reset</button>
          </>
        )}
        <button type="button" className="presenter-session-sound" onClick={toggleSound} aria-pressed={soundEnabled} title="Optional short sound at 30, 15, 10 and 5 minutes left and at time up.">
          Sound: {soundEnabled ? "on" : "off"}
        </button>
      </div>
    </div>
  );
}

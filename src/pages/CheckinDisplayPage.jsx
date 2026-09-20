import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { getClassSchedule } from "../data/classSchedules";
import { pianoPieces, pianoPlaylist } from "../data/pianoPlaylist.js";
import { PIANO_BAR_INTERVAL_MS, schedulePianoBar } from "../utils/pianoAudio.js";
import { presenterSessionDurationSeconds } from "../utils/presenterSessionTiming.js";
import { subscribeSessionCheckins } from "../services/attendanceService.js";
import { listClasses } from "../services/classesService.js";
import {
  presenterLocalDateKey,
  publishPresenterLiveSession,
  setPresenterClassContext,
} from "../services/presenterLiveSessionService.js";
import "./CheckinDisplayPage.css";

const ATTENDANCE_UTC_OFFSET_HOURS = 0;
const ATTENDANCE_TIME_ZONE = "Africa/Accra";
const ATTENDANCE_TIME_ZONE_LABEL = "Ghana time (UTC+00:00)";
const WAITING_PIANO_CHORDS = [
  [130.81, 261.63, 329.63, 392.0],
  [110.0, 220.0, 261.63, 329.63],
  [87.31, 174.61, 220.0, 261.63],
  [98.0, 196.0, 246.94, 293.66],
];

function parseSessionDate(dateValue) {
  const raw = String(dateValue || "").trim();
  if (!raw) return null;

  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return {
      year: Number.parseInt(isoMatch[1], 10),
      month: Number.parseInt(isoMatch[2], 10),
      day: Number.parseInt(isoMatch[3], 10),
    };
  }

  const direct = new Date(raw);
  if (!Number.isNaN(direct.getTime())) {
    return {
      year: direct.getFullYear(),
      month: direct.getMonth() + 1,
      day: direct.getDate(),
    };
  }

  const withoutWeekday = raw.replace(/^[A-Za-z]+,\s*/, "");
  const fallback = new Date(withoutWeekday);
  if (!Number.isNaN(fallback.getTime())) {
    return {
      year: fallback.getFullYear(),
      month: fallback.getMonth() + 1,
      day: fallback.getDate(),
    };
  }

  return null;
}

function formatDisplayTimeLabel(timeText, fallbackDateTimeMs) {
  if (timeText) return timeText;
  if (Number.isFinite(fallbackDateTimeMs)) {
    return new Date(fallbackDateTimeMs).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: ATTENDANCE_TIME_ZONE,
    });
  }
  return "soon";
}

function parseDateTime(dateValue, timeValue) {
  const date = parseSessionDate(dateValue);
  const time = String(timeValue || "").trim();
  if (!date || !/^\d{2}:\d{2}$/.test(time)) return null;

  const [hours, minutes] = time.split(":").map((value) => Number.parseInt(value, 10));
  return Date.UTC(
    date.year,
    date.month - 1,
    date.day,
    hours - ATTENDANCE_UTC_OFFSET_HOURS,
    minutes,
    0,
    0
  );
}

function formatLiveClockLabel(timestamp) {
  if (!Number.isFinite(timestamp)) return "--:--:--";
  const d = new Date(Number(timestamp));
  if (Number.isNaN(d.getTime())) return "--:--:--";
  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: ATTENDANCE_TIME_ZONE,
  });
}

function formatDuration(ms) {
  if (!Number.isFinite(ms)) return "-";
  if (ms <= 0) return "00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function normalizeClassLookup(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\bklasse\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function inferClassLevel(klass = {}, ...fallbacks) {
  const candidates = [
    klass.levelId,
    klass.level,
    klass.courseLevel,
    klass.languageLevel,
    ...fallbacks,
  ];
  for (const candidate of candidates) {
    const match = String(candidate || "").toUpperCase().match(/\b(A1|A2|B1|B2|C1|C2)\b/);
    if (match) return match[1];
  }
  return "";
}

function schedulePianoNote(context, destination, frequency, startsAt, velocity = 1, duration = 3.6) {
  const noteGain = context.createGain();
  const toneFilter = context.createBiquadFilter();
  const harmonics = [
    { ratio: 1, gain: 0.18, type: "triangle", detune: -1.5 },
    { ratio: 2, gain: 0.055, type: "sine", detune: 1.5 },
    { ratio: 3.01, gain: 0.022, type: "sine", detune: -0.8 },
  ];

  toneFilter.type = "lowpass";
  toneFilter.frequency.setValueAtTime(4200, startsAt);
  toneFilter.frequency.exponentialRampToValueAtTime(1500, startsAt + Math.min(duration, 2.5));
  toneFilter.Q.setValueAtTime(0.7, startsAt);

  noteGain.gain.setValueAtTime(0.0001, startsAt);
  noteGain.gain.exponentialRampToValueAtTime(Math.max(0.0002, 0.42 * velocity), startsAt + 0.008);
  noteGain.gain.exponentialRampToValueAtTime(Math.max(0.0002, 0.16 * velocity), startsAt + 0.22);
  noteGain.gain.exponentialRampToValueAtTime(0.0001, startsAt + duration);

  toneFilter.connect(noteGain);
  noteGain.connect(destination);

  harmonics.forEach((harmonic) => {
    const oscillator = context.createOscillator();
    const harmonicGain = context.createGain();
    oscillator.type = harmonic.type;
    oscillator.frequency.setValueAtTime(frequency * harmonic.ratio, startsAt);
    oscillator.detune.setValueAtTime(harmonic.detune, startsAt);
    harmonicGain.gain.setValueAtTime(harmonic.gain, startsAt);
    oscillator.connect(harmonicGain);
    harmonicGain.connect(toneFilter);
    oscillator.start(startsAt);
    oscillator.stop(startsAt + duration + 0.05);
  });
}

function scheduleStartChime(context, destination) {
  const startsAt = context.currentTime + 0.03;
  schedulePianoNote(context, destination, 523.25, startsAt, 0.55, 1.1);
  schedulePianoNote(context, destination, 659.25, startsAt + 0.18, 0.5, 1.25);
}

function checkinDisplayName(checkin = {}, index = 0) {
  return String(
    checkin.name
    || checkin.studentName
    || checkin.displayName
    || checkin.studentCode
    || checkin.studentId
    || checkin.id
    || `Student ${index + 1}`,
  ).trim();
}

function classStartDecisionStorageKey(classId, sessionId, dateLabel) {
  const safeClassId = String(classId || "").trim();
  const safeSessionId = String(sessionId || "").trim();
  const safeDate = String(dateLabel || "").trim();
  if (!safeClassId || !safeSessionId) return "";
  return `falowen-class-start:${safeClassId}:${safeSessionId}:${safeDate || "no-date"}`;
}

function readClassStartDecision(storageKey) {
  if (!storageKey) return { actualStartedAt: null, delayUntil: null };
  try {
    const saved = JSON.parse(window.localStorage.getItem(storageKey) || "null");
    return {
      actualStartedAt: Number.isFinite(Number(saved?.actualStartedAt)) ? Number(saved.actualStartedAt) : null,
      delayUntil: Number.isFinite(Number(saved?.delayUntil)) ? Number(saved.delayUntil) : null,
    };
  } catch {
    return { actualStartedAt: null, delayUntil: null };
  }
}

function writeClassStartDecision(storageKey, value) {
  if (!storageKey) return;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(value));
  } catch {
    // The waiting screen remains usable when browser storage is unavailable.
  }
}

export default function CheckinDisplayPage() {
  const [sp] = useSearchParams();
  const classId = sp.get("classId") || sp.get("className") || "";
  const sessionId = sp.get("sessionId") || sp.get("session") || "";
  const date = sp.get("date") || "";
  const sessionLabel = sp.get("sessionLabel") || sp.get("lesson") || "";
  const assignmentId = sp.get("assignmentId") || sp.get("assignment_id") || "";
  const startTime = sp.get("startTime") || "";
  const endTime = sp.get("endTime") || "";
  const expectedCount = sp.get("expectedCount") || "";
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [musicVolume, setMusicVolume] = useState(0.5);
  const [musicError, setMusicError] = useState("");
  const [currentPianoPiece, setCurrentPianoPiece] = useState(pianoPieces[0][0]);
  const audioContextRef = useRef(null);
  const musicGainRef = useRef(null);
  const musicTimerRef = useRef(null);
  const musicChordIndexRef = useRef(0);
  const [checkins, setCheckins] = useState([]);
  const [attendanceLive, setAttendanceLive] = useState(false);
  const [attendanceError, setAttendanceError] = useState("");
  const [showNames, setShowNames] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [actualStartedAt, setActualStartedAt] = useState(null);
  const [delayUntil, setDelayUntil] = useState(null);
  const [slideSyncStatus, setSlideSyncStatus] = useState({ state: "idle", message: "" });
  const classStartStopTimerRef = useRef(null);
  const musicStartGenerationRef = useRef(0);
  const classStartedRef = useRef(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!classId || !String(sessionId || "").trim()) {
      setCheckins([]);
      setAttendanceLive(false);
      setAttendanceError("");
      return undefined;
    }

    setCheckins([]);
    setAttendanceLive(false);
    setAttendanceError("");

    return subscribeSessionCheckins({
      classId,
      sessionId,
      onChange: (rows) => {
        setCheckins(rows);
        setAttendanceLive(true);
        setAttendanceError("");
      },
      onError: (cause) => {
        setAttendanceLive(false);
        setAttendanceError(
          cause?.code === "permission-denied"
            ? "Live names are available when this display is opened from a signed-in admin session."
            : (cause?.message || "Live attendance could not be loaded."),
        );
      },
    });
  }, [classId, sessionId]);

  const scheduleInfo = useMemo(() => {
    const sessionIndex = Number.parseInt(String(sessionId || ""), 10);
    if (!Number.isInteger(sessionIndex)) return null;

    const schedule = getClassSchedule(classId);
    const zeroBasedIndex = sessionIndex > 0 ? sessionIndex - 1 : sessionIndex;
    const item = schedule[zeroBasedIndex] || schedule[sessionIndex];
    if (!item) return null;

    return {
      dateLabel: item.date || String(date || ""),
      sessionDisplayLabel: `${item.day || ""} - ${item.topic || ""}`.trim().replace(/^\s*-\s*/, ""),
    };
  }, [classId, sessionId, date]);

  const hasDateFromUrl = Boolean(String(date || "").trim());
  const hasSessionLabelFromUrl = Boolean(String(sessionLabel || "").trim());
  const dateLabel = hasDateFromUrl ? String(date).trim() : (scheduleInfo?.dateLabel || "");
  const sessionDisplayLabel = hasSessionLabelFromUrl
    ? String(sessionLabel).trim()
    : (scheduleInfo?.sessionDisplayLabel || "");
  const startDecisionStorageKey = useMemo(
    () => classStartDecisionStorageKey(classId, sessionId, dateLabel),
    [classId, sessionId, dateLabel],
  );

  useEffect(() => {
    const saved = readClassStartDecision(startDecisionStorageKey);
    classStartedRef.current = Boolean(saved.actualStartedAt);
    setActualStartedAt(saved.actualStartedAt);
    setDelayUntil(saved.delayUntil);
    setSlideSyncStatus(
      saved.actualStartedAt
        ? { state: "restored", message: "Class start restored. Shared slide timer was not changed." }
        : { state: "idle", message: "" },
    );
  }, [startDecisionStorageKey]);

  const checkinUrl = useMemo(() => {
    const base = window.location.origin;
    const qs = new URLSearchParams({
      classId,
      sessionId: String(sessionId || ""),
      date: dateLabel,
      sessionLabel: sessionDisplayLabel,
      assignmentId: String(assignmentId || ""),
      startTime: String(startTime || ""),
      endTime: String(endTime || ""),
      expectedCount: String(expectedCount || ""),
    }).toString();
    return `${base}/checkin?${qs}`;
  }, [classId, sessionId, dateLabel, sessionDisplayLabel, assignmentId, startTime, endTime, expectedCount]);

  const expectedTotal = useMemo(() => {
    const parsed = Number.parseInt(String(expectedCount || ""), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }, [expectedCount]);

  const checkedInCount = checkins.length;
  const attendancePercent = expectedTotal
    ? Math.min(100, Math.round((checkedInCount / expectedTotal) * 100))
    : 0;
  const checkedInNames = useMemo(
    () => checkins.map((row, index) => checkinDisplayName(row, index)).filter(Boolean),
    [checkins],
  );

  const statusInfo = useMemo(() => {
    const scheduledStartAt = parseDateTime(dateLabel, startTime);

    if (actualStartedAt) {
      return {
        kind: "active",
        title: "Class is in progress.",
        detail: `Started at ${formatLiveClockLabel(actualStartedAt)}. Students who are still joining can continue to check in.`,
      };
    }

    if (scheduledStartAt && nowMs < scheduledStartAt) {
      const startLabel = formatDisplayTimeLabel(startTime, scheduledStartAt);
      return {
        kind: "before",
        title: `Hello! Class is scheduled for ${startLabel} ${ATTENDANCE_TIME_ZONE_LABEL}.`,
        detail: "Kindly check in while you wait for the teacher to start the class.",
      };
    }

    if (scheduledStartAt) {
      return {
        kind: "before",
        title: "Scheduled start time reached.",
        detail: delayUntil && nowMs < delayUntil
          ? `The teacher is allowing more joining time. Planned start is in ${formatDuration(delayUntil - nowMs)}.`
          : "The teacher has not started the class yet. Waiting-room music can continue quietly.",
      };
    }

    return {
      kind: "before",
      title: "Waiting for the teacher.",
      detail: "Please check in while you wait for the class to begin.",
    };
  }, [actualStartedAt, dateLabel, delayUntil, nowMs, startTime]);

  const classTiming = useMemo(() => {
    const scheduledStartAt = parseDateTime(dateLabel, startTime);

    if (actualStartedAt) {
      return {
        kind: "active",
        eyebrow: "Class started",
        value: `${formatDuration(nowMs - actualStartedAt)} ago`,
        note: `Actual start: ${formatLiveClockLabel(actualStartedAt)} ${ATTENDANCE_TIME_ZONE_LABEL}`,
      };
    }

    if (scheduledStartAt && nowMs < scheduledStartAt) {
      return {
        kind: "before",
        eyebrow: "Scheduled start in",
        value: formatDuration(scheduledStartAt - nowMs),
        note: `Scheduled for ${formatDisplayTimeLabel(startTime, scheduledStartAt)} ${ATTENDANCE_TIME_ZONE_LABEL}`,
      };
    }

    if (delayUntil && nowMs < delayUntil) {
      return {
        kind: "waiting",
        eyebrow: "Teacher delayed start",
        value: formatDuration(delayUntil - nowMs),
        note: "Waiting for remaining students. Music continues quietly until the teacher starts.",
      };
    }

    return {
      kind: "waiting",
      eyebrow: scheduledStartAt ? "Scheduled start reached" : "Waiting room",
      value: "Waiting for teacher",
      note: "The class begins only when the teacher presses Start class & slides.",
    };
  }, [actualStartedAt, dateLabel, delayUntil, nowMs, startTime]);

  const stopWaitingMusic = useCallback(() => {
    musicStartGenerationRef.current += 1;
    if (musicTimerRef.current) {
      window.clearInterval(musicTimerRef.current);
      musicTimerRef.current = null;
    }

    const context = audioContextRef.current;
    audioContextRef.current = null;
    musicGainRef.current = null;
    musicChordIndexRef.current = 0;
    setCurrentPianoPiece(pianoPieces[0][0]);

    if (context && context.state !== "closed") {
      context.close().catch(() => {});
    }
    setMusicPlaying(false);
  }, []);

  const startWaitingMusic = useCallback(async () => {
    if (musicPlaying || classStartedRef.current) return;
    const startGeneration = musicStartGenerationRef.current + 1;
    musicStartGenerationRef.current = startGeneration;
    setMusicError("");

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      setMusicError("This browser does not support background audio.");
      return;
    }

    try {
      const context = new AudioContextClass();
      const masterGain = context.createGain();
      const compressor = context.createDynamicsCompressor();

      masterGain.gain.setValueAtTime(musicVolume, context.currentTime);
      compressor.threshold.setValueAtTime(-20, context.currentTime);
      compressor.knee.setValueAtTime(16, context.currentTime);
      compressor.ratio.setValueAtTime(3, context.currentTime);
      compressor.attack.setValueAtTime(0.006, context.currentTime);
      compressor.release.setValueAtTime(0.35, context.currentTime);
      masterGain.connect(compressor);
      compressor.connect(context.destination);

      audioContextRef.current = context;
      musicGainRef.current = masterGain;

      await context.resume();
      if (context.state !== "running") {
        await new Promise((resolve) => window.setTimeout(resolve, 80));
        await context.resume();
      }
      if (context.state !== "running") {
        throw new Error("Audio is blocked by this browser. Raise the device media volume, turn off silent mode, and tap Start again.");
      }

      if (musicStartGenerationRef.current !== startGeneration || classStartedRef.current) {
        if (context.state !== "closed") context.close().catch(() => {});
        return;
      }

      const playNextBar = () => {
        if (context.state !== "running") return;
        const bar = pianoPlaylist[musicChordIndexRef.current % pianoPlaylist.length];
        musicChordIndexRef.current += 1;
        setCurrentPianoPiece(bar.title);
        schedulePianoBar(context, masterGain, bar);
      };

      playNextBar();
      musicTimerRef.current = window.setInterval(playNextBar, PIANO_BAR_INTERVAL_MS);
      setMusicPlaying(true);
    } catch (error) {
      stopWaitingMusic();
      setMusicError(error?.message || "Piano music could not start. Raise the device media volume and try again.");
    }
  }, [musicPlaying, musicVolume, stopWaitingMusic]);

  useEffect(() => {
    const context = audioContextRef.current;
    const masterGain = musicGainRef.current;
    if (!context || !masterGain || context.state === "closed") return;
    masterGain.gain.setTargetAtTime(musicVolume, context.currentTime, 0.08);
  }, [musicVolume]);

  useEffect(() => {
    const context = audioContextRef.current;
    const masterGain = musicGainRef.current;
    const scheduledStartAt = parseDateTime(dateLabel, startTime);
    if (!musicPlaying || !context || !masterGain || !scheduledStartAt || context.state === "closed") return;
    if (actualStartedAt) return;

    const remainingMs = scheduledStartAt - nowMs;
    if (remainingMs > 60000) {
      masterGain.gain.setTargetAtTime(musicVolume, context.currentTime, 0.08);
      return;
    }

    if (remainingMs > 0) {
      const fadeFactor = 0.35 + (0.65 * (remainingMs / 60000));
      masterGain.gain.setTargetAtTime(
        Math.max(0.05, musicVolume * fadeFactor),
        context.currentTime,
        0.35,
      );
      return;
    }

    masterGain.gain.setTargetAtTime(
      Math.max(0.05, musicVolume * 0.35),
      context.currentTime,
      0.35,
    );
  }, [actualStartedAt, dateLabel, musicPlaying, musicVolume, nowMs, startTime]);

  const syncPresenterStart = useCallback(async (startedAt) => {
    if (!classId || !Number.isFinite(Number(startedAt))) return;
    const startMs = Number(startedAt);
    const sessionDate = /^\d{4}-\d{2}-\d{2}$/.test(String(dateLabel || "").trim())
      ? String(dateLabel).trim()
      : presenterLocalDateKey(new Date(startMs));
    const currentPresenterDate = presenterLocalDateKey();

    if (sessionDate !== currentPresenterDate) {
      setSlideSyncStatus({
        state: "skipped-date",
        message: `Slide timer not started because this attendance session is ${sessionDate}; Presenter sync only runs for today (${currentPresenterDate}).`,
      });
      return;
    }

    setSlideSyncStatus({ state: "syncing", message: "Starting slide timer…" });

    try {
      const classes = await listClasses();
      const targetKey = normalizeClassLookup(classId);
      const klass = classes.find((entry) => [
        entry?.classId,
        entry?.name,
        entry?.id,
        entry?.classRecordId,
      ].some((value) => normalizeClassLookup(value) === targetKey));

      const classRecordId = String(klass?.classRecordId || klass?.id || "").trim();
      if (!classRecordId) throw new Error(`Could not find the Firestore class record for ${classId}.`);

      const level = inferClassLevel(klass, assignmentId, classId);
      const durationSeconds = presenterSessionDurationSeconds(level);

      setPresenterClassContext({
        classId: String(klass?.classId || classId).trim(),
        classRecordId,
      });

      const livePatch = {
        sessionDate,
        level,
        lessonId: String(assignmentId || sessionId || "").trim(),
        assignmentId: String(assignmentId || "").trim(),
        classStartedAtMs: startMs,
        classStartSessionId: String(sessionId || "").trim(),
        classStartLabel: String(sessionDisplayLabel || "").trim(),
        classStartSource: "checkin",
        classStartUpdatedAtMs: startMs,
      };

      if (durationSeconds > 0) {
        livePatch.timerLevel = level;
        livePatch.timerDurationSeconds = durationSeconds;
        livePatch.timerRunning = true;
        livePatch.timerEndAt = startMs + (durationSeconds * 1000);
        livePatch.timerRemaining = durationSeconds;
        livePatch.timerWarned = [];
        livePatch.timerExpired = false;
        livePatch.timerUpdatedAtMs = startMs;
      }

      await publishPresenterLiveSession(classRecordId, livePatch);

      setSlideSyncStatus(
        durationSeconds > 0
          ? { state: "synced", message: "Slides timer started automatically." }
          : { state: "started-only", message: level ? `Slides notified; no automatic timer preset is configured for ${level}.` : "Slides notified; class level could not be identified for an automatic timer." },
      );
    } catch (error) {
      console.error("check-in presenter start sync failed", error);
      setSlideSyncStatus({
        state: "error",
        message: "Class started, but slide timer sync failed. You can retry here or use Start class on the slide.",
      });
    }
  }, [assignmentId, classId, dateLabel, sessionDisplayLabel, sessionId]);

  const delayClassStart = useCallback((minutes) => {
    if (actualStartedAt) return;
    const scheduledStartAt = parseDateTime(dateLabel, startTime) || nowMs;
    const base = Math.max(nowMs, scheduledStartAt, Number(delayUntil || 0));
    const nextDelayUntil = base + (Number(minutes) * 60 * 1000);
    setDelayUntil(nextDelayUntil);
    writeClassStartDecision(startDecisionStorageKey, {
      actualStartedAt: null,
      delayUntil: nextDelayUntil,
    });
  }, [actualStartedAt, dateLabel, delayUntil, nowMs, startDecisionStorageKey, startTime]);

  const handleStartClassNow = useCallback(() => {
    if (actualStartedAt) return;
    const startedAt = nowMs;
    classStartedRef.current = true;
    musicStartGenerationRef.current += 1;
    setActualStartedAt(startedAt);
    setDelayUntil(null);
    writeClassStartDecision(startDecisionStorageKey, {
      actualStartedAt: startedAt,
      delayUntil: null,
    });
    void syncPresenterStart(startedAt);

    const context = audioContextRef.current;
    const masterGain = musicGainRef.current;
    if (!context || !masterGain || context.state === "closed") {
      stopWaitingMusic();
      return;
    }
    if (!musicPlaying) {
      stopWaitingMusic();
      return;
    }

    scheduleStartChime(context, masterGain);
    masterGain.gain.setTargetAtTime(
      Math.max(0.08, musicVolume * 0.45),
      context.currentTime,
      0.08,
    );
    if (classStartStopTimerRef.current) window.clearTimeout(classStartStopTimerRef.current);
    classStartStopTimerRef.current = window.setTimeout(() => {
      stopWaitingMusic();
      classStartStopTimerRef.current = null;
    }, 1700);
  }, [actualStartedAt, musicPlaying, musicVolume, nowMs, startDecisionStorageKey, stopWaitingMusic, syncPresenterStart]);

  useEffect(() => () => {
    if (classStartStopTimerRef.current) window.clearTimeout(classStartStopTimerRef.current);
  }, []);

  useEffect(() => () => {
    if (musicTimerRef.current) window.clearInterval(musicTimerRef.current);
    const context = audioContextRef.current;
    if (context && context.state !== "closed") context.close().catch(() => {});
  }, []);

  const copyCheckinLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(checkinUrl);
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 1800);
    } catch {
      setCopiedLink(false);
    }
  }, [checkinUrl]);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      // Fullscreen can be blocked by browser or device policy; the display still works normally.
    }
  }, []);

  const hasRequiredParams = Boolean(classId && String(sessionId || "").trim());

  return (
    <div className="checkin-display-page">
      <div className="checkin-display-card">
        <div className="checkin-display-toolbar">
          <div className="checkin-display-brand">Falowen Attendance</div>
          <div className="checkin-display-toolbar-actions">
            <button type="button" onClick={toggleFullscreen}>Full screen</button>
            <button type="button" onClick={copyCheckinLink}>{copiedLink ? "Link copied" : "Copy check-in link"}</button>
            <button type="button" onClick={() => setShowNames((value) => !value)}>
              {showNames ? "Hide names" : "Show names"}
            </button>
          </div>
        </div>

        <header className="checkin-display-hero">
          <div>
            <div className="checkin-display-class-label">{classId || "Class"}</div>
            <h1>{sessionDisplayLabel || "Student Self Check-in"}</h1>
            <p>Scan the QR code to record your attendance.</p>
          </div>
          <div className="checkin-display-clock">
            <span>Current time</span>
            <strong>{formatLiveClockLabel(nowMs)}</strong>
            <small>{ATTENDANCE_TIME_ZONE_LABEL}</small>
          </div>
        </header>

        {classTiming ? (
          <div className={"checkin-display-timing checkin-display-timing-" + classTiming.kind} role="status" aria-live="polite">
            <div className="checkin-display-timing-eyebrow">{classTiming.eyebrow}</div>
            <div className="checkin-display-timing-value">{classTiming.value}</div>
            <div className="checkin-display-timing-note">{classTiming.note}</div>
          </div>
        ) : null}

        <div className="checkin-display-teacher-controls">
          <div className="checkin-display-teacher-control-copy">
            <strong>Teacher start control</strong>
            <span>
              {actualStartedAt
                ? `Class started at ${formatLiveClockLabel(actualStartedAt)}. ${slideSyncStatus.message || "Synchronizing slide timer…"}`
                : delayUntil && nowMs < delayUntil
                  ? `Waiting another ${formatDuration(delayUntil - nowMs)} · ${checkedInCount}${expectedTotal ? ` / ${expectedTotal}` : ""} checked in.`
                  : `${checkedInCount}${expectedTotal ? ` / ${expectedTotal}` : ""} checked in. Start when you are ready.`}
            </span>
          </div>
          {!actualStartedAt ? (
            <div className="checkin-display-teacher-control-actions">
              <button type="button" className="checkin-display-start-now" onClick={handleStartClassNow}>
                Start class & slides
              </button>
              <button type="button" onClick={() => delayClassStart(5)}>+5 min</button>
              <button type="button" onClick={() => delayClassStart(10)}>+10 min</button>
            </div>
          ) : (
            <div className="checkin-display-teacher-control-actions">
              <div className="checkin-display-started-badge">
                {slideSyncStatus.state === "syncing" ? "Starting slides…" : "Class started"}
              </div>
              {slideSyncStatus.state === "error" ? (
                <button type="button" onClick={() => syncPresenterStart(actualStartedAt)}>Retry slide sync</button>
              ) : null}
            </div>
          )}
        </div>

        {hasRequiredParams ? (
          <div className="checkin-display-main-grid">
            <section className="checkin-display-qr-panel">
              <div className="checkin-display-qr-wrap">
                <QRCodeCanvas value={checkinUrl} size={320} includeMargin />
              </div>
              <div className="checkin-display-scan-copy">Scan to record your attendance</div>
              <div className="checkin-display-session-mini">
                <span>{dateLabel || "Today"}</span>
                <span>{startTime || "--:--"}–{endTime || "--:--"}</span>
                {assignmentId ? <span>{assignmentId}</span> : null}
              </div>
            </section>

            <section className="checkin-display-attendance-panel" aria-live="polite">
              <div className="checkin-display-attendance-label">Live attendance</div>
              <div className="checkin-display-attendance-count">
                {expectedTotal ? checkedInCount + " / " + expectedTotal : checkedInCount}
              </div>
              <div className="checkin-display-attendance-copy">
                {checkedInCount === 1 ? "student checked in" : "students checked in"}
              </div>
              {expectedTotal ? (
                <div className="checkin-display-progress" aria-label={attendancePercent + "% checked in"}>
                  <span style={{ width: attendancePercent + "%" }} />
                </div>
              ) : null}
              <div className="checkin-display-live-indicator">
                <span className={attendanceLive ? "is-live" : ""} />
                {attendanceLive ? "Updating live" : "Waiting for signed-in live data"}
              </div>

              {showNames ? (
                <div className="checkin-display-name-list">
                  <div className="checkin-display-name-title">Checked in</div>
                  {checkedInNames.length ? checkedInNames.map((name, index) => (
                    <div className="checkin-display-name-row" key={name + index}>
                      <span>{name}</span><strong>✓</strong>
                    </div>
                  )) : (
                    <div className="checkin-display-name-empty">
                      {attendanceLive ? "No student has checked in yet." : "Names are only available to a signed-in admin display."}
                    </div>
                  )}
                </div>
              ) : (
                <div className="checkin-display-privacy-note">Student names are hidden on the projector by default.</div>
              )}

              {attendanceError ? <div className="checkin-display-attendance-error">{attendanceError}</div> : null}
            </section>
          </div>
        ) : (
          <div className="checkin-display-warning">
            Missing class/session details. Please reopen this display page from the Attendance screen.
          </div>
        )}

        <div className={`checkin-display-music ${musicPlaying ? "checkin-display-music-playing" : ""}`}>
          <div className="checkin-display-music-main">
            <div className="checkin-display-music-copy">
              <div className="checkin-display-music-title">
                <span aria-hidden="true">♫</span> Extended piano playlist
              </div>
              <div className="checkin-display-music-note">
                About four minutes of original modern and cinematic piano before repeating. {musicPlaying ? `Now playing: ${currentPianoPiece}.` : ""}
              </div>
            </div>
            <div className="checkin-display-music-visual" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
            <button
              type="button"
              className="checkin-display-music-button"
              onClick={musicPlaying ? stopWaitingMusic : startWaitingMusic}
              disabled={!musicPlaying && Boolean(actualStartedAt)}
            >
              {musicPlaying ? "Stop piano" : "Start piano playlist"}
            </button>
          </div>
          <label className="checkin-display-music-volume">
            <span>Volume</span>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.01"
              value={musicVolume}
              onChange={(event) => setMusicVolume(Number(event.target.value))}
              aria-label="Piano music volume"
            />
            <span>{Math.round(musicVolume * 100)}%</span>
          </label>
          {musicError ? <div className="checkin-display-music-error" role="alert">{musicError}</div> : null}
        </div>

        <div className={"checkin-display-alert checkin-display-alert-" + statusInfo.kind}>
          <div className="checkin-display-alert-title">{statusInfo.title}</div>
          <div>{statusInfo.detail}</div>
        </div>

        <div className="checkin-display-footer">
          <span><b>Class:</b> {classId || "-"}</span>
          <span><b>Date:</b> {dateLabel || "-"}</span>
          <span><b>Session:</b> {sessionDisplayLabel || "-"}</span>
          <span><b>Expected:</b> {expectedTotal || "-"}</span>
        </div>
      </div>
    </div>
  );
}

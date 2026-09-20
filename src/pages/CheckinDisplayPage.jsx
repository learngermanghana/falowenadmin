import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { getClassSchedule } from "../data/classSchedules";
import { pianoPieces, pianoPlaylist } from "../data/pianoPlaylist.js";
import { PIANO_BAR_INTERVAL_MS, schedulePianoBar } from "../utils/pianoAudio.js";
import { subscribeSessionCheckins } from "../services/attendanceService.js";
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
  const classStartStopTimerRef = useRef(null);
  const autoStoppedMusicRef = useRef(false);

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
    const startAt = parseDateTime(dateLabel, startTime);
    const endAt = parseDateTime(dateLabel, endTime);

    if (endAt && nowMs > endAt) {
      const endLabel = formatDisplayTimeLabel(endTime, endAt);
      return {
        kind: "ended",
        title: "Class has ended.",
        detail: `Class ended at ${endLabel} ${ATTENDANCE_TIME_ZONE_LABEL}. If you still haven't checked in, please do it now for late attendance recording.`,
      };
    }

    if (startAt && nowMs < startAt) {
      const startLabel = formatDisplayTimeLabel(startTime, startAt);
      return {
        kind: "before",
        title: `Hello! Class starts at ${startLabel} ${ATTENDANCE_TIME_ZONE_LABEL}.`,
        detail: "Kindly check in for your attendance to be recorded while you wait for the meeting to start.",
      };
    }

    const startAt = parseDateTime(dateLabel, startTime);
    return {
      kind: "active",
      title: "Class is in progress.",
      detail: startAt
        ? `Class started ${formatDuration(nowMs - startAt)} ago. Please check in now if you haven't submitted yet.`
        : "Please check in now if you haven't submitted yet.",
    };
  }, [dateLabel, nowMs, startTime, endTime]);

  const classTiming = useMemo(() => {
    const startAt = parseDateTime(dateLabel, startTime);
    const endAt = parseDateTime(dateLabel, endTime);

    if (startAt && nowMs < startAt) {
      return {
        kind: "before",
        eyebrow: "Class starts in",
        value: formatDuration(startAt - nowMs),
        note: `Starts at ${formatDisplayTimeLabel(startTime, startAt)} ${ATTENDANCE_TIME_ZONE_LABEL}`,
      };
    }

    if (startAt && (!endAt || nowMs <= endAt)) {
      return {
        kind: "active",
        eyebrow: "Class started",
        value: `${formatDuration(nowMs - startAt)} ago`,
        note: "Check-in remains available for students who have not submitted yet.",
      };
    }

    if (endAt && nowMs > endAt) {
      return {
        kind: "ended",
        eyebrow: "Class ended",
        value: `${formatDuration(nowMs - endAt)} ago`,
        note: `Ended at ${formatDisplayTimeLabel(endTime, endAt)} ${ATTENDANCE_TIME_ZONE_LABEL}`,
      };
    }

    return null;
  }, [dateLabel, endTime, nowMs, startTime]);

  const stopWaitingMusic = useCallback(() => {
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
    if (musicPlaying) return;
    setMusicError("");
    autoStoppedMusicRef.current = false;

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

      scheduleStartChime(context, masterGain);

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
    const startAt = parseDateTime(dateLabel, startTime);
    if (!musicPlaying || !context || !masterGain || !startAt || context.state === "closed") return;

    const remainingMs = startAt - nowMs;
    if (remainingMs > 60000) {
      masterGain.gain.setTargetAtTime(musicVolume, context.currentTime, 0.08);
      return;
    }

    if (remainingMs > 0) {
      const fadeFactor = 0.2 + (0.8 * (remainingMs / 60000));
      masterGain.gain.setTargetAtTime(
        Math.max(0.05, musicVolume * fadeFactor),
        context.currentTime,
        0.35,
      );
      return;
    }

    if (autoStoppedMusicRef.current) return;
    autoStoppedMusicRef.current = true;
    scheduleStartChime(context, masterGain);
    masterGain.gain.setTargetAtTime(Math.max(0.08, musicVolume * 0.45), context.currentTime, 0.08);
    classStartStopTimerRef.current = window.setTimeout(() => {
      stopWaitingMusic();
      classStartStopTimerRef.current = null;
    }, 1700);
  }, [dateLabel, musicPlaying, musicVolume, nowMs, startTime, stopWaitingMusic]);

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

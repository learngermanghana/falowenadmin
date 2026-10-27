import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { findScheduleItemBySessionId } from "../data/classSchedules";
import { useToast } from "../context/ToastContext.jsx";
import "./CheckinPage.css";

const ATTENDANCE_TIME_ZONE = "Africa/Accra";
const ATTENDANCE_TIME_ZONE_LABEL = "Ghana time";
const RECENT_STUDENT_KEY = "falowen-checkin-recent-student";

function resolveStatusApiUrl() {
  const checkinUrl = String(import.meta.env.VITE_CHECKIN_API_URL || "").trim();
  if (!checkinUrl) return "";
  return checkinUrl.replace(/\/checkin\/?$/, "/checkinStatus");
}

function formatClock(timestamp) {
  if (!timestamp) return "-";
  const d = new Date(Number(timestamp));
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: ATTENDANCE_TIME_ZONE,
  });
}

function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return "00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function resolveFallbackStartTimestamp(dateValue, startTimeValue) {
  const safeDate = String(dateValue || "").trim();
  const safeStartTime = String(startTimeValue || "").trim();
  if (!safeDate || !safeStartTime) return null;

  const [yearRaw, monthRaw, dayRaw] = safeDate.split("-");
  const [hoursRaw, minutesRaw] = safeStartTime.split(":");
  const values = [yearRaw, monthRaw, dayRaw, hoursRaw, minutesRaw].map(Number);
  if (!values.every(Number.isFinite)) return null;

  const [year, month, day, hour, minute] = values;
  const asUtc = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  return Number.isFinite(asUtc) ? asUtc : null;
}

function maskEmail(value) {
  return String(value || "").trim().replace(/(^.).*(@.*$)/, "$1***$2");
}

function submittedStorageKey(classId, sessionId) {
  if (!classId || !sessionId) return "";
  return `falowen-checkin-success:${classId}:${sessionId}`;
}

function fallbackClassName(sessionId = "") {
  const prefix = String(sessionId || "").split("_")[0]?.trim();
  return prefix || "Your class";
}

export default function CheckinPage() {
  const { success, error } = useToast();
  const [sp] = useSearchParams();

  const classId = sp.get("classId") || sp.get("className") || "";
  const sessionId = sp.get("sessionId") || sp.get("session") || "";
  const date = sp.get("date") || "";
  const sessionLabel = sp.get("sessionLabel") || sp.get("lesson") || "";
  const assignmentId = sp.get("assignmentId") || "";
  const startTime = sp.get("startTime") || "";

  const scheduleInfo = useMemo(() => {
    const item = findScheduleItemBySessionId(classId, sessionId);
    if (!item) return null;
    return {
      dateLabel: item.date || String(date || ""),
      sessionDisplayLabel: `${item.day || ""} - ${item.topic || ""}`.trim().replace(/^\s*-\s*/, ""),
    };
  }, [classId, sessionId, date]);

  const emailRef = useRef(null);
  const phoneRef = useRef(null);
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const [submittedInfo, setSubmittedInfo] = useState(null);
  const [recentStudent, setRecentStudent] = useState(null);
  const [checkinStatus, setCheckinStatus] = useState(null);
  const [statusBusy, setStatusBusy] = useState(false);
  const [statusError, setStatusError] = useState("");
  const [serverTimeMs, setServerTimeMs] = useState(() => Date.now());

  const statusApiUrl = useMemo(resolveStatusApiUrl, []);
  const normalizedPhone = useMemo(
    () => String(phoneNumber || "").replace(/\D+/g, ""),
    [phoneNumber],
  );

  const resolvedDate = String(date || checkinStatus?.date || scheduleInfo?.dateLabel || "").trim();
  const resolvedAssignmentId = String(assignmentId || checkinStatus?.assignmentId || "").trim();
  const resolvedStartTime = String(startTime || checkinStatus?.startTime || "").trim();

  const classDisplayName = useMemo(
    () => String(checkinStatus?.className || fallbackClassName(sessionId)).trim(),
    [checkinStatus?.className, sessionId],
  );

  const lessonDisplayName = useMemo(
    () =>
      String(
        checkinStatus?.sessionLabel ||
          sessionLabel ||
          scheduleInfo?.sessionDisplayLabel ||
          "Today's lesson",
      ).trim(),
    [checkinStatus?.sessionLabel, sessionLabel, scheduleInfo?.sessionDisplayLabel],
  );

  const dateLabel = resolvedDate;

  const fieldErrors = useMemo(() => {
    const errors = {};
    const trimmedEmail = email.trim();
    if (!trimmedEmail) errors.email = "Enter the email you used when registering.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) errors.email = "Enter a valid email address.";

    if (!phoneNumber.trim()) errors.phoneNumber = "Enter the phone number linked to your student record.";
    else if (normalizedPhone.length < 7) errors.phoneNumber = "Enter a valid phone number.";
    return errors;
  }, [email, phoneNumber, normalizedPhone]);

  const validationError = fieldErrors.email || fieldErrors.phoneNumber || "";
  const canSubmit = Boolean(classId && sessionId && !validationError && !submittedInfo);

  useEffect(() => {
    const key = submittedStorageKey(classId, sessionId);
    if (!key) return;
    try {
      const stored = JSON.parse(window.localStorage.getItem(key) || "null");
      if (stored?.checkedInAt) setSubmittedInfo(stored);
    } catch {
      // The server remains authoritative if local confirmation data is unavailable.
    }
  }, [classId, sessionId]);

  useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(RECENT_STUDENT_KEY) || "null");
      if (stored?.maskedEmail || stored?.studentName) setRecentStudent(stored);
    } catch {
      // Ignore unavailable browser history.
    }
  }, []);

  useEffect(() => {
    if (!classId || !sessionId || !statusApiUrl) return;

    let canceled = false;
    const loadStatus = async () => {
      setStatusBusy(true);
      setStatusError("");
      try {
        const u = new URL(statusApiUrl);
        u.searchParams.set("classId", classId);
        u.searchParams.set("sessionId", sessionId);
        const res = await fetch(u.toString());
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Could not load check-in status.");
        if (canceled) return;
        setCheckinStatus(data);
        if (Number.isFinite(data?.serverTime)) setServerTimeMs(Number(data.serverTime));
      } catch (statusLoadError) {
        if (!canceled) setStatusError(statusLoadError?.message || "Could not load check-in status.");
      } finally {
        if (!canceled) setStatusBusy(false);
      }
    };

    loadStatus();
    const poll = window.setInterval(loadStatus, 30000);
    return () => {
      canceled = true;
      window.clearInterval(poll);
    };
  }, [classId, sessionId, statusApiUrl]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setServerTimeMs((current) => (Number.isFinite(current) ? current + 1000 : Date.now()));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const preClassCountdown = useMemo(() => {
    const status = String(checkinStatus?.status || "");
    const startMs =
      Number(checkinStatus?.startsAt || 0) ||
      resolveFallbackStartTimestamp(resolvedDate, resolvedStartTime) ||
      Number(checkinStatus?.openFrom || 0);
    if (!startMs || (checkinStatus && status !== "scheduled")) return null;
    const remainingMs = startMs - serverTimeMs;
    if (remainingMs <= 0) return null;
    return {
      remainingLabel: formatDuration(remainingMs),
      startLabel: formatClock(startMs),
    };
  }, [checkinStatus, resolvedDate, resolvedStartTime, serverTimeMs]);

  const statusSummary = useMemo(() => {
    const status = String(checkinStatus?.status || "");
    if (!status) return null;

    if (status === "open") {
      return {
        tone: "open",
        label: "Check-in is open",
        detail: checkinStatus?.openTo
          ? `Closes in ${formatDuration(Number(checkinStatus.openTo) - serverTimeMs)}`
          : "Enter your registered details below.",
      };
    }
    if (status === "scheduled") {
      return {
        tone: "scheduled",
        label: "Check-in opens with your class",
        detail: preClassCountdown
          ? `Class starts at ${preClassCountdown.startLabel} ${ATTENDANCE_TIME_ZONE_LABEL}.`
          : "",
      };
    }
    if (status === "ended") {
      return {
        tone: "ended",
        label: "Check-in has closed",
        detail: "If your attendance was missed, ask your teacher to correct it.",
      };
    }
    return {
      tone: "closed",
      label: "Check-in is not open yet",
      detail: "Wait for your teacher to open attendance.",
    };
  }, [checkinStatus, serverTimeMs, preClassCountdown]);

  const saveConfirmation = (data, fallbackEmail) => {
    const confirmation = {
      checkedInAt: data?.submittedAt || Date.now(),
      maskedEmail: data?.maskedEmail || maskEmail(fallbackEmail),
      maskedPhone: data?.maskedPhone || "",
      studentName: data?.studentName || "Student",
      className: data?.className || classDisplayName,
      sessionDisplayLabel: data?.sessionLabel || lessonDisplayName,
    };

    setSubmittedInfo(confirmation);
    const sessionKey = submittedStorageKey(classId, sessionId);
    if (sessionKey) window.localStorage.setItem(sessionKey, JSON.stringify(confirmation));

    const recent = {
      maskedEmail: confirmation.maskedEmail,
      maskedPhone: confirmation.maskedPhone,
      studentName: confirmation.studentName,
    };
    window.localStorage.setItem(RECENT_STUDENT_KEY, JSON.stringify(recent));
    setRecentStudent(recent);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (submittedInfo) return;

    if (validationError) {
      error(validationError);
      if (fieldErrors.email) emailRef.current?.focus();
      else phoneRef.current?.focus();
      return;
    }

    setBusy(true);
    try {
      const trimmedEmail = email.trim();
      const trimmedPhone = phoneNumber.trim();
      const res = await fetch(import.meta.env.VITE_CHECKIN_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId,
          sessionId,
          date: resolvedDate,
          email: trimmedEmail,
          phoneNumber: trimmedPhone,
          sessionLabel: lessonDisplayName,
          assignmentId: resolvedAssignmentId,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 409 && data?.duplicate) {
        saveConfirmation(data, trimmedEmail);
        success("Attendance was already recorded for this class.");
        setEmail("");
        setPhoneNumber("");
        return;
      }

      if (!res.ok) throw new Error(data?.error || "Check-in failed.");

      saveConfirmation(data, trimmedEmail);
      success("Attendance recorded.");
      setEmail("");
      setPhoneNumber("");
    } catch (submitError) {
      error(submitError?.message || "Check-in failed.");
    } finally {
      setBusy(false);
    }
  };

  const clearRecentStudent = () => {
    window.localStorage.removeItem(RECENT_STUDENT_KEY);
    setRecentStudent(null);
    setEmail("");
    setPhoneNumber("");
    emailRef.current?.focus();
  };

  return (
    <div className="checkin-page">
      <div className="checkin-card">
        <header className="checkin-student-header">
          <div className="checkin-eyebrow">LLEA Attendance</div>
          <h2>Student Check-in</h2>
          <p>Use the email and phone number registered on your student record.</p>
        </header>

        <section className="checkin-lesson-summary" aria-label="Class details">
          <div>
            <span>Class</span>
            <strong>{classDisplayName}</strong>
          </div>
          <div>
            <span>Today</span>
            <strong>{lessonDisplayName}</strong>
          </div>
          {dateLabel ? (
            <div>
              <span>Date</span>
              <strong>{dateLabel}</strong>
            </div>
          ) : null}
        </section>

        {preClassCountdown ? (
          <div className="checkin-live-countdown" role="status" aria-live="polite">
            <div className="checkin-live-countdown-title">Class starts in</div>
            <div className="checkin-live-countdown-timer">{preClassCountdown.remainingLabel}</div>
            <div className="checkin-live-countdown-note">{preClassCountdown.startLabel} · {ATTENDANCE_TIME_ZONE_LABEL}</div>
          </div>
        ) : null}

        {statusSummary ? (
          <div className={`checkin-status checkin-status-${statusSummary.tone}`}>
            <div className="checkin-status-label">{statusSummary.label}</div>
            {statusSummary.detail ? <div className="checkin-status-detail">{statusSummary.detail}</div> : null}
          </div>
        ) : null}

        {statusBusy ? <div className="checkin-help">Refreshing attendance status…</div> : null}
        {statusError ? <div className="checkin-inline-error">{statusError}</div> : null}

        {submittedInfo ? (
          <section className="checkin-success-card" role="status" aria-live="polite">
            <div className="checkin-success-title">Attendance recorded</div>
            <strong>{submittedInfo.studentName}</strong>
            <div>{submittedInfo.className || classDisplayName}</div>
            <div>{submittedInfo.sessionDisplayLabel || lessonDisplayName}</div>
            <div>
              Checked in at{" "}
              {new Date(submittedInfo.checkedInAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: ATTENDANCE_TIME_ZONE,
              })}{" "}
              {ATTENDANCE_TIME_ZONE_LABEL}
            </div>
            {submittedInfo.maskedEmail ? <small>{submittedInfo.maskedEmail}{submittedInfo.maskedPhone ? ` · ${submittedInfo.maskedPhone}` : ""}</small> : null}
          </section>
        ) : (
          <>
            {recentStudent ? (
              <section className="checkin-returning-student">
                <div>
                  <strong>Welcome back{recentStudent.studentName && recentStudent.studentName !== "Student" ? `, ${recentStudent.studentName}` : ""}</strong>
                  <span>{[recentStudent.maskedEmail, recentStudent.maskedPhone].filter(Boolean).join(" · ")}</span>
                </div>
                <button type="button" onClick={clearRecentStudent}>Not me</button>
              </section>
            ) : null}

            {(!classId || !sessionId) ? (
              <div className="checkin-warning">This attendance link is incomplete. Ask your teacher to show the class QR code again.</div>
            ) : null}

            <form onSubmit={submit} className="checkin-form" noValidate>
              <div className="checkin-form-intro">
                <strong>Confirm your student details</strong>
                <span>We verify both details against the class roster before attendance is recorded.</span>
              </div>

              <label className="checkin-field">
                <span>Email address</span>
                <input
                  ref={emailRef}
                  placeholder="name@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  aria-label="Email address"
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? "checkin-email-error" : undefined}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  disabled={busy}
                />
                {fieldErrors.email ? <span id="checkin-email-error" className="checkin-inline-error">{fieldErrors.email}</span> : null}
              </label>

              <label className="checkin-field">
                <span>Phone number</span>
                <input
                  ref={phoneRef}
                  placeholder="024 123 4567 or +233 24 123 4567"
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  aria-label="Phone number"
                  aria-invalid={Boolean(fieldErrors.phoneNumber)}
                  aria-describedby={fieldErrors.phoneNumber ? "checkin-phone-error" : "checkin-phone-help"}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  disabled={busy}
                />
                <span id="checkin-phone-help" className="checkin-help">
                  Ghana local and +233 formats are accepted.
                </span>
                {fieldErrors.phoneNumber ? <span id="checkin-phone-error" className="checkin-inline-error">{fieldErrors.phoneNumber}</span> : null}
              </label>

              <button disabled={!canSubmit || busy}>
                {busy ? "Checking your details…" : "Mark me present"}
              </button>
            </form>
          </>
        )}

        <p className="checkin-privacy-note">
          Your details are used only to match your student record and class attendance. Teacher presentation slides are not shared from the attendance page.
        </p>
      </div>
    </div>
  );
}

import { useMemo, useState } from "react";

const FALOWEN_BASE_URL = "https://www.falowen.app";

function normalize(value) {
  return String(value || "").trim();
}

function toDate(value) {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  if (typeof value?.toMillis === "function") return new Date(value.toMillis());
  if (typeof value === "object" && Number.isFinite(value.seconds)) {
    return new Date((Number(value.seconds) * 1000) + Math.round(Number(value.nanoseconds || 0) / 1000000));
  }
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function localDate(value) {
  const date = toDate(value);
  if (!date) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Accra",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function localTime(value) {
  const date = toDate(value);
  if (!date) return "";
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Accra",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.hour}:${values.minute}`;
}

function falowenHref(path = "") {
  const value = normalize(path);
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `${FALOWEN_BASE_URL}${value.startsWith("/") ? value : `/${value}`}`;
}

function adminHref(path, params = {}) {
  const url = new URL(path, window.location.origin);
  Object.entries(params).forEach(([key, value]) => {
    if (normalize(value)) url.searchParams.set(key, normalize(value));
  });
  return `${url.pathname}${url.search}${url.hash}`;
}

function presenterContext() {
  const params = new URLSearchParams(window.location.search);
  return {
    classId: normalize(params.get("classId")),
    className: normalize(params.get("className")),
    sessionId: normalize(params.get("sessionId")),
    sessionLabel: normalize(params.get("sessionLabel")),
    assignmentId: normalize(params.get("assignmentId")),
    startsAt: normalize(params.get("sessionStartsAt")),
    endsAt: normalize(params.get("sessionEndsAt")),
  };
}

export default function PresenterClassTools({ slide, classId = "", className = "" }) {
  const [copyState, setCopyState] = useState("");
  const context = useMemo(() => presenterContext(), []);
  const resolvedClassId = normalize(classId || context.classId);
  const resolvedClassName = normalize(className || context.className || resolvedClassId);
  const assignmentId = normalize(context.assignmentId || slide?.assignmentId || slide?.id);
  const sessionLabel = normalize(context.sessionLabel || slide?.title || slide?.topic);
  const workbookUrl = falowenHref(slide?.workbookConnection?.workbookUrl);
  const grammarUrl = falowenHref(slide?.workbookConnection?.grammarUrl);

  const checkinHref = useMemo(() => {
    if (!resolvedClassId || !context.sessionId) return "";
    return adminHref("/checkin", {
      classId: resolvedClassId,
      sessionId: context.sessionId,
      date: localDate(context.startsAt),
      sessionLabel,
      assignmentId,
      startTime: localTime(context.startsAt),
      endTime: localTime(context.endsAt),
    });
  }, [resolvedClassId, context.sessionId, context.startsAt, context.endsAt, sessionLabel, assignmentId]);

  const attendanceHref = resolvedClassId ? `/attendance/${encodeURIComponent(resolvedClassId)}` : "";
  const studentsHref = resolvedClassId ? adminHref("/live-classes", { classId: resolvedClassId, tab: "students" }) : "/live-classes";
  const participationHref = resolvedClassId ? adminHref("/class-participation", { classId: resolvedClassId }) : "/class-participation";
  const messageHref = adminHref("/communication", {
    className: resolvedClassName,
    topic: "Teaching Slides",
    link: window.location.href,
  });

  async function copyCheckinLink() {
    if (!checkinHref) return;
    const absolute = new URL(checkinHref, window.location.origin).toString();
    try {
      await navigator.clipboard.writeText(absolute);
      setCopyState("Copied");
    } catch {
      setCopyState("Copy failed");
    }
    window.setTimeout(() => setCopyState(""), 1800);
  }

  return (
    <details className="presenter-class-tools">
      <summary>Class tools</summary>
      <div className="presenter-class-tools-panel">
        <div className="presenter-class-tools-heading">
          <strong>{resolvedClassName || "Select a class"}</strong>
          {context.sessionId ? <small>{sessionLabel || context.sessionId}</small> : <small>Presenter classroom shortcuts</small>}
        </div>

        <div className="presenter-class-tools-grid">
          {checkinHref ? <a href={checkinHref} target="_blank" rel="noreferrer">Open check-in</a> : <span className="is-disabled">Check-in unavailable</span>}
          {checkinHref ? <button type="button" onClick={copyCheckinLink}>{copyState || "Copy check-in link"}</button> : null}
          {attendanceHref ? <a href={attendanceHref} target="_blank" rel="noreferrer">Attendance</a> : null}
          <a href={studentsHref} target="_blank" rel="noreferrer">Students</a>
          <a href={participationHref} target="_blank" rel="noreferrer">Participation</a>
          <a href={messageHref} target="_blank" rel="noreferrer">Message class</a>
          {workbookUrl ? <a href={workbookUrl} target="_blank" rel="noreferrer">Workbook</a> : null}
          {grammarUrl ? <a href={grammarUrl} target="_blank" rel="noreferrer">Grammar notes</a> : null}
        </div>

        {!context.sessionId ? (
          <small className="presenter-class-tools-help">Open Presenter from Live Classes to get the exact session check-in link.</small>
        ) : null}
      </div>
    </details>
  );
}

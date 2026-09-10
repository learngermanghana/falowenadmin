import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { getCompatibleClassDashboard } from "../services/liveClassCompatibilityService.js";
import { listClassCohorts, rescheduleSession } from "../services/liveClassService.js";
import { saveAnnouncementRow } from "../services/communicationService.js";

function normalize(value) {
  return String(value || "").trim();
}

function statusOf(session = {}) {
  return normalize(session.status || session.sessionStatus || "scheduled").toLowerCase();
}

function activeSession(session = {}) {
  return !["cancelled", "canceled", "completed", "superseded", "deleted"].includes(statusOf(session))
    && session.superseded !== true;
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

function localDate(value, timezone = "Africa/Accra") {
  const date = toDate(value);
  if (!date) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: normalize(timezone) || "Africa/Accra",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function formatSession(session = {}, timezone = "Africa/Accra") {
  const date = toDate(session.startsAt);
  if (!date) return normalize(session.topic || session.title || session.id) || "Unknown session";
  const when = date.toLocaleString("en-GB", {
    timeZone: normalize(timezone) || "Africa/Accra",
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${normalize(session.topic || session.title) || "Class session"} — ${when}`;
}

function defaultCancellationMessage(session = {}, reason = "") {
  const label = normalize(session.topic || session.title) || "today's class";
  const why = normalize(reason);
  return `${label} has been cancelled.${why ? ` Reason: ${why}.` : ""} We will share any replacement schedule separately.`;
}

const fieldStyle = { display: "grid", gap: 6 };
const inputStyle = { padding: 10, borderRadius: 8, border: "1px solid #d0d7de" };

export default function CommunicationLiveClassActions() {
  const { user } = useAuth();
  const toast = useToast();
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState("");
  const [dashboard, setDashboard] = useState(null);
  const [sessionId, setSessionId] = useState("");
  const [action, setAction] = useState("cancel");
  const [reason, setReason] = useState("");
  const [newStartsAt, setNewStartsAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    listClassCohorts()
      .then((rows) => {
        if (active) setClasses(rows);
      })
      .catch((error) => {
        if (active) toast.error(error?.message || "Could not load Live Classes.");
      });
    return () => { active = false; };
  }, [toast]);

  useEffect(() => {
    let active = true;
    setDashboard(null);
    setSessionId("");
    if (!classId) return () => { active = false; };
    setLoading(true);
    getCompatibleClassDashboard(classId)
      .then((next) => {
        if (active) setDashboard(next);
      })
      .catch((error) => {
        if (active) toast.error(error?.message || "Could not load the class sessions.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [classId, toast]);

  const klass = dashboard?.klass || classes.find((item) => item.id === classId) || null;
  const timezone = normalize(klass?.timezone) || "Africa/Accra";
  const sessions = useMemo(
    () => (dashboard?.sessions || [])
      .filter(activeSession)
      .sort((left, right) => (toDate(left.startsAt)?.getTime() || 0) - (toDate(right.startsAt)?.getTime() || 0)),
    [dashboard],
  );
  const session = sessions.find((item) => normalize(item.id) === normalize(sessionId)) || null;

  async function refresh() {
    if (!classId) return;
    const next = await getCompatibleClassDashboard(classId);
    setDashboard(next);
  }

  async function runAction() {
    if (!klass || !session || !normalize(reason) || busy) return;
    const adminId = normalize(user?.uid || user?.email) || "communication-page";
    setBusy(true);
    try {
      if (action === "cancel") {
        const announcement = defaultCancellationMessage(session, reason);
        const receipt = await saveAnnouncementRow({
          announcement,
          className: normalize(klass.name || klass.className || klass.id),
          classSessionId: session.id,
          sessionId: session.id,
          cancellationReason: reason,
          reason,
          adminId,
          date: localDate(session.startsAt, timezone),
          link: "",
          topic: "Class Cancellation",
          liveClassAction: "cancel",
          deliveryMode: "auto",
        });
        toast.success(receipt?.sheet?.message || "Class cancelled successfully.", { durationMs: 12000 });
      } else {
        if (!normalize(newStartsAt)) throw new Error("Choose the new class date and time.");
        const result = await rescheduleSession(session.id, {
          classId: normalize(klass.id || klass.classId),
          className: normalize(klass.name || klass.className),
          startsAt: newStartsAt,
          domStartsAt: newStartsAt,
          reason,
          adminId,
          timezone,
          scheduleRules: klass.scheduleRules || [],
        });
        if (result.emailSubmitted) {
          toast.success(`Class rescheduled successfully. Live Classes and reminders were updated first, then the schedule-change email was sent. ${result.emailMessage || ""}`.trim(), { durationMs: 12000 });
        } else {
          toast.info(`Class rescheduled successfully, but the schedule-change email could not be confirmed: ${result.emailMessage || "delivery not confirmed"}`, { durationMs: 12000 });
        }
      }

      await refresh();
      setSessionId("");
      setReason("");
      setNewStartsAt("");
    } catch (error) {
      toast.error(error?.message || `Could not ${action} this class.`, { durationMs: 12000 });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section style={{ display: "grid", gap: 12, padding: 14, border: "1px solid #bfdbfe", borderRadius: 12, background: "#eff6ff" }}>
      <div>
        <h3 style={{ margin: "0 0 6px" }}>Live class change</h3>
        <p style={{ margin: 0, opacity: 0.8 }}>
          Cancel or reschedule the actual Live Classes session first. Student communication only follows the successful timetable change.
        </p>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" onClick={() => setAction("cancel")} disabled={busy} aria-pressed={action === "cancel"}>Cancel class</button>
        <button type="button" onClick={() => setAction("reschedule")} disabled={busy} aria-pressed={action === "reschedule"}>Reschedule class</button>
      </div>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <label style={fieldStyle}>
          <strong>Class</strong>
          <select style={inputStyle} value={classId} onChange={(event) => setClassId(event.target.value)} disabled={busy}>
            <option value="">Select class</option>
            {classes.map((item) => (
              <option key={item.id} value={item.id}>{item.name || item.className || item.id}</option>
            ))}
          </select>
        </label>

        <label style={fieldStyle}>
          <strong>Lesson / session</strong>
          <select style={inputStyle} value={sessionId} onChange={(event) => setSessionId(event.target.value)} disabled={busy || loading || !classId}>
            <option value="">{loading ? "Loading sessions…" : "Select the exact session"}</option>
            {sessions.map((item) => (
              <option key={item.id} value={item.id}>{formatSession(item, timezone)}</option>
            ))}
          </select>
        </label>

        {action === "reschedule" ? (
          <label style={fieldStyle}>
            <strong>New date and time</strong>
            <input type="datetime-local" style={inputStyle} value={newStartsAt} onChange={(event) => setNewStartsAt(event.target.value)} disabled={busy} />
          </label>
        ) : null}
      </div>

      <label style={fieldStyle}>
        <strong>Reason</strong>
        <textarea style={{ ...inputStyle, minHeight: 72 }} value={reason} onChange={(event) => setReason(event.target.value)} placeholder={action === "cancel" ? "Why is this class cancelled?" : "Why is this class being rescheduled?"} disabled={busy} />
      </label>

      <div>
        <button type="button" onClick={runAction} disabled={busy || !session || !normalize(reason) || (action === "reschedule" && !normalize(newStartsAt))}>
          {busy ? (action === "cancel" ? "Cancelling…" : "Rescheduling…") : (action === "cancel" ? "Cancel class and notify students" : "Reschedule class and notify students")}
        </button>
      </div>
    </section>
  );
}

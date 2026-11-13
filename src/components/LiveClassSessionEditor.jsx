import { useMemo, useState } from "react";
import { cancelSession, rescheduleSession } from "../services/liveClassService.js";
import { scheduleChangePreview } from "../utils/liveClassWorkspace.js";
import LiveClassChangePreview from "./LiveClassChangePreview.jsx";

const SESSION_CHANGE_REASONS = [
  { label: "Wrong date", value: "This class had the wrong date in the timetable, so the class date has been corrected." },
  { label: "Raining / light out", value: "The class cannot hold because of heavy rain and a power outage." },
  { label: "Tutor travelled", value: "The class cannot hold because the tutor is unavailable due to travel." },
  { label: "Emergency", value: "The class cannot hold because of an emergency." },
];

function ghanaParts(value) {
  const parsed = typeof value?.toDate === "function" ? value.toDate() : new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Accra",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(parsed);
  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

function toDateTimeLocal(value) {
  const parts = ghanaParts(value);
  if (!parts) return "";
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

function splitDateTimeLocal(value) {
  const [localDate = "", localTime = ""] = String(value || "").split("T");
  const time = localTime.slice(0, 5);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(localDate) || !/^\d{2}:\d{2}$/.test(time)) return null;
  return { localDate, localTime: time };
}

function sessionDurationMinutes(session = {}) {
  const startsAt = new Date(session.startsAt || 0);
  const endsAt = new Date(session.endsAt || 0);
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) return 60;
  const minutes = Math.round((endsAt.getTime() - startsAt.getTime()) / 60000);
  return minutes > 0 ? minutes : 60;
}

function formatDateTime(value) {
  if (!value) return "-";
  const parsed = typeof value?.toDate === "function" ? value.toDate() : new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleString("en-GB", {
    timeZone: "Africa/Accra",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function LiveClassSessionEditor({ klass, sessions, session, initialAction, adminId, onSaved, onClose }) {
  const status = String(session.status || "scheduled").toLowerCase();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sessionChange, setSessionChange] = useState(() => ({
      sessionId: session.id,
      classId: klass.id || klass.classRecordId || session.classRecordId || session.classId,
      className: klass.name || session.className || "",
      action: initialAction,
      moveMode: klass.scheduleRules?.length ? "following" : "single",
      scheduleRules: klass.scheduleRules || [],
      startsAt: toDateTimeLocal(session.startsAt),
      reason: status === "cancelled"
        ? ("This cancelled class has been rescheduled.")
        : (initialAction === "cancel" ? "This class has been cancelled." : "The class date or time has changed."),
      durationMinutes: sessionDurationMinutes(session),
      originalStatus: status,
  }));
  const changePreview = useMemo(() => {
    if (sessionChange.action !== "cancel" && sessionChange.startsAt === toDateTimeLocal(session.startsAt)) {
      return { plan: null, error: "" };
    }
    try {
      return { plan: scheduleChangePreview({ klass, sessions, change: sessionChange }), error: "" };
    } catch (error) {
      return { plan: null, error: error.message };
    }
  }, [klass, sessions, session, sessionChange]);

  async function handleSessionChangeSubmit(event) {
    event.preventDefault();
    if (!sessionChange?.sessionId || !changePreview.plan) return;
    setBusy(true);
    setError("");

    try {
      const classId = sessionChange.classId;
      const className = sessionChange.className;
      const reason = String(sessionChange.reason || "").trim();
      if (!reason) throw new Error("Write the reason or message students should receive.");

      if (sessionChange.action === "cancel") {
        const cancelResult = await cancelSession(sessionChange.sessionId, {
          reason,
          adminId,
          classId,
          className,
        });
        const emailNote = cancelResult?.emailSubmitted === false
          ? ` Student email: ${cancelResult.emailMessage || "check Communication"}.`
          : "";
        const successMessage = `Class cancelled. The timetable, calendar and check-in were updated.${emailNote}`;
        await onSaved(successMessage);
        return;
      }

      const parts = splitDateTimeLocal(sessionChange.startsAt);
      if (!parts) throw new Error("Choose the new Ghana date and time.");
      const rescheduleResult = await rescheduleSession(sessionChange.sessionId, {
        localDate: parts.localDate,
        localTime: parts.localTime,
        startsAt: sessionChange.startsAt,
        moveMode: sessionChange.moveMode,
        ...(sessionChange.moveMode === "following" ? { scheduleRules: sessionChange.scheduleRules } : {}),
        reason,
        adminId,
        classId,
        className,
        timezone: klass.timezone || "Africa/Accra",
        durationMinutes: sessionChange.durationMinutes,
      });
      const emailNote = rescheduleResult?.emailSubmitted === false
        ? ` Student email: ${rescheduleResult.emailMessage || "check Communication"}.`
        : "";
      const movedCount = Number(rescheduleResult?.movedSessions || 1);
      const successMessage = rescheduleResult?.moveMode === "following"
        ? `${movedCount} sessions shifted. The selected lesson now starts ${formatDateTime(rescheduleResult?.startsAt || sessionChange.startsAt)}, and following lessons were recalculated using the selected weekly days. Attendance, class dates, reminders and calendar feed were updated atomically.${emailNote}`
        : `Session moved to ${formatDateTime(rescheduleResult?.startsAt || sessionChange.startsAt)}. Only this lesson moved. Its day and content were preserved; Attendance, class dates, reminders and calendar feed were updated.${emailNote}`;
      await onSaved(successMessage);
    } catch (error) {
      setError(error?.message || "Session update failed");
    } finally {
      setBusy(false);
    }
  }

    const cancelling = sessionChange.action === "cancel";
    const alreadyCancelled = sessionChange.originalStatus === "cancelled";
    const shiftingFollowing = sessionChange.moveMode === "following";

    return (
      <form id="session-editor" tabIndex={-1} aria-label="Edit class session" onSubmit={handleSessionChangeSubmit} style={{ display: "grid", gap: 12, padding: 14, border: "1px solid #bfdbfe", borderRadius: 10, background: "#eff6ff" }}>
        <h2 style={{ margin: 0 }}>{cancelling ? "Cancel" : alreadyCancelled ? "Reactivate" : "Reschedule"} · {session.topic || formatDateTime(session.startsAt)}</h2>

        {!cancelling ? (
          <>
            <label style={{ display: "grid", gap: 6 }}>
              <strong>{shiftingFollowing ? "New date and time for this lesson (Ghana)" : "New Ghana date and time"}</strong>
              <input type="datetime-local" value={sessionChange.startsAt} onChange={(event) => setSessionChange((current) => ({ ...current, startsAt: event.target.value }))} required />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <strong>Which lessons should move?</strong>
              <select value={sessionChange.moveMode || "single"} onChange={(event) => setSessionChange((current) => ({ ...current, moveMode: event.target.value }))}>
                <option value="single">Move only this session</option>
                <option value="following">Recalculate from this lesson onward</option>
              </select>
            </label>

            {shiftingFollowing ? <details><summary>Adjust weekly days and times</summary><fieldset disabled={busy}>
              <p>The first lesson uses your chosen date below, even outside these days.</p>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => {
                const rule = sessionChange.scheduleRules.find(item => String(item.day).slice(0, 3).toLowerCase() === day.toLowerCase());
                return <div key={day} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                  <label><input type="checkbox" checked={Boolean(rule)} onChange={event => setSessionChange(current => ({ ...current, scheduleRules: event.target.checked ? [...current.scheduleRules, { day, startTime: current.startsAt.split("T")[1]?.slice(0, 5) || "09:00", durationMinutes: current.durationMinutes }] : current.scheduleRules.filter(item => String(item.day).slice(0, 3).toLowerCase() !== day.toLowerCase()) }))} /> {day}</label>
                  {rule ? <input aria-label={`${day} start time`} type="time" required value={rule.startTime} onChange={event => setSessionChange(current => ({ ...current, scheduleRules: current.scheduleRules.map(item => item === rule ? { ...item, startTime: event.target.value } : item) }))} /> : null}
                </div>;
              })}
            </fieldset></details> : null}

          </>
        ) : (
          <div style={{ padding: 10, borderRadius: 8, background: "#fff7ed", border: "1px solid #fed7aa", color: "#9a3412" }}>
            This cancels the class and closes check-in. Send any follow-up email from Communication.
          </div>
        )}

        <label style={{ display: "grid", gap: 6 }}>
          <strong>Message template</strong>
          <select value="" onChange={(event) => event.target.value && setSessionChange((current) => ({ ...current, reason: event.target.value }))}>
            <option value="">Choose a ready reason</option>
            {SESSION_CHANGE_REASONS.map((template) => <option key={template.label} value={template.value}>{template.label}</option>)}
          </select>
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <strong>Reason / message to students</strong>
          <textarea rows={3} value={sessionChange.reason} onChange={(event) => setSessionChange((current) => ({ ...current, reason: event.target.value }))} placeholder="Write the message students should receive" required />
        </label>

        {error ? <p role="alert">{error}</p> : null}
        <LiveClassChangePreview preview={changePreview} />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="submit" disabled={busy || !changePreview.plan}>{busy ? "Saving…" : cancelling ? "Confirm cancellation" : alreadyCancelled ? "Reactivate lesson" : "Save new date"}</button>
          <button type="button" disabled={busy} onClick={onClose}>Close</button>
        </div>
      </form>
    );
}

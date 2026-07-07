import { useEffect, useState } from "react";
import { useToast } from "../context/ToastContext.jsx";
import { validateIanaTimezone } from "../utils/liveClassScheduling.js";
import { defaultTuitionForLevel, updateClassCohort } from "../services/classCohortUpdateService.js";
import { deleteClassCohort, rebuildClassSessionsFromSchedule, syncClassEndDateFromSessions } from "../services/liveClassService.js";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const LEVELS = ["A1", "A2", "B1", "B2", "C1"];
const DEFAULT_RULE = { day: "Sat", startTime: "09:00", durationMinutes: 120 };
const isPastDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || "")) && value < new Date().toISOString().slice(0, 10);

function initialForm(klass = {}) {
  const levelId = String(klass.levelId || klass.level || "").toUpperCase();
  return {
    name: klass.name || "", city: klass.city || "", levelId,
    startDate: klass.startDate || "", endDate: klass.endDate || "",
    timezone: klass.timezone || "Africa/Accra", status: klass.status || "upcoming",
    tuitionGhs: Number(klass.tuitionGhs || defaultTuitionForLevel(levelId || "A1")),
    publicVisible: klass.publicVisible !== false, registrationOpen: klass.registrationOpen !== false,
    tutorId: klass.tutorId || "", zoomProfileId: klass.zoomProfileId || "",
    scheduleRules: Array.isArray(klass.scheduleRules) && klass.scheduleRules.length ? klass.scheduleRules : [{ ...DEFAULT_RULE }],
  };
}

export default function ClassEditorCard({ klass, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(() => initialForm(klass));
  const [historicalMode, setHistoricalMode] = useState(() => klass?.historical === true || isPastDate(klass?.startDate));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => { setForm(initialForm(klass)); setHistoricalMode(klass?.historical === true || isPastDate(klass?.startDate)); }, [klass?.id]);
  const patch = (values) => setForm((current) => ({ ...current, ...values }));
  const patchRule = (index, values) => setForm((current) => ({ ...current, scheduleRules: current.scheduleRules.map((rule, i) => i === index ? { ...rule, ...values } : rule) }));

  async function save(event) {
    event.preventDefault();
    if (!form.name.trim()) return setMessage("Class name is required.");
    if (!LEVELS.includes(form.levelId)) return setMessage("Select the correct level.");
    if (!form.startDate || !form.endDate || form.endDate < form.startDate) return setMessage("Enter valid start and end dates.");
    if (!validateIanaTimezone(form.timezone)) return setMessage("Enter a valid timezone such as Africa/Accra.");
    setBusy(true); setMessage("");
    try {
      const result = await updateClassCohort(klass.id, { ...form, historicalMode });
      const endDateNote = result.sessionDerivedEndDate && result.sessionDerivedEndDate !== result.requestedEndDate
        ? ` End date was synced to the last generated session: ${result.sessionDerivedEndDate}.`
        : "";
      setMessage(`Class updated. ${result.created || 0} session(s) created.${endDateNote}`);
      await onSaved?.(klass.id);
    } catch (error) { setMessage(error?.message || "Class update failed"); }
    finally { setBusy(false); }
  }

  async function rebuildSessions() {
    if (!window.confirm("Rebuild scheduled sessions from this class start date and timetable? Completed, live, cancelled, rescheduled, and attendance-bearing sessions will be preserved.")) return;
    setBusy(true); setMessage("");
    try {
      const result = await rebuildClassSessionsFromSchedule(klass.id, { ...klass, ...form });
      const endDateSync = await syncClassEndDateFromSessions(klass.id).catch(() => null);
      const endDateNote = endDateSync?.endDate ? ` End date synced to ${endDateSync.endDate}.` : "";
      const successMessage = `Sessions rebuilt successfully: ${result.created || 0} created, ${result.refreshed || 0} updated, and ${result.removed || 0} stale removed.${endDateNote}`;
      setMessage(successMessage);
      toast.success(successMessage, { durationMs: 6000 });
      await onSaved?.(klass.id);
    } catch (error) {
      const errorMessage = error?.message || "Session rebuild failed";
      setMessage(errorMessage);
      toast.error(`Session rebuild failed: ${errorMessage}`, { durationMs: 7000 });
    } finally {
      setBusy(false);
    }
  }

  async function removeClass() {
    const className = form.name || klass?.name || klass?.id || "this class";
    if (!window.confirm(`Permanently delete ${className}? This removes the class, its sessions and attendance records.`)) return;
    const confirmation = window.prompt('Type DELETE to confirm permanent deletion.');
    if (confirmation !== "DELETE") {
      setMessage("Deletion cancelled. You must type DELETE exactly.");
      return;
    }

    setBusy(true); setMessage("");
    try {
      const result = await deleteClassCohort(klass.id);
      window.alert(`Class deleted. ${result.deletedSessionCount || 0} session(s) were removed.`);
      window.location.assign("/live-classes");
    } catch (error) {
      setMessage(error?.message || "Class deletion failed");
    } finally {
      setBusy(false);
    }
  }

  const messageIsSuccess = message.startsWith("Class updated") || message.startsWith("Sessions rebuilt successfully");

  return <article className="card"><h2>Edit this class</h2><form onSubmit={save} style={{ display: "grid", gap: 14 }}>
    <label><input type="checkbox" checked={historicalMode} onChange={(event) => setHistoricalMode(event.target.checked)} /> Historical class: keep exact dates and generate missing past sessions</label>
    <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
      <label>Class name<input required value={form.name} onChange={(event) => patch({ name: event.target.value })} /></label>
      <label>City<input value={form.city} onChange={(event) => patch({ city: event.target.value })} /></label>
      <label>Level<select value={form.levelId} onChange={(event) => { const levelId = event.target.value; patch({ levelId, tuitionGhs: defaultTuitionForLevel(levelId) }); }}>{LEVELS.map((level) => <option key={level}>{level}</option>)}</select></label>
      <label>Start date<input type="date" required value={form.startDate} onChange={(event) => { const startDate = event.target.value; patch({ startDate }); setHistoricalMode(isPastDate(startDate)); }} /></label>
      <label>Graduation / end date<input type="date" required value={form.endDate} onChange={(event) => patch({ endDate: event.target.value })} /></label>
      <label>Tuition (GHS)<input type="number" min="1" value={form.tuitionGhs} onChange={(event) => patch({ tuitionGhs: Number(event.target.value) })} /></label>
      <label>Status<select value={form.status} onChange={(event) => patch({ status: event.target.value })}>{["draft", "upcoming", "active", "graduated", "archived"].map((status) => <option key={status}>{status}</option>)}</select></label>
      <label>Timezone<input value={form.timezone} onChange={(event) => patch({ timezone: event.target.value })} /></label>
      <label>Tutor ID<input value={form.tutorId} onChange={(event) => patch({ tutorId: event.target.value })} /></label>
      <label>Zoom profile ID<input value={form.zoomProfileId} onChange={(event) => patch({ zoomProfileId: event.target.value })} /></label>
    </div>
    <strong>Weekly teaching times</strong>
    {form.scheduleRules.map((rule, index) => <div key={`${index}-${rule.day}`} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <select value={String(rule.day || "Sat").slice(0, 3)} onChange={(event) => patchRule(index, { day: event.target.value })}>{DAYS.map((day) => <option key={day}>{day}</option>)}</select>
      <input type="time" value={rule.startTime || "09:00"} onChange={(event) => patchRule(index, { startTime: event.target.value })} />
      <input type="number" min="30" step="15" value={Number(rule.durationMinutes || 120)} onChange={(event) => patchRule(index, { durationMinutes: Number(event.target.value) })} />
    </div>)}
    <button type="button" onClick={() => setForm((current) => ({ ...current, scheduleRules: [...current.scheduleRules, { ...DEFAULT_RULE }] }))}>Add another time</button>
    <div><label><input type="checkbox" checked={form.publicVisible} onChange={(event) => patch({ publicVisible: event.target.checked })} /> Show publicly</label> <label><input type="checkbox" checked={form.registrationOpen} onChange={(event) => patch({ registrationOpen: event.target.checked })} /> Registration open</label></div>
    {message ? <div style={{ padding: 10, borderRadius: 8, background: messageIsSuccess ? "#f0fdf4" : "#fef2f2" }}>{message}</div> : null}
    <button type="submit" disabled={busy}>{busy ? "Saving…" : "Save class changes"}</button>
    <button type="button" disabled={busy} onClick={rebuildSessions}>Rebuild sessions from start date and timetable</button>
    <div style={{ marginTop: 10, paddingTop: 14, borderTop: "1px solid #fecaca" }}>
      <strong style={{ color: "#991b1b" }}>Danger zone</strong>
      <p style={{ margin: "6px 0 10px", fontSize: 13 }}>Deletion is allowed only after the class end date, when no unfinished sessions or open student contracts remain.</p>
      <button type="button" disabled={busy} onClick={removeClass} style={{ background: "#b91c1c", color: "#fff", border: 0, borderRadius: 6, padding: "10px 14px", fontWeight: 700 }}>Delete class permanently</button>
    </div>
  </form></article>;
}

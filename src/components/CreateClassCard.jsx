import { useState } from "react";
import { createClassCohort } from "../services/liveClassService.js";
import { calculateClassEndDate, validateIanaTimezone } from "../utils/liveClassScheduling.js";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const RULE = { day: "Sat", startTime: "09:00", durationMinutes: 120 };
const emptyForm = () => ({ name: "", levelId: "A1", tutorId: "", startDate: "", endDate: "", timezone: "Africa/Accra", status: "upcoming", zoomProfileId: "", scheduleRules: [{ ...RULE }] });

export default function CreateClassCard({ onCreated, onDuplicate }) {
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const patch = (values, recalculate = false) => setForm((current) => { const next = { ...current, ...values }; const endDate = recalculate ? calculateClassEndDate(next) : ""; return endDate ? { ...next, endDate } : next; });
  const patchRule = (index, values) => setForm((current) => ({ ...current, scheduleRules: current.scheduleRules.map((rule, i) => i === index ? { ...rule, ...values } : rule) }));

  async function submit(event) {
    event.preventDefault(); setMessage("");
    if (!form.name.trim()) return setMessage("Class name is required.");
    if (!form.startDate || !form.endDate || form.endDate < form.startDate) return setMessage("Enter valid start and end dates.");
    if (!validateIanaTimezone(form.timezone)) return setMessage("Enter a valid timezone such as Africa/Accra.");
    setBusy(true);
    try {
      const record = await createClassCohort({ ...form, historicalMode: false });
      setMessage(`Class created successfully. Final end date: ${record.endDate}.`); setForm(emptyForm()); await onCreated?.(record.id);
    } catch (error) {
      const text = error?.message || "Class creation failed";
      if (text.toLowerCase().includes("already exists")) { setMessage("This class already exists and has been opened for editing."); await onDuplicate?.(form.name); } else setMessage(text);
    } finally { setBusy(false); }
  }

  return <article className="card"><h2>Create a new class</h2><form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
    <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
      <label>Class name<input required value={form.name} onChange={(event) => patch({ name: event.target.value })} /></label>
      <label>Level<select value={form.levelId} onChange={(event) => patch({ levelId: event.target.value }, true)}>{["A1", "A2", "B1", "B2", "C1"].map((level) => <option key={level}>{level}</option>)}</select></label>
      <label>Start date<input required type="date" value={form.startDate} onChange={(event) => patch({ startDate: event.target.value }, true)} /></label>
      <label>Graduation / end date<input required type="date" value={form.endDate} onChange={(event) => patch({ endDate: event.target.value })} /></label>
      <label>Tutor ID<input value={form.tutorId} onChange={(event) => patch({ tutorId: event.target.value })} /></label><label>Zoom profile ID<input value={form.zoomProfileId} onChange={(event) => patch({ zoomProfileId: event.target.value })} /></label>
      <label>Status<select value={form.status} onChange={(event) => patch({ status: event.target.value })}>{["draft", "upcoming", "active", "graduated"].map((status) => <option key={status}>{status}</option>)}</select></label><label>Timezone<input required value={form.timezone} onChange={(event) => patch({ timezone: event.target.value })} /></label>
    </div>
    <strong>Weekly teaching times</strong>{form.scheduleRules.map((rule, index) => <div key={`${index}-${rule.day}`} style={{ display: "flex", gap: 8 }}><select value={rule.day} onChange={(event) => patchRule(index, { day: event.target.value })}>{DAYS.map((day) => <option key={day}>{day}</option>)}</select><input type="time" value={rule.startTime} onChange={(event) => patchRule(index, { startTime: event.target.value })} /><input type="number" min="30" step="15" value={rule.durationMinutes} onChange={(event) => patchRule(index, { durationMinutes: Number(event.target.value) })} /></div>)}
    <button type="button" onClick={() => setForm((current) => ({ ...current, scheduleRules: [...current.scheduleRules, { ...RULE }] }))}>Add another time</button>{message ? <div>{message}</div> : null}<button type="submit" disabled={busy}>{busy ? "Creating…" : "Create class and generate sessions"}</button>
  </form></article>;
}

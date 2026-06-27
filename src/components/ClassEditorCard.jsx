import { useEffect, useState } from "react";
import { calculateClassEndDate, validateIanaTimezone } from "../utils/liveClassScheduling.js";
import { defaultTuitionForLevel, updateClassCohort } from "../services/classCohortUpdateService.js";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const LEVELS = ["A1", "A2", "B1", "B2", "C1"];
const DEFAULT_RULE = { day: "Sat", startTime: "09:00", durationMinutes: 120 };

function inferLevel(klass = {}) {
  const candidates = [
    klass.levelId,
    klass.resolvedLevelId,
    klass.level,
    klass.courseLevel,
    klass.languageLevel,
    klass.name,
    klass.className,
    klass.title,
    klass.slug,
  ];
  for (const candidate of candidates) {
    const match = String(candidate || "").match(/(?:^|[^a-z0-9])(A1|A2|B1|B2|C1)(?:[^a-z0-9]|$)/i);
    if (match) return match[1].toUpperCase();
  }
  return "";
}

function fromClass(klass = {}) {
  const levelId = inferLevel(klass);
  return {
    name: klass.name || "",
    city: klass.city || "",
    levelId,
    startDate: klass.startDate || "",
    endDate: klass.endDate || "",
    timezone: klass.timezone || "Africa/Accra",
    status: klass.status || "upcoming",
    tuitionGhs: Number(klass.tuitionGhs || defaultTuitionForLevel(levelId || "A1")),
    publicVisible: klass.publicVisible !== false,
    registrationOpen: klass.registrationOpen !== false,
    tutorId: klass.tutorId || "",
    zoomProfileId: klass.zoomProfileId || "",
    scheduleRules: Array.isArray(klass.scheduleRules) && klass.scheduleRules.length
      ? klass.scheduleRules.map((rule) => ({
          day: String(rule.day || "Sat").slice(0, 3),
          startTime: rule.startTime || "09:00",
          durationMinutes: Number(rule.durationMinutes || 120),
        }))
      : [{ ...DEFAULT_RULE }],
  };
}

export default function ClassEditorCard({ klass, onSaved }) {
  const [form, setForm] = useState(() => fromClass(klass));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setForm(fromClass(klass));
    setMessage("");
  }, [klass?.id]);

  function patch(values, recalculate = false) {
    setForm((current) => {
      const next = { ...current, ...values };
      if (!recalculate) return next;
      const endDate = calculateClassEndDate(next);
      return endDate ? { ...next, endDate } : next;
    });
  }

  function patchRule(index, values) {
    setForm((current) => ({
      ...current,
      scheduleRules: current.scheduleRules.map((rule, itemIndex) =>
        itemIndex === index ? { ...rule, ...values } : rule,
      ),
    }));
  }

  async function save(event) {
    event.preventDefault();
    setMessage("");
    if (!form.name.trim()) return setMessage("Class name is required.");
    if (!LEVELS.includes(form.levelId)) return setMessage("Select the correct level before saving this class.");
    if (!form.startDate || !form.endDate) return setMessage("Start and end dates are required.");
    if (form.endDate < form.startDate) return setMessage("End date must be after the start date.");
    if (!validateIanaTimezone(form.timezone)) return setMessage("Enter a valid timezone such as Africa/Accra.");
    if (!window.confirm("Save these changes and rebuild future sessions? Past, completed and cancelled sessions will remain unchanged.")) return;

    setBusy(true);
    try {
      const result = await updateClassCohort(klass.id, form);
      setMessage(`Class updated. Level ${form.levelId} saved. ${result.removed} old future session(s) removed and ${result.created} future session(s) created.`);
      await onSaved?.(klass.id);
    } catch (error) {
      setMessage(error?.message || "Class update failed");
    } finally {
      setBusy(false);
    }
  }

  if (!klass?.id) return null;

  return (
    <article className="card">
      <h2>Edit this class</h2>
      <p style={{ marginTop: 0, opacity: 0.78 }}>
        Keep the same class ID and student URL while updating its level, dates and future timetable.
      </p>
      {!form.levelId ? <div style={{ padding: 10, marginBottom: 12, borderRadius: 8, background: "#fff7ed", border: "1px solid #fed7aa" }}>This class has no valid level ID. Select A1, A2, B1, B2 or C1 before saving.</div> : null}
      <form onSubmit={save} style={{ display: "grid", gap: 14 }}>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          <label>Class name<input required value={form.name} onChange={(event) => patch({ name: event.target.value })} /></label>
          <label>City<input value={form.city} placeholder="Example: Munich" onChange={(event) => patch({ city: event.target.value })} /></label>
          <label>Level<select required value={form.levelId} onChange={(event) => {
            const levelId = event.target.value;
            patch({ levelId, tuitionGhs: defaultTuitionForLevel(levelId) }, true);
          }}><option value="">Select level</option>{LEVELS.map((level) => <option key={level}>{level}</option>)}</select></label>
          <label>Start date<input type="date" required value={form.startDate} onChange={(event) => patch({ startDate: event.target.value }, true)} /></label>
          <label>End date<input type="date" required value={form.endDate} onChange={(event) => patch({ endDate: event.target.value })} /></label>
          <label>Tuition (GHS)<input type="number" min="1" value={form.tuitionGhs} onChange={(event) => patch({ tuitionGhs: Number(event.target.value) })} /></label>
          <label>Status<select value={form.status} onChange={(event) => patch({ status: event.target.value })}>{["draft", "upcoming", "active", "graduated", "archived"].map((status) => <option key={status}>{status}</option>)}</select></label>
          <label>Timezone<input value={form.timezone} onChange={(event) => patch({ timezone: event.target.value })} /></label>
          <label>Tutor ID<input value={form.tutorId} onChange={(event) => patch({ tutorId: event.target.value })} /></label>
          <label>Zoom profile ID<input value={form.zoomProfileId} onChange={(event) => patch({ zoomProfileId: event.target.value })} /></label>
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          <strong>Weekly teaching times</strong>
          {form.scheduleRules.map((rule, index) => (
            <div key={`${index}-${rule.day}`} style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", alignItems: "end" }}>
              <label>Day<select value={rule.day} onChange={(event) => patchRule(index, { day: event.target.value })}>{DAYS.map((day) => <option key={day}>{day}</option>)}</select></label>
              <label>Start<input type="time" required value={rule.startTime} onChange={(event) => patchRule(index, { startTime: event.target.value })} /></label>
              <label>Minutes<input type="number" min="30" step="15" value={rule.durationMinutes} onChange={(event) => patchRule(index, { durationMinutes: Number(event.target.value) })} /></label>
              {form.scheduleRules.length > 1 ? <button type="button" onClick={() => setForm((current) => ({ ...current, scheduleRules: current.scheduleRules.filter((_, itemIndex) => itemIndex !== index) }))}>Remove</button> : null}
            </div>
          ))}
          <button type="button" onClick={() => setForm((current) => ({ ...current, scheduleRules: [...current.scheduleRules, { ...DEFAULT_RULE }] }))}>Add another time</button>
        </div>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <label><input type="checkbox" checked={form.publicVisible} onChange={(event) => patch({ publicVisible: event.target.checked })} /> Show publicly</label>
          <label><input type="checkbox" checked={form.registrationOpen} onChange={(event) => patch({ registrationOpen: event.target.checked })} /> Registration open</label>
        </div>

        {message ? <div style={{ padding: 10, borderRadius: 8, background: message.startsWith("Class updated") ? "#f0fdf4" : "#fef2f2" }}>{message}</div> : null}
        <button type="submit" disabled={busy}>{busy ? "Saving…" : "Save class changes"}</button>
      </form>
    </article>
  );
}

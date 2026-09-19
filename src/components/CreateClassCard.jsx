import { useEffect, useMemo, useState } from "react";
import { createClassCohort } from "../services/liveClassService.js";
import { calculateClassEndDate, validateIanaTimezone } from "../utils/liveClassScheduling.js";
import { nextUnusedScheduleDay, scheduleRulesForEditor } from "../utils/liveClassScheduleRules.js";
import { classNameSuggestions, isClassNameBlocked, resolveClassNameSelection } from "../utils/liveClassNameSuggestions.js";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const RULE = { day: "Sat", startTime: "09:00", durationMinutes: 120 };
const emptyForm = () => ({ name: "", levelId: "A1", tutorId: "", startDate: "", endDate: "", timezone: "Africa/Accra", status: "upcoming", zoomProfileId: "", scheduleRules: [{ ...RULE }] });
const dayLabel = (value) => String(value || "").slice(0, 3).toLowerCase().replace(/^./, (letter) => letter.toUpperCase());

export default function CreateClassCard({ onCreated, onDuplicate, classes = [] }) {
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [nameSelectionSource, setNameSelectionSource] = useState("auto");

  const suggestions = useMemo(
    () => classNameSuggestions(form.levelId, classes, 6),
    [form.levelId, classes],
  );
  const selectedNameBlocked = useMemo(
    () => Boolean(form.name.trim()) && isClassNameBlocked(form.name, classes),
    [form.name, classes],
  );

  useEffect(() => {
    setForm((current) => {
      const nextName = resolveClassNameSelection(current.name, suggestions, nameSelectionSource);
      if (current.name === nextName) return current;
      return { ...current, name: nextName };
    });
  }, [suggestions, nameSelectionSource]);

  const patch = (values, recalculate = false) => setForm((current) => {
    const next = { ...current, ...values };
    const endDate = recalculate
      ? calculateClassEndDate({ ...next, scheduleRules: scheduleRulesForEditor(next.scheduleRules) })
      : "";
    return endDate ? { ...next, endDate } : next;
  });
  const patchRule = (index, values) => setForm((current) => ({ ...current, scheduleRules: current.scheduleRules.map((rule, i) => i === index ? { ...rule, ...values } : rule) }));
  const removeRule = (index) => setForm((current) => ({ ...current, scheduleRules: current.scheduleRules.filter((_, i) => i !== index) }));
  const addRule = () => setForm((current) => {
    const nextDay = nextUnusedScheduleDay(current.scheduleRules);
    if (!nextDay) {
      setMessage("All seven weekdays already have a teaching time. A class can have only one session per date.");
      return current;
    }
    return { ...current, scheduleRules: [...current.scheduleRules, { ...RULE, day: dayLabel(nextDay) }] };
  });

  function chooseSuggestion(name) {
    setNameSelectionSource("explicit");
    patch({ name });
    setMessage("");
  }

  function changeLevel(levelId) {
    setNameSelectionSource("auto");
    patch({ levelId, name: "" }, true);
    setMessage("");
  }

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    if (!form.name.trim()) return setMessage("Class name is required.");
    if (selectedNameBlocked) return setMessage("This class name is already used by an existing class. Choose one of the available suggestions.");
    if (!form.startDate || !form.endDate || form.endDate < form.startDate) return setMessage("Enter valid start and end dates.");
    if (!validateIanaTimezone(form.timezone)) return setMessage("Enter a valid timezone such as Africa/Accra.");
    const scheduleRules = scheduleRulesForEditor(form.scheduleRules);
    if (!scheduleRules.length) return setMessage("Add at least one weekly teaching time.");

    setBusy(true);
    try {
      const record = await createClassCohort({ ...form, scheduleRules, historicalMode: false });
      setMessage(`Class created successfully. ${record.generatedSessionCount || 0} sessions generated. Class reminders and weekly attendance emails are enabled; delivery status is available in the reminder diagnostic.`);
      setForm(emptyForm());
      setNameSelectionSource("auto");
      await onCreated?.(record.id);
    } catch (error) {
      const text = error?.message || "Class creation failed";
      if (text.toLowerCase().includes("already exists")) {
        setMessage("This class already exists and has been opened for editing.");
        await onDuplicate?.(form.name);
      } else {
        setMessage(text);
      }
    } finally {
      setBusy(false);
    }
  }

  return <article className="card"><h2>Create a new class</h2><form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
    <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
      <label style={{ display: "grid", gap: 5 }}>
        <span>Class name</span>
        <input
          required
          value={form.name}
          onChange={(event) => { setNameSelectionSource("explicit"); patch({ name: event.target.value }); }}
          aria-invalid={selectedNameBlocked ? "true" : "false"}
        />
        <small style={{ color: selectedNameBlocked ? "#b91c1c" : "#64748b" }}>
          {selectedNameBlocked
            ? "Already in use. Pick another available name below."
            : "Suggested automatically from names not currently in use."}
        </small>
      </label>
      <label>Level<select value={form.levelId} onChange={(event) => changeLevel(event.target.value)}>{["A1", "A2", "B1", "B2", "C1"].map((level) => <option key={level}>{level}</option>)}</select></label>
      <label>Start date<input required type="date" value={form.startDate} onChange={(event) => patch({ startDate: event.target.value }, true)} /></label>
      <label>Graduation / end date<input required type="date" value={form.endDate} onChange={(event) => patch({ endDate: event.target.value })} /></label>
      <label>Tutor ID<input value={form.tutorId} onChange={(event) => patch({ tutorId: event.target.value })} /></label><label>Zoom profile ID<input value={form.zoomProfileId} onChange={(event) => patch({ zoomProfileId: event.target.value })} /></label>
      <label>Status<select value={form.status} onChange={(event) => patch({ status: event.target.value })}>{["draft", "upcoming", "active", "graduated"].map((status) => <option key={status}>{status}</option>)}</select></label><label>Timezone<input required value={form.timezone} onChange={(event) => patch({ timezone: event.target.value })} /></label>
    </div>

    {suggestions.length ? (
      <div style={{ display: "grid", gap: 7 }}>
        <strong style={{ fontSize: 13 }}>Available class names</strong>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
          {suggestions.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => chooseSuggestion(name)}
              style={{
                border: form.name === name ? "1px solid #2457ff" : "1px solid #cbd5e1",
                background: form.name === name ? "#eff6ff" : "#fff",
                color: "#1e293b",
                borderRadius: 999,
                padding: "7px 10px",
                fontWeight: form.name === name ? 700 : 600,
              }}
            >
              {name}
            </button>
          ))}
        </div>
        <small style={{ color: "#64748b" }}>Names already occupied by current or graduated classes are skipped automatically. Archived/draft names can be reused.</small>
      </div>
    ) : (
      <small style={{ color: "#92400e" }}>No unused dictionary name is available for {form.levelId}. You can enter a custom class name.</small>
    )}

    <strong>Weekly teaching times</strong><p style={{ margin: 0, fontSize: 13 }}>Use one teaching time per weekday. This prevents two curriculum sessions from being created on the same date.</p>{form.scheduleRules.map((rule, index) => <div key={`${index}-${rule.day}`} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><select value={rule.day} onChange={(event) => patchRule(index, { day: event.target.value })}>{DAYS.map((day) => <option key={day} disabled={form.scheduleRules.some((item, itemIndex) => itemIndex !== index && String(item.day).slice(0, 3).toLowerCase() === day.toLowerCase())}>{day}</option>)}</select><input type="time" value={rule.startTime} onChange={(event) => patchRule(index, { startTime: event.target.value })} /><input type="number" min="30" step="15" value={rule.durationMinutes} onChange={(event) => patchRule(index, { durationMinutes: Number(event.target.value) })} /><button type="button" disabled={form.scheduleRules.length === 1} onClick={() => removeRule(index)}>Remove</button></div>)}
    <button type="button" onClick={addRule}>Add another weekday</button>{message ? <div>{message}</div> : null}<button type="submit" disabled={busy || selectedNameBlocked}>{busy ? "Creating…" : "Create class and generate sessions"}</button>
  </form></article>;
}

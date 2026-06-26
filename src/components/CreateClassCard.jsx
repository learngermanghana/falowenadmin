import { useEffect, useRef, useState } from "react";
import { createClassCohort } from "../services/liveClassService.js";
import { loadSchoolClosureDates } from "../services/schoolClosureService.js";
import {
  calculateClassEndDate,
  setSchedulingSchoolClosureDates,
  validateIanaTimezone,
} from "../utils/liveClassScheduling.js";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DEFAULT_RULE = { day: "Sat", startTime: "09:00", durationMinutes: 120 };
const EMPTY = {
  name: "",
  levelId: "A1",
  tutorId: "",
  startDate: "",
  endDate: "",
  timezone: "Africa/Accra",
  status: "upcoming",
  zoomProfileId: "",
  scheduleRules: [{ ...DEFAULT_RULE }],
};

export default function CreateClassCard({ onCreated, onDuplicate }) {
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [autoEnd, setAutoEnd] = useState(true);
  const [holidayDates, setHolidayDates] = useState([]);
  const [holidayStatus, setHolidayStatus] = useState("loading");
  const resultRef = useRef(null);

  useEffect(() => {
    let active = true;
    loadSchoolClosureDates({ countryCode: "GH" })
      .then((dates) => {
        if (!active) return;
        setSchedulingSchoolClosureDates(dates);
        setHolidayDates(dates);
        setHolidayStatus("ready");
      })
      .catch(() => {
        if (!active) return;
        setHolidayStatus("error");
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!autoEnd || holidayStatus !== "ready") return;
    setForm((current) => {
      const endDate = calculateClassEndDate({ ...current, excludedDates: holidayDates });
      return endDate && endDate !== current.endDate ? { ...current, endDate } : current;
    });
  }, [autoEnd, holidayDates, holidayStatus]);

  function patch(values, calculate = autoEnd) {
    setForm((current) => {
      const next = { ...current, ...values };
      if (!calculate) return next;
      const endDate = calculateClassEndDate({ ...next, excludedDates: holidayDates });
      return endDate ? { ...next, endDate } : next;
    });
  }

  function patchRule(index, values) {
    setForm((current) => {
      const next = {
        ...current,
        scheduleRules: current.scheduleRules.map((rule, itemIndex) => itemIndex === index ? { ...rule, ...values } : rule),
      };
      if (!autoEnd) return next;
      const endDate = calculateClassEndDate({ ...next, excludedDates: holidayDates });
      return endDate ? { ...next, endDate } : next;
    });
  }

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    if (holidayStatus === "loading") return setMessage("Please wait while the school holiday calendar loads.");
    if (holidayStatus === "error") return setMessage("The school holiday calendar could not be loaded. The class was not created to prevent sessions being placed on closed dates.");
    if (!form.name.trim()) return setMessage("Class name is required.");
    if (!form.startDate || !form.endDate) return setMessage("Start and end dates are required.");
    if (form.endDate < form.startDate) return setMessage("End date must be after the start date.");
    if (!validateIanaTimezone(form.timezone)) return setMessage("Enter a valid timezone such as Africa/Accra.");
    if (!form.scheduleRules.length) return setMessage("Add at least one weekly class time.");

    setBusy(true);
    try {
      const record = await createClassCohort(form);
      const skipped = record.holidayDatesExcluded?.length || 0;
      setMessage(`Class created successfully. School holidays were checked${skipped ? ` and ${skipped} closed date(s) were skipped` : ""}. Final end date: ${record.endDate}.`);
      setForm({ ...EMPTY, scheduleRules: [{ ...DEFAULT_RULE }] });
      setAutoEnd(true);
      await onCreated?.(record.id);
    } catch (error) {
      const text = error?.message || "Class creation failed";
      if (text.toLowerCase().includes("already exists")) {
        setMessage("This class already exists. It has been opened below so you can update its dates instead of creating a duplicate.");
        await onDuplicate?.(form.name);
      } else {
        setMessage(text);
      }
    } finally {
      setBusy(false);
      window.setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
    }
  }

  return (
    <article className="card">
      <h2>Create a new class</h2>
      <p style={{ marginTop: 0, opacity: 0.78 }}>Create it once here. Falowen checks the Course Calendar, skips every date marked “School closed,” and extends the end date so all lessons are still scheduled.</p>
      <div style={{ padding: 10, borderRadius: 8, background: holidayStatus === "error" ? "#fef2f2" : "#f0fdf4", border: `1px solid ${holidayStatus === "error" ? "#fecaca" : "#bbf7d0"}`, fontSize: 13 }}>
        {holidayStatus === "loading" ? "Loading Ghana school holidays…" : holidayStatus === "error" ? "Holiday calendar unavailable. Class creation is paused." : `${holidayDates.length} school-closed date(s) loaded from the Course Calendar.`}
      </div>
      <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
          <label>Class name<input required value={form.name} placeholder="A1 Munich Klasse" onChange={(event) => patch({ name: event.target.value }, false)} /></label>
          <label>Level<select value={form.levelId} onChange={(event) => patch({ levelId: event.target.value }, true)}>{["A1", "A2", "B1", "B2", "C1"].map((level) => <option key={level}>{level}</option>)}</select></label>
          <label>Start date<input required type="date" value={form.startDate} onChange={(event) => { setAutoEnd(true); patch({ startDate: event.target.value }, true); }} /></label>
          <label>End date<input required type="date" value={form.endDate} onChange={(event) => { setAutoEnd(false); patch({ endDate: event.target.value }, false); }} /></label>
          <label>Tutor ID<input value={form.tutorId} placeholder="Optional" onChange={(event) => patch({ tutorId: event.target.value }, false)} /></label>
          <label>Zoom profile ID<input value={form.zoomProfileId} placeholder="Optional" onChange={(event) => patch({ zoomProfileId: event.target.value }, false)} /></label>
          <label>Status<select value={form.status} onChange={(event) => patch({ status: event.target.value }, false)}>{["draft", "upcoming", "active"].map((status) => <option key={status}>{status}</option>)}</select></label>
          <label>Timezone<input required value={form.timezone} onChange={(event) => patch({ timezone: event.target.value }, false)} /></label>
        </div>

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

        {message ? <div ref={resultRef} style={{ padding: 10, borderRadius: 8, background: message.includes("successfully") ? "#f0fdf4" : "#fff7ed" }}>{message}</div> : null}
        <button type="submit" disabled={busy || holidayStatus !== "ready"}>{busy ? "Creating…" : holidayStatus === "loading" ? "Loading holiday calendar…" : "Create class and generate sessions"}</button>
      </form>
    </article>
  );
}

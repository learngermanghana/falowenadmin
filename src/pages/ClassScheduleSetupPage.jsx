import { useEffect, useMemo, useState } from "react";
import { listClasses } from "../services/classesService";
import { syncClassSchedule } from "../services/classScheduleSyncService";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function normalizeClassRow(row = {}) {
  const className = String(row.name || row.classId || row.className || "").trim();
  return { id: className, name: className };
}

export default function ClassScheduleSetupPage() {
  const [classes, setClasses] = useState([]);
  const [selectedClassName, setSelectedClassName] = useState("");
  const [form, setForm] = useState({
    className: "",
    startDate: "",
    endDate: "",
    time: "",
    meetingDays: [],
    monTime: "",
    tueTime: "",
    wedTime: "",
    thuTime: "",
    friTime: "",
    satTime: "",
    sunTime: "",
  });
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    let active = true;
    setLoadingClasses(true);

    listClasses()
      .then((rows) => {
        if (!active) return;
        const nextClasses = (rows || []).map(normalizeClassRow).filter((row) => row.id);
        setClasses(nextClasses);
      })
      .catch((error) => {
        if (!active) return;
        setMessage({ type: "error", text: error?.message || "Failed to load classes." });
      })
      .finally(() => {
        if (active) setLoadingClasses(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const classOptions = useMemo(() => classes.sort((a, b) => a.name.localeCompare(b.name)), [classes]);

  function toggleMeetingDay(day) {
    setForm((prev) => {
      const exists = prev.meetingDays.includes(day);
      return {
        ...prev,
        meetingDays: exists ? prev.meetingDays.filter((d) => d !== day) : [...prev.meetingDays, day],
      };
    });
  }

  function handleClassSelect(value) {
    setSelectedClassName(value);
    if (!form.className.trim()) {
      setForm((prev) => ({ ...prev, className: value }));
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage({ type: "", text: "" });
    setSyncing(true);

    try {
      await syncClassSchedule(form);
      setMessage({ type: "success", text: "Class schedule synced. Class reminders and milestone emails will follow this schedule." });
    } catch (error) {
      setMessage({ type: "error", text: error?.message || "Failed to sync class schedule." });
    } finally {
      setSyncing(false);
    }
  }

  return (
    <section style={{ maxWidth: 920, margin: "0 auto", background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}>
      <h1 style={{ marginTop: 0 }}>Class Schedule Setup</h1>
      <p>Set class schedule data and sync to the Google Sheet used by class milestone automation.</p>

      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Choose class</label>
            <select value={selectedClassName} onChange={(e) => handleClassSelect(e.target.value)} style={{ width: "100%", padding: 10 }}>
              <option value="">Select class (optional)</option>
              {classOptions.map((klass) => (
                <option key={klass.id} value={klass.name}>{klass.name}</option>
              ))}
            </select>
            {loadingClasses ? <small>Loading classes...</small> : null}
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Class name</label>
            <input
              required
              value={form.className}
              onChange={(e) => setForm((prev) => ({ ...prev, className: e.target.value }))}
              placeholder="Enter class name"
              style={{ width: "100%", padding: 10 }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Start date</label>
            <input required type="date" value={form.startDate} onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))} style={{ width: "100%", padding: 10 }} />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>End date</label>
            <input required type="date" value={form.endDate} onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))} style={{ width: "100%", padding: 10 }} />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Class time</label>
            <input required type="time" value={form.time} onChange={(e) => setForm((prev) => ({ ...prev, time: e.target.value }))} style={{ width: "100%", padding: 10 }} />
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Meeting days</label>
          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))" }}>
            {DAYS.map((day) => (
              <label key={day} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input type="checkbox" checked={form.meetingDays.includes(day)} onChange={() => toggleMeetingDay(day)} />
                {day}
              </label>
            ))}
          </div>
        </div>

        <details style={{ marginTop: 16, background: "#f7f9fb", borderRadius: 8, padding: 12 }}>
          <summary style={{ cursor: "pointer", fontWeight: 600 }}>Advanced optional day-specific times</summary>
          <p style={{ marginTop: 8 }}>Use only if this day has a different class time.</p>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
            {[
              ["monTime", "MonTime"],
              ["tueTime", "TueTime"],
              ["wedTime", "WedTime"],
              ["thuTime", "ThuTime"],
              ["friTime", "FriTime"],
              ["satTime", "SatTime"],
              ["sunTime", "SunTime"],
            ].map(([field, label]) => (
              <div key={field}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>{label}</label>
                <input type="time" value={form[field]} onChange={(e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))} style={{ width: "100%", padding: 10 }} />
              </div>
            ))}
          </div>
        </details>

        <button type="submit" disabled={syncing} style={{ marginTop: 20, padding: "10px 16px" }}>
          {syncing ? "Syncing..." : "Sync class schedule"}
        </button>
      </form>

      {message.text ? (
        <p style={{ marginTop: 14, color: message.type === "error" ? "#b42318" : "#067647" }}>{message.text}</p>
      ) : null}
    </section>
  );
}

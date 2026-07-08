import { useEffect, useMemo, useState } from "react";
import PublishedSheetManager from "../components/PublishedSheetManager.jsx";
import { listClasses } from "../services/classesService";
import { deleteClassScheduleRow, syncClassSchedule } from "../services/classScheduleSyncService";
import { classRecordToScheduleSheetPayload } from "../utils/classScheduleSheetPayload.js";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const CLASS_SCHEDULE_SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQBlSaiByfuH5Z2x3lF6tRGuCVAoIa6ttSnWF4obCk8cwh7-SHZgGqJ1OS8yYehYQ51Em_i75qWCFqF/pubhtml";

function normalizeClassRow(row = {}) {
  const payload = classRecordToScheduleSheetPayload(row);
  return {
    id: String(row.id || row.classRecordId || payload.className).trim(),
    name: payload.className,
    startDate: payload.startDate,
    endDate: payload.endDate,
    time: payload.time,
    meetingDays: payload.meetingDays,
    monTime: payload.monTime,
    tueTime: payload.tueTime,
    wedTime: payload.wedTime,
    thuTime: payload.thuTime,
    friTime: payload.friTime,
    satTime: payload.satTime,
    sunTime: payload.sunTime,
  };
}

const tabButtonStyle = (active) => ({
  border: "1px solid #d0d7de",
  borderRadius: 999,
  padding: "8px 14px",
  fontWeight: active ? 800 : 600,
  background: active ? "#eff6ff" : "#fff",
  color: active ? "#1d4ed8" : "#111827",
  cursor: "pointer",
});

export default function ClassScheduleSetupPage() {
  const [activeTab, setActiveTab] = useState("create");
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
    const selectedClass = classes.find((klass) => klass.name === value);
    setForm((prev) => ({
      ...prev,
      className: value || prev.className,
      startDate: selectedClass?.startDate || prev.startDate,
      endDate: selectedClass?.endDate || prev.endDate,
      time: selectedClass?.time || prev.time,
      meetingDays: selectedClass?.meetingDays?.length ? selectedClass.meetingDays : prev.meetingDays,
      monTime: selectedClass?.monTime || prev.monTime,
      tueTime: selectedClass?.tueTime || prev.tueTime,
      wedTime: selectedClass?.wedTime || prev.wedTime,
      thuTime: selectedClass?.thuTime || prev.thuTime,
      friTime: selectedClass?.friTime || prev.friTime,
      satTime: selectedClass?.satTime || prev.satTime,
      sunTime: selectedClass?.sunTime || prev.sunTime,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage({ type: "", text: "" });
    setSyncing(true);

    try {
      await syncClassSchedule(form);
      setMessage({ type: "success", text: "Class schedule synced. Class reminders and milestone emails will follow this schedule." });
      setActiveTab("sheet");
    } catch (error) {
      setMessage({ type: "error", text: error?.message || "Failed to sync class schedule." });
    } finally {
      setSyncing(false);
    }
  }

  return (
    <section style={{ maxWidth: 980, margin: "0 auto", background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}>
      <h1 style={{ marginTop: 0 }}>Class Schedule Setup</h1>
      <p>Set class schedule data, view the live Google Sheet, and remove sheet rows when necessary.</p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
        <button type="button" onClick={() => setActiveTab("create")} style={tabButtonStyle(activeTab === "create")}>Create / sync class</button>
        <button type="button" onClick={() => setActiveTab("sheet")} style={tabButtonStyle(activeTab === "sheet")}>View sheet / delete rows</button>
      </div>

      {activeTab === "create" ? (
        <>
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
        </>
      ) : (
        <PublishedSheetManager
          title="Class schedule sheet"
          description="View the published class schedule sheet and delete rows directly when an old schedule should be removed."
          publishedUrl={CLASS_SCHEDULE_SHEET_URL}
          onRemoveRow={deleteClassScheduleRow}
        />
      )}
    </section>
  );
}

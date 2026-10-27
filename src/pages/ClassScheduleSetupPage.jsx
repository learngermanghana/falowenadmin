import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PublishedSheetManager from "../components/PublishedSheetManager.jsx";
import { listClasses } from "../services/classesService";
import { listClassCohorts } from "../services/liveClassService.js";
import { deleteClassScheduleRow, syncClassSchedule } from "../services/classScheduleSyncService";
import { classRecordToScheduleSheetPayload } from "../utils/classScheduleSheetPayload.js";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const CLASS_SCHEDULE_SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQBlSaiByfuH5Z2x3lF6tRGuCVAoIa6ttSnWF4obCk8cwh7-SHZgGqJ1OS8yYehYQ51Em_i75qWCFqF/pubhtml";

function normalizeToken(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function formatDateTime(value) {
  if (!value) return "";
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
    lastSessionChangeType: String(row.lastSessionChangeType || "").trim().toLowerCase(),
    lastChangedSessionId: String(row.lastChangedSessionId || row.lastRescheduledSessionId || row.lastCancelledSessionId || "").trim(),
    lastSessionChangeReason: String(row.lastSessionChangeReason || "").trim(),
    lastRescheduledStartsAt: row.lastRescheduledStartsAt || "",
    sessionScheduleUpdatedAt: row.sessionScheduleUpdatedAt || row.updatedAt || "",
  };
}

function mergeClassRows(scheduleRows = [], liveRows = []) {
  const liveByToken = new Map();
  liveRows.forEach((row) => {
    [row.id, row.classRecordId, row.name, row.className, row.classId]
      .map(normalizeToken)
      .filter(Boolean)
      .forEach((token) => liveByToken.set(token, row));
  });

  const merged = scheduleRows.map((row) => {
    const live = [row.id, row.classRecordId, row.name, row.className, row.classId]
      .map(normalizeToken)
      .filter(Boolean)
      .map((token) => liveByToken.get(token))
      .find(Boolean);
    return normalizeClassRow({ ...row, ...(live || {}) });
  });

  const known = new Set(merged.flatMap((row) => [normalizeToken(row.id), normalizeToken(row.name)]).filter(Boolean));
  liveRows.forEach((row) => {
    const tokens = [row.id, row.name, row.className, row.classId].map(normalizeToken).filter(Boolean);
    if (tokens.some((token) => known.has(token))) return;
    const normalized = normalizeClassRow(row);
    if (!normalized.id) return;
    merged.push(normalized);
    tokens.forEach((token) => known.add(token));
  });

  return merged.filter((row) => row.id);
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

    Promise.all([
      listClasses().catch(() => []),
      listClassCohorts().catch(() => []),
    ])
      .then(([scheduleRows, liveRows]) => {
        if (!active) return;
        setClasses(mergeClassRows(scheduleRows || [], liveRows || []));
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

  const classOptions = useMemo(() => [...classes].sort((a, b) => a.name.localeCompare(b.name)), [classes]);
  const selectedClass = useMemo(
    () => classes.find((klass) => klass.name === selectedClassName) || null,
    [classes, selectedClassName],
  );

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
    const nextClass = classes.find((klass) => klass.name === value);
    setForm((prev) => ({
      ...prev,
      className: value || prev.className,
      startDate: nextClass?.startDate || prev.startDate,
      endDate: nextClass?.endDate || prev.endDate,
      time: nextClass?.time || prev.time,
      meetingDays: nextClass?.meetingDays?.length ? nextClass.meetingDays : prev.meetingDays,
      monTime: nextClass?.monTime || prev.monTime,
      tueTime: nextClass?.tueTime || prev.tueTime,
      wedTime: nextClass?.wedTime || prev.wedTime,
      thuTime: nextClass?.thuTime || prev.thuTime,
      friTime: nextClass?.friTime || prev.friTime,
      satTime: nextClass?.satTime || prev.satTime,
      sunTime: nextClass?.sunTime || prev.sunTime,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage({ type: "", text: "" });
    setSyncing(true);

    try {
      await syncClassSchedule(form);
      setMessage({ type: "success", text: "Class schedule synced. Class reminders and milestone emails will follow this base weekly schedule." });
      setActiveTab("sheet");
    } catch (error) {
      setMessage({ type: "error", text: error?.message || "Failed to sync class schedule." });
    } finally {
      setSyncing(false);
    }
  }

  return (
    <section style={{ maxWidth: 980, margin: "0 auto", background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ marginTop: 0 }}>Class Schedule Setup</h1>
          <p>Set the recurring weekly schedule and review the latest individual session change from Live Classes.</p>
        </div>
        <Link to="/live-classes">Open Live Classes</Link>
      </div>

      <div style={{ padding: 12, marginBottom: 16, border: "1px solid #bfdbfe", borderRadius: 10, background: "#eff6ff" }}>
        <strong>How schedule changes work</strong>
        <p style={{ margin: "6px 0 0" }}>This page controls the base weekly pattern. Moving or cancelling one lesson is done under Live Classes, and that shared session record updates Attendance, student communication and calendar feeds automatically.</p>
      </div>

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
                <select value={selectedClassName} onChange={(event) => handleClassSelect(event.target.value)} style={{ width: "100%", padding: 10 }}>
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
                  onChange={(event) => setForm((prev) => ({ ...prev, className: event.target.value }))}
                  placeholder="Enter class name"
                  style={{ width: "100%", padding: 10 }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Start date</label>
                <input required type="date" value={form.startDate} onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))} style={{ width: "100%", padding: 10 }} />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>End date</label>
                <input required type="date" value={form.endDate} onChange={(event) => setForm((prev) => ({ ...prev, endDate: event.target.value }))} style={{ width: "100%", padding: 10 }} />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Class time</label>
                <input required type="time" value={form.time} onChange={(event) => setForm((prev) => ({ ...prev, time: event.target.value }))} style={{ width: "100%", padding: 10 }} />
              </div>
            </div>

            {selectedClass?.lastSessionChangeType ? (
              <div style={{ marginTop: 16, padding: 12, borderRadius: 10, border: selectedClass.lastSessionChangeType === "cancelled" ? "1px solid #fecaca" : "1px solid #bfdbfe", background: selectedClass.lastSessionChangeType === "cancelled" ? "#fef2f2" : "#eff6ff" }}>
                <strong>Latest individual session change: {selectedClass.lastSessionChangeType}</strong>
                {selectedClass.lastSessionChangeType === "rescheduled" && selectedClass.lastRescheduledStartsAt ? <p style={{ margin: "6px 0" }}>New session time: {formatDateTime(selectedClass.lastRescheduledStartsAt)}</p> : null}
                {selectedClass.lastSessionChangeType === "cancelled" ? <p style={{ margin: "6px 0" }}>The cancelled lesson remains visible in Attendance, but attendance and QR check-in are locked.</p> : null}
                {selectedClass.lastSessionChangeReason ? <p style={{ margin: "6px 0" }}>Reason: {selectedClass.lastSessionChangeReason}</p> : null}
                {selectedClass.sessionScheduleUpdatedAt ? <small>Updated: {formatDateTime(selectedClass.sessionScheduleUpdatedAt)}</small> : null}
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
                  <Link to="/live-classes">Change session</Link>
                  {selectedClass.lastChangedSessionId ? <Link to={`/attendance/session/${encodeURIComponent(selectedClass.id)}?session=${encodeURIComponent(selectedClass.lastChangedSessionId)}`}>Open matching attendance</Link> : null}
                </div>
              </div>
            ) : null}

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
                    <input type="time" value={form[field]} onChange={(event) => setForm((prev) => ({ ...prev, [field]: event.target.value }))} style={{ width: "100%", padding: 10 }} />
                  </div>
                ))}
              </div>
            </details>

            <button type="submit" disabled={syncing} style={{ marginTop: 20, padding: "10px 16px" }}>
              {syncing ? "Syncing..." : "Sync base class schedule"}
            </button>
          </form>

          {message.text ? (
            <p style={{ marginTop: 14, color: message.type === "error" ? "#b42318" : "#067647" }}>{message.text}</p>
          ) : null}
        </>
      ) : (
        <PublishedSheetManager
          title="Class schedule sheet"
          description="View the published recurring class schedule sheet and delete rows directly when an old base schedule should be removed. Individual cancellations and reschedules stay in Live Classes."
          publishedUrl={CLASS_SCHEDULE_SHEET_URL}
          onRemoveRow={deleteClassScheduleRow}
        />
      )}
    </section>
  );
}

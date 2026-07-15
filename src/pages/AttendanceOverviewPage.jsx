import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import OperationsCommunicationPanel from "../components/OperationsCommunicationPanel";
import ClassAttendanceTracker from "../components/ClassAttendanceTracker.jsx";
import { listClassCohorts } from "../services/liveClassService.js";
import {
  ATTENDANCE_EMAIL_MODES,
  loadAttendanceEmailSettings,
} from "../services/attendanceConfirmationEmailService.js";

const GHANA_TIMEZONE = "Africa/Accra";
const TERMINAL_CLASS_STATUSES = new Set([
  "archived",
  "graduated",
  "inactive",
  "cancelled",
  "canceled",
  "completed",
  "closed",
  "draft",
]);

function normalize(value) {
  return String(value || "").trim();
}

function normalizeStatus(value) {
  return normalize(value).toLowerCase();
}

function classRecordKey(klass = {}) {
  return normalize(klass.id || klass.classRecordId || klass.classId);
}

function parseClassDate(value) {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  const text = normalize(value);
  if (!text) return null;
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(text)
    ? new Date(`${text}T12:00:00.000Z`)
    : new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(value) {
  const date = value instanceof Date ? value : parseClassDate(value);
  if (!date) return "Not set";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: GHANA_TIMEZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value) {
  if (!value) return "Not yet";
  const date = typeof value?.toDate === "function" ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "Not yet";
  return date.toLocaleString("en-GB", {
    timeZone: GHANA_TIMEZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function isActiveLiveClass(klass = {}) {
  const status = normalizeStatus(klass.status);
  if (klass.archived === true || klass.isArchived === true || klass.active === false) return false;
  if (TERMINAL_CLASS_STATUSES.has(status)) return false;

  if (["active", "ongoing", "upcoming", "scheduled", "open"].includes(status)) return true;

  const endDate = parseClassDate(klass.endDate);
  if (!endDate) return Boolean(klass.name || klass.className);

  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12));
  return endDate.getTime() >= today.getTime();
}

function emailModeLabel(settings = {}) {
  if (!settings.enabled || settings.mode === ATTENDANCE_EMAIL_MODES.OFF) return "Off";
  if (settings.mode === ATTENDANCE_EMAIL_MODES.EACH_CLASS) return "After every class";
  return "After the final class each week";
}

function emailStatusText(settings = {}) {
  if (!settings.enabled || settings.mode === ATTENDANCE_EMAIL_MODES.OFF) {
    return "Attendance confirmation emails are disabled for this class.";
  }
  if (settings.mode === ATTENDANCE_EMAIL_MODES.EACH_CLASS) {
    return `The job checks every 15 minutes and sends after class ends, the ${settings.delayMinutes}-minute delay passes, and the QR check-in window closes.`;
  }
  return "The job checks every 15 minutes and sends one summary after the final class of the week and the QR check-in window closes.";
}

function tabButtonStyle(active) {
  return {
    border: active ? "1px solid #2457ff" : "1px solid #cbd5e1",
    background: active ? "#2457ff" : "#fff",
    color: active ? "#fff" : "#1e293b",
    borderRadius: 999,
    padding: "9px 14px",
    fontWeight: 700,
  };
}

function ActiveClassCard({ klass, onOpenTracker }) {
  const classId = classRecordKey(klass);
  const status = normalizeStatus(klass.status) || "active";
  const sessionCount = Number(klass.generatedSessionCount || klass.sessionCount || 0);

  return (
    <article style={{ border: "1px solid #dbe3ee", borderRadius: 12, padding: 14, background: "#fff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div>
          <h3 style={{ margin: 0 }}>{klass.name || klass.className || classId}</h3>
          <small style={{ color: "#64748b" }}>{classId}</small>
        </div>
        <span style={{ padding: "4px 9px", borderRadius: 999, background: "#dcfce7", color: "#166534", fontWeight: 800, fontSize: 12 }}>
          {status.replace(/[_-]+/g, " ")}
        </span>
      </div>

      <div style={{ display: "grid", gap: 4, marginTop: 10, fontSize: 13 }}>
        <span><strong>Course dates:</strong> {formatDate(klass.startDate)} → {formatDate(klass.endDate)}</span>
        <span><strong>Level:</strong> {klass.levelId || klass.level || "Not set"}</span>
        {sessionCount > 0 ? <span><strong>Generated sessions:</strong> {sessionCount}</span> : null}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
        <button
          type="button"
          aria-controls="attendance-tracker-panel"
          onClick={() => onOpenTracker(classId)}
        >
          View attendance tracker
        </button>
        <Link to={`/attendance/session/${encodeURIComponent(classId)}`}>Mark attendance</Link>
        <Link to="/live-classes">Open in Live Classes</Link>
      </div>
    </article>
  );
}

export default function AttendanceOverviewPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState(() => searchParams.get("tab") === "tracker" ? "tracker" : "classes");
  const [selectedTrackerId, setSelectedTrackerId] = useState(() => searchParams.get("classId") || "");
  const [emailSettings, setEmailSettings] = useState(null);
  const [emailSettingsLoading, setEmailSettingsLoading] = useState(false);
  const [emailSettingsError, setEmailSettingsError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    listClassCohorts()
      .then((rows) => {
        if (!active) return;
        setClasses(Array.isArray(rows) ? rows : []);
      })
      .catch((loadError) => {
        if (!active) return;
        setClasses([]);
        setError(loadError?.message || "Failed to load active Live Classes");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  const activeClasses = useMemo(
    () => classes.filter(isActiveLiveClass),
    [classes],
  );

  useEffect(() => {
    if (!activeClasses.length) {
      setSelectedTrackerId("");
      return;
    }
    if (!activeClasses.some((klass) => classRecordKey(klass) === selectedTrackerId)) {
      setSelectedTrackerId(classRecordKey(activeClasses[0]));
    }
  }, [activeClasses, selectedTrackerId]);

  const selectedTrackerClass = activeClasses.find((klass) => classRecordKey(klass) === selectedTrackerId) || activeClasses[0] || null;

  useEffect(() => {
    let active = true;
    if (activeTab !== "tracker" || !selectedTrackerId) {
      setEmailSettings(null);
      setEmailSettingsError("");
      return () => { active = false; };
    }

    setEmailSettingsLoading(true);
    setEmailSettingsError("");
    loadAttendanceEmailSettings(selectedTrackerId)
      .then((settings) => {
        if (active) setEmailSettings(settings);
      })
      .catch((cause) => {
        if (!active) return;
        setEmailSettings(null);
        setEmailSettingsError(cause?.message || "Could not load attendance email status.");
      })
      .finally(() => {
        if (active) setEmailSettingsLoading(false);
      });

    return () => { active = false; };
  }, [activeTab, selectedTrackerId]);

  function openClassesTab() {
    setActiveTab("classes");
    setSearchParams({ tab: "classes" }, { replace: true });
  }

  function openTracker(classId = selectedTrackerId) {
    const nextId = classId || classRecordKey(activeClasses[0]);
    if (nextId) setSelectedTrackerId(nextId);
    setActiveTab("tracker");
    setSearchParams({ tab: "tracker", ...(nextId ? { classId: nextId } : {}) }, { replace: true });
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0 }}>Attendance</h1>
          <p style={{ margin: "6px 0 0", fontSize: 13, opacity: 0.8 }}>
            Track QR check-ins, manual attendance, late arrivals and absence patterns using active classes from Live Classes only.
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Link to="/">View dashboard</Link>
          <Link to="/live-classes">Open Live Classes</Link>
        </div>
      </div>

      <OperationsCommunicationPanel context="attendance" />

      <nav style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "16px 0" }} aria-label="Attendance sections">
        <button type="button" style={tabButtonStyle(activeTab === "classes")} onClick={openClassesTab}>
          Active classes ({activeClasses.length})
        </button>
        <button type="button" style={tabButtonStyle(activeTab === "tracker")} onClick={() => openTracker()} disabled={!activeClasses.length}>
          Attendance tracker
        </button>
      </nav>

      {loading ? <p>Loading active Live Classes…</p> : null}
      {error ? <p style={{ color: "#a00000" }}>❌ {error}</p> : null}

      {!loading && !error && activeTab === "classes" ? (
        <section>
          <h2>Active classes</h2>
          {!activeClasses.length ? (
            <p>No active classes were found in Live Classes.</p>
          ) : (
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
              {activeClasses.map((klass) => (
                <ActiveClassCard key={classRecordKey(klass)} klass={klass} onOpenTracker={openTracker} />
              ))}
            </div>
          )}
        </section>
      ) : null}

      {!loading && !error && activeTab === "tracker" ? (
        <section id="attendance-tracker-panel" style={{ scrollMarginTop: 90 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "end" }}>
            <div>
              <h2 style={{ marginBottom: 6 }}>Attendance tracker</h2>
              <p style={{ margin: 0, color: "#64748b" }}>View one active class at a time.</p>
            </div>
            <label style={{ display: "grid", gap: 6, minWidth: 280 }}>
              <strong>Class shown in tracker</strong>
              <select value={selectedTrackerId} onChange={(event) => openTracker(event.target.value)}>
                {activeClasses.map((klass) => (
                  <option key={classRecordKey(klass)} value={classRecordKey(klass)}>
                    {klass.name || klass.className || classRecordKey(klass)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {selectedTrackerClass ? (
            <>
              <div style={{ marginTop: 14, padding: 13, border: "1px solid #bfdbfe", background: "#eff6ff", borderRadius: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                  <div>
                    <strong>Attendance email: {emailSettingsLoading ? "Checking…" : emailModeLabel(emailSettings || {})}</strong>
                    {!emailSettingsLoading && emailSettings ? <p style={{ margin: "5px 0 0" }}>{emailStatusText(emailSettings)}</p> : null}
                  </div>
                  <Link to="/communication">Open email settings</Link>
                </div>
                {!emailSettingsLoading && emailSettings ? (
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 8, fontSize: 13 }}>
                    <span>Delivery: <strong>{emailSettings.deliveryConfigured ? "Configured" : "Not configured"}</strong></span>
                    <span>Last job: <strong>{formatDateTime(emailSettings.lastRunAt)}</strong></span>
                    <span>Last send: <strong>{formatDateTime(emailSettings.lastSentAt)}</strong></span>
                    <span>Last status: <strong>{emailSettings.lastStatus || "Not yet"}</strong></span>
                  </div>
                ) : null}
                {emailSettingsError ? <div style={{ marginTop: 8, color: "#991b1b" }}>{emailSettingsError}</div> : null}
                {emailSettings?.lastError ? <div style={{ marginTop: 8, color: "#991b1b" }}>Delivery job error: {emailSettings.lastError}</div> : null}
              </div>

              <ClassAttendanceTracker
                classId={classRecordKey(selectedTrackerClass)}
                className={selectedTrackerClass.name || selectedTrackerClass.className || selectedTrackerId}
              />
            </>
          ) : (
            <p>No active class is available for the tracker.</p>
          )}
        </section>
      ) : null}
    </div>
  );
}

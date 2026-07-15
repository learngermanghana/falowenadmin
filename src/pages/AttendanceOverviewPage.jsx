import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { listClasses, setClassArchived } from "../services/classesService";
import OperationsCommunicationPanel from "../components/OperationsCommunicationPanel";
import ClassAttendanceTracker from "../components/ClassAttendanceTracker.jsx";
import {
  ATTENDANCE_EMAIL_MODES,
  loadAttendanceEmailSettings,
} from "../services/attendanceConfirmationEmailService.js";

const GHANA_TIMEZONE = "Africa/Accra";

function parseClassDate(value) {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();

  const text = String(value).trim();
  if (!text) return null;
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(text)
    ? new Date(`${text}T00:00:00.000Z`)
    : new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: GHANA_TIMEZONE,
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "2-digit",
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

function classRecordKey(klass = {}) {
  return String(klass.classRecordId || klass.id || klass.classId || "").trim();
}

function resolveScheduleMeta(klass) {
  return {
    startDate: parseClassDate(klass?.startDate),
    endDate: parseClassDate(klass?.endDate),
    sessionCount: Number(klass?.generatedSessionCount || 0),
  };
}

function classifyClass(klass) {
  const status = String(klass?.status || "").toLowerCase();
  const archived = status === "archived" || klass?.archived === true || klass?.isArchived === true;

  return {
    ...klass,
    archived,
    scheduleMeta: resolveScheduleMeta(klass),
  };
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
  return "The job checks every 15 minutes and sends one summary after the final class of the week and the check-in window closes.";
}

function ClassCard({ klass, archived = false, saving = false, onToggleArchived, onTrack }) {
  const { startDate, endDate, sessionCount } = klass.scheduleMeta || {};
  const dateText = startDate && endDate
    ? `${formatDate(startDate)} → ${formatDate(endDate)}`
    : "No live-class dates";
  const routeClassId = classRecordKey(klass) || klass.classId;

  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: 12,
        background: archived ? "#f8fafc" : "#fff",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <div style={{ fontWeight: 700 }}>{klass.name}</div>
        <span
          style={{
            border: "1px solid #d1d5db",
            borderRadius: 999,
            padding: "2px 8px",
            fontSize: 12,
            background: archived ? "#e5e7eb" : "#dcfce7",
            color: archived ? "#374151" : "#166534",
            fontWeight: 700,
          }}
        >
          {archived ? "Archived" : "Ongoing"}
        </span>
      </div>
      <div style={{ fontSize: 12, opacity: 0.75 }}>classId: {klass.classId}</div>
      <div style={{ fontSize: 12, opacity: 0.75 }}>Schedule: {dateText}</div>
      {sessionCount > 0 ? <div style={{ fontSize: 12, opacity: 0.75 }}>Sessions: {sessionCount}</div> : null}
      <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button
          type="button"
          aria-controls="attendance-tracker-panel"
          onClick={() => onTrack?.(routeClassId)}
        >
          View attendance tracker
        </button>
        <Link to={`/attendance/session/${encodeURIComponent(routeClassId)}`}>
          {archived ? "View archived attendance" : "Mark attendance"}
        </Link>
        <button
          type="button"
          disabled={saving}
          onClick={() => onToggleArchived?.(klass, !archived)}
          style={{
            background: "#ffffff",
            color: archived ? "#166534" : "#991b1b",
            border: `1px solid ${archived ? "#16a34a" : "#dc2626"}`,
            fontWeight: 700,
            padding: "8px 12px",
            borderRadius: 8,
            cursor: saving ? "default" : "pointer",
          }}
        >
          {saving ? "Saving..." : archived ? "Unarchive class" : "Archive class"}
        </button>
      </div>
    </div>
  );
}

export default function AttendanceOverviewPage() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [savingClassId, setSavingClassId] = useState("");
  const [selectedTrackerId, setSelectedTrackerId] = useState("");
  const [emailSettings, setEmailSettings] = useState(null);
  const [emailSettingsLoading, setEmailSettingsLoading] = useState(false);
  const [emailSettingsError, setEmailSettingsError] = useState("");
  const trackerRef = useRef(null);
  const trackerHeadingRef = useRef(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await listClasses();
        setClasses(data);
        setSelectedTrackerId((current) => current || classRecordKey(data.find((klass) => !classifyClass(klass).archived) || data[0]));
      } catch (err) {
        setError(err?.message || "Failed to load classes");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleToggleArchived(klass, archived) {
    const classId = klass?.classId;
    const recordId = classRecordKey(klass);
    if (!classId || !recordId || savingClassId) return;

    const previousClasses = classes;
    setSavingClassId(recordId);
    setError("");
    setClasses((current) =>
      current.map((item) =>
        classRecordKey(item) === recordId
          ? { ...item, archived, isArchived: archived, active: !archived, status: archived ? "archived" : "active" }
          : item,
      ),
    );

    try {
      await setClassArchived(classId, archived, recordId);
    } catch (err) {
      setClasses(previousClasses);
      setError(err?.message || "Failed to update class archive status");
    } finally {
      setSavingClassId("");
    }
  }

  function openTracker(classId) {
    if (!classId) return;
    setSelectedTrackerId(classId);
    window.requestAnimationFrame(() => {
      window.setTimeout(() => {
        trackerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        trackerHeadingRef.current?.focus({ preventScroll: true });
      }, 0);
    });
  }

  const classifiedClasses = useMemo(() => classes.map(classifyClass), [classes]);
  const activeClasses = useMemo(
    () => classifiedClasses.filter((klass) => !klass.archived),
    [classifiedClasses],
  );
  const archivedClasses = useMemo(
    () => classifiedClasses.filter((klass) => klass.archived),
    [classifiedClasses],
  );
  const selectedTrackerClass = classifiedClasses.find((klass) => classRecordKey(klass) === selectedTrackerId) || activeClasses[0] || archivedClasses[0] || null;

  useEffect(() => {
    let active = true;
    if (!selectedTrackerId) {
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
  }, [selectedTrackerId]);

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ margin: 0 }}>Attendance</h2>
          <p style={{ margin: "6px 0 0", fontSize: 13, opacity: 0.8 }}>
            Track QR check-ins, manual attendance, late arrivals and absence patterns from the current Live Classes records.
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Link to="/">View dashboard</Link>
          <Link to="/live-classes">Open Live Classes</Link>
        </div>
      </div>

      <OperationsCommunicationPanel context="attendance" />

      {loading && <p>Loading classes...</p>}
      {error && <p style={{ color: "#a00000" }}>❌ {error}</p>}

      {!loading && !error && activeClasses.length === 0 && (
        <p>No ongoing classes found. Completed classes may be in the archive below.</p>
      )}

      <div style={{ display: "grid", gap: 10, maxWidth: 720, marginTop: 14 }}>
        {activeClasses.map((klass) => {
          const recordId = classRecordKey(klass);
          return (
            <ClassCard
              key={recordId || klass.classId}
              klass={klass}
              saving={savingClassId === recordId}
              onToggleArchived={handleToggleArchived}
              onTrack={openTracker}
            />
          );
        })}
      </div>

      {!loading && !error && archivedClasses.length > 0 && (
        <section style={{ marginTop: 22, maxWidth: 720 }}>
          <button
            type="button"
            onClick={() => setShowArchived((value) => !value)}
            style={{
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              padding: "8px 12px",
              background: "#f8fafc",
              fontWeight: 700,
            }}
          >
            {showArchived ? "Hide" : "Show"} archived completed classes ({archivedClasses.length})
          </button>

          {showArchived && (
            <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
              {archivedClasses.map((klass) => {
                const recordId = classRecordKey(klass);
                return (
                  <ClassCard
                    key={recordId || klass.classId}
                    klass={klass}
                    archived
                    saving={savingClassId === recordId}
                    onToggleArchived={handleToggleArchived}
                    onTrack={openTracker}
                  />
                );
              })}
            </div>
          )}
        </section>
      )}

      {!loading && selectedTrackerClass ? (
        <section
          id="attendance-tracker-panel"
          ref={trackerRef}
          style={{ marginTop: 26, scrollMarginTop: 90 }}
        >
          <h2 ref={trackerHeadingRef} tabIndex="-1" style={{ outline: "none" }}>
            Tracker for {selectedTrackerClass.name || selectedTrackerClass.className || selectedTrackerId}
          </h2>
          <label style={{ display: "grid", gap: 6, maxWidth: 440 }}>
            <strong>Class shown in tracker</strong>
            <select value={classRecordKey(selectedTrackerClass)} onChange={(event) => openTracker(event.target.value)}>
              {classifiedClasses.map((klass) => (
                <option key={classRecordKey(klass)} value={classRecordKey(klass)}>{klass.name || klass.className || classRecordKey(klass)}{klass.archived ? " (archived)" : ""}</option>
              ))}
            </select>
          </label>

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
        </section>
      ) : null}
    </div>
  );
}

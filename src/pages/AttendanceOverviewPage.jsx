import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listClasses, setClassArchived } from "../services/classesService";
import OperationsCommunicationPanel from "../components/OperationsCommunicationPanel";
import ClassAttendanceTracker from "../components/ClassAttendanceTracker.jsx";

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
        <button type="button" onClick={() => onTrack?.(routeClassId)}>View attendance tracker</button>
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
              onTrack={setSelectedTrackerId}
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
                    onTrack={setSelectedTrackerId}
                  />
                );
              })}
            </div>
          )}
        </section>
      )}

      {!loading && selectedTrackerClass ? (
        <section style={{ marginTop: 26 }}>
          <label style={{ display: "grid", gap: 6, maxWidth: 440 }}>
            <strong>Class shown in tracker</strong>
            <select value={classRecordKey(selectedTrackerClass)} onChange={(event) => setSelectedTrackerId(event.target.value)}>
              {classifiedClasses.map((klass) => (
                <option key={classRecordKey(klass)} value={classRecordKey(klass)}>{klass.name || klass.className || classRecordKey(klass)}{klass.archived ? " (archived)" : ""}</option>
              ))}
            </select>
          </label>
          <ClassAttendanceTracker
            classId={classRecordKey(selectedTrackerClass)}
            className={selectedTrackerClass.name || selectedTrackerClass.className || selectedTrackerId}
          />
        </section>
      ) : null}
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import OperationsCommunicationPanel from "../components/OperationsCommunicationPanel";
import ClassAttendanceTracker from "../components/ClassAttendanceTracker.jsx";
import AttendanceCommunicationHealthPanel from "../components/AttendanceCommunicationHealthPanel.jsx";
import { listClassCohorts, listClassSessions } from "../services/liveClassService.js";
import { orderAttendanceClasses, weeklyTimetableLabels } from "../utils/attendanceClassTiming.js";

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

const TIMING_TONES = {
  live: { background: "#fee2e2", color: "#991b1b" },
  today: { background: "#dbeafe", color: "#1d4ed8" },
  tomorrow: { background: "#fef3c7", color: "#92400e" },
  next: { background: "#dcfce7", color: "#166534" },
  muted: { background: "#e2e8f0", color: "#475569" },
};

function ActiveClassCard({ klass, sessions, timing, rank, onOpenTracker }) {
  const classId = classRecordKey(klass);
  const sessionCount = Number(klass.generatedSessionCount || klass.sessionCount || 0);
  const timetable = weeklyTimetableLabels(klass);
  const timingTone = TIMING_TONES[timing?.tone] || TIMING_TONES.muted;

  return (
    <article style={{ border: "1px solid #dbe3ee", borderRadius: 12, padding: 14, background: "#fff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div>
          <h3 style={{ margin: 0 }}>{rank}. {klass.name || klass.className || classId}</h3>
          <small style={{ color: "#64748b" }}>{classId}</small>
        </div>
        <span style={{ padding: "4px 9px", borderRadius: 999, ...timingTone, fontWeight: 800, fontSize: 12 }}>
          {timing?.label || (sessions === null ? "Schedule unavailable" : "Loading next class…")}
        </span>
      </div>

      <div style={{ display: "grid", gap: 4, marginTop: 10, fontSize: 13 }}>
        {timing?.source === "timetable" ? <small style={{ color: "#64748b" }}>From weekly timetable; no upcoming generated session.</small> : null}
        <span><strong>Course dates:</strong> {formatDate(klass.startDate)} → {formatDate(klass.endDate)}</span>
        <span><strong>Level:</strong> {klass.levelId || klass.level || "Not set"}</span>
        {timetable.length ? <span><strong>Weekly timetable:</strong> {timetable.join(" · ")}</span> : null}
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
  const [sessionsByClass, setSessionsByClass] = useState({});
  const [now, setNow] = useState(() => new Date());
  const [classFilter, setClassFilter] = useState("upcoming");

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);
  const [activeTab, setActiveTab] = useState(() => searchParams.get("tab") === "tracker" ? "tracker" : "classes");
  const [selectedTrackerId, setSelectedTrackerId] = useState(() => searchParams.get("classId") || "");

  useEffect(() => {
    let active = true;
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
    let active = true;
    if (!activeClasses.length) {
      return () => { active = false; };
    }

    Promise.allSettled(activeClasses.map(async (klass) => {
      const classId = classRecordKey(klass);
      return [classId, await listClassSessions(classId)];
    })).then((results) => {
      if (!active) return;
      setSessionsByClass(Object.fromEntries(results.map((result, index) => [
        classRecordKey(activeClasses[index]),
        result.status === "fulfilled" ? result.value[1] : null,
      ])));
    });

    return () => { active = false; };
  }, [activeClasses]);

  const orderedClassEntries = useMemo(
    () => orderAttendanceClasses(activeClasses, sessionsByClass, now),
    [activeClasses, sessionsByClass, now],
  );
  const orderedActiveClasses = useMemo(() => orderedClassEntries.map(({ klass }) => klass), [orderedClassEntries]);
  const schedulesLoading = activeClasses.some((klass) => sessionsByClass[classRecordKey(klass)] === undefined);
  const upcomingEntries = orderedClassEntries.filter(({ timing }) => Number.isFinite(timing?.sortTime));
  const todayEntries = upcomingEntries.filter(({ timing }) => timing.tone === "today" || timing.tone === "live");
  const visibleEntries = classFilter === "all" ? orderedClassEntries : classFilter === "today" ? todayEntries : upcomingEntries;
  const unavailableCount = orderedClassEntries.filter(({ klass }) => sessionsByClass[classRecordKey(klass)] === null).length;


  const selectedTrackerClass = activeClasses.find((klass) => classRecordKey(klass) === selectedTrackerId) || orderedActiveClasses[0] || null;



  function openClassesTab() {
    setActiveTab("classes");
    setSearchParams({ tab: "classes" }, { replace: true });
  }

  function openTracker(classId = selectedTrackerId) {
    const nextId = activeClasses.some((klass) => classRecordKey(klass) === classId)
      ? classId : classRecordKey(orderedActiveClasses[0]);
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
          <h2>{classFilter === "all" ? "All active classes" : classFilter === "today" ? "Today’s classes" : "Next upcoming classes"}</h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }} aria-label="Filter active classes">
            {[["upcoming", `Upcoming (${upcomingEntries.length})`], ["today", `Today (${todayEntries.length})`], ["all", `All classes (${activeClasses.length})`]].map(([value, label]) => (
              <button key={value} type="button" aria-pressed={classFilter === value}
                style={tabButtonStyle(classFilter === value)} onClick={() => setClassFilter(value)}>{label}</button>
            ))}
          </div>
          <p>Classes in progress appear first, followed by the nearest upcoming sessions. This order updates automatically.</p>
          {unavailableCount ? <p role="status">Schedules could not be loaded for {unavailableCount} class{unavailableCount === 1 ? "" : "es"}. Use All classes to view them.</p> : null}
          {schedulesLoading ? <p role="status">Loading class schedules…</p> : !activeClasses.length ? (
            <p>No active classes were found in Live Classes.</p>
          ) : !visibleEntries.length ? <p>{classFilter === "today" ? "No remaining classes today. Choose Upcoming to see the next classes." : "No upcoming classes were found. Choose All classes to check their schedules."}</p> : (
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
              {visibleEntries.map(({ klass, timing }, index) => (
                <ActiveClassCard
                  key={classRecordKey(klass)}
                  klass={klass}
                  timing={timing}
                  rank={index + 1}
                  sessions={sessionsByClass[classRecordKey(klass)]}
                  onOpenTracker={openTracker}
                />
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
              <select value={selectedTrackerClass ? classRecordKey(selectedTrackerClass) : ""} onChange={(event) => openTracker(event.target.value)}>
                {orderedActiveClasses.map((klass) => (
                  <option key={classRecordKey(klass)} value={classRecordKey(klass)}>
                    {klass.name || klass.className || classRecordKey(klass)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {selectedTrackerClass ? (
            <>
              <AttendanceCommunicationHealthPanel
                classId={classRecordKey(selectedTrackerClass)}
                className={selectedTrackerClass.name || selectedTrackerClass.className || selectedTrackerId}
              />

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

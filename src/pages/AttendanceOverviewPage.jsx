import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import OperationsCommunicationPanel from "../components/OperationsCommunicationPanel";
import ClassAttendanceTracker from "../components/ClassAttendanceTracker.jsx";
import AttendanceCommunicationHealthPanel from "../components/AttendanceCommunicationHealthPanel.jsx";
import AttendanceWeeklyEmailOutbox from "../components/AttendanceWeeklyEmailOutbox.jsx";
import { WEEKLY_OUTBOX_START } from "../utils/weeklyAttendanceOutbox.js";
import { listClassCohorts, listClassSessions } from "../services/liveClassService.js";
import { orderAttendanceClasses, weeklyTimetableLabels } from "../utils/attendanceClassTiming.js";
import { isActiveLiveClass } from "../utils/attendanceClassVisibility.js";

const GHANA_TIMEZONE = "Africa/Accra";
function normalize(value) {
  return String(value || "").trim();
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
        <span><strong>Language:</strong> {klass.language || "German"}</span>
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
        <Link to={`/live-classes?classId=${encodeURIComponent(classId)}`}>Open in Live Classes</Link>
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
  const [languageFilter, setLanguageFilter] = useState("all");
  const [diagnosticsClassId, setDiagnosticsClassId] = useState("");
  const [reportsRefresh, setReportsRefresh] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);
  const [activeTab, setActiveTab] = useState(() => searchParams.get("tab") === "tracker" ? "tracker" : "classes");
  const [selectedTrackerId, setSelectedTrackerId] = useState(() => searchParams.get("classId") || "");

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
  }, [reportsRefresh]);

  // Recheck eligibility at the calendar-day boundary, not every minute:
  // finished cohorts leave the active list without repeated Firestore reads.
  const todayKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: GHANA_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(now);
  const todayAnchor = useMemo(() => new Date(), [todayKey]);
  const activeClasses = useMemo(
    () => classes.filter((klass) => isActiveLiveClass(klass, todayAnchor)),
    [classes, todayAnchor],
  );

  const emailClasses = useMemo(() => classes.filter(klass => isActiveLiveClass(klass,todayAnchor) || (parseClassDate(klass.endDate)?.getTime() >= Date.parse(WEEKLY_OUTBOX_START))),[classes,todayAnchor]);
  useEffect(() => {
    let active = true;
    if (!emailClasses.length) {
      return () => { active = false; };
    }

    Promise.allSettled(emailClasses.map(async (klass) => {
      const classId = classRecordKey(klass);
      return [classId, await listClassSessions(classId)];
    })).then((results) => {
      if (!active) return;
      setSessionsByClass(Object.fromEntries(results.map((result, index) => [
        classRecordKey(emailClasses[index]),
        result.status === "fulfilled" ? result.value[1] : null,
      ])));
    });

    return () => { active = false; };
  }, [emailClasses]);

  const languageClasses = useMemo(() => activeClasses.filter((klass) =>
    languageFilter === "all" || (klass.language === "Swahili" ? "swahili" : "german") === languageFilter
  ), [activeClasses, languageFilter]);
  const orderedClassEntries = useMemo(
    () => orderAttendanceClasses(languageClasses, sessionsByClass, now),
    [languageClasses, sessionsByClass, now],
  );
  const orderedActiveClasses = useMemo(() => orderedClassEntries.map(({ klass }) => klass), [orderedClassEntries]);
  const schedulesLoading = languageClasses.some((klass) => sessionsByClass[classRecordKey(klass)] === undefined);
  const upcomingEntries = orderedClassEntries.filter(({ timing }) => Number.isFinite(timing?.sortTime));
  const todayEntries = upcomingEntries.filter(({ timing }) => timing.tone === "today" || timing.tone === "live");
  const visibleEntries = classFilter === "all" ? orderedClassEntries : classFilter === "today" ? todayEntries : upcomingEntries;
  const unavailableCount = orderedClassEntries.filter(({ klass }) => sessionsByClass[classRecordKey(klass)] === null).length;


  const selectedTrackerClass = languageClasses.find((klass) => classRecordKey(klass) === selectedTrackerId) || orderedActiveClasses[0] || null;



  function openClassesTab() {
    setDiagnosticsClassId("");
    setActiveTab("classes");
    setSearchParams({ tab: "classes" }, { replace: true });
  }

  function openTracker(classId = selectedTrackerId) {
    setDiagnosticsClassId("");
    const nextId = languageClasses.some((klass) => classRecordKey(klass) === classId)
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

      <AttendanceWeeklyEmailOutbox classes={emailClasses} sessionsByClass={sessionsByClass} loading={loading} onRefresh={() => { setSessionsByClass({}); setReportsRefresh(value => value + 1); }} />
      <OperationsCommunicationPanel context="attendance" />

      <nav style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "16px 0" }} aria-label="Attendance sections">
        <button type="button" style={tabButtonStyle(activeTab === "classes")} onClick={openClassesTab}>
          Active classes ({activeClasses.length})
        </button>
        <button type="button" style={tabButtonStyle(activeTab === "tracker")} onClick={() => openTracker()} disabled={!activeClasses.length}>
          Attendance tracker
        </button>
      </nav>

      {!loading && !error ? <label>Language{" "}
        <select value={languageFilter} onChange={(event) => {
          setLanguageFilter(event.target.value);
          setClassFilter("all");
        }}>
          <option value="all">All languages</option>
          <option value="german">German</option>
          <option value="swahili">Swahili</option>
        </select>
      </label> : null}
      {loading ? <p>Loading active Live Classes…</p> : null}
      {error ? <p style={{ color: "#a00000" }}>❌ {error}</p> : null}

      {!loading && !error && activeTab === "classes" ? (
        <section>
          <h2>{classFilter === "all" ? "All active classes" : classFilter === "today" ? "Today’s classes" : "Next upcoming classes"}</h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }} aria-label="Filter active classes">
            {[["upcoming", `Upcoming (${upcomingEntries.length})`], ["today", `Today (${todayEntries.length})`], ["all", `All classes (${languageClasses.length})`]].map(([value, label]) => (
              <button key={value} type="button" aria-pressed={classFilter === value}
                style={tabButtonStyle(classFilter === value)} onClick={() => setClassFilter(value)}>{label}</button>
            ))}
          </div>
          <p>Classes in progress appear first, followed by the nearest upcoming sessions. This order updates automatically.</p>
          {unavailableCount ? <p role="status">Schedules could not be loaded for {unavailableCount} class{unavailableCount === 1 ? "" : "es"}. Use All classes to view them.</p> : null}
          {schedulesLoading ? <p role="status">Loading class schedules…</p> : !languageClasses.length ? (
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
              <section style={{ margin: "12px 0" }}>
                <button type="button" aria-expanded={diagnosticsClassId === classRecordKey(selectedTrackerClass)} onClick={() => setDiagnosticsClassId(current => current === classRecordKey(selectedTrackerClass) ? "" : classRecordKey(selectedTrackerClass))}>
                  {diagnosticsClassId === classRecordKey(selectedTrackerClass) ? "Hide email delivery details" : "View email delivery details"}
                </button>
                {diagnosticsClassId === classRecordKey(selectedTrackerClass) && (
                  <AttendanceCommunicationHealthPanel
                    classId={classRecordKey(selectedTrackerClass)}
                    className={selectedTrackerClass.name || selectedTrackerClass.className || selectedTrackerId}
                  />
                )}
              </section>

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

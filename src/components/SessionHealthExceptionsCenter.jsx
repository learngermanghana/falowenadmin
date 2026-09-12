import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getCompatibleClassDashboard } from "../services/liveClassCompatibilityService.js";
import { listClassCohorts } from "../services/liveClassService.js";
import { loadSessionOperationalState } from "../services/sessionHealthExceptionsService.js";
import { buildSessionHealthExceptions } from "../utils/sessionHealthExceptions.js";

const CLASS_STORAGE_KEY = "falowen-session-health-class-id";

function badgeStyle(status) {
  if (status === "action") return { background: "#fee2e2", color: "#991b1b", border: "1px solid #fecaca" };
  if (status === "review") return { background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" };
  return { background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0" };
}

function issueStyle(severity) {
  return severity === "action"
    ? { border: "1px solid #fecaca", background: "#fff7f7" }
    : { border: "1px solid #fde68a", background: "#fffdf5" };
}

function SummaryCard({ label, value, helper, status = "healthy" }) {
  return (
    <div style={{ ...badgeStyle(status), borderRadius: 12, padding: 14, minWidth: 170, display: "grid", gap: 5 }}>
      <span style={{ fontSize: 13, fontWeight: 700 }}>{label}</span>
      <strong style={{ fontSize: 24 }}>{value}</strong>
      {helper ? <small>{helper}</small> : null}
    </div>
  );
}

function FilterButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: active ? "1px solid #1d4ed8" : "1px solid #cbd5e1",
        background: active ? "#1d4ed8" : "#fff",
        color: active ? "#fff" : "#334155",
        borderRadius: 999,
        padding: "7px 12px",
        fontWeight: 700,
      }}
    >
      {children}
    </button>
  );
}

export default function SessionHealthExceptionsCenter() {
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState("");
  const [dashboard, setDashboard] = useState(null);
  const [operational, setOperational] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    let active = true;
    listClassCohorts()
      .then((rows) => {
        if (!active) return;
        setClasses(rows);
        const remembered = typeof window !== "undefined"
          ? window.localStorage.getItem(CLASS_STORAGE_KEY) || ""
          : "";
        setClassId(rows.some((item) => item.id === remembered) ? remembered : rows[0]?.id || "");
      })
      .catch((error) => {
        if (active) setMessage(error?.message || "Could not load classes for health inspection.");
      });
    return () => { active = false; };
  }, []);

  const refresh = useCallback(async (nextClassId = classId) => {
    if (!nextClassId) {
      setDashboard(null);
      setOperational(null);
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const nextDashboard = await getCompatibleClassDashboard(nextClassId);
      const nextOperational = await loadSessionOperationalState({
        classId: nextClassId,
        klass: nextDashboard.klass,
        sessions: nextDashboard.sessions || [],
      });
      setDashboard(nextDashboard);
      setOperational(nextOperational);
    } catch (error) {
      setDashboard(null);
      setOperational(null);
      setMessage(error?.message || "Could not inspect this class.");
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    if (!classId) {
      setDashboard(null);
      setOperational(null);
      return;
    }
    if (typeof window !== "undefined") window.localStorage.setItem(CLASS_STORAGE_KEY, classId);
    refresh(classId);
  }, [classId, refresh]);

  const health = useMemo(() => {
    if (!dashboard || !operational) return null;
    return buildSessionHealthExceptions({
      klass: dashboard.klass,
      sessions: dashboard.sessions || [],
      attendanceBySessionId: operational.attendanceBySessionId,
      checkins: operational.checkins,
      checkinLoadFailures: operational.checkinLoadFailures,
      autoOpenRuntime: operational.autoOpenRuntime,
      sessionRepair: dashboard.sessionRepair,
      curriculumRepair: dashboard.curriculumRepair,
      now: new Date(),
    });
  }, [dashboard, operational]);

  const visibleIssues = useMemo(() => {
    if (!health) return [];
    if (filter === "action") return health.actionRequired;
    if (filter === "review") return health.needsReview;
    return health.issues;
  }, [health, filter]);

  return (
    <section className="page-container">
      <article className="card" style={{ display: "grid", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ marginBottom: 5 }}>Session Health &amp; Exceptions</h1>
            <p style={{ margin: 0, maxWidth: 760 }}>
              Cross-check Live Classes, Attendance, check-in automation and communication status before an operational mismatch reaches students.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "end", flexWrap: "wrap" }}>
            <label style={{ display: "grid", gap: 5, minWidth: 250 }}>
              <strong>Class to inspect</strong>
              <select
                value={classId}
                disabled={loading}
                onChange={(event) => {
                  setClassId(event.target.value);
                  setFilter("all");
                  setMessage("");
                }}
              >
                <option value="">Select a class</option>
                {classes.map((klass) => (
                  <option key={klass.id} value={klass.id}>{klass.name || klass.className || klass.id}</option>
                ))}
              </select>
            </label>
            <button type="button" disabled={loading || !classId} onClick={() => refresh(classId)}>
              {loading ? "Checking…" : "Refresh health"}
            </button>
          </div>
        </div>

        {message ? (
          <div style={{ padding: 11, borderRadius: 8, border: "1px solid #fecaca", background: "#fff7f7", color: "#991b1b" }}>
            {message}
          </div>
        ) : null}

        {loading ? <p>Checking sessions, attendance, check-ins and delivery state…</p> : null}

        {!loading && health ? (
          <>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <SummaryCard label="Overall status" value={health.label} status={health.status} helper={health.className || health.classId} />
              <SummaryCard label="Action required" value={health.counts.actionRequired} status={health.counts.actionRequired ? "action" : "healthy"} helper="Blocking or student-impacting exceptions" />
              <SummaryCard label="Needs review" value={health.counts.needsReview} status={health.counts.needsReview ? "review" : "healthy"} helper="Non-blocking items to verify" />
              <SummaryCard label="Records checked" value={health.counts.sessions} helper={`${health.counts.attendanceSessions} attendance · ${health.counts.checkins} check-ins`} />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>All ({health.issues.length})</FilterButton>
                <FilterButton active={filter === "action"} onClick={() => setFilter("action")}>Action required ({health.actionRequired.length})</FilterButton>
                <FilterButton active={filter === "review"} onClick={() => setFilter("review")}>Needs review ({health.needsReview.length})</FilterButton>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link to="/attendance">Attendance overview</Link>
                <Link to="/communication">Communication</Link>
              </div>
            </div>

            {visibleIssues.length ? (
              <div style={{ display: "grid", gap: 10 }}>
                {visibleIssues.map((issue) => (
                  <div key={issue.id} style={{ ...issueStyle(issue.severity), borderRadius: 10, padding: 13, display: "grid", gap: 7 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <strong>{issue.title}</strong>
                      <span style={{ ...badgeStyle(issue.severity), borderRadius: 999, padding: "4px 9px", fontSize: 12, fontWeight: 800 }}>
                        {issue.severity === "action" ? "ACTION REQUIRED" : "NEEDS REVIEW"}
                      </span>
                    </div>
                    {issue.detail ? <span>{issue.detail}</span> : null}
                    <small style={{ color: "#64748b" }}>
                      {issue.code ? `Check: ${issue.code}` : ""}
                      {issue.sessionId ? ` · Session: ${issue.sessionId}` : ""}
                      {issue.studentKey ? ` · Student: ${issue.studentKey}` : ""}
                    </small>
                    {issue.action ? <span><strong>Next action:</strong> {issue.action}</span> : null}
                    {issue.sessionId ? (
                      <div>
                        <Link to={`/attendance/session/${encodeURIComponent(classId)}?session=${encodeURIComponent(issue.sessionId)}`}>
                          Open this session in Attendance
                        </Link>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: 16, borderRadius: 10, border: "1px solid #bbf7d0", background: "#f0fdf4", color: "#166534" }}>
                <strong>Healthy.</strong> No operational session, attendance, check-in or communication exceptions were detected for this class.
              </div>
            )}
          </>
        ) : null}
      </article>
    </section>
  );
}

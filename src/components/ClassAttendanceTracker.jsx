import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { loadClassAttendanceAnalytics } from "../services/attendanceAnalyticsService.js";
import {
  buildAttendanceCsv,
  filterAttendanceRecords,
} from "../utils/attendanceAnalytics.js";

function normalize(value) {
  return String(value ?? "").trim();
}

function asDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateTime(value, timezone = "Africa/Accra") {
  const date = asDate(value);
  if (!date) return "—";
  return date.toLocaleString("en-GB", {
    timeZone: timezone,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function statusLabel(status) {
  return ({
    present: "Present",
    late: "Late",
    absent: "Absent",
    excused: "Excused",
    cancelled: "Cancelled",
    upcoming: "Upcoming",
  })[status] || status || "Unknown";
}

function statusStyle(status) {
  if (status === "present") return { background: "#dcfce7", color: "#166534" };
  if (status === "late") return { background: "#fef3c7", color: "#92400e" };
  if (status === "absent") return { background: "#fee2e2", color: "#991b1b" };
  if (status === "excused") return { background: "#e0e7ff", color: "#3730a3" };
  return { background: "#e2e8f0", color: "#334155" };
}

function summaryCard(label, value, helper = "") {
  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, background: "#fff" }}>
      <div style={{ color: "#64748b", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4 }}>{value}</div>
      {helper ? <div style={{ color: "#64748b", fontSize: 12, marginTop: 3 }}>{helper}</div> : null}
    </div>
  );
}

function downloadCsv(filename, content) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export default function ClassAttendanceTracker({ classId = "", className = "" }) {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    let active = true;
    if (!classId) {
      setState(null);
      return () => { active = false; };
    }
    setLoading(true);
    setError("");
    loadClassAttendanceAnalytics({ classId, className })
      .then((result) => { if (active) setState(result); })
      .catch((cause) => {
        if (!active) return;
        setState(null);
        setError(cause?.message || "Could not load class attendance tracking.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [classId, className, reloadToken]);

  const analytics = state?.analytics;
  const filteredRecords = useMemo(() => filterAttendanceRecords(analytics?.records || [], {
    query,
    status,
    dateFrom,
    dateTo,
  }), [analytics?.records, dateFrom, dateTo, query, status]);
  const absenceAlerts = useMemo(() => (analytics?.studentSummaries || [])
    .filter((student) => student.consecutiveAbsences >= 2)
    .sort((left, right) => right.consecutiveAbsences - left.consecutiveAbsences), [analytics?.studentSummaries]);

  function exportCsv() {
    if (!filteredRecords.length) return;
    const safeName = normalize(className || state?.klass?.name || classId).replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
    downloadCsv(`${safeName || "class"}-attendance.csv`, buildAttendanceCsv(filteredRecords));
  }

  if (!classId) return null;

  return (
    <article className="card" style={{ marginTop: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div>
          <h2 style={{ marginTop: 0 }}>Attendance tracker</h2>
          <p style={{ marginBottom: 0 }}>
            QR check-ins and manually saved attendance are combined for <strong>{className || state?.klass?.name || classId}</strong>.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" disabled={loading} onClick={() => setReloadToken((value) => value + 1)}>{loading ? "Refreshing…" : "Refresh check-ins"}</button>
          <Link to={`/attendance/session/${encodeURIComponent(classId)}`}>Open session attendance</Link>
        </div>
      </div>

      {loading ? <p>Loading attendance and check-ins…</p> : null}
      {error ? <div style={{ marginTop: 14, padding: 12, border: "1px solid #fecaca", background: "#fef2f2", color: "#991b1b", borderRadius: 8 }}>{error}</div> : null}

      {!loading && analytics ? (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))", gap: 10, marginTop: 16 }}>
            {summaryCard("Students", analytics.classSummary.totalStudents)}
            {summaryCard("Sessions held", analytics.classSummary.sessionsHeld)}
            {summaryCard("Attendance", `${analytics.classSummary.attendancePercent}%`, "Present and late")}
            {summaryCard("Present", analytics.classSummary.present)}
            {summaryCard("Late", analytics.classSummary.late, `More than ${analytics.lateMinutes} minutes`)}
            {summaryCard("Absent", analytics.classSummary.absent)}
            {summaryCard("Checked in today", analytics.classSummary.todayCheckedIn)}
            {summaryCard("Missing today", analytics.classSummary.todayMissing)}
          </div>

          {absenceAlerts.length ? (
            <div style={{ marginTop: 16, padding: 13, borderRadius: 10, border: "1px solid #fecaca", background: "#fff7f7" }}>
              <strong>Consecutive absence alerts</strong>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                {absenceAlerts.map((student) => (
                  <span key={student.studentKey} style={{ padding: "5px 9px", borderRadius: 999, background: "#fee2e2", color: "#991b1b", fontWeight: 700 }}>
                    {student.studentName}: {student.consecutiveAbsences}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <section style={{ marginTop: 20 }}>
            <h3>Student attendance summary</h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 780 }}>
                <thead><tr><th>Student</th><th>Held</th><th>Present</th><th>Late</th><th>Absent</th><th>Rate</th><th>Consecutive absences</th><th>Last check-in</th></tr></thead>
                <tbody>
                  {analytics.studentSummaries.map((student) => (
                    <tr key={student.studentKey} style={{ borderTop: "1px solid #e2e8f0" }}>
                      <td style={{ padding: 8 }}><strong>{student.studentName}</strong><br /><small>{student.studentCode || student.studentEmail}</small></td>
                      <td style={{ padding: 8 }}>{student.sessionsHeld}</td>
                      <td style={{ padding: 8 }}>{student.present}</td>
                      <td style={{ padding: 8 }}>{student.late}</td>
                      <td style={{ padding: 8 }}>{student.absent}</td>
                      <td style={{ padding: 8 }}><strong>{student.attendancePercent}%</strong></td>
                      <td style={{ padding: 8 }}>{student.consecutiveAbsences}</td>
                      <td style={{ padding: 8 }}>{formatDateTime(student.lastCheckin, analytics.timezone)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section style={{ marginTop: 20 }}>
            <h3>Session register</h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
                <thead><tr><th>Session</th><th>Date</th><th>Status</th><th>Checked in</th><th>Late</th><th>Absent</th><th>Rate</th><th>Open</th></tr></thead>
                <tbody>
                  {[...analytics.sessionSummaries].reverse().map((session) => (
                    <tr key={session.sessionId} style={{ borderTop: "1px solid #e2e8f0" }}>
                      <td style={{ padding: 8 }}>{session.topic}</td>
                      <td style={{ padding: 8 }}>{formatDateTime(session.startsAt, analytics.timezone)}</td>
                      <td style={{ padding: 8 }}>{session.held ? "Held" : session.status}</td>
                      <td style={{ padding: 8 }}>{session.checkedIn}</td>
                      <td style={{ padding: 8 }}>{session.late}</td>
                      <td style={{ padding: 8 }}>{session.absent}</td>
                      <td style={{ padding: 8 }}>{session.held ? `${session.attendancePercent}%` : "—"}</td>
                      <td style={{ padding: 8 }}><Link to={`/attendance/session/${encodeURIComponent(classId)}?session=${encodeURIComponent(session.sessionId)}`}>View</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section style={{ marginTop: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "end" }}>
              <div>
                <h3 style={{ marginBottom: 4 }}>Detailed attendance data</h3>
                <small>{filteredRecords.length} record(s)</small>
              </div>
              <button type="button" disabled={!filteredRecords.length} onClick={exportCsv}>Export filtered CSV</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10, marginTop: 12 }}>
              <label style={{ display: "grid", gap: 5 }}><strong>Search</strong><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Student, code or session" /></label>
              <label style={{ display: "grid", gap: 5 }}><strong>Status</strong><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="present">Present</option><option value="late">Late</option><option value="absent">Absent</option><option value="excused">Excused</option><option value="cancelled">Cancelled</option><option value="upcoming">Upcoming</option></select></label>
              <label style={{ display: "grid", gap: 5 }}><strong>From</strong><input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} /></label>
              <label style={{ display: "grid", gap: 5 }}><strong>To</strong><input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} /></label>
            </div>
            <div style={{ overflowX: "auto", marginTop: 12, maxHeight: 560 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
                <thead><tr><th>Student</th><th>Session</th><th>Date</th><th>Status</th><th>Check-in time</th><th>Method</th></tr></thead>
                <tbody>
                  {filteredRecords.map((record) => (
                    <tr key={`${record.sessionId}-${record.studentKey}`} style={{ borderTop: "1px solid #e2e8f0" }}>
                      <td style={{ padding: 8 }}><strong>{record.studentName}</strong><br /><small>{record.studentCode}</small></td>
                      <td style={{ padding: 8 }}>{record.sessionTopic}</td>
                      <td style={{ padding: 8 }}>{formatDateTime(record.startsAt, analytics.timezone)}</td>
                      <td style={{ padding: 8 }}><span style={{ ...statusStyle(record.status), borderRadius: 999, padding: "4px 8px", fontWeight: 700 }}>{statusLabel(record.status)}</span></td>
                      <td style={{ padding: 8 }}>{formatDateTime(record.checkedInAt, analytics.timezone)}</td>
                      <td style={{ padding: 8 }}>{record.method || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </article>
  );
}

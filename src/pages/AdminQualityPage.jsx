import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { collection, collectionGroup, getDocs, limit, orderBy, query } from "firebase/firestore";
import { db } from "../firebase.js";
import { loadSubmissions } from "../services/markingService.js";
import { listAllStudents } from "../services/studentsService.js";

const PASS_MARK = 60;
const LOW_ATTENDANCE = 70;
const ATTENDANCE_TARGET = 80;

function text(value) {
  return String(value ?? "").trim();
}

function lower(value) {
  return text(value).toLowerCase();
}

function toDateMs(value) {
  if (!value) return 0;
  if (typeof value === "number") return value;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function scoreNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function isToday(value) {
  const ms = toDateMs(value);
  if (!ms) return false;
  const date = new Date(ms);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}

function withinDays(value, days) {
  const ms = toDateMs(value);
  if (!ms) return false;
  return Date.now() - ms <= days * 24 * 60 * 60 * 1000;
}

function displayDate(value) {
  const ms = toDateMs(value);
  if (!ms) return "—";
  return new Date(ms).toLocaleString();
}

function studentCode(student = {}) {
  return text(student.studentCode || student.studentcode || student.code || student.id).toLowerCase();
}

function studentName(student = {}) {
  return text(student.name || student.studentName || student.fullName || student.email || studentCode(student) || "Unknown student");
}

function classLabel(student = {}) {
  return text(student.className || student.class || student.level || student.program || "Unassigned");
}

function attended(value) {
  if (value === true) return true;
  if (value === false) return false;
  const valueText = lower(value?.status || value?.attendance || value?.present || value?.attended || value);
  if (!valueText) return null;
  if (valueText.includes("present") || valueText.includes("late") || valueText.includes("attended") || valueText === "true" || valueText === "1") return true;
  if (valueText.includes("absent") || valueText.includes("missed") || valueText === "false" || valueText === "0") return false;
  return null;
}

function readStudentAttendanceFromSession(session = {}, code = "") {
  const codes = [code, code.toUpperCase(), code.toLowerCase()].filter(Boolean);
  const maps = [session.attendance, session.students, session.participants];
  for (const map of maps) {
    if (!map || typeof map !== "object") continue;
    for (const key of codes) {
      if (map[key] !== undefined) return attended(map[key]);
    }
  }
  return null;
}

function StatCard({ label, value, helper, tone = "blue" }) {
  return (
    <article style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: 16, background: "#fff", display: "grid", gap: 6 }}>
      <span style={{ color: tone === "red" ? "#991b1b" : tone === "amber" ? "#92400e" : tone === "green" ? "#065f46" : "#1d4ed8", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</span>
      <strong style={{ fontSize: 28, color: "#111827" }}>{value}</strong>
      {helper ? <p style={{ margin: 0, color: "#6b7280", fontSize: 13 }}>{helper}</p> : null}
    </article>
  );
}

function ProblemList({ title, items, emptyText, actionLabel = "Open" }) {
  return (
    <section style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: 16, background: "#fff", display: "grid", gap: 12 }}>
      <h2 style={{ margin: 0, fontSize: 18 }}>{title}</h2>
      {items.length ? (
        <div style={{ display: "grid", gap: 10 }}>
          {items.slice(0, 12).map((item) => (
            <div key={item.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, border: "1px solid #f3f4f6", borderRadius: 12, padding: 12, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ display: "grid", gap: 3 }}>
                <strong>{item.title}</strong>
                <small style={{ color: "#6b7280" }}>{item.detail}</small>
              </div>
              {item.to ? <Link to={item.to} style={{ fontWeight: 800, color: "#2563eb" }}>{actionLabel}</Link> : null}
            </div>
          ))}
        </div>
      ) : (
        <p style={{ margin: 0, color: "#6b7280" }}>{emptyText}</p>
      )}
    </section>
  );
}

async function safeLoad(label, loader) {
  try {
    return { label, rows: await loader(), error: "" };
  } catch (error) {
    return { label, rows: [], error: error?.message || String(error || "Failed") };
  }
}

async function loadCollectionRows(collectionName, maxRows = 300) {
  const snap = await getDocs(query(collection(db, collectionName), limit(maxRows)));
  return snap.docs.map((docSnap) => ({ id: docSnap.id, path: `${collectionName}/${docSnap.id}`, ...(docSnap.data() || {}) }));
}

async function loadSessionRows(maxRows = 300) {
  const snap = await getDocs(query(collectionGroup(db, "sessions"), limit(maxRows)));
  return snap.docs.map((docSnap) => ({ id: docSnap.id, path: docSnap.ref.path, ...(docSnap.data() || {}) }));
}

export default function AdminQualityPage() {
  const [state, setState] = useState({ loading: true, errors: [], submissions: [], scores: [], markingResults: [], notifications: [], students: [], sessions: [] });

  const refresh = async () => {
    setState((current) => ({ ...current, loading: true, errors: [] }));
    const [submissionsRes, scoresRes, markingRes, notificationsRes, studentsRes, sessionsRes] = await Promise.all([
      safeLoad("submissions", () => loadSubmissions()),
      safeLoad("scores", () => loadCollectionRows("scores")),
      safeLoad("markingResults", () => loadCollectionRows("markingResults")),
      safeLoad("studentNotifications", () => loadCollectionRows("studentNotifications")),
      safeLoad("students", () => listAllStudents()),
      safeLoad("attendance sessions", () => loadSessionRows()),
    ]);

    setState({
      loading: false,
      errors: [submissionsRes, scoresRes, markingRes, notificationsRes, studentsRes, sessionsRes].filter((item) => item.error),
      submissions: submissionsRes.rows,
      scores: scoresRes.rows,
      markingResults: markingRes.rows,
      notifications: notificationsRes.rows,
      students: studentsRes.rows,
      sessions: sessionsRes.rows,
    });
  };

  useEffect(() => {
    refresh();
  }, []);

  const analytics = useMemo(() => {
    const markedToday = state.scores.filter((row) => isToday(row.date || row.createdAt || row.updatedAt)).length;
    const recentScores = state.scores.filter((row) => withinDays(row.date || row.createdAt || row.updatedAt, 7));
    const sheetSaved = state.scores.filter((row) => row.sheetSaved === true || lower(row.sheetMessage).includes("sheet")).length;
    const notificationsSent = state.notifications.filter((row) => lower(row.type).includes("score") || lower(row.type).includes("feedback") || lower(row.data?.type).includes("marked_assignment")).length;
    const failedNotifications = state.markingResults.filter((row) => row.studentNotification?.attempted && row.studentNotification?.success === false);
    const pendingQueue = state.submissions.length;
    const failedMarking = state.markingResults.filter((row) => lower(row.status).includes("failed") || lower(row.status).includes("error"));
    const markedNoNotification = state.markingResults.filter((row) => {
      const score = scoreNumber(row.finalScore ?? row.score);
      return score !== null && row.sentToStudent !== true && row.studentNotification?.success !== true;
    });
    const savedFirestoreNotSheet = state.scores.filter((row) => row.sheetSaved === false || lower(row.sheetMessage).includes("failed"));
    const pendingMoreThan24Hours = state.submissions.filter((row) => {
      const created = row.createdAt || row.submittedAt || row.date || row.raw?.createdAt;
      return toDateMs(created) && Date.now() - toDateMs(created) > 24 * 60 * 60 * 1000;
    });

    const studentAttendance = state.students.map((student) => {
      const code = studentCode(student);
      const matchingSessions = state.sessions.filter((session) => {
        const sessionClass = lower(session.className || session.classId || session.class || session.group || "");
        const studentClass = lower(classLabel(student));
        return !studentClass || studentClass === "unassigned" || !sessionClass || sessionClass.includes(studentClass) || studentClass.includes(sessionClass);
      });
      let present = 0;
      let absent = 0;
      const recentStatuses = [];
      matchingSessions.forEach((session) => {
        const status = readStudentAttendanceFromSession(session, code);
        if (status === true) {
          present += 1;
          recentStatuses.push({ present: true, timestamp: toDateMs(session.date || session.createdAt || session.updatedAt || session.id) });
        }
        if (status === false) {
          absent += 1;
          recentStatuses.push({ present: false, timestamp: toDateMs(session.date || session.createdAt || session.updatedAt || session.id) });
        }
      });
      const total = present + absent;
      const rate = total ? Math.round((present / total) * 100) : null;
      const sorted = recentStatuses.sort((a, b) => b.timestamp - a.timestamp);
      let absentStreak = 0;
      for (const status of sorted) {
        if (status.present === false) absentStreak += 1;
        else break;
      }
      return { student, present, absent, total, rate, absentStreak };
    });

    const lowAttendance = studentAttendance.filter((row) => row.rate !== null && row.rate < LOW_ATTENDANCE);
    const absentThreeTimes = studentAttendance.filter((row) => row.absentStreak >= 3);
    const notAttendedThisWeek = studentAttendance.filter((row) => row.total > 0 && !state.sessions.some((session) => withinDays(session.date || session.createdAt || session.updatedAt || session.id, 7) && readStudentAttendanceFromSession(session, studentCode(row.student)) === true));

    return {
      markedToday,
      recentScores,
      sheetSaved,
      notificationsSent,
      failedNotifications,
      pendingQueue,
      failedMarking,
      markedNoNotification,
      savedFirestoreNotSheet,
      pendingMoreThan24Hours,
      lowAttendance,
      absentThreeTimes,
      notAttendedThisWeek,
    };
  }, [state]);

  const problemItems = [
    ...analytics.markedNoNotification.map((row) => ({ id: `mn-${row.id}`, title: row.studentName || row.studentCode || "Marked result", detail: `Marked but no student notification · ${displayDate(row.updatedAt || row.createdAt)}`, to: "/marking" })),
    ...analytics.savedFirestoreNotSheet.map((row) => ({ id: `ss-${row.id}`, title: row.name || row.studentcode || "Score row", detail: `Saved in Firestore but Sheet problem: ${row.sheetMessage || "not confirmed"}`, to: "/marking" })),
    ...analytics.failedMarking.map((row) => ({ id: `fm-${row.id}`, title: row.studentName || row.studentCode || "Failed marking result", detail: row.feedback || row.message || row.status || "Needs review", to: "/marking" })),
    ...analytics.pendingMoreThan24Hours.map((row) => ({ id: `p24-${row.path || row.id}`, title: row.studentName || row.studentCode || "Pending submission", detail: `${row.assignment || "Assignment"} pending more than 24 hours`, to: "/marking" })),
  ];

  const attendanceItems = [
    ...analytics.lowAttendance.map((row) => ({ id: `low-${studentCode(row.student)}`, title: studentName(row.student), detail: `${row.rate}% attendance · ${row.present}/${row.total} classes`, to: "/students" })),
    ...analytics.absentThreeTimes.map((row) => ({ id: `streak-${studentCode(row.student)}`, title: studentName(row.student), detail: `${row.absentStreak} absences in a row`, to: "/students" })),
    ...analytics.notAttendedThisWeek.slice(0, 20).map((row) => ({ id: `week-${studentCode(row.student)}`, title: studentName(row.student), detail: "No confirmed attendance this week", to: "/students" })),
  ];

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <section style={{ borderRadius: 20, padding: 22, color: "#fff", background: "linear-gradient(135deg, #111827, #1d4ed8)", display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <p style={{ margin: 0, color: "#bfdbfe", fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase" }}>Admin Quality Check</p>
          <h1 style={{ margin: "6px 0", fontSize: 30 }}>Marking, notifications and attendance health</h1>
          <p style={{ margin: 0, color: "#e0e7ff" }}>Use this page to catch save failures, missing student notifications, old pending work, and attendance risks.</p>
        </div>
        <button type="button" onClick={refresh} disabled={state.loading} style={{ alignSelf: "center", border: 0, borderRadius: 999, padding: "10px 16px", fontWeight: 900, color: "#111827", background: "#dcfce7", cursor: "pointer" }}>
          {state.loading ? "Refreshing..." : "Refresh checks"}
        </button>
      </section>

      {state.errors.length ? (
        <section style={{ border: "1px solid #fecaca", background: "#fef2f2", color: "#991b1b", borderRadius: 14, padding: 14 }}>
          <strong>Some checks could not load:</strong>
          <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
            {state.errors.map((item) => <li key={item.label}>{item.label}: {item.error}</li>)}
          </ul>
        </section>
      ) : null}

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        <StatCard label="Marked today" value={analytics.markedToday} helper={`${analytics.recentScores.length} scores in last 7 days`} tone="green" />
        <StatCard label="Sheet saved" value={analytics.sheetSaved} helper="Confirmed score mirrors with sheet status" tone="blue" />
        <StatCard label="Notifications" value={analytics.notificationsSent} helper={`${analytics.failedNotifications.length} failed notification(s)`} tone={analytics.failedNotifications.length ? "red" : "green"} />
        <StatCard label="Pending queue" value={analytics.pendingQueue} helper={`${analytics.pendingMoreThan24Hours.length} older than 24 hours`} tone={analytics.pendingMoreThan24Hours.length ? "amber" : "blue"} />
        <StatCard label="Low attendance" value={analytics.lowAttendance.length} helper={`Below ${LOW_ATTENDANCE}% attendance`} tone={analytics.lowAttendance.length ? "red" : "green"} />
        <StatCard label="Target" value={`${ATTENDANCE_TARGET}%`} helper="Recommended attendance target" tone="blue" />
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14 }}>
        <ProblemList title="Problems to fix" items={problemItems} emptyText="No marking or notification problems found in the loaded records." />
        <ProblemList title="Attendance alerts" items={attendanceItems} emptyText="No low attendance or absence streak alerts found in the loaded records." actionLabel="Review" />
      </section>
    </div>
  );
}

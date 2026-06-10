import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { collection, collectionGroup, getDocs, limit, query } from "firebase/firestore";
import { db } from "../firebase.js";
import { loadSubmissions, saveScoreRow } from "../services/markingService.js";
import { createMarkedAssignmentNotification } from "../services/studentNotificationService.js";
import { listAllStudents } from "../services/studentsService.js";
import { inferSubmissionIdentity } from "../utils/submissionIdentity.js";

const LOW_ATTENDANCE = 70;
const ATTENDANCE_TARGET = 80;
const RESOLVED_STORAGE_KEY = "falowen.admin.quality.resolvedIds";

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

function normalizeKey(value) {
  return lower(value).replace(/\s+/g, " ");
}

function addLookup(map, key, student) {
  const normalized = normalizeKey(key);
  if (!normalized || map.has(normalized)) return;
  map.set(normalized, student);
}

function directStudentName(student = {}) {
  const combinedName = `${text(student.firstName || student.firstname)} ${text(student.lastName || student.lastname)}`.trim();
  return text(
    student.name ||
      student.studentName ||
      student.fullName ||
      student.displayName ||
      student.full_name ||
      combinedName,
  );
}

function studentUid(student = {}) {
  return text(
    student.studentId ||
      student.student_id ||
      student.uid ||
      student.firebaseUid ||
      student.firebase_uid ||
      student.id,
  ).toLowerCase();
}

function studentCode(student = {}) {
  return text(
    student.studentCode ||
      student.studentcode ||
      student.student_code ||
      student.code ||
      student.studentCodePlain ||
      student.student_code_plain,
  ).toLowerCase();
}

function studentEmail(student = {}) {
  return lower(student.email || student.studentEmail || student.mail);
}

function studentName(student = {}) {
  return text(directStudentName(student) || studentEmail(student) || studentCode(student) || studentUid(student) || "Unknown student");
}

function classLabel(student = {}) {
  return text(student.className || student.class || student.level || student.program || "Unassigned");
}

function buildStudentIndex(students = []) {
  const byCode = new Map();
  const byEmail = new Map();
  const byName = new Map();
  const byUid = new Map();

  students.forEach((student) => {
    addLookup(byCode, studentCode(student), student);
    addLookup(byCode, student.studentCode, student);
    addLookup(byCode, student.studentcode, student);
    addLookup(byCode, student.student_code, student);
    addLookup(byCode, student.code, student);
    addLookup(byEmail, studentEmail(student), student);
    addLookup(byEmail, student.email, student);
    addLookup(byEmail, student.studentEmail, student);
    addLookup(byName, directStudentName(student), student);
    addLookup(byUid, studentUid(student), student);
    addLookup(byUid, student.studentId, student);
    addLookup(byUid, student.student_id, student);
    addLookup(byUid, student.uid, student);
    addLookup(byUid, student.firebaseUid, student);
    addLookup(byUid, student.id, student);
  });

  return { byCode, byEmail, byName, byUid };
}

function rowScopeKey(row = {}) {
  return text(
    row.studentScopeKey ||
      row.student_scope_key ||
      row.scopeKey ||
      row.result?.studentScopeKey ||
      row.result?.student_scope_key ||
      row.data?.studentScopeKey ||
      row.data?.student_scope_key ||
      row.raw?.studentScopeKey ||
      row.raw?.student_scope_key,
  );
}

function codeFromScopeKey(value) {
  const scope = text(value);
  if (!scope.includes("__")) return "";
  const parts = scope.split("__").map((part) => text(part)).filter(Boolean);
  return text(parts[1] || "").toLowerCase();
}

function uidFromScopeKey(value) {
  const scope = text(value);
  if (!scope.includes("__")) return "";
  const parts = scope.split("__").map((part) => text(part)).filter(Boolean);
  return text(parts[0] || "").toLowerCase();
}

function rowStudentUid(row = {}) {
  const scope = rowScopeKey(row);
  return text(
    row.studentId ||
      row.student_id ||
      row.uid ||
      row.firebaseUid ||
      row.result?.studentId ||
      row.result?.student_id ||
      row.result?.uid ||
      row.data?.studentId ||
      row.data?.student_id ||
      row.data?.uid ||
      row.raw?.studentId ||
      row.raw?.student_id ||
      row.raw?.uid ||
      uidFromScopeKey(scope),
  ).toLowerCase();
}

function rowRawStudentCode(row = {}) {
  const scope = rowScopeKey(row);
  return text(
    row.studentCode ||
      row.studentcode ||
      row.student_code ||
      row.code ||
      row.result?.studentCode ||
      row.result?.studentcode ||
      row.result?.student_code ||
      row.data?.studentCode ||
      row.data?.studentcode ||
      row.data?.student_code ||
      row.raw?.studentCode ||
      row.raw?.studentcode ||
      row.raw?.student_code ||
      codeFromScopeKey(scope) ||
      inferSubmissionIdentity(row).studentCode,
  ).toLowerCase();
}

function rowStudentEmail(row = {}) {
  return lower(
    row.email ||
      row.studentEmail ||
      row.result?.email ||
      row.result?.studentEmail ||
      row.data?.email ||
      row.data?.studentEmail ||
      row.raw?.email ||
      row.raw?.studentEmail,
  );
}

function rowDirectStudentName(row = {}) {
  return text(
    row.studentName ||
      row.name ||
      row.fullName ||
      row.displayName ||
      row.result?.studentName ||
      row.result?.name ||
      row.result?.fullName ||
      row.data?.studentName ||
      row.data?.name ||
      row.data?.fullName ||
      row.raw?.studentName ||
      row.raw?.name ||
      row.raw?.fullName,
  );
}

function findStudentForRow(row = {}, studentIndex) {
  if (!studentIndex) return null;
  const code = rowRawStudentCode(row);
  const email = rowStudentEmail(row);
  const name = rowDirectStudentName(row);
  const uid = rowStudentUid(row);

  if (code && studentIndex.byCode.has(code)) return studentIndex.byCode.get(code);
  if (email && studentIndex.byEmail.has(email)) return studentIndex.byEmail.get(email);
  if (uid && studentIndex.byUid.has(uid)) return studentIndex.byUid.get(uid);
  if (name && studentIndex.byName.has(normalizeKey(name))) return studentIndex.byName.get(normalizeKey(name));
  return null;
}

function rowStudentCode(row = {}, studentIndex) {
  const directCode = rowRawStudentCode(row);
  if (directCode) return directCode;

  const matchedStudent = findStudentForRow(row, studentIndex);
  const matchedCode = studentCode(matchedStudent || {});
  if (matchedCode) return matchedCode;

  return "";
}

function rowStudentName(row = {}, studentIndex) {
  const directName = rowDirectStudentName(row);
  if (directName && lower(directName) !== "unknown student") return directName;

  const matchedStudent = findStudentForRow(row, studentIndex);
  if (matchedStudent) return studentName(matchedStudent);

  const code = rowStudentCode(row, studentIndex);
  if (code) return `Student ${code.toUpperCase()}`;

  const email = rowStudentEmail(row);
  if (email) return email;

  const uid = rowStudentUid(row);
  if (uid) return `Student ID ${uid}`;

  return "Unknown student (missing code)";
}

function rowStudentHint(row = {}, studentIndex) {
  const code = rowStudentCode(row, studentIndex);
  const email = rowStudentEmail(row);
  const uid = rowStudentUid(row);
  const parts = [];
  if (code) parts.push(`Code ${code.toUpperCase()}`);
  if (email) parts.push(email);
  if (!code && uid) parts.push(`Student ID ${uid}`);
  return parts.length ? `${parts.join(" · ")} · ` : "";
}

function rowSourceLabel(row = {}, fallbackCollection = "") {
  const explicitPath = text(row.path || row.firestorePath || row.refPath || row.documentPath || row.collectionPath);
  if (explicitPath) return explicitPath;

  const id = text(row.id || row.docId || row.documentId || row.dedupeId || row.dedupe_id);
  if (fallbackCollection && id) return `${fallbackCollection}/${id}`;
  if (id) return id;
  return fallbackCollection || "Source path unavailable";
}

function rowAssignment(row = {}) {
  return text(row.assignment || row.assignmentTitle || row.result?.assignment || row.result?.assignmentTitle || row.data?.assignment || row.assignmentId || row.assignment_id || "Marked assignment");
}

function rowAssignmentId(row = {}) {
  return text(row.assignmentId || row.assignment_id || row.assignmentKey || row.result?.assignmentId || row.result?.assignment_id || row.data?.assignmentId || rowAssignment(row));
}

function rowScore(row = {}) {
  return scoreNumber(row.finalScore ?? row.score ?? row.result?.finalScore ?? row.result?.score ?? row.data?.score) ?? 0;
}

function rowLevel(row = {}) {
  return text(row.level || row.result?.level || row.data?.level || inferSubmissionIdentity(row).level).toUpperCase();
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

function loadResolvedIds() {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(RESOLVED_STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveResolvedIds(ids) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(RESOLVED_STORAGE_KEY, JSON.stringify(ids));
}

const buttonStyle = {
  border: "1px solid #d1d5db",
  borderRadius: 999,
  padding: "7px 10px",
  background: "#fff",
  color: "#111827",
  fontSize: 12,
  fontWeight: 800,
  cursor: "pointer",
};

function StatCard({ label, value, helper, tone = "blue" }) {
  return (
    <article style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: 16, background: "#fff", display: "grid", gap: 6 }}>
      <span style={{ color: tone === "red" ? "#991b1b" : tone === "amber" ? "#92400e" : tone === "green" ? "#065f46" : "#1d4ed8", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</span>
      <strong style={{ fontSize: 28, color: "#111827" }}>{value}</strong>
      {helper ? <p style={{ margin: 0, color: "#6b7280", fontSize: 13 }}>{helper}</p> : null}
    </article>
  );
}

function ProblemList({ title, items, emptyText, actionLabel = "Open", onRepair, onResolve, actionState }) {
  return (
    <section style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: 16, background: "#fff", display: "grid", gap: 12 }}>
      <h2 style={{ margin: 0, fontSize: 18 }}>{title}</h2>
      {items.length ? (
        <div style={{ display: "grid", gap: 10 }}>
          {items.slice(0, 12).map((item) => {
            const working = actionState.id === item.id;
            return (
              <div key={item.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, border: "1px solid #f3f4f6", borderRadius: 12, padding: 12, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ display: "grid", gap: 3, minWidth: 220 }}>
                  <strong>{item.title}</strong>
                  <small style={{ color: "#6b7280" }}>{item.detail}</small>
                  {item.sourceInfo ? <small style={{ color: "#4b5563", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", wordBreak: "break-all" }}>Source: {item.sourceInfo}</small> : null}
                  {item.repairHint ? <small style={{ color: "#1d4ed8", fontWeight: 700 }}>{item.repairHint}</small> : null}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  {item.repairAction ? (
                    <button type="button" style={{ ...buttonStyle, background: "#eff6ff", color: "#1d4ed8", borderColor: "#bfdbfe" }} onClick={() => onRepair(item)} disabled={working}>
                      {working ? "Working..." : item.repairAction}
                    </button>
                  ) : null}
                  {item.to ? <Link to={item.to} style={{ ...buttonStyle, textDecoration: "none" }}>{actionLabel}</Link> : null}
                  <button type="button" style={{ ...buttonStyle, background: "#f9fafb" }} onClick={() => onResolve(item)} disabled={working}>
                    Mark resolved
                  </button>
                </div>
              </div>
            );
          })}
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
  const [resolvedIds, setResolvedIds] = useState(() => loadResolvedIds());
  const [actionState, setActionState] = useState({ id: "", message: "", type: "" });

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

  const studentIndex = useMemo(() => buildStudentIndex(state.students), [state.students]);

  const analytics = useMemo(() => {
    const markedToday = state.scores.filter((row) => isToday(row.date || row.createdAt || row.updatedAt)).length;
    const recentScores = state.scores.filter((row) => withinDays(row.date || row.createdAt || row.updatedAt, 7));
    const sheetSaved = state.scores.filter((row) => row.sheetSaved === true || lower(row.sheetMessage).includes("sheet")).length;
    const notificationsSent = state.notifications.filter((row) => lower(row.type).includes("score") || lower(row.type).includes("feedback") || lower(row.data?.type).includes("marked_assignment")).length;
    const failedNotifications = state.markingResults.filter((row) => row.studentNotification?.attempted && row.studentNotification?.success === false);
    const pendingQueue = state.submissions.length;
    const failedMarking = state.markingResults.filter((row) => lower(row.status).includes("failed") || lower(row.status).includes("error"));
    const markedNoNotification = state.markingResults.filter((row) => {
      const score = scoreNumber(row.finalScore ?? row.score ?? row.result?.finalScore ?? row.result?.score);
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

  const handleResolve = (item) => {
    const next = Array.from(new Set([...resolvedIds, item.id]));
    setResolvedIds(next);
    saveResolvedIds(next);
    setActionState({ id: "", type: "success", message: `Resolved: ${item.title}` });
  };

  const handleRepair = async (item) => {
    setActionState({ id: item.id, type: "", message: "" });
    try {
      if (item.kind === "missing_notification") {
        const row = item.row || {};
        const receipt = await createMarkedAssignmentNotification({
          studentCode: rowStudentCode(row, studentIndex),
          studentName: rowStudentName(row, studentIndex),
          assignment: rowAssignment(row),
          assignmentId: rowAssignmentId(row),
          score: rowScore(row),
          level: rowLevel(row),
          dedupeId: row.dedupeId || row.dedupe_id || row.id || item.id,
          source: "quality_check_resend",
        });
        if (!receipt?.success) throw new Error(receipt?.message || "Notification resend failed.");
        setActionState({ id: "", type: "success", message: `Notification resent for ${rowStudentName(row, studentIndex)}.` });
        await refresh();
        return;
      }

      if (item.kind === "sheet_retry") {
        const row = item.row || {};
        await saveScoreRow({
          studentCode: rowStudentCode(row, studentIndex),
          name: rowStudentName(row, studentIndex),
          assignment: rowAssignment(row),
          assignmentId: rowAssignmentId(row),
          score: rowScore(row),
          comments: text(row.comments || row.feedback || row.result?.feedback || row.markingReason || "Score retried from Quality Check."),
          level: rowLevel(row),
          link: text(row.link || row.url || ""),
          source: "quality_check_sheet_retry",
          allowDuplicate: true,
          markingDetails: row.result || row,
        });
        setActionState({ id: "", type: "success", message: `Sheet save retried for ${rowStudentName(row, studentIndex)}.` });
        await refresh();
        return;
      }

      setActionState({ id: "", type: "info", message: "This item has no automatic repair yet. Open it and review manually." });
    } catch (err) {
      setActionState({ id: "", type: "error", message: err?.message || "Repair failed." });
    }
  };

  const rawProblemItems = [
    ...analytics.markedNoNotification.map((row) => ({
      id: `mn-${row.id}`,
      kind: "missing_notification",
      row,
      title: rowStudentName(row, studentIndex),
      detail: `Marked but no student notification · ${displayDate(row.updatedAt || row.createdAt)}`,
      sourceInfo: rowSourceLabel(row, "markingResults"),
      repairAction: "Resend notification",
      repairHint: `${rowStudentHint(row, studentIndex)}Score ${rowScore(row)}/100 · ${rowAssignment(row)}`,
      to: "/marking",
    })),
    ...analytics.savedFirestoreNotSheet.map((row) => ({
      id: `ss-${row.id}`,
      kind: "sheet_retry",
      row,
      title: rowStudentName(row, studentIndex),
      detail: `Saved in Firestore but Sheet problem: ${row.sheetMessage || "not confirmed"}`,
      sourceInfo: rowSourceLabel(row, "scores"),
      repairAction: "Retry Sheet save",
      repairHint: `${rowStudentHint(row, studentIndex)}Score ${rowScore(row)}/100 · ${rowAssignment(row)}`,
      to: "/marking",
    })),
    ...analytics.failedMarking.map((row) => ({
      id: `fm-${row.id}`,
      kind: "manual_review",
      row,
      title: rowStudentName(row, studentIndex),
      detail: row.feedback || row.message || row.status || "Needs review",
      sourceInfo: rowSourceLabel(row, "markingResults"),
      repairHint: `${rowStudentHint(row, studentIndex)}Open Marking and review manually.`,
      to: "/marking",
    })),
    ...analytics.pendingMoreThan24Hours.map((row) => ({
      id: `p24-${row.path || row.id}`,
      kind: "open_submission",
      row,
      title: rowStudentName(row, studentIndex),
      detail: `${row.assignment || "Assignment"} pending more than 24 hours`,
      sourceInfo: rowSourceLabel(row, "submissions"),
      repairHint: `${rowStudentHint(row, studentIndex)}Open submission and mark now.`,
      to: "/marking",
    })),
  ];

  const rawAttendanceItems = [
    ...analytics.lowAttendance.map((row) => ({ id: `low-${studentCode(row.student)}`, kind: "attendance", title: studentName(row.student), detail: `${row.rate}% attendance · ${row.present}/${row.total} classes`, repairHint: "Review student and contact if needed.", to: "/students" })),
    ...analytics.absentThreeTimes.map((row) => ({ id: `streak-${studentCode(row.student)}`, kind: "attendance", title: studentName(row.student), detail: `${row.absentStreak} absences in a row`, repairHint: "Follow up before progress drops.", to: "/students" })),
    ...analytics.notAttendedThisWeek.slice(0, 20).map((row) => ({ id: `week-${studentCode(row.student)}`, kind: "attendance", title: studentName(row.student), detail: "No confirmed attendance this week", repairHint: "Review class attendance or contact student.", to: "/students" })),
  ];

  const problemItems = rawProblemItems.filter((item) => !resolvedIds.includes(item.id));
  const attendanceItems = rawAttendanceItems.filter((item) => !resolvedIds.includes(item.id));

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <section style={{ borderRadius: 20, padding: 22, color: "#fff", background: "linear-gradient(135deg, #111827, #1d4ed8)", display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <p style={{ margin: 0, color: "#bfdbfe", fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase" }}>Admin Quality Check</p>
          <h1 style={{ margin: "6px 0", fontSize: 30 }}>Marking, notifications and attendance health</h1>
          <p style={{ margin: 0, color: "#e0e7ff" }}>Use this page to catch and fix save failures, missing student notifications, old pending work, and attendance risks.</p>
        </div>
        <button type="button" onClick={refresh} disabled={state.loading} style={{ alignSelf: "center", border: 0, borderRadius: 999, padding: "10px 16px", fontWeight: 900, color: "#111827", background: "#dcfce7", cursor: "pointer" }}>
          {state.loading ? "Refreshing..." : "Refresh checks"}
        </button>
      </section>

      {actionState.message ? (
        <section style={{ border: `1px solid ${actionState.type === "error" ? "#fecaca" : "#bbf7d0"}`, background: actionState.type === "error" ? "#fef2f2" : "#f0fdf4", color: actionState.type === "error" ? "#991b1b" : "#065f46", borderRadius: 14, padding: 14, fontWeight: 800 }}>
          {actionState.message}
        </section>
      ) : null}

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
        <ProblemList
          title="Problems to fix"
          items={problemItems}
          emptyText="No marking or notification problems found in the loaded records."
          onRepair={handleRepair}
          onResolve={handleResolve}
          actionState={actionState}
        />
        <ProblemList
          title="Attendance alerts"
          items={attendanceItems}
          emptyText="No low attendance or absence streak alerts found in the loaded records."
          actionLabel="Review"
          onRepair={handleRepair}
          onResolve={handleResolve}
          actionState={actionState}
        />
      </section>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { collection, collectionGroup, getDocs, limit as firestoreLimit, query } from "firebase/firestore";
import { db } from "../firebase.js";

const PASS_MARK = 60;
const READ_LIMIT = 800;

function clean(value, fallback = "") {
  if (typeof value === "string") return value.trim() || fallback;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return fallback;
}

function lower(value) {
  return clean(value).toLowerCase();
}

function normalizeCode(value) {
  return lower(value).replace(/[^a-z0-9]/g, "");
}

function normalizeName(value) {
  return lower(value).replace(/[^a-z0-9]+/g, " ").trim();
}

function normalizeEmail(value) {
  return lower(value).replace(/\s+/g, "");
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function toMillis(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.getTime();
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (typeof value === "object") {
    if (typeof value.toMillis === "function") {
      const millis = value.toMillis();
      return Number.isFinite(millis) ? millis : null;
    }
    if (typeof value.toDate === "function") {
      const date = value.toDate();
      return date instanceof Date && !Number.isNaN(date.getTime()) ? date.getTime() : null;
    }
    const seconds = typeof value.seconds === "number" ? value.seconds : typeof value._seconds === "number" ? value._seconds : null;
    return seconds !== null ? seconds * 1000 : null;
  }
  return null;
}

function recordTime(record = {}) {
  return (
    toMillis(record.lastActivityAt) ??
    toMillis(record.submittedAt) ??
    toMillis(record.markedAt) ??
    toMillis(record.gradedAt) ??
    toMillis(record.checkedInAt) ??
    toMillis(record.checkinAt) ??
    toMillis(record.respondedAt) ??
    toMillis(record.updatedAt) ??
    toMillis(record.updated_at) ??
    toMillis(record.timestamp) ??
    toMillis(record.date) ??
    toMillis(record.createdAt) ??
    toMillis(record.created_at) ??
    toMillis(record.createTime) ??
    toMillis(record.updateTime)
  );
}

function later(current, next) {
  if (!current) return next || null;
  if (!next) return current;
  return next > current ? next : current;
}

function formatDate(value) {
  if (!value) return "No activity yet";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function ageLabel(value) {
  if (!value) return "No activity";
  const minutes = Math.max(0, Math.round((Date.now() - value) / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function numberValue(value, fallback = 0) {
  const numeric = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numeric) ? numeric : fallback;
}

function studentCodeFrom(record = {}) {
  return clean(record.studentCode || record.studentcode || record.student_code || record.code || record.uid || record.studentId || record.student_id || "");
}

function studentNameFrom(record = {}) {
  return clean(record.name || record.studentName || record.fullName || record.displayName || record.customerName || record.email || record.studentEmail || "Student");
}

function studentEmailFrom(record = {}) {
  return clean(record.email || record.studentEmail || record.customerEmail || "");
}

function studentClassFrom(record = {}) {
  return clean(record.className || record.classId || record.level || record.program || record.group || "");
}

function studentKeyFrom(record = {}) {
  const code = normalizeCode(studentCodeFrom(record));
  if (code) return `code:${code}`;
  const email = normalizeEmail(studentEmailFrom(record));
  if (email) return `email:${email}`;
  const name = normalizeName(studentNameFrom(record));
  if (name) return `name:${name}`;
  return `unknown:${Math.random().toString(36).slice(2)}`;
}

function assignmentFrom(record = {}) {
  return clean(record.assignment || record.assignmentTitle || record.assignmentName || record.assignmentId || record.assignment_id || record.assignmentKey || record.canonicalAssignmentKey || record.topic || record.task || "Assignment");
}

function textPreview(value, length = 90) {
  const text = clean(value).replace(/\s+/g, " ");
  if (!text) return "";
  return text.length > length ? `${text.slice(0, length)}…` : text;
}

function submissionText(record = {}) {
  return clean(record.text || record.answer || record.answers || record.content || record.message || record.submissionText || record.writing || record.response || "");
}

function scoreFrom(record = {}) {
  return numberValue(record.score ?? record.finalScore ?? record.final_score ?? record.percent ?? record.percentage ?? record.mark, NaN);
}

function statusFromScore(score) {
  if (!Number.isFinite(score)) return "Scored assignment";
  return score >= PASS_MARK ? "Passed assignment" : "Failed assignment";
}

function activityTone(type, value) {
  if (type === "score") {
    const score = Number(value);
    if (!Number.isFinite(score)) return "#e0e7ff";
    return score >= PASS_MARK ? "#dcfce7" : "#fee2e2";
  }
  if (type === "submission") return "#dbeafe";
  if (type === "attendance") return "#fef3c7";
  if (type === "study_buddy" || type === "falowen_ai") return "#ede9fe";
  return "#f1f5f9";
}

function statusBadge(student) {
  if (!student.lastAt) return { label: "No activity", background: "#f1f5f9", color: "#475569" };
  const days = (Date.now() - student.lastAt) / 86400000;
  if (days <= 2) return { label: "Active", background: "#dcfce7", color: "#166534" };
  if (days <= 10) return { label: "Warm", background: "#fef3c7", color: "#92400e" };
  return { label: "Inactive", background: "#fee2e2", color: "#991b1b" };
}

function buildStudentProfile(record = {}, id = "") {
  const code = studentCodeFrom(record) || id;
  return {
    key: studentKeyFrom({ ...record, studentCode: code }),
    id,
    code,
    name: studentNameFrom(record),
    email: studentEmailFrom(record),
    phone: clean(record.phone || record.whatsapp || record.phoneNumber || record.guardianPhone || ""),
    className: studentClassFrom(record),
    status: clean(record.status || record.paymentStatus || ""),
    lastProfileAt: recordTime(record),
  };
}

function mergeProfile(current, next) {
  if (!current) return next;
  return {
    ...current,
    id: current.id || next.id,
    code: current.code || next.code,
    name: current.name !== "Student" ? current.name : next.name,
    email: current.email || next.email,
    phone: current.phone || next.phone,
    className: current.className || next.className,
    status: current.status || next.status,
    lastProfileAt: later(current.lastProfileAt, next.lastProfileAt),
  };
}

async function safeDocs(label, queryRef) {
  try {
    const snap = await getDocs(queryRef);
    return {
      ok: true,
      label,
      error: null,
      docs: snap.docs.map((docSnap) => ({ id: docSnap.id, path: docSnap.ref.path, createTime: docSnap._document?.createTime, updateTime: docSnap._document?.version, ...docSnap.data() })),
    };
  } catch (error) {
    console.warn(`[student-activity] ${label} unavailable`, error);
    return { ok: false, label, error: error instanceof Error ? error.message : `Could not load ${label}`, docs: [] };
  }
}

function addEvent(map, event) {
  const key = event.studentKey;
  const list = map.get(key) || [];
  list.push(event);
  map.set(key, list);
}

function createSubmissionEvent(record) {
  const assignment = assignmentFrom(record);
  const preview = textPreview(submissionText(record));
  return {
    type: "submission",
    action: "Submitted work",
    description: `${assignment}${preview ? ` · ${preview}` : ""}`,
    at: recordTime(record),
    assignment,
    score: null,
    source: "submissions",
    recordId: clean(record.id || record.path || "submission"),
    studentKey: studentKeyFrom(record),
    studentName: studentNameFrom(record),
    className: studentClassFrom(record),
  };
}

function createScoreEvent(record) {
  const score = scoreFrom(record);
  const assignment = assignmentFrom(record);
  return {
    type: "score",
    action: statusFromScore(score),
    description: `${assignment}${Number.isFinite(score) ? ` · ${Math.round(score)}%` : ""}${clean(record.comments || record.feedback) ? ` · ${textPreview(record.comments || record.feedback, 70)}` : ""}`,
    at: recordTime(record),
    assignment,
    score: Number.isFinite(score) ? score : null,
    source: "scores",
    recordId: clean(record.id || record.path || "score"),
    studentKey: studentKeyFrom(record),
    studentName: studentNameFrom(record),
    className: studentClassFrom(record),
  };
}

function createCheckinEvent(record) {
  const className = clean(record.classId || record.className || record.class || "Class");
  const session = clean(record.sessionId || record.sessionLabel || record.date || "session");
  return {
    type: "attendance",
    action: "Checked in for class",
    description: `${className} · ${session}`,
    at: recordTime(record),
    assignment: clean(record.assignmentId || record.assignment_id || ""),
    score: null,
    source: "attendance check-ins",
    recordId: clean(record.id || record.path || "checkin"),
    studentKey: studentKeyFrom(record),
    studentName: studentNameFrom(record),
    className,
  };
}

function createAttendanceEvent(record, studentCode, entry = {}) {
  const present = Boolean(entry.present ?? entry.checkedIn ?? entry.attended);
  const className = clean(record.classId || record.className || record.class || "Class");
  const session = clean(record.sessionLabel || record.title || record.date || record.id || "session");
  const studentRecord = {
    studentCode,
    studentName: entry.name || entry.studentName || entry.fullName || studentCode,
    className,
  };
  return {
    type: "attendance",
    action: present ? "Marked present" : "Marked absent",
    description: `${className} · ${session}`,
    at: recordTime(record),
    assignment: clean(record.assignmentId || record.assignment_id || ""),
    score: null,
    source: "attendance sessions",
    recordId: clean(record.id || record.path || "attendance"),
    studentKey: studentKeyFrom(studentRecord),
    studentName: studentNameFrom(studentRecord),
    className,
  };
}

function createAppActivityEvent(record) {
  const metadata = asObject(record.metadata);
  const event = clean(record.event || record.eventType || "activity");
  const feature = clean(record.feature || metadata.feature || "student_app");
  const action = clean(record.action || record.label || "Used Falowen");
  const shortcut = clean(metadata.shortcutLabel || record.shortcutLabel || metadata.shortcutKey || record.shortcutKey || "");
  const itemId = clean(metadata.itemId || record.itemId || "");
  const destination = clean(metadata.destination || record.destination || "");
  const questionLength = numberValue(metadata.questionLength ?? record.questionLength, NaN);
  const completed = typeof metadata.completed === "boolean" ? metadata.completed : typeof record.completed === "boolean" ? record.completed : null;
  const details = [
    shortcut,
    itemId ? `Task: ${itemId}` : "",
    destination ? `Opened ${destination}` : "",
    Number.isFinite(questionLength) ? `Question length: ${questionLength}` : "",
    completed !== null ? (completed ? "Completed" : "Unchecked") : "",
  ].filter(Boolean).join(" · ");

  return {
    type: feature === "study_buddy" ? "study_buddy" : "falowen_ai",
    action,
    description: details || event.replace(/_/g, " "),
    at: recordTime(record),
    assignment: itemId,
    score: null,
    source: feature === "study_buddy" ? "Study Buddy" : "Falowen app activity",
    recordId: clean(record.id || record.path || event),
    studentKey: studentKeyFrom(record),
    studentName: studentNameFrom(record),
    className: studentClassFrom(record),
  };
}

function createStudyBuddyLegacyEvent(record) {
  const event = clean(record.event || "study_buddy");
  const shortcut = clean(record.shortcutLabel || record.shortcutKey || "");
  const itemId = clean(record.itemId || "");
  const questionLength = numberValue(record.questionLength, NaN);
  const completed = typeof record.completed === "boolean" ? record.completed : null;
  const actionMap = {
    quick_question: "Asked Study Buddy AI",
    quick_question_reply: "Received Study Buddy reply",
    weekly_plan_toggle: "Updated weekly plan task",
    shortcut_click: "Clicked Study Buddy shortcut",
    reopen: "Reopened Study Buddy",
    expand: "Expanded Study Buddy",
    collapse: "Collapsed Study Buddy",
    dismiss: "Dismissed Study Buddy",
  };
  const action = actionMap[event] || event.replace(/_/g, " ");
  const description = [
    shortcut,
    itemId ? `Task: ${itemId}` : "",
    Number.isFinite(questionLength) ? `Question length: ${questionLength}` : "",
    completed !== null ? (completed ? "Completed" : "Unchecked") : "",
  ].filter(Boolean).join(" · ") || "Study Buddy interaction";

  return {
    type: "study_buddy",
    action,
    description,
    at: recordTime(record),
    assignment: itemId,
    score: null,
    source: "Study Buddy",
    recordId: clean(record.id || record.path || event),
    studentKey: studentKeyFrom(record),
    studentName: studentNameFrom(record),
    className: studentClassFrom(record),
  };
}

function createGrammarAiEvent(record) {
  const question = textPreview(record.question || record.cleanedPrompt || record.normalizedQuestion, 70);
  const level = clean(record.level || "");
  return {
    type: "falowen_ai",
    action: "Asked Falowen AI grammar",
    description: `${level ? `${level} · ` : ""}${question || "Grammar question"}`,
    at: recordTime(record),
    assignment: level,
    score: null,
    source: "Falowen AI grammar",
    recordId: clean(record.id || record.path || "grammar"),
    studentKey: studentKeyFrom({ ...record, studentCode: record.studentId || record.studentCode, studentEmail: record.studentEmail }),
    studentName: studentNameFrom(record),
    className: studentClassFrom(record),
  };
}

function eventsFromAttendanceSession(record = {}) {
  const events = [];
  if (record.students && typeof record.students === "object" && !Array.isArray(record.students)) {
    for (const [studentCode, entry] of Object.entries(record.students)) {
      events.push(createAttendanceEvent(record, studentCode, entry || {}));
    }
  }
  if (Array.isArray(record.records)) {
    record.records.forEach((entry) => {
      const code = clean(entry?.studentCode || entry?.studentId || entry?.code || "");
      if (code) events.push(createAttendanceEvent(record, code, { ...entry, present: lower(entry?.status) === "present" || entry?.present === true }));
    });
  }
  return events;
}

function studentMatchesQuery(student, queryText) {
  if (!queryText) return true;
  const haystack = [
    student.name,
    student.code,
    student.email,
    student.phone,
    student.className,
    student.status,
    ...student.events.flatMap((event) => [event.action, event.description, event.assignment, event.source]),
  ].join(" ").toLowerCase();
  return haystack.includes(queryText.toLowerCase());
}

function buildStudents({ profiles, eventsByStudent }) {
  const allKeys = new Set([...profiles.keys(), ...eventsByStudent.keys()]);
  return [...allKeys].map((key) => {
    const profile = profiles.get(key) || {
      key,
      id: key,
      code: key.replace(/^(code|email|name):/, ""),
      name: "Student",
      email: "",
      phone: "",
      className: "",
      status: "",
      lastProfileAt: null,
    };
    const events = [...(eventsByStudent.get(key) || [])].sort((a, b) => (b.at || 0) - (a.at || 0));
    const lastAt = events.map((event) => event.at).reduce(later, profile.lastProfileAt);
    const scores = events.filter((event) => event.type === "score" && Number.isFinite(Number(event.score)));
    const averageScore = scores.length ? Math.round(scores.reduce((sum, event) => sum + Number(event.score), 0) / scores.length) : null;
    const failedScores = scores.filter((event) => Number(event.score) < PASS_MARK).length;
    return {
      ...profile,
      events,
      lastAt,
      submissions: events.filter((event) => event.type === "submission").length,
      scores: scores.length,
      failedScores,
      attendance: events.filter((event) => event.type === "attendance").length,
      aiActions: events.filter((event) => event.type === "study_buddy" || event.type === "falowen_ai").length,
      averageScore,
    };
  }).sort((a, b) => (b.lastAt || 0) - (a.lastAt || 0));
}

export default function StudentActivityPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [students, setStudents] = useState([]);
  const [sourceErrors, setSourceErrors] = useState([]);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadActivity() {
      setLoading(true);
      setError("");
      try {
        const [studentDocs, scoreDocs, flatSubmissionDocs, nestedSubmissionDocs, postDocs, checkinDocs, attendanceDocs, appActivityDocs, studyBuddyDocs, grammarAiDocs] = await Promise.all([
          safeDocs("students", query(collection(db, "students"), firestoreLimit(READ_LIMIT))),
          safeDocs("scores", query(collection(db, "scores"), firestoreLimit(READ_LIMIT))),
          safeDocs("flat submissions", query(collection(db, "submissions"), firestoreLimit(READ_LIMIT))),
          safeDocs("nested submissions", query(collectionGroup(db, "submissions"), firestoreLimit(READ_LIMIT))),
          safeDocs("submission posts", query(collectionGroup(db, "posts"), firestoreLimit(READ_LIMIT))),
          safeDocs("attendance check-ins", query(collectionGroup(db, "checkins"), firestoreLimit(READ_LIMIT))),
          safeDocs("attendance sessions", query(collectionGroup(db, "sessions"), firestoreLimit(READ_LIMIT))),
          safeDocs("student app activity", query(collection(db, "studentActivityEvents"), firestoreLimit(READ_LIMIT))),
          safeDocs("Study Buddy usage", query(collection(db, "studyBuddyUsage"), firestoreLimit(READ_LIMIT))),
          safeDocs("Falowen AI grammar", query(collectionGroup(db, "grammar_answers"), firestoreLimit(READ_LIMIT))),
        ]);

        if (cancelled) return;

        const profiles = new Map();
        studentDocs.docs.forEach((record) => {
          const profile = buildStudentProfile(record, record.id);
          profiles.set(profile.key, mergeProfile(profiles.get(profile.key), profile));
        });

        const eventsByStudent = new Map();
        const seenEventKeys = new Set();
        const addUniqueEvent = (event) => {
          const uniqueKey = `${event.source}:${event.recordId}:${event.studentKey}:${event.action}`;
          if (seenEventKeys.has(uniqueKey)) return;
          seenEventKeys.add(uniqueKey);
          addEvent(eventsByStudent, event);
        };

        [...flatSubmissionDocs.docs, ...nestedSubmissionDocs.docs, ...postDocs.docs].forEach((record) => {
          addUniqueEvent(createSubmissionEvent(record));
        });
        scoreDocs.docs.forEach((record) => addUniqueEvent(createScoreEvent(record)));
        checkinDocs.docs.forEach((record) => addUniqueEvent(createCheckinEvent(record)));
        attendanceDocs.docs.forEach((record) => eventsFromAttendanceSession(record).forEach(addUniqueEvent));
        appActivityDocs.docs.forEach((record) => addUniqueEvent(createAppActivityEvent(record)));
        studyBuddyDocs.docs.forEach((record) => addUniqueEvent(createStudyBuddyLegacyEvent(record)));
        grammarAiDocs.docs.forEach((record) => addUniqueEvent(createGrammarAiEvent(record)));

        setStudents(buildStudents({ profiles, eventsByStudent }));
        setSourceErrors([studentDocs, scoreDocs, flatSubmissionDocs, nestedSubmissionDocs, postDocs, checkinDocs, attendanceDocs, appActivityDocs, studyBuddyDocs, grammarAiDocs].filter((result) => !result.ok));
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Could not load student activity.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadActivity();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredStudents = useMemo(() => {
    const queryText = searchText.trim();
    return students.filter((student) => studentMatchesQuery(student, queryText));
  }, [students, searchText]);

  const allEvents = useMemo(() => {
    return students
      .flatMap((student) => student.events.map((event) => ({ ...event, studentName: student.name, studentCode: student.code, className: event.className || student.className })))
      .sort((a, b) => (b.at || 0) - (a.at || 0));
  }, [students]);

  const stats = useMemo(() => {
    const activeStudents = students.filter((student) => student.lastAt && Date.now() - student.lastAt <= 10 * 86400000).length;
    return {
      students: students.length,
      activeStudents,
      submissions: students.reduce((sum, student) => sum + student.submissions, 0),
      failedScores: students.reduce((sum, student) => sum + student.failedScores, 0),
      aiActions: students.reduce((sum, student) => sum + student.aiActions, 0),
    };
  }, [students]);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <section style={{ border: "1px solid #dbe1ef", borderRadius: 18, padding: 18, background: "linear-gradient(135deg, #0f172a, #1d4ed8)", color: "white" }}>
        <p style={{ margin: 0, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.8, opacity: 0.8 }}>Falowen admin monitoring</p>
        <h1 style={{ margin: "8px 0 6px", fontSize: 32 }}>Student Activity</h1>
        <p style={{ margin: 0, maxWidth: 760, lineHeight: 1.7, color: "#dbeafe" }}>
          See what students are doing: Study Buddy, Falowen AI, submissions, scores, attendance, check-ins, failed tasks, and recent activity per student.
        </p>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        <StatCard label="Students tracked" value={stats.students} hint="From students + activity records" />
        <StatCard label="Active students" value={stats.activeStudents} hint="Activity in last 10 days" />
        <StatCard label="AI / Study Buddy" value={stats.aiActions} hint="Study Buddy + Falowen AI actions" />
        <StatCard label="Submissions" value={stats.submissions} hint="Work submitted" />
        <StatCard label="Failed scores" value={stats.failedScores} hint={`Below ${PASS_MARK}%`} />
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.7fr) minmax(280px, 0.85fr)", gap: 16 }} className="student-activity-grid">
        <div style={{ border: "1px solid #dbe1ef", borderRadius: 18, background: "#fff", overflow: "hidden" }}>
          <div style={{ padding: 16, borderBottom: "1px solid #e5e7eb", display: "flex", gap: 12, justifyContent: "space-between", flexWrap: "wrap", alignItems: "center" }}>
            <div>
              <h2 style={{ margin: 0 }}>What students did</h2>
              <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>Recent actions per student, reconstructed from existing Firestore records and new app activity logs.</p>
            </div>
            <input
              type="search"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search name, AI, Study Buddy, class, score, submission…"
              style={{ minWidth: 280, border: "1px solid #cbd5e1", borderRadius: 999, padding: "10px 14px" }}
            />
          </div>

          {loading ? <p style={{ margin: 16, color: "#64748b" }}>Loading student activity…</p> : null}
          {error ? <p style={{ margin: 16, color: "#b91c1c", fontWeight: 700 }}>{error}</p> : null}
          {!loading && !error && filteredStudents.length === 0 ? <p style={{ margin: 16, color: "#64748b" }}>No student activity found.</p> : null}

          {!loading && !error && filteredStudents.length > 0 ? (
            <div style={{ display: "grid" }}>
              {filteredStudents.slice(0, 150).map((student) => {
                const badge = statusBadge(student);
                return (
                  <article key={student.key} style={{ display: "grid", gridTemplateColumns: "1.15fr 0.65fr 1.45fr 0.7fr", gap: 12, padding: 16, borderTop: "1px solid #eef2f7", alignItems: "start" }} className="student-activity-row">
                    <div style={{ minWidth: 0 }}>
                      <strong style={{ color: "#0f172a" }}>{student.name}</strong>
                      <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13 }}>{student.code || "No code"} · {student.className || "No class"}</p>
                      <p style={{ margin: "4px 0 0", color: "#94a3b8", fontSize: 12 }}>{student.email || student.phone || student.status || "No contact"}</p>
                    </div>
                    <div>
                      <span style={{ display: "inline-flex", padding: "4px 9px", borderRadius: 999, fontSize: 12, fontWeight: 800, background: badge.background, color: badge.color }}>{badge.label}</span>
                      <p style={{ margin: "8px 0 0", color: "#64748b", fontSize: 12 }}>{ageLabel(student.lastAt)}</p>
                      <p style={{ margin: "2px 0 0", color: "#94a3b8", fontSize: 11 }}>{formatDate(student.lastAt)}</p>
                    </div>
                    <div style={{ display: "grid", gap: 8 }}>
                      {student.events.length === 0 ? <span style={{ color: "#94a3b8", fontSize: 13 }}>No actions yet</span> : null}
                      {student.events.slice(0, 4).map((event, index) => (
                        <div key={`${event.recordId}-${index}`} style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: 10, background: activityTone(event.type, event.score) }}>
                          <div style={{ display: "flex", gap: 8, justifyContent: "space-between", alignItems: "start" }}>
                            <strong style={{ color: "#0f172a", fontSize: 13 }}>{event.action}</strong>
                            <span style={{ color: "#475569", fontSize: 11, whiteSpace: "nowrap" }}>{ageLabel(event.at)}</span>
                          </div>
                          <p style={{ margin: "4px 0 0", color: "#334155", fontSize: 12, lineHeight: 1.5 }}>{event.description}</p>
                          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 11 }}>{event.source}</p>
                        </div>
                      ))}
                      {student.events.length > 4 ? <p style={{ margin: 0, color: "#64748b", fontSize: 12 }}>+{student.events.length - 4} more actions</p> : null}
                    </div>
                    <div style={{ color: "#334155", fontSize: 13 }}>
                      <p style={{ margin: 0 }}><strong>{student.aiActions}</strong> AI actions</p>
                      <p style={{ margin: "6px 0 0" }}><strong>{student.submissions}</strong> submissions</p>
                      <p style={{ margin: "6px 0 0" }}><strong>{student.scores}</strong> scores</p>
                      <p style={{ margin: "6px 0 0" }}><strong>{student.attendance}</strong> attendance</p>
                      <p style={{ margin: "6px 0 0", color: student.failedScores ? "#b91c1c" : "#166534" }}><strong>{student.failedScores}</strong> failed</p>
                      <p style={{ margin: "6px 0 0", color: "#64748b" }}>Avg: {student.averageScore === null ? "—" : `${student.averageScore}%`}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : null}
        </div>

        <aside style={{ display: "grid", gap: 16, alignContent: "start" }}>
          <section style={{ border: "1px solid #dbe1ef", borderRadius: 18, background: "#fff", padding: 16 }}>
            <h3 style={{ margin: 0 }}>Recent actions</h3>
            <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
              {allEvents.length === 0 && !loading ? <p style={{ margin: 0, color: "#64748b", fontSize: 14 }}>No recent actions found.</p> : null}
              {allEvents.slice(0, 14).map((event, index) => (
                <div key={`${event.studentKey}-${event.recordId}-${index}`} style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: 10, background: "#f8fafc" }}>
                  <strong style={{ color: "#0f172a", fontSize: 13 }}>{event.studentName || "Student"}</strong>
                  <p style={{ margin: "3px 0 0", color: "#334155", fontSize: 12 }}>{event.action}</p>
                  <p style={{ margin: "3px 0 0", color: "#64748b", fontSize: 12, lineHeight: 1.5 }}>{event.description}</p>
                  <p style={{ margin: "5px 0 0", color: "#94a3b8", fontSize: 11 }}>{ageLabel(event.at)} · {event.source}</p>
                </div>
              ))}
            </div>
          </section>

          <section style={{ border: "1px solid #dbe1ef", borderRadius: 18, background: "#fff", padding: 16 }}>
            <h3 style={{ margin: 0 }}>What is tracked</h3>
            <div style={{ display: "grid", gap: 8, marginTop: 12, color: "#475569", fontSize: 13, lineHeight: 1.5 }}>
              <p style={{ margin: 0 }}>Study Buddy opens, shortcut clicks, AI questions, weekly plan toggles, dismiss/reopen, and contrast changes.</p>
              <p style={{ margin: 0 }}>Falowen AI grammar questions from <strong>grammar_answers</strong>.</p>
              <p style={{ margin: 0 }}>Submissions from <strong>submissions</strong> and nested submission records.</p>
              <p style={{ margin: 0 }}>Scores from <strong>scores</strong>, including pass/fail signals.</p>
              <p style={{ margin: 0 }}>Attendance from <strong>attendance sessions</strong> and QR <strong>checkins</strong>.</p>
            </div>
          </section>

          {sourceErrors.length > 0 ? (
            <section style={{ border: "1px solid #f59e0b", borderRadius: 18, background: "#fffbeb", padding: 16 }}>
              <h3 style={{ margin: 0, color: "#92400e" }}>Some activity sources could not load</h3>
              <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                {sourceErrors.map((source) => (
                  <p key={source.label} style={{ margin: 0, color: "#92400e", fontSize: 12 }}><strong>{source.label}</strong>: {source.error}</p>
                ))}
              </div>
            </section>
          ) : null}
        </aside>
      </section>

      <style>{`
        @media (max-width: 900px) {
          .student-activity-grid { grid-template-columns: 1fr !important; }
          .student-activity-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function StatCard({ label, value, hint }) {
  return (
    <div style={{ border: "1px solid #dbe1ef", borderRadius: 16, padding: 16, background: "#fff" }}>
      <p style={{ margin: 0, color: "#64748b", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.6 }}>{label}</p>
      <p style={{ margin: "8px 0 2px", color: "#0f172a", fontSize: 28, fontWeight: 900 }}>{value}</p>
      <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>{hint}</p>
    </div>
  );
}

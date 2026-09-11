import { useCallback, useEffect, useMemo, useState } from "react";
import { listClasses } from "../services/classesService.js";
import { loadAttendanceFromFirestore, listSessionCheckins } from "../services/attendanceService.js";
import { listStudentsByClass } from "../services/studentsService.js";
import { fetchSubmissions } from "../services/markingServiceBase.js";
import { listCommunicationHistory, saveAnnouncementBatch } from "../services/communicationService.js";
import { useToast } from "../context/ToastContext.jsx";
import {
  assignmentIdsOf,
  filterStudentsByAttendance,
  filterStudentsNotCheckedIn,
  filterUnpaidStudents,
  studentCodeOf,
  studentLevelOf,
  submissionMatchesAssignments,
  uniqueStudents,
} from "../utils/communicationAudience.js";

const fieldStyle = { display: "grid", gap: 6 };
const inputStyle = { padding: 10, borderRadius: 8, border: "1px solid #d0d7de", width: "100%", boxSizing: "border-box" };
const sessionRequiredFilters = new Set(["present", "absent", "not_checked_in", "not_submitted"]);

const FILTERS = [
  ["all", "All enrolled students"],
  ["present", "Present in selected class"],
  ["absent", "Absent from selected class"],
  ["not_checked_in", "Not checked in"],
  ["not_submitted", "Did not submit the assignment"],
  ["unpaid", "Unpaid / outstanding balance"],
];

const TEMPLATES = [
  {
    label: "Class reminder",
    topic: "Class Reminder",
    announcement: "Hello, this is a reminder about your class. Please check the class details and join on time.",
  },
  {
    label: "Missed class follow-up",
    topic: "Missed Class Follow-up",
    announcement: "Hello, we noticed that you missed the selected class. Please review the lesson and complete the required work before the next class.",
  },
  {
    label: "Check-in reminder",
    topic: "Class Check-in Reminder",
    announcement: "Hello, your check-in has not been recorded for the selected class. Please use the class check-in link if the window is still open.",
  },
  {
    label: "Assignment reminder",
    topic: "Assignment Reminder",
    announcement: "Hello, the assignment linked to the selected class has not been submitted yet. Please complete it as soon as possible.",
  },
  {
    label: "Payment reminder",
    topic: "Payment Reminder",
    announcement: "Hello, our records show an outstanding course balance. Please complete your payment or contact LLEA if you need help.",
  },
];

function clean(value) {
  return String(value || "").trim();
}

function classNameOf(klass = {}) {
  return clean(klass.name || klass.className || klass.classId || klass.id);
}

function classIdOf(klass = {}) {
  return clean(klass.id || klass.classId || klass.classRecordId || classNameOf(klass));
}

function isAvailableClass(klass = {}) {
  if (klass.archived === true || klass.active === false) return false;
  const status = clean(klass.status || klass.state).toLowerCase();
  return !["archived", "inactive", "deleted", "cancelled", "canceled"].includes(status);
}

function sessionDate(session = {}) {
  return clean(session.date || session.startsAt).slice(0, 10);
}

function sessionLabel(session = {}) {
  const date = sessionDate(session);
  const title = clean(session.title || session.sessionLabel || session.lesson || session.id) || "Class session";
  const time = clean(session.startTime);
  return [date, time, title].filter(Boolean).join(" · ");
}

function createdAtDate(value) {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  if (typeof value?.toMillis === "function") return new Date(value.toMillis());
  if (typeof value === "object" && Number.isFinite(value.seconds)) return new Date(Number(value.seconds) * 1000);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatHistoryTime(value) {
  const date = createdAtDate(value);
  if (!date) return "—";
  return date.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

async function loadClassAttendance(klass) {
  const identifiers = [...new Set([
    classIdOf(klass),
    clean(klass.classId),
    classNameOf(klass),
  ].filter(Boolean))];
  const results = await Promise.allSettled(identifiers.map(async (identifier) => ({
    identifier,
    rows: await loadAttendanceFromFirestore(identifier),
  })));
  const sessions = new Map();
  results.forEach((result) => {
    if (result.status !== "fulfilled") return;
    Object.entries(result.value.rows || {}).forEach(([id, row]) => {
      if (!sessions.has(id)) sessions.set(id, { id, ...row, _attendanceClassId: result.value.identifier });
    });
  });
  return [...sessions.values()].sort((left, right) => {
    const byDate = sessionDate(right).localeCompare(sessionDate(left));
    if (byDate !== 0) return byDate;
    return clean(right.startTime).localeCompare(clean(left.startTime));
  });
}

export default function TargetedCommunicationPanel() {
  const { success: showSuccess, error: showError, info: showInfo } = useToast();
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState("");
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState("");
  const [recipientFilter, setRecipientFilter] = useState("all");
  const [topic, setTopic] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [link, setLink] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [resolvedRecipients, setResolvedRecipients] = useState([]);
  const [resolutionNote, setResolutionNote] = useState("");
  const [loadingClass, setLoadingClass] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const selectedClass = useMemo(() => classes.find((klass) => classIdOf(klass) === classId) || null, [classes, classId]);
  const selectedSession = useMemo(() => sessions.find((session) => session.id === sessionId) || null, [sessions, sessionId]);
  const needsSession = sessionRequiredFilters.has(recipientFilter);

  const refreshHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      setHistory(await listCommunicationHistory({ limit: 30 }));
    } catch (error) {
      console.warn("Could not load communication history", error);
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const rows = await listClasses();
        setClasses(rows.filter(isAvailableClass));
      } catch {
        setClasses([]);
      }
    })();
    refreshHistory();
  }, [refreshHistory]);

  useEffect(() => {
    let cancelled = false;

    setResolvedRecipients([]);
    setResolutionNote("");
    setSessionId("");
    setStudents([]);
    setSessions([]);

    if (!selectedClass) {
      setLoadingClass(false);
      return () => {
        cancelled = true;
      };
    }

    const requestedClassId = classIdOf(selectedClass);
    const requestedClassName = classNameOf(selectedClass);
    setLoadingClass(true);

    (async () => {
      try {
        const [studentRows, sessionRows] = await Promise.all([
          listStudentsByClass(requestedClassId, { className: requestedClassName }),
          loadClassAttendance(selectedClass),
        ]);
        if (cancelled) return;
        setStudents(uniqueStudents(studentRows));
        setSessions(sessionRows);
      } catch (error) {
        if (cancelled) return;
        showError(error?.message || "Could not load the selected class.");
      } finally {
        if (!cancelled) setLoadingClass(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedClass, showError]);

  useEffect(() => {
    setResolvedRecipients([]);
    setResolutionNote("");
  }, [recipientFilter, sessionId]);

  function selectSession(value) {
    setSessionId(value);
    const selected = sessions.find((session) => session.id === value);
    if (selected && sessionDate(selected)) setDate(sessionDate(selected));
  }

  async function previewRecipients() {
    if (!selectedClass) {
      showError("Select a class first.");
      return;
    }
    if (needsSession && !selectedSession) {
      showError("Select the exact class session for this audience.");
      return;
    }

    setResolving(true);
    setResolutionNote("");
    try {
      let recipients = uniqueStudents(students);
      let note = "";

      if (recipientFilter === "present" || recipientFilter === "absent") {
        recipients = filterStudentsByAttendance(students, selectedSession, recipientFilter);
      } else if (recipientFilter === "not_checked_in") {
        const checkins = await listSessionCheckins({
          classId: selectedSession._attendanceClassId || classIdOf(selectedClass),
          sessionId: selectedSession.id,
        });
        recipients = filterStudentsNotCheckedIn(students, checkins);
      } else if (recipientFilter === "unpaid") {
        recipients = filterUnpaidStudents(students);
      } else if (recipientFilter === "not_submitted") {
        const assignmentIds = assignmentIdsOf(selectedSession);
        if (!assignmentIds.length) throw new Error("This class session has no assignment ID, so Falowen cannot safely identify non-submitters.");

        const checks = await Promise.all(students.map(async (student) => {
          const studentCode = studentCodeOf(student);
          const level = studentLevelOf(student, classNameOf(selectedClass));
          if (!studentCode) return { student, verified: false, submitted: false };
          try {
            const submissions = await fetchSubmissions(level, studentCode);
            return {
              student,
              verified: true,
              submitted: submissions.some((submission) => submissionMatchesAssignments(submission, assignmentIds)),
            };
          } catch {
            return { student, verified: false, submitted: false };
          }
        }));
        recipients = checks.filter((entry) => entry.verified && !entry.submitted).map((entry) => entry.student);
        const unverified = checks.filter((entry) => !entry.verified).length;
        if (unverified) note = `${unverified} student${unverified === 1 ? "" : "s"} could not be verified and were excluded.`;
      }

      const withEmail = recipients.filter((student) => clean(student.email || student.contactEmail));
      const missingEmail = recipients.length - withEmail.length;
      if (missingEmail) {
        note = [note, `${missingEmail} matching student${missingEmail === 1 ? "" : "s"} had no email and were excluded.`].filter(Boolean).join(" ");
      }
      setResolvedRecipients(withEmail);
      setResolutionNote(note);
      if (!withEmail.length) showInfo("No students with email addresses match this audience.");
    } catch (error) {
      setResolvedRecipients([]);
      showError(error?.message || "Could not resolve the selected audience.");
    } finally {
      setResolving(false);
    }
  }

  async function sendTargetedMessage(event) {
    event.preventDefault();
    if (!selectedClass || !resolvedRecipients.length || !announcement.trim()) return;
    setSending(true);
    try {
      const result = await saveAnnouncementBatch({
        input: {
          announcement,
          topic,
          className: classNameOf(selectedClass),
          classId: classIdOf(selectedClass),
          date,
          link,
        },
        recipients: resolvedRecipients,
        recipientFilter,
        session: selectedSession,
      });
      if (result.failureCount) {
        showInfo(`Sent to ${result.successCount} students; ${result.failureCount} deliveries failed.`);
      } else {
        showSuccess(`Message sent to ${result.successCount} students.`);
      }
      setResolvedRecipients([]);
      await refreshHistory();
    } catch (error) {
      showError(error?.message || "Targeted message failed.");
      await refreshHistory();
    } finally {
      setSending(false);
    }
  }

  return (
    <section style={{ padding: "0 16px 16px", maxWidth: 1000, display: "grid", gap: 16 }}>
      <div style={{ border: "1px solid #dbe3ef", borderRadius: 12, padding: 16, display: "grid", gap: 14 }}>
        <div>
          <h3 style={{ margin: "0 0 4px" }}>Targeted class follow-up</h3>
          <p style={{ margin: 0, color: "#64748b" }}>
            Send only to the students who match a class condition. Preview the recipients before anything is sent.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {TEMPLATES.map((template) => (
            <button key={template.label} type="button" onClick={() => {
              setTopic(template.topic);
              setAnnouncement(template.announcement);
            }}>
              {template.label}
            </button>
          ))}
        </div>

        <form onSubmit={sendTargetedMessage} style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            <label style={fieldStyle}>
              <span>Class *</span>
              <select
                style={inputStyle}
                value={classId}
                onChange={(event) => setClassId(event.target.value)}
                disabled={resolving || sending}
              >
                <option value="">Select class</option>
                {classes.map((klass) => (
                  <option key={classIdOf(klass)} value={classIdOf(klass)}>{classNameOf(klass)}</option>
                ))}
              </select>
            </label>

            <label style={fieldStyle}>
              <span>Recipients *</span>
              <select style={inputStyle} value={recipientFilter} onChange={(event) => setRecipientFilter(event.target.value)} disabled={!selectedClass || loadingClass}>
                {FILTERS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>

            <label style={fieldStyle}>
              <span>Class session {needsSession ? "*" : "(optional)"}</span>
              <select style={inputStyle} value={sessionId} onChange={(event) => selectSession(event.target.value)} disabled={!selectedClass || loadingClass}>
                <option value="">Select session</option>
                {sessions.map((session) => <option key={session.id} value={session.id}>{sessionLabel(session)}</option>)}
              </select>
            </label>

            <label style={fieldStyle}>
              <span>Date *</span>
              <input type="date" style={inputStyle} value={date} onChange={(event) => setDate(event.target.value)} required />
            </label>

            <label style={fieldStyle}>
              <span>Topic</span>
              <input style={inputStyle} value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="Topic" />
            </label>

            <label style={fieldStyle}>
              <span>Link</span>
              <input style={inputStyle} value={link} onChange={(event) => setLink(event.target.value)} placeholder="Optional class, check-in or assignment link" />
            </label>
          </div>

          <label style={fieldStyle}>
            <span>Message *</span>
            <textarea style={{ ...inputStyle, minHeight: 90 }} value={announcement} onChange={(event) => setAnnouncement(event.target.value)} placeholder="Message to students" required />
          </label>

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button type="button" onClick={previewRecipients} disabled={!selectedClass || resolving || loadingClass}>
              {resolving ? "Checking recipients..." : "Preview recipients"}
            </button>
            <strong>{resolvedRecipients.length} recipient{resolvedRecipients.length === 1 ? "" : "s"}</strong>
            {resolutionNote ? <span style={{ color: "#92400e", fontSize: 13 }}>{resolutionNote}</span> : null}
          </div>

          {resolvedRecipients.length ? (
            <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 10, background: "#f8fafc", fontSize: 13 }}>
              {resolvedRecipients.slice(0, 12).map((student) => clean(student.name || student.email)).join(", ")}
              {resolvedRecipients.length > 12 ? ` + ${resolvedRecipients.length - 12} more` : ""}
            </div>
          ) : null}

          <div>
            <button type="submit" disabled={!resolvedRecipients.length || !announcement.trim() || sending}>
              {sending ? "Sending..." : `Send to ${resolvedRecipients.length || 0} students`}
            </button>
          </div>
        </form>
      </div>

      <div style={{ border: "1px solid #dbe3ef", borderRadius: 12, padding: 16, display: "grid", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <h3 style={{ margin: "0 0 4px" }}>Communication history</h3>
            <p style={{ margin: 0, color: "#64748b" }}>Recent broadcasts, targeted sends and delivery status.</p>
          </div>
          <button type="button" onClick={refreshHistory} disabled={historyLoading}>{historyLoading ? "Refreshing..." : "Refresh"}</button>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: 8 }}>Sent</th>
                <th style={{ padding: 8 }}>Class / session</th>
                <th style={{ padding: 8 }}>Audience</th>
                <th style={{ padding: 8 }}>Topic</th>
                <th style={{ padding: 8 }}>Recipients</th>
                <th style={{ padding: 8 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry) => (
                <tr key={entry.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: 8, whiteSpace: "nowrap" }}>{formatHistoryTime(entry.createdAt)}</td>
                  <td style={{ padding: 8 }}>
                    <strong>{entry.class || "—"}</strong>
                    {entry.sessionLabel ? <div style={{ color: "#64748b", fontSize: 12 }}>{entry.sessionLabel}</div> : null}
                  </td>
                  <td style={{ padding: 8 }}>{entry.recipientFilter || entry.audienceMode || (entry.email ? "Individual" : "Class")}</td>
                  <td style={{ padding: 8 }}>{entry.topic || "—"}</td>
                  <td style={{ padding: 8 }}>{Number(entry.recipientCount || 0) || (entry.email ? 1 : "—")}</td>
                  <td style={{ padding: 8 }}>
                    {entry.deliveryStatus || "saved"}
                    {Number(entry.failureCount || 0) > 0 ? ` (${entry.failureCount} failed)` : ""}
                  </td>
                </tr>
              ))}
              {!history.length && !historyLoading ? (
                <tr><td colSpan={6} style={{ padding: 12, color: "#64748b" }}>No communication history yet.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

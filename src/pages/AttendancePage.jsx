import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import dayjs from "dayjs";
import { QRCodeCanvas } from "qrcode.react";
import { getClassSchedule, resolveScheduleKey } from "../data/classSchedules";
import { getUnifiedTopicLabel } from "../data/courseDictionary.js";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext.jsx";
import { listStudentsByClass } from "../services/studentsService";
import {
  listSessionCheckins,
  loadAttendanceFromFirestore,
  saveAttendanceToFirestore,
} from "../services/attendanceService";
import { buildAssignmentId } from "../utils/assignmentId.js";
import { rebuildAttendanceSessionsFromDictionary } from "../utils/attendanceDictionaryRepair.js";

function normalizeScheduleDate(raw) {
  if (!raw) return "";
  const parsed = dayjs(raw, ["YYYY-MM-DD", "dddd, DD MMMM YYYY"], true);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD") : String(raw || "").trim();
}

function buildScheduleMap(classId) {
  const schedule = getClassSchedule(classId);
  const scheduleLevel = resolveScheduleKey(classId);
  const map = {};

  schedule.forEach((item, index) => {
    const sessionId = String(index + 1);
    const assignmentId = String(
      item.assignmentId || item.assignment_id || buildAssignmentId(scheduleLevel, item.topic, index + 1),
    );
    const topicLabel = getUnifiedTopicLabel(assignmentId, item.topic);
    map[sessionId] = {
      title: `${item.week}: ${topicLabel}`,
      date: normalizeScheduleDate(item.date || item.dateIso),
      dateLabel: item.dateLabel || item.date || "",
      weekday: item.weekday || "",
      assignmentId,
      students: {},
    };
  });

  return map;
}

function resolveStudentCode(student) {
  return String(student.studentCode || student.studentcode || student.uid || student.id || "").trim();
}

function byStudentName(a, b) {
  return String(a?.name || "").localeCompare(String(b?.name || ""));
}

function resolveTopicFromTitle(title) {
  const text = String(title || "").trim();
  if (!text) return "";
  const segments = text.split(":");
  return String(segments[segments.length - 1] || text).trim();
}

function normalizeApiBaseUrl(url) {
  return String(url || "").trim().replace(/\/+$/, "");
}

function resolveOpenSessionApiUrl() {
  const explicitUrl = String(import.meta.env.VITE_OPEN_SESSION_API_URL || "").trim();
  if (explicitUrl) return explicitUrl;

  const apiBaseUrl = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);
  if (apiBaseUrl) return `${apiBaseUrl}/openSession`;

  throw new Error("Missing check-in API configuration. Set VITE_OPEN_SESSION_API_URL or VITE_API_BASE_URL.");
}

function toSessionApiErrorMessage(error, actionLabel) {
  const rawMessage = String(error?.message || "").trim();
  if (error instanceof TypeError || /failed to fetch|networkerror|network error/i.test(rawMessage)) {
    return `Network error while trying to ${actionLabel} check-in. Confirm the API URL is correct and CORS allows this app.`;
  }
  return rawMessage || `Error trying to ${actionLabel} check-in`;
}

function mergeStudentsWithTemplate(studentTemplate, baseStudents) {
  const merged = {};

  for (const [studentCode, templateStudent] of Object.entries(studentTemplate || {})) {
    const savedStudent = baseStudents?.[studentCode] || {};
    merged[studentCode] = {
      ...templateStudent,
      present: Boolean(savedStudent.present),
      email: String(templateStudent.email || savedStudent.email || "").trim(),
    };
  }

  return merged;
}

function buildStudentTemplate(students = []) {
  const template = {};
  for (const student of students) {
    const code = resolveStudentCode(student);
    if (!code) continue;
    template[code] = {
      name: String(student.name || "").trim(),
      email: String(student.email || "").trim(),
      present: false,
    };
  }
  return template;
}

function finishAttendanceMap({ scheduleMap, currentMap, studentTemplate }) {
  const baseMap = rebuildAttendanceSessionsFromDictionary(scheduleMap, currentMap);
  const nextMap = Object.keys(baseMap).length ? baseMap : {
    1: {
      title: "Session 1",
      date: dayjs().format("YYYY-MM-DD"),
      assignmentId: "",
      students: {},
    },
  };

  for (const sessionId of Object.keys(nextMap)) {
    const scheduleSession = scheduleMap[sessionId] || {};
    const existingSession = nextMap[sessionId] || {};
    nextMap[sessionId] = {
      ...existingSession,
      title: String(existingSession.title || "").trim() || scheduleSession.title || `Session ${Number(sessionId) || 1}`,
      date: normalizeScheduleDate(existingSession.date || scheduleSession.date || dayjs().format("YYYY-MM-DD")),
      dateLabel: String(existingSession.dateLabel || "").trim() || scheduleSession.dateLabel || "",
      weekday: String(existingSession.weekday || "").trim() || scheduleSession.weekday || "",
      assignmentId: String(existingSession.assignmentId || existingSession.assignment_id || scheduleSession.assignmentId || ""),
      startTime: String(existingSession.startTime || "").trim(),
      endTime: String(existingSession.endTime || "").trim(),
      students: mergeStudentsWithTemplate(studentTemplate, existingSession.students || {}),
    };
  }

  return nextMap;
}

export default function AttendancePage() {
  const { classId: routeClassId } = useParams();
  const classId = decodeURIComponent(routeClassId || "");
  const { user } = useAuth();
  const { success, error, info } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);
  const [sessionOpen, setSessionOpen] = useState(false);
  const [sessionBusy, setSessionBusy] = useState(false);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [selectedEmailStudentCodes, setSelectedEmailStudentCodes] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState("1");
  const [studentTemplate, setStudentTemplate] = useState({});

  const schedule = useMemo(() => getClassSchedule(classId), [classId]);
  const sessionIds = useMemo(() => Object.keys(attendanceMap).sort((a, b) => Number(a) - Number(b)), [attendanceMap]);
  const selectedSession = attendanceMap[selectedSessionId] || { title: "", date: "", assignmentId: "", students: {} };
  const checkinSessionDate = String(selectedSession.date || "").trim() || selectedSessionId;
  const checkinSessionId = String(selectedSessionId || "").trim();
  const checkinStartTime = String(selectedSession.startTime || "").trim();
  const checkinEndTime = String(selectedSession.endTime || "").trim();

  const assignmentOptions = useMemo(() => {
    return sessionIds
      .map((id) => {
        const item = attendanceMap[id] || {};
        const assignmentId = String(item.assignmentId || "").trim();
        if (!assignmentId) return null;
        return { assignmentId, label: `${assignmentId} - ${resolveTopicFromTitle(item.title) || "Lesson"}` };
      })
      .filter(Boolean);
  }, [attendanceMap, sessionIds]);

  const sessionLabel = useMemo(() => {
    const sessionNumber = Number(selectedSessionId);
    const zeroBasedIndex = sessionNumber > 0 ? sessionNumber - 1 : sessionNumber;
    const scheduleItem = schedule[zeroBasedIndex] || schedule[sessionNumber];
    if (scheduleItem) return `${scheduleItem.day} - ${scheduleItem.topic}`;
    return selectedSession.title || "";
  }, [schedule, selectedSessionId, selectedSession.title]);

  const selectedAssignmentOption = useMemo(() => {
    return assignmentOptions.find((opt) => opt.assignmentId === String(selectedSession.assignmentId || "").trim()) || null;
  }, [assignmentOptions, selectedSession.assignmentId]);

  const studentRows = useMemo(() => {
    return Object.entries(selectedSession.students || {})
      .map(([studentCode, entry]) => ({
        studentCode,
        name: entry?.name || "",
        email: String(entry?.email || "").trim(),
        present: Boolean(entry?.present),
      }))
      .sort(byStudentName);
  }, [selectedSession]);

  const selectedStudentsForEmail = useMemo(() => {
    const selectedCodes = new Set(selectedEmailStudentCodes);
    return studentRows.filter((row) => selectedCodes.has(row.studentCode));
  }, [selectedEmailStudentCodes, studentRows]);

  const selectedEmails = useMemo(() => selectedStudentsForEmail.map((row) => row.email).filter(Boolean), [selectedStudentsForEmail]);

  const summary = useMemo(() => {
    const present = studentRows.filter((row) => row.present).length;
    const absent = studentRows.length - present;
    return { present, absent, late: 0, excused: 0 };
  }, [studentRows]);

  const expectedStudentNames = useMemo(() => {
    return studentRows.map((row) => String(row.name || "").trim()).filter(Boolean).slice(0, 15);
  }, [studentRows]);

  const checkinUrl = useMemo(() => {
    const qs = new URLSearchParams({
      classId,
      sessionId: checkinSessionId,
      date: checkinSessionDate,
      sessionLabel,
      assignmentId: String(selectedSession.assignmentId || ""),
      startTime: checkinStartTime,
      endTime: checkinEndTime,
      expectedStudents: expectedStudentNames.join(", "),
      expectedCount: String(studentRows.length || 0),
    }).toString();
    return `${window.location.origin}/checkin?${qs}`;
  }, [classId, checkinSessionDate, checkinSessionId, expectedStudentNames, checkinStartTime, checkinEndTime, selectedSession.assignmentId, sessionLabel, studentRows.length]);

  const checkinDisplayUrl = useMemo(() => {
    const qs = new URLSearchParams({
      classId,
      sessionId: checkinSessionId,
      date: checkinSessionDate,
      sessionLabel,
      assignmentId: String(selectedSession.assignmentId || ""),
      startTime: checkinStartTime,
      endTime: checkinEndTime,
      expectedStudents: expectedStudentNames.join(", "),
      expectedCount: String(studentRows.length || 0),
    }).toString();
    return `${window.location.origin}/checkin/display?${qs}`;
  }, [classId, checkinSessionDate, checkinSessionId, expectedStudentNames, checkinStartTime, checkinEndTime, selectedSession.assignmentId, sessionLabel, studentRows.length]);

  const checkinBackupMailto = useMemo(() => {
    if (selectedEmails.length === 0) return "";
    const subject = `Backup check-in link for ${classId} (${sessionLabel || `Session ${checkinSessionId}`})`;
    const body = [
      "Hi student,",
      "",
      "As a backup in case the QR code check-in was missed, please use this check-in link:",
      checkinUrl,
      "",
      `Class: ${classId}`,
      `Session: ${sessionLabel || checkinSessionId}`,
      `Date: ${checkinSessionDate}`,
      "",
      "Thank you.",
    ].join("\n");
    return `mailto:${selectedEmails.join(",")}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }, [selectedEmails, classId, sessionLabel, checkinSessionId, checkinUrl, checkinSessionDate]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setSessionOpen(false);

      try {
        const [students, storedAttendance] = await Promise.all([
          listStudentsByClass(classId),
          loadAttendanceFromFirestore(classId),
        ]);
        const template = buildStudentTemplate(students);
        const scheduleMap = buildScheduleMap(classId);
        const nextMap = finishAttendanceMap({ scheduleMap, currentMap: storedAttendance, studentTemplate: template });
        const sortedIds = Object.keys(nextMap).sort((a, b) => Number(a) - Number(b));
        setStudentTemplate(template);
        setAttendanceMap(nextMap);
        setSelectedSessionId((prev) => (nextMap[prev] ? prev : sortedIds[0] || "1"));
      } catch (e) {
        error(e?.message || "Failed to load attendance");
      } finally {
        setLoading(false);
      }
    })();
  }, [classId]);

  useEffect(() => {
    if (!classId || !selectedSessionId || !attendanceMap[selectedSessionId]) return;

    (async () => {
      try {
        const checkins = await listSessionCheckins({ classId, sessionId: checkinSessionId });
        if (checkins.length === 0) return;

        setAttendanceMap((current) => {
          const updated = { ...current };
          const base = updated[selectedSessionId] || { students: {} };
          const studentsCopy = { ...(base.students || {}) };

          for (const c of checkins) {
            const code = String(c.studentCode || c.uid || c.id || "").trim();
            if (!code || !Object.prototype.hasOwnProperty.call(studentsCopy, code)) continue;
            studentsCopy[code] = {
              name: String(studentsCopy[code]?.name || c.name || "").trim(),
              email: String(studentsCopy[code]?.email || "").trim(),
              present: true,
            };
          }

          updated[selectedSessionId] = { ...base, students: studentsCopy };
          return updated;
        });
      } catch {
        // Non-blocking: attendance still works if check-ins fail to load.
      }
    })();
  }, [classId, selectedSessionId, checkinSessionDate, checkinSessionId, attendanceMap]);

  useEffect(() => {
    const availableCodes = new Set(studentRows.map((row) => row.studentCode));
    setSelectedEmailStudentCodes((prev) => prev.filter((code) => availableCodes.has(code)));
  }, [studentRows]);

  const setStudentPresent = (studentCode, present) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [selectedSessionId]: {
        ...(prev[selectedSessionId] || {}),
        students: {
          ...((prev[selectedSessionId] || {}).students || {}),
          [studentCode]: {
            ...(((prev[selectedSessionId] || {}).students || {})[studentCode] || {}),
            present,
          },
        },
      },
    }));

    const studentName = selectedSession?.students?.[studentCode]?.name || studentCode;
    if (present) success(`${studentName} marked present.`);
    else info(`${studentName} marked absent.`);
  };

  const toggleStudentEmailSelection = (studentCode, checked) => {
    setSelectedEmailStudentCodes((prev) => {
      if (checked) return prev.includes(studentCode) ? prev : [...prev, studentCode];
      return prev.filter((code) => code !== studentCode);
    });
  };

  const selectEmailTargets = (mode) => {
    const nextSelection = studentRows
      .filter((row) => row.email && (mode === "all" || !row.present))
      .map((row) => row.studentCode);
    setSelectedEmailStudentCodes(nextSelection);
  };

  const onSave = async () => {
    setSaving(true);
    try {
      await saveAttendanceToFirestore(classId, attendanceMap);
      success("Attendance saved.");
    } catch (e) {
      error(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const rebuildFromDictionary = async () => {
    const ok = window.confirm(
      "Rebuild this class attendance from the course dictionary? Present/absent records will stay, but wrong session titles, dates, weekdays and assignment IDs will be replaced.",
    );
    if (!ok) return;

    setRebuilding(true);
    try {
      const scheduleMap = buildScheduleMap(classId);
      if (Object.keys(scheduleMap).length === 0) throw new Error("No schedule dictionary was found for this class.");
      const rebuilt = finishAttendanceMap({ scheduleMap, currentMap: attendanceMap, studentTemplate });
      await saveAttendanceToFirestore(classId, rebuilt);
      const sortedIds = Object.keys(rebuilt).sort((a, b) => Number(a) - Number(b));
      setAttendanceMap(rebuilt);
      setSelectedSessionId((prev) => (rebuilt[prev] ? prev : sortedIds[0] || "1"));
      success("Attendance sessions rebuilt from dictionary and saved.");
    } catch (e) {
      error(e?.message || "Could not rebuild attendance sessions");
    } finally {
      setRebuilding(false);
    }
  };

  async function openCheckin() {
    setSessionBusy(true);
    try {
      const selectedAssignmentId = String(selectedSession.assignmentId || "").trim();
      if (!selectedAssignmentId) throw new Error("Select an assignment ID before opening check-in.");

      const token = await user.getIdToken();
      const res = await fetch(resolveOpenSessionApiUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          classId,
          sessionId: checkinSessionId,
          date: checkinSessionDate,
          sessionLabel,
          assignmentId: selectedAssignmentId,
          topic: resolveTopicFromTitle(selectedSession.title || sessionLabel),
          chapter: selectedAssignmentId.split("-").slice(1).join("-"),
          windowMinutes: 180,
          action: "open",
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to open check-in");
      setSessionOpen(true);
      success("Check-in opened.");
    } catch (e) {
      error(toSessionApiErrorMessage(e, "open"));
    } finally {
      setSessionBusy(false);
    }
  }

  async function closeCheckin() {
    setSessionBusy(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(resolveOpenSessionApiUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ classId, sessionId: checkinSessionId, date: checkinSessionDate, action: "close" }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to close check-in");
      setSessionOpen(false);
      success("Check-in closed.");
    } catch (e) {
      error(toSessionApiErrorMessage(e, "close"));
    } finally {
      setSessionBusy(false);
    }
  }

  if (loading) return <div style={{ padding: 16 }}>Loading...</div>;

  return (
    <div style={{ padding: 16, maxWidth: 900 }}>
      <h2>Attendance: {classId}</h2>
      {sessionLabel && <div style={{ marginBottom: 8, fontSize: 13, opacity: 0.85 }}>Session: {sessionLabel}</div>}

      <div style={{ border: "1px solid #fde68a", background: "#fffbeb", borderRadius: 10, padding: 12, marginBottom: 14, display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontWeight: 800 }}>Dictionary repair</div>
          <div style={{ fontSize: 12, opacity: 0.85 }}>Use this if day name, date, topic or assignment ID looks inconsistent.</div>
        </div>
        <button type="button" disabled={rebuilding || saving || sessionIds.length === 0} onClick={rebuildFromDictionary}>
          {rebuilding ? "Rebuilding..." : "Rebuild sessions from dictionary"}
        </button>
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
        <label>
          Session:{" "}
          <select value={selectedSessionId} onChange={(e) => setSelectedSessionId(e.target.value)}>
            {sessionIds.map((sessionId) => (
              <option key={sessionId} value={sessionId}>{sessionId}: {attendanceMap[sessionId]?.title || "Untitled"}</option>
            ))}
          </select>
        </label>

        <label>
          Assignment ID:{" "}
          <select
            value={String(selectedSession.assignmentId || "")}
            onChange={(e) => {
              const nextAssignmentId = e.target.value;
              setAttendanceMap((prev) => ({
                ...prev,
                [selectedSessionId]: { ...(prev[selectedSessionId] || {}), assignmentId: nextAssignmentId },
              }));
            }}
          >
            <option value="">Select assignment</option>
            {assignmentOptions.map((option) => (
              <option key={option.assignmentId} value={option.assignmentId}>{option.label}</option>
            ))}
          </select>
        </label>

        <label>
          Check-in date:{" "}
          <input
            type="date"
            value={selectedSession.date || ""}
            onChange={(e) => {
              const nextDate = e.target.value;
              setAttendanceMap((prev) => ({
                ...prev,
                [selectedSessionId]: { ...(prev[selectedSessionId] || {}), date: nextDate },
              }));
            }}
          />
        </label>

        <label>
          Start time:{" "}
          <input
            type="time"
            value={selectedSession.startTime || ""}
            onChange={(e) => {
              const nextStartTime = e.target.value;
              setAttendanceMap((prev) => ({
                ...prev,
                [selectedSessionId]: { ...(prev[selectedSessionId] || {}), startTime: nextStartTime },
              }));
            }}
          />
        </label>

        <label>
          End time:{" "}
          <input
            type="time"
            value={selectedSession.endTime || ""}
            onChange={(e) => {
              const nextEndTime = e.target.value;
              setAttendanceMap((prev) => ({
                ...prev,
                [selectedSessionId]: { ...(prev[selectedSessionId] || {}), endTime: nextEndTime },
              }));
            }}
          />
        </label>

        <div style={{ marginLeft: "auto", fontSize: 12, opacity: 0.85 }}>
          Present: {summary.present} · Absent: {summary.absent} · Late: {summary.late} · Excused: {summary.excused}
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <b>Title:</b> {selectedSession.title || "-"}
        <div style={{ marginTop: 4, fontSize: 13, opacity: 0.85 }}><b>Check-in date:</b> {checkinSessionDate}</div>
        {selectedSession.weekday && <div style={{ marginTop: 4, fontSize: 13, opacity: 0.85 }}><b>Weekday:</b> {selectedSession.weekday}</div>}
        <div style={{ marginTop: 4, fontSize: 13, opacity: 0.85 }}><b>Assignment ID:</b> {selectedSession.assignmentId || "-"}</div>
        <div style={{ marginTop: 4, fontSize: 13, opacity: 0.85 }}><b>Class time:</b> {checkinStartTime || "--:--"} to {checkinEndTime || "--:--"}</div>
      </div>

      <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12, marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ fontWeight: 700 }}>Student QR Check-in</div>
          <button disabled={sessionBusy || sessionOpen || !selectedAssignmentOption} onClick={openCheckin}>{sessionBusy && !sessionOpen ? "Opening..." : "Open Check-in"}</button>
          <button disabled={sessionBusy || !sessionOpen} onClick={closeCheckin}>{sessionBusy && sessionOpen ? "Closing..." : "Close Check-in"}</button>
          <a href={checkinDisplayUrl} target="_blank" rel="noreferrer" style={{ fontSize: 13 }}>Open Full-Screen QR Page</a>
          <div style={{ marginLeft: "auto", fontSize: 12, opacity: 0.85 }}>Status: {sessionOpen ? "OPEN" : "CLOSED"}</div>
        </div>

        {sessionOpen && (
          <div style={{ marginTop: 12, display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ padding: 10, border: "1px solid #eee", borderRadius: 10 }}>
              <QRCodeCanvas value={checkinUrl} size={170} />
              <div style={{ fontSize: 12, opacity: 0.8, marginTop: 8, wordBreak: "break-all" }}>{checkinUrl}</div>
            </div>
          </div>
        )}
      </div>

      <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12, marginBottom: 14 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Backup Email Check-in Link</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
          <button type="button" onClick={() => selectEmailTargets("all")}>Select all with email</button>
          <button type="button" onClick={() => selectEmailTargets("absent")}>Select absent with email</button>
          <button type="button" onClick={() => setSelectedEmailStudentCodes([])}>Clear selection</button>
          <a
            href={checkinBackupMailto || undefined}
            onClick={(e) => { if (!checkinBackupMailto) e.preventDefault(); }}
            style={{
              pointerEvents: checkinBackupMailto ? "auto" : "none",
              opacity: checkinBackupMailto ? 1 : 0.5,
              border: "1px solid #c9d1e4",
              borderRadius: 6,
              padding: "6px 10px",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            Email selected students
          </a>
        </div>
        <div style={{ fontSize: 12, opacity: 0.8 }}>Selected recipients: {selectedEmails.length}</div>
      </div>

      {studentRows.length === 0 ? (
        <div>No students found for this class.</div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {studentRows.map((row) => (
            <div key={row.studentCode} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 10, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{row.name || row.studentCode}</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>{row.studentCode}</div>
                {row.email && <div style={{ fontSize: 12, opacity: 0.7 }}>{row.email}</div>}
                <div style={{ marginTop: 6, fontSize: 12, fontWeight: 600, color: row.present ? "#147848" : "#6b7280" }}>{row.present ? "Present" : "Absent"}</div>
              </div>

              <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <input type="checkbox" disabled={!row.email} checked={selectedEmailStudentCodes.includes(row.studentCode)} onChange={(e) => toggleStudentEmailSelection(row.studentCode, e.target.checked)} /> Email
              </label>
              <button onClick={() => setStudentPresent(row.studentCode, true)} style={{ minWidth: 90, background: row.present ? "#147848" : "white", color: row.present ? "white" : "black", borderColor: row.present ? "#147848" : "#c9d1e4" }}>Present</button>
              <button onClick={() => setStudentPresent(row.studentCode, false)} style={{ minWidth: 90, background: !row.present ? "#6b7280" : "white", color: !row.present ? "white" : "black", borderColor: !row.present ? "#6b7280" : "#c9d1e4" }}>Absent</button>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 14, display: "flex", gap: 10, alignItems: "center" }}>
        <button disabled={saving || rebuilding || sessionIds.length === 0} onClick={onSave}>{saving ? "Saving..." : "Save Attendance"}</button>
      </div>
    </div>
  );
}

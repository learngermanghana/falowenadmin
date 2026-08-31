import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { listStudentsByClass } from "../services/studentsService.js";
import {
  loadAttendanceFromFirestore,
  saveCanonicalAttendanceSession,
} from "../services/attendanceService.js";
import { resolveClassCohort } from "../services/liveClassService.js";
import { getCompatibleClassDashboard } from "../services/liveClassCompatibilityService.js";
import {
  buildBulkPresentRepair,
  isBulkRepairEligibleSession,
} from "../utils/bulkAttendanceRepair.js";

const TIMEZONE = "Africa/Accra";

function asDate(value) {
  if (typeof value?.toDate === "function") return value.toDate();
  const parsed = value instanceof Date ? value : new Date(value || 0);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function codeOf(student = {}) {
  return String(student.studentCode || student.studentcode || student.uid || student.id || student.email || student.name || "").trim();
}

function studentTemplate(students = []) {
  return Object.fromEntries(students.map((student) => {
    const code = codeOf(student);
    if (!code) return null;
    return [code, {
      name: String(student.name || "").trim(),
      email: String(student.email || "").trim(),
      present: false,
    }];
  }).filter(Boolean));
}

function mergeStudents(template = {}, saved = {}) {
  const keys = new Set([...Object.keys(template), ...Object.keys(saved)]);
  return Object.fromEntries([...keys].map((code) => [code, {
    ...saved[code],
    name: template[code]?.name || saved[code]?.name || code,
    email: template[code]?.email || saved[code]?.email || "",
    present: Boolean(saved[code]?.present),
  }]));
}

function sessionLabel(session, timezone = TIMEZONE) {
  const date = asDate(session?.startsAt);
  const assignmentId = String(session?.assignmentIds?.[0] || session?.assignment_id || "").trim();
  const topic = String(session?.topic || session?.title || "Live class").trim();
  if (!date) return [assignmentId, topic].filter(Boolean).join(" — ");
  const dateText = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
  return `${dateText} · ${assignmentId ? `${assignmentId} — ` : ""}${topic}`;
}

export default function BulkAttendanceRepairPanel() {
  const { classId = "" } = useParams();
  const { user, isStaff } = useAuth();
  const { success, error, info } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [klass, setKlass] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [studentRows, setStudentRows] = useState([]);
  const [selectedSessionIds, setSelectedSessionIds] = useState([]);
  const [selectedStudentCodes, setSelectedStudentCodes] = useState([]);

  useEffect(() => {
    if (isStaff) return undefined;
    let active = true;

    (async () => {
      setLoading(true);
      try {
        const resolved = await resolveClassCohort(decodeURIComponent(classId));
        if (!resolved) throw new Error("Class not found in Live Classes.");
        const dashboard = await getCompatibleClassDashboard(resolved.id);
        const className = dashboard.klass.name || resolved.name || "";
        const [students, savedById, savedByName] = await Promise.all([
          listStudentsByClass(resolved.id, { className }),
          loadAttendanceFromFirestore(resolved.id).catch(() => ({})),
          className ? loadAttendanceFromFirestore(className).catch(() => ({})) : {},
        ]);
        if (!active) return;

        const saved = { ...savedByName, ...savedById };
        const template = studentTemplate(students);
        const map = Object.fromEntries(dashboard.sessions.map((session) => {
          const stored = saved[session.id] || {};
          const assignmentIds = session.assignmentIds || session.chapterIds || session.curriculumIds || stored.assignmentIds || [];
          return [session.id, {
            ...session,
            assignmentIds,
            students: mergeStudents(template, stored.students || {}),
          }];
        }));

        const rows = Object.entries(template)
          .map(([code, student]) => ({ code, ...student }))
          .sort((left, right) => String(left.name || left.code).localeCompare(String(right.name || right.code)));

        setKlass(dashboard.klass);
        setSessions(dashboard.sessions);
        setAttendance(map);
        setStudentRows(rows);
      } catch (cause) {
        error(cause?.message || "Bulk attendance repair could not be loaded.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => { active = false; };
  }, [classId, error, isStaff]);

  const timezone = klass?.timezone || TIMEZONE;
  const selectedSessionSet = useMemo(() => new Set(selectedSessionIds), [selectedSessionIds]);
  const selectedStudentSet = useMemo(() => new Set(selectedStudentCodes), [selectedStudentCodes]);
  const eligibleSessions = useMemo(() => sessions.filter(isBulkRepairEligibleSession), [sessions]);

  const repairPreview = useMemo(() => buildBulkPresentRepair({
    attendance,
    sessionIds: selectedSessionIds,
    studentCodes: selectedStudentCodes,
  }), [attendance, selectedSessionIds, selectedStudentCodes]);

  function toggleSession(sessionId) {
    setSelectedSessionIds((current) => current.includes(sessionId)
      ? current.filter((id) => id !== sessionId)
      : [...current, sessionId]);
  }

  function toggleStudent(studentCode) {
    setSelectedStudentCodes((current) => current.includes(studentCode)
      ? current.filter((code) => code !== studentCode)
      : [...current, studentCode]);
  }

  function selectPastSessions() {
    const now = Date.now();
    setSelectedSessionIds(eligibleSessions
      .filter((session) => (asDate(session.startsAt)?.getTime() || 0) <= now)
      .map((session) => session.id));
  }

  function selectAbsentStudents() {
    if (!selectedSessionIds.length) {
      info("Select one or more class days first.");
      return;
    }
    setSelectedStudentCodes(studentRows
      .filter((student) => selectedSessionIds.some((sessionId) => attendance[sessionId]?.students?.[student.code]?.present !== true))
      .map((student) => student.code));
  }

  async function applyBulkPresent() {
    if (!klass || !selectedSessionIds.length || !selectedStudentCodes.length) return;
    if (!repairPreview.changedRecords) {
      info("The selected students are already present for the selected class days.");
      return;
    }

    const confirmed = window.confirm(
      `Mark ${selectedStudentCodes.length} selected student(s) present across ${selectedSessionIds.length} selected class day(s)? This will repair ${repairPreview.changedRecords} attendance record(s).`,
    );
    if (!confirmed) return;

    setSaving(true);
    try {
      const results = await Promise.allSettled(repairPreview.changedSessionIds.map(async (sessionId) => {
        const session = repairPreview.attendance[sessionId];
        await saveCanonicalAttendanceSession({
          classRecordId: klass.id,
          className: klass.name,
          session,
          students: session.students,
          markedBy: user?.uid || user?.email || "admin",
        });
        return sessionId;
      }));

      const savedSessionIds = results
        .filter((result) => result.status === "fulfilled")
        .map((result) => result.value);
      const failedCount = results.length - savedSessionIds.length;
      const savedSet = new Set(savedSessionIds);
      const savedRecords = savedSessionIds.reduce((count, sessionId) => count + selectedStudentCodes.filter((studentCode) => {
        const before = attendance[sessionId]?.students?.[studentCode];
        const after = repairPreview.attendance[sessionId]?.students?.[studentCode];
        return before && before.present !== true && after?.present === true;
      }).length, 0);

      if (savedSessionIds.length) {
        setAttendance((current) => {
          const next = { ...current };
          repairPreview.changedSessionIds.forEach((sessionId) => {
            if (savedSet.has(sessionId)) next[sessionId] = repairPreview.attendance[sessionId];
          });
          return next;
        });
      }

      if (failedCount) {
        error(`${savedRecords} attendance record(s) were repaired, but ${failedCount} class day(s) failed to save.`);
      } else {
        success(`${savedRecords} attendance record(s) repaired across ${savedSessionIds.length} class day(s).`);
        setSelectedSessionIds([]);
        setSelectedStudentCodes([]);
      }
    } catch (cause) {
      error(cause?.message || "Bulk attendance repair failed.");
    } finally {
      setSaving(false);
    }
  }

  if (isStaff) return null;

  return (
    <article className="card" style={{ maxWidth: 1000, margin: "0 auto 16px", border: "2px solid #dbeafe" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "start" }}>
        <div>
          <h2 style={{ margin: 0 }}>Admin bulk attendance repair</h2>
          <p style={{ margin: "6px 0 0", maxWidth: 760 }}>
            Use this when students were in class but could not check in. Select multiple students and multiple class days, then mark the whole selection present at once. Cancelled lessons cannot be changed here.
          </p>
        </div>
        <strong style={{ fontSize: 12, padding: "6px 9px", borderRadius: 999, background: "#eff6ff" }}>ADMIN ONLY</strong>
      </div>

      {loading ? <p>Loading repair options…</p> : <>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginTop: 16 }}>
          <section>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <strong>1. Choose class days</strong>
              <span style={{ fontSize: 12 }}>{selectedSessionIds.length} selected</span>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "8px 0" }}>
              <button type="button" onClick={selectPastSessions}>Select past &amp; today</button>
              <button type="button" onClick={() => setSelectedSessionIds(eligibleSessions.map((session) => session.id))}>Select all active days</button>
              <button type="button" onClick={() => setSelectedSessionIds([])}>Clear</button>
            </div>
            <div style={{ maxHeight: 300, overflowY: "auto", display: "grid", gap: 6, paddingRight: 4 }}>
              {sessions.map((session) => {
                const eligible = isBulkRepairEligibleSession(session);
                return (
                  <label key={session.id} style={{ display: "flex", gap: 8, alignItems: "start", padding: 8, border: "1px solid #e5e7eb", borderRadius: 8, opacity: eligible ? 1 : 0.55 }}>
                    <input
                      type="checkbox"
                      checked={eligible && selectedSessionSet.has(session.id)}
                      disabled={!eligible}
                      onChange={() => toggleSession(session.id)}
                    />
                    <span style={{ fontSize: 13 }}>
                      <strong>{sessionLabel(session, timezone)}</strong>
                      <span style={{ display: "block", opacity: 0.7 }}>Status: {session.status || "scheduled"}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </section>

          <section>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <strong>2. Choose students</strong>
              <span style={{ fontSize: 12 }}>{selectedStudentCodes.length} selected</span>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "8px 0" }}>
              <button type="button" onClick={() => setSelectedStudentCodes(studentRows.map((student) => student.code))}>Select all students</button>
              <button type="button" onClick={selectAbsentStudents}>Select absent in chosen days</button>
              <button type="button" onClick={() => setSelectedStudentCodes([])}>Clear</button>
            </div>
            <div style={{ maxHeight: 300, overflowY: "auto", display: "grid", gap: 6, paddingRight: 4 }}>
              {studentRows.map((student) => (
                <label key={student.code} style={{ display: "flex", gap: 8, alignItems: "center", padding: 8, border: "1px solid #e5e7eb", borderRadius: 8 }}>
                  <input
                    type="checkbox"
                    checked={selectedStudentSet.has(student.code)}
                    onChange={() => toggleStudent(student.code)}
                  />
                  <span style={{ fontSize: 13 }}><strong>{student.name || student.code}</strong><span style={{ display: "block", opacity: 0.7 }}>{student.code}</span></span>
                </label>
              ))}
            </div>
          </section>
        </div>

        <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: "#f8fafc", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 320px" }}>
            <strong>Ready to repair: {repairPreview.changedRecords} record(s)</strong>
            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 3 }}>
              Already-present records stay present. Only selected absent records on selected non-cancelled days are changed.
            </div>
          </div>
          <button
            type="button"
            disabled={saving || !selectedSessionIds.length || !selectedStudentCodes.length || !repairPreview.changedRecords}
            onClick={applyBulkPresent}
            style={{ fontWeight: 700 }}
          >
            {saving ? "Saving bulk attendance…" : "Mark selected PRESENT"}
          </button>
        </div>
      </>}
    </article>
  );
}

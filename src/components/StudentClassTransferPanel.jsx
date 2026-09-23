import { useEffect, useMemo, useState } from "react";
import { listStudentClassTransfers, transferStudentClass } from "../services/studentsService.js";

function clean(value) {
  return String(value || "").trim();
}

function classLabel(klass = {}) {
  return clean(klass.name || klass.className || klass.classId || klass.id) || "Unnamed class";
}

function classLevel(klass = {}) {
  return clean(klass.levelId || klass.level || klass.courseLevel || klass.languageLevel).toUpperCase();
}

function currentClassId(student = {}) {
  return clean(student.classRecordId || student.classId || student.assignedClassId);
}

function currentClassName(student = {}) {
  return clean(student.className || student.class || student.groupName || student.cohortName || student.classId);
}

function formatDate(value) {
  const text = clean(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return text || "Unknown date";
  return new Date(`${text}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function localHistory(student = {}) {
  return Array.isArray(student.classTransfers)
    ? [...student.classTransfers].sort((a, b) => clean(b.effectiveDate).localeCompare(clean(a.effectiveDate)))
    : [];
}

export default function StudentClassTransferPanel({
  student,
  classes = [],
  onTransferred,
  pushToast,
}) {
  const [targetClassRecordId, setTargetClassRecordId] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState("");
  const [transferring, setTransferring] = useState(false);
  const [history, setHistory] = useState(() => localHistory(student));
  const [historyLoading, setHistoryLoading] = useState(false);

  const availableClasses = useMemo(() => {
    const currentId = currentClassId(student);
    const currentName = currentClassName(student).toLowerCase();
    return (Array.isArray(classes) ? classes : [])
      .filter((klass) => {
        const id = clean(klass.id || klass.classRecordId || klass.classId);
        const name = classLabel(klass).toLowerCase();
        if (!id) return false;
        if (id === currentId || (currentName && name === currentName)) return false;
        return !["archived", "graduated", "inactive"].includes(clean(klass.status).toLowerCase());
      })
      .sort((a, b) => classLabel(a).localeCompare(classLabel(b)));
  }, [classes, student]);

  const targetClass = availableClasses.find((klass) =>
    clean(klass.id || klass.classRecordId || klass.classId) === targetClassRecordId
  ) || null;

  useEffect(() => {
    let active = true;
    setTargetClassRecordId("");
    setReason("");
    setEffectiveDate(new Date().toISOString().slice(0, 10));
    setHistory(localHistory(student));
    if (!student?.id) return () => { active = false; };

    setHistoryLoading(true);
    listStudentClassTransfers(student.id)
      .then((rows) => {
        if (active && Array.isArray(rows)) setHistory(rows);
      })
      .catch(() => {
        if (active) setHistory(localHistory(student));
      })
      .finally(() => {
        if (active) setHistoryLoading(false);
      });

    return () => {
      active = false;
    };
  }, [student?.id]);

  const runTransfer = async () => {
    if (!student?.id) return;
    if (!targetClassRecordId || !targetClass) {
      pushToast?.({ type: "error", message: "Select the class the student is moving to." });
      return;
    }

    const fromName = currentClassName(student) || "current class";
    const toName = classLabel(targetClass);
    const confirmed = window.confirm(
      `Transfer ${student.name || student.studentCode || "this student"} from ${fromName} to ${toName} effective ${formatDate(effectiveDate)}?\n\nHistorical attendance, participation and scores will not be moved or deleted.`
    );
    if (!confirmed) return;

    setTransferring(true);
    try {
      const result = await transferStudentClass(student.id, {
        targetClassRecordId,
        effectiveDate,
        reason,
      });
      const patch = result?.student || {};
      const transfer = result?.transfer || null;
      if (transfer) {
        setHistory((rows) => [transfer, ...rows.filter((row) => clean(row.id) !== clean(transfer.id))]);
      }
      onTransferred?.(student.id, patch, transfer);
      setTargetClassRecordId("");
      setReason("");
      pushToast?.({
        type: "success",
        message: `${student.name || "Student"} moved to ${toName}. Previous attendance and participation were preserved.`,
      });
    } catch (error) {
      pushToast?.({ type: "error", message: error?.message || "Could not transfer student" });
    } finally {
      setTransferring(false);
    }
  };

  const currentLevel = clean(student?.level || student?.levelId).toUpperCase();
  const nextLevel = targetClass ? classLevel(targetClass) : "";
  const crossLevel = Boolean(currentLevel && nextLevel && currentLevel !== nextLevel);

  return (
    <section
      style={{
        marginTop: 18,
        border: "1px solid #bfdbfe",
        borderRadius: 14,
        padding: 14,
        background: "linear-gradient(135deg, #eff6ff, #ffffff)",
        display: "grid",
        gap: 12,
      }}
    >
      <div>
        <h3 style={{ margin: "0 0 4px" }}>Transfer class</h3>
        <p style={{ margin: 0, color: "#475569" }}>
          Change only the student's current class. Historical attendance, class participation and scores remain attached to the original class and lesson.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 10 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>Current class</span>
          <input
            value={currentClassName(student) || "Not assigned"}
            readOnly
            style={{ padding: "8px 9px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#f8fafc" }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>Move to</span>
          <select
            value={targetClassRecordId}
            onChange={(event) => setTargetClassRecordId(event.target.value)}
            disabled={transferring}
            style={{ padding: "8px 9px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff" }}
          >
            <option value="">Select new class</option>
            {availableClasses.map((klass) => {
              const id = clean(klass.id || klass.classRecordId || klass.classId);
              const level = classLevel(klass);
              return (
                <option key={id} value={id}>
                  {classLabel(klass)}{level ? ` · ${level}` : ""}
                </option>
              );
            })}
          </select>
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>Effective date</span>
          <input
            type="date"
            value={effectiveDate}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(event) => setEffectiveDate(event.target.value)}
            disabled={transferring}
            style={{ padding: "8px 9px", borderRadius: 8, border: "1px solid #cbd5e1" }}
          />
        </label>
      </div>

      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 700 }}>Reason / note</span>
        <input
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="e.g. timetable conflict, student requested another class"
          disabled={transferring}
          style={{ padding: "8px 9px", borderRadius: 8, border: "1px solid #cbd5e1" }}
        />
      </label>

      {crossLevel ? (
        <div style={{ padding: 10, borderRadius: 10, background: "#fff7ed", border: "1px solid #fdba74", color: "#9a3412" }}>
          This moves the student from <strong>{currentLevel}</strong> to <strong>{nextLevel}</strong>. Old scores and records stay unchanged; new class activity follows the new level.
        </div>
      ) : null}

      <div>
        <button type="button" onClick={runTransfer} disabled={transferring || !targetClassRecordId}>
          {transferring ? "Transferring..." : "Transfer class"}
        </button>
      </div>

      <div style={{ borderTop: "1px solid #dbeafe", paddingTop: 10 }}>
        <strong>Class history</strong>
        {historyLoading ? <p style={{ margin: "6px 0 0", color: "#64748b" }}>Loading history…</p> : null}
        {!historyLoading && !history.length ? (
          <p style={{ margin: "6px 0 0", color: "#64748b" }}>No previous class transfers recorded yet.</p>
        ) : null}
        {history.length ? (
          <div style={{ display: "grid", gap: 7, marginTop: 8 }}>
            {history.map((item, index) => (
              <div key={clean(item.id) || `${item.effectiveDate}-${index}`} style={{ padding: 9, borderRadius: 9, background: "#fff", border: "1px solid #dbeafe" }}>
                <div>
                  <strong>{clean(item.fromClassName || item.fromClassId) || "Previous class"}</strong>
                  {" → "}
                  <strong>{clean(item.toClassName || item.toClassId) || "New class"}</strong>
                </div>
                <small style={{ color: "#64748b" }}>
                  Effective {formatDate(item.effectiveDate)}
                  {clean(item.reason) ? ` · ${clean(item.reason)}` : ""}
                </small>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

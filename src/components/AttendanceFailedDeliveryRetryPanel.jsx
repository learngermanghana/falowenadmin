import { useEffect, useMemo, useState } from "react";
import { listClasses } from "../services/classesService.js";
import { retryFailedAttendanceEmails } from "../services/attendanceConfirmationRetryService.js";
import { useToast } from "../context/ToastContext.jsx";

function normalize(value) {
  return String(value || "").trim();
}

function classRecordId(klass = {}) {
  return normalize(klass.classRecordId || klass.id);
}

function classLabel(klass = {}) {
  return normalize(klass.name || klass.className || klass.classId || klass.id) || "Class";
}

function isAvailableClass(klass = {}) {
  if (!classRecordId(klass)) return false;
  if (klass.archived === true || klass.isArchived === true) return false;
  const status = normalize(klass.status).toLowerCase();
  return !["archived", "inactive", "deleted", "cancelled", "canceled"].includes(status);
}

const panelStyle = {
  border: "1px solid #dbe2ea",
  borderRadius: 12,
  background: "#fff",
  padding: 16,
  display: "grid",
  gap: 12,
};

const inputStyle = {
  padding: 10,
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  width: "100%",
};

export default function AttendanceFailedDeliveryRetryPanel() {
  const { success, error } = useToast();
  const [classes, setClasses] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [resultMessage, setResultMessage] = useState("");

  async function loadClassesNow() {
    setLoading(true);
    setLoadError("");
    try {
      const rows = (await listClasses()).filter(isAvailableClass);
      setClasses(rows);
      setSelectedId((current) => {
        if (current && rows.some((klass) => classRecordId(klass) === current)) return current;
        return classRecordId(rows[0]);
      });
    } catch (loadFailure) {
      setClasses([]);
      setSelectedId("");
      setLoadError(loadFailure?.message || "Could not load Live Classes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClassesNow();
  }, []);

  const selectedClass = useMemo(
    () => classes.find((klass) => classRecordId(klass) === selectedId) || null,
    [classes, selectedId],
  );

  async function retryFailed() {
    if (!selectedId) return;
    setRetrying(true);
    setResultMessage("");
    try {
      const result = await retryFailedAttendanceEmails(selectedId);
      const retried = Number(result?.retried || 0);
      const failedFound = Number(result?.failedFound || 0);
      const message = retried > 0
        ? `Retried ${retried} failed attendance email${retried === 1 ? "" : "s"} for ${classLabel(selectedClass)}.`
        : failedFound > 0
          ? `Failed records were found for ${classLabel(selectedClass)}, but none were available to reserve. Try again after the current job finishes.`
          : `No failed attendance emails were found for ${classLabel(selectedClass)}.`;
      setResultMessage(message);
      success(message);
    } catch (retryError) {
      const message = retryError?.message || "Could not retry failed attendance emails.";
      setResultMessage(message);
      error(message);
    } finally {
      setRetrying(false);
    }
  }

  return (
    <section style={panelStyle}>
      <div>
        <h2 style={{ margin: 0 }}>Retry failed attendance emails</h2>
        <p style={{ margin: "6px 0 0", color: "#475569" }}>
          Retry only delivery records marked as failed for the selected class. Emails already marked sent are never resent.
        </p>
      </div>

      {loadError ? (
        <div style={{ padding: 12, border: "1px solid #fecaca", background: "#fef2f2", color: "#991b1b", borderRadius: 10 }}>
          <strong>Classes could not be loaded.</strong>
          <div style={{ marginTop: 4 }}>{loadError}</div>
        </div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 1fr) auto", gap: 10, alignItems: "end" }}>
        <label style={{ display: "grid", gap: 6 }}>
          <strong>Class</strong>
          <select
            style={inputStyle}
            value={selectedId}
            onChange={(event) => {
              setSelectedId(event.target.value);
              setResultMessage("");
            }}
            disabled={loading || retrying || !classes.length}
          >
            {classes.map((klass) => {
              const id = classRecordId(klass);
              return <option key={id} value={id}>{classLabel(klass)}</option>;
            })}
          </select>
        </label>

        <button type="button" onClick={retryFailed} disabled={!selectedId || loading || retrying || Boolean(loadError)}>
          {retrying ? "Retrying…" : "Retry failed emails"}
        </button>
      </div>

      {resultMessage ? (
        <div style={{ padding: 11, border: "1px solid #bfdbfe", background: "#eff6ff", borderRadius: 10 }}>
          {resultMessage}
        </div>
      ) : null}

      <small style={{ color: "#64748b" }}>
        Gmail-quota messages that were accepted into the spreadsheet Outbox are not classified as failed here; the Apps Script Outbox continues retrying those automatically after quota resets.
      </small>
    </section>
  );
}

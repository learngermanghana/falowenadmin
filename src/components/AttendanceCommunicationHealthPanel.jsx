import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ATTENDANCE_EMAIL_MODES,
  loadAttendanceEmailSettings,
} from "../services/attendanceConfirmationEmailService.js";
import { loadAttendanceDeliveryHealth } from "../services/attendanceCommunicationHealthService.js";
import { retryFailedAttendanceEmails } from "../services/attendanceConfirmationRetryService.js";
import { useToast } from "../context/ToastContext.jsx";
import "./AttendanceCommunicationHealthPanel.css";

function normalize(value) {
  return String(value ?? "").trim();
}

function formatDateTime(value) {
  if (!value) return "Not yet";
  const date = typeof value?.toDate === "function" ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "Not yet";
  return date.toLocaleString("en-GB", {
    timeZone: "Africa/Accra",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function modeLabel(settings = {}) {
  if (!settings.enabled || settings.mode === ATTENDANCE_EMAIL_MODES.OFF) return "Off";
  if (settings.mode === ATTENDANCE_EMAIL_MODES.EACH_CLASS) return "After every class";
  return "Weekly";
}

function statusExplanation(settings = {}, summary = {}) {
  const status = normalize(settings.lastStatus).toLowerCase();
  if (!settings.enabled || settings.mode === ATTENDANCE_EMAIL_MODES.OFF) {
    return { tone: "neutral", title: "Attendance email automation is off", detail: "Enable it in Communication before expecting delivery records." };
  }
  if (!settings.deliveryConfigured) {
    return { tone: "danger", title: "Delivery is not configured", detail: "Save the class under Communication → Attendance confirmation emails so the webhook configuration is attached to this class." };
  }
  if (settings.lastError) {
    return { tone: "danger", title: "Attendance worker reported an error", detail: settings.lastError };
  }
  if (summary.failed > 0) {
    return {
      tone: "danger",
      title: summary.failed + " failed attendance email" + (summary.failed === 1 ? "" : "s"),
      detail: summary.latestFailure?.lastError || "Open the failed delivery rows below, then retry failed emails only.",
    };
  }
  if (summary.processing > 0) {
    return {
      tone: "warning",
      title: summary.processing + " delivery job" + (summary.processing === 1 ? "" : "s") + " still processing",
      detail: "Refresh shortly. Fresh processing records are protected from duplicate retries.",
    };
  }
  if (["sent", "retry_sent"].includes(status) || summary.sent > 0) {
    const count = summary.sent || settings.lastSentCount || 0;
    return {
      tone: "success",
      title: "Attendance email delivery is healthy",
      detail: count + " recorded deliver" + (count === 1 ? "y" : "ies") + " sent in the current delivery history.",
    };
  }
  const explanations = {
    no_sessions: "No active class sessions were found for this class.",
    no_recipients: "No active students with email addresses matched this class.",
    no_delivery_due: "No completed attendance period is due yet.",
    checking_due_deliveries: "The worker found due attendance periods and is checking which student deliveries still need to be sent.",
    waiting_for_first_session: "The class is configured, but no eligible completed session has been processed yet.",
    no_failed_deliveries: "The retry check found no failed attendance delivery records.",
    retrying_failed: "Failed attendance deliveries are being reserved for retry.",
  };
  return {
    tone: "neutral",
    title: "No failed delivery is currently recorded",
    detail: explanations[status] || "The attendance worker has not recorded a completed send yet.",
  };
}

function deliveryStatusLabel(status) {
  if (status === "sent") return "Sent";
  if (status === "failed") return "Failed";
  if (status === "processing") return "Processing";
  return status || "Unknown";
}

export default function AttendanceCommunicationHealthPanel({ classId = "", className = "" }) {
  const { success, error } = useToast();
  const [settings, setSettings] = useState(null);
  const [health, setHealth] = useState({
    records: [],
    summary: { total: 0, sent: 0, failed: 0, processing: 0, unknown: 0, totalAttempts: 0 },
  });
  const [loading, setLoading] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    if (!classId) return;
    setLoading(true);
    setLoadError("");
    try {
      const [nextSettings, nextHealth] = await Promise.all([
        loadAttendanceEmailSettings(classId),
        loadAttendanceDeliveryHealth(classId),
      ]);
      setSettings(nextSettings);
      setHealth(nextHealth);
    } catch (cause) {
      setLoadError(cause?.message || "Could not load attendance communication health.");
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    setSettings(null);
    setHealth({
      records: [],
      summary: { total: 0, sent: 0, failed: 0, processing: 0, unknown: 0, totalAttempts: 0 },
    });
    load();
  }, [load]);

  const summary = health?.summary || {};
  const diagnosis = useMemo(() => statusExplanation(settings || {}, summary), [settings, summary]);
  const recent = (health?.records || []).slice(0, 8);

  async function retryFailed() {
    if (!classId || retrying || !summary.failed) return;
    setRetrying(true);
    try {
      const result = await retryFailedAttendanceEmails(classId);
      const retried = Number(result?.retried || 0);
      const failedFound = Number(result?.failedFound || 0);
      const message = retried
        ? "Retried " + retried + " failed attendance email" + (retried === 1 ? "" : "s") + " for " + (className || classId) + "."
        : failedFound
          ? "Failed delivery records were found, but another job currently owns them. Refresh after that job finishes."
          : "No failed attendance email remained to retry.";
      success(message);
      await load();
    } catch (cause) {
      error(cause?.message || "Could not retry failed attendance emails.");
      await load();
    } finally {
      setRetrying(false);
    }
  }

  return (
    <section className="attendance-communication-health" aria-label="Attendance communication reliability">
      <div className="attendance-communication-heading">
        <div>
          <span>Attendance communication</span>
          <h3>Email reliability</h3>
          <p>Shows the worker result and the actual per-student delivery records for this class.</p>
        </div>
        <div className="attendance-communication-actions">
          <button type="button" onClick={load} disabled={loading || retrying}>{loading ? "Refreshing…" : "Refresh"}</button>
          <button type="button" className="is-retry" onClick={retryFailed} disabled={retrying || loading || !summary.failed}>
            {retrying ? "Retrying failed…" : "Retry failed only" + (summary.failed ? " (" + summary.failed + ")" : "")}
          </button>
          <Link to="/communication">Email settings</Link>
        </div>
      </div>

      {loadError ? <div className="attendance-communication-error">{loadError}</div> : null}

      <div className="attendance-communication-metrics">
        <article><span>Mode</span><strong>{settings ? modeLabel(settings) : "—"}</strong></article>
        <article><span>Sent</span><strong>{summary.sent || 0}</strong></article>
        <article className={summary.failed ? "is-danger" : ""}><span>Failed</span><strong>{summary.failed || 0}</strong></article>
        <article className={summary.processing ? "is-warning" : ""}><span>Processing</span><strong>{summary.processing || 0}</strong></article>
        <article><span>Attempts</span><strong>{summary.totalAttempts || 0}</strong></article>
      </div>

      {settings ? (
        <div className="attendance-communication-worker">
          <span>Last worker check <strong>{formatDateTime(settings.lastRunAt)}</strong></span>
          <span>Last successful send <strong>{formatDateTime(settings.lastSentAt)}</strong></span>
          <span>Last worker status <strong>{settings.lastStatus || "Not yet"}</strong></span>
          <span>Last recipients <strong>{settings.lastRecipientCount || settings.lastSentCount || 0}</strong></span>
        </div>
      ) : null}

      <div className={"attendance-communication-diagnosis is-" + diagnosis.tone}>
        <strong>{diagnosis.title}</strong>
        <p>{diagnosis.detail}</p>
      </div>

      <div className="attendance-communication-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Recipient</th>
              <th>Period</th>
              <th>Status</th>
              <th>Attempts</th>
              <th>Last update</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((record) => (
              <tr key={record.id}>
                <td>
                  <strong>{record.studentName || record.studentEmail || record.studentKey || "Student"}</strong>
                  {record.studentEmail ? <small>{record.studentEmail}</small> : null}
                </td>
                <td>{record.periodKey || record.mode || "—"}</td>
                <td><span className={"attendance-delivery-status is-" + record.status}>{deliveryStatusLabel(record.status)}</span></td>
                <td>{record.attemptCount || 0}</td>
                <td>{formatDateTime(record.updatedAt || record.sentAt || record.failedAt || record.processingStartedAt)}</td>
                <td>{record.lastError || (record.status === "sent" ? "Delivered" : "—")}</td>
              </tr>
            ))}
            {!recent.length ? (
              <tr>
                <td colSpan="6">No per-student attendance delivery records exist for this class yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <p className="attendance-communication-footnote">
        Retry is deliberately limited to records whose delivery status is <strong>failed</strong>. Records already marked sent are never resent.
      </p>
    </section>
  );
}

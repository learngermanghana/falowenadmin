import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { auth } from "../firebase.js";
import { listClasses } from "../services/classesService.js";
import {
  ATTENDANCE_EMAIL_MODES,
  loadAttendanceEmailSettings,
  saveAttendanceEmailSettings,
} from "../services/attendanceConfirmationEmailService.js";
import { useToast } from "../context/ToastContext.jsx";

const defaultSettings = {
  enabled: true,
  mode: ATTENDANCE_EMAIL_MODES.WEEKLY,
  delayMinutes: 30,
  lateMinutes: 15,
  replyNote: "Contact Learn Language Education Academy if this attendance record needs correction.",
  lastRunAt: null,
  lastSentAt: null,
  lastSentCount: 0,
  lastStatus: "",
  lastError: "",
};

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

const fieldStyle = { display: "grid", gap: 6 };
const inputStyle = { padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" };
const panelStyle = {
  border: "1px solid #dbe2ea",
  borderRadius: 12,
  background: "#fff",
  padding: 16,
  display: "grid",
  gap: 14,
};

export default function AttendanceConfirmationAutomationPanel() {
  const { success, error } = useToast();
  const [classes, setClasses] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [settings, setSettings] = useState(defaultSettings);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [saving, setSaving] = useState(false);
  const [classesError, setClassesError] = useState("");
  const [settingsError, setSettingsError] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [weeklyPreview, setWeeklyPreview] = useState(null);
  const [weeklyPreviewPeriod, setWeeklyPreviewPeriod] = useState("previous");
  const [weeklyPreviewError, setWeeklyPreviewError] = useState("");
  const [sendingWeeklyTest, setSendingWeeklyTest] = useState(false);
  const [weeklyTestResult, setWeeklyTestResult] = useState("");
  const [sendingWeekly, setSendingWeekly] = useState(false);
  const [weeklySendResult, setWeeklySendResult] = useState("");
  const [sendingDue, setSendingDue] = useState(false);
  const [dueResult, setDueResult] = useState("");

  async function loadClassesNow() {
    setLoadingClasses(true);
    setClassesError("");
    try {
      const rows = (await listClasses()).filter(isAvailableClass);
      setClasses(rows);
      setSelectedId((current) => {
        if (current && rows.some((klass) => classRecordId(klass) === current)) return current;
        return classRecordId(rows[0]);
      });
    } catch (loadError) {
      setClasses([]);
      setSelectedId("");
      setClassesError(loadError?.message || "Could not load Live Classes.");
    } finally {
      setLoadingClasses(false);
    }
  }

  useEffect(() => {
    loadClassesNow();
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setSettings(defaultSettings);
      setSettingsError("");
      return;
    }

    let active = true;
    setLoadingSettings(true);
    setSettingsError("");
    loadAttendanceEmailSettings(selectedId)
      .then((next) => {
        if (active) setSettings({ ...defaultSettings, ...next });
      })
      .catch((loadError) => {
        if (!active) return;
        setSettings(defaultSettings);
        setSettingsError(loadError?.message || "Could not load attendance email settings for this class.");
      })
      .finally(() => {
        if (active) setLoadingSettings(false);
      });

    return () => { active = false; };
  }, [selectedId]);

  const selectedClass = useMemo(
    () => classes.find((klass) => classRecordId(klass) === selectedId) || null,
    [classes, selectedId],
  );

  function update(field, value) {
    setSettings((current) => ({
      ...current,
      [field]: value,
      ...(field === "mode" ? { enabled: value !== ATTENDANCE_EMAIL_MODES.OFF } : {}),
      ...(field === "enabled" && !value ? { mode: ATTENDANCE_EMAIL_MODES.OFF } : {}),
      ...(field === "enabled" && value && current.mode === ATTENDANCE_EMAIL_MODES.OFF
        ? { mode: ATTENDANCE_EMAIL_MODES.WEEKLY }
        : {}),
    }));
  }

  async function save() {
    if (!selectedId) return;
    setSaving(true);
    setSettingsError("");
    try {
      const saved = await saveAttendanceEmailSettings(selectedId, settings);
      setSettings((current) => ({ ...current, ...saved }));
      success(`Attendance confirmation emails saved for ${classLabel(selectedClass)}.`);
    } catch (saveError) {
      const message = saveError?.message || "Could not save attendance email automation.";
      setSettingsError(message);
      error(message);
    } finally {
      setSaving(false);
    }
  }

  async function sendWeeklyTestToOwner() {
    setSendingWeeklyTest(true);
    setWeeklyTestResult("");
    try {
      const user = auth?.currentUser;
      if (!user) throw new Error("Sign in as the Falowen administrator.");
      const token = await user.getIdToken();
      const response = await fetch("/api/weekly-engagement-summary?test=1", {
        method: "POST", headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.ok !== true) throw new Error(payload.error || `Test email failed (HTTP ${response.status}).`);
      const message = payload.sent ? "One test email delivered to the owner account." : payload.skipped ? "Test email was already sent this week; the duplicate was skipped." : "The test completed but did not confirm delivery.";
      setWeeklyTestResult(message);
      if (payload.sent) success(message);
    } catch (cause) {
      setWeeklyTestResult(cause?.message || "Could not send the weekly test email.");
    } finally {
      setSendingWeeklyTest(false);
    }
  }

  async function previewWeeklyReport() {
    setPreviewing(true);
    setWeeklyPreview(null);
    setWeeklyPreviewError("");
    try {
      const user = auth?.currentUser;
      if (!user) throw new Error("Sign in to preview the weekly report.");
      const token = await user.getIdToken();
      const response = await fetch(`/api/weekly-engagement-summary?preview=1&period=${weeklyPreviewPeriod}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.ok !== true) throw new Error(payload.error || `Preview failed (HTTP ${response.status}).`);
      setWeeklyPreview(payload);
    } catch (cause) {
      setWeeklyPreviewError(cause?.message || "Could not preview weekly attendance.");
    } finally {
      setPreviewing(false);
    }
  }

  async function sendDueForSelectedClass() {
    if (!selectedId || sendingDue || saving || settings.mode !== ATTENDANCE_EMAIL_MODES.EACH_CLASS) return;
    if (!window.confirm("Send any due, unsent attendance confirmations for " + classLabel(selectedClass) + "? Saved class settings and the lookback window apply.")) return;
    setSendingDue(true);
    setDueResult("");
    try {
      const user = auth?.currentUser;
      if (!user) throw new Error("Sign in as administrator.");
      const token = await user.getIdToken();
      const response = await fetch("/api/attendance-confirmation-emails/send-due", {
        method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ classId: selectedId, confirm: true }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.error || "Delivery not confirmed. Check delivery history before retrying.");
      const message = `Sent ${result.sent || 0} due emails. Previously sent emails are not resent.`;
      setDueResult(message);
      success(message);
    } catch (cause) {
      setDueResult(cause?.message || "Attendance delivery failed.");
      error(cause?.message || "Attendance delivery failed.");
    } finally { setSendingDue(false); }
  }

  async function sendWeeklyReport() {
    if (sendingWeekly || !weeklyPreview?.sendEnabled || weeklyPreviewPeriod !== "previous" || !weeklyPreview.eligibleRecipients) return;
    if (!window.confirm(`Send the completed-week summary to ${weeklyPreview.eligibleRecipients} eligible recipients for ${weeklyPreview.weekStart} to ${weeklyPreview.weekEnd}?`)) return;
    setSendingWeekly(true);
    setWeeklySendResult("");
    try {
      const user = auth?.currentUser;
      if (!user) throw new Error("Sign in as the Falowen administrator.");
      const token = await user.getIdToken();
      const params = new URLSearchParams({ send: "1", period: "previous", weekStart: weeklyPreview.weekStart, recipients: String(weeklyPreview.eligibleRecipients) });
      const response = await fetch(`/api/weekly-engagement-summary?${params}`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.ok !== true) throw new Error(payload.error || "Weekly email delivery failed. Check delivery history before retrying.");
      const message = `Sent: ${payload.sent || 0}. Already sent/skipped: ${payload.skipped || 0}.`;
      setWeeklySendResult(message);
      success(message);
      setWeeklyPreview(null);
    } catch (cause) {
      setWeeklySendResult(cause?.message || "Could not send the weekly report.");
      setWeeklyPreview(null);
    } finally {
      setSendingWeekly(false);
    }
  }

  if (loadingClasses) {
    return (
      <section style={panelStyle}>
        <h2 style={{ margin: 0 }}>Manual attendance confirmation emails</h2>
        <p style={{ margin: 0 }}>Loading your Live Classes…</p>
      </section>
    );
  }

  if (classesError) {
    return (
      <section style={panelStyle}>
        <h2 style={{ margin: 0 }}>Manual attendance confirmation emails</h2>
        <div style={{ padding: 12, border: "1px solid #fecaca", background: "#fef2f2", color: "#991b1b", borderRadius: 10 }}>
          <strong>Classes could not be loaded.</strong>
          <div style={{ marginTop: 4 }}>{classesError}</div>
        </div>
        <div><button type="button" onClick={loadClassesNow}>Try again</button></div>
      </section>
    );
  }

  if (!classes.length) {
    return (
      <section style={panelStyle}>
        <h2 style={{ margin: 0 }}>Manual attendance confirmation emails</h2>
        <div style={{ padding: 14, border: "1px solid #bfdbfe", background: "#eff6ff", borderRadius: 10 }}>
          <strong>No usable Live Class record was found.</strong>
          <p style={{ margin: "6px 0 0" }}>
            This automation works only with classes created in Live Classes. Published-sheet class names without a Firestore Live Class record are no longer selected because their settings cannot be saved.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link to="/live-classes">Open Live Classes</Link>
          <button type="button" onClick={loadClassesNow}>Reload classes</button>
        </div>
      </section>
    );
  }

  const weekly = settings.mode === ATTENDANCE_EMAIL_MODES.WEEKLY;
  const eachClass = settings.mode === ATTENDANCE_EMAIL_MODES.EACH_CLASS;

  return (
    <section style={panelStyle}>
      <div>
        <h2 style={{ margin: 0 }}>Manual attendance confirmation emails</h2>
        <p style={{ margin: "6px 0 0", color: "#475569" }}>
          Choose a Live Class and save its delivery mode. Emails are sent only when an administrator requests them.
        </p>
      </div>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <label style={fieldStyle}>
          <strong>Class</strong>
          <select style={inputStyle} value={selectedId} disabled={sendingDue} onChange={(event) => setSelectedId(event.target.value)}>
            {classes.map((klass) => {
              const id = classRecordId(klass);
              return <option key={id} value={id}>{classLabel(klass)}</option>;
            })}
          </select>
        </label>

        <label style={fieldStyle}>
          <strong>Send frequency</strong>
          <select style={inputStyle} value={settings.mode} onChange={(event) => update("mode", event.target.value)} disabled={loadingSettings || Boolean(settingsError)}>
            <option value={ATTENDANCE_EMAIL_MODES.WEEKLY}>After the final class each week</option>
            <option value={ATTENDANCE_EMAIL_MODES.EACH_CLASS}>After every class</option>
            <option value={ATTENDANCE_EMAIL_MODES.OFF}>Off</option>
          </select>
        </label>

        <label style={fieldStyle}>
          <strong>Wait after class ends</strong>
          <input
            style={inputStyle}
            type="number"
            min="0"
            max="360"
            value={settings.delayMinutes}
            onChange={(event) => update("delayMinutes", event.target.value)}
            disabled={!settings.enabled || loadingSettings || Boolean(settingsError)}
          />
          <small>Minutes. The job also waits until the QR check-in window closes.</small>
        </label>

        <label style={fieldStyle}>
          <strong>Late after</strong>
          <input
            style={inputStyle}
            type="number"
            min="0"
            max="120"
            value={settings.lateMinutes}
            onChange={(event) => update("lateMinutes", event.target.value)}
            disabled={!settings.enabled || loadingSettings || Boolean(settingsError)}
          />
          <small>Minutes after the scheduled lesson begins.</small>
        </label>
      </div>

      {loadingSettings ? <div style={{ padding: 10, background: "#f8fafc", borderRadius: 8 }}>Loading settings for {classLabel(selectedClass)}…</div> : null}

      {settingsError ? (
        <div style={{ padding: 12, border: "1px solid #fecaca", background: "#fef2f2", color: "#991b1b", borderRadius: 10 }}>
          <strong>This class’s settings could not be opened.</strong>
          <div style={{ marginTop: 4 }}>{settingsError}</div>
          <p style={{ margin: "6px 0 0" }}>Open Live Classes and confirm that this class has a valid Firestore class record.</p>
        </div>
      ) : null}

      <label style={fieldStyle}>
        <strong>Correction note</strong>
        <textarea
          style={{ ...inputStyle, minHeight: 72 }}
          value={settings.replyNote}
          onChange={(event) => update("replyNote", event.target.value)}
          disabled={!settings.enabled || loadingSettings || Boolean(settingsError)}
          placeholder="Tell students how to request an attendance correction."
        />
      </label>

      <div style={{ padding: 12, border: "1px solid #bfdbfe", background: "#eff6ff", borderRadius: 10 }}>
        {settings.mode === ATTENDANCE_EMAIL_MODES.OFF
          ? "Attendance emails are disabled for this class."
          : weekly
            ? "Use the manual weekly report below to send the completed-week summary."
            : eachClass
              ? "Send due, unsent per-class confirmations manually using the button below."
              : "Choose a delivery mode."}
      </div>

      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <div><small>Last job check</small><div><strong>{formatDateTime(settings.lastRunAt)}</strong></div></div>
        <div><small>Last successful send</small><div><strong>{formatDateTime(settings.lastSentAt)}</strong></div></div>
        <div><small>Last recipient count</small><div><strong>{settings.lastSentCount || 0}</strong></div></div>
        <div><small>Last status</small><div><strong>{settings.lastStatus || "Not yet"}</strong></div></div>
      </div>

      {settings.lastError ? (
        <div style={{ padding: 12, border: "1px solid #fecaca", background: "#fef2f2", color: "#991b1b", borderRadius: 10 }}>
          <strong>Delivery job error:</strong> {settings.lastError}
        </div>
      ) : null}

      <section style={{ border: "1px solid #bfdbfe", background: "#f8fbff", borderRadius: 12, padding: 14, display: "grid", gap: 10 }}>
        <h3 style={{ margin: 0, color: "#1d4ed8" }}>New weekly attendance + participation email</h3>
        <p style={{ margin: 0, fontSize: 13, color: "#475569" }}>Preview the completed week before sending via Apps Script. There is no automatic weekly schedule for this report. Student sending remains disabled until the existing cutover setting is enabled.</p>
        <label style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}><strong>Reporting period</strong><select value={weeklyPreviewPeriod} disabled={sendingWeekly} onChange={(event) => { setWeeklyPreviewPeriod(event.target.value); setWeeklyPreview(null); }} style={inputStyle}><option value="previous">Previous week (completed)</option><option value="current">Current week</option></select></label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button type="button" onClick={previewWeeklyReport} disabled={previewing || sendingWeekly}>{previewing ? "Checking records…" : "Preview weekly report (no emails)"}</button>
          <button type="button" onClick={sendWeeklyTestToOwner} disabled={sendingWeeklyTest}>{sendingWeeklyTest ? "Sending test…" : "Send test weekly email to administrator"}</button>
        </div>
        {weeklySendResult ? <p role="status" style={{ margin: 0, fontSize: 13 }}>{weeklySendResult}</p> : null}
        {weeklyTestResult ? <p role="status" style={{ margin: 0, fontSize: 13, overflowWrap: "anywhere" }}>{weeklyTestResult}</p> : null}
        {weeklyPreviewError && <p role="alert" style={{ color: "#b91c1c", margin: 0, overflowWrap: "anywhere" }}>{weeklyPreviewError}</p>}
        {weeklyPreview && <div role="status" style={{ display: "grid", gap: 8 }}>
          <strong>{weeklyPreview.weekStart} to {weeklyPreview.weekEnd} · {weeklyPreview.eligibleRecipients} eligible student summaries</strong>
          <small>{weeklyPreview.sendEnabled ? "Manual sending is enabled" : "Manual sending remains disabled until cutover is verified"}</small>
          {weeklyPreviewPeriod === "previous" && weeklyPreview.sendEnabled && weeklyPreview.eligibleRecipients > 0 && (
            <button type="button" onClick={sendWeeklyReport} disabled={sendingWeekly || previewing}>
              {sendingWeekly ? "Sending…" : "Send weekly report to students"}
            </button>
          )}
          <div style={{ display: "grid", gap: 6 }}>
            {(weeklyPreview.classes || []).map((row) => <div key={row.classId} style={{ borderTop: "1px solid #dbeafe", paddingTop: 6, display: "flex", justifyContent: "space-between", gap: 12 }}>
              <span>{row.className}</span>
              <strong style={{ textAlign: "right" }}>{row.skipped
                ? `Excluded (${row.mode})`
                : `${row.lessonsHeld || 0} held · ${row.recipients || 0} recipients · ${row.attended || 0} attendance records present/late · ${row.late || 0} late · ${row.excused || 0} excused · ${row.absent || 0} absent · ${row.participationTurns || 0} participation turns`}</strong>
            </div>)}
          </div>
        </div>}
      </section>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" onClick={save} disabled={!selectedId || saving || loadingSettings || Boolean(settingsError)}>
          {saving ? "Saving…" : "Save settings"}
        </button>
        <button type="button" onClick={loadClassesNow} disabled={saving || sendingDue}>Reload classes</button>
        {eachClass && <button type="button" onClick={sendDueForSelectedClass} disabled={sendingDue || saving || loadingSettings || Boolean(settingsError)}>{sendingDue ? "Sending…" : "Send due attendance emails"}</button>}
      </div>
      {dueResult && <p role="status">{dueResult}</p>}
    </section>
  );
}

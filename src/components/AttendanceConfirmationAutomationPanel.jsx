import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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

  if (loadingClasses) {
    return (
      <section style={panelStyle}>
        <h2 style={{ margin: 0 }}>Automatic attendance confirmation emails</h2>
        <p style={{ margin: 0 }}>Loading your Live Classes…</p>
      </section>
    );
  }

  if (classesError) {
    return (
      <section style={panelStyle}>
        <h2 style={{ margin: 0 }}>Automatic attendance confirmation emails</h2>
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
        <h2 style={{ margin: 0 }}>Automatic attendance confirmation emails</h2>
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
        <h2 style={{ margin: 0 }}>Automatic attendance confirmation emails</h2>
        <p style={{ margin: "6px 0 0", color: "#475569" }}>
          Choose a real Live Class, select how often students should receive attendance confirmation, then save once.
        </p>
      </div>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <label style={fieldStyle}>
          <strong>Class</strong>
          <select style={inputStyle} value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
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
          ? "Automatic attendance emails are disabled for this class."
          : weekly
            ? "Each student receives one personalized weekly summary after the final scheduled lesson of the week."
            : eachClass
              ? "Each student receives a personalized Present, Late, Absent or Excused confirmation after every lesson."
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

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" onClick={save} disabled={!selectedId || saving || loadingSettings || Boolean(settingsError)}>
          {saving ? "Saving…" : "Save automation"}
        </button>
        <button type="button" onClick={loadClassesNow} disabled={saving}>Reload classes</button>
      </div>
    </section>
  );
}

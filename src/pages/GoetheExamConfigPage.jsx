import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "../context/ToastContext.jsx";
import { GOETHE_EXAM_CONFIG_URL, loadGoetheExamConfig, saveGoetheExamConfig } from "../services/goetheExamConfigService.js";

const card = { border: "1px solid #dbe2ea", borderRadius: 12, background: "#fff", padding: 16, display: "grid", gap: 12 };
const input = { padding: 9, border: "1px solid #cbd5e1", borderRadius: 8, width: "100%", boxSizing: "border-box" };
const Field = ({ label, children }) => <label style={{ display: "grid", gap: 5 }}><strong>{label}</strong>{children}</label>;

function csv(value, numeric = false) {
  return String(value || "").split(",").map((item) => numeric ? Number(item.trim()) : item.trim().toLowerCase()).filter((item) => numeric ? Number.isFinite(item) : Boolean(item));
}
function formatDate(value) {
  if (!value) return "Not published yet";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not published yet" : date.toLocaleString("en-GB", { timeZone: "Africa/Accra", dateStyle: "medium", timeStyle: "short" });
}

export default function GoetheExamConfigPage() {
  const toast = useToast();
  const [config, setConfig] = useState(null);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function reload() {
    setLoading(true); setError("");
    try {
      const result = await loadGoetheExamConfig();
      setConfig(result.config); setMeta(result);
    } catch (cause) { setError(cause?.message || "Could not load Goethe settings."); }
    finally { setLoading(false); }
  }
  useEffect(() => { reload(); }, []);

  const upcomingCount = useMemo(() => (config?.levels || []).reduce((sum, level) => sum + (level.exams || []).length, 0), [config]);
  const root = (name, value) => setConfig((current) => ({ ...current, [name]: value }));
  const reminder = (name, value) => setConfig((current) => ({ ...current, reminder: { ...current.reminder, [name]: value } }));
  const levelField = (levelIndex, name, value) => setConfig((current) => ({ ...current, levels: current.levels.map((level, index) => index === levelIndex ? { ...level, [name]: value } : level) }));
  const examField = (levelIndex, examIndex, name, value) => setConfig((current) => ({ ...current, levels: current.levels.map((level, index) => index !== levelIndex ? level : { ...level, exams: level.exams.map((exam, row) => row === examIndex ? { ...exam, [name]: value } : exam) }) }));
  const addExam = (levelIndex) => setConfig((current) => ({ ...current, levels: current.levels.map((level, index) => index === levelIndex ? { ...level, exams: [...level.exams, { date: "", registrationStart: "", registrationEnd: "" }] } : level) }));
  const removeExam = (levelIndex, examIndex) => setConfig((current) => ({ ...current, levels: current.levels.map((level, index) => index === levelIndex ? { ...level, exams: level.exams.filter((_, row) => row !== examIndex) } : level) }));

  async function publish() {
    setSaving(true); setError("");
    try {
      const result = await saveGoetheExamConfig(config);
      setConfig(result.config); setMeta(result);
      toast.success("Goethe settings published to Admin, Falowen and the reminder endpoint.");
    } catch (cause) {
      const message = cause?.message || "Could not publish Goethe settings.";
      setError(message); toast.error(message);
    } finally { setSaving(false); }
  }

  if (loading) return <div style={{ padding: 16 }}>Loading Goethe Exam File settings…</div>;
  return <div style={{ padding: 16, display: "grid", gap: 14 }}>
    <header><h1 style={{ margin: 0 }}>Goethe Exam File</h1><p style={{ color: "#475569" }}>Set exam dates once for Falowen, Admin and the email reminder script.</p><Link to="/communication">Communication</Link></header>
    {error ? <div style={{ padding: 12, borderRadius: 8, background: "#fef2f2", color: "#991b1b" }}>{error}</div> : null}
    <section style={{ ...card, background: "#eff6ff" }}><strong>Shared endpoint</strong><code style={{ overflowWrap: "anywhere" }}>{GOETHE_EXAM_CONFIG_URL}</code><small>Source: {meta.source || "default"} · Published: {formatDate(meta.updatedAt)} · Version {config?.version || 1} · {upcomingCount} exam rows</small></section>

    {config ? <>
      <section style={card}><h2 style={{ margin: 0 }}>General and reminders</h2><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 10 }}>
        <Field label="Timezone"><input style={input} value={config.timezone} onChange={(e) => root("timezone", e.target.value)} /></Field>
        <Field label="Exam File URL"><input style={input} value={config.examFileUrl} onChange={(e) => root("examFileUrl", e.target.value)} /></Field>
        <Field label="Goethe URL"><input style={input} value={config.goetheUrl} onChange={(e) => root("goetheUrl", e.target.value)} /></Field>
        <Field label="Sender name"><input style={input} value={config.senderName} onChange={(e) => root("senderName", e.target.value)} /></Field>
        <Field label="Reply-to"><input style={input} type="email" value={config.replyTo} onChange={(e) => root("replyTo", e.target.value)} /></Field>
        <Field label="Minimum contract weeks"><input style={input} type="number" min="0" value={config.reminder.minContractWeeks} onChange={(e) => reminder("minContractWeeks", Number(e.target.value))} /></Field>
        <Field label="Reminder days"><input style={input} value={config.reminder.reminderDays.join(", ")} onChange={(e) => reminder("reminderDays", csv(e.target.value, true))} /></Field>
        <Field label="Account setup days"><input style={input} type="number" min="0" value={config.reminder.accountSetupDaysBefore} onChange={(e) => reminder("accountSetupDaysBefore", Number(e.target.value))} /></Field>
        <Field label="Eligible statuses"><input style={input} value={config.reminder.allowedStatuses.join(", ")} onChange={(e) => reminder("allowedStatuses", csv(e.target.value))} /></Field>
      </div></section>

      {config.levels.map((level, levelIndex) => <details key={level.level} style={card} open={levelIndex < 3}><summary style={{ cursor: "pointer", fontWeight: 800 }}>{level.level} · {level.title} ({level.exams.length} dates)</summary>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10 }}>
          <Field label="Title"><input style={input} value={level.title} onChange={(e) => levelField(levelIndex, "title", e.target.value)} /></Field>
          <Field label="Registration URL"><input style={input} value={level.registrationUrl} onChange={(e) => levelField(levelIndex, "registrationUrl", e.target.value)} /></Field>
          <Field label="Price"><input style={input} value={level.price} onChange={(e) => levelField(levelIndex, "price", e.target.value)} /></Field>
          <Field label="Location"><input style={input} value={level.location} onChange={(e) => levelField(levelIndex, "location", e.target.value)} /></Field>
        </div>
        <div style={{ overflowX: "auto" }}><table style={{ width: "100%", minWidth: 650, borderCollapse: "collapse" }}><thead><tr><th>Exam date</th><th>Registration opens</th><th>Registration closes</th><th /></tr></thead><tbody>
          {level.exams.map((exam, examIndex) => <tr key={`${level.level}-${exam.date}-${examIndex}`}><td><input style={input} type="date" value={exam.date} onChange={(e) => examField(levelIndex, examIndex, "date", e.target.value)} /></td><td><input style={input} type="date" value={exam.registrationStart} onChange={(e) => examField(levelIndex, examIndex, "registrationStart", e.target.value)} /></td><td><input style={input} type="date" value={exam.registrationEnd} onChange={(e) => examField(levelIndex, examIndex, "registrationEnd", e.target.value)} /></td><td><button type="button" onClick={() => removeExam(levelIndex, examIndex)}>Remove</button></td></tr>)}
        </tbody></table></div><button type="button" onClick={() => addExam(levelIndex)}>Add exam date</button>
      </details>)}

      <section style={{ ...card, position: "sticky", bottom: 8 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}><strong>Publish once to all three systems</strong><div style={{ display: "flex", gap: 8 }}><button onClick={reload} disabled={saving}>Reload</button><button onClick={publish} disabled={saving}>{saving ? "Publishing…" : "Publish Goethe settings"}</button></div></div></section>
    </> : null}
  </div>;
}

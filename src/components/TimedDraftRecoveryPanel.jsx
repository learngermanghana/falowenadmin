import { useState } from "react";
import { auth } from "../firebase";
import { useAuth } from "../context/AuthContext";

const yesterdayUtc = () => new Date(Date.now() - 86400000).toISOString().slice(0, 10);
const prettyTime = millis => Number(millis) ? new Date(Number(millis)).toLocaleString("en-GB") : "—";
const box = { border: "1px solid #cbd5e1", borderRadius: 12, padding: 12, display: "grid", gap: 8 };
const statuses = {
  recoverable: { label: "Saved draft available", color: "#047857" },
  "already-submitted": { label: "Already submitted / scored", color: "#166534" },
  "no-cloud-draft": { label: "No cloud draft", color: "#b45309" },
  "empty-cloud-draft": { label: "Empty draft", color: "#b45309" },
  "needs-review": { label: "Manual review required", color: "#b45309" },
  "lookup-error": { label: "Lookup incomplete", color: "#b91c1c" },
  unsupported: { label: "Unsupported assignment", color: "#b91c1c" },
};
async function staffRequest(path, options = {}) {
  const current = auth?.currentUser;
  if (!current) throw new Error("Please sign in as a staff member.");
  const response = await fetch(path, {
    ...options,
    headers: { Authorization: "Bearer " + await current.getIdToken(), ...(options.body ? { "Content-Type": "application/json" } : {}) },
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.ok) throw new Error(payload?.error || "The draft recovery service is unavailable.");
  return payload;
}
export default function TimedDraftRecoveryPanel() {
  const { isStaff } = useAuth();
  const [date, setDate] = useState(yesterdayUtc);
  const [student, setStudent] = useState("");
  const [assignmentKey, setAssignmentKey] = useState("");
  const [report, setReport] = useState(null);
  const [busy, setBusy] = useState(false);
  const [recovering, setRecovering] = useState("");
  const [expanded, setExpanded] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  if (!isStaff) return null;

  const loadReport = async (event) => {
    event?.preventDefault?.();
    setBusy(true); setError(""); setMessage(""); setReport(null);
    try {
      const params = new URLSearchParams({ date });
      if (student.trim()) params.set("student", student.trim());
      if (assignmentKey.trim()) params.set("assignmentKey", assignmentKey.trim().toUpperCase());
      setReport(await staffRequest("/api/admin/timed-drafts?" + params.toString()));
    } catch (cause) { setError(cause.message || "Could not scan saved cloud drafts."); }
    finally { setBusy(false); }
  };
  const recover = async row => {
    if (row.state !== "recoverable" || !row.draftId) return;
    const label = (row.studentEmail || row.studentId) + " · " + row.assignmentKey;
    if (!window.confirm("Recover this saved draft and submit it to Falowen AI marking?\n\n" + label
      + "\n\nThe original draft, timer history and any existing score will be preserved. This cannot be undone automatically.")) return;
    setRecovering(row.timerId); setError(""); setMessage("");
    try {
      const result = await staffRequest("/api/admin/timed-drafts/recover", {
        method: "POST",
        body: JSON.stringify({
          timerId: row.timerId, draftId: row.draftId, confirmation: "RECOVER SAVED DRAFT",
        }),
      });
      setMessage("Recovered " + label + " at " + result.submissionPath + ". Marking is now queued.");
      setReport(current => current ? { ...current, cases: current.cases.map(item =>
        item.timerId === row.timerId ? { ...item, state: "already-submitted",
          reason: "Recovered and queued for marking.", submissionPaths: [result.submissionPath] } : item) } : current);
    } catch (cause) { setError(cause.message || "Recovery did not complete. No confirmation was received."); }
    finally { setRecovering(""); }
  };
  return (
    <section aria-label="Recover timed assignment drafts" data-testid="timed-draft-recovery" style={{ ...box, background: "#f8fafc" }}>
      <h3 style={{ margin: 0 }}>Recover missing timed submissions from saved drafts</h3>
      <p style={{ margin: 0, fontSize: 13, color: "#475569" }}>
        Scan a date or find a specific student. This checks original timed attempts, saved Firestore drafts,
        submitted-work records and scores. Nothing is resubmitted by scanning.
      </p>
      <form onSubmit={loadReport} style={{ display: "flex", gap: 8, alignItems: "end", flexWrap: "wrap" }}>
        <label style={{ display: "grid", gap: 4, flex: "1 1 135px", fontSize: 13 }}>Attempt end date (UTC)
          <input aria-label="Recovery date" type="date" value={date} max={new Date().toISOString().slice(0, 10)}
            onChange={event => setDate(event.target.value)} required style={{ padding: 9, borderRadius: 7, border: "1px solid #94a3b8" }}/>
        </label>
        <label style={{ display: "grid", gap: 4, flex: "2 1 195px", fontSize: 13 }}>Student email or UID (optional)
          <input aria-label="Recovery student" value={student} onChange={event => setStudent(event.target.value)}
            placeholder="Search all or enter student email/UID" style={{ padding: 9, borderRadius: 7, border: "1px solid #94a3b8" }}/>
        </label>
        <label style={{ display: "grid", gap: 4, flex: "1 1 135px", fontSize: 13 }}>Assignment (optional)
          <input aria-label="Recovery assignment" value={assignmentKey} onChange={event => setAssignmentKey(event.target.value)}
            placeholder="A1-14.1" style={{ padding: 9, borderRadius: 7, border: "1px solid #94a3b8" }}/>
        </label>
        <button type="submit" disabled={busy || Boolean(recovering)}
          style={{ border: 0, background: "#1d4ed8", color: "white", padding: 12, borderRadius: 8, fontWeight: 700 }}>
          {busy ? "Scanning…" : "Find saved drafts"}
        </button>
      </form>
      {error && <p role="alert" style={{ margin: 0, color: "#b91c1c" }}>{error}</p>}
      {message && <p role="status" style={{ margin: 0, color: "#166534" }}>{message}</p>}
      {report && <div data-testid="draft-recovery-report" style={{ display: "grid", gap: 10 }}>
        <strong>{report.cases?.length || 0} timed attempts examined</strong>
        {report.incomplete && <p role="alert" style={{ margin: 0, color: "#92400e" }}>
          Scan limit reached. Results are incomplete; search a student directly before concluding their draft is missing.
        </p>}
        {report.warning && <p style={{ margin: 0, color: "#92400e" }}>{report.warning}</p>}
        {!(report.cases || []).length && <p>No ended timed attempts found for these filters. This is not proof that no older drafts exist.</p>}
        {(report.cases || []).map(row => {
          const info = statuses[row.state] || statuses["needs-review"];
          const open = expanded === row.timerId;
          return <article key={row.timerId} style={{ ...box, background: "#fff" }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "space-between" }}>
              <strong>{row.assignmentKey || "Unknown assignment"} · {row.studentEmail || row.studentId || "Unknown student"}</strong>
              <strong style={{ color: info.color }}>{info.label}</strong>
            </div>
            <div style={{ color: "#475569", fontSize: 13 }}>
              Timer: {row.timerStatus || "unknown"} · Ended: {prettyTime(row.endsAt)} ·
              Cloud draft saved: {prettyTime(row.draftUpdatedAt)} · {row.textLength || 0} characters
            </div>
            <p style={{ fontSize: 13, margin: 0 }}>{row.reason}</p>
            {row.submissionPaths?.length ? <small>Saved submission: {row.submissionPaths.join(", ")}</small> : null}
            {row.textLength > 0 && <>
              <button type="button" onClick={() => setExpanded(open ? "" : row.timerId)}
                style={{ justifySelf: "start", padding: 8, border: "1px solid #94a3b8", borderRadius: 8, background: "white" }}>
                {open ? "Hide saved answers" : "Preview saved answers"}
              </button>
              {open && <pre data-testid="saved-draft-preview" style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere",
                maxHeight: 300, overflow: "auto", background: "#f1f5f9", padding: 12, borderRadius: 8 }}>{row.draftText}</pre>}
            </>}
            {row.state === "recoverable" && <button type="button" disabled={Boolean(recovering)}
              onClick={() => recover(row)} style={{ justifySelf: "start", border: 0, color: "white",
                background: "#047857", borderRadius: 8, fontWeight: 700, padding: "10px 14px" }}>
              {recovering === row.timerId ? "Recovering…" : "Recover & send for auto-marking"}
            </button>}
          </article>;
        })}
      </div>}
      <small style={{ color: "#64748b" }}>
        Drafts saved only on the student’s device cannot be read by Admin. Do not reset expired attempts while investigating them.
        Recovery never changes an existing score or automatically retries every student.
      </small>
    </section>
  );
}

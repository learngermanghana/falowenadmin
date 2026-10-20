import { useState } from "react";
import { auth } from "../firebase";
import { useAuth } from "../context/AuthContext";

const todayUtc = () => new Date().toISOString().slice(0, 10);
const yesterdayUtc = () => new Date(Date.now() - 86400000).toISOString().slice(0, 10);
const displayTime = value => Number(value) ? new Date(Number(value)).toLocaleString("en-GB", {
  dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Accra",
}) + " GMT" : "Not recorded";
const frame = { border: "1px solid #cbd5e1", borderRadius: 12, padding: 12, display: "grid", gap: 10 };
const input = { minHeight: 40, border: "1px solid #94a3b8", borderRadius: 8, padding: "8px 10px", width: "100%", boxSizing: "border-box" };
const btn = { border: "1px solid #94a3b8", borderRadius: 8, padding: "9px 12px", background: "#fff", cursor: "pointer" };
async function request(path, options = {}) {
  const user = auth?.currentUser;
  if (!user) throw new Error("Sign in before opening saved student drafts.");
  const response = await fetch(path, {
    ...options, cache: "no-store",
    headers: { Authorization: "Bearer " + await user.getIdToken(),
      ...(options.body ? { "Content-Type": "application/json" } : {}) },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || data?.ok !== true) throw new Error(data?.error || "Draft service is unavailable.");
  return data;
}
export default function DraftHistoryPanel() {
  const { user } = useAuth();
  const [from, setFrom] = useState(yesterdayUtc);
  const [to, setTo] = useState(yesterdayUtc);
  const [studentEmail, setStudentEmail] = useState("");
  const [filter, setFilter] = useState(null);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [currentCursor, setCurrentCursor] = useState("");
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState("");
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [recovering, setRecovering] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  if (String(user?.email || "").toLowerCase() !== "moxflex@gmail.com") {
    return <p role="status">Saved student drafts are available to the verified Falowen owner account only.</p>;
  }

  async function fetchPage(criteria, cursor = "", direction = "new") {
    setBusy(true); setError(""); setNotice("");
    try {
      const params = new URLSearchParams({ from: criteria.from, to: criteria.to });
      if (criteria.studentEmail) params.set("studentEmail", criteria.studentEmail.toLowerCase());
      if (cursor) params.set("cursor", cursor);
      const response = await request("/api/admin/draft-history?" + params.toString());
      setResult(response);
      setExpanded(""); setDetail(null);
      if (direction === "new") {
        setFilter(criteria); setHistory([]); setCurrentCursor("");
      } else if (direction === "next") {
        setHistory(items => [...items, currentCursor]); setCurrentCursor(cursor);
      } else if (direction === "previous") {
        setHistory(items => items.slice(0, -1)); setCurrentCursor(cursor);
      }
    } catch (cause) { setError(cause.message || "Could not load saved drafts."); }
    finally { setBusy(false); }
  }

  async function openDraft(row) {
    if (expanded === row.id) { setExpanded(""); setDetail(null); return; }
    setExpanded(row.id); setDetail(null); setDetailLoading(true); setError(""); setNotice("");
    try { setDetail(await request("/api/admin/draft-history/" + encodeURIComponent(row.id))); }
    catch (cause) { setError(cause.message || "Could not preview this draft."); }
    finally { setDetailLoading(false); }
  }

  async function recover(row) {
    const decision = detail?.assessment;
    if (decision?.eligible !== true || !decision.timerId) return;
    if (!window.confirm("Recover the saved draft for " + (row.studentEmail || row.studentId)
      + " · " + row.assignmentKey + " and submit it for AI marking?\n"
      + "This is a real submission; the original saved work and timer history will remain unchanged.")) return;
    setRecovering(row.id); setError(""); setNotice("");
    try {
      const outcome = await request("/api/admin/timed-drafts/recover", {
        method: "POST", body: JSON.stringify({
          timerId: decision.timerId, draftId: row.id, confirmation: "RECOVER SAVED DRAFT",
        }),
      });
      setNotice("Submission recovered at " + outcome.submissionPath + ". Check Results for the score after marking.");
      setResult(previous => previous ? { ...previous, rows: previous.rows.map(entry =>
        entry.id === row.id ? { ...entry, status: "recovered", recoveredSubmissionPath: outcome.submissionPath } : entry) } : previous);
      setDetail(previous => previous ? { ...previous,
        draft: { ...previous.draft, status: "recovered", recoveredSubmissionPath: outcome.submissionPath },
        assessment: { ...previous.assessment, eligible: false, state: "already-submitted",
          reason: "Recovered and submitted for marking." } } : previous);
    } catch (cause) { setError(cause.message || "No recovery confirmation was returned."); }
    finally { setRecovering(""); }
  }

  return (
    <section aria-label="Saved assignment drafts" data-testid="results-draft-history"
      style={{ ...frame, background: "#f8fafc" }}>
      <div>
        <h3 style={{ margin: "0 0 5px" }}>Saved Drafts · Student Work History</h3>
        <p style={{ margin: 0, fontSize: 13, color: "#475569" }}>
          View all cloud-saved student work in the chosen date range, whether or not it was submitted.
          Dates filter by <strong>last cloud save</strong>, not exam start time. Time shown in Ghana (GMT).
        </p>
      </div>
      <form onSubmit={event => {
        event.preventDefault();
        void fetchPage({ from, to, studentEmail: studentEmail.trim() });
      }} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(175px,1fr))", gap: 10, alignItems: "end" }}>
        <label style={{ display: "grid", gap: 4, fontSize: 13 }}>From date
          <input aria-label="Drafts from date" type="date" value={from} max={todayUtc()} onChange={event => setFrom(event.target.value)} style={input} required />
        </label>
        <label style={{ display: "grid", gap: 4, fontSize: 13 }}>To date
          <input aria-label="Drafts to date" type="date" value={to} max={todayUtc()} onChange={event => setTo(event.target.value)} style={input} required />
        </label>
        <label style={{ display: "grid", gap: 4, fontSize: 13 }}>Student email (optional)
          <input aria-label="Filter draft student email" type="email" placeholder="All students" value={studentEmail}
            onChange={event => setStudentEmail(event.target.value)} style={input}/>
        </label>
        <button type="submit" disabled={busy || Boolean(recovering)}
          style={{ ...btn, background: "#1d4ed8", color: "#fff", border: 0, fontWeight: 800 }}>
          {busy ? "Loading…" : "Search saved drafts"}
        </button>
      </form>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        <button type="button" style={btn} onClick={() => { const day = yesterdayUtc(); setFrom(day); setTo(day); }}>Yesterday</button>
        <button type="button" style={btn} onClick={() => { const day = todayUtc(); setFrom(day); setTo(day); }}>Today</button>
        <button type="button" style={btn} onClick={() => { setFrom(new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10)); setTo(todayUtc()); }}>Last 7 days</button>
      </div>
      {error && <p role="alert" style={{ margin: 0, color: "#b91c1c" }}>{error}</p>}
      {notice && <p role="status" style={{ margin: 0, color: "#166534", fontWeight: 700 }}>{notice}</p>}
      {result && <div style={{ display: "grid", gap: 10 }}>
        <p style={{ margin: 0, fontSize: 13 }}>
          <strong>{result.rows.length} saved drafts on this page</strong> · Filter: {filter?.from} to {filter?.to}
          {filter?.studentEmail ? " · " + filter.studentEmail : " · all students"}
        </p>
        {result.incomplete && <p role="alert" style={{ margin: 0, color: "#92400e" }}>
          This student has more than 150 draft records. Search is capped to control costs; these results are not exhaustive.
        </p>}
        {result.message && <p style={{ margin: 0, color: "#92400e" }}>{result.message}</p>}
        {!result.rows.length && <p>No cloud drafts were last saved in this date range. Local-only browser answers are not available here.</p>}
        {result.rows.map(row => <article key={row.id} style={{ ...frame, background: "#fff" }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "space-between" }}>
            <strong>{row.assignmentKey || "Unknown assignment"} · {row.studentName || row.studentEmail || row.studentId || "Unknown learner"}</strong>
            <span style={{ color: row.status === "recovered" ? "#047857" : "#1d4ed8", fontWeight: 700, fontSize: 13 }}>
              {row.status === "recovered" ? "Recovered submission" : "Cloud draft saved"}
            </span>
          </div>
          <div style={{ fontSize: 13, color: "#475569" }}>
            {row.studentEmail || "No email"}{row.studentCode ? " · " + row.studentCode : ""}
            {" · Last saved: "}{displayTime(row.updatedAt)}
            {" · "}{row.answerLength || 0} characters
          </div>
          {row.title && <div style={{ fontSize: 13 }}>{row.title}</div>}
          <div>
            <button type="button" style={btn} onClick={() => openDraft(row)}
              disabled={busy || Boolean(recovering)}>
              {expanded === row.id ? "Close draft" : "View saved answers and submission status"}
            </button>
          </div>
          {expanded === row.id && <div style={{ display: "grid", gap: 10 }}>
            {detailLoading && <p>Loading this draft and checking its submission state…</p>}
            {detail?.draft.id === row.id && <>
              <div style={{ background: "#f1f5f9", borderRadius: 8, padding: 12, fontSize: 13 }}>
                <strong>Saved content</strong>
                <pre data-testid="draft-history-answer-preview" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word",
                  maxHeight: 330, overflowY: "auto", marginBottom: 0 }}>{detail.answer || "(Empty saved draft)"}</pre>
                {detail.answerTruncated && <p>Preview is limited to 30,000 characters.</p>}
              </div>
              <div style={{ color: "#334155", fontSize: 13 }}>
                <b>Submission check:</b> {detail.assessment?.reason || "Status not verified."}
                {detail.draft.recoveredSubmissionPath && <p>Recovered path: {detail.draft.recoveredSubmissionPath}</p>}
                {detail.assessment?.submissionPaths?.length > 0 &&
                  <p>Existing submissions: {detail.assessment.submissionPaths.join(", ")}</p>}
              </div>
              {detail.assessment?.eligible &&
                <button type="button" disabled={Boolean(recovering)} onClick={() => recover(row)}
                  style={{ ...btn, justifySelf: "start", background: "#047857", color: "#fff", border: 0 }}>
                  {recovering === row.id ? "Recovering…" : "Recover & send for auto-marking"}
                </button>}
            </>}
          </div>}
        </article>)}
        {!filter?.studentEmail && <nav aria-label="Draft history pagination" style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <button type="button" disabled={busy || history.length === 0} style={btn}
            onClick={() => void fetchPage(filter, history.at(-1), "previous")}>Previous page</button>
          <button type="button" disabled={busy || !result.nextCursor} style={btn}
            onClick={() => void fetchPage(filter, result.nextCursor, "next")}>Next page</button>
          <small>25 drafts per page · load next only when needed</small>
        </nav>}
      </div>}
      <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
        Cost protection: nothing loads until Search is clicked, the date scan reads at most 26 drafts per page,
        and answers/submission checks load only for the selected draft. No live listener, continuous polling, or AI calls.
        Viewing never changes scores or submits work.
      </p>
    </section>
  );
}

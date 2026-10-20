import { useState } from "react";
import { auth } from "../firebase";
import { useAuth } from "../context/AuthContext";
import "./DraftHistoryPanel.css";

const dateUtc = offset => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);
const savedTime = value => Number(value) ? new Date(Number(value)).toLocaleString("en-GB", {
  day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  timeZone: "Africa/Accra",
}) + " GMT" : "Not recorded";
const labels = {
  unchecked: ["Submission not checked", "unchecked"],
  "not-submitted": ["Not submitted", "unsubmitted"],
  "submitted-unmarked": ["Submitted · not marked", "submitted"],
  marking: ["Submitted · marking queued", "submitted"],
  marked: ["Marked", "marked"],
  "needs-review": ["Needs manual review", "review"],
};
function Status({ status }) {
  const [label, theme] = labels[status] || labels.unchecked;
  return <span className={"draft-history-status draft-history-status--" + theme}>{label}</span>;
}
async function authorizedRequest(path, options = {}) {
  const current = auth?.currentUser;
  if (!current) throw new Error("Sign in to Falowen Admin to view drafts.");
  const response = await fetch(path, {
    ...options, cache: "no-store",
    headers: { Authorization: "Bearer " + await current.getIdToken(),
      ...(options.body ? { "Content-Type": "application/json" } : {}) },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || data?.ok !== true) throw new Error(data?.error || "Saved draft service is unavailable.");
  return data;
}
export default function DraftHistoryPanel() {
  const { user } = useAuth();
  const [from, setFrom] = useState(() => dateUtc(-1));
  const [to, setTo] = useState(() => dateUtc(-1));
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

  if (String(user?.email || "").trim().toLowerCase() !== "moxflex@gmail.com") {
    return <p role="status">Saved drafts are available to the verified Falowen owner account only.</p>;
  }

  const readPage = async (criteria, cursor = "", direction = "new") => {
    setBusy(true); setError(""); setNotice("");
    try {
      const params = new URLSearchParams({ from: criteria.from, to: criteria.to });
      if (criteria.studentEmail) params.set("studentEmail", criteria.studentEmail.toLowerCase());
      if (cursor) params.set("cursor", cursor);
      const data = await authorizedRequest("/api/admin/draft-history?" + params);
      setResult(data); setExpanded(""); setDetail(null);
      if (direction === "new") {
        setFilter(criteria); setHistory([]); setCurrentCursor("");
      } else if (direction === "next") {
        setHistory(items => [...items, currentCursor]); setCurrentCursor(cursor);
      } else if (direction === "previous") {
        setHistory(items => items.slice(0, -1)); setCurrentCursor(cursor);
      }
    } catch (cause) { setError(cause?.message || "Could not load saved drafts."); }
    finally { setBusy(false); }
  };

  const openDraft = async row => {
    if (expanded === row.id) { setExpanded(""); setDetail(null); return; }
    setExpanded(row.id); setDetail(null); setDetailLoading(true); setError(""); setNotice("");
    try { setDetail(await authorizedRequest("/api/admin/draft-history/" + encodeURIComponent(row.id))); }
    catch (cause) { setError(cause?.message || "Could not check this saved draft."); }
    finally { setDetailLoading(false); }
  };

  const recover = async row => {
    const decision = detail?.assessment;
    if (decision?.eligible !== true || !decision.timerId) return;
    if (!window.confirm("Recover the expired draft for " + (row.studentEmail || row.studentId)
      + " · " + row.assignmentKey + " and submit it for AI marking?\n\n"
      + "Review the saved answers first. Original drafts and existing scores will be preserved.")) return;
    setRecovering(row.id); setError(""); setNotice("");
    try {
      const response = await authorizedRequest("/api/admin/timed-drafts/recover", {
        method: "POST", body: JSON.stringify({
          timerId: decision.timerId, draftId: row.id, confirmation: "RECOVER SAVED DRAFT",
        }),
      });
      setNotice("Submission recovered and sent to marking: " + response.submissionPath);
      setResult(current => current ? { ...current, rows: current.rows.map(item => item.id === row.id
        ? { ...item, status: "recovered", recoveredSubmissionPath: response.submissionPath } : item) } : current);
      setDetail(current => current ? { ...current,
        draft: { ...current.draft, status: "recovered", recoveredSubmissionPath: response.submissionPath },
        submission: { status: "marking", reason: "Saved draft recovered; marking will run in the ordinary queue.",
          submissionPath: response.submissionPath },
        assessment: { ...current.assessment, eligible: false } } : current);
    } catch (cause) { setError(cause?.message || "Recovery could not be verified."); }
    finally { setRecovering(""); }
  };

  const queueMarking = async row => {
    const submission = detail?.submission;
    if (!submission?.canQueue || !submission.submissionPath) return;
    if (!window.confirm("Send the EXISTING saved submission for AI marking?\n\n"
      + row.assignmentKey + " · " + (row.studentEmail || row.studentId)
      + "\n\nThis is only for missing marking jobs. No second final submission will be created.")) return;
    setRecovering(row.id); setError(""); setNotice("");
    try {
      const data = await authorizedRequest("/api/admin/draft-history/" + encodeURIComponent(row.id) + "/queue-marking", {
        method: "POST", body: JSON.stringify({
          submissionPath: submission.submissionPath, confirmation: "QUEUE EXISTING SUBMISSION",
        }),
      });
      setNotice(data.message || "Existing submission queued for AI marking.");
      setDetail(current => current ? { ...current,
        submission: { ...current.submission, status: "marking", canQueue: false,
          reason: "Marking job queued. Refresh the draft later to view the result." } } : current);
    } catch (cause) { setError(cause?.message || "Could not safely queue marking."); }
    finally { setRecovering(""); }
  };

  return <section className="draft-history-root" aria-label="Saved student assignment drafts" data-testid="results-draft-history">
    <header>
      <h3>Saved Drafts</h3>
      <p className="draft-history-desc">Track the last saved work for every student, including attempts not finally submitted.
        Dates use the cloud save time (Ghana GMT). Viewing is read-only.</p>
    </header>
    <form className="draft-history-form" onSubmit={event => {
      event.preventDefault();
      void readPage({ from, to, studentEmail: studentEmail.trim() });
    }}>
      <label>From date
        <input type="date" aria-label="Drafts from date" value={from} max={dateUtc(0)} required onChange={event => setFrom(event.target.value)}/>
      </label>
      <label>To date
        <input type="date" aria-label="Drafts to date" value={to} max={dateUtc(0)} required onChange={event => setTo(event.target.value)}/>
      </label>
      <label>Student email (optional)
        <input type="email" aria-label="Filter draft student email" placeholder="All students" value={studentEmail}
          onChange={event => setStudentEmail(event.target.value)}/>
      </label>
      <button className="draft-history-button draft-history-button--primary" type="submit"
        disabled={busy || Boolean(recovering)}>{busy ? "Searching…" : "Search drafts"}</button>
    </form>
    <div className="draft-history-shortcuts">
      <button className="draft-history-button" type="button" onClick={() => { setFrom(dateUtc(-1)); setTo(dateUtc(-1)); }}>Yesterday</button>
      <button className="draft-history-button" type="button" onClick={() => { setFrom(dateUtc(0)); setTo(dateUtc(0)); }}>Today</button>
      <button className="draft-history-button" type="button" onClick={() => { setFrom(dateUtc(-6)); setTo(dateUtc(0)); }}>Last 7 days</button>
    </div>
    {error && <p className="draft-history-feedback draft-history-feedback--error" role="alert">{error}</p>}
    {notice && <p className="draft-history-feedback draft-history-feedback--success" role="status">{notice}</p>}
    {result && <div className="draft-history-list">
      <p className="draft-history-desc"><strong>{result.rows.length} drafts shown</strong> · {filter?.from} to {filter?.to}
        {filter?.studentEmail ? " · " + filter.studentEmail : " · all students"}</p>
      {result.incomplete && <p role="alert" className="draft-history-warning">
        The student search reached its read limit. Narrow the range; these results may be incomplete.</p>}
      {result.message && <p className="draft-history-warning">{result.message}</p>}
      {!result.rows.length && <p className="draft-history-desc">No cloud drafts were last saved in this date range.
        Answers saved only in a student's browser do not appear here.</p>}
      {result.rows.map(row => {
        const selected = expanded === row.id;
        const current = selected && detail?.draft?.id === row.id ? detail : null;
        const state = current?.submission?.status || (row.submissionHint === "recovered" ? "marking" : "unchecked");
        return <article key={row.id} className="draft-history-card">
          <div className="draft-history-card-header">
            <h4>{row.assignmentKey || "Assignment"} · {row.studentName || row.studentEmail || row.studentId || "Unknown student"}</h4>
            <Status status={state}/>
          </div>
          <p className="draft-history-card-meta">
            {row.studentEmail || "Email unavailable"}{row.studentCode ? " · " + row.studentCode : ""}
          </p>
          <p className="draft-history-card-meta">Saved {savedTime(row.updatedAt)} · {row.answerLength || 0} characters</p>
          {row.title && <p className="draft-history-card-course">{row.title}</p>}
          <div className="draft-history-actions">
            <button className="draft-history-button" type="button" disabled={busy || Boolean(recovering)}
              aria-expanded={selected} onClick={() => void openDraft(row)}>
              {selected ? "Close details" : "Open answers & check submission"}
            </button>
          </div>
          {selected && <div className="draft-history-detail">
            {detailLoading && <p className="draft-history-desc">Checking saved answers, final submission and marking status…</p>}
            {current && <>
              <div className="draft-history-answer">
                <strong>Saved student answers</strong>
                <pre data-testid="draft-history-answer-preview">{current.answer || "(No answer text saved)"}</pre>
                {current.answerTruncated && <p className="draft-history-warning">Only the first 30,000 characters are shown.</p>}
              </div>
              {row.answerLength > 0 && row.answerLength < 20 &&
                <p className="draft-history-warning">This saved draft is very short. Verify that it contains real student answers before recovering or marking it.</p>}
              <div className="draft-history-receipt">
                <strong><Status status={current.submission?.status || "needs-review"}/></strong>
                <span>{current.submission?.reason || "The final submission could not be verified."}</span>
                {current.submission?.score != null && <strong>Saved score: {current.submission.score}/100</strong>}
                {current.submission?.submissionPath && <small>Submission: {current.submission.submissionPath}</small>}
              </div>
              {current.submission?.status === "not-submitted" && <p className="draft-history-desc">
                <strong>Recovery check:</strong> {current.assessment?.reason || "No eligible timed attempt found."}
              </p>}
              {current.submission?.status === "needs-review" && <p className="draft-history-desc">
                Check <a href="/marking">Marking Hub</a> before retrying. No automatic duplicate marking will be started.
              </p>}
              <div className="draft-history-actions">
                {current.submission?.status === "not-submitted" && current.assessment?.eligible &&
                  <button className="draft-history-button draft-history-button--mark" type="button"
                    disabled={Boolean(recovering)} onClick={() => void recover(row)}>
                    {recovering === row.id ? "Recovering…" : "Recover draft & send for marking"}
                  </button>}
                {current.submission?.status === "submitted-unmarked" && current.submission?.canQueue &&
                  <button className="draft-history-button draft-history-button--mark" type="button"
                    disabled={Boolean(recovering)} onClick={() => void queueMarking(row)}>
                    {recovering === row.id ? "Queuing…" : "Send saved submission to AI marking"}
                  </button>}
              </div>
              {current.draft?.recoveredSubmissionPath &&
                <p className="draft-history-muted">Earlier recovery: {current.draft.recoveredSubmissionPath}</p>}
            </>}
          </div>}
        </article>;
      })}
      {!filter?.studentEmail && <nav aria-label="Draft pagination" className="draft-history-pages">
        <button className="draft-history-button" type="button" disabled={busy || !history.length}
          onClick={() => void readPage(filter, history.at(-1), "previous")}>Previous page</button>
        <button className="draft-history-button" type="button" disabled={busy || !result.nextCursor}
          onClick={() => void readPage(filter, result.nextCursor, "next")}>Next page</button>
        <small className="draft-history-muted">25 drafts per page · more on demand</small>
      </nav>}
    </div>}
    <p className="draft-history-muted">Cost controls: search only on request, 25 draft summaries per page,
      and status/answer reads only for the record you open. No polling or AI work while browsing.
      Marking actions require confirmation and never overwrite an existing score.</p>
  </section>;
}

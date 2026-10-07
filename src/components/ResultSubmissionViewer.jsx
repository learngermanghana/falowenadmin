import { useEffect, useState } from "react";
import { fetchSubmissions } from "../services/markingService.js";
import { matchingResultSubmissions, submittedWorkFiles, submittedWorkText } from "../utils/studentResultSubmissions.js";

export default function ResultSubmissionViewer({ row, studentCode, level }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState({ loading: false, submissions: [], error: "" });
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetchSubmissions(row.level || level, studentCode).then((submissions) => {
      if (!cancelled) setState({ loading: false, submissions: matchingResultSubmissions(row, submissions, studentCode), error: "" });
    }).catch((error) => {
      if (!cancelled) setState({ loading: false, submissions: [], error: error?.message || "Could not load submitted work. Close and reopen to retry." });
    });
    return () => { cancelled = true; };
  }, [open, row, studentCode, level]);

  return <div>
    <button type="button" aria-expanded={open} disabled={!studentCode} onClick={() => { if (!open) setState({ loading: true, submissions: [], error: "" }); setOpen((value) => !value); }}>{open ? "Hide submitted work" : "View submitted work"}</button>
    {open ? <section aria-label="Submitted work" style={{ marginTop: 8, padding: 12, border: "1px solid #cbd5e1", borderRadius: 8, minWidth: 260, maxWidth: 620 }}>
      {state.loading ? <p role="status">Loading submitted work...</p> : null}
      {state.error ? <p role="alert">{state.error}</p> : null}
      {!state.loading && !state.error && !state.submissions.length ? <p>No saved submission found for this student and assignment. Older results may have a score without the original work.</p> : null}
      {state.submissions.map((submission) => <article key={submission.path || submission.id} style={{ marginBottom: 14 }}>
        <strong>{submission.attempt ? `Attempt ${submission.attempt}` : "Submission"}</strong>
        <p style={{ margin: "4px 0" }}>{submission.createdAt ? new Date(submission.createdAt).toLocaleString("en-GB", { timeZone: "Africa/Lagos" }) : "Submission date unavailable"} · {submission.status}</p>
        <p style={{ margin: "4px 0", color: "#475569" }}>{submission.linkedToResult ? "Linked to this result" : "Matching assignment submission; the exact work used for this score is not confirmed."}</p>
        <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontFamily: "inherit", maxHeight: 400, overflowY: "auto" }}>{submittedWorkText(submission) || "No written answer saved. Check submitted files below."}</pre>
        {submittedWorkFiles(submission).map((file) => <p key={file.url}><a href={file.url} target="_blank" rel="noopener noreferrer">{file.name}</a></p>)}
      </article>)}
    </section> : null}
  </div>;
}

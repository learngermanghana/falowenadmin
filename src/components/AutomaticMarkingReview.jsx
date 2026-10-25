import { useEffect, useState } from 'react';
import { filterMarkingInbox, markingInboxCategory } from '../utils/markingInbox.js';
import './AutomaticMarkingReview.css';
import { closeAutomaticMarkingReview, loadAutomaticMarkingPage, loadMarkingHealth, openAutomaticMarking, saveAutomaticMarkingReview } from '../services/automaticMarkingReviewService.js';
import { assignmentTitle } from '../utils/assignmentTitle.js';
import { auth } from '../firebase.js';
import { automaticPublicationLabel, automaticReviewReasons, isAutomaticResultPublished } from '../utils/automaticReviewStatus.js';

export default function AutomaticMarkingReview() {
  const [page, setPage] = useState({ rows: [], cursor: null, hasMore: false });
  const [detail, setDetail] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const [reason, setReason] = useState('');
  const [inboxView, setInboxView] = useState('review');
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('');
  const [editing, setEditing] = useState(false);
  const [health, setHealth] = useState(null);
  const [healthBusy, setHealthBusy] = useState(false);
  const [healthError, setHealthError] = useState('');
  async function refreshHealth() {
    setHealthBusy(true); setHealthError('');
    try { setHealth(await loadMarkingHealth()); }
    catch (err) { setHealthError(err.message); }
    finally { setHealthBusy(false); }
  }
  async function load(more = false) {
    setBusy(true); setError('');
    try {
      const next = await loadAutomaticMarkingPage(more ? page.cursor : null);
      setPage(previous => ({ ...next, rows: more ? [...previous.rows, ...next.rows] : next.rows }));
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  useEffect(() => { load(); }, []);
  async function open(row) {
    setBusy(true); setError(''); setMessage(''); setDetail(null);
    try {
      const next = await openAutomaticMarking(row);
      setDetail(next); setEditing(false); setScore(String(next.score?.score ?? row.finalScore ?? row.result?.finalScore ?? row.result?.score ?? ''));
      setFeedback(next.score?.comments || row.feedback || row.result?.feedback || ''); setReason('');
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  async function save(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      await saveAutomaticMarkingReview(detail, { score, feedback, reason });
      setDetail(null);
      setMessage('Result published to the student. Background synchronization is queued.');
      await load();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  async function approveResult() {
    setBusy(true); setError(''); setMessage('');
    try {
      await saveAutomaticMarkingReview(detail, { approve: true });
      setDetail(null); setMessage('AI result approved and published to the student.'); await load();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  async function closeReview() {
    if ((String(detail.score?.score ?? detail.row.finalScore ?? '') !== score
      || (detail.score?.comments || detail.row.feedback || detail.row.result?.feedback || '') !== feedback || reason)
      && !window.confirm('Close without saving your edits? The saved score and feedback will stay unchanged.')) return;
    setBusy(true); setError('');
    try {
      await closeAutomaticMarkingReview(detail);
      setPage(previous => ({ ...previous, rows: previous.rows.map(row => row.id === detail.row.id
        ? { ...row, reviewClosedAt: new Date().toISOString() } : row) }));
      setDetail(null); setMessage('Review closed. Find it again with Show reviewed.');
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  const visibleRows = filterMarkingInbox(page.rows, { view: inboxView, search, level });
  const views = [['review', 'Needs attention'], ['failed', 'Failed results'], ['issues', 'Marking issues'], ['published', 'Published'], ['all', 'All results']];
  const reviewReasonSummary = row => {
    const reasons = (row.publicationReviewReasons || row.result?.reviewReasons || [])
      .map(reason => typeof reason === 'string' ? reason : reason?.message || reason?.reason || reason?.code || '')
      .filter(Boolean);
    if (isAutomaticResultPublished(row)) return '—';
    return reasons.length ? reasons[0] + (reasons.length > 1 ? ` (+${reasons.length - 1} more)` : '')
      : 'Open for marking evidence';
  };
  const original = detail?.audit?.result || detail?.row.result;
  return <section className="marking-card automatic-marking-inbox" aria-label="Automatic marking audit">
    <header className="marking-inbox-heading"><div><h2>Marking inbox</h2><p>New results first. Valid passes publish automatically; failed assessments need your review.</p></div><button type="button" disabled={busy} onClick={() => load()}>Refresh results</button></header>
    <nav className="marking-inbox-views" aria-label="Result status">{views.map(([value, label]) => <button key={value} type="button" aria-pressed={inboxView === value} onClick={() => setInboxView(value)}>{label} <span>{page.rows.filter(row => value === 'all' || (value === 'review' ? !isAutomaticResultPublished(row) : markingInboxCategory(row) === value)).length}</span></button>)}</nav>
    <div className="marking-inbox-filters"><label>Find student or assignment<input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Name, email, student code or A1-14.1" /></label><label>Level<select value={level} onChange={event => setLevel(event.target.value)}><option value="">All levels</option>{['A1', 'A2', 'B1'].map(value => <option key={value}>{value}</option>)}</select></label></div>
    <p className="marking-inbox-count">Showing {visibleRows.length} of {page.rows.length} loaded results · Newest first · Counts and filters apply to loaded results{page.hasMore ? '; load more for earlier work.' : '.'}</p>
    {String(auth.currentUser?.email || '').toLowerCase() === 'moxflex@gmail.com' && <details className="marking-inbox-health" aria-label="Marking health" style={{ padding: 12, border: '1px solid #cbd5e1', borderRadius: 8, marginBottom: 16 }}>
      <summary>Marking health · diagnostics</summary>
      <p>Check queued, delayed, review-required and Sheet sync jobs without scanning all student submissions.</p>
      <button type="button" disabled={healthBusy} onClick={refreshHealth}>{healthBusy ? 'Checking…' : 'Check marking health'}</button>
      {healthError && <p role="alert">{healthError}</p>}
      {health && <div>
        <p role="status">Checked {new Date(health.checkedAt).toLocaleString()}. These are bounded samples, not system-wide totals.</p>
        <p>Marking pending: {health.samples.pending.sampled}{health.samples.pending.capped ? '+' : ''} · Running: {health.samples.marking.sampled}{health.samples.marking.capped ? '+' : ''} · Tutor review: {health.samples.needs_review.sampled}{health.samples.needs_review.capped ? '+' : ''}</p>
        <p>Sheet export pending: {health.sheetSync.pending.sampled}{health.sheetSync.pending.capped ? '+' : ''} · Sheet export review: {health.sheetSync.needs_review.sampled}{health.sheetSync.needs_review.capped ? '+' : ''}</p>
        {health.rows.some(row => row.overdue || row.status === 'needs_review') && <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', textAlign: 'left' }}>
          <thead><tr><th>Assignment</th><th>Student code</th><th>Marking status</th><th>Attempts</th><th>Reason</th></tr></thead>
          <tbody>{health.rows.filter(row => row.overdue || row.status === 'needs_review').slice(0, 25).map(row => <tr key={row.id}>
            <td>{row.assignmentKey || 'Unknown'}</td><td>{row.studentCode || 'See saved submission'}</td>
            <td>{row.overdue ? 'Delayed · ' : ''}{row.status}</td><td>{row.attempts}</td><td>{row.error || row.errorKind || 'Check submission receipt in Saved Drafts'}</td>
          </tr>)}</tbody>
        </table></div>}
        <p>For a verified submission with no marking job, open Results → Saved Drafts → Check submission. Recovery is available only if the job and score are truly missing.</p>
      </div>}
    </details>}
    {busy && <p role="status">Loading…</p>}
    {error && <p role="alert">{error}</p>}
    {message && <p role="status">{message}</p>}
    <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', textAlign: 'left' }}>
      <thead><tr><th>Assessed</th><th>Student</th><th>Assignment</th><th>Score</th><th>Status</th><th>Review reason</th><th>Action</th></tr></thead>
      <tbody>{visibleRows.map(row => <tr key={row.id}>
        <td><time dateTime={row.createdAt}>{row.createdAt ? new Date(row.createdAt).toLocaleString('en-GB', { timeZone: 'Africa/Accra', dateStyle: 'medium', timeStyle: 'short' }) : 'Date unavailable'}</time></td>
        <td>{row.studentName || row.studentCode || row.studentId || 'Student'}</td>
        <td>{assignmentTitle(row.assignmentTitle, row.assignment, row.result?.assignmentKey, row.assignmentId)}</td>
        <td>{row.finalScore ?? '—'}</td>
        <td><span className={`marking-inbox-status marking-inbox-status-${markingInboxCategory(row)}`}>{isAutomaticResultPublished(row) ? automaticPublicationLabel(row) : markingInboxCategory(row) === 'failed' ? 'Failed · review' : 'Marking issue · review'}</span></td>
        <td style={{ maxWidth: 280, overflowWrap: 'anywhere' }}>{reviewReasonSummary(row)}</td>
        <td><button type="button" disabled={busy} onClick={() => open(row)}>Open & review</button></td>
      </tr>)}</tbody>
    </table></div>
    {!busy && !visibleRows.length && <p>No results match these filters in the loaded page.{page.hasMore ? ' Load more to check the next page.' : ''}</p>}
    {page.hasMore && <button type="button" disabled={busy} onClick={() => load(true)}>Load more</button>}
    {detail && <article style={{ marginTop: 24 }}>
      <p><strong>Status: {automaticPublicationLabel(detail.row)}</strong></p>
      {!isAutomaticResultPublished(detail.row) && <section aria-label="Review reasons"><h3>Why review is needed</h3>
        <ul>{automaticReviewReasons(detail).map(item => <li key={item}>{item}</li>)}</ul>
      </section>}
      <h3>Submitted work</h3>
      <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{detail.submission.submissionText || detail.submission.text || detail.submission.answer || detail.submission.workContent || 'No text available'}</pre>
      <h3>{original?.finalScore == null && original?.score == null ? 'No AI score · marking stopped' : 'Original AI result'}</h3>
      {original?.finalScore == null && original?.score == null
        ? <p>Automatic marking did not produce a score. Review the reason above, then enter a tutor score and feedback if appropriate.</p>
        : <><p>Score: {original.finalScore ?? original.score}/100 · Confidence: {original.confidence ?? '—'}</p>
          <p style={{ whiteSpace: 'pre-wrap' }}>{original.feedback}</p></>}
      <details><summary>Marking evidence and answer key</summary><pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{JSON.stringify(detail.audit || original, null, 2)}</pre></details>
      {detail.row.tutorReview && <p>Last tutor correction: {detail.row.tutorReview.reason}</p>}
      {detail.reviews?.length > 0 && <details><summary>Tutor correction history</summary>
        <ul>{detail.reviews.map(review => <li key={review.id}>
          {review.createdAt} · {review.previousScore} → {review.score}/100 · {review.reason} · Tutor: {review.tutorUid}
        </li>)}</ul>
      </details>}
      {detail.studentPath ? <div>
        {!isAutomaticResultPublished(detail.row) && <button type="button" disabled={busy || !Number.isFinite(Number(original?.finalScore ?? original?.score)) || !original?.feedback} onClick={approveResult}>Approve {original?.finalScore ?? original?.score ?? 'AI result'}/100 & publish</button>}
        <button type="button" disabled={busy} onClick={() => setEditing(value => !value)}>{editing ? 'Hide editor' : 'Edit & publish'}</button>
        {editing && <form onSubmit={save} style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        <h3>Edit & publish</h3>
        <p>A manual score is the tutor’s final decision. The original AI result remains saved above.</p>
        <label>Final score /100 <input type="number" min="0" max="100" step="1" required value={score} onChange={event => setScore(event.target.value)} disabled={busy} /></label>
        <label>Feedback<textarea rows={6} required value={feedback} onChange={event => setFeedback(event.target.value)} disabled={busy} style={{ display: 'block', width: '100%' }} /></label>
        <label>Reason for correction<textarea required value={reason} onChange={event => setReason(event.target.value)} disabled={busy} style={{ display: 'block', width: '100%' }} /></label>
        <button type="submit" disabled={busy}>Save & publish to student</button>
      </form>}</div> : <p>The registered student could not be resolved. Reopen this result or use Submissions to mark.</p>}
      {isAutomaticResultPublished(detail.row)
        ? <button type="button" disabled={busy} onClick={closeReview}>Close review · mark reviewed</button>
        : <><p>Approve or edit and publish before marking this work reviewed.</p><button type="button" disabled={busy} onClick={() => setDetail(null)}>Back to pending list</button></>}
    </article>}
  </section>;
}

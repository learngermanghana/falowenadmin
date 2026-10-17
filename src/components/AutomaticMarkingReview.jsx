import { useEffect, useState } from 'react';
import { loadAutomaticMarkingPage, openAutomaticMarking, saveAutomaticMarkingReview } from '../services/automaticMarkingReviewService.js';
import { assignmentTitle } from '../utils/assignmentTitle.js';

export default function AutomaticMarkingReview() {
  const [page, setPage] = useState({ rows: [], cursor: null, hasMore: false });
  const [detail, setDetail] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const [reason, setReason] = useState('');
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
      setDetail(next); setScore(String(next.score?.score ?? row.finalScore ?? ''));
      setFeedback(next.score?.comments || row.feedback || row.result?.feedback || ''); setReason('');
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  async function save(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      await saveAutomaticMarkingReview(detail, { score, feedback, reason });
      setDetail(null);
      setMessage('Tutor correction saved. Sheet sync is queued.');
      await load();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  const original = detail?.audit?.result || detail?.row.result;
  return <section className="marking-card" aria-label="Automatic marking audit">
    <h2>AI-marked work</h2>
    <p>Open saved work to check the AI decision. Corrections keep the original AI evidence and queue a Sheet update.</p>
    <button type="button" disabled={busy} onClick={() => load()}>Refresh</button>
    {busy && <p role="status">Loading…</p>}
    {error && <p role="alert">{error}</p>}
    {message && <p role="status">{message}</p>}
    <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', textAlign: 'left' }}>
      <thead><tr><th>Student</th><th>Assignment</th><th>Score</th><th>Status</th><th>Action</th></tr></thead>
      <tbody>{page.rows.map(row => <tr key={row.id}>
        <td>{row.studentName || row.studentCode || row.studentId || 'Student'}</td>
        <td>{assignmentTitle(row.assignmentTitle, row.assignment, row.result?.assignmentKey, row.assignmentId)}</td>
        <td>{row.finalScore ?? '—'}</td>
        <td>{row.tutorReview ? 'Tutor reviewed' : row.status === 'marked' ? 'AI-marked' : 'Needs review'}</td>
        <td><button type="button" disabled={busy} onClick={() => open(row)}>Open & review</button></td>
      </tr>)}</tbody>
    </table></div>
    {!busy && !page.rows.length && <p>No automatically marked work found.</p>}
    {page.hasMore && <button type="button" disabled={busy} onClick={() => load(true)}>Load more</button>}
    {detail && <article style={{ marginTop: 24 }}>
      <h3>Submitted work</h3>
      <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{detail.submission.submissionText || detail.submission.text || detail.submission.answer || detail.submission.workContent || 'No text available'}</pre>
      <h3>Original AI result</h3>
      <p>Score: {original?.finalScore ?? original?.score ?? '—'}/100 · Confidence: {original?.confidence ?? '—'}</p>
      <p style={{ whiteSpace: 'pre-wrap' }}>{original?.feedback}</p>
      <details><summary>Marking evidence and answer key</summary><pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{JSON.stringify(detail.audit || original, null, 2)}</pre></details>
      {detail.row.tutorReview && <p>Last tutor correction: {detail.row.tutorReview.reason}</p>}
      {detail.reviews?.length > 0 && <details><summary>Tutor correction history</summary>
        <ul>{detail.reviews.map(review => <li key={review.id}>
          {review.createdAt} · {review.previousScore} → {review.score}/100 · {review.reason} · Tutor: {review.tutorUid}
        </li>)}</ul>
      </details>}
      {detail.score ? <form onSubmit={save} style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        <h3>Tutor correction</h3>
        <p>A manual score is the tutor’s final decision. The original AI result remains saved above.</p>
        <label>Final score /100 <input type="number" min="0" max="100" step="1" required value={score} onChange={event => setScore(event.target.value)} disabled={busy} /></label>
        <label>Feedback<textarea rows={6} required value={feedback} onChange={event => setFeedback(event.target.value)} disabled={busy} style={{ display: 'block', width: '100%' }} /></label>
        <label>Reason for correction<textarea required value={reason} onChange={event => setReason(event.target.value)} disabled={busy} style={{ display: 'block', width: '100%' }} /></label>
        <button type="submit" disabled={busy}>Save tutor correction & sync Sheet</button>
      </form> : <p>This work has no uniquely linked published score. Use Submissions to mark for tutor marking.</p>}
      <button type="button" disabled={busy} onClick={() => setDetail(null)}>Close review</button>
    </article>}
  </section>;
}

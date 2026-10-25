import { useEffect, useRef, useState } from 'react';
import { filterMarkingInbox, markingInboxCategory } from '../utils/markingInbox.js';
import './AutomaticMarkingReview.css';
import { closeAutomaticMarkingReview, loadAutomaticMarkingPage, loadMarkingHealth, openAutomaticMarking, saveAutomaticMarkingReview, searchAutomaticMarkingResults } from '../services/automaticMarkingReviewService.js';
import answersDictionary from '../data/answers_dictionary.json';
import { bundledReferenceForAssignment, buildAutomaticMarkingReport, compareMarkingReferences, findUnkeyedSubmittedAnswers } from '../utils/automaticMarkingReport.js';
import { computeObjectiveScore } from '../utils/objectiveMarking.js';
import { calculateWeightedMarkingOutcome } from '../utils/markingScorePolicy.js';
import { getA2B1WritingRequirement } from '../utils/a2B1WritingCadence.js';
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
  const [historicalRows, setHistoricalRows] = useState(null);
  const [searchedFor, setSearchedFor] = useState('');
  const [searchBusy, setSearchBusy] = useState(false);
  const [reportFallback, setReportFallback] = useState('');
  const [recheck, setRecheck] = useState(null);
  const [tutorWritingPoints, setTutorWritingPoints] = useState('');
  const [recheckError, setRecheckError] = useState('');
  const [recheckApplied, setRecheckApplied] = useState(false);
  const reviewRef = useRef(null);
  useEffect(() => {
    if (detail) reviewRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [detail]);
  async function findHistory(event) {
    event?.preventDefault();
    if (!search.trim()) { setHistoricalRows(null); setSearchedFor(''); return; }
    setSearchBusy(true); setError(''); setMessage('');
    try {
      const found = await searchAutomaticMarkingResults(search);
      setHistoricalRows(found); setSearchedFor(search.trim()); setInboxView('all');
    } catch (err) { setError(err.message); }
    finally { setSearchBusy(false); }
  }
  function clearHistory() {
    setHistoricalRows(null); setSearchedFor(''); setSearch(''); setInboxView('review');
  }
  async function copyFullReport() {
    const current = bundledReferenceForAssignment(answersDictionary,
      detail?.row?.assignmentId || detail?.row?.result?.assignmentKey);
    const report = buildAutomaticMarkingReport(detail, current);
    if (!report) return;
    try {
      await navigator.clipboard.writeText(report);
      setReportFallback(''); setMessage('Full debug report copied. Review personal details in student text before sharing.');
    } catch {
      setReportFallback(report);
      setMessage('Clipboard was blocked. Select and copy the report from the field below.');
    }
  }
  function recheckObjectiveAnswers() {
    if (!detail) return;
    setRecheckError(''); setRecheckApplied(false);
    try {
      const assignmentId = detail.row.assignmentId || detail.row.result?.assignmentKey || '';
      const reference = bundledReferenceForAssignment(answersDictionary, assignmentId);
      const submissionText = detail.submission.submissionText || detail.submission.text ||
        detail.submission.answer || detail.submission.workContent || '';
      if (!reference || !submissionText.trim()) throw new Error('The student submission or current answer key is missing.');
      const result = computeObjectiveScore(reference, submissionText);
      // Detect numbered submitted questions that have no answer in the chosen key.
      // Do not offer a one-click score correction for a partial key.
      const unkeyedParts = findUnkeyedSubmittedAnswers(submissionText, reference);
      if (!result.totalCount) throw new Error('No objective questions could be checked.');
      const assignmentWriting = getA2B1WritingRequirement({ level: assignmentId.split('-')[0], assignmentId });
      const objectivePercent = result.correctCount * 100 / result.totalCount;
      const writing = tutorWritingPoints === '' ? null : Number(tutorWritingPoints);
      if (writing !== null && (!Number.isFinite(writing) || writing < 0 || writing > 40)) {
        throw new Error('Enter writing marks between 0 and 40.');
      }
      const outcome = calculateWeightedMarkingOutcome({
        level: assignmentId.split('-')[0], assignmentId,
        objectiveScore: objectivePercent, objectiveDetails: result.details,
        writingPercent: writing === null ? null : (writing / 40) * 100,
        hasWriting: writing !== null, writingRequiredOverride: assignmentWriting
      });
      setRecheck({ ...result, outcome, assignmentWriting, unkeyedParts, referenceVersion: reference.version || 'Unversioned Admin bundle' });
    } catch (err) { setRecheck(null); setRecheckError(err.message); }
  }
  function useRecheckedScore() {
    if (!recheck || recheck.outcome.writingRequiredButMissing || recheck.unkeyedParts.length) return;
    setScore(String(recheck.outcome.finalScore));
    setRecheckApplied(true);
    setReason('Tutor rechecked original answers against the current Admin answer key; revised objective result ' +
      recheck.correctCount + '/' + recheck.totalCount + ' and reviewed final score.');
    setEditing(true);
    setMessage('Rechecked score loaded into the tutor editor. Review feedback and save only after confirming every question belongs to this key.');
  }
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
    setBusy(true); setError(''); setMessage(''); setDetail(null); setReportFallback(''); setRecheck(null); setTutorWritingPoints(''); setRecheckError(''); setRecheckApplied(false);
    try {
      const next = await openAutomaticMarking(row);
      setDetail(next); setEditing(false); setScore(String(next.score?.score ?? row.finalScore ?? row.result?.finalScore ?? row.result?.score ?? ''));
      setFeedback(next.score?.comments || row.feedback || row.result?.feedback || ''); setReason('');
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  async function save(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      const verifiedRecheck = recheckApplied && recheck ? {
        finalScore: recheck.outcome.finalScore,
        objectiveCorrect: recheck.correctCount, objectiveTotal: recheck.totalCount,
        objectiveScore: 100 * recheck.correctCount / recheck.totalCount,
        objectiveDetails: recheck.details,
        writingScore: recheck.assignmentWriting ? Number(tutorWritingPoints) : null,
        writingScorePercent: recheck.assignmentWriting ? Number(tutorWritingPoints) * 2.5 : null,
        maxWritingScore: recheck.assignmentWriting ? 40 : null,
        writingMinimumMet: recheck.outcome.writingMinimumMet,
        scoreBreakdown: recheck.outcome.scoreBreakdown,
        referenceVersion: recheck.referenceVersion,
      } : null;
      await saveAutomaticMarkingReview(detail, { score, feedback, reason, verifiedRecheck });
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
  const sourceRows = historicalRows ?? page.rows;
  const visibleRows = filterMarkingInbox(sourceRows, { view: inboxView, search: historicalRows ? '' : search, level });
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
  const currentReference = detail ? bundledReferenceForAssignment(answersDictionary,
    detail.row.assignmentId || detail.row.result?.assignmentKey) : null;
  const referenceComparison = detail ? compareMarkingReferences(detail.audit?.referenceEntry, currentReference) : null;
  const availableObjectiveDetails = detail?.row?.tutorRecheck && detail?.score?.objectiveDetails
    ? detail.score.objectiveDetails : original?.objectiveDetails;
  const objectiveDetails = availableObjectiveDetails && typeof availableObjectiveDetails === 'object'
    ? Object.entries(availableObjectiveDetails) : [];
  return <section className="marking-card automatic-marking-inbox" aria-label="Student work and marking review">
    <header className="marking-inbox-heading"><div><h2>Student work &amp; marking review</h2><p>Find any saved AI-marked result, compare answer references and correct scores. New results first.</p></div><button type="button" disabled={busy} onClick={() => load()}>Refresh results</button></header>
    {error && <p role="alert">{error}</p>}
    {message && <p role="status">{message}</p>}
    <div className="marking-inbox-list" hidden={Boolean(detail)}>
    <nav className="marking-inbox-views" aria-label="Result status">{views.map(([value, label]) => <button key={value} type="button" aria-pressed={inboxView === value} onClick={() => setInboxView(value)}>{label} <span>{page.rows.filter(row => value === 'all' || (value === 'review' ? !isAutomaticResultPublished(row) : markingInboxCategory(row) === value)).length}</span></button>)}</nav>
    <form className="marking-inbox-filters" onSubmit={findHistory}>
      <label>Find student or assignment<input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Name, email, code or A2-6.17" /></label>
      <label>Level<select value={level} onChange={event => setLevel(event.target.value)}><option value="">All levels</option>{['A1', 'A2', 'B1'].map(value => <option key={value}>{value}</option>)}</select></label>
      <div className="marking-search-actions"><button type="submit" disabled={searchBusy || search.trim().length < 2}>{searchBusy ? 'Searching…' : 'Find older work'}</button>
        {historicalRows !== null && <button type="button" onClick={clearHistory}>Back to recent</button>}</div>
    </form>
    <p className="marking-inbox-count">{historicalRows !== null
      ? 'Search: "' + searchedFor + '" · ' + visibleRows.length + ' matching AI-marked results from bounded lookups. Name search is prefix-based; searches do not scan all records.'
      : 'Showing ' + visibleRows.length + ' of ' + page.rows.length + ' recent loaded results. For older work, use Find older work.'}</p>
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
    <div className="marking-inbox-table" style={{ overflowX: 'auto' }}><table style={{ width: '100%', textAlign: 'left' }}>
      <thead><tr><th>Assessed</th><th>Student</th><th>Assignment</th><th>Score</th><th>Status</th><th>Review reason</th><th>Action</th></tr></thead>
      <tbody>{visibleRows.map(row => <tr key={row.id}>
        <td><time dateTime={row.createdAt}>{row.createdAt ? new Date(row.createdAt).toLocaleString('en-GB', { timeZone: 'Africa/Accra', dateStyle: 'medium', timeStyle: 'short' }) : 'Date unavailable'}</time></td>
        <td><strong>{row.studentName || row.name || row.studentEmail || row.studentCode || row.studentId || 'Name unavailable'}</strong><small style={{ display: 'block', color: '#526078', marginTop: 4 }}>{[row.studentEmail, row.studentCode].filter(Boolean).join(' · ')}{row.identityUnavailable ? ' · Identity lookup unavailable' : ''}</small></td>
        <td>{assignmentTitle(row.assignmentTitle, row.assignment, row.result?.assignmentKey, row.assignmentId)}</td>
        <td>{row.finalScore ?? '—'}</td>
        <td><span className={`marking-inbox-status marking-inbox-status-${markingInboxCategory(row)}`}>{isAutomaticResultPublished(row) ? automaticPublicationLabel(row) : markingInboxCategory(row) === 'failed' ? 'Failed · review' : 'Marking issue · review'}</span></td>
        <td style={{ maxWidth: 280, overflowWrap: 'anywhere' }}>{reviewReasonSummary(row)}</td>
        <td><button type="button" disabled={busy} onClick={() => open(row)}>Open & review</button></td>
      </tr>)}</tbody>
    </table></div>
    <div className="marking-mobile-results" aria-label="Student results">{visibleRows.map(row => <article className="marking-mobile-result" key={row.id}>
      <div className="marking-mobile-result-top"><strong>{row.studentName || row.name || row.studentCode || 'Student'}</strong><strong>{row.finalScore ?? '—'}/100</strong></div>
      <p>{assignmentTitle(row.assignmentTitle, row.assignment, row.result?.assignmentKey, row.assignmentId)}</p>
      <p><span className={'marking-inbox-status marking-inbox-status-' + markingInboxCategory(row)}>{isAutomaticResultPublished(row) ? automaticPublicationLabel(row) : markingInboxCategory(row) === 'failed' ? 'Failed · review' : 'Marking issue · review'}</span></p>
      <p className="marking-mobile-reason">{reviewReasonSummary(row)}</p>
      <button type="button" disabled={busy} onClick={() => open(row)}>Open student work</button>
    </article>)}</div>
    {!busy && !visibleRows.length && <p>No matching results in this set.{historicalRows === null && page.hasMore ? ' Use Find older work or load another page.' : ''}</p>}
    {historicalRows === null && page.hasMore && <button type="button" disabled={busy} onClick={() => load(true)}>Load more recent results</button>}
    </div>
    {detail && <article ref={reviewRef} className="marking-review-detail">
      <div className="marking-review-toolbar"><button type="button" onClick={() => { setDetail(null); setEditing(false); setReportFallback(''); }}>← Back to results</button>
        <button type="button" onClick={copyFullReport}>Copy full report</button></div>
      {reportFallback && <label className="marking-report-copy-fallback">Full report — select and copy manually
        <textarea readOnly rows={10} value={reportFallback} onFocus={event => event.target.select()} /></label>}
      <h2>{assignmentTitle(detail.row.assignmentTitle, detail.row.assignment, detail.row.assignmentId)}</h2>
      <p>{detail.row.studentName || detail.row.studentCode || 'Student'} · {detail.row.assignmentId || ''} · {detail.row.finalScore ?? '—'}/100</p>
      <p><strong>Status: {automaticPublicationLabel(detail.row)}</strong></p>
      {!isAutomaticResultPublished(detail.row) && <section aria-label="Review reasons"><h3>Why review is needed</h3>
        <ul>{automaticReviewReasons(detail).map(item => <li key={item}>{item}</li>)}</ul>
      </section>}
      <section className="marking-reference-review" aria-label="Answer reference comparison">
        <h3>Saved reference vs current Admin reference</h3>
        <p><strong>{referenceComparison?.status === 'different' ? 'References differ — review required'
          : referenceComparison?.status === 'matching' ? 'Saved and Admin references match'
          : 'Comparison unavailable — a reference is missing'}</strong></p>
        <p className="marking-reference-note">The saved audit key is what the AI used. The current Admin bundle may still differ from the deployed Firebase worker.</p>
        <p>Saved key version: {detail.audit?.referenceVersion || detail.audit?.referenceEntry?.version || 'Not recorded'} · Student version: {detail.submission.answerKeyVersion || detail.submission.markingReferenceVersion || 'Not recorded'}</p>
        {referenceComparison?.rows?.filter(row => row.changed).map(row => <div className="marking-reference-row" key={row.key}>
          <strong>{row.key}</strong><span>Used: {row.used ?? 'Not present'}</span><span>Admin: {row.current ?? 'Not present'}</span>
        </div>)}
        {referenceComparison?.rows?.length > 0 && <details><summary>Show all reference answers ({referenceComparison.rows.length})</summary>
          {referenceComparison.rows.map(row => <div className="marking-reference-row" key={'all-' + row.key}>
            <strong>{row.key}</strong><span>Used: {row.used ?? 'Not present'}</span><span>Admin: {row.current ?? 'Not present'}</span>
          </div>)}</details>}
      </section>
      <section className="marking-recheck-panel" aria-label="Recheck objective answers">
        <h3>Recheck against corrected answer key</h3>
        <p>This rechecks answers locally without an AI call. It never changes the student result until a tutor saves a correction.</p>
        {getA2B1WritingRequirement({ level: String(detail.row.assignmentId || '').split('-')[0], assignmentId: detail.row.assignmentId }) === true &&
          <label>Tutor writing points (0–40)
            <input type="number" min="0" max="40" step="1" value={tutorWritingPoints}
              placeholder="Enter after reviewing the writing" onChange={event => {setTutorWritingPoints(event.target.value); setRecheck(null);}} /></label>}
        <button type="button" disabled={busy} onClick={recheckObjectiveAnswers}>Recheck objective answers</button>
        {recheckError && <p role="alert">{recheckError}</p>}
        {recheck && <div role="status" className="marking-recheck-summary">
          <p><strong>{recheck.correctCount}/{recheck.totalCount} answers correct</strong></p>
          <p>Objective: {Math.round(recheck.correctCount * 100 / recheck.totalCount)}% ·
            {recheck.outcome.writingRequiredButMissing ? ' Enter writing points before calculating a final mark.' : ' Suggested total: ' + recheck.outcome.finalScore + '/100'}</p>
          {recheck.unkeyedParts.length > 0 ? <p role="alert"><strong>Incomplete answer key — do not publish this score:</strong> {recheck.unkeyedParts.join('; ')}</p>
            : <p className="marking-reference-note">Verify this key matches the student attempt before publishing.</p>}
          <details><summary>Question-by-question recheck</summary>{Object.entries(recheck.details).map(([key, answer]) =>
            <div className="marking-reference-row" key={key}><strong>{key} · {answer.correct ? 'Correct' : 'Incorrect'}</strong>
            <span>Student: {answer.student || 'Missing'}</span><span>Expected: {answer.expectedDisplay || answer.expected || 'Missing'}</span></div>)}</details>
          {!recheck.outcome.writingRequiredButMissing && !recheck.unkeyedParts.length && <button type="button" onClick={useRecheckedScore}>Use score in tutor correction</button>}
        </div>}
      </section>
      <h3>Submitted work</h3>
      <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{detail.submission.submissionText || detail.submission.text || detail.submission.answer || detail.submission.workContent || 'No text available'}</pre>
      <h3>{original?.finalScore == null && original?.score == null ? 'No AI score · marking stopped' : 'Original AI result'}</h3>
      {original?.finalScore == null && original?.score == null
        ? <p>Automatic marking did not produce a score. Review the reason above, then enter a tutor score and feedback if appropriate.</p>
        : <><p>Score: {original.finalScore ?? original.score}/100 · Confidence: {original.confidence ?? '—'}</p>
          <p style={{ whiteSpace: 'pre-wrap' }}>{original.feedback}</p></>}
      {objectiveDetails.length > 0 && <section className="marking-objective-review"><h3>Question-by-question AI evidence</h3>
        {objectiveDetails.map(([question, evidence]) => <div className="marking-objective-evidence" key={question}>
          <strong>{question} · {evidence?.correct === true ? 'Correct' : evidence?.correct === false ? 'Incorrect' : 'Review'}</strong>
          <div className="marking-objective-answers"><span>Student: {evidence?.student ?? 'Unknown'}</span><span>Expected: {evidence?.expectedDisplay ?? evidence?.expected ?? 'Unknown'}</span></div>
        </div>)}
      </section>}
      <details><summary>Raw marking evidence and answer key</summary><pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{JSON.stringify(detail.audit || original, null, 2)}</pre></details>
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
        <h3>Correct score &amp; publish</h3>
        <p>A manual score is the tutor’s final decision. The original AI result remains saved above.</p>
        <label>Final score /100 <input type="number" min="0" max="100" step="1" required value={score} onChange={event => {setScore(event.target.value); setRecheckApplied(false);}} disabled={busy} /></label>
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

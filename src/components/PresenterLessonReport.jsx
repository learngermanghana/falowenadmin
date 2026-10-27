import { useEffect, useRef } from 'react';
import { buildPresenterLessonReport, presenterWorkbookUrl } from '../utils/presenterLessonReport.js';
import './PresenterControls.css';

export default function PresenterLessonReport({ slide, roster, stats, absentKeys, className, sessionDate, loading, error, saveLabel, onClose }) {
  const dialogRef = useRef(null);
  const report = buildPresenterLessonReport(roster, stats, absentKeys);
  const workbookUrl = presenterWorkbookUrl(slide);
  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    if (dialog.showModal) dialog.showModal();
    else { dialog.setAttribute('open', ''); dialog.querySelector('button')?.focus(); }
    return () => { dialog.close?.(); previousFocus?.focus?.(); };
  }, []);
  return <dialog ref={dialogRef} className="presenter-lesson-report" aria-labelledby="presenter-report-title" onCancel={onClose}
    onKeyDown={event => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); }
      if (event.key !== 'Tab') return;
      const controls = [...event.currentTarget.querySelectorAll('button, a[href]')];
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }}>
    <header><div><p>{slide.course} · {slide.assignmentId} · {sessionDate}</p><h2 id="presenter-report-title">End-of-lesson report</h2></div>
      <button type="button" onClick={onClose} autoFocus>Back to lesson</button></header>
    <p>{slide.title} · {className || 'No class selected'}</p>
    <p role="status">{loading ? 'Loading participation…' : saveLabel}</p>
    {error ? <p role="alert">{error}</p> : null}
    {!loading && !error && <>
      {!roster.length ? <p>Select a class with a student roster to see participation.</p> : <>
        <div className="presenter-report-counts">
          <span><strong>{report.participated.length}</strong> participated</span>
          <span><strong>{report.noTurn.length}</strong> no recorded turn</span>
          <span><strong>{report.needsReview.length}</strong> need practice</span>
          <span><strong>{report.absent.length}</strong> marked absent</span>
        </div>
        <h3>Class participation</h3>
        <div className="presenter-report-table"><table><thead><tr><th>Student</th><th>Turns</th><th>Correct</th><th>Needs review</th><th>Status</th></tr></thead>
          <tbody>{report.students.map(student => <tr key={student.key}><th scope="row">{student.name}</th><td>{student.turns}</td><td>{student.correct}</td><td>{student.needsReview}</td><td>{student.absent ? 'Presenter absent' : student.turns ? 'Participated' : 'No recorded turn'}</td></tr>)}</tbody></table></div>
        <h3>What needs practice</h3>
        {report.topics.length ? <ul>{report.topics.map(({ topic, names }) => <li key={topic}><strong>{topic}</strong><p>{names.join(', ')}</p></li>)}</ul> : <p>{report.needsReview.length ? 'Review marks were recorded without a question. Revisit the lesson activities with the students below.' : 'No review marks recorded. This does not establish mastery for students who have not answered.'}</p>}
        {report.needsReview.length > 0 && <p>Follow up with: {report.needsReview.map(student => `${student.name} (${student.needsReview})`).join(', ')}.</p>}
      </>}
    </>}
    <section><h3>Next step · workbook</h3>
      {workbookUrl ? <><p>{slide.workbookConnection?.subtitle || 'Continue with the workbook linked to this lesson.'}</p><a href={workbookUrl} target="_blank" rel="noopener noreferrer">Open lesson workbook · {slide.assignmentId}</a></> : <p>No workbook is linked to this lesson yet.</p>}
    </section>
    <small>Teacher observations only. This report does not change official attendance or grades.</small>
  </dialog>;
}

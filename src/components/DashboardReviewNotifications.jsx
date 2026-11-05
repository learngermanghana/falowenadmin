import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { loadDashboardExamNotifications, loadDashboardAiNotifications } from '../services/dashboardReviewNotifications.js';

function ReviewCard({ title, to, state, empty, description, renderRow }) {
  return <article className="analytics-panel"><div className="panel-header"><h2>{title}</h2><Link to={to}>Open</Link></div>
    {!state && <p role="status">Loading notification snapshot…</p>}
    {state?.error && <p role="alert">{state.error} <Link to={to}>Open workspace</Link></p>}
    {state?.data && <><p>{state.data.rows.length} needing review in this snapshot of {state.data.sampled} records.</p>
      {state.data.rows.length ? <ul className="mini-list">{state.data.rows.slice(0, 5).map(row => <li key={row.id}><span>{renderRow(row)}</span></li>)}</ul> : <p className="empty-state">{empty}</p>}
      <p><small>{description} Up to 25 records checked, showing up to 5 alerts. Counts cover this snapshot only.{state.data.capped ? ' Open the workspace to check more history.' : ''}</small></p></>}
  </article>;
}
export default function DashboardReviewNotifications({ user }) {
  const [exam, setExam] = useState(null), [ai, setAi] = useState(null);
  const inFlight = useRef(null);
  useEffect(() => {
    if (!user?.uid) return;
    let active = true;
    if (inFlight.current?.uid !== user.uid) {
      inFlight.current = { uid: user.uid, exam: loadDashboardExamNotifications(), ai: loadDashboardAiNotifications() };
    }
    const apply = (promise, set) => promise.then(data => { if (active) set({ data }); })
      .catch(error => { if (active) set({ error: error.message || 'Notifications unavailable.' }); });
    apply(inFlight.current.exam, setExam); apply(inFlight.current.ai, setAi);
    return () => { active = false; };
  }, [user]);
  if (!user?.uid) return null;
  return <section className="analytics-grid two" aria-label="Review notifications">
    <ReviewCard title="Exam tracking" to="/exam-tracking" state={exam} empty="No practice scores below 60% in this snapshot."
      description="Saved Exams Room practice scores below 60%. Speaking activity and full mock history load in Exam Tracking."
      renderRow={row => <><strong>{row.name || row.studentCode || 'Student'}</strong><small>{row.level} · {row.title} · {row.percent}%</small></>} />
    <ReviewCard title="AI marking — confirm results" to="/marking?tab=automatic" state={ai} empty="No AI results awaiting confirmation in this recent snapshot."
      description="Unpublished automatic marking results awaiting tutor confirmation; published or closed results are excluded."
      renderRow={row => <><strong>{row.studentName || row.studentCode || 'Student'}</strong><small>{row.assignmentTitle || row.assignmentId || 'Assignment'} · Tutor review required</small></>} />
  </section>;
}

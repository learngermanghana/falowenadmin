import { useEffect, useState } from 'react';
import { loadStudentMusicPractice } from '../services/musicPracticeService.js';

const OPTIONS = [{ days: 1, label: 'Today' }, { days: 7, label: 'Last 7 days' }, { days: 30, label: 'Last 30 days' }];
const number = value => Number(value || 0).toLocaleString('en-GH');
const duration = seconds => {
  const mins = Math.round(Number(seconds || 0) / 60);
  return mins >= 60 ? Math.floor(mins / 60) + 'h ' + (mins % 60) + 'm' : mins + ' min';
};

export default function StudentMusicPracticePanel() {
  const [days, setDays] = useState(7);
  const [refresh, setRefresh] = useState(0);
  const [state, setState] = useState({ loading: true, data: null, error: '' });

  // No background polling: the owner explicitly opens or refreshes this tab.
  useEffect(() => {
    const controller = new AbortController();
    setState({ loading: true, data: null, error: '' });
    loadStudentMusicPractice(days, { signal: controller.signal })
      .then(data => { if (!controller.signal.aborted) setState({ loading: false, data, error: '' }); })
      .catch(error => { if (!controller.signal.aborted) setState({ loading: false, data: null, error: error.message }); });
    return () => controller.abort();
  }, [days, refresh]);

  const report = state.data;
  const students = report?.students || [];
  const events = report?.recent || [];
  return (
    <section aria-label="Student music practice" className="music-practice-panel">
      <div className="music-analytics-practice-header">
        <div>
          <h2>Student Music Practice</h2>
          <p>Signed-in Campus students only. Public music visitors remain anonymous. This is listening activity, not exam marking.</p>
        </div>
        <button type="button" disabled={state.loading} onClick={() => setRefresh(value => value + 1)}>Refresh practice</button>
      </div>
      <div className="music-analytics-range" role="group" aria-label="Student practice date range">
        {OPTIONS.map(item => (
          <button type="button" key={item.days} aria-pressed={days === item.days}
            onClick={() => setDays(item.days)}>{item.label}</button>
        ))}
      </div>
      {state.loading && <p className="music-analytics-notice" role="status">Loading student music practice…</p>}
      {state.error && <p className="music-analytics-notice error" role="alert">{state.error}</p>}
      {report && (
        <>
          <div className="music-analytics-metrics">
            <article className="music-analytics-metric"><p>Students practising</p><strong>{number(report.activeStudents)}</strong></article>
            <article className="music-analytics-metric"><p>Song starts</p><strong>{number(report.plays)}</strong></article>
            <article className="music-analytics-metric"><p>Full listens</p><strong>{number(report.completions)}</strong></article>
            <article className="music-analytics-metric"><p>Listening time</p><strong>{duration(report.seconds)}</strong></article>
          </div>
          <article className="music-analytics-panel">
            <h2>Students using music</h2>
            {!students.length ? (
              <p className="music-analytics-empty">No authenticated music practice has been recorded for this period. Students must open Music inside their Falowen Campus account and start a song.</p>
            ) : (
              <div className="music-analytics-table-wrap">
                <table>
                  <thead><tr><th>Student account</th><th>Level</th><th>Different songs</th><th>Starts</th><th>Completed</th><th>Last practice</th></tr></thead>
                  <tbody>{students.map(s => (
                    <tr key={s.uid}>
                      <td><strong>{s.name || 'Student'}</strong><small>{s.email || 'Account ' + s.uid.slice(0, 8)}</small></td>
                      <td>{s.level}</td><td>{number(s.songs)}</td><td>{number(s.plays)}</td>
                      <td>{number(s.completions)}</td>
                      <td>{s.lastActiveAt ? new Date(s.lastActiveAt).toLocaleDateString('en-GH') : '—'}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </article>
          <article className="music-analytics-panel">
            <h2>Recent song practice</h2>
            {!events.length ? <p className="music-analytics-empty">No songs recorded yet.</p> : (
              <div className="music-analytics-table-wrap">
                <table>
                  <thead><tr><th>Student</th><th>Song</th><th>Level / day</th><th>Starts</th><th>Full listens</th><th>Listening</th></tr></thead>
                  <tbody>{events.map((item, index) => (
                    <tr key={item.uid + '-' + item.trackId + '-' + index}>
                      <td>{item.name}<small>{item.email}</small></td>
                      <td>{item.title}</td>
                      <td>{item.level}{item.day ? ' · Day ' + item.day : ''}</td>
                      <td>{number(item.plays)}</td>
                      <td>{number(item.completions)}</td>
                      <td>{duration(item.seconds)}<small>{item.lastActiveAt ? new Date(item.lastActiveAt).toLocaleString('en-GH') : ''}</small></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </article>
          {report.limited && <p className="music-analytics-notice">Only the latest 300 practice summaries are shown to control database reads. Narrow the date range for more detail.</p>}
          <p className="music-analytics-footnote">
            Data is collected only from authenticated, embedded Campus music sessions starting after this feature is deployed.
            Counts reflect playback events and are not proof of attentive study. Records are updated on song starts,
            pauses and completions, not every second. This report loads only when opened or refreshed.
          </p>
        </>
      )}
    </section>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { loadMusicAnalytics } from '../services/musicAnalyticsService.js';
import './MusicAnalyticsPage.css';

const RANGES = [
  { label: 'Today', days: 1 },
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
];

function formatNumber(n) {
  return Number(n || 0).toLocaleString('en-GH');
}

function Metric({ label, value, note }) {
  return (
    <article className="music-analytics-metric">
      <p>{label}</p>
      <strong>{formatNumber(value)}</strong>
      {note ? <span>{note}</span> : null}
    </article>
  );
}

function PopularityBars({ rows, valueKey, labelKey, emptyLabel }) {
  if (!rows?.length) return <p className="music-analytics-empty">{emptyLabel}</p>;
  const max = Math.max(1, ...rows.map(row => Number(row[valueKey]) || 0));
  return (
    <div className="music-analytics-bars">
      {rows.map((row, index) => (
        <div className="music-analytics-bar-row" key={String(row[labelKey]) + '-' + index}>
          <div className="music-analytics-bar-caption">
            <span title={String(row[labelKey])}>{row[labelKey]}</span><strong>{formatNumber(row[valueKey])}</strong>
          </div>
          <div className="music-analytics-track" aria-label={String(row[labelKey]) + ': ' + formatNumber(row[valueKey])}>
            <span style={{ width: String(Math.max(0, Math.min(100, (Number(row[valueKey]) || 0) / max * 100))) + '%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MusicAnalyticsPage() {
  const [days, setDays] = useState(7);
  const [refresh, setRefresh] = useState(0);
  const [status, setStatus] = useState({ loading: true, report: null, error: '' });

  useEffect(() => {
    const controller = new AbortController();
    setStatus(previous => ({ ...previous, loading: true, error: '' }));
    loadMusicAnalytics(days, { signal: controller.signal })
      .then(report => {
        if (!controller.signal.aborted) setStatus({ loading: false, report, error: '' });
      })
      .catch(error => {
        if (!controller.signal.aborted) setStatus({ loading: false, report: null, error: error.message || 'Unable to load analytics.' });
      });
    return () => controller.abort();
  }, [days, refresh]);

  const report = status.report;
  const total = Number(report?.plays || 0);
  const completionRate = total ? Math.round((Number(report?.completions || 0) / total) * 100) : 0;
  const series = report?.daily || [];
  const maxDaily = Math.max(1, ...series.map(item => item.visitors || 0));

  return (
    <main className="music-analytics-page">
      <header className="music-analytics-head">
        <div>
          <p className="music-analytics-eyebrow">FALOWEN ADMIN · MUSIC PERFORMANCE</p>
          <h1>Music Analytics</h1>
          <p>See how listeners discover your published German songs. This dashboard uses opt-in GA4 aggregates—not student accounts or Firebase listening logs.</p>
        </div>
        <div className="music-analytics-actions">
          <a href="https://music.falowen.app/" target="_blank" rel="noreferrer">Open Music site</a>
          <button type="button" disabled={status.loading} onClick={() => setRefresh(value => value + 1)}>Refresh</button>
        </div>
      </header>

      <div className="music-analytics-range" role="group" aria-label="Analytics date range">
        {RANGES.map(item => (
          <button key={item.days} type="button" aria-pressed={days === item.days}
            onClick={() => setDays(item.days)}>{item.label}</button>
        ))}
      </div>

      {status.loading ? <p className="music-analytics-notice" role="status">Loading music reports…</p> : null}
      {status.error ? <section className="music-analytics-notice error" role="alert">
        <strong>Could not load music reports</strong><p>{status.error}</p>
      </section> : null}

      {!status.loading && report && !report.configured ? (
        <section className="music-analytics-notice" role="status">
          <h2>Analytics needs one-time configuration</h2>
          <p>{report.message}</p>
          <p>Configure the music website's public GA4 measurement ID separately. Until then, listening remains fully functional and no analytics calls are sent.</p>
          <p>See <code>docs/music-analytics.md</code> in the Admin repository for setup instructions. No paid GA4 account, AI, Firestore event logging or scheduler is required.</p>
        </section>
      ) : null}

      {report?.configured ? (
        <>
          <section className="music-analytics-metrics" aria-label="Key music performance numbers">
            <Metric label="Active visitors" value={report.visitors} note="Consenting website visitors" />
            <Metric label="Page views" value={report.pageViews} note="Music website views" />
            <Metric label="Song plays" value={report.plays} note="New play starts, not resumes" />
            <Metric label="Full listens" value={report.completions} note={completionRate + '% of play starts'} />
            <Metric label="Shared songs" value={report.shares} note="Share button clicks" />
            <Metric label="Class interest" value={report.classClicks} note="Clicks to Falowen classes" />
          </section>

          <section className="music-analytics-columns">
            <article className="music-analytics-panel">
              <h2>Most played songs</h2>
              {report.topTracks?.length ? (
                <div className="music-analytics-table-wrap">
                  <table>
                    <thead><tr><th>Song</th><th>Level</th><th>Plays</th></tr></thead>
                    <tbody>
                      {report.topTracks.map(track => (
                        <tr key={track.id}>
                          <td>
                            <a href={'https://music.falowen.app/?track=' + encodeURIComponent(track.id)} rel="noreferrer" target="_blank">{track.title}</a>
                            {track.day ? <small>Day {track.day}</small> : null}
                          </td>
                          <td>{track.level}</td>
                          <td>{formatNumber(track.plays)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p className="music-analytics-empty">No song plays recorded yet. GA4 data may take time to appear after listeners opt in.</p>}
            </article>

            <article className="music-analytics-panel">
              <h2>Listening by German level</h2>
              <PopularityBars rows={report.levels} labelKey="level" valueKey="plays" emptyLabel="No level data yet." />
              <h2 className="music-analytics-subhead">Top listener countries</h2>
              <PopularityBars rows={report.countries} labelKey="country" valueKey="visitors" emptyLabel="Country data is not available yet." />
            </article>
          </section>

          <section className="music-analytics-panel">
            <h2>Daily active visitors</h2>
            {series.length ? (
              <div className="music-analytics-daily" role="img" aria-label="Daily active visitors">
                {series.map(row => (
                  <div className="music-analytics-day" key={row.date} title={row.date + ': ' + formatNumber(row.visitors) + ' visitors'}>
                    <strong>{formatNumber(row.visitors)}</strong>
                    <div className="music-analytics-day-column">
                      <span style={{ height: String(Math.max(2, (row.visitors / maxDaily) * 100)) + '%' }} />
                    </div>
                    <small>{row.date.slice(5)}</small>
                  </div>
                ))}
              </div>
            ) : <p className="music-analytics-empty">No daily visitor trend yet.</p>}
          </section>
          <footer className="music-analytics-footnote">
            GA4 reporting is cached for 15 minutes and can lag behind real-time activity. A play is an audio start, not a unique listener.
            Visitors who decline optional analytics are not counted. No AI calls or per-listen Firestore writes.
            {report.generatedAt ? ' Last refreshed: ' + new Date(report.generatedAt).toLocaleString('en-GH') + '.' : ''}
          </footer>
        </>
      ) : null}
      <p className="music-analytics-back"><Link to="/music-studio">← Music Studio</Link></p>
    </main>
  );
}

import { startVisiblePolling } from "../utils/visiblePolling.js";
import { createTimedAttemptListenerHealth } from "../utils/timedAttemptListenerHealth.js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { collection, deleteDoc, doc, documentId, onSnapshot, query as firestoreQuery, where } from "firebase/firestore";
import { auth, db } from "../firebase";
import {
  clockLabel,
  filterMockAttempts,
  filterTimedAttempts,
  timedAttemptStatus,
  timedAttemptStatusLabel,
  mockActivityLabel,
  mockSectionProgress,
  mockAuditScoreRows,
  formatMockAuditScore,
  remainingSeconds,
  toAttemptMillis,
  MOCK_SECTIONS,
} from "../utils/mockAttemptMonitoring";
import "./TimedAssignmentAttemptsPage.css";

const COLLECTION = "submissionLocks";
const MOCK_MONITOR_URL = String(
  import.meta.env.VITE_MOCK_MONITOR_URL ||
  "https://www.falowen.app/api/internal/mock-attempts",
).trim();
const card = { border: "1px solid #e2e8f0", borderRadius: 16, padding: 16, background: "#fff", display: "grid", gap: 12 };
const formatDate = (value) => {
  const millis = toAttemptMillis(value);
  if (!millis) return "—";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(millis));
};
const timeEnd = (attempt) => {
  const start = toAttemptMillis(attempt.startedAt) || Number(attempt.clientStartedAt) || 0;
  const duration = Number(attempt.durationSeconds) || 0;
  return start && duration ? start + duration * 1000 : 0;
};

export default function TimedAssignmentAttemptsPage() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timerError, setTimerError] = useState("");
  const [resettingId, setResettingId] = useState("");
  const [mocks, setMocks] = useState([]);
  const [mockLoading, setMockLoading] = useState(true);
  const [mockError, setMockError] = useState("");
  const [lastChecked, setLastChecked] = useState("");
  const [partial, setPartial] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("mocks");
  const [mockStatus, setMockStatus] = useState("all");
  const [timedStatus, setTimedStatus] = useState("all");
  const [writingReviewId, setWritingReviewId] = useState("");
  const [writingReview, setWritingReview] = useState(null);
  const [writingReviewError, setWritingReviewError] = useState("");
  const [writingReviewLoading, setWritingReviewLoading] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const records = [new Map(), new Map()];
    const sources = [
      firestoreQuery(collection(db, COLLECTION), where("timerRecord", "==", true)),
      // Older timed records used an ID prefix before timerRecord was introduced.
      firestoreQuery(collection(db, COLLECTION),
        where(documentId(), ">=", "timed__"),
        where(documentId(), "<=", "timed__\uf8ff")),
    ];
    const health = createTimedAttemptListenerHealth(sources.length);
    const updateHealth = ({ loading, error }) => {
      setLoading(loading);
      setTimerError(error);
    };
    const unsubscribes = sources.map((source, index) => onSnapshot(source, snapshot => {
      records[index] = new Map(snapshot.docs.map(entry => [entry.id, { id: entry.id, ...entry.data() }]));
      setAttempts([...new Map([...records[0], ...records[1]]).values()]
        .sort((a, b) => (toAttemptMillis(b.startedAt) || Number(b.clientStartedAt) || 0) -
          (toAttemptMillis(a.startedAt) || Number(a.clientStartedAt) || 0)));
      updateHealth(health.snapshot(index));
    }, error => { updateHealth(health.failure(index, error)); }));
    return () => unsubscribes.forEach(unsubscribe => unsubscribe());
  }, []);

  const loadMocks = useCallback(async () => {
    try {
      const user = auth?.currentUser;
      if (!user) throw new Error("Sign in as a staff member to monitor mock exams.");
      const token = await user.getIdToken();
      const response = await fetch(MOCK_MONITOR_URL, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        cache: "no-store",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.ok !== true || !Array.isArray(data.attempts)) {
        throw new Error(data.error || `Mock monitor returned HTTP ${response.status}.`);
      }
      setMocks(data.attempts);
      setPartial(Boolean(data.partial));
      setLastChecked(data.checkedAt || new Date().toISOString());
      setMockError("");
    } catch (error) {
      setMockError(error?.message || "Could not refresh mock progress.");
    } finally {
      setMockLoading(false);
    }
  }, []);

  const openWritingReview = async (attempt) => {
    const identifier = String(attempt.id || "");
    setWritingReviewId(identifier);
    setWritingReview(null);
    setWritingReviewError("");
    setWritingReviewLoading(true);
    try {
      if (attempt.progressSource === "browser_reported") {
        throw new Error("This is browser-reported progress, not a server-verified writing attempt.");
      }
      const user = auth?.currentUser;
      if (!user) throw new Error("Staff sign-in required");
      const token = await user.getIdToken();
      const endpoint = MOCK_MONITOR_URL.replace(/\/internal\/mock-attempts(?:\?.*)?$/, "/internal/mock-writing-review");
      const response = await fetch(endpoint + "?attempt=" + encodeURIComponent(identifier), {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        cache: "no-store",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.ok !== true) throw new Error(data.error || "Could not load writing review");
      setWritingReview(data.review);
    } catch (err) {
      setWritingReviewError(err?.message || "Could not load writing review");
    } finally {
      setWritingReviewLoading(false);
    }
  };

  useEffect(() => {
    // Avoid repeating the mock-monitor network request while staff view Campus timers.
    if (category !== "mocks") return undefined;
    return startVisiblePolling(loadMocks, 30000);
  }, [loadMocks, category]);

  const filteredMocks = useMemo(() => filterMockAttempts(mocks, query, mockStatus), [mocks, query, mockStatus]);
  const filteredTimed = useMemo(() => filterTimedAttempts(attempts, query, timedStatus), [attempts, query, timedStatus]);
  const mockInProgress = mocks.filter(row => row.status === "in_progress").length;
  const mockCompleted = mocks.filter(row => row.status === "completed").length;
  const timedInProgress = attempts.filter(row => timedAttemptStatus(row) === "in_progress").length;
  const timedCompleted = attempts.filter(row => timedAttemptStatus(row) === "completed").length;
  const showMocks = category === "mocks";
  const showTimed = category === "timed";
  const switchCategory = (next) => {
    setCategory(next);
    setQuery("");
    setMockStatus("all");
    setTimedStatus("all");
    setWritingReviewId("");
    setWritingReview(null);
  };

  const resetAttempt = async (attempt) => {
    const label = [attempt.studentEmail || attempt.studentCode || attempt.studentId, attempt.assignmentKey]
      .filter(Boolean).join(" · ");
    if (!window.confirm(`Reset timed attempt for ${label}? The student will be allowed to start a fresh timed attempt.`)) return;
    setResettingId(attempt.id);
    setTimerError("");
    try { await deleteDoc(doc(db, COLLECTION, attempt.id)); }
    catch (error) { setTimerError(error?.message || "Could not reset this timed attempt."); }
    finally { setResettingId(""); }
  };

  return (
    <div className="mock-timed-monitor" style={{ display: "grid", gap: 18 }}>
      <header style={{ ...card, background: "linear-gradient(135deg,#eff6ff,#fff)" }}>
        <p style={{ color: "#1d4ed8", fontWeight: 800, fontSize: 12, margin: 0, textTransform: "uppercase" }}>Exam controls</p>
        <h1 style={{ margin: 0 }}>Mock exams &amp; Campus timers</h1>
        <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
          Exam Room mocks and Campus timed assignments are monitored separately. Choose a tab to see the right students and filter by status.
          Mock status shows saved progress, not a continuous online-presence signal.
        </p>
      </header>

      <nav className="monitor-switcher" role="tablist" aria-label="Monitoring source">
        <button type="button" role="tab" id="monitor-mocks-tab" aria-controls="mock-monitoring"
          aria-selected={showMocks} className="monitor-tab" onClick={() => switchCategory("mocks")}>
          <strong>Exam Room mocks</strong>
          <span>Full mock exams · {mockLoading && !lastChecked ? "Loading…" : mocks.length + " attempts"}</span>
        </button>
        <button type="button" role="tab" id="monitor-timed-tab" aria-controls="timed-assignments"
          aria-selected={showTimed} className="monitor-tab" onClick={() => switchCategory("timed")}>
          <strong>Campus timed tests</strong>
          <span>Timed assignments · {loading ? "Loading…" : attempts.length + " attempts"}</span>
        </button>
      </nav>

      <section className="monitor-summary" aria-label={showMocks ? "Exam Room mock summary" : "Campus timed test summary"}>
        {(showMocks ? [
          ["Mocks recorded", mockLoading && !lastChecked ? "…" : mocks.length],
          ["In progress", mockInProgress],
          ["Completed mocks", mockCompleted],
        ] : [
          ["Timed attempts", loading ? "…" : attempts.length],
          ["In progress", timedInProgress],
          ["Completed tests", timedCompleted],
        ]).map(([label, value]) =>
          <div key={label} className="monitor-summary-card"><span>{label}</span><strong>{value}</strong></div>)}
      </section>

      <section style={card}>
        <label className="monitor-search">
          <strong>{showMocks ? "Search Exam Room mocks" : "Search Campus timed tests"}</strong>
          <input type="search" value={query} onChange={event => setQuery(event.target.value)}
            placeholder={showMocks ? "Student name, email, ID or mock ID…" : "Student name, email, ID or assignment…"} />
        </label>
      </section>

      {showMocks && <section id="mock-monitoring" role="tabpanel" aria-labelledby="monitor-mocks-tab" className="monitor-content" data-testid="mock-monitoring">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div><h2 style={{ margin: 0 }}>Exam Room · Full mock exams</h2>
            <small style={{ color: "#64748b" }}>Last synced: {lastChecked ? formatDate(lastChecked) : "not yet"} · refreshes every 30 seconds</small>
          </div>
          <button type="button" onClick={loadMocks} style={{ border: "1px solid #2563eb", borderRadius: 10, background: "#fff", color: "#1d4ed8", padding: "9px 12px", fontWeight: 750, cursor: "pointer" }}>Refresh now</button>
        </div>
        <div className="monitor-status-filters" role="group" aria-label="Filter Exam Room mock status">
          {[[ "all", "All" ], [ "in_progress", "In progress" ], [ "completed", "Completed" ]].map(([value,label]) =>
            <button className="monitor-status-button" key={value} type="button"
              onClick={() => setMockStatus(value)} aria-pressed={mockStatus === value}>{label}</button>)}
          <span className="monitor-filter-count">{filteredMocks.length} shown</span>
        </div>
        {mockError && <div role="alert" style={{ ...card, color: "#991b1b", borderColor: "#fecaca" }}>
          {mockError}{lastChecked ? " · Showing last successfully loaded data." : ""}
        </div>}
        {partial && <p style={{ color: "#92400e", margin: 0 }}>Showing a limited recent-history window; older mock attempts may be omitted.</p>}
        {mockLoading && !lastChecked && <p>Loading mock attempts…</p>}
        {!mockLoading && !filteredMocks.length && <div style={card}>
          {mockError ? "Mock monitoring is unavailable." : "No mock attempts match these filters. Mock 2 exercises stored only in browser storage will not appear here."}
        </div>}
        {filteredMocks.map(attempt => {
          const progress = mockSectionProgress(attempt);
          const remaining = remainingSeconds(attempt.sectionDeadlineMs, now);
          const current = attempt.section;
          const status = mockActivityLabel(attempt, now);
          const scoreRows = mockAuditScoreRows(attempt);
          const hasVerifiedMarks = scoreRows.some(row => row.score !== null);
          return <article key={attempt.id} style={card}>
            <div style={{ display: "flex", gap: 8, justifyContent: "space-between", flexWrap: "wrap" }}>
              <div style={{ display: "grid", gap: 4 }}>
                <strong>{attempt.level} · {attempt.mockId} · Attempt {attempt.attemptNumber}</strong>
                <strong style={{ fontSize: 16 }}>{attempt.studentName || attempt.studentEmail || attempt.uid || "Student not identified"}</strong>
                {attempt.studentName && attempt.studentEmail ? <span style={{ color: "#64748b", fontSize: 13 }}>{attempt.studentEmail}</span> : null}
              </div>
              <span style={{ fontSize: 12, fontWeight: 800, color: attempt.status === "completed" ? "#166534" : "#1d4ed8" }}>{status}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 8, fontSize: 13 }}>
              <div><b>Current section:</b> {current === "intro" ? "Not started" : current === "result" ? "Results" : current || "—"}</div>
              <div><b>Section time left:</b> {attempt.status === "completed" ? "Finished" : clockLabel(remaining)}</div>
              <div><b>Started:</b> {formatDate(attempt.startedAt)}</div>
              <div><b>Last update:</b> {formatDate(attempt.updatedAt)}</div>
              {attempt.overallScore !== null && attempt.overallScore !== undefined && <div><b>Verified total:</b> {formatMockAuditScore(attempt.overallScore)}/100</div>}
            </div>
            <section className="monitor-mock-score-audit" aria-label="Saved section scores">
              <div className="monitor-mock-score-heading">
                <strong>Section scores · staff audit</strong>
                <span>{attempt.scoreVerification === "verified" ? "Server-verified results" :
                  attempt.scoreVerification === "in_progress" ? "Verified sections only · mock unfinished" :
                  attempt.scoreVerification === "incomplete" ? "Some verified scores are missing" :
                  "Verified section scores not available"}</span>
              </div>
              <div className="monitor-mock-score-grid">
                {scoreRows.map(row => (
                  <div className="monitor-mock-score-cell" key={row.key}>
                    <span>{row.label}</span>
                    <strong>{row.score === null ? "—" : `${formatMockAuditScore(row.score)}/25`}</strong>
                    <small>{row.score === null
                      ? attempt.status === "completed" ? "Not recorded" : "Pending"
                      : row.status === "graded" ? "Section verified · overall pending" : "Verified"}</small>
                  </div>
                ))}
              </div>
              {attempt.scoreMatchesOverall === false && (
                <p className="monitor-mock-audit-warning" role="alert">
                  Score mismatch: verified sections add up to {formatMockAuditScore(attempt.sectionTotal)}/100,
                  but the saved overall result is {formatMockAuditScore(attempt.overallScore)}/100. Investigate before using this result.
                </p>
              )}
              {attempt.status === "completed" && attempt.scoreVerification === "incomplete" && (
                <p className="monitor-mock-audit-warning" role="alert">
                  This completed attempt does not contain all four verified section scores. Review the saved result.
                </p>
              )}
              {attempt.status === "completed" && attempt.completionSyncStatus === "failed" && (
                <p className="monitor-mock-audit-warning" role="alert">
                  The mock was graded, but saving the score to the student results record failed.
                </p>
              )}
              {attempt.status === "completed" && attempt.completionSyncStatus === "saved" && (
                <p className="monitor-mock-audit-note">Result saved to student scores.</p>
              )}
              {!hasVerifiedMarks && attempt.progressSource === "browser_reported" && (
                <p className="monitor-mock-audit-note">This attempt only reports browser progress, so no scores are verified.</p>
              )}
            </section>
            <div>
              {attempt.progressSource === "browser_reported" && <p style={{ color: "#92400e", fontSize: 12, margin: "0 0 5px" }}>Progress reported by the learner browser; not a verified exam score.</p>}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                <b>Mock progress</b><span>{progress.count} of {progress.total} sections completed</span>
              </div>
              <progress value={progress.count} max={progress.total} style={{ width: "100%", height: 12 }} aria-label="Completed mock sections" />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 9 }}>
                {MOCK_SECTIONS.map(section => <span key={section}
                  style={{ border: "1px solid #cbd5e1", borderRadius: 8, background: progress.completed.includes(section) ? "#dcfce7" : current === section ? "#dbeafe" : "#f8fafc", padding: "5px 9px", fontSize: 12 }}>
                    {progress.completed.includes(section) ? "✓ " : ""}{section === "hoeren" ? "Hören" : section === "schreiben" ? "Schreiben" : section === "sprechen" ? "Sprechen" : "Lesen"}
                  </span>)}
              </div>
            </div>
            {attempt.progressSource !== "browser_reported" && (
              <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 12 }}>
                <button type="button" onClick={() => void openWritingReview(attempt)}
                  style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #2563eb", color: "#1d4ed8", background: "#eff6ff", fontWeight: 700, cursor: "pointer" }}>
                  Review Schreiben submission
                </button>
                {writingReviewId === attempt.id && (
                  <section aria-label="Schreiben marking review" style={{ marginTop: 12, display: "grid", gap: 10, overflowWrap: "anywhere" }}>
                    {writingReviewLoading && <p>Loading writing review…</p>}
                    {writingReviewError && <p role="alert" style={{ color: "#b91c1c" }}>{writingReviewError}</p>}
                    {writingReview?.status === "not_recorded" && <p>No detailed Schreiben review was stored for this attempt. Earlier attempts may only have a score.</p>}
                    {writingReview?.status === "saved" && (
                      <>
                        <p style={{ margin: 0 }}><strong>Verified Schreiben score:</strong> {writingReview.score}/{writingReview.maxScore} · Saved {formatDate(writingReview.submittedAt)}</p>
                        <h4 style={{ margin: "4px 0" }}>Student's submitted answers</h4>
                        {Object.entries(writingReview.answers || {}).map(([part, answer]) => (
                          <div key={part} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: 12, borderRadius: 9 }}>
                            <strong>{part}</strong>
                            <p style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}>{typeof answer === "string" ? answer : JSON.stringify(answer, null, 2)}</p>
                          </div>
                        ))}
                        <h4 style={{ margin: "4px 0" }}>Original marking result and feedback</h4>
                        <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 12, background: "#f1f5f9", borderRadius: 9, padding: 12, maxHeight: 440, overflow: "auto" }}>
                          {JSON.stringify(writingReview.marking || {}, null, 2)}
                        </pre>
                        <p style={{ color: "#64748b", fontSize: 12, margin: 0 }}>This is the original grading record for audit. Viewing it does not change the student's score.</p>
                      </>
                    )}
                  </section>
                )}
              </div>
            )}
          </article>;
        })}
      </section>}

      {showTimed && <section id="timed-assignments" role="tabpanel" aria-labelledby="monitor-timed-tab" className="monitor-content" data-testid="timed-assignments">
        <h2 style={{ margin: 0 }}>Campus · Timed assignment attempts</h2>
        <p style={{ margin: 0, color: "#64748b" }}>
          These are timed tests in the Campus workbook, not full mocks from Exam Room.
          The countdown uses the saved start time and duration. Reset removes only the Campus timer, not a mock result.
        </p>
        <div className="monitor-status-filters" role="group" aria-label="Filter Campus timed test status">
          {[[ "all", "All" ], [ "in_progress", "In progress" ], [ "completed", "Completed" ]].map(([value,label]) =>
            <button className="monitor-status-button" key={value} type="button"
              onClick={() => setTimedStatus(value)} aria-pressed={timedStatus === value}>{label}</button>)}
          <span className="monitor-filter-count">{filteredTimed.length} shown</span>
        </div>
        {timerError && <div role="alert" style={{ ...card, color: "#991b1b", borderColor: "#fecaca" }}>{timerError}</div>}
        {loading && <p>Loading timed assignments…</p>}
        {!loading && !filteredTimed.length && <div style={card}>No Campus timed attempts match these filters.</div>}
        {filteredTimed.map(attempt => {
          const end = timeEnd(attempt);
          const remaining = remainingSeconds(end, now);
          return <article key={attempt.id} style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <div><strong>{attempt.assignmentKey || "Timed assignment"}</strong><div style={{ color: "#475569" }}>{attempt.studentName || attempt.fullName || attempt.name || attempt.studentEmail || attempt.studentCode || attempt.studentId || "Unknown student"}</div>{(attempt.studentName || attempt.fullName || attempt.name) && attempt.studentEmail ? <small style={{ color: "#64748b" }}>{attempt.studentEmail}</small> : null}</div>
              <strong className={timedAttemptStatus(attempt) === "completed" ? "monitor-timed-state is-completed" : "monitor-timed-state"}>{timedAttemptStatusLabel(attempt, now)}</strong>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 9, fontSize: 13 }}>
              <span><b>Level:</b> {attempt.level || "—"}</span>
              <span><b>Started:</b> {formatDate(attempt.startedAt || attempt.clientStartedAt)}</span>
              <span><b>Ends:</b> {end ? formatDate(end) : "—"}</span>
              <span><b>Duration:</b> {attempt.durationSeconds ? Math.round(attempt.durationSeconds / 60) + " min" : "—"}</span>
              <span><b>Time left:</b> {timedAttemptStatus(attempt) === "completed" ? "Submitted" : timedAttemptStatusLabel(attempt, now).startsWith("Time expired") ? "Expired" : clockLabel(remaining)}</span>
            </div>
            <div><button type="button" disabled={resettingId === attempt.id} onClick={() => resetAttempt(attempt)}
              style={{ color: "#b91c1c", border: "1px solid #dc2626", borderRadius: 10, padding: "9px 12px", background: "#fff", fontWeight: 800, cursor: "pointer" }}>
                {resettingId === attempt.id ? "Resetting…" : "Reset timed attempt"}
              </button></div>
          </article>;
        })}
      </section>}
    </div>
  );
}


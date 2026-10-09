import { useCallback, useEffect, useMemo, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase";
import {
  clockLabel,
  filterMockAttempts,
  mockActivityLabel,
  mockSectionProgress,
  remainingSeconds,
  toAttemptMillis,
  MOCK_SECTIONS,
} from "../utils/mockAttemptMonitoring";

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
  const [category, setCategory] = useState("all");
  const [mockStatus, setMockStatus] = useState("all");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => onSnapshot(
    collection(db, COLLECTION),
    snapshot => {
      setAttempts(snapshot.docs
        .map(entry => ({ id: entry.id, ...entry.data() }))
        .filter(entry => entry.timerRecord === true || String(entry.id || "").startsWith("timed__"))
        .sort((a, b) => (toAttemptMillis(b.startedAt) || Number(b.clientStartedAt) || 0) -
          (toAttemptMillis(a.startedAt) || Number(a.clientStartedAt) || 0)));
      setLoading(false);
      setTimerError("");
    },
    error => { setLoading(false); setTimerError(error?.message || "Could not load timed assignments."); },
  ), []);

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

  useEffect(() => {
    loadMocks();
    const interval = window.setInterval(loadMocks, 30000);
    const onFocus = () => loadMocks();
    window.addEventListener("focus", onFocus);
    return () => { window.clearInterval(interval); window.removeEventListener("focus", onFocus); };
  }, [loadMocks]);

  const filteredMocks = useMemo(() => filterMockAttempts(mocks, query, mockStatus), [mocks, query, mockStatus]);
  const filteredTimed = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return attempts.filter(attempt => !needle || [
      attempt.studentEmail, attempt.studentCode, attempt.studentId, attempt.assignmentKey, attempt.level, attempt.status,
    ].some(value => String(value || "").toLowerCase().includes(needle)));
  }, [attempts, query]);
  const inProgress = mocks.filter(row => row.status === "in_progress").length;
  const completed = mocks.filter(row => row.status === "completed").length;
  const showMocks = category === "all" || category === "mocks";
  const showTimed = category === "all" || category === "timed";

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
    <div style={{ display: "grid", gap: 18 }}>
      <header style={{ ...card, background: "linear-gradient(135deg,#eff6ff,#fff)" }}>
        <p style={{ color: "#1d4ed8", fontWeight: 800, fontSize: 12, margin: 0, textTransform: "uppercase" }}>Exam controls</p>
        <h1 style={{ margin: 0 }}>Mock monitoring &amp; timed attempts</h1>
        <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
          Track A1, A2 and B1 full-mock progress, section timers and timed workbook assignments in one place.
          Mock status reflects the most recently saved progress, not a continuous online-presence signal.
        </p>
      </header>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(145px,1fr))", gap: 10 }} aria-label="Monitoring summary">
        {[
          ["Mocks recorded", mockLoading && !lastChecked ? "…" : mocks.length],
          ["In progress", inProgress],
          ["Completed mocks", completed],
          ["Timed assignments", loading ? "…" : attempts.length],
        ].map(([label, value]) =>
          <div key={label} style={card}><span style={{ color: "#64748b", fontSize: 13 }}>{label}</span><strong style={{ fontSize: 25 }}>{value}</strong></div>)}
      </section>

      <section style={card}>
        <label style={{ display: "grid", gap: 5 }}>
          <strong>Search student or assignment</strong>
          <input value={query} onChange={event => setQuery(event.target.value)}
            placeholder="Email, student ID, mock ID or assignment…"
            style={{ minHeight: 42, padding: 10, border: "1px solid #cbd5e1", borderRadius: 10 }} />
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {[[ "all", "All monitoring" ], [ "mocks", "Mock tests" ], [ "timed", "Timed assignments" ]].map(([key,label]) =>
            <button key={key} type="button" aria-pressed={category === key} onClick={() => setCategory(key)}
              style={{ padding: "9px 12px", borderRadius: 10, cursor: "pointer", border: "1px solid #cbd5e1", background: category === key ? "#dbeafe" : "#fff", fontWeight: 700 }}>{label}</button>)}
        </div>
      </section>

      {showMocks && <section style={{ display: "grid", gap: 12 }} data-testid="mock-monitoring">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div><h2 style={{ margin: 0 }}>Mock test progress &amp; timing</h2>
            <small style={{ color: "#64748b" }}>Last synced: {lastChecked ? formatDate(lastChecked) : "not yet"} · refreshes every 30 seconds</small>
          </div>
          <button type="button" onClick={loadMocks} style={{ border: "1px solid #2563eb", borderRadius: 10, background: "#fff", color: "#1d4ed8", padding: "9px 12px", fontWeight: 750, cursor: "pointer" }}>Refresh now</button>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[[ "all", "All" ], [ "in_progress", "In progress" ], [ "completed", "Completed" ]].map(([value,label]) =>
            <button key={value} type="button" onClick={() => setMockStatus(value)} aria-pressed={mockStatus === value}
              style={{ padding: "8px 12px", borderRadius: 9, background: mockStatus === value ? "#dbeafe" : "#fff", border: "1px solid #cbd5e1", cursor: "pointer" }}>{label}</button>)}
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
          return <article key={attempt.id} style={card}>
            <div style={{ display: "flex", gap: 8, justifyContent: "space-between", flexWrap: "wrap" }}>
              <div style={{ display: "grid", gap: 4 }}>
                <strong>{attempt.level} · {attempt.mockId} · Attempt {attempt.attemptNumber}</strong>
                <span>{attempt.studentEmail || attempt.uid || "Student not identified"}</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 800, color: attempt.status === "completed" ? "#166534" : "#1d4ed8" }}>{status}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 8, fontSize: 13 }}>
              <div><b>Current section:</b> {current === "intro" ? "Not started" : current === "result" ? "Results" : current || "—"}</div>
              <div><b>Section time left:</b> {attempt.status === "completed" ? "Finished" : clockLabel(remaining)}</div>
              <div><b>Started:</b> {formatDate(attempt.startedAt)}</div>
              <div><b>Last update:</b> {formatDate(attempt.updatedAt)}</div>
              {attempt.overallScore !== null && attempt.overallScore !== undefined && <div><b>Verified score:</b> {attempt.overallScore}/100</div>}
            </div>
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
          </article>;
        })}
      </section>}

      {showTimed && <section style={{ display: "grid", gap: 10 }} data-testid="timed-assignments">
        <h2 style={{ margin: 0 }}>Timed assignment attempts</h2>
        <p style={{ margin: 0, color: "#64748b" }}>
          Countdown derives from the learner's saved start time and assigned duration.
          Reset removes only that timed workbook attempt, not a mock result.
        </p>
        {timerError && <div role="alert" style={{ ...card, color: "#991b1b", borderColor: "#fecaca" }}>{timerError}</div>}
        {loading && <p>Loading timed assignments…</p>}
        {!loading && !filteredTimed.length && <div style={card}>No timed attempts match this search.</div>}
        {filteredTimed.map(attempt => {
          const end = timeEnd(attempt);
          const remaining = remainingSeconds(end, now);
          return <article key={attempt.id} style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <div><strong>{attempt.assignmentKey || "Timed assignment"}</strong><div style={{ color: "#475569" }}>{attempt.studentEmail || attempt.studentCode || attempt.studentId || "Unknown student"}</div></div>
              <strong>{attempt.status || "active"}</strong>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 9, fontSize: 13 }}>
              <span><b>Level:</b> {attempt.level || "—"}</span>
              <span><b>Started:</b> {formatDate(attempt.startedAt || attempt.clientStartedAt)}</span>
              <span><b>Ends:</b> {end ? formatDate(end) : "—"}</span>
              <span><b>Duration:</b> {attempt.durationSeconds ? Math.round(attempt.durationSeconds / 60) + " min" : "—"}</span>
              <span><b>Time left:</b> {attempt.status === "submitted" ? "Submitted" : attempt.status === "expired" ? "Expired" : clockLabel(remaining)}</span>
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

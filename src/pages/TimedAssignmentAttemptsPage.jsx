import { startVisiblePolling } from "../utils/visiblePolling.js";
import { createTimedAttemptListenerHealth } from "../utils/timedAttemptListenerHealth.js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { collection, deleteDoc, doc, documentId, onSnapshot, query as firestoreQuery, where } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { fetchPlacementAttempts, fetchPlacementLeads, normalizePlacementResults, placementStatus, countRegisteredOrPaidPlacements } from "../services/placementAttemptService.js";
import {
  clockLabel,
  filterMockAttempts,
  filterTimedAttempts,
  timedAttemptStatus,
  timedAttemptStatusLabel,
  mockActivityLabel,
  mockSectionProgress,
  mockScoreText,
  mockVerifiedScores,
  mockCompleteSkillCount,
  MOCK_SECTION_LABELS,
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
  const { isStaff } = useAuth();
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timerError, setTimerError] = useState("");
  const [resettingId, setResettingId] = useState("");
  const [mocks, setMocks] = useState([]);
  const [mockLoading, setMockLoading] = useState(true);
  const [mockError, setMockError] = useState("");
  const [placementRecords, setPlacementRecords] = useState([]);
  const [placementLeads, setPlacementLeads] = useState(null);
  const [placementLoading, setPlacementLoading] = useState(false);
  const [placementLoadedAt, setPlacementLoadedAt] = useState("");
  const [placementError, setPlacementError] = useState("");
  const [placementLeadError, setPlacementLeadError] = useState("");
  const [placementFilter, setPlacementFilter] = useState("all");
  const [lastChecked, setLastChecked] = useState("");
  const [partial, setPartial] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("mocks");
  const [mockStatus, setMockStatus] = useState("all");
  const [mockLevel, setMockLevel] = useState("all");
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
    // Mount the Firestore listener only while the Campus tab is open.
    // Placement and mocks should not incur background Firestore reads.
    if (category !== "timed") { setLoading(false); return undefined; }
    setLoading(true);
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
  }, [category]);

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

  const loadPlacement = useCallback(async () => {
    setPlacementLoading(true);
    try {
      // Keep the attempts visible even when the independent published Leads
      // feed is down, but NEVER infer conversion status from an empty fallback.
      const [attemptResult, leadResult] = await Promise.allSettled([
        fetchPlacementAttempts(auth),
        fetchPlacementLeads(),
      ]);
      if (attemptResult.status === "fulfilled") {
        setPlacementRecords(attemptResult.value.attempts);
        setPlacementLoadedAt(attemptResult.value.checkedAt || new Date().toISOString());
        setPlacementError("");
      } else {
        setPlacementError(attemptResult.reason?.message || "Could not load placement attempts.");
      }
      if (leadResult.status === "fulfilled") {
        setPlacementLeads(leadResult.value);
        setPlacementLeadError("");
      } else {
        setPlacementLeads(null);
        setPlacementLeadError("Leads sheet unavailable. Registration and payment status cannot be verified. Refresh to retry.");
      }
    } finally { setPlacementLoading(false); }
  }, []);

  useEffect(() => {
    // One request on opening the tab, then only when staff clicks Refresh.
    if (category === "placement") void loadPlacement();
  }, [category, loadPlacement]);

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

  const filteredMocks = useMemo(() => filterMockAttempts(mocks, query, mockStatus, mockLevel), [mocks, query, mockStatus, mockLevel]);
  const filteredTimed = useMemo(() => filterTimedAttempts(attempts, query, timedStatus), [attempts, query, timedStatus]);
  const placementRows = useMemo(()=>normalizePlacementResults(placementRecords,placementLeads),[placementRecords,placementLeads]);
  const filteredPlacement = useMemo(()=>placementRows.filter(row=>{
    if(placementFilter!=="all" && (placementFilter==="contacted" ? !row.consent : placementStatus(row,now)!==placementFilter))return false;
    const needle=query.trim().toLowerCase();
    return !needle || [row.id,row.name,row.email,row.phone,row.score?.level,row.conversionStage].some(v=>String(v||"").toLowerCase().includes(needle));
  }),[placementRows,placementFilter,query,now]);
  const mockInProgress = mocks.filter(row => row.status === "in_progress").length;
  const mockCompleted = mocks.filter(row => row.status === "completed").length;
  const timedInProgress = attempts.filter(row => timedAttemptStatus(row) === "in_progress").length;
  const timedCompleted = attempts.filter(row => timedAttemptStatus(row) === "completed").length;
  const showMocks = category === "mocks";
  const showTimed = category === "timed";
  const showPlacement = category === "placement";
  const placementCompleted = placementRows.filter(x=>x.completedAt).length;
  const placementContacted = placementRows.filter(x=>x.consent).length;
  const placementRegistered = countRegisteredOrPaidPlacements(placementRows, Array.isArray(placementLeads));
  const switchCategory = (next) => {
    setCategory(next);
    setQuery("");
    setMockStatus("all");
    setMockLevel("all");
    setTimedStatus("all");
    setPlacementFilter("all");
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
          Monitor Exam Room mocks, Campus timed assignments and public placement tests separately.
          Placement activity is saved only at start, completion and optional contact capture; the countdown is not a live online-presence signal.
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
        <button type="button" role="tab" id="monitor-placement-tab" aria-controls="placement-attempts"
          aria-selected={showPlacement} className="monitor-tab" onClick={() => switchCategory("placement")}>
          <strong>Placement tests</strong>
          <span>A1–B1 · 30 questions · 20 min</span>
        </button>
      </nav>

      <section className="monitor-summary" aria-label={showMocks ? "Exam Room mock summary" : showPlacement ? "Placement test summary" : "Campus timed test summary"}>
        {(showPlacement ? [
          ["Attempts captured", placementLoading && !placementLoadedAt ? "…" : placementRecords.length],
          ["Completed", placementCompleted],
          ["Contact leads", placementContacted],
        ] : showMocks ? [
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
          <strong>{showMocks ? "Search Exam Room mocks" : showPlacement ? "Search placement attempts" : "Search Campus timed tests"}</strong>
          <input type="search" value={query} onChange={event => setQuery(event.target.value)}
            placeholder={showPlacement ? "Search name, email, attempt ID or level…" : showMocks ? "Student name, email, ID or mock ID…" : "Student name, email, ID or assignment…"} />
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
        <div className="monitor-status-filters" role="group" aria-label="Filter Exam Room mock level">
          <strong style={{fontSize:12,color:"#475569"}}>Level</strong>
          {["all","A1","A2","B1"].map(level=>
            <button className="monitor-status-button" key={level} type="button"
              onClick={()=>setMockLevel(level)} aria-pressed={mockLevel===level}>
              {level==="all"?"All levels":level}
            </button>)}
        </div>
        <p className="monitor-mock-scores__note" style={{margin:0}}>
          Completed mocks show Lesen, Hören, Schreiben, Sprechen and Total separately. Results must be server-verified; unavailable historical section marks are labelled “Not recorded”.
        </p>
        {mockError && <div role="alert" style={{ ...card, color: "#991b1b", borderColor: "#fecaca" }}>
          {mockError}{lastChecked ? " · Showing last successfully loaded data." : ""}
        </div>}
        {partial && <p style={{ color: "#92400e", margin: 0 }}>Showing a limited recent-history window; older mock attempts may be omitted.</p>}
        {mockLoading && !lastChecked && <p>Loading mock attempts…</p>}
        {!mockLoading && !filteredMocks.length && <div style={card}>
          {mockError ? "Mock monitoring is unavailable." : "No mock attempts match these filters. Mock 2 exercises stored only in browser storage will not appear here."}
        </div>}
        {filteredMocks.some(attempt=>attempt.status==="completed" && attempt.progressSource!=="browser_reported") && (
          <section className="monitor-mock-summary-table" aria-label="Completed mock results by skill">
            <div className="monitor-mock-summary-table__heading">
              <div>
                <h3 style={{margin:0}}>Completed mock results · {mockLevel==="all"?"All levels":mockLevel}</h3>
                <small>Five verified results per student and attempt. Filter A1, A2 or B1 above to compare within a level.</small>
              </div>
              <small>Showing up to 50 recent completed mocks</small>
            </div>
            <div className="monitor-mock-summary-table__scroll" role="region" aria-label="Scroll mock result columns" tabIndex={0}>
              <table>
                <thead><tr>
                  <th scope="col">Student</th>
                  <th scope="col">Level</th>
                  <th scope="col">Mock</th>
                  {MOCK_SECTIONS.map(section=><th scope="col" key={section}>{MOCK_SECTION_LABELS[section]} <small>/25</small></th>)}
                  <th scope="col">Total <small>/100</small></th>
                </tr></thead>
                <tbody>
                  {filteredMocks.filter(attempt=>attempt.status==="completed" && attempt.progressSource!=="browser_reported").slice(0,50).map(attempt=>{
                    const scores=mockVerifiedScores(attempt);
                    return <tr key={attempt.id}>
                      <th scope="row">{attempt.studentName || attempt.studentEmail || attempt.uid || "Student not identified"}</th>
                      <td>{attempt.level}</td>
                      <td>{attempt.mockId} · #{attempt.attemptNumber}</td>
                      {MOCK_SECTIONS.map(section=><td key={section} data-label={MOCK_SECTION_LABELS[section]}>{mockScoreText(scores?.sections?.[section])}</td>)}
                      <td className="monitor-mock-summary-table__total">{mockScoreText(scores?.total,100)}</td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
            <small className="monitor-mock-scores__note">“Not recorded” means a verified skill mark is missing from that historical attempt; it is not a zero score. Expand each student card below for the original attempt details.</small>
          </section>
        )}
        {filteredMocks.map(attempt => {
          const progress = mockSectionProgress(attempt);
          const remaining = remainingSeconds(attempt.sectionDeadlineMs, now);
          const current = attempt.section;
          const status = mockActivityLabel(attempt, now);
          const verifiedScores = mockVerifiedScores(attempt);
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
            </div>
            {verifiedScores ? (
              <section className="monitor-mock-scores" aria-label={`Verified mock scores for ${attempt.level} ${attempt.mockId}`}>
                <div className="monitor-mock-scores__header">
                  <strong>{attempt.level} · Skill-by-skill mock result</strong>
                  <small>Lesen · Hören · Schreiben · Sprechen: each /25 · Total /100</small>
                </div>
                <div className="monitor-mock-scores__grid">
                  {MOCK_SECTIONS.map(section => (
                    <div className="monitor-mock-score" key={section}>
                      <span>{MOCK_SECTION_LABELS[section]}</span>
                      <strong>{mockScoreText(verifiedScores.sections[section])}</strong>
                    </div>
                  ))}
                  <div className="monitor-mock-score monitor-mock-score--total">
                    <span>Total</span>
                    <strong>{mockScoreText(verifiedScores.total, 100)}</strong>
                  </div>
                </div>
                {mockCompleteSkillCount(attempt) === 4 && (
                  <small className="monitor-mock-scores__note">
                    {verifiedScores.source === "published_final_result" ? "Recovered from the student's saved verified final mock result." : "Verified and saved with the completed mock attempt."}
                  </small>
                )}
                {MOCK_SECTIONS.some(section=>verifiedScores.sections[section] === null) && (
                  <small className="monitor-mock-scores__note">Some older mock records have no saved section breakdown. Missing marks are shown as “Not recorded,” not zero.</small>
                )}
              </section>
            ) : attempt.status === "completed" && attempt.progressSource !== "browser_reported" ? (
              <p className="monitor-mock-scores__note">This attempt has no server-verified score record yet. Section scores are not available.</p>
            ) : null}
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


      {showPlacement && <section id="placement-attempts" role="tabpanel" aria-labelledby="monitor-placement-tab" className="monitor-content" data-testid="placement-monitoring">
        <div style={{ display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap",alignItems:"center" }}>
          <div>
            <h2 style={{margin:0}}>Public German placement test</h2>
            <p style={{color:"#64748b",margin:"5px 0 0",fontSize:13}}>
              Last checked: {placementLoadedAt ? formatDate(placementLoadedAt) : "not yet"} · No continuous polling · {placementRegistered === null ? "Conversion counts unavailable" : `${placementRegistered} registered or paid leads`}
            </p>
          </div>
          <button type="button" onClick={loadPlacement} disabled={placementLoading} style={{padding:"10px 15px",border:"1px solid #2563eb",borderRadius:10,background:"#fff",color:"#1d4ed8",fontWeight:800,cursor:"pointer"}}>
            {placementLoading?"Refreshing…":"Refresh placements"}
          </button>
        </div>
        <p style={{margin:0,color:"#475569",fontSize:13}}>Scores are available to staff only. Anonymous starts cannot be contacted until the learner chooses to save contact details. The suggested level is a preliminary recommendation, not an official certificate.</p>
        <div className="monitor-status-filters" role="group" aria-label="Filter placement status">
          {[["all","All"],["in_progress","In progress"],["completed","Completed"],["expired","Expired"],["contacted","Contact saved"]].map(([value,label])=>
            <button key={value} className="monitor-status-button" type="button" aria-pressed={placementFilter===value} onClick={()=>setPlacementFilter(value)}>{label}</button>
          )}
          <span className="monitor-filter-count">{filteredPlacement.length} shown</span>
        </div>
        {placementError && <div role="alert" style={{...card,borderColor:"#fecaca",color:"#991b1b"}}>{placementError}{placementLoadedAt?" · Showing previously loaded data.":""}</div>}
        {placementLeadError && <div role="alert" style={{...card,borderColor:"#fde68a",color:"#92400e"}}>{placementLeadError} Existing attempts and scores remain available.</div>}
        {placementLoading && !placementLoadedAt && <p>Loading placement records…</p>}
        {!placementLoading && !filteredPlacement.length && <div style={card}>{placementError?"Placement monitoring could not be loaded.":"No placement records match these filters."}</div>}
        {filteredPlacement.map(attempt=>{
          const status=placementStatus(attempt,now);
          const score=attempt.score;
          const email=attempt.email||"";
          const phone=String(attempt.phone||"").replace(/\D/g,"").replace(/^0(?=\d{9}$)/,"233");
          const followup="Hello"+(attempt.name?" "+attempt.name:"")+", thank you for completing Falowen's German placement test. Your suggested starting level is "+(score?.level||"your recommended level")+". We can help you choose a class and register: https://www.falowen.app/signup?level="+encodeURIComponent(score?.level||"A1")+"&source=placement-test";
          return <article key={attempt.id} style={card}>
            <div style={{display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
              <div style={{display:"grid",gap:4}}>
                <strong style={{fontSize:16}}>{attempt.name || "Anonymous learner"}</strong>
                <small style={{color:"#64748b",overflowWrap:"anywhere"}}>{attempt.email||attempt.phone||attempt.id}</small>
              </div>
              <strong style={{color:status==="completed"?"#166534":status==="expired"?"#b45309":"#1d4ed8"}}>
                {status==="in_progress"?"In progress":status==="expired"?"Expired":"Completed"}
              </strong>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(145px,1fr))",gap:10,fontSize:13}}>
              <span><b>Started:</b> {formatDate(attempt.startedAt)}</span>
              <span><b>Submitted:</b> {formatDate(attempt.completedAt)}</span>
              <span><b>Suggested level:</b> {score?.level||"—"}</span>
              <span><b>Overall:</b> {score ? score.total+"/30" : "—"}</span>
              <span><b>A1:</b> {score ? score.a1+"/10" : "—"}</span>
              <span><b>A2:</b> {score ? score.a2+"/10" : "—"}</span>
              <span><b>B1:</b> {score ? score.b1+"/10" : "—"}</span>
              <span><b>Answered:</b> {score ? score.answered+"/30" : "—"}</span>
            </div>
            <div style={{borderTop:"1px solid #e2e8f0",paddingTop:11,display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,flexWrap:"wrap"}}>
              <strong style={{color:attempt.consent?"#14532d":"#64748b",fontSize:13}}>
                {attempt.conversionStage}
              </strong>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {attempt.consent&&email&&<a href={"mailto:"+encodeURIComponent(email)+"?subject="+encodeURIComponent("Your Falowen placement result")+"&body="+encodeURIComponent(followup)} style={{color:"#1d4ed8",fontWeight:700}}>Email learner</a>}
                {attempt.consent&&phone&&<a target="_blank" rel="noopener noreferrer" href={"https://wa.me/"+phone+"?text="+encodeURIComponent(followup)} style={{color:"#166534",fontWeight:700}}>WhatsApp</a>}
                {attempt.consent&&!isStaff&&<a href="/leads" style={{color:"#1d4ed8",fontWeight:700}}>Open Leads</a>}
              </div>
            </div>
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


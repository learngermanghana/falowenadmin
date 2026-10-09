import { useEffect, useMemo, useState } from "react";
import { collection, collectionGroup, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

const COLLECTION = "submissionLocks";
const MOCK_SECTIONS = ["lesen", "hoeren", "schreiben", "sprechen"];
const MOCK_LABELS = { lesen: "Lesen", hoeren: "Hören", schreiben: "Schreiben", sprechen: "Sprechen" };
const mockLevel = (path = "") => /^([a-c][12])MockExamUsers\//i.exec(path)?.[1]?.toUpperCase() || "";
const mockProgress = (record = {}) => {
  const state = record.state || record.progress || {};
  const completed = record.completedSections || state.completedSections || {};
  return MOCK_SECTIONS.map((key) => ({
    key,
    done: Boolean(completed[key] || record.verifiedSections?.[key]?.verified || state[`${key}Completed`] || state[`${key}CompletedAt`] || state[`${key}Done`]),
  }));
};

const toMillis = (value) => {
  if (!value) return 0;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.toDate === "function") return value.toDate().getTime();
  if (Number.isFinite(value?.seconds)) return Number(value.seconds) * 1000;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatDate = (value) => {
  const millis = toMillis(value);
  if (!millis) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(millis));
};

const endTime = (attempt = {}) => {
  const started = toMillis(attempt.startedAt) || Number(attempt.clientStartedAt) || 0;
  const duration = Number(attempt.durationSeconds) || 0;
  return started && duration ? started + (duration * 1000) : 0;
};

export default function TimedAssignmentAttemptsPage() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resettingId, setResettingId] = useState("");
  const [query, setQuery] = useState("");
  const [view, setView] = useState("mock");
  const [mockAttempts, setMockAttempts] = useState([]);
  const [mockError, setMockError] = useState("");
  const [mockLoading, setMockLoading] = useState(true);
  const [clock, setClock] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 15000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => onSnapshot(collectionGroup(db, "attempts"), (snapshot) => {
    const rows = snapshot.docs.filter((entry) => mockLevel(entry.ref.path)).map((entry) => ({ ...entry.data(), id: entry.id, path: entry.ref.path, level: mockLevel(entry.ref.path) }));
    setMockAttempts(rows.sort((a, b) => (toMillis(b.updatedAt || b.startedAt || b.createdAt) - toMillis(a.updatedAt || a.startedAt || a.createdAt))));
    setMockError(""); setMockLoading(false);
  }, (err) => { setMockError(err?.message || "Mock attempts could not be loaded."); setMockLoading(false); }), []);

  useEffect(() => {
    return onSnapshot(
      collection(db, COLLECTION),
      (snapshot) => {
        const rows = snapshot.docs
          .map((entry) => ({ id: entry.id, ...entry.data() }))
          .filter((entry) => entry.timerRecord === true || String(entry.id || "").startsWith("timed__"))
          .sort((a, b) => (toMillis(b.startedAt) || Number(b.clientStartedAt) || 0) - (toMillis(a.startedAt) || Number(a.clientStartedAt) || 0));
        setAttempts(rows);
        setLoading(false);
        setError("");
      },
      (snapshotError) => {
        setLoading(false);
        setError(snapshotError?.message || "Could not load timed assignment attempts.");
      },
    );
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return attempts;
    return attempts.filter((attempt) =>
      [
        attempt.studentEmail,
        attempt.studentCode,
        attempt.studentId,
        attempt.assignmentKey,
        attempt.level,
        attempt.status,
      ].some((value) => String(value || "").toLowerCase().includes(needle))
    );
  }, [attempts, query]);

  const visibleMocks = mockAttempts.filter((attempt) => [attempt.email, attempt.studentEmail, attempt.studentCode, attempt.uid, attempt.mockId, attempt.assignmentId, attempt.level, attempt.status].some((value) => String(value || "").toLowerCase().includes(query.trim().toLowerCase())));

  const resetAttempt = async (attempt) => {
    const label = [attempt.studentEmail || attempt.studentCode || attempt.studentId, attempt.assignmentKey]
      .filter(Boolean)
      .join(" · ");
    if (!window.confirm(`Reset timed attempt for ${label}? The student will be allowed to start a fresh timed attempt.`)) return;

    setResettingId(attempt.id);
    setError("");
    try {
      await deleteDoc(doc(db, COLLECTION, attempt.id));
    } catch (resetError) {
      setError(resetError?.message || "Could not reset this timed attempt.");
    } finally {
      setResettingId("");
    }
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <section style={{ border: "1px solid #bfdbfe", borderRadius: 20, padding: 20, background: "linear-gradient(135deg,#eff6ff,#fff)" }}>
        <p style={{ margin: 0, color: "#1d4ed8", fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".08em" }}>
          Exam controls
        </p>
        <h1 style={{ margin: "6px 0 4px" }}>Mock exams & timed attempts</h1>
        <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
          Monitor students taking mock exams, their section progress and timing, or manage timed workbook attempts. Mock attempts are read-only; resetting a workbook timer remains a separate action.
        </p>
      </section>

      <nav aria-label="Attempt monitoring views" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" onClick={() => setView("mock")} aria-pressed={view === "mock"}>Mock progress ({mockAttempts.length})</button>
        <button type="button" onClick={() => setView("timed")} aria-pressed={view === "timed"}>Timed workbooks ({attempts.length})</button>
      </nav>
      <section style={{ display: "grid", gap: 10, border: "1px solid #e2e8f0", borderRadius: 16, padding: 14, background: "#fff" }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 800 }}>Search student or assignment</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Email, student code, A1-12.3, A2-10.27…"
            style={{ minHeight: 42, border: "1px solid #cbd5e1", borderRadius: 10, padding: "8px 10px" }}
          />
        </label>
        <span style={{ color: "#64748b", fontSize: 13 }}>
          {view === "mock" ? (mockLoading ? "Loading mock attempts…" : `${visibleMocks.length} of ${mockAttempts.length} mock attempts`) : (loading ? "Loading attempts…" : `${filtered.length} of ${attempts.length} timed attempts`)}
        </span>
      </section>

      {view === "mock" ? (
        <section aria-label="Mock exam monitoring" style={{ display: "grid", gap: 12 }}>
          {mockError ? <p role="alert">Mock monitoring unavailable: {mockError}. Verify Firestore collection-group read permissions for staff.</p> : null}
          <p style={{ margin: 0, color: "#64748b" }}>Live Firestore records for A1/A2 mock attempts. Browser-only mock progress (including A2 Mock 2) is not visible across devices until synchronized to the server.</p>
          {!mockLoading && !visibleMocks.length && !mockError ? <p>No server-recorded mock attempts match this search.</p> : null}
          {visibleMocks.map((attempt) => {
            const stages = mockProgress(attempt);
            const done = stages.filter((stage) => stage.done).length;
            const started = toMillis(attempt.startedAt || attempt.createdAt);
            const duration = Number(attempt.durationSeconds) || Number(attempt.durationMinutes || 0) * 60;
            const remaining = started && duration ? Math.max(0, Math.ceil((started + duration * 1000 - clock) / 1000)) : null;
            return <article key={attempt.path} style={{ border: "1px solid #e2e8f0", background: "#fff", borderRadius: 14, padding: 16, display: "grid", gap: 9 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}><strong>{attempt.studentName || attempt.studentEmail || attempt.email || attempt.studentCode || attempt.uid || attempt.path.split("/")[1]}</strong><strong>{attempt.level} · {attempt.mockId || attempt.assignmentId || "Mock exam"}</strong></div>
              <div style={{ color: "#475569" }}>Status: {attempt.status || "started"} · Started: {formatDate(attempt.startedAt || attempt.createdAt)} · Last update: {formatDate(attempt.updatedAt)} · Time: {remaining === null ? "Not recorded" : attempt.status === "completed" ? "Completed" : `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")} remaining`}</div>
              <div role="progressbar" aria-label="Recorded mock sections" aria-valuenow={done} aria-valuemin={0} aria-valuemax={4} style={{ height: 10, background: "#e2e8f0", borderRadius: 8, overflow: "hidden" }}><div style={{ height: "100%", width: `${done * 25}%`, background: "#2563eb" }} /></div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>{stages.map((stage) => <span key={stage.key}>{MOCK_LABELS[stage.key]}: {stage.done ? "Done" : "Not confirmed"}</span>)}</div>
              <small>Recorded progress: {done}/4. Unrecorded stages are not proof of inactivity.</small>
            </article>;
          })}
        </section>
      ) : null}
      {view === "timed" && error ? (
        <section role="alert" style={{ border: "1px solid #fecaca", borderRadius: 14, padding: 12, background: "#fef2f2", color: "#991b1b" }}>
          {error}
        </section>
      ) : null}

      {view === "timed" ? <section style={{ display: "grid", gap: 10 }}>
        {!loading && !filtered.length ? (
          <div style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: 16, background: "#fff", color: "#64748b" }}>
            No timed attempts match this search.
          </div>
        ) : null}

        {filtered.map((attempt) => {
          const end = endTime(attempt);
          return (
            <article
              key={attempt.id}
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: 16,
                padding: 14,
                background: "#fff",
                display: "grid",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
                <div style={{ display: "grid", gap: 3 }}>
                  <strong style={{ fontSize: 17 }}>{attempt.assignmentKey || "Timed assignment"}</strong>
                  <span style={{ color: "#475569" }}>{attempt.studentEmail || attempt.studentCode || attempt.studentId || "Unknown student"}</span>
                </div>
                <span style={{ padding: "6px 10px", borderRadius: 999, background: attempt.status === "submitted" ? "#dcfce7" : attempt.status === "expired" ? "#fee2e2" : "#dbeafe", color: "#0f172a", fontWeight: 900, fontSize: 12, textTransform: "uppercase" }}>
                  {attempt.status || "active"}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 8, color: "#475569", fontSize: 13 }}>
                <span><strong>Level:</strong> {attempt.level || "—"}</span>
                <span><strong>Started:</strong> {formatDate(attempt.startedAt || attempt.clientStartedAt)}</span>
                <span><strong>Ends:</strong> {end ? formatDate(end) : "—"}</span>
                <span><strong>Duration:</strong> {attempt.durationSeconds ? Math.round(attempt.durationSeconds / 60) + " min" : "—"}</span>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => resetAttempt(attempt)}
                  disabled={resettingId === attempt.id}
                  style={{
                    border: "1px solid #dc2626",
                    borderRadius: 10,
                    background: "#fff",
                    color: "#b91c1c",
                    fontWeight: 900,
                    padding: "9px 12px",
                    cursor: resettingId === attempt.id ? "wait" : "pointer",
                  }}
                >
                  {resettingId === attempt.id ? "Resetting…" : "Reset timed attempt"}
                </button>
              </div>
            </article>
          );
        })}
      </section> : null}
    </div>
  );
}

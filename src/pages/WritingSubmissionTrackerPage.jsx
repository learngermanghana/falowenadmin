import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

const WRITING_SUBMISSIONS_COLLECTION = "writingSubmissions";

function clean(value) {
  return String(value ?? "").trim();
}

function toMillis(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.getTime();
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (typeof value === "object") {
    if (typeof value.toMillis === "function") return value.toMillis();
    if (typeof value.toDate === "function") {
      const date = value.toDate();
      return date instanceof Date && !Number.isNaN(date.getTime()) ? date.getTime() : null;
    }
    const seconds = typeof value.seconds === "number" ? value.seconds : typeof value._seconds === "number" ? value._seconds : null;
    return seconds !== null ? seconds * 1000 : null;
  }
  return null;
}

function latestActivityMillis(record = {}) {
  return Math.max(
    toMillis(record.updatedAt) || 0,
    toMillis(record.lastUpdatedAt) || 0,
    toMillis(record.modifiedAt) || 0,
    toMillis(record.submittedAt) || 0,
    toMillis(record.createdAt) || 0,
    toMillis(record.timestamp) || 0,
  );
}

function formatDate(value) {
  const millis = toMillis(value);
  if (!millis) return "Not recorded";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(millis));
}

function serializeForJson(value) {
  if (!value || typeof value !== "object") return value;
  if (typeof value.toDate === "function") return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(serializeForJson);
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, serializeForJson(entry)]));
}

function firstTextValue(record = {}, fieldNames = []) {
  for (const fieldName of fieldNames) {
    const value = record[fieldName];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (Array.isArray(value) && value.length) {
      const joined = value
        .map((entry) => (typeof entry === "string" ? entry : JSON.stringify(serializeForJson(entry))))
        .filter(Boolean)
        .join("\n");
      if (joined.trim()) return joined.trim();
    }
    if (value && typeof value === "object") {
      const json = JSON.stringify(serializeForJson(value), null, 2);
      if (json && json !== "{}") return json;
    }
  }
  return "";
}

function metadataValue(record = {}, fieldNames = []) {
  for (const fieldName of fieldNames) {
    const value = record[fieldName];
    if (value !== undefined && value !== null && clean(value)) return clean(value);
  }
  return "—";
}

function StatCard({ label, value }) {
  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 16, padding: 16, background: "#fff" }}>
      <p style={{ margin: 0, color: "#64748b", fontSize: 12, fontWeight: 900, letterSpacing: ".08em", textTransform: "uppercase" }}>{label}</p>
      <strong style={{ display: "block", marginTop: 8, color: "#0f172a", fontSize: 18, overflowWrap: "anywhere" }}>{value}</strong>
    </div>
  );
}

export default function WritingSubmissionTrackerPage() {
  const params = useParams();
  const routeSubmissionId = clean(params.submissionId);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState("");
  const [trackerState, setTrackerState] = useState({
    submissions: [],
    loading: true,
    error: "",
    lastSyncedAt: null,
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, WRITING_SUBMISSIONS_COLLECTION),
      (snapshot) => {
        const submissions = snapshot.docs
          .map((submissionDoc) => ({ id: submissionDoc.id, ...submissionDoc.data() }))
          .sort((left, right) => latestActivityMillis(right) - latestActivityMillis(left));

        setTrackerState({
          submissions,
          loading: false,
          error: "",
          lastSyncedAt: Date.now(),
        });
      },
      (snapshotError) => {
        setTrackerState({
          submissions: [],
          loading: false,
          error: snapshotError?.message || "Unable to load writing submissions.",
          lastSyncedAt: Date.now(),
        });
      },
    );

    return unsubscribe;
  }, []);

  const submissions = trackerState.submissions;
  const selectedId = routeSubmissionId || selectedSubmissionId || submissions[0]?.id || "";
  const submission = submissions.find((entry) => entry.id === selectedId) || null;
  const exists = Boolean(submission);
  const loading = trackerState.loading;
  const error = trackerState.error;
  const lastSyncedAt = trackerState.lastSyncedAt;

  const studentContent = useMemo(
    () => firstTextValue(submission || {}, ["studentContent", "studentText", "studentWriting", "submissionText", "writing", "content", "text", "answer", "answers", "response", "message"]),
    [submission],
  );

  const promptContent = useMemo(
    () => firstTextValue(submission || {}, ["prompt", "question", "task", "instructions", "assignmentPrompt", "writingPrompt", "rubric"]),
    [submission],
  );

  const rawSelectedJson = useMemo(() => JSON.stringify(serializeForJson(submission || {}), null, 2), [submission]);
  const rawCollectionJson = useMemo(() => JSON.stringify(serializeForJson(submissions), null, 2), [submissions]);

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <section style={{ borderRadius: 28, padding: "24px clamp(18px, 4vw, 34px)", color: "#fff", background: "linear-gradient(135deg, #0f172a 0%, #4338ca 55%, #0891b2 100%)", boxShadow: "0 28px 70px -48px rgba(15, 23, 42, .85)" }}>
        <p style={{ margin: 0, color: "rgba(255,255,255,.7)", fontWeight: 900, letterSpacing: ".14em", textTransform: "uppercase", fontSize: 12 }}>Live Firestore tracker</p>
        <h1 style={{ margin: "8px 0", fontSize: "clamp(2rem, 5vw, 3.6rem)", letterSpacing: "-.06em" }}>Writing submissions</h1>
        <p style={{ margin: 0, maxWidth: 880, color: "rgba(255,255,255,.84)", lineHeight: 1.7 }}>
          Watching every document in <strong>{WRITING_SUBMISSIONS_COLLECTION}</strong> in real time so tutors can review all writing submissions without a hard-coded document id.
        </p>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        <StatCard label="Documents" value={loading ? "Loading…" : submissions.length} />
        <StatCard label="Status" value={loading ? "Loading…" : error ? "Error" : submissions.length ? "Live" : "No submissions"} />
        <StatCard label="Selected" value={selectedId || "—"} />
        <StatCard label="Last synced" value={lastSyncedAt ? formatDate(lastSyncedAt) : "Not synced yet"} />
      </section>

      {error ? (
        <section style={{ border: "1px solid #fecaca", borderRadius: 18, padding: 18, background: "#fef2f2", color: "#991b1b" }}>
          <strong>Could not load writing submissions.</strong>
          <p style={{ margin: "8px 0 0" }}>{error}</p>
        </section>
      ) : null}

      {!loading && !error && !submissions.length ? (
        <section style={{ border: "1px solid #fde68a", borderRadius: 18, padding: 18, background: "#fffbeb", color: "#92400e" }}>
          <strong>No documents found.</strong>
          <p style={{ margin: "8px 0 0" }}>Firestore did not return any documents from {WRITING_SUBMISSIONS_COLLECTION}.</p>
        </section>
      ) : null}

      {!loading && !error && routeSubmissionId && !exists ? (
        <section style={{ border: "1px solid #fde68a", borderRadius: 18, padding: 18, background: "#fffbeb", color: "#92400e" }}>
          <strong>Selected document not found.</strong>
          <p style={{ margin: "8px 0 0" }}>The collection loaded, but no document matched {routeSubmissionId}. Showing the full collection data below.</p>
        </section>
      ) : null}

      <section style={{ display: "grid", gridTemplateColumns: "minmax(260px, .45fr) minmax(0, 1fr)", gap: 16 }}>
        <aside style={{ border: "1px solid #e2e8f0", borderRadius: 22, background: "#fff", overflow: "hidden", alignSelf: "start" }}>
          <header style={{ padding: 18, borderBottom: "1px solid #e2e8f0" }}>
            <p style={{ margin: 0, color: "#64748b", fontWeight: 900, letterSpacing: ".1em", textTransform: "uppercase", fontSize: 12 }}>All submissions</p>
            <h2 style={{ margin: "6px 0 0", color: "#0f172a" }}>{loading ? "Loading…" : `${submissions.length} document${submissions.length === 1 ? "" : "s"}`}</h2>
          </header>
          <div style={{ display: "grid", gap: 8, padding: 12, maxHeight: 620, overflow: "auto" }}>
            {loading ? <p style={{ margin: 6, color: "#64748b" }}>Loading Firestore collection…</p> : null}
            {!loading && !submissions.length ? <p style={{ margin: 6, color: "#64748b" }}>No writing submissions found.</p> : null}
            {submissions.map((entry) => {
              const isSelected = entry.id === selectedId;
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setSelectedSubmissionId(entry.id)}
                  style={{
                    textAlign: "left",
                    border: `1px solid ${isSelected ? "#2563eb" : "#e2e8f0"}`,
                    borderRadius: 14,
                    padding: 12,
                    background: isSelected ? "#eff6ff" : "#fff",
                    cursor: "pointer",
                  }}
                >
                  <strong style={{ display: "block", color: "#0f172a", overflowWrap: "anywhere" }}>{entry.id}</strong>
                  <span style={{ display: "block", marginTop: 4, color: "#475569", fontSize: 13, overflowWrap: "anywhere" }}>
                    {metadataValue(entry, ["studentName", "name", "displayName", "studentEmail", "email", "studentCode", "studentId"])}
                  </span>
                  <span style={{ display: "block", marginTop: 4, color: "#64748b", fontSize: 12 }}>
                    {formatDate(entry.updatedAt || entry.lastUpdatedAt || entry.modifiedAt || entry.submittedAt || entry.createdAt || entry.timestamp)}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <div style={{ display: "grid", gap: 16 }}>
          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            <StatCard label="Document" value={selectedId || "—"} />
            <StatCard label="Student" value={metadataValue(submission || {}, ["studentName", "name", "displayName", "studentEmail", "email", "studentCode", "studentId"])} />
            <StatCard label="Assignment" value={metadataValue(submission || {}, ["assignmentTitle", "assignmentName", "assignment", "assignmentId", "taskTitle"])} />
          </section>

          <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.25fr) minmax(280px, .75fr)", gap: 16 }}>
            <article style={{ border: "1px solid #e2e8f0", borderRadius: 22, background: "#fff", overflow: "hidden" }}>
              <header style={{ padding: 18, borderBottom: "1px solid #e2e8f0" }}>
                <p style={{ margin: 0, color: "#64748b", fontWeight: 900, letterSpacing: ".1em", textTransform: "uppercase", fontSize: 12 }}>Student content</p>
                <h2 style={{ margin: "6px 0 0", color: "#0f172a" }}>Content used by the student</h2>
              </header>
              <pre style={{ margin: 0, padding: 18, minHeight: 320, whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", lineHeight: 1.65, background: "#f8fafc", color: "#111827" }}>
                {loading ? "Loading live submission content…" : studentContent || "Select a submission or wait for one to arrive."}
              </pre>
            </article>

            <aside style={{ display: "grid", gap: 16, alignContent: "start" }}>
              <article style={{ border: "1px solid #e2e8f0", borderRadius: 22, padding: 18, background: "#fff" }}>
                <p style={{ margin: 0, color: "#64748b", fontWeight: 900, letterSpacing: ".1em", textTransform: "uppercase", fontSize: 12 }}>Submission details</p>
                <dl style={{ display: "grid", gap: 12, margin: "14px 0 0" }}>
                  <div><dt style={{ color: "#64748b", fontWeight: 700 }}>Submitted</dt><dd style={{ margin: 0 }}>{formatDate(submission?.submittedAt || submission?.createdAt || submission?.timestamp)}</dd></div>
                  <div><dt style={{ color: "#64748b", fontWeight: 700 }}>Updated</dt><dd style={{ margin: 0 }}>{formatDate(submission?.updatedAt || submission?.lastUpdatedAt || submission?.modifiedAt)}</dd></div>
                </dl>
              </article>

              <article style={{ border: "1px solid #e2e8f0", borderRadius: 22, padding: 18, background: "#fff" }}>
                <p style={{ margin: 0, color: "#64748b", fontWeight: 900, letterSpacing: ".1em", textTransform: "uppercase", fontSize: 12 }}>Prompt / task</p>
                <p style={{ margin: "10px 0 0", whiteSpace: "pre-wrap", overflowWrap: "anywhere", lineHeight: 1.6 }}>{promptContent || "No prompt field found."}</p>
              </article>

              <Link to="/student-activity" style={{ color: "#2563eb", fontWeight: 800 }}>Open Student Activity →</Link>
            </aside>
          </section>

          <section style={{ border: "1px solid #e2e8f0", borderRadius: 22, background: "#fff", overflow: "hidden" }}>
            <header style={{ padding: 18, borderBottom: "1px solid #e2e8f0" }}>
              <p style={{ margin: 0, color: "#64748b", fontWeight: 900, letterSpacing: ".1em", textTransform: "uppercase", fontSize: 12 }}>Selected Firebase document</p>
              <h2 style={{ margin: "6px 0 0", color: "#0f172a" }}>All fields for the selected submission</h2>
            </header>
            <pre style={{ margin: 0, padding: 18, maxHeight: 420, overflow: "auto", whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", lineHeight: 1.55, background: "#020617", color: "#dbeafe" }}>
              {loading ? "Loading selected document…" : rawSelectedJson}
            </pre>
          </section>
        </div>
      </section>

      <section style={{ border: "1px solid #e2e8f0", borderRadius: 22, background: "#fff", overflow: "hidden" }}>
        <header style={{ padding: 18, borderBottom: "1px solid #e2e8f0" }}>
          <p style={{ margin: 0, color: "#64748b", fontWeight: 900, letterSpacing: ".1em", textTransform: "uppercase", fontSize: 12 }}>Raw Firebase collection</p>
          <h2 style={{ margin: "6px 0 0", color: "#0f172a" }}>All writing submission documents</h2>
        </header>
        <pre style={{ margin: 0, padding: 18, maxHeight: 620, overflow: "auto", whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", lineHeight: 1.55, background: "#020617", color: "#dbeafe" }}>
          {loading ? "Loading raw collection…" : rawCollectionJson}
        </pre>
      </section>
    </div>
  );
}

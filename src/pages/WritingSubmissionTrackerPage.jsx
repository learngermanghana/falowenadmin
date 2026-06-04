import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

const DEFAULT_SUBMISSION_ID = "uj22ChUTnGSHn7HNWVrN";

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
  const submissionId = clean(params.submissionId) || DEFAULT_SUBMISSION_ID;
  const [trackerState, setTrackerState] = useState({
    submissionId: "",
    submission: null,
    exists: false,
    loading: true,
    error: "",
    lastSyncedAt: null,
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, "writingSubmissions", submissionId),
      (snapshot) => {
        setTrackerState({
          submissionId,
          submission: snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null,
          exists: snapshot.exists(),
          loading: false,
          error: "",
          lastSyncedAt: Date.now(),
        });
      },
      (snapshotError) => {
        setTrackerState({
          submissionId,
          submission: null,
          exists: false,
          loading: false,
          error: snapshotError?.message || "Unable to load this writing submission.",
          lastSyncedAt: Date.now(),
        });
      },
    );

    return unsubscribe;
  }, [submissionId]);

  const isCurrentSubmission = trackerState.submissionId === submissionId;
  const submission = isCurrentSubmission ? trackerState.submission : null;
  const exists = isCurrentSubmission ? trackerState.exists : false;
  const loading = !isCurrentSubmission || trackerState.loading;
  const error = isCurrentSubmission ? trackerState.error : "";
  const lastSyncedAt = isCurrentSubmission ? trackerState.lastSyncedAt : null;

  const studentContent = useMemo(
    () => firstTextValue(submission || {}, ["studentContent", "studentText", "studentWriting", "submissionText", "writing", "content", "text", "answer", "answers", "response", "message"]),
    [submission],
  );

  const promptContent = useMemo(
    () => firstTextValue(submission || {}, ["prompt", "question", "task", "instructions", "assignmentPrompt", "writingPrompt", "rubric"]),
    [submission],
  );

  const rawJson = useMemo(() => JSON.stringify(serializeForJson(submission || {}), null, 2), [submission]);

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <section style={{ borderRadius: 28, padding: "24px clamp(18px, 4vw, 34px)", color: "#fff", background: "linear-gradient(135deg, #0f172a 0%, #4338ca 55%, #0891b2 100%)", boxShadow: "0 28px 70px -48px rgba(15, 23, 42, .85)" }}>
        <p style={{ margin: 0, color: "rgba(255,255,255,.7)", fontWeight: 900, letterSpacing: ".14em", textTransform: "uppercase", fontSize: 12 }}>Live Firestore tracker</p>
        <h1 style={{ margin: "8px 0", fontSize: "clamp(2rem, 5vw, 3.6rem)", letterSpacing: "-.06em" }}>Writing submission content</h1>
        <p style={{ margin: 0, maxWidth: 880, color: "rgba(255,255,255,.84)", lineHeight: 1.7 }}>
          Watching <strong>writingSubmissions/{submissionId}</strong> in real time so tutors can see the content the student used and the raw document fields from Firebase.
        </p>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        <StatCard label="Document" value={submissionId} />
        <StatCard label="Status" value={loading ? "Loading…" : error ? "Error" : exists ? "Live" : "Not found"} />
        <StatCard label="Student" value={metadataValue(submission || {}, ["studentName", "name", "displayName", "studentEmail", "email", "studentCode", "studentId"])} />
        <StatCard label="Last synced" value={lastSyncedAt ? formatDate(lastSyncedAt) : "Not synced yet"} />
      </section>

      {error ? (
        <section style={{ border: "1px solid #fecaca", borderRadius: 18, padding: 18, background: "#fef2f2", color: "#991b1b" }}>
          <strong>Could not load writing submission.</strong>
          <p style={{ margin: "8px 0 0" }}>{error}</p>
        </section>
      ) : null}

      {!loading && !error && !exists ? (
        <section style={{ border: "1px solid #fde68a", borderRadius: 18, padding: 18, background: "#fffbeb", color: "#92400e" }}>
          <strong>No document found.</strong>
          <p style={{ margin: "8px 0 0" }}>Firestore did not return a document at writingSubmissions/{submissionId}.</p>
        </section>
      ) : null}

      <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.25fr) minmax(280px, .75fr)", gap: 16 }}>
        <article style={{ border: "1px solid #e2e8f0", borderRadius: 22, background: "#fff", overflow: "hidden" }}>
          <header style={{ padding: 18, borderBottom: "1px solid #e2e8f0" }}>
            <p style={{ margin: 0, color: "#64748b", fontWeight: 900, letterSpacing: ".1em", textTransform: "uppercase", fontSize: 12 }}>Student content</p>
            <h2 style={{ margin: "6px 0 0", color: "#0f172a" }}>Content used by the student</h2>
          </header>
          <pre style={{ margin: 0, padding: 18, minHeight: 320, whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", lineHeight: 1.65, background: "#f8fafc", color: "#111827" }}>
            {loading ? "Loading live submission content…" : studentContent || "No student content field was found in this document yet."}
          </pre>
        </article>

        <aside style={{ display: "grid", gap: 16, alignContent: "start" }}>
          <article style={{ border: "1px solid #e2e8f0", borderRadius: 22, padding: 18, background: "#fff" }}>
            <p style={{ margin: 0, color: "#64748b", fontWeight: 900, letterSpacing: ".1em", textTransform: "uppercase", fontSize: 12 }}>Submission details</p>
            <dl style={{ display: "grid", gap: 12, margin: "14px 0 0" }}>
              <div><dt style={{ color: "#64748b", fontWeight: 700 }}>Assignment</dt><dd style={{ margin: 0, overflowWrap: "anywhere" }}>{metadataValue(submission || {}, ["assignmentTitle", "assignmentName", "assignment", "assignmentId", "taskTitle"])} </dd></div>
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
          <p style={{ margin: 0, color: "#64748b", fontWeight: 900, letterSpacing: ".1em", textTransform: "uppercase", fontSize: 12 }}>Raw Firebase document</p>
          <h2 style={{ margin: "6px 0 0", color: "#0f172a" }}>All tracked fields</h2>
        </header>
        <pre style={{ margin: 0, padding: 18, maxHeight: 520, overflow: "auto", whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", lineHeight: 1.55, background: "#020617", color: "#dbeafe" }}>
          {loading ? "Loading raw document…" : rawJson}
        </pre>
      </section>
    </div>
  );
}

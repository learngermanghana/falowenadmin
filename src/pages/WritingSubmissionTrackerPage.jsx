import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { collection, doc, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";

const DEFAULT_LIMIT = 50;
const EMPTY_SUBMISSIONS = [];
const SORT_OPTIONS = [
  { value: "submittedAt", label: "Submitted latest" },
  { value: "createdAt", label: "Created latest" },
  { value: "updatedAt", label: "Updated latest" },
  { value: "timestamp", label: "Timestamp latest" },
];
const STUDENT_CONTENT_FIELDS = ["studentContent", "studentText", "studentWriting", "submissionText", "writing", "content", "text", "answer", "answers", "response", "message"];
const PROMPT_FIELDS = ["prompt", "question", "task", "instructions", "assignmentPrompt", "writingPrompt", "rubric"];
const STUDENT_FIELDS = ["studentName", "name", "displayName", "studentEmail", "email", "studentCode", "studentId"];
const ASSIGNMENT_FIELDS = ["assignmentTitle", "assignmentName", "assignment", "assignmentId", "taskTitle"];

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

function submissionDate(record = {}) {
  return record.submittedAt || record.createdAt || record.timestamp || record.updatedAt || record.lastUpdatedAt || record.modifiedAt;
}

function submissionSearchText(record = {}) {
  return [record.id, metadataValue(record, STUDENT_FIELDS), metadataValue(record, ASSIGNMENT_FIELDS), firstTextValue(record, STUDENT_CONTENT_FIELDS)]
    .join(" ")
    .toLowerCase();
}

function buttonStyle(active = false) {
  return {
    border: "1px solid #dbeafe",
    borderRadius: 12,
    padding: "9px 12px",
    background: active ? "#2563eb" : "#fff",
    color: active ? "#fff" : "#1d4ed8",
    fontWeight: 800,
    cursor: "pointer",
  };
}

function StatCard({ label, value }) {
  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 16, padding: 16, background: "#fff" }}>
      <p style={{ margin: 0, color: "#64748b", fontSize: 12, fontWeight: 900, letterSpacing: ".08em", textTransform: "uppercase" }}>{label}</p>
      <strong style={{ display: "block", marginTop: 8, color: "#0f172a", fontSize: 18, overflowWrap: "anywhere" }}>{value}</strong>
    </div>
  );
}

function SubmissionListItem({ submission, selected }) {
  const preview = firstTextValue(submission, STUDENT_CONTENT_FIELDS).replace(/\s+/g, " ");

  return (
    <Link
      to={`/writing-submissions/${submission.id}`}
      style={{
        display: "grid",
        gap: 8,
        padding: 14,
        borderRadius: 16,
        border: selected ? "2px solid #2563eb" : "1px solid #e2e8f0",
        background: selected ? "#eff6ff" : "#fff",
        color: "#0f172a",
        textDecoration: "none",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
        <strong style={{ overflowWrap: "anywhere" }}>{metadataValue(submission, STUDENT_FIELDS)}</strong>
        <span style={{ color: "#64748b", fontSize: 12, whiteSpace: "nowrap" }}>{formatDate(submissionDate(submission))}</span>
      </div>
      <span style={{ color: "#475569", fontSize: 13, overflowWrap: "anywhere" }}>{metadataValue(submission, ASSIGNMENT_FIELDS)}</span>
      <p style={{ margin: 0, color: "#64748b", lineHeight: 1.45 }}>{preview ? `${preview.slice(0, 150)}${preview.length > 150 ? "…" : ""}` : "No writing preview found."}</p>
      <code style={{ color: "#2563eb", fontSize: 12, overflowWrap: "anywhere" }}>{submission.id}</code>
    </Link>
  );
}

export default function WritingSubmissionTrackerPage() {
  const params = useParams();
  const selectedSubmissionId = clean(params.submissionId);
  const [sortField, setSortField] = useState("submittedAt");
  const [resultLimit, setResultLimit] = useState(DEFAULT_LIMIT);
  const [searchText, setSearchText] = useState("");
  const [listState, setListState] = useState({
    sortField: "",
    resultLimit: 0,
    submissions: [],
    loading: true,
    error: "",
    lastSyncedAt: null,
  });
  const [detailState, setDetailState] = useState({
    submissionId: "",
    submission: null,
    exists: false,
    loading: false,
    error: "",
  });

  useEffect(() => {
    const latestSubmissionsQuery = query(collection(db, "writingSubmissions"), orderBy(sortField, "desc"), limit(resultLimit));
    const unsubscribe = onSnapshot(
      latestSubmissionsQuery,
      (snapshot) => {
        setListState({
          sortField,
          resultLimit,
          submissions: snapshot.docs.map((submissionDoc) => ({ id: submissionDoc.id, ...submissionDoc.data() })),
          loading: false,
          error: "",
          lastSyncedAt: Date.now(),
        });
      },
      (snapshotError) => {
        setListState({
          sortField,
          resultLimit,
          submissions: [],
          loading: false,
          error: snapshotError?.message || "Unable to load writing submissions.",
          lastSyncedAt: Date.now(),
        });
      },
    );

    return unsubscribe;
  }, [resultLimit, sortField]);

  const listIsCurrent = listState.sortField === sortField && listState.resultLimit === resultLimit;
  const loadingList = !listIsCurrent || listState.loading;
  const submissions = listIsCurrent ? listState.submissions : EMPTY_SUBMISSIONS;
  const listError = listIsCurrent ? listState.error : "";
  const normalizedSearch = searchText.trim().toLowerCase();
  const filteredSubmissions = useMemo(
    () => submissions.filter((submission) => !normalizedSearch || submissionSearchText(submission).includes(normalizedSearch)),
    [normalizedSearch, submissions],
  );
  const listSelectedSubmission = selectedSubmissionId ? submissions.find((submission) => submission.id === selectedSubmissionId) : filteredSubmissions[0];
  const shouldLoadDirectDetail = Boolean(selectedSubmissionId && !listSelectedSubmission);

  useEffect(() => {
    if (!shouldLoadDirectDetail) return undefined;

    const unsubscribe = onSnapshot(
      doc(db, "writingSubmissions", selectedSubmissionId),
      (snapshot) => {
        setDetailState({
          submissionId: selectedSubmissionId,
          submission: snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null,
          exists: snapshot.exists(),
          loading: false,
          error: "",
        });
      },
      (snapshotError) => {
        setDetailState({
          submissionId: selectedSubmissionId,
          submission: null,
          exists: false,
          loading: false,
          error: snapshotError?.message || "Unable to load this writing submission.",
        });
      },
    );

    return unsubscribe;
  }, [selectedSubmissionId, shouldLoadDirectDetail]);

  const directDetailIsCurrent = detailState.submissionId === selectedSubmissionId;
  const selectedSubmission = listSelectedSubmission || (directDetailIsCurrent ? detailState.submission : null);
  const loadingDetail = loadingList || (shouldLoadDirectDetail && (!directDetailIsCurrent || detailState.loading));
  const detailError = listError || (shouldLoadDirectDetail && directDetailIsCurrent ? detailState.error : "");
  const selectedExists = Boolean(selectedSubmission) || (shouldLoadDirectDetail && directDetailIsCurrent && detailState.exists);

  const studentContent = useMemo(() => firstTextValue(selectedSubmission || {}, STUDENT_CONTENT_FIELDS), [selectedSubmission]);
  const promptContent = useMemo(() => firstTextValue(selectedSubmission || {}, PROMPT_FIELDS), [selectedSubmission]);
  const rawJson = useMemo(() => JSON.stringify(serializeForJson(selectedSubmission || {}), null, 2), [selectedSubmission]);

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <section style={{ borderRadius: 28, padding: "24px clamp(18px, 4vw, 34px)", color: "#fff", background: "linear-gradient(135deg, #0f172a 0%, #4338ca 55%, #0891b2 100%)", boxShadow: "0 28px 70px -48px rgba(15, 23, 42, .85)" }}>
        <p style={{ margin: 0, color: "rgba(255,255,255,.7)", fontWeight: 900, letterSpacing: ".14em", textTransform: "uppercase", fontSize: 12 }}>Live Firestore tracker</p>
        <h1 style={{ margin: "8px 0", fontSize: "clamp(2rem, 5vw, 3.6rem)", letterSpacing: "-.06em" }}>Latest writing submissions</h1>
        <p style={{ margin: 0, maxWidth: 920, color: "rgba(255,255,255,.84)", lineHeight: 1.7 }}>
          Watching the latest <strong>writingSubmissions</strong> documents in real time, prioritizing recent writing while keeping the query limited as the collection grows.
        </p>
      </section>

      <section style={{ border: "1px solid #e2e8f0", borderRadius: 22, padding: 18, background: "#fff", display: "grid", gap: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 1fr) repeat(2, minmax(160px, 220px))", gap: 12, alignItems: "end" }}>
          <label style={{ display: "grid", gap: 6, color: "#475569", fontWeight: 800 }}>
            Filter by student, assignment, document ID, or writing text
            <input
              type="search"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search latest writing submissions…"
              style={{ border: "1px solid #cbd5e1", borderRadius: 12, padding: "10px 12px", font: "inherit" }}
            />
          </label>
          <label style={{ display: "grid", gap: 6, color: "#475569", fontWeight: 800 }}>
            Prioritize by
            <select value={sortField} onChange={(event) => setSortField(event.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: 12, padding: "10px 12px", font: "inherit" }}>
              {SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label style={{ display: "grid", gap: 6, color: "#475569", fontWeight: 800 }}>
            Load latest
            <select value={resultLimit} onChange={(event) => setResultLimit(Number(event.target.value))} style={{ border: "1px solid #cbd5e1", borderRadius: 12, padding: "10px 12px", font: "inherit" }}>
              {[25, 50, 100, 200].map((option) => <option key={option} value={option}>{option} docs</option>)}
            </select>
          </label>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {SORT_OPTIONS.map((option) => (
            <button key={option.value} type="button" onClick={() => setSortField(option.value)} style={buttonStyle(sortField === option.value)}>
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        <StatCard label="Loaded latest" value={loadingList ? "Loading…" : submissions.length} />
        <StatCard label="Matching filter" value={loadingList ? "Loading…" : filteredSubmissions.length} />
        <StatCard label="Selected document" value={selectedSubmission?.id || selectedSubmissionId || "Latest match"} />
        <StatCard label="Last synced" value={listState.lastSyncedAt ? formatDate(listState.lastSyncedAt) : "Not synced yet"} />
      </section>

      {detailError ? (
        <section style={{ border: "1px solid #fecaca", borderRadius: 18, padding: 18, background: "#fef2f2", color: "#991b1b" }}>
          <strong>Could not load writing submissions.</strong>
          <p style={{ margin: "8px 0 0" }}>{detailError}</p>
        </section>
      ) : null}

      {!loadingDetail && !detailError && !selectedExists ? (
        <section style={{ border: "1px solid #fde68a", borderRadius: 18, padding: 18, background: "#fffbeb", color: "#92400e" }}>
          <strong>No writing submission selected.</strong>
          <p style={{ margin: "8px 0 0" }}>No documents matched the current latest-query filter. Try another timestamp field, increase the load limit, or clear the search text.</p>
        </section>
      ) : null}

      <section style={{ display: "grid", gridTemplateColumns: "minmax(280px, .75fr) minmax(0, 1.25fr)", gap: 16 }}>
        <aside style={{ border: "1px solid #e2e8f0", borderRadius: 22, background: "#fff", overflow: "hidden", alignSelf: "start" }}>
          <header style={{ padding: 18, borderBottom: "1px solid #e2e8f0" }}>
            <p style={{ margin: 0, color: "#64748b", fontWeight: 900, letterSpacing: ".1em", textTransform: "uppercase", fontSize: 12 }}>Latest writing</p>
            <h2 style={{ margin: "6px 0 0", color: "#0f172a" }}>Select a submission</h2>
          </header>
          <div style={{ display: "grid", gap: 10, padding: 12, maxHeight: 720, overflow: "auto", background: "#f8fafc" }}>
            {loadingList ? <p style={{ margin: 8, color: "#64748b" }}>Loading latest writing submissions…</p> : null}
            {!loadingList && filteredSubmissions.length === 0 ? <p style={{ margin: 8, color: "#64748b" }}>No submissions match this filter.</p> : null}
            {filteredSubmissions.map((submission) => (
              <SubmissionListItem key={submission.id} submission={submission} selected={selectedSubmission?.id === submission.id} />
            ))}
          </div>
        </aside>

        <div style={{ display: "grid", gap: 16 }}>
          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            <StatCard label="Student" value={metadataValue(selectedSubmission || {}, STUDENT_FIELDS)} />
            <StatCard label="Assignment" value={metadataValue(selectedSubmission || {}, ASSIGNMENT_FIELDS)} />
            <StatCard label="Submitted" value={formatDate(submissionDate(selectedSubmission || {}))} />
          </section>

          <article style={{ border: "1px solid #e2e8f0", borderRadius: 22, background: "#fff", overflow: "hidden" }}>
            <header style={{ padding: 18, borderBottom: "1px solid #e2e8f0" }}>
              <p style={{ margin: 0, color: "#64748b", fontWeight: 900, letterSpacing: ".1em", textTransform: "uppercase", fontSize: 12 }}>Student content</p>
              <h2 style={{ margin: "6px 0 0", color: "#0f172a" }}>Content used by the student</h2>
            </header>
            <pre style={{ margin: 0, padding: 18, minHeight: 320, whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", lineHeight: 1.65, background: "#f8fafc", color: "#111827" }}>
              {loadingDetail ? "Loading live submission content…" : studentContent || "No student content field was found in this document yet."}
            </pre>
          </article>

          <article style={{ border: "1px solid #e2e8f0", borderRadius: 22, padding: 18, background: "#fff" }}>
            <p style={{ margin: 0, color: "#64748b", fontWeight: 900, letterSpacing: ".1em", textTransform: "uppercase", fontSize: 12 }}>Prompt / task</p>
            <p style={{ margin: "10px 0 0", whiteSpace: "pre-wrap", overflowWrap: "anywhere", lineHeight: 1.6 }}>{promptContent || "No prompt field found."}</p>
          </article>

          <Link to="/student-activity" style={{ color: "#2563eb", fontWeight: 800 }}>Open Student Activity →</Link>
        </div>
      </section>

      <section style={{ border: "1px solid #e2e8f0", borderRadius: 22, background: "#fff", overflow: "hidden" }}>
        <header style={{ padding: 18, borderBottom: "1px solid #e2e8f0" }}>
          <p style={{ margin: 0, color: "#64748b", fontWeight: 900, letterSpacing: ".1em", textTransform: "uppercase", fontSize: 12 }}>Raw Firebase document</p>
          <h2 style={{ margin: "6px 0 0", color: "#0f172a" }}>Selected tracked fields</h2>
        </header>
        <pre style={{ margin: 0, padding: 18, maxHeight: 520, overflow: "auto", whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", lineHeight: 1.55, background: "#020617", color: "#dbeafe" }}>
          {loadingDetail ? "Loading raw document…" : rawJson}
        </pre>
      </section>
    </div>
  );
}

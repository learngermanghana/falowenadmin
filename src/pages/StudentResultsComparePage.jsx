import { useEffect, useMemo, useState } from "react";
import { loadRoster, loadStudentResultSources, syncFirestoreScoreToSheet } from "../services/markingService.js";
import { useToast } from "../context/ToastContext.jsx";

function norm(value) { return String(value || "").trim().toLowerCase(); }
function assignmentKey(row = {}) { return norm(row.assignmentId || row.assignment_id || row.assignment); }

function ResultTable({ rows, source, onSync, syncingId }) {
  if (!rows.length) return <p style={{ margin: 0 }}>No {source} results found for this student.</p>;
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead><tr>{["Assignment", "Assignment ID", "Score", "Date", "Level", "Comments", "Action"].map((h) => <th key={h} style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 6 }}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((row, index) => {
          const id = row.id || row.dedupe_id || row.dedupeId || `${source}-${index}`;
          return <tr key={id}>
            <td style={{ borderBottom: "1px solid #eee", padding: 6 }}>{row.assignment || "—"}</td>
            <td style={{ borderBottom: "1px solid #eee", padding: 6 }}><code>{row.assignmentId || row.assignment_id || "—"}</code></td>
            <td style={{ borderBottom: "1px solid #eee", padding: 6 }}><b>{row.score ?? row.finalScore ?? "—"}</b></td>
            <td style={{ borderBottom: "1px solid #eee", padding: 6 }}>{row.date || row.updatedAt || row.createdAt || "—"}</td>
            <td style={{ borderBottom: "1px solid #eee", padding: 6 }}>{row.level || "—"}</td>
            <td style={{ borderBottom: "1px solid #eee", padding: 6, maxWidth: 420, whiteSpace: "pre-wrap" }}>{row.comments || row.feedback || "—"}</td>
            <td style={{ borderBottom: "1px solid #eee", padding: 6 }}>{onSync ? <button type="button" disabled={syncingId === id} onClick={() => onSync(row, id)}>{syncingId === id ? "Syncing..." : "Override sheet"}</button> : "—"}</td>
          </tr>;
        })}</tbody>
      </table>
    </div>
  );
}

export default function StudentResultsComparePage() {
  const { success, error } = useToast();
  const [roster, setRoster] = useState([]);
  const [query, setQuery] = useState("");
  const [studentId, setStudentId] = useState("");
  const [data, setData] = useState({ firestoreRows: [], sheetRows: [], sheetConfigured: false });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("firestore");
  const [syncingId, setSyncingId] = useState("");

  useEffect(() => { loadRoster().then(setRoster).catch((err) => error(err?.message || "Failed to load roster.")); }, [error]);
  const filtered = useMemo(() => roster.filter((r) => !query.trim() || [r.name, r.studentCode, r.level].some((v) => norm(v).includes(norm(query)))), [roster, query]);
  const student = useMemo(() => roster.find((r) => r.id === studentId) || null, [roster, studentId]);
  const sheetKeys = useMemo(() => new Set(data.sheetRows.map(assignmentKey)), [data.sheetRows]);
  const inconsistentRows = useMemo(() => data.firestoreRows.filter((row) => !sheetKeys.has(assignmentKey(row))), [data.firestoreRows, sheetKeys]);

  async function refresh(nextStudent = student) {
    if (!nextStudent?.studentCode) return;
    setLoading(true);
    try { setData(await loadStudentResultSources(nextStudent.studentCode)); }
    catch (err) { error(err?.message || "Failed to load student results."); }
    finally { setLoading(false); }
  }

  async function handleSync(row, id) {
    if (!window.confirm("Override the Google Sheet row for this student/assignment with the Firestore result?")) return;
    setSyncingId(id);
    try {
      await syncFirestoreScoreToSheet(row);
      success("Firestore result sent to Google Sheet override webhook.");
      await refresh();
    } catch (err) { error(err?.message || "Failed to sync result to sheet."); }
    finally { setSyncingId(""); }
  }

  return <div style={{ padding: 16, display: "grid", gap: 14 }}>
    <h2>Student Result Sources</h2>
    <p style={{ marginTop: -8, opacity: 0.8 }}>Compare a student’s saved Firestore results with the published score sheet, then override the sheet from Firestore when needed.</p>
    <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, display: "grid", gap: 8 }}>
      <input placeholder="Search student name/code/level" value={query} onChange={(e) => setQuery(e.target.value)} />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <select value={studentId} onChange={(e) => { const row = roster.find((r) => r.id === e.target.value); setStudentId(e.target.value); if (row) void refresh(row); }} style={{ minWidth: 320 }}>
          <option value="">Select student...</option>{filtered.map((row) => <option key={row.id} value={row.id}>{row.name || "(No name)"} · {row.studentCode || "No code"} · {row.level || "No level"}</option>)}
        </select>
        <button type="button" disabled={!student || loading} onClick={() => refresh()}>{loading ? "Loading..." : "Refresh"}</button>
      </div>
      {!data.sheetConfigured ? <p style={{ margin: 0, color: "#92400e" }}>Set <code>VITE_SCORES_SHEET_CSV_URL</code> to show the sheet tab. Firestore view and override sync still work.</p> : null}
      {student ? <p style={{ margin: 0, fontSize: 13 }}>Selected: <b>{student.name}</b> ({student.studentCode}) · Firestore: <b>{data.firestoreRows.length}</b> · Sheet: <b>{data.sheetRows.length}</b> · Firestore-only: <b>{inconsistentRows.length}</b></p> : null}
    </section>
    <nav style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{[["firestore", "Firebase / Firestore"], ["sheet", "Sheet"], ["inconsistent", "Firestore-only"]].map(([id, label]) => <button key={id} type="button" onClick={() => setActiveTab(id)} style={{ fontWeight: activeTab === id ? 800 : 500 }}>{label}</button>)}</nav>
    <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
      {activeTab === "firestore" ? <ResultTable rows={data.firestoreRows} source="Firestore" onSync={handleSync} syncingId={syncingId} /> : null}
      {activeTab === "sheet" ? <ResultTable rows={data.sheetRows} source="sheet" /> : null}
      {activeTab === "inconsistent" ? <ResultTable rows={inconsistentRows} source="Firestore-only" onSync={handleSync} syncingId={syncingId} /> : null}
    </section>
  </div>;
}

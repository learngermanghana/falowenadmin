import { useEffect, useMemo, useState } from "react";
import { loadRoster, loadStudentResultSources, syncFirestoreScoreToSheet, syncFirestoreScoresToSheet, updateFirestoreScore } from "../services/markingService.js";
import { useToast } from "../context/ToastContext.jsx";

function norm(value) { return String(value || "").trim().toLowerCase(); }
function assignmentKey(row = {}) { return norm(row.assignmentId || row.assignment_id || row.assignment); }

function ResultTable({ rows, source, onSync, syncingId, selectedIds = new Set(), onToggleSelected, onToggleAll, allSelected = false, onEdit, editingId = "", editDraft = {}, onEditDraftChange, onCancelEdit, onSaveEdit, savingEditId = "" }) {
  const canBulkSelect = Boolean(onToggleSelected);
  const inputStyle = { width: "100%", minWidth: 90 };
  const commentStyle = { ...inputStyle, minWidth: 280, minHeight: 74 };
  const editableRows = rows.filter((row, index) => row.id || row.dedupe_id || row.dedupeId || `${source}-${index}`);

  if (!rows.length) return <p style={{ margin: 0 }}>No {source} results found for this student.</p>;
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead><tr>
          {canBulkSelect ? <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 6 }}><input type="checkbox" checked={allSelected && editableRows.length > 0} onChange={(event) => onToggleAll(event.target.checked, rows)} aria-label={`Select all ${source} rows`} /></th> : null}
          {["Assignment", "Assignment ID", "Score", "Date", "Level", "Comments", "Action"].map((h) => <th key={h} style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 6 }}>{h}</th>)}
        </tr></thead>
        <tbody>{rows.map((row, index) => {
          const id = row.id || row.dedupe_id || row.dedupeId || `${source}-${index}`;
          const isEditing = editingId === id;
          const isSelected = selectedIds.has(id);
          return <tr key={id}>
            {canBulkSelect ? <td style={{ borderBottom: "1px solid #eee", padding: 6 }}><input type="checkbox" checked={isSelected} onChange={(event) => onToggleSelected(id, row, event.target.checked)} aria-label={`Select ${row.assignment || "result"}`} /></td> : null}
            <td style={{ borderBottom: "1px solid #eee", padding: 6 }}>{isEditing ? <input style={inputStyle} value={editDraft.assignment || ""} onChange={(event) => onEditDraftChange("assignment", event.target.value)} /> : row.assignment || "—"}</td>
            <td style={{ borderBottom: "1px solid #eee", padding: 6 }}>{isEditing ? <input style={inputStyle} value={editDraft.assignmentId || ""} onChange={(event) => onEditDraftChange("assignmentId", event.target.value)} /> : <code>{row.assignmentId || row.assignment_id || "—"}</code>}</td>
            <td style={{ borderBottom: "1px solid #eee", padding: 6 }}>{isEditing ? <input style={{ ...inputStyle, minWidth: 70 }} type="number" min="0" max="100" value={editDraft.score} onChange={(event) => onEditDraftChange("score", event.target.value)} /> : <b>{row.score ?? row.finalScore ?? "—"}</b>}</td>
            <td style={{ borderBottom: "1px solid #eee", padding: 6 }}>{row.date || row.updatedAt || row.createdAt || "—"}</td>
            <td style={{ borderBottom: "1px solid #eee", padding: 6 }}>{isEditing ? <input style={inputStyle} value={editDraft.level || ""} onChange={(event) => onEditDraftChange("level", event.target.value)} /> : row.level || "—"}</td>
            <td style={{ borderBottom: "1px solid #eee", padding: 6, maxWidth: 420, whiteSpace: "pre-wrap" }}>{isEditing ? <textarea style={commentStyle} value={editDraft.comments || ""} onChange={(event) => onEditDraftChange("comments", event.target.value)} /> : row.comments || row.feedback || "—"}</td>
            <td style={{ borderBottom: "1px solid #eee", padding: 6 }}>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {isEditing ? <>
                  <button type="button" disabled={savingEditId === id} onClick={() => onSaveEdit(row, id)}>{savingEditId === id ? "Saving..." : "Save edit"}</button>
                  <button type="button" disabled={savingEditId === id} onClick={onCancelEdit}>Cancel</button>
                </> : onEdit ? <button type="button" onClick={() => onEdit(row, id)}>Edit</button> : null}
                {onSync ? <button type="button" disabled={syncingId === id || isEditing} onClick={() => onSync(row, id)}>{syncingId === id ? "Syncing..." : "Override sheet"}</button> : null}
                {!onSync && !onEdit ? "—" : null}
              </div>
            </td>
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
  const [selectedRows, setSelectedRows] = useState({});
  const [editingId, setEditingId] = useState("");
  const [editDraft, setEditDraft] = useState({});
  const [savingEditId, setSavingEditId] = useState("");

  useEffect(() => { loadRoster().then(setRoster).catch((err) => error(err?.message || "Failed to load roster.")); }, [error]);
  const filtered = useMemo(() => roster.filter((r) => !query.trim() || [r.name, r.studentCode, r.level].some((v) => norm(v).includes(norm(query)))), [roster, query]);
  const student = useMemo(() => roster.find((r) => r.id === studentId) || null, [roster, studentId]);
  const sheetKeys = useMemo(() => new Set(data.sheetRows.map(assignmentKey)), [data.sheetRows]);
  const inconsistentRows = useMemo(() => data.firestoreRows.filter((row) => !sheetKeys.has(assignmentKey(row))), [data.firestoreRows, sheetKeys]);
  const selectedIds = useMemo(() => new Set(Object.keys(selectedRows)), [selectedRows]);

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

  function handleToggleSelected(id, row, checked) {
    setSelectedRows((current) => {
      const next = { ...current };
      if (checked) next[id] = row;
      else delete next[id];
      return next;
    });
  }

  function handleToggleAll(checked, rows) {
    if (!checked) {
      setSelectedRows({});
      return;
    }
    setSelectedRows(Object.fromEntries(rows.map((row, index) => [row.id || row.dedupe_id || row.dedupeId || `bulk-${index}`, row])));
  }

  async function handleSyncSelected() {
    const rows = Object.entries(selectedRows);
    if (!rows.length) return;
    if (!window.confirm(`Sync ${rows.length} selected result(s) to the Google Sheet?`)) return;
    setSyncingId("__bulk__");
    try {
      await syncFirestoreScoresToSheet(rows.map(([, row]) => row));
      success(`Synced ${rows.length} selected result(s) to Google Sheet in one request.`);
      setSelectedRows({});
      await refresh();
    } catch (err) { error(err?.message || "Failed to sync selected results to sheet."); }
    finally { setSyncingId(""); }
  }

  function startEdit(row, id) {
    setEditingId(id);
    setEditDraft({ assignment: row.assignment || "", assignmentId: row.assignmentId || row.assignment_id || "", score: row.score ?? row.finalScore ?? "", level: row.level || "", comments: row.comments || row.feedback || "" });
  }

  async function handleSaveEdit(row, id) {
    if (editDraft.score === "" || !Number.isFinite(Number(editDraft.score))) {
      error("Enter a valid score before saving.");
      return;
    }
    setSavingEditId(id);
    try {
      await updateFirestoreScore(row.id, editDraft);
      success("Score updated in Firestore. Use Override sheet or Sync selected to update the sheet.");
      setEditingId("");
      setEditDraft({});
      await refresh();
    } catch (err) { error(err?.message || "Failed to update Firestore score."); }
    finally { setSavingEditId(""); }
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
      {student ? <p style={{ margin: 0, fontSize: 13 }}>Selected: <b>{student.name}</b> ({student.studentCode}) · Firestore: <b>{data.firestoreRows.length}</b> · Sheet: <b>{data.sheetRows.length}</b> · Firestore-only: <b>{inconsistentRows.length}</b> · Selected to sync: <b>{selectedIds.size}</b></p> : null}
      <button type="button" disabled={!selectedIds.size || syncingId === "__bulk__"} onClick={handleSyncSelected} style={{ justifySelf: "start" }}>{syncingId === "__bulk__" ? "Syncing selected..." : `Sync selected to sheet (${selectedIds.size})`}</button>
    </section>
    <nav style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{[["firestore", "Firebase / Firestore"], ["sheet", "Sheet"], ["inconsistent", "Firestore-only"]].map(([id, label]) => <button key={id} type="button" onClick={() => setActiveTab(id)} style={{ fontWeight: activeTab === id ? 800 : 500 }}>{label}</button>)}</nav>
    <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
      {activeTab === "firestore" ? <ResultTable rows={data.firestoreRows} source="Firestore" onSync={handleSync} syncingId={syncingId} selectedIds={selectedIds} onToggleSelected={handleToggleSelected} onToggleAll={handleToggleAll} allSelected={data.firestoreRows.length > 0 && data.firestoreRows.every((row, index) => selectedIds.has(row.id || row.dedupe_id || row.dedupeId || `Firestore-${index}`))} onEdit={startEdit} editingId={editingId} editDraft={editDraft} onEditDraftChange={(field, value) => setEditDraft((current) => ({ ...current, [field]: value }))} onCancelEdit={() => { setEditingId(""); setEditDraft({}); }} onSaveEdit={handleSaveEdit} savingEditId={savingEditId} /> : null}
      {activeTab === "sheet" ? <ResultTable rows={data.sheetRows} source="sheet" /> : null}
      {activeTab === "inconsistent" ? <ResultTable rows={inconsistentRows} source="Firestore-only" onSync={handleSync} syncingId={syncingId} selectedIds={selectedIds} onToggleSelected={handleToggleSelected} onToggleAll={handleToggleAll} allSelected={inconsistentRows.length > 0 && inconsistentRows.every((row, index) => selectedIds.has(row.id || row.dedupe_id || row.dedupeId || `Firestore-only-${index}`))} onEdit={startEdit} editingId={editingId} editDraft={editDraft} onEditDraftChange={(field, value) => setEditDraft((current) => ({ ...current, [field]: value }))} onCancelEdit={() => { setEditingId(""); setEditDraft({}); }} onSaveEdit={handleSaveEdit} savingEditId={savingEditId} /> : null}
    </section>
  </div>;
}

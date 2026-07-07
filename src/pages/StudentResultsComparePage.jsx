import { useEffect, useMemo, useState } from "react";
import { loadRoster, loadStudentResultSources, syncFirestoreScoreToSheet, updateFirestoreScore } from "../services/markingService.js";
import { useToast } from "../context/ToastContext.jsx";

function norm(value) { return String(value || "").trim().toLowerCase(); }
function assignmentKey(row = {}) { return norm(row.assignmentId || row.assignment_id || row.assignment); }
function resultId(row = {}, source = "row", index = 0) { return row.id || row.dedupe_id || row.dedupeId || `${source}-${index}`; }
function editableValue(row = {}, key, fallback = "") { return String(row[key] ?? fallback ?? ""); }

function ResultTable({ rows, source, editable = false, selectedIds, onToggle, onToggleAll, onEdit, onSync, syncingId, editingId, editDraft, onEditDraftChange, onSaveEdit, onCancelEdit, savingEdit }) {
  if (!rows.length) return <p style={{ margin: 0 }}>No {source} results found for this student.</p>;
  const allSelected = rows.every((row, index) => selectedIds?.has(resultId(row, source, index)));

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            {onToggle ? (
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 6 }}>
                <input type="checkbox" checked={allSelected} onChange={(event) => onToggleAll(rows, event.target.checked)} aria-label={`Select all ${source} rows`} />
              </th>
            ) : null}
            {["Assignment", "Assignment ID", "Score", "Date", "Level", "Comments", "Action"].map((h) => <th key={h} style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 6 }}>{h}</th>)}
          </tr>
        </thead>
        <tbody>{rows.map((row, index) => {
          const id = resultId(row, source, index);
          const isEditing = editingId === id;
          return <tr key={id}>
            {onToggle ? (
              <td style={{ borderBottom: "1px solid #eee", padding: 6 }}>
                <input type="checkbox" checked={selectedIds.has(id)} onChange={(event) => onToggle(id, row, event.target.checked)} aria-label={`Select ${row.assignment || id}`} />
              </td>
            ) : null}
            <td style={{ borderBottom: "1px solid #eee", padding: 6 }}>{isEditing ? <input value={editDraft.assignment} onChange={(event) => onEditDraftChange("assignment", event.target.value)} /> : row.assignment || "—"}</td>
            <td style={{ borderBottom: "1px solid #eee", padding: 6 }}>{isEditing ? <input value={editDraft.assignmentId} onChange={(event) => onEditDraftChange("assignmentId", event.target.value)} /> : <code>{row.assignmentId || row.assignment_id || "—"}</code>}</td>
            <td style={{ borderBottom: "1px solid #eee", padding: 6 }}>{isEditing ? <input type="number" min="0" max="100" value={editDraft.score} onChange={(event) => onEditDraftChange("score", event.target.value)} style={{ width: 80 }} /> : <b>{row.score ?? row.finalScore ?? "—"}</b>}</td>
            <td style={{ borderBottom: "1px solid #eee", padding: 6 }}>{row.date || row.updatedAt || row.createdAt || "—"}</td>
            <td style={{ borderBottom: "1px solid #eee", padding: 6 }}>{isEditing ? <input value={editDraft.level} onChange={(event) => onEditDraftChange("level", event.target.value)} style={{ width: 90 }} /> : row.level || "—"}</td>
            <td style={{ borderBottom: "1px solid #eee", padding: 6, maxWidth: 420, whiteSpace: "pre-wrap" }}>{isEditing ? <textarea rows={4} value={editDraft.comments} onChange={(event) => onEditDraftChange("comments", event.target.value)} /> : row.comments || row.feedback || "—"}</td>
            <td style={{ borderBottom: "1px solid #eee", padding: 6 }}>
              {isEditing ? (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button type="button" disabled={savingEdit} onClick={() => onSaveEdit(row)}>{savingEdit ? "Saving..." : "Save edit"}</button>
                  <button type="button" disabled={savingEdit} onClick={onCancelEdit}>Cancel</button>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {editable ? <button type="button" onClick={() => onEdit(row, id)}>Edit</button> : null}
                  {onSync ? <button type="button" disabled={syncingId === id} onClick={() => onSync(row, id)}>{syncingId === id ? "Syncing..." : "Sync to sheet"}</button> : "—"}
                </div>
              )}
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
  const [selectedRows, setSelectedRows] = useState(new Map());
  const [editingId, setEditingId] = useState("");
  const [editDraft, setEditDraft] = useState({ assignment: "", assignmentId: "", score: "", level: "", comments: "" });
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => { loadRoster().then(setRoster).catch((err) => error(err?.message || "Failed to load roster.")); }, [error]);
  const filtered = useMemo(() => roster.filter((r) => !query.trim() || [r.name, r.studentCode, r.level].some((v) => norm(v).includes(norm(query)))), [roster, query]);
  const student = useMemo(() => roster.find((r) => r.id === studentId) || null, [roster, studentId]);
  const sheetKeys = useMemo(() => new Set(data.sheetRows.map(assignmentKey)), [data.sheetRows]);
  const inconsistentRows = useMemo(() => data.firestoreRows.filter((row) => !sheetKeys.has(assignmentKey(row))), [data.firestoreRows, sheetKeys]);
  const visibleFirestoreRows = activeTab === "inconsistent" ? inconsistentRows : data.firestoreRows;

  async function refresh(nextStudent = student) {
    if (!nextStudent?.studentCode) return;
    setLoading(true);
    try {
      setData(await loadStudentResultSources(nextStudent.studentCode));
      setSelectedRows(new Map());
      setEditingId("");
    } catch (err) { error(err?.message || "Failed to load student results."); }
    finally { setLoading(false); }
  }

  async function syncRows(rows, label = "selected results") {
    if (!rows.length) {
      error("Select at least one Firestore result to sync.");
      return;
    }
    if (!window.confirm(`Sync ${rows.length} ${label} to the Google Sheet? This overrides matching sheet rows by student and assignment.`)) return;
    setSyncingId("bulk");
    try {
      for (const row of rows) await syncFirestoreScoreToSheet(row);
      success(`Synced ${rows.length} result${rows.length === 1 ? "" : "s"} to the sheet.`);
      await refresh();
    } catch (err) { error(err?.message || "Failed to sync selected results to sheet."); }
    finally { setSyncingId(""); }
  }

  async function handleSync(row, id) {
    setSyncingId(id);
    try { await syncRows([row], "result"); }
    finally { setSyncingId(""); }
  }

  function handleToggle(id, row, checked) {
    setSelectedRows((current) => {
      const next = new Map(current);
      if (checked) next.set(id, row);
      else next.delete(id);
      return next;
    });
  }

  function handleToggleAll(rows, checked) {
    setSelectedRows((current) => {
      const next = new Map(current);
      rows.forEach((row, index) => {
        const id = resultId(row, activeTab, index);
        if (checked) next.set(id, row);
        else next.delete(id);
      });
      return next;
    });
  }

  function startEdit(row, id) {
    setEditingId(id);
    setEditDraft({
      assignment: editableValue(row, "assignment"),
      assignmentId: editableValue(row, "assignmentId", row.assignment_id),
      score: editableValue(row, "score", row.finalScore),
      level: editableValue(row, "level"),
      comments: editableValue(row, "comments", row.feedback),
    });
  }

  async function saveEdit(row) {
    setSavingEdit(true);
    try {
      const updated = await updateFirestoreScore(row, editDraft);
      success("Firestore score updated. Click Sync to sheet, or use Select all + Sync selected, to push it to the sheet.");
      await refresh();
      setSelectedRows(new Map([[updated.id || row.id, updated]]));
    } catch (err) { error(err?.message || "Failed to update Firestore score."); }
    finally { setSavingEdit(false); }
  }

  return <div style={{ padding: 16, display: "grid", gap: 14 }}>
    <h2>Student Result Sources</h2>
    <p style={{ marginTop: -8, opacity: 0.8 }}>Compare a student’s saved Firestore results with the published score sheet, edit old Firestore scores, then sync one or many scores to the sheet.</p>
    <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, display: "grid", gap: 8 }}>
      <input placeholder="Search student name/code/level" value={query} onChange={(e) => setQuery(e.target.value)} />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <select value={studentId} onChange={(e) => { const row = roster.find((r) => r.id === e.target.value); setStudentId(e.target.value); if (row) void refresh(row); }} style={{ minWidth: 320 }}>
          <option value="">Select student...</option>{filtered.map((row) => <option key={row.id} value={row.id}>{row.name || "(No name)"} · {row.studentCode || "No code"} · {row.level || "No level"}</option>)}
        </select>
        <button type="button" disabled={!student || loading} onClick={() => refresh()}>{loading ? "Loading..." : "Refresh"}</button>
      </div>
      {!data.sheetConfigured ? <p style={{ margin: 0, color: "#92400e" }}>Set <code>VITE_SCORES_SHEET_CSV_URL</code> to show the sheet tab. Firestore view, editing, and sync still work.</p> : null}
      {student ? <p style={{ margin: 0, fontSize: 13 }}>Selected: <b>{student.name}</b> ({student.studentCode}) · Firestore: <b>{data.firestoreRows.length}</b> · Sheet: <b>{data.sheetRows.length}</b> · Firestore-only: <b>{inconsistentRows.length}</b></p> : null}
    </section>
    <nav style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{[["firestore", "Firebase / Firestore"], ["sheet", "Sheet"], ["inconsistent", "Firestore-only"]].map(([id, label]) => <button key={id} type="button" onClick={() => setActiveTab(id)} style={{ fontWeight: activeTab === id ? 800 : 500 }}>{label}</button>)}</nav>
    {activeTab !== "sheet" ? (
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <button type="button" disabled={!visibleFirestoreRows.length} onClick={() => handleToggleAll(visibleFirestoreRows, true)}>Select all visible</button>
        <button type="button" disabled={!selectedRows.size} onClick={() => setSelectedRows(new Map())}>Clear selection</button>
        <button type="button" disabled={!selectedRows.size || syncingId === "bulk"} onClick={() => syncRows([...selectedRows.values()])}>{syncingId === "bulk" ? "Syncing..." : `Sync selected (${selectedRows.size}) to sheet`}</button>
      </div>
    ) : null}
    <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
      {activeTab === "firestore" ? <ResultTable rows={data.firestoreRows} source="Firestore" editable selectedIds={new Set(selectedRows.keys())} onToggle={handleToggle} onToggleAll={handleToggleAll} onEdit={startEdit} onSync={handleSync} syncingId={syncingId} editingId={editingId} editDraft={editDraft} onEditDraftChange={(key, value) => setEditDraft((current) => ({ ...current, [key]: value }))} onSaveEdit={saveEdit} onCancelEdit={() => setEditingId("")} savingEdit={savingEdit} /> : null}
      {activeTab === "sheet" ? <ResultTable rows={data.sheetRows} source="sheet" /> : null}
      {activeTab === "inconsistent" ? <ResultTable rows={inconsistentRows} source="Firestore-only" editable selectedIds={new Set(selectedRows.keys())} onToggle={handleToggle} onToggleAll={handleToggleAll} onEdit={startEdit} onSync={handleSync} syncingId={syncingId} editingId={editingId} editDraft={editDraft} onEditDraftChange={(key, value) => setEditDraft((current) => ({ ...current, [key]: value }))} onSaveEdit={saveEdit} onCancelEdit={() => setEditingId("")} savingEdit={savingEdit} /> : null}
    </section>
  </div>;
}

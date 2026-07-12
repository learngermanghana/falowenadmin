import { useMemo, useState } from "react";
import {
  canonicalDictionarySelection,
  dictionaryEntriesForSelection,
  normalizeDictionaryId,
  toggleDictionarySelection,
} from "../utils/liveClassDictionarySelection.js";

function entryLabel(entry = {}) {
  const title = String(entry.en || entry.de || "").trim();
  const chapter = String(entry.chapter || "").trim();
  return `${entry.assignment_id}${chapter ? ` · ${chapter}` : ""}${title ? ` — ${title}` : ""}`;
}

export default function SessionDictionaryPicker({
  entries = [],
  assignmentIds = [],
  disabled = false,
  onChange,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selectedIds = useMemo(
    () => canonicalDictionarySelection(entries, assignmentIds),
    [entries, assignmentIds],
  );
  const selectedEntries = useMemo(
    () => dictionaryEntriesForSelection(entries, selectedIds),
    [entries, selectedIds],
  );
  const selectedSet = useMemo(
    () => new Set(selectedIds.map(normalizeDictionaryId)),
    [selectedIds],
  );
  const filteredEntries = useMemo(() => {
    const query = String(search || "").trim().toLowerCase();
    if (!query) return entries;
    return entries.filter((entry) => entryLabel(entry).toLowerCase().includes(query));
  }, [entries, search]);

  async function toggle(entry) {
    const nextIds = toggleDictionarySelection(entries, selectedIds, entry.assignment_id);
    await onChange?.(nextIds);
  }

  const summary = selectedEntries.length
    ? `${selectedEntries.length} selected: ${selectedEntries.map((entry) => entry.assignment_id).join(", ")}`
    : `No item selected — choose from all ${entries.length}`;

  return (
    <div style={{ position: "relative", minWidth: 310 }}>
      <button
        type="button"
        disabled={disabled || !entries.length}
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        style={{
          width: "100%",
          minHeight: 42,
          textAlign: "left",
          background: "#fff",
          color: "#0f172a",
          border: "1px solid #cbd5e1",
          borderRadius: 8,
          padding: "9px 12px",
          fontWeight: 600,
        }}
      >
        {summary}
        <span style={{ float: "right" }}>{open ? "▲" : "▼"}</span>
      </button>

      {selectedEntries.length ? (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
          {selectedEntries.map((entry) => (
            <span key={entry.assignment_id} style={{ background: "#dbeafe", color: "#1e40af", borderRadius: 999, padding: "3px 8px", fontSize: 12 }}>
              {entry.assignment_id}
            </span>
          ))}
        </div>
      ) : null}

      {open ? (
        <div style={{ marginTop: 8, border: "1px solid #bfdbfe", borderRadius: 10, background: "#fff", padding: 10, boxShadow: "0 12px 30px rgba(15, 23, 42, 0.12)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", marginBottom: 8 }}>
            <strong>Complete dictionary: all {entries.length} items</strong>
            <button type="button" onClick={() => setOpen(false)}>Close</button>
          </div>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search assignment ID, chapter or title"
            style={{ width: "100%", marginBottom: 8 }}
          />
          <div style={{ maxHeight: 320, overflowY: "auto", display: "grid", gap: 4, paddingRight: 4 }}>
            {filteredEntries.map((entry) => {
              const checked = selectedSet.has(normalizeDictionaryId(entry.assignment_id));
              return (
                <label
                  key={entry.assignment_id}
                  style={{ display: "grid", gridTemplateColumns: "22px 1fr", gap: 8, alignItems: "start", padding: "8px 6px", borderRadius: 7, background: checked ? "#eff6ff" : "transparent" }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => toggle(entry)}
                  />
                  <span>{entryLabel(entry)}</span>
                </label>
              );
            })}
            {!filteredEntries.length ? <p>No dictionary item matches your search.</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

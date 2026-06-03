import { useCallback, useEffect, useMemo, useState } from "react";
import { deleteStorageFolder, deleteStoragePath, listStorageFolder, loadStorageTextFile, normalizeStoragePath, parentPath, saveStorageTextFile } from "../services/firebaseStorageBrowserService";
import { useToast } from "../context/ToastContext";

function displayPath(path) {
  return path || "Bucket root";
}

export default function FirebaseStorageBrowserPage() {
  const { success, error } = useToast();
  const [folderPath, setFolderPath] = useState("");
  const [pathInput, setPathInput] = useState("");
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [selectedPath, setSelectedPath] = useState("");
  const [editorText, setEditorText] = useState("");
  const [contentType, setContentType] = useState("text/plain");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");

  const breadcrumbs = useMemo(() => {
    const clean = normalizeStoragePath(folderPath).replace(/\/$/, "");
    if (!clean) return [];
    const parts = clean.split("/").filter(Boolean);
    return parts.map((part, index) => ({ label: part, path: `${parts.slice(0, index + 1).join("/")}/` }));
  }, [folderPath]);

  const refreshFolder = useCallback(async (nextPath = folderPath) => {
    setLoading(true);
    setPageError("");
    try {
      const result = await listStorageFolder(nextPath);
      setFolderPath(result.path);
      setPathInput(result.path);
      setFolders(result.folders);
      setFiles(result.files);
    } catch (err) {
      const message = err?.message || "Failed to load Firebase Storage folder.";
      setPageError(message);
      error(message);
    } finally {
      setLoading(false);
    }
  }, [error, folderPath]);

  useEffect(() => {
    void refreshFolder("");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function openFolder(path) {
    setSelectedPath("");
    setEditorText("");
    setContentType("text/plain");
    await refreshFolder(path);
  }

  async function openFile(path) {
    setLoading(true);
    setPageError("");
    try {
      const file = await loadStorageTextFile(path);
      setSelectedPath(file.path);
      setEditorText(file.text);
      setContentType(file.contentType || "text/plain");
      success(`Loaded ${file.path}`);
    } catch (err) {
      const message = err?.message || "Failed to open file.";
      setPageError(message);
      error(message);
    } finally {
      setLoading(false);
    }
  }

  async function saveFile() {
    setSaving(true);
    setPageError("");
    try {
      const result = await saveStorageTextFile(selectedPath, editorText, contentType);
      success(`Saved ${result.path}`);
      await refreshFolder(parentPath(result.path));
    } catch (err) {
      const message = err?.message || "Failed to save file.";
      setPageError(message);
      error(message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteFolder(path) {
    const clean = normalizeStoragePath(path);
    if (!clean) return;
    const confirmed = window.confirm(`Delete every file inside ${clean}? This cannot be undone.`);
    if (!confirmed) return;

    setSaving(true);
    setPageError("");
    try {
      const result = await deleteStorageFolder(clean);
      success(`Deleted ${result.deletedCount} files from ${result.path}`);
      await refreshFolder(parentPath(clean));
    } catch (err) {
      const message = err?.message || "Failed to delete folder.";
      setPageError(message);
      error(message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteFile(path = selectedPath) {
    const clean = normalizeStoragePath(path);
    if (!clean) return;
    const confirmed = window.confirm(`Delete ${clean}? This cannot be undone.`);
    if (!confirmed) return;

    setSaving(true);
    setPageError("");
    try {
      await deleteStoragePath(clean);
      success(`Deleted ${clean}`);
      if (selectedPath === clean) {
        setSelectedPath("");
        setEditorText("");
      }
      await refreshFolder(parentPath(clean));
    } catch (err) {
      const message = err?.message || "Failed to delete file.";
      setPageError(message);
      error(message);
    } finally {
      setSaving(false);
    }
  }

  function prepareNewFile() {
    const base = normalizeStoragePath(folderPath);
    const name = window.prompt("New file name in this folder, for example notes.json");
    const cleanName = normalizeStoragePath(name || "").replace(/^\/+/, "");
    if (!cleanName) return;
    setSelectedPath(`${base}${cleanName}`);
    setEditorText(cleanName.endsWith(".json") ? "{}" : "");
    setContentType(cleanName.endsWith(".json") ? "application/json" : "text/plain");
  }

  return (
    <div className="page-container" style={{ display: "grid", gap: 16 }}>
      <section className="card" style={{ display: "grid", gap: 10 }}>
        <p style={{ margin: 0, color: "#42526b", fontWeight: 700 }}>Firebase Storage</p>
        <h1 style={{ margin: 0 }}>Storage Path Manager</h1>
        <p style={{ margin: 0 }}>
          Browse Firebase Storage folders, open text-like files, edit their contents, create new files, and delete files directly from the admin UI.
        </p>
        <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
          Tip: paste a folder path such as <code>answer-keys/</code>. Firebase Storage folders are virtual, so deleting a folder means deleting the files inside it one at a time.
        </p>
      </section>

      {pageError ? (
        <section style={{ border: "1px solid #fecaca", borderRadius: 10, padding: 12, background: "#fef2f2", color: "#991b1b" }}>
          <b>Storage warning:</b> {pageError}
        </section>
      ) : null}

      <section className="card" style={{ display: "grid", gap: 10 }}>
        <label style={{ display: "grid", gap: 6, fontWeight: 700 }}>
          Folder path
          <input
            value={pathInput}
            onChange={(event) => setPathInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void openFolder(pathInput);
            }}
            placeholder="Bucket root or answer-keys/"
            style={{ padding: 10, border: "1px solid #d1d5db", borderRadius: 8 }}
          />
        </label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" onClick={() => openFolder(pathInput)} disabled={loading}>Open folder</button>
          <button type="button" onClick={() => openFolder(parentPath(folderPath))} disabled={loading || !folderPath}>Up one folder</button>
          <button type="button" onClick={() => refreshFolder(folderPath)} disabled={loading}>Refresh</button>
          <button type="button" onClick={prepareNewFile}>New text file</button>
          <button type="button" onClick={() => deleteFolder(folderPath)} disabled={!folderPath || saving} style={{ color: "#b91c1c" }}>Delete this folder</button>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", fontSize: 13 }}>
          <button type="button" onClick={() => openFolder("")} disabled={!folderPath}>Root</button>
          {breadcrumbs.map((crumb) => (
            <button key={crumb.path} type="button" onClick={() => openFolder(crumb.path)}>{crumb.label}</button>
          ))}
        </div>
      </section>

      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))" }}>
        <section className="card" style={{ minWidth: 0 }}>
          <h2 style={{ marginTop: 0 }}>{displayPath(folderPath)}</h2>
          {loading ? <p>Loading Storage paths…</p> : null}

          <h3>Folders</h3>
          {folders.length ? (
            <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 8 }}>
              {folders.map((folder) => (
                <li key={folder.path}>
                  <button type="button" onClick={() => openFolder(folder.path)} style={{ width: "100%", textAlign: "left" }}>📁 {folder.name}/</button>
                  <button type="button" onClick={() => deleteFolder(folder.path)} disabled={saving} style={{ justifySelf: "start", color: "#b91c1c" }}>Delete folder</button>
                </li>
              ))}
            </ul>
          ) : <p style={{ color: "#6b7280" }}>No child folders found.</p>}

          <h3>Files</h3>
          {files.length ? (
            <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 8 }}>
              {files.map((file) => (
                <li key={file.path} style={{ display: "grid", gap: 6 }}>
                  <button type="button" onClick={() => openFile(file.path)} style={{ width: "100%", textAlign: "left" }}>📄 {file.name}</button>
                  <button type="button" onClick={() => deleteFile(file.path)} disabled={saving} style={{ justifySelf: "start", color: "#b91c1c" }}>Delete</button>
                </li>
              ))}
            </ul>
          ) : <p style={{ color: "#6b7280" }}>No files found in this folder.</p>}
        </section>

        <section className="card" style={{ minWidth: 0, display: "grid", gap: 10 }}>
          <h2 style={{ margin: 0 }}>File editor</h2>
          <label style={{ display: "grid", gap: 6, fontWeight: 700 }}>
            Storage file path
            <input
              value={selectedPath}
              onChange={(event) => setSelectedPath(normalizeStoragePath(event.target.value))}
              placeholder="answer-keys/example/active.json"
              style={{ padding: 10, border: "1px solid #d1d5db", borderRadius: 8 }}
            />
          </label>
          <label style={{ display: "grid", gap: 6, fontWeight: 700 }}>
            Content type
            <input
              value={contentType}
              onChange={(event) => setContentType(event.target.value)}
              placeholder="application/json"
              style={{ padding: 10, border: "1px solid #d1d5db", borderRadius: 8 }}
            />
          </label>
          <textarea
            value={editorText}
            onChange={(event) => setEditorText(event.target.value)}
            placeholder="Open a text file or create a new one to edit here."
            rows={22}
            spellCheck="false"
            style={{ width: "100%", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 13, padding: 12, border: "1px solid #d1d5db", borderRadius: 8, boxSizing: "border-box" }}
          />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" onClick={() => openFile(selectedPath)} disabled={!selectedPath || loading}>Load path</button>
            <button type="button" onClick={saveFile} disabled={!selectedPath || saving}>{saving ? "Saving…" : "Save file"}</button>
            <button type="button" onClick={() => deleteFile(selectedPath)} disabled={!selectedPath || saving} style={{ color: "#b91c1c" }}>Delete file</button>
          </div>
        </section>
      </div>
    </div>
  );
}

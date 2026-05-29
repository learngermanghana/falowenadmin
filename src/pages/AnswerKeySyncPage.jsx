import { useEffect, useState } from "react";
import { loadAnswerKeyRegistry } from "../services/markingService.js";
import { DEFAULT_ANSWER_KEY_MANIFEST_URL, syncAnswerKeysFromGitHub } from "../services/answerKeySyncService.js";
import { useToast } from "../context/ToastContext.jsx";

export default function AnswerKeySyncPage() {
  const { success, error } = useToast();
  const [manifestUrl, setManifestUrl] = useState(DEFAULT_ANSWER_KEY_MANIFEST_URL);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [registry, setRegistry] = useState([]);

  const refreshRegistry = async () => {
    setLoading(true);
    try {
      setRegistry(await loadAnswerKeyRegistry());
    } catch (err) {
      error(err?.message || "Failed to load answer key registry");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshRegistry();
  }, []);

  const handleSync = async () => {
    const confirmed = window.confirm(
      "Sync answer keys from GitHub into Firebase Storage and Firestore? This will update active answer keys used for AI marking.",
    );
    if (!confirmed) return;

    setSyncing(true);
    try {
      const result = await syncAnswerKeysFromGitHub({ manifestUrl: manifestUrl.trim() || DEFAULT_ANSWER_KEY_MANIFEST_URL });
      setSummary(result);
      await refreshRegistry();
      success(`Synced ${result.importedCount} answer keys to Firebase Storage.`);
    } catch (err) {
      error(err?.message || "GitHub answer key sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const rows = registry.slice(0, 120);

  return (
    <div style={{ padding: 16, display: "grid", gap: 14 }}>
      <h2>Answer Key Sync</h2>
      <p style={{ marginTop: -8, opacity: 0.8 }}>
        Use this page when you update answer keys on GitHub. It copies the latest manifest into Firebase Storage and updates Firestore metadata used by AI marking.
      </p>

      <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, display: "grid", gap: 10 }}>
        <h3 style={{ margin: 0 }}>Sync from GitHub to Firebase</h3>
        <label style={{ display: "grid", gap: 4 }}>
          GitHub manifest URL
          <input
            value={manifestUrl}
            onChange={(event) => setManifestUrl(event.target.value)}
            placeholder={DEFAULT_ANSWER_KEY_MANIFEST_URL}
            style={{ width: "100%" }}
          />
        </label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" onClick={handleSync} disabled={syncing}>
            {syncing ? "Syncing..." : "Sync Answer Keys from GitHub"}
          </button>
          <button type="button" onClick={refreshRegistry} disabled={loading}>Refresh registry</button>
        </div>
        <p style={{ margin: 0, fontSize: 13, opacity: 0.8 }}>
          Storage target: <code>answer-keys/{"{assignmentKey}"}/active.json</code> and <code>answer-keys/{"{assignmentKey}"}/versions/{"{version}"}.json</code>. Firestore target: <code>answerKeyRegistry/{"{assignmentKey}"}</code>.
        </p>
      </section>

      {summary ? (
        <section style={{ border: "1px solid #bfdbfe", borderRadius: 8, padding: 12, background: "#eff6ff", display: "grid", gap: 6 }}>
          <h3 style={{ margin: 0 }}>Last sync result</h3>
          <div>Version: <b>{summary.version}</b></div>
          <div>Imported: <b>{summary.importedCount}</b> · Failed: <b>{summary.failedCount}</b> · Total: <b>{summary.totalAssignments}</b></div>
          <div>Manifest storage path: <code>{summary.manifestStoragePath}</code></div>
          <div>Sample keys: {summary.sampleImportedKeys?.length ? summary.sampleImportedKeys.join(", ") : "—"}</div>
          {summary.warnings?.length ? (
            <details>
              <summary>Warnings ({summary.warnings.length})</summary>
              <ul>
                {summary.warnings.slice(0, 30).map((warning) => <li key={warning}>{warning}</li>)}
              </ul>
            </details>
          ) : null}
          {summary.failed?.length ? (
            <details>
              <summary>Failed keys ({summary.failed.length})</summary>
              <ul>
                {summary.failed.map((item) => <li key={item.assignmentKey}><code>{item.assignmentKey}</code>: {item.reason}</li>)}
              </ul>
            </details>
          ) : null}
        </section>
      ) : null}

      <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
        <h3 style={{ marginTop: 0 }}>Current Firestore Registry</h3>
        {loading ? <p>Loading answer keys...</p> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 6 }}>Assignment</th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 6 }}>Title</th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 6 }}>Answers</th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 6 }}>Storage</th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 6 }}>Updated</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((entry) => (
                  <tr key={entry.id || entry.assignmentKey}>
                    <td style={{ borderBottom: "1px solid #eee", padding: 6 }}><code>{entry.assignmentKey || entry.id}</code></td>
                    <td style={{ borderBottom: "1px solid #eee", padding: 6 }}>{entry.title || "—"}</td>
                    <td style={{ borderBottom: "1px solid #eee", padding: 6 }}>{entry.totalAnswers ?? "—"}</td>
                    <td style={{ borderBottom: "1px solid #eee", padding: 6 }}>{entry.storagePath ? <code>{entry.storagePath}</code> : "—"}</td>
                    <td style={{ borderBottom: "1px solid #eee", padding: 6 }}>{entry.syncedAt || entry.updatedAt || entry.importedAt || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

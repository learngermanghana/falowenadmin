import { useCallback, useEffect, useState } from "react";
import { listCommunicationHistory } from "../services/communicationService.js";

function toDate(value) {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  if (typeof value?.toMillis === "function") return new Date(value.toMillis());
  if (typeof value === "object" && Number.isFinite(value.seconds)) return new Date(Number(value.seconds) * 1000);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatTime(value) {
  const date = toDate(value);
  if (!date) return "—";
  return date.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

function audienceLabel(entry = {}) {
  const raw = String(entry.recipientFilter || entry.audienceMode || "").trim();
  if (raw === "all") return "All enrolled students";
  if (raw === "present") return "Present";
  if (raw === "absent") return "Absent";
  if (raw === "not_checked_in") return "Not checked in";
  if (raw === "not_submitted") return "Did not submit";
  if (raw === "unpaid") return "Unpaid";
  if (raw) return raw;
  return entry.email ? "One student" : "Class / broadcast";
}

export default function CommunicationHistoryPanel() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setHistory(await listCommunicationHistory({ limit: 30 }));
    } catch (error) {
      console.warn("Could not load communication history", error);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <section style={{ border: "1px solid #dbe3ef", borderRadius: 12, padding: 16, display: "grid", gap: 12, background: "#fff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <h3 style={{ margin: "0 0 4px" }}>Recent communication</h3>
          <p style={{ margin: 0, color: "#64748b" }}>Broadcasts and targeted sends appear in one history.</p>
        </div>
        <button type="button" onClick={refresh} disabled={loading}>{loading ? "Refreshing..." : "Refresh"}</button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>
              <th style={{ padding: 8 }}>Sent</th>
              <th style={{ padding: 8 }}>Audience</th>
              <th style={{ padding: 8 }}>Class / session</th>
              <th style={{ padding: 8 }}>Topic</th>
              <th style={{ padding: 8 }}>Delivered</th>
              <th style={{ padding: 8 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {history.map((entry) => (
              <tr key={entry.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: 8, whiteSpace: "nowrap" }}>{formatTime(entry.createdAt)}</td>
                <td style={{ padding: 8 }}>{audienceLabel(entry)}</td>
                <td style={{ padding: 8 }}>
                  <strong>{entry.class || "—"}</strong>
                  {entry.sessionLabel ? <div style={{ color: "#64748b", fontSize: 12 }}>{entry.sessionLabel}</div> : null}
                </td>
                <td style={{ padding: 8 }}>{entry.topic || "—"}</td>
                <td style={{ padding: 8 }}>{Number(entry.successCount ?? entry.recipientCount ?? (entry.email ? 1 : 0)) || "—"}</td>
                <td style={{ padding: 8 }}>
                  {entry.deliveryStatus || "saved"}
                  {Number(entry.failureCount || 0) > 0 ? ` · ${entry.failureCount} failed` : ""}
                </td>
              </tr>
            ))}
            {!history.length && !loading ? (
              <tr><td colSpan={6} style={{ padding: 12, color: "#64748b" }}>No communication history yet.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

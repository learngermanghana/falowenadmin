import { useCallback, useEffect, useState } from "react";
import {
  fetchIntegrationHealth,
  listIntegrationEvents,
  retryIntegrationEvent,
} from "../services/integrationEventService.js";
import { useToast } from "../context/ToastContext.jsx";

function formatDate(value) {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleString();
}

function statusStyle(status) {
  const normalized = String(status || "").toLowerCase();
  const background = normalized === "processed" || normalized === "sent"
    ? "#dcfce7"
    : normalized === "failed"
      ? "#fee2e2"
      : normalized === "partial"
        ? "#fef3c7"
        : "#e2e8f0";
  return {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 999,
    padding: "3px 8px",
    background,
    color: "#0f172a",
    fontSize: 12,
    fontWeight: 700,
  };
}

function healthCard(title, health) {
  const configured = Boolean(health?.configured);
  return (
    <div style={{ border: "1px solid #dbe2ea", borderRadius: 12, padding: 12, background: "#fff" }}>
      <div style={{ fontSize: 12, color: "#64748b" }}>{title}</div>
      <div style={{ fontWeight: 800, marginTop: 4 }}>{configured ? "Connected" : "Needs configuration"}</div>
      <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>
        URL {health?.urlConfigured ? "ready" : "missing"} · token {health?.tokenConfigured ? "ready" : "missing"}
      </div>
    </div>
  );
}

export default function IntegrationEventPanel() {
  const { success: showSuccess, error: showError } = useToast();
  const [health, setHealth] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [nextHealth, nextEvents] = await Promise.all([
        fetchIntegrationHealth(),
        listIntegrationEvents({ limit: 60 }),
      ]);
      setHealth(nextHealth);
      setEvents(nextEvents);
    } catch (error) {
      showError(error?.message || "Could not load integration status.");
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const retry = async (event) => {
    setRetrying(event.id);
    try {
      const result = await retryIntegrationEvent(event);
      showSuccess(`Retry processed as ${result.event?.id || "a new event"}.`);
      await refresh();
    } catch (error) {
      showError(error?.message || "Retry failed.");
      await refresh();
    } finally {
      setRetrying("");
    }
  };

  return (
    <section style={{ padding: "0 16px 16px", display: "grid", gap: 14 }}>
      <div style={{ border: "1px solid #dbe2ea", borderRadius: 14, background: "#f8fafc", padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start", flexWrap: "wrap" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20 }}>Integration events</h2>
            <p style={{ margin: "6px 0 0", color: "#475569", maxWidth: 780 }}>
              Score-sheet, communication and registration-document requests pass through one authenticated Falowen event system. Webhook tokens remain server-side, and each request receives an event ID for tracing and retry.
            </p>
          </div>
          <button type="button" onClick={refresh} disabled={loading} style={{ padding: "9px 13px", borderRadius: 9, border: "1px solid #94a3b8", background: "#fff", fontWeight: 700 }}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10, marginTop: 14 }}>
          {healthCard("Score sheet", health?.integrations?.scores)}
          {healthCard("Communication worker", health?.integrations?.communication)}
          {healthCard("Registration documents", health?.integrations?.registration)}
          <div style={{ border: "1px solid #dbe2ea", borderRadius: 12, padding: 12, background: "#fff" }}>
            <div style={{ fontSize: 12, color: "#64748b" }}>Event store</div>
            <div style={{ fontWeight: 800, marginTop: 4 }}>{health?.eventStore || "Firestore audit log"}</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>Legacy scheduled jobs can remain enabled as reconciliation fallbacks.</div>
          </div>
        </div>
      </div>

      <div style={{ overflowX: "auto", border: "1px solid #dbe2ea", borderRadius: 12, background: "#fff" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 820 }}>
          <thead>
            <tr style={{ background: "#f8fafc", textAlign: "left" }}>
              {["Time", "Event", "Status", "Destination", "Actor", "Action"].map((label) => (
                <th key={label} style={{ padding: 10, borderBottom: "1px solid #e2e8f0", fontSize: 12 }}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!events.length ? (
              <tr><td colSpan={6} style={{ padding: 16, color: "#64748b" }}>{loading ? "Loading events…" : "No integration events yet."}</td></tr>
            ) : events.map((event) => {
              const destinations = Object.entries(event.destinations || {});
              const destinationLabel = (name) => name === "registration" ? "Registration documents" : name;
              return (
                <tr key={event.id}>
                  <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap" }}>{formatDate(event.createdAt)}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>
                    <div style={{ fontWeight: 700 }}>{event.type || "integration.event"}</div>
                    <div style={{ fontSize: 11, color: "#64748b", maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis" }}>{event.id}</div>
                    {event.retryOf ? <div style={{ fontSize: 11, color: "#92400e" }}>Retry of {event.retryOf}</div> : null}
                  </td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}><span style={statusStyle(event.status)}>{event.status || "unknown"}</span></td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>
                    {destinations.length ? destinations.map(([name, detail]) => (
                      <div key={name} style={{ fontSize: 12 }}>{destinationLabel(name)}: {detail?.status || "unknown"}</div>
                    )) : "—"}
                  </td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>{event.actor || "—"}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>
                    {event.status === "failed" && event.request?.type ? (
                      <button type="button" onClick={() => retry(event)} disabled={retrying === event.id} style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff", fontWeight: 700 }}>
                        {retrying === event.id ? "Retrying…" : "Retry"}
                      </button>
                    ) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

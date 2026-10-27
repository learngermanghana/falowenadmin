export default function AdminRefreshStatus({ refresh, lastUpdated, refreshing, refreshError, label }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, margin: "8px 0", fontSize: 12 }}>
      <button type="button" onClick={() => void refresh()} disabled={refreshing} aria-label={`Refresh ${label} now`}>
        {refreshing ? "Refreshing…" : "Refresh now"}
      </button>
      <span role="status">
        {lastUpdated ? <>Last updated: <time dateTime={lastUpdated.toISOString()}>{lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</time></> : "Not updated yet"}
      </span>
      {refreshError ? <span role="alert" style={{ color: "#b91c1c", overflowWrap: "anywhere" }}>Could not refresh: {refreshError}</span> : null}
    </div>
  );
}

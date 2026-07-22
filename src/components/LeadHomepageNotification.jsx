import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { markAllLeadNotificationsSeen, summarizeLeadNotifications } from "../services/leadNotificationService.js";
import { fetchStudentLeads } from "../services/studentLeadService.js";

export default function LeadHomepageNotification() {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return undefined;
    let active = true;

    fetchStudentLeads()
      .then((result) => {
        if (!active) return;
        setLeads(result.leads || []);
        setError("");
      })
      .catch((loadError) => {
        if (!active) return;
        setLeads([]);
        setError(loadError?.message || "Student leads could not be loaded.");
      });

    return () => {
      active = false;
    };
  }, [user]);

  const summary = useMemo(() => summarizeLeadNotifications(leads, user), [leads, user]);
  const preview = summary.unseenLeads.slice(0, 3);

  function handleMarkAllSeen() {
    markAllLeadNotificationsSeen(user, leads);
    setLeads((current) => [...current]);
  }

  if (!user || summary.unseenCount === 0) return null;

  return (
    <section
      aria-live="polite"
      style={{
        maxWidth: 1440,
        margin: "14px auto 0",
        padding: "14px 16px",
        borderRadius: 12,
        border: "1px solid #f59e0b",
        background: "#fffbeb",
        color: "#1f2937",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
        <div>
          <strong style={{ display: "block", fontSize: 16 }}>🔔 Lead notification</strong>
          <span>
            {`${summary.unseenCount} unseen lead notification${summary.unseenCount === 1 ? "" : "s"} need attention. ${summary.unresolvedCount} unresolved lead${summary.unresolvedCount === 1 ? "" : "s"} total; ${summary.newUnseenCount} new unseen.`}
          </span>
          {error ? <small style={{ display: "block", color: "#991b1b", marginTop: 4 }}>Lead warning: {error}</small> : null}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link to="/students?tab=leads" style={{ fontWeight: 800 }}>Open leads</Link>
          <button type="button" onClick={handleMarkAllSeen} style={{ fontWeight: 800 }}>Mark all as seen</button>
        </div>
      </div>

      {preview.length ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
          {preview.map((lead) => (
            <span
              key={lead.id}
              style={{ padding: "5px 9px", borderRadius: 999, border: "1px solid #fde68a", background: "#fff" }}
            >
              <strong>{lead.name || lead.email || lead.number || "Unnamed lead"}</strong>
              {lead.className || lead.level ? ` · ${lead.className || lead.level}` : ""}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}

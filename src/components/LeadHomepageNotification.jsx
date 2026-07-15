import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchStudentLeads } from "../services/studentLeadService.js";

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function isCompletedLead(lead = {}) {
  const status = normalize(lead.status);
  const paymentStatus = normalize(lead.paymentStatus);
  const terminalStatuses = [
    "student_registered",
    "completed",
    "complete",
    "converted",
    "closed",
    "class_started_no_followup",
    "not_interested",
    "cancelled",
    "canceled",
    "archived",
  ];
  const paidStatuses = ["paid", "registered_paid", "success", "successful", "completed", "complete"];

  return terminalStatuses.some((token) => status.includes(token))
    || paidStatuses.some((token) => paymentStatus.includes(token));
}

function isNewLead(lead = {}) {
  const status = normalize(lead.status);
  return !status || status === "new" || status === "new_lead";
}

function leadDate(lead = {}) {
  const parsed = new Date(lead.registrationDate || lead.createdAt || 0);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

export default function LeadHomepageNotification() {
  const [leads, setLeads] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
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
  }, []);

  const openLeads = useMemo(
    () => leads
      .filter((lead) => !isCompletedLead(lead))
      .sort((left, right) => leadDate(right) - leadDate(left)),
    [leads],
  );
  const newLeadCount = openLeads.filter(isNewLead).length;
  const preview = openLeads.slice(0, 3);

  return (
    <section
      aria-live="polite"
      style={{
        maxWidth: 1440,
        margin: "14px auto 0",
        padding: "14px 16px",
        borderRadius: 12,
        border: `1px solid ${openLeads.length ? "#f59e0b" : "#86efac"}`,
        background: openLeads.length ? "#fffbeb" : "#f0fdf4",
        color: "#1f2937",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
        <div>
          <strong style={{ display: "block", fontSize: 16 }}>🔔 Lead notification</strong>
          <span>
            {openLeads.length
              ? `${openLeads.length} lead${openLeads.length === 1 ? "" : "s"} need attention. ${newLeadCount} new.`
              : "No leads currently need attention."}
          </span>
          {error ? <small style={{ display: "block", color: "#991b1b", marginTop: 4 }}>Lead warning: {error}</small> : null}
        </div>
        <Link to="/students?tab=leads" style={{ fontWeight: 800 }}>Open leads</Link>
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

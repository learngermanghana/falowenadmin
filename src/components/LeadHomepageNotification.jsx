import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchStudentLeads } from "../services/studentLeadService.js";
import "./LeadHomepageNotification.css";

const SEEN_STORAGE_PREFIX = "falowen:dashboard-leads-seen";
const REFRESH_INTERVAL_MS = 45_000;
const MAX_STORED_SEEN_LEADS = 500;

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function leadIdentity(lead = {}) {
  return String(
    lead.id
      || lead.leadId
      || lead.email
      || lead.number
      || `${lead.name || "lead"}-${lead.registrationDate || ""}`,
  ).trim();
}

function seenStorageKey(user = {}) {
  const userKey = String(user.uid || user.email || "signed-in-user").trim().toLowerCase();
  return `${SEEN_STORAGE_PREFIX}:${userKey}`;
}

function readSeenLeadIds(storageKey) {
  if (typeof window === "undefined" || !storageKey) return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey) || "[]");
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function writeSeenLeadIds(storageKey, ids = []) {
  if (typeof window === "undefined" || !storageKey) return;
  try {
    const uniqueIds = [...new Set(ids.map(String).filter(Boolean))].slice(-MAX_STORED_SEEN_LEADS);
    window.localStorage.setItem(storageKey, JSON.stringify(uniqueIds));
  } catch {
    // Lead notifications still work when browser storage is unavailable.
  }
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
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [seenLeadIds, setSeenLeadIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const storageKey = useMemo(() => (user ? seenStorageKey(user) : ""), [user]);

  const loadLeads = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await fetchStudentLeads();
      setLeads(result.leads || []);
      setError("");
    } catch (loadError) {
      setError(loadError?.message || "Student leads could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    setSeenLeadIds(storageKey ? readSeenLeadIds(storageKey) : []);
  }, [storageKey]);

  useEffect(() => {
    if (!user) return undefined;

    loadLeads();
    const intervalId = window.setInterval(loadLeads, REFRESH_INTERVAL_MS);
    const refreshOnFocus = () => loadLeads();
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") loadLeads();
    };

    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshOnFocus);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [loadLeads, user]);

  const openLeads = useMemo(
    () => leads
      .filter((lead) => !isCompletedLead(lead))
      .sort((left, right) => leadDate(right) - leadDate(left)),
    [leads],
  );
  const seenSet = useMemo(() => new Set(seenLeadIds), [seenLeadIds]);
  const unseenOpenLeads = useMemo(
    () => openLeads.filter((lead) => !seenSet.has(leadIdentity(lead))),
    [openLeads, seenSet],
  );
  const newLeadCount = unseenOpenLeads.filter(isNewLead).length;
  const preview = unseenOpenLeads.slice(0, 3);

  function persistSeenIds(nextIds) {
    const uniqueIds = [...new Set(nextIds.map(String).filter(Boolean))];
    setSeenLeadIds(uniqueIds);
    writeSeenLeadIds(storageKey, uniqueIds);
  }

  function markLeadSeen(lead) {
    const id = leadIdentity(lead);
    if (!id) return;
    persistSeenIds([...seenLeadIds, id]);
  }

  function markAllSeen() {
    persistSeenIds([
      ...seenLeadIds,
      ...unseenOpenLeads.map(leadIdentity),
    ]);
  }

  if (!user || (loading && !leads.length && !error)) return null;
  if (!unseenOpenLeads.length && !error) return null;

  return (
    <section className="lead-home-notification" aria-live="polite">
      <div className="lead-home-header">
        <div className="lead-home-heading">
          <strong>🔔 Lead notification</strong>
          <span>
            {unseenOpenLeads.length
              ? `${unseenOpenLeads.length} unseen lead${unseenOpenLeads.length === 1 ? "" : "s"}. ${newLeadCount} new.`
              : "Lead notifications could not be refreshed."}
          </span>
          {error ? <small className="lead-home-error">Lead warning: {error}</small> : null}
        </div>

        <div className="lead-home-actions">
          <Link to="/students?tab=leads">Open leads</Link>
          <button type="button" onClick={loadLeads} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          {unseenOpenLeads.length ? (
            <button type="button" onClick={markAllSeen}>Mark all seen</button>
          ) : null}
        </div>
      </div>

      {preview.length ? (
        <div className="lead-home-preview">
          {preview.map((lead, index) => (
            <div className="lead-home-item" key={`${leadIdentity(lead)}-${index}`}>
              <span className="lead-home-item-copy">
                <strong>{lead.name || lead.email || lead.number || "Unnamed lead"}</strong>
                {lead.className || lead.level ? ` · ${lead.className || lead.level}` : ""}
              </span>
              <button
                type="button"
                onClick={() => markLeadSeen(lead)}
                title="Hide this dashboard notification. The lead remains on the Leads page."
              >
                Mark seen
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {unseenOpenLeads.length ? (
        <small className="lead-home-note">
          Marking a lead as seen only hides this dashboard alert. The lead remains on the main Leads page.
        </small>
      ) : null}
    </section>
  );
}

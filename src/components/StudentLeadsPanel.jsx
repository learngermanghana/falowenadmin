import { useEffect, useMemo, useState } from "react";
import {
  fetchStudentLeads,
  normalizeLeadPhone,
  STUDENT_LEADS_PUBLISHED_URL,
  STUDENT_LEADS_SHEET_NAME,
} from "../services/studentLeadService.js";
import { deleteStudentLead } from "../services/studentLeadDeletionService.js";
import "./StudentLeadsPanel.css";

const headerCellStyle = {
  textAlign: "left",
  padding: 10,
  whiteSpace: "nowrap",
  borderBottom: "1px solid #dbe3ee",
};

const bodyCellStyle = {
  padding: 10,
  verticalAlign: "top",
  whiteSpace: "nowrap",
};

function callUrl(phone) {
  const normalizedPhone = String(phone || "").trim().replace(/(?!^)\+|[^\d+]/g, "");
  return normalizedPhone ? `tel:${normalizedPhone}` : "";
}

function mailUrl(email) {
  const clean = String(email || "").trim();
  return clean ? `mailto:${clean}` : "";
}

function whatsappUrl(phone, lead = {}) {
  const normalizedPhone = normalizeLeadPhone(phone);
  if (!normalizedPhone) return "";

  const greeting = lead.name ? `Hello ${lead.name},` : "Hello,";
  const course = lead.className || lead.level;
  const context = course ? ` about your interest in ${course}` : " about your class enquiry";
  const message = `${greeting} this is Learn Language Education Academy. We received your details${context}. How may we assist you?`;

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}

function readableLabel(value) {
  const clean = String(value || "").trim();
  if (!clean) return "—";
  return clean
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDateValue(value) {
  const clean = String(value || "").trim();
  if (!clean) return "—";

  const parsed = new Date(clean);
  if (Number.isNaN(parsed.getTime())) return clean;

  const hasTime = /T|\d{1,2}:\d{2}/.test(clean);
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    ...(hasTime ? { timeStyle: "short" } : {}),
    timeZone: "Africa/Accra",
  }).format(parsed);
}

function formatMoney(value) {
  const clean = String(value || "").trim();
  if (!clean) return "—";

  const amount = Number(clean.replace(/GHS|₵|,/gi, "").trim());
  if (!Number.isFinite(amount)) return clean;

  return `GHS ${amount.toLocaleString("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function statusStyle(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (/paid|success|registered/.test(normalized)) {
    return { background: "#dcfce7", color: "#166534", border: "1px solid #86efac" };
  }
  if (/pending|waiting|partial|follow/.test(normalized)) {
    return { background: "#fef3c7", color: "#92400e", border: "1px solid #fcd34d" };
  }
  if (/stop|cancel|failed|not interested/.test(normalized)) {
    return { background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5" };
  }
  return { background: "#eef2ff", color: "#3730a3", border: "1px solid #c7d2fe" };
}

function isCompletedLead(lead = {}) {
  const status = String(lead.status || "").trim().toLowerCase();
  const paymentStatus = String(lead.paymentStatus || "").trim().toLowerCase();
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

function StatusPill({ value }) {
  if (!String(value || "").trim()) return <span>—</span>;
  return (
    <span className="student-lead-status-pill" style={statusStyle(value)}>
      {readableLabel(value)}
    </span>
  );
}

function Detail({ label, children }) {
  return (
    <div className="student-lead-detail">
      <dt>{label}</dt>
      <dd>{children || "—"}</dd>
    </div>
  );
}

function LeadActions({ lead, deletingId, onCopy, onDelete }) {
  const phoneLink = callUrl(lead.number);
  const emailLink = mailUrl(lead.email);
  const whatsappLink = whatsappUrl(lead.number, lead);
  const canDelete = isCompletedLead(lead);

  return (
    <div className="student-lead-actions">
      {whatsappLink ? <a href={whatsappLink} target="_blank" rel="noreferrer">WhatsApp</a> : null}
      {phoneLink ? <a href={phoneLink}>Call</a> : null}
      {emailLink ? <a href={emailLink}>Email</a> : null}
      {lead.number ? (
        <button type="button" onClick={() => onCopy(lead.number, "Phone number")}>Copy phone</button>
      ) : null}
      {lead.email ? (
        <button type="button" onClick={() => onCopy(lead.email, "Email")}>Copy email</button>
      ) : null}
      {canDelete ? (
        <button
          type="button"
          className="student-lead-delete-button"
          onClick={() => onDelete(lead)}
          disabled={deletingId === lead.id}
        >
          {deletingId === lead.id ? "Deleting…" : "Delete completed"}
        </button>
      ) : null}
    </div>
  );
}

function StudentLeadCard({ lead, deletingId, onCopy, onDelete }) {
  return (
    <article className="student-lead-card">
      <header className="student-lead-card-header">
        <div>
          <h3>{lead.name || "Unnamed lead"}</h3>
          <p>{lead.className || lead.level || "Class not specified"}</p>
        </div>
        <span className="student-lead-card-date">{formatDateValue(lead.registrationDate)}</span>
      </header>

      <div className="student-lead-card-statuses">
        <StatusPill value={lead.status} />
        <StatusPill value={lead.paymentStatus} />
      </div>

      <div className="student-lead-card-contact">
        <span><strong>Phone:</strong> {lead.number || "—"}</span>
        <span><strong>Email:</strong> {lead.email || "—"}</span>
      </div>

      <details className="student-lead-card-details">
        <summary>View lead details</summary>
        <dl className="student-lead-details-grid">
          <Detail label="Level">{lead.level || "—"}</Detail>
          <Detail label="Class">{lead.className || "—"}</Detail>
          <Detail label="Amount paid">{formatMoney(lead.amountPaid)}</Detail>
          <Detail label="Balance">{formatMoney(lead.balance)}</Detail>
          <Detail label="Student code">{lead.studentCode || "—"}</Detail>
          <Detail label="Next follow-up">{formatDateValue(lead.nextFollowUpAt)}</Detail>
          <Detail label="Last follow-up">{formatDateValue(lead.lastFollowUpAt)}</Detail>
          <Detail label="Source">{readableLabel(lead.source)}</Detail>
        </dl>
      </details>

      <LeadActions
        lead={lead}
        deletingId={deletingId}
        onCopy={onCopy}
        onDelete={onDelete}
      />
    </article>
  );
}

async function copyToClipboard(value) {
  const text = String(value || "").trim();
  if (!text) return false;

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);
  return copied;
}

export default function StudentLeadsPanel() {
  const [leads, setLeads] = useState([]);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [copyNotice, setCopyNotice] = useState("");
  const [deletingId, setDeletingId] = useState("");

  async function loadLeads() {
    setLoading(true);
    setError("");
    try {
      const result = await fetchStudentLeads();
      setLeads(result.leads || []);
      setDuplicateCount(result.duplicateCount || 0);
      setTotalRows(result.total || 0);
    } catch (err) {
      setError(err?.message || "Student leads could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy(value, label) {
    try {
      const copied = await copyToClipboard(value);
      setCopyNotice(copied ? `${label} copied.` : `${label} could not be copied.`);
    } catch {
      setCopyNotice(`${label} could not be copied.`);
    }
    window.setTimeout(() => setCopyNotice(""), 1800);
  }

  async function handleDeleteLead(lead) {
    if (!isCompletedLead(lead)) {
      setError("Only completed, converted, registered, closed, or fully paid leads can be deleted.");
      return;
    }

    const leadLabel = lead.name || lead.email || lead.number || "this lead";
    const confirmed = window.confirm(
      `Delete completed lead "${leadLabel}"? This permanently removes the row from the Leads sheet.`,
    );
    if (!confirmed) return;

    setDeletingId(lead.id);
    setError("");
    try {
      await deleteStudentLead(lead);
      setLeads((current) => current.filter((item) => item.id !== lead.id));
      setTotalRows((current) => Math.max(0, current - 1));
      setCopyNotice(`Deleted completed lead: ${leadLabel}.`);
      window.setTimeout(() => setCopyNotice(""), 2500);
    } catch (deleteError) {
      setError(deleteError?.message || "Completed lead could not be deleted.");
    } finally {
      setDeletingId("");
    }
  }

  useEffect(() => {
    loadLeads();
  }, []);

  const filteredLeads = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return leads;

    return leads.filter((lead) => [
      lead.name,
      lead.email,
      lead.number,
      lead.level,
      lead.className,
      lead.status,
      lead.paymentStatus,
      lead.studentCode,
      lead.source,
    ]
      .map((value) => String(value || "").toLowerCase())
      .join(" ")
      .includes(needle));
  }, [leads, query]);

  return (
    <div className="student-leads-panel">
      <div className="student-leads-toolbar">
        <div>
          <h2>Student Leads</h2>
          <p>
            Showing contact, class, payment, registration and follow-up information from the published <strong>{STUDENT_LEADS_SHEET_NAME}</strong> sheet. Duplicate leads are hidden automatically.
          </p>
        </div>
        <button type="button" onClick={loadLeads} disabled={loading}>{loading ? "Refreshing…" : "Refresh leads"}</button>
      </div>

      <div className="student-leads-source">
        Source: <a href={STUDENT_LEADS_PUBLISHED_URL} target="_blank" rel="noreferrer">published Google Sheet</a> · Sheet tab: <strong>{STUDENT_LEADS_SHEET_NAME}</strong>
      </div>

      <label className="student-leads-search">
        <span>Search leads</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name, contact, class, status, payment, student code, or source..."
        />
      </label>

      {copyNotice ? <div role="status" className="student-leads-notice">{copyNotice}</div> : null}
      {loading ? <p>Loading student leads…</p> : null}
      {error ? <p className="student-leads-error">❌ {error}</p> : null}

      {!loading && !error ? (
        <>
          <p className="student-leads-count">
            Showing <strong>{filteredLeads.length}</strong> lead(s). Hidden duplicates: <strong>{duplicateCount}</strong>. Raw rows checked: <strong>{totalRows}</strong>.
          </p>

          {filteredLeads.length === 0 ? <p>No leads found.</p> : null}

          {filteredLeads.length > 0 ? (
            <>
              <div className="student-leads-mobile" aria-label="Student leads mobile list">
                {filteredLeads.map((lead, index) => (
                  <StudentLeadCard
                    key={`${lead.id}-${index}`}
                    lead={lead}
                    deletingId={deletingId}
                    onCopy={handleCopy}
                    onDelete={handleDeleteLead}
                  />
                ))}
              </div>

              <div className="student-leads-desktop">
                <table className="student-leads-table">
                  <thead>
                    <tr>
                      <th style={headerCellStyle}>Name</th>
                      <th style={headerCellStyle}>Phone</th>
                      <th style={headerCellStyle}>Email</th>
                      <th style={headerCellStyle}>Level</th>
                      <th style={headerCellStyle}>Class</th>
                      <th style={headerCellStyle}>Lead status</th>
                      <th style={headerCellStyle}>Payment status</th>
                      <th style={headerCellStyle}>Amount paid</th>
                      <th style={headerCellStyle}>Balance</th>
                      <th style={headerCellStyle}>Student code</th>
                      <th style={headerCellStyle}>Registered</th>
                      <th style={headerCellStyle}>Next follow-up</th>
                      <th style={headerCellStyle}>Last follow-up</th>
                      <th style={headerCellStyle}>Source</th>
                      <th className="student-leads-sticky-header" style={headerCellStyle}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map((lead, index) => (
                      <tr key={`${lead.id}-${index}`}>
                        <td style={{ ...bodyCellStyle, fontWeight: 700 }}>{lead.name || "—"}</td>
                        <td style={bodyCellStyle}>{lead.number || "—"}</td>
                        <td style={bodyCellStyle}>{lead.email || "—"}</td>
                        <td style={bodyCellStyle}>{lead.level || "—"}</td>
                        <td style={bodyCellStyle}>{lead.className || "—"}</td>
                        <td style={bodyCellStyle}><StatusPill value={lead.status} /></td>
                        <td style={bodyCellStyle}><StatusPill value={lead.paymentStatus} /></td>
                        <td style={bodyCellStyle}>{formatMoney(lead.amountPaid)}</td>
                        <td style={bodyCellStyle}>{formatMoney(lead.balance)}</td>
                        <td style={bodyCellStyle}>{lead.studentCode || "—"}</td>
                        <td style={bodyCellStyle}>{formatDateValue(lead.registrationDate)}</td>
                        <td style={bodyCellStyle}>{formatDateValue(lead.nextFollowUpAt)}</td>
                        <td style={bodyCellStyle}>{formatDateValue(lead.lastFollowUpAt)}</td>
                        <td style={bodyCellStyle}>{readableLabel(lead.source)}</td>
                        <td className="student-leads-sticky-actions" style={bodyCellStyle}>
                          <LeadActions
                            lead={lead}
                            deletingId={deletingId}
                            onCopy={handleCopy}
                            onDelete={handleDeleteLead}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

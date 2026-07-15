import { useEffect, useMemo, useState } from "react";
import {
  fetchStudentLeads,
  normalizeLeadPhone,
  STUDENT_LEADS_PUBLISHED_URL,
  STUDENT_LEADS_SHEET_NAME,
} from "../services/studentLeadService.js";

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

function StatusPill({ value }) {
  if (!String(value || "").trim()) return <span>—</span>;
  return (
    <span style={{
      display: "inline-block",
      padding: "3px 8px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 700,
      ...statusStyle(value),
    }}>
      {readableLabel(value)}
    </span>
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
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: "0 0 6px" }}>Student Leads</h2>
          <p style={{ margin: 0, opacity: 0.78 }}>
            Showing contact, class, payment, registration and follow-up information from the published <strong>{STUDENT_LEADS_SHEET_NAME}</strong> sheet. Duplicate leads are hidden automatically.
          </p>
        </div>
        <button type="button" onClick={loadLeads} disabled={loading}>{loading ? "Refreshing…" : "Refresh leads"}</button>
      </div>

      <div style={{ padding: 12, border: "1px solid #bfdbfe", borderRadius: 10, background: "#eff6ff", color: "#1e3a8a" }}>
        Source: <a href={STUDENT_LEADS_PUBLISHED_URL} target="_blank" rel="noreferrer">published Google Sheet</a> · Sheet tab: <strong>{STUDENT_LEADS_SHEET_NAME}</strong>
      </div>

      <label style={{ display: "grid", gap: 6, maxWidth: 560 }}>
        <span style={{ fontWeight: 700 }}>Search leads</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name, contact, class, status, payment, student code, or source..."
          style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #ccd4e2" }}
        />
      </label>

      {copyNotice ? (
        <div role="status" style={{ padding: "8px 10px", borderRadius: 8, background: "#ecfdf5", color: "#166534", width: "fit-content" }}>
          {copyNotice}
        </div>
      ) : null}

      {loading ? <p>Loading student leads…</p> : null}
      {error ? <p style={{ color: "#a00000" }}>❌ {error}</p> : null}

      {!loading && !error ? (
        <>
          <p style={{ margin: 0 }}>
            Showing <strong>{filteredLeads.length}</strong> lead(s). Hidden duplicates: <strong>{duplicateCount}</strong>. Raw rows checked: <strong>{totalRows}</strong>.
          </p>

          {filteredLeads.length === 0 ? <p>No leads found.</p> : null}

          {filteredLeads.length > 0 ? (
            <div style={{ overflowX: "auto", border: "1px solid #e5e7eb", borderRadius: 10 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1700 }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
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
                    <th style={{ ...headerCellStyle, position: "sticky", right: 0, background: "#f8fafc" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead, index) => {
                    const phoneLink = callUrl(lead.number);
                    const emailLink = mailUrl(lead.email);
                    const whatsappLink = whatsappUrl(lead.number, lead);

                    return (
                      <tr key={`${lead.id}-${index}`} style={{ borderTop: "1px solid #e5e7eb" }}>
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
                        <td style={{ ...bodyCellStyle, position: "sticky", right: 0, background: "#ffffff" }}>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", minWidth: 260 }}>
                            {whatsappLink ? <a href={whatsappLink} target="_blank" rel="noreferrer">WhatsApp</a> : null}
                            {phoneLink ? <a href={phoneLink}>Call</a> : null}
                            {emailLink ? <a href={emailLink}>Email</a> : null}
                            {lead.number ? (
                              <button type="button" onClick={() => handleCopy(lead.number, "Phone number")}>Copy phone</button>
                            ) : null}
                            {lead.email ? (
                              <button type="button" onClick={() => handleCopy(lead.email, "Email")}>Copy email</button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { fetchStudentLeads, STUDENT_LEADS_PUBLISHED_URL, STUDENT_LEADS_SHEET_NAME } from "../services/studentLeadService.js";

function callUrl(phone) {
  const normalizedPhone = String(phone || "").trim().replace(/(?!^)\+|[^\d+]/g, "");
  return normalizedPhone ? `tel:${normalizedPhone}` : "";
}

function mailUrl(email) {
  const clean = String(email || "").trim();
  return clean ? `mailto:${clean}` : "";
}

export default function StudentLeadsPanel() {
  const [leads, setLeads] = useState([]);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

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

  useEffect(() => {
    loadLeads();
  }, []);

  const filteredLeads = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return leads;
    return leads.filter((lead) => [lead.name, lead.email, lead.number, lead.level]
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
            Reading only name, email, number and level from the published <strong>{STUDENT_LEADS_SHEET_NAME}</strong> sheet. Duplicate leads are hidden automatically.
          </p>
        </div>
        <button type="button" onClick={loadLeads} disabled={loading}>{loading ? "Refreshing…" : "Refresh leads"}</button>
      </div>

      <div style={{ padding: 12, border: "1px solid #bfdbfe", borderRadius: 10, background: "#eff6ff", color: "#1e3a8a" }}>
        Source: <a href={STUDENT_LEADS_PUBLISHED_URL} target="_blank" rel="noreferrer">published Google Sheet</a> · Sheet tab: <strong>{STUDENT_LEADS_SHEET_NAME}</strong>
      </div>

      <label style={{ display: "grid", gap: 6, maxWidth: 460 }}>
        <span style={{ fontWeight: 700 }}>Search leads</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name, email, number, or level..."
          style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #ccd4e2" }}
        />
      </label>

      {loading ? <p>Loading student leads…</p> : null}
      {error ? <p style={{ color: "#a00000" }}>❌ {error}</p> : null}

      {!loading && !error ? (
        <>
          <p style={{ margin: 0 }}>
            Showing <strong>{filteredLeads.length}</strong> lead(s). Hidden duplicates: <strong>{duplicateCount}</strong>. Raw rows checked: <strong>{totalRows}</strong>.
          </p>

          {filteredLeads.length === 0 ? <p>No leads found.</p> : null}

          {filteredLeads.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th style={{ textAlign: "left", padding: 10 }}>Name</th>
                    <th style={{ textAlign: "left", padding: 10 }}>Email</th>
                    <th style={{ textAlign: "left", padding: 10 }}>Number</th>
                    <th style={{ textAlign: "left", padding: 10 }}>Level</th>
                    <th style={{ textAlign: "left", padding: 10 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead, index) => {
                    const phoneLink = callUrl(lead.number);
                    const emailLink = mailUrl(lead.email);
                    return (
                      <tr key={`${lead.id}-${index}`} style={{ borderTop: "1px solid #e5e7eb" }}>
                        <td style={{ padding: 10, fontWeight: 700 }}>{lead.name || "—"}</td>
                        <td style={{ padding: 10 }}>{lead.email || "—"}</td>
                        <td style={{ padding: 10 }}>{lead.number || "—"}</td>
                        <td style={{ padding: 10 }}>{lead.level || "—"}</td>
                        <td style={{ padding: 10 }}>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {phoneLink ? <a href={phoneLink}>Call</a> : null}
                            {emailLink ? <a href={emailLink}>Email</a> : null}
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

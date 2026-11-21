import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { auth } from "../firebase.js";
import { organisationEnrolmentRequest } from "../utils/organisationEnrolmentRequest.js";
import "./OrganisationDirectory.css";

const request = () => organisationEnrolmentRequest("admin/organisations", undefined, {
  staff: true, getToken: () => auth.currentUser?.getIdToken(),
});
const clean = value => String(value || "").trim().toLowerCase();

export default function OrganisationDirectory() {
  const [organisations, setOrganisations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [truncated, setTruncated] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await request();
      setOrganisations(data.organisations || []);
      setTruncated(Boolean(data.truncated));
      setLoaded(true);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  const visible = useMemo(() => organisations.filter(org => {
    const haystack = [org.name, org.contactName, org.contactEmail, org.phone].map(clean).join(" ");
    if (clean(search) && !haystack.includes(clean(search))) return false;
    if (filter === "agreement") return !org.agreementSignedAt;
    if (filter === "students") return org.studentCount > 0;
    if (filter === "prepared") return org.accountPrepared && !org.accountDisabled;
    return true;
  }), [organisations, search, filter]);
  const counts = useMemo(() => ({
    students: organisations.reduce((sum, row) => sum + (row.studentCount || 0), 0),
    approved: organisations.reduce((sum, row) => sum + (row.approvedCount || 0), 0),
    agreementMissing: organisations.filter(row => !row.agreementSignedAt).length,
  }), [organisations]);

  return <section className="partner-directory" aria-label="Partner directory">
    <div className="partner-directory-header">
      <div><h2>Partner organisations</h2>
        <p>Select a partner to open their own profile, student list, outstanding fees and communication tools.</p>
      </div>
      <button type="button" disabled={loading} onClick={load}>{loading ? "Refreshing…" : "Refresh partners"}</button>
    </div>
    <div className="partner-metrics">
      <div><span>Organisations</span><strong>{organisations.length}</strong></div>
      <div><span>Submitted students</span><strong>{counts.students}</strong></div>
      <div><span>Approved students</span><strong>{counts.approved}</strong></div>
      <div><span>Agreements to verify</span><strong>{counts.agreementMissing}</strong></div>
    </div>
    {truncated && <p role="status">Directory totals may be incomplete because the source lists are capped at 100 records each.</p>}
    {error && <p role="alert">{error}</p>}
    <div className="partner-directory-filters">
      <label>Find organisation or contact <input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Partner name, email or phone" /></label>
      <label>Show <select value={filter} onChange={event => setFilter(event.target.value)}>
        <option value="all">All partners</option>
        <option value="students">With students</option>
        <option value="agreement">Agreement not linked</option>
        <option value="prepared">Account prepared</option>
      </select></label>
    </div>
    {loaded && !organisations.length && <p>No partner organisations found.</p>}
    {loaded && organisations.length > 0 && visible.length === 0 && <p>No partners match the search.</p>}
    <div className="partner-entries">
      {visible.map(org => <article className="partner-entry" key={org.id}>
        <div className="partner-entry-heading">
          <div><h3>{org.name || "Organisation awaiting verification"}</h3>
            <p>{org.contactName || "Contact not set"} · {org.contactEmail}</p>
            <div className="partner-status">
              <span>{org.accountDisabled ? "Account disabled" : org.accountPrepared ? "Account prepared" : "Account not prepared"}</span>
              <span>{org.agreementSignedAt ? "Agreement: " + org.agreementStatus : "Agreement not linked"}</span>
              <span>{org.approvedCount || 0} approved / {org.studentCount || 0} submitted</span>
            </div>
          </div>
          <Link className="partner-profile-link" to={"/partners/" + encodeURIComponent(org.id)} aria-label={"Open full partner profile for " + org.name}>View partner profile</Link>
        </div>
        {org.possibleDuplicate && <p role="alert">Possible duplicate company name. Verify contacts before granting access.</p>}
      </article>)}
    </div>
  </section>;
}

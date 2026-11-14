import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { listAllStudents } from "../services/studentsService.js";

const LANGUAGES = ["german", "swahili"];
const normalizeError = (err) => err?.message || "Unable to complete the request.";

export default function StaffWorkspacePage() {
  const { user, role } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [permissions, setPermissions] = useState(["german"]);
  const [staffRole, setStaffRole] = useState("teacher");
  const [staff, setStaff] = useState([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [existingAccounts, setExistingAccounts] = useState([]);
  const [accountsLoaded, setAccountsLoaded] = useState(false);
  const [accountsBusy, setAccountsBusy] = useState(false);
  const [accountsError, setAccountsError] = useState("");
  const [staffSearch, setStaffSearch] = useState("");
  const [error, setError] = useState("");

  const request = useCallback(async (method, payload) => {
    const token = await user.getIdToken();
    const response = await fetch("/api/staff-management", {
      method,
      headers: { Authorization: `Bearer ${token}`, ...(payload ? { "Content-Type": "application/json" } : {}) },
      ...(payload ? { body: JSON.stringify(payload) } : {}),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) throw new Error(data.error || "Staff management is unavailable.");
    return data;
  }, [user]);

  const refresh = useCallback(async () => {
    try {
      const result = await request("GET");
      setStaff(result.staff || []);
      setError("");
    } catch (err) { setError(normalizeError(err)); }
  }, [request]);

  useEffect(() => { if (role === "admin") refresh(); }, [role, refresh]);

  const loadExistingAccounts = async () => {
    setAccountsBusy(true); setAccountsError("");
    try {
      // Admin's registered student directory; not an exhaustive Firebase Auth export.
      const rows = await listAllStudents();
      const seen = new Set();
      setExistingAccounts(rows.map(row => ({
        name: String(row.name || row.fullName || row.studentName || "").trim(),
        email: String(row.email || row.emailAddress || "").trim().toLowerCase(),
      })).filter(row => {
        if (!row.email || seen.has(row.email)) return false;
        seen.add(row.email);
        return true;
      }).sort((a, b) => a.name.localeCompare(b.name)));
      setAccountsLoaded(true);
    } catch (err) { setAccountsError(normalizeError(err)); }
    finally { setAccountsBusy(false); }
  };
  const matches = search.trim().length < 2 ? [] : existingAccounts.filter(row =>
    (row.name + " " + row.email).toLowerCase().includes(search.trim().toLowerCase())).slice(0, 25);

  const toggle = (language) => setPermissions((old) =>
    old.includes(language) ? old.filter((item) => item !== language) : [...old, language]);

  const save = async (event) => {
    event.preventDefault();
    if (!permissions.length || !email.trim()) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const result = await request("POST", {
        action: "upsert", email: email.trim().toLowerCase(), name: name.trim(),
        staffRole, languages: permissions,
      });
      setNotice(result.existing
        ? "Existing Falowen account granted access. Their password was not changed."
        : "New staff account created. A password setup email was requested.");
      setName(""); setEmail("");
      await refresh();
    } catch (err) { setError(normalizeError(err)); }
    finally { setBusy(false); }
  };

  const deactivate = async (member) => {
    if (!window.confirm(`Remove teaching access for ${member.email}? Their Falowen account and learning data will remain.`)) return;
    setBusy(true); setError(""); setNotice("");
    try {
      await request("POST", { action: "revoke", uid: member.uid });
      setNotice(`Teaching access removed for ${member.email}.`);
      await refresh();
    } catch (err) { setError(normalizeError(err)); }
    finally { setBusy(false); }
  };

  if (role !== "admin") return <section><h1>Staff Workspace</h1><p>Only administrators can manage staff accounts.</p></section>;

  return <section style={{ maxWidth: 920, margin: "0 auto", padding: "1rem" }}>
    <header><h1>Staff Workspace</h1><p>Manage teaching staff for German and Swahili. Existing Falowen accounts keep their password and student history.</p></header>
    {error && <p role="alert" style={{ color: "#b42318" }}>{error}</p>}
    {notice && <p role="status" style={{ color: "#067647" }}>{notice}</p>}
    <div style={{ display: "grid", gap: 24, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))" }}>
      <form onSubmit={save} style={{ border: "1px solid #d5dbe5", borderRadius: 12, padding: 20, display: "grid", gap: 12, alignContent: "start" }}>
        <h2>Add or update staff</h2>
        <div style={{ border: "1px solid #e0e5eb", padding: 12, borderRadius: 8, display: "grid", gap: 8 }}>
          <strong>Select an existing Falowen student account</strong>
          <button type="button" onClick={loadExistingAccounts} disabled={accountsBusy}>
            {accountsBusy ? "Loading accounts…" : accountsLoaded ? "Reload student accounts" : "Load existing student accounts"}
          </button>
          <small>Search registered student records by name or email. Not every Firebase login is necessarily listed here.</small>
          <input aria-label="Search existing student accounts" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search name or email" />
          {accountsError && <p role="alert">{accountsError}</p>}
          {accountsLoaded && <small>{existingAccounts.length} student records with an email available</small>}
          {matches.map(account => <button type="button" key={account.email}
            onClick={() => { setName(account.name); setEmail(account.email); setSearch(""); }}
            style={{ textAlign: "left", padding: 9, overflowWrap: "anywhere" }}>
            {account.name || "Unnamed student"} — {account.email}
          </button>)}
          {accountsLoaded && search.trim().length >= 2 && matches.length === 0 && <small>No matching student record. You can still enter the staff email manually.</small>}
        </div>
        <label>Full name <input style={{ display: "block", width: "100%" }} value={name} onChange={e => setName(e.target.value)} maxLength={100} autoComplete="name" /></label>
        <label>Email address <input style={{ display: "block", width: "100%" }} value={email} onChange={e => setEmail(e.target.value)} type="email" required autoComplete="email" /></label>
        <label>Role <select style={{ display: "block", width: "100%" }} value={staffRole} onChange={e => setStaffRole(e.target.value)}><option value="teacher">Teacher — marking and slides</option><option value="reviewer">Reviewer — marking only</option></select></label>
        <fieldset><legend>Language access</legend>{LANGUAGES.map(lang => <label key={lang} style={{ display: "block", margin: "8px 0" }}><input type="checkbox" checked={permissions.includes(lang)} onChange={() => toggle(lang)} /> {lang === "german" ? "German" : "Swahili"}</label>)}</fieldset>
        <button type="submit" disabled={busy || !permissions.length}>{busy ? "Saving…" : "Save staff access"}</button>
        <small>New accounts receive a password-setup email. Existing users are not asked to reset their password.</small>
      </form>
      <div style={{ border: "1px solid #d5dbe5", borderRadius: 12, padding: 20, minWidth: 0 }}>
        <h2>Current staff</h2>
        <input aria-label="Search current staff" value={staffSearch} onChange={event => setStaffSearch(event.target.value)} placeholder="Search staff name or email" />
        <button type="button" onClick={refresh} disabled={busy}>Refresh list</button>
        {!staff.length && <p>No managed staff accounts found.</p>}
        {staff.filter(member => (member.name + " " + member.email).toLowerCase().includes(staffSearch.toLowerCase())).map(member => <article key={member.uid} style={{ borderBottom: "1px solid #e2e8f0", padding: "12px 0", overflowWrap: "anywhere" }}>
          <strong>{member.name || member.email}</strong><div>{member.email}</div>
          <small>{member.staffRole || "teacher"} · {(member.languages || []).join(", ") || "No languages"} · {member.active ? "Active" : "Inactive"}</small>
          {member.active && <div><button type="button" disabled={busy} onClick={() => deactivate(member)}>Remove teaching access</button></div>}
        </article>)}
      </div>
    </div>
  </section>;
}

import { STAFF_PAGES, staffPageIds } from "../utils/staffPageAccess.js";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const LANGUAGES = ["german", "swahili"];
const normalizeError = (err) => err?.message || "Unable to complete the request.";

export default function StaffWorkspacePage() {
  const { user, role } = useAuth();
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [permissions, setPermissions] = useState(["german"]);
  const [pages, setPages] = useState([]);
  const [staff, setStaff] = useState([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
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

  const toggle = (language) => setPermissions((old) =>
    old.includes(language) ? old.filter((item) => item !== language) : [...old, language]);

  const togglePage = (page) => setPages(current =>
    current.includes(page) ? current.filter(id => id !== page) : [...current, page]);

  function editAccess(member) {
    setSelectedAccount(member);
    setEmail(member.email);
    setName(member.name || "");
    setPermissions(member.languages?.length ? member.languages : ["german"]);
    setPages(staffPageIds(member.pages, member.staffRole));
    setError("");
    setNotice(`Editing access for ${member.name || member.email}.`);
  }

  const search = async () => {
    setBusy(true); setError(""); setNotice(""); setSelectedAccount(null);
    try {
      const { account } = await request("POST", { action: "search", email });
      if (!account) {
        setNotice("No Falowen account found with this email.");
        return;
      }
      const member = staff.find(item => item.uid === account.uid && item.active);
      setSelectedAccount(account);
      setEmail(account.email);
      setName(member?.name || account.name);
      setPages(member ? staffPageIds(member.pages, member.staffRole) : []);
      setPermissions(member?.languages?.length ? member.languages : ["german"]);
      setNotice("Existing Falowen account found. Choose staff access and save.");
    } catch (err) { setError(normalizeError(err)); }
    finally { setBusy(false); }
  };

  const welcome = async (member) => {
    setBusy(true); setError(""); setNotice("");
    try {
      const result = await request("POST", { action: "welcome", uid: member.uid });
      setNotice(result.duplicate
        ? `A welcome email was already queued for ${member.email}.`
        : `Welcome email queued for ${member.email}.`);
    } catch (err) { setError(normalizeError(err)); }
    finally { setBusy(false); }
  };

  const save = async (event) => {
    event.preventDefault();
    if (!permissions.length || !pages.length || !email.trim()) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const result = await request("POST", {
        action: "upsert", email: email.trim().toLowerCase(), name: name.trim(),
        pages, languages: permissions, existingUid: selectedAccount?.uid,
      });
      setNotice(result.existing
        ? "Staff access saved. Ask the staff member to sign in again to refresh their permissions."
        : "New staff account created. A password setup email was requested.");
      setName(""); setEmail(""); setSelectedAccount(null); setPages([]);
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
    <header><h1>Staff Workspace</h1><p>Manage staff access to German and Swahili resources. You can grant Leads access for viewing enquiries and recording follow-ups without giving staff full administrator permissions. Existing accounts keep their password and student history.</p></header>
    {error && <p role="alert" style={{ color: "#b42318" }}>{error}</p>}
    {notice && <p role="status" style={{ color: "#067647" }}>{notice}</p>}
    <div style={{ display: "grid", gap: 24, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))" }}>
      <form onSubmit={save} style={{ border: "1px solid #d5dbe5", borderRadius: 12, padding: 20, display: "grid", gap: 12, alignContent: "start" }}>
        <h2>Add or update staff</h2>
        <label>Full name <input style={{ display: "block", width: "100%" }} value={name} onChange={e => setName(e.target.value)} maxLength={100} autoComplete="name" /></label>
        <label>Email address <input style={{ display: "block", width: "100%" }} value={email} disabled={busy} onChange={e => { setEmail(e.target.value); setSelectedAccount(null); }} type="email" required autoComplete="email" /></label>
        <button type="button" onClick={search} disabled={busy || !email.trim()}>Search Falowen account</button>
        <fieldset disabled={busy}>
          <legend>Page access</legend>
          {STAFF_PAGES.map(page => <label key={page.id} style={{ display: "block", margin: "8px 0" }}>
            <input type="checkbox" checked={pages.includes(page.id)} onChange={() => togglePage(page.id)} /> {page.label}
            {page.id === "leads" && <small style={{ display: "block", marginLeft: 24 }}>View online leads and assigned or unassigned personal contacts; record calls and follow-ups. Only administrators add and edit contact details.</small>}
            {page.id === "music-studio" && <small style={{ display: "block", marginLeft: 24 }}>Includes Music Generator, Lyrics Video Studio and export for assigned languages only.</small>}
            {page.id === "music-analytics" && <small style={{ display: "block", marginLeft: 24 }}>Includes identifiable student music practice activity (names and email addresses).</small>}
          </label>)}
          <small>Students is read-only. Results allows score and feedback edits. Both use the selected languages. Attendance shows assigned classes.</small>
        </fieldset>
        <fieldset><legend>Language access</legend>{LANGUAGES.map(lang => <label key={lang} style={{ display: "block", margin: "8px 0" }}><input type="checkbox" checked={permissions.includes(lang)} onChange={() => toggle(lang)} /> {lang === "german" ? "German" : "Swahili"}</label>)}</fieldset>
        <button type="submit" disabled={busy || !permissions.length || !pages.length}>{busy ? "Saving…" : "Save staff access"}</button>
        <small>New accounts receive a password-setup email. Existing users are not asked to reset their password.</small>
      </form>
      <div style={{ border: "1px solid #d5dbe5", borderRadius: 12, padding: 20, minWidth: 0 }}>
        <h2>Current staff</h2>
        <button type="button" onClick={refresh} disabled={busy}>Refresh list</button>
        {!staff.length && <p>No managed staff accounts found.</p>}
        {staff.map(member => <article key={member.uid} style={{ borderBottom: "1px solid #e2e8f0", padding: "12px 0", overflowWrap: "anywhere" }}>
          <strong>{member.name || member.email}</strong><div>{member.email}</div>
          <small>{STAFF_PAGES.filter(page => member.pages?.includes(page.id)).map(page => page.label).join(", ") || "No pages"} · {(member.languages || []).join(", ") || "No languages"} · {member.active ? "Active" : "Inactive"}</small>
          {member.active && <div><button type="button" disabled={busy} onClick={() => editAccess(member)}>Edit access</button>{" "}<button type="button" disabled={busy} onClick={() => welcome(member)}>Send welcome email</button> <button type="button" disabled={busy} onClick={() => deactivate(member)}>Remove teaching access</button></div>}
        </article>)}
      </div>
    </div>
  </section>;
}

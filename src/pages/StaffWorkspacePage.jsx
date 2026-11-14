import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { STAFF_LANGUAGES, STAFF_CAPABILITIES, STAFF_CAPABILITY_LABELS, normalizeStaffAccess } from "../utils/staffAccess.js";

const normalizeError = (error) => error?.message || "Unable to complete the request.";
const blankAssignments = () => ({ german: [], swahili: [] });

export default function StaffWorkspacePage() {
  const { user, role } = useAuth();
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [languages, setLanguages] = useState(["german"]);
  const [access, setAccess] = useState(() => normalizeStaffAccess(null, ["german"]));
  const [assignedClasses, setAssignedClasses] = useState(blankAssignments);
  const [staffRole, setStaffRole] = useState("teacher");
  const [staff, setStaff] = useState([]);
  const [classes, setClasses] = useState([]);
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
      setClasses(result.classes || []);
      setError("");
    } catch (cause) { setError(normalizeError(cause)); }
  }, [request]);

  useEffect(() => { if (role === "admin") refresh(); }, [role, refresh]);

  const toggleLanguage = (language) => {
    setLanguages(previous => previous.includes(language)
      ? previous.filter(item => item !== language)
      : [...previous, language]);
  };
  const togglePermission = (language, capability) => {
    setAccess(previous => {
      const next = { ...previous, [language]: { ...previous[language], [capability]: !previous[language]?.[capability] } };
      if (capability === "music" && !next[language].music) next[language].publishMusic = false;
      if (capability === "social" && !next[language].social) next[language].publishSocial = false;
      return next;
    });
  };
  const toggleClass = (language, id) => {
    setAssignedClasses(previous => {
      const current = previous[language] || [];
      return { ...previous, [language]: current.includes(id) ? current.filter(item => item !== id) : [...current, id] };
    });
  };
  const loadMember = (member) => {
    setSelectedAccount({ uid: member.uid, email: member.email });
    setName(member.name || "");
    setEmail(member.email);
    setStaffRole(member.staffRole || "teacher");
    setLanguages(member.languages?.length ? member.languages : ["german"]);
    setAccess(normalizeStaffAccess(member.access, member.languages || [], member.staffRole));
    setAssignedClasses(member.assignedClasses || blankAssignments());
    setError(""); setNotice(`Editing access for ${member.email}. Save to apply the updated permissions.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const search = async () => {
    setBusy(true); setError(""); setNotice(""); setSelectedAccount(null);
    try {
      const { account } = await request("POST", { action: "search", email });
      if (!account) { setNotice("No Falowen account found with this email."); return; }
      const member = staff.find(item => item.uid === account.uid && item.active);
      if (member) { loadMember(member); return; }
      setSelectedAccount(account);
      setName(account.name || "");
      setLanguages(["german"]);
      setAccess(normalizeStaffAccess(null, ["german"], "teacher"));
      setAssignedClasses(blankAssignments());
      setNotice("Existing Falowen account found. Choose staff access and save. Their password will not change.");
    } catch (cause) { setError(normalizeError(cause)); }
    finally { setBusy(false); }
  };
  const welcome = async (member) => {
    setBusy(true); setError(""); setNotice("");
    try {
      const result = await request("POST", { action: "welcome", uid: member.uid });
      setNotice(result.duplicate ? `A welcome email was already queued for ${member.email}.` : `Welcome email queued for ${member.email}.`);
    } catch (cause) { setError(normalizeError(cause)); }
    finally { setBusy(false); }
  };
  const save = async (event) => {
    event.preventDefault();
    if (!languages.length || !email.trim()) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const result = await request("POST", {
        action: "upsert", email: email.trim().toLowerCase(), name: name.trim(),
        staffRole, languages, access: normalizeStaffAccess(access, languages, staffRole),
        assignedClasses, existingUid: selectedAccount?.uid,
      });
      setNotice(result.existing
        ? "Staff access updated. The user should sign out and sign in to refresh permissions."
        : "New staff account created. A password setup email was requested.");
      setName(""); setEmail(""); setSelectedAccount(null);
      setLanguages(["german"]); setAccess(normalizeStaffAccess(null, ["german"]));
      setAssignedClasses(blankAssignments());
      await refresh();
    } catch (cause) { setError(normalizeError(cause)); }
    finally { setBusy(false); }
  };
  const deactivate = async (member) => {
    if (!window.confirm(`Remove teaching access for ${member.email}? Their Falowen account and learning data will remain.`)) return;
    setBusy(true); setError(""); setNotice("");
    try {
      await request("POST", { action: "revoke", uid: member.uid });
      setNotice(`Teaching access removed for ${member.email}.`);
      await refresh();
    } catch (cause) { setError(normalizeError(cause)); }
    finally { setBusy(false); }
  };

  if (role !== "admin") return <section><h1>Staff Workspace</h1><p>Only administrators can manage staff accounts.</p></section>;
  return <section style={{ maxWidth: 1100, margin: "0 auto", padding: "1rem" }}>
    <header><h1>Staff Workspace</h1><p>Assign independent German and Swahili page permissions. Staff use their existing Falowen login; their student enrollment stays separate.</p></header>
    {error && <p role="alert" style={{ color: "#b42318" }}>{error}</p>}
    {notice && <p role="status" style={{ color: "#067647" }}>{notice}</p>}
    <div style={{ display: "grid", gap: 24, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))" }}>
      <form onSubmit={save} style={{ border: "1px solid #d5dbe5", borderRadius: 12, padding: 20, display: "grid", gap: 12, alignContent: "start" }}>
        <h2>{selectedAccount ? "Edit staff access" : "Add or update staff"}</h2>
        <label>Full name <input style={{ display: "block", width: "100%" }} value={name} onChange={event => setName(event.target.value)} maxLength={100} autoComplete="name" /></label>
        <label>Email address <input style={{ display: "block", width: "100%" }} value={email} disabled={busy || Boolean(selectedAccount)} onChange={event => { setEmail(event.target.value); setSelectedAccount(null); }} type="email" required autoComplete="email" /></label>
        {!selectedAccount && <button type="button" onClick={search} disabled={busy || !email.trim()}>Search Falowen account</button>}
        <label>Role <select style={{ display: "block", width: "100%" }} value={staffRole} onChange={event => setStaffRole(event.target.value)}><option value="teacher">Teacher</option><option value="reviewer">Reviewer</option></select></label>
        <fieldset><legend>Languages</legend>{STAFF_LANGUAGES.map(lang => <label key={lang} style={{ display: "block", margin: "8px 0" }}><input type="checkbox" checked={languages.includes(lang)} onChange={() => toggleLanguage(lang)} /> {lang === "german" ? "German" : "Swahili"}</label>)}</fieldset>
        {STAFF_LANGUAGES.filter(lang => languages.includes(lang)).map(lang => <fieldset key={lang}>
          <legend>{lang === "swahili" ? "Swahili" : "German"} page access</legend>
          {STAFF_CAPABILITIES.map(capability => {
            const parent = capability === "publishMusic" ? "music" : capability === "publishSocial" ? "social" : null;
            return <label key={capability} style={{ display: "block", margin: "8px 0", paddingLeft: parent ? 18 : 0 }}>
              <input type="checkbox" checked={Boolean(access[lang]?.[capability])} disabled={busy || (parent && !access[lang]?.[parent])} onChange={() => togglePermission(lang, capability)} />
              {" "}{STAFF_CAPABILITY_LABELS[capability]}
            </label>;
          })}
          {access[lang]?.attendance && <div style={{ marginTop: 12 }}>
            <strong>Assigned {lang === "swahili" ? "Swahili" : "German"} classes</strong>
            {classes.filter(item => item.language === lang).length
              ? classes.filter(item => item.language === lang).map(klass =>
                <label key={klass.id} style={{ display: "block", margin: "7px 0" }}>
                  <input type="checkbox" checked={(assignedClasses[lang] || []).includes(klass.id)} onChange={() => toggleClass(lang, klass.id)} /> {klass.name}
                </label>)
              : <p><small>No {lang} live classes tagged in Admin yet. Create or label a class first; no class rosters will be exposed until assignment.</small></p>}
          </div>}
        </fieldset>)}
        <button type="submit" disabled={busy || !languages.length}>{busy ? "Saving…" : "Save staff access"}</button>
        {selectedAccount && <button type="button" disabled={busy} onClick={() => { setSelectedAccount(null); setEmail(""); setName(""); }}>Cancel editing</button>}
        <small>Page access does not include publishing unless its separate checkbox is enabled. Staff permissions refresh on their next sign-in.</small>
      </form>
      <div style={{ border: "1px solid #d5dbe5", borderRadius: 12, padding: 20, minWidth: 0 }}>
        <h2>Current staff</h2>
        <button type="button" onClick={refresh} disabled={busy}>Refresh list</button>
        {!staff.length && <p>No managed staff accounts found.</p>}
        {staff.map(member => <article key={member.uid} style={{ borderBottom: "1px solid #e2e8f0", padding: "12px 0", overflowWrap: "anywhere" }}>
          <strong>{member.name || member.email}</strong><div>{member.email}</div>
          <small>{member.staffRole || "teacher"} · {(member.languages || []).join(", ") || "No languages"} · {member.active ? "Active" : "Inactive"}</small>
          {member.active && <div style={{ marginTop: 8 }}>
            <button type="button" disabled={busy} onClick={() => loadMember(member)}>Edit access</button>{" "}
            <button type="button" disabled={busy} onClick={() => welcome(member)}>Send welcome email</button>{" "}
            <button type="button" disabled={busy} onClick={() => deactivate(member)}>Remove teaching access</button>
          </div>}
        </article>)}
      </div>
    </div>
  </section>;
}

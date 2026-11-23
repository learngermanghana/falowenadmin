import { useCallback, useEffect, useMemo, useState } from "react";
import { addDoc, collection, doc, getDocs, increment, limit, orderBy, query, serverTimestamp, updateDoc, where, writeBatch } from "firebase/firestore";
import { db } from "../firebase.js";
import { useAuth } from "../context/AuthContext.jsx";
import { normalizeLeadPhone } from "../services/studentLeadService.js";
import "./PersonalLeadsPanel.css";

const CONTACTS = "falowenManualLeads";
const STATUSES = [
  ["new", "New"],
  ["contacted", "Contacted"],
  ["interested", "Interested"],
  ["follow_up", "Follow-up needed"],
  ["registered", "Registered"],
  ["not_interested", "Not interested"],
  ["done", "Done"],
];
const CLOSED_STATUSES = ["registered", "not_interested", "done"];
const DELETABLE_STATUSES = ["not_interested", "done"];
const SOURCES = ["Phone call", "WhatsApp", "Walk-in", "Referral", "Other"];
const LEVELS = ["", "A1", "A2", "B1", "B2", "C1", "C2"];
const INITIAL = { name: "", phone: "", location: "", email: "", language: "german", level: "", source: "Phone call", notes: "", assignedToUid: "", assignedToName: "", nextFollowUpAt: "", status: "new" };
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Accra" });
const trimmed = (v) => String(v || "").trim();
const errText = (e) => e?.message || "Could not save changes. Try again.";
function dateText(value) {
  if (!value) return "—";
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return trimmed(value) || "—";
  return new Intl.DateTimeFormat("en-GH", { dateStyle: "medium", timeZone: "Africa/Accra" }).format(date);
}
function badgeStatus(value) {
  return STATUSES.find(([key]) => key === value)?.[1] || "New";
}
function safeTel(value) {
  return trimmed(value).replace(/[^+\d]/g, "");
}
function whatsappLink(value) {
  const number = normalizeLeadPhone(value);
  return number ? "https://wa.me/" + number : "";
}
function blankForm() { return { ...INITIAL }; }

export default function PersonalLeadsPanel() {
  const { user, role, staffLanguages } = useAuth();
  const owner = role === "admin";
  const [contacts, setContacts] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState("");
  const [form, setForm] = useState(blankForm);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("active");
  const [assignment, setAssignment] = useState("all");
  const [followId, setFollowId] = useState("");
  const [followForm, setFollowForm] = useState({ channel: "call", status: "contacted", note: "", nextFollowUpAt: "" });
  const [historyId, setHistoryId] = useState("");
  const [activities, setActivities] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      if (!owner && (!Array.isArray(staffLanguages) || !staffLanguages.length)) {
        throw new Error("No course language is assigned to your staff account.");
      }
      const contactsQuery = owner
        ? query(collection(db, CONTACTS), orderBy("createdAt", "desc"), limit(250))
        : query(collection(db, CONTACTS), where("language", "in", staffLanguages), limit(250));
      const snap = await getDocs(contactsQuery);
      setContacts(snap.docs.map((entry) => ({ id: entry.id, ...entry.data() })).sort(
        (a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)
      ));
      setError("");
    } catch (err) {
      setError("Personal contacts could not be loaded. " + errText(err));
    } finally { setLoading(false); }
  }, [owner, staffLanguages]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    if (!owner || !user) return;
    let active = true;
    user.getIdToken().then((token) => fetch("/api/staff-management", {
      headers: { Authorization: "Bearer " + token },
    })).then(async (response) => response.ok ? response.json() : null)
      .then((data) => {
        if (active && data?.ok) setStaff((data.staff || []).filter((item) => item.active && item.pages?.includes("leads")));
      }).catch(() => { /* Contact collection still works when the staff directory is unavailable. */ });
    return () => { active = false; };
  }, [owner, user]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return contacts.filter((c) => {
      if (filter === "active" && CLOSED_STATUSES.includes(c.status)) return false;
      if (filter === "closed" && !CLOSED_STATUSES.includes(c.status)) return false;
      if (!["all", "active", "closed"].includes(filter) && c.status !== filter) return false;
      if (assignment === "mine" && c.assignedToUid !== user?.uid) return false;
      if (assignment === "unassigned" && c.assignedToUid) return false;
      return !needle || [c.name, c.phone, c.location, c.email, c.language, c.level, c.source, c.assignedToName]
        .some((value) => trimmed(value).toLowerCase().includes(needle));
    });
  }, [contacts, search, filter, assignment, user]);

  const due = contacts.filter((c) => c.nextFollowUpAt && c.nextFollowUpAt <= today()
    && !CLOSED_STATUSES.includes(c.status)).length;
  const registered = contacts.filter((c) => c.status === "registered").length;

  function openAdd() {
    setEditing(""); setForm(blankForm()); setError(""); setNotice(""); setFormVisible(true);
  }
  function openEdit(contact) {
    setEditing(contact.id);
    setForm(Object.keys(INITIAL).reduce((acc, key) => ({ ...acc, [key]: contact[key] ?? INITIAL[key] }), {}));
    setError(""); setNotice(""); setFormVisible(true);
  }
  function change(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }
  async function save(event) {
    event.preventDefault();
    const name = trimmed(form.name), phone = trimmed(form.phone), location = trimmed(form.location);
    if (!name || !phone || !location || normalizeLeadPhone(phone).length < 9) {
      setError("Name, valid phone number and location are required.");
      return;
    }
    const phoneKey = normalizeLeadPhone(phone);
    if (contacts.some((c) => c.id !== editing && normalizeLeadPhone(c.phone) === phoneKey)) {
      setError("This phone number is already saved. Update the existing contact instead.");
      return;
    }
    if (!owner) { setError("Only an administrator can add or edit contact details."); return; }
    setBusy(true); setError(""); setNotice("");
    const assigned = staff.find((member) => member.uid === form.assignedToUid && member.languages?.includes(form.language));
    const previous = contacts.find((item) => item.id === editing);
    const preservedName = previous?.assignedToUid === form.assignedToUid && previous?.language === form.language ? previous.assignedToName : "";
    const payload = {
      name: name.slice(0, 120), phone: phone.slice(0, 24), location: location.slice(0, 120),
      email: trimmed(form.email).toLowerCase().slice(0, 254),
      language: form.language, level: form.level, source: form.source,
      notes: trimmed(form.notes).slice(0, 2000), status: form.status,
      assignedToUid: assigned?.uid || (preservedName ? form.assignedToUid : ""), assignedToName: assigned?.name || assigned?.email || preservedName || "",
      nextFollowUpAt: form.nextFollowUpAt || "", updatedAt: serverTimestamp(),
    };
    try {
      if (editing) {
        await updateDoc(doc(db, CONTACTS, editing), payload);
        setNotice("Contact updated.");
      } else {
        await addDoc(collection(db, CONTACTS), {
          ...payload, createdBy: user.uid, createdAt: serverTimestamp(),
          lastFollowUpAt: null, lastContactNote: "", followUpCount: 0,
        });
        setNotice("Contact added to Personal Contacts.");
      }
      setFormVisible(false); setEditing(""); await refresh();
    } catch (err) { setError(errText(err)); }
    finally { setBusy(false); }
  }
  function openFollow(contact) {
    setFollowId(contact.id);
    setFollowForm({ channel: "call", status: contact.status === "registered" ? "registered" : "contacted",
      note: "", nextFollowUpAt: contact.nextFollowUpAt || "" });
    setHistoryId(""); setNotice(""); setError("");
  }
  async function saveFollow(event) {
    event.preventDefault();
    const note = trimmed(followForm.note);
    if (!note) { setError("Describe the call or follow-up before saving."); return; }
    const contact = contacts.find((c) => c.id === followId);
    if (!contact) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const ref = doc(db, CONTACTS, contact.id);
      const batch = writeBatch(db);
      batch.update(ref, {
        status: followForm.status, nextFollowUpAt: CLOSED_STATUSES.includes(followForm.status) ? "" : followForm.nextFollowUpAt || "",
        lastFollowUpAt: serverTimestamp(), lastContactNote: note.slice(0, 1000),
        followUpCount: increment(1), updatedAt: serverTimestamp(),
      });
      batch.set(doc(collection(ref, "activities")), {
        channel: followForm.channel, status: followForm.status,
        note: note.slice(0, 1000), nextFollowUpAt: CLOSED_STATUSES.includes(followForm.status) ? "" : followForm.nextFollowUpAt || "",
        recordedByUid: user.uid, recordedByName: user.email || "Staff", createdAt: serverTimestamp(),
      });
      await batch.commit();
      setFollowId(""); setNotice("Follow-up recorded with history."); await refresh();
    } catch (err) { setError(errText(err)); }
    finally { setBusy(false); }
  }
  async function markDone(contact) {
    if (busy || deletingId || CLOSED_STATUSES.includes(contact.status)) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const ref = doc(db, CONTACTS, contact.id);
      const batch = writeBatch(db);
      batch.update(ref, {
        status: "done", nextFollowUpAt: "", updatedAt: serverTimestamp(),
        followUpCount: increment(1),
      });
      batch.set(doc(collection(ref, "activities")), {
        channel: "other", status: "done",
        note: "Marked as done. No further follow-up required.",
        nextFollowUpAt: "", recordedByUid: user.uid,
        recordedByName: user.email || "Staff", createdAt: serverTimestamp(),
      });
      await batch.commit();
      setFollowId(""); setHistoryId("");
      setNotice(contact.name + " marked as done. Follow-ups stopped; history retained.");
      await refresh();
    } catch (err) { setError(errText(err)); }
    finally { setBusy(false); }
  }

  async function deleteClosedContact(contact) {
    if (!owner || !DELETABLE_STATUSES.includes(contact.status) || busy || deletingId) return;
    const confirmed = window.confirm(
      'Permanently delete "' + contact.name + '" and all recorded follow-up history? This cannot be undone.'
    );
    if (!confirmed) return;
    setDeletingId(contact.id); setError(""); setNotice("");
    try {
      const ref = doc(db, CONTACTS, contact.id);
      // Delete contact and its history in one atomic batch; Firestore does not
      // automatically delete subcollections when the parent is removed.
      const histories = await getDocs(query(collection(ref, "activities"), limit(450)));
      if (histories.size >= 450) {
        throw new Error("This contact has too many history entries to delete safely in one operation.");
      }
      const batch = writeBatch(db);
      histories.docs.forEach((entry) => batch.delete(entry.ref));
      batch.delete(ref);
      await batch.commit();
      setFollowId(""); setHistoryId("");
      setContacts((current) => current.filter((item) => item.id !== contact.id));
      setNotice(contact.name + " and their follow-up history were deleted.");
    } catch (err) { setError("Contact was not deleted. " + errText(err)); }
    finally { setDeletingId(""); }
  }

  async function openHistory(contact) {
    if (historyId === contact.id) { setHistoryId(""); return; }
    setHistoryId(contact.id); setActivities([]); setHistoryLoading(true);
    try {
      const snap = await getDocs(query(collection(db, CONTACTS, contact.id, "activities"), orderBy("createdAt", "desc"), limit(30)));
      setActivities(snap.docs.map((item) => ({ id: item.id, ...item.data() })));
    } catch (err) { setError("Could not load follow-up history. " + errText(err)); }
    finally { setHistoryLoading(false); }
  }

  return <section className="personal-leads">
    <div className="personal-lead-stats">
      <div><span>Total personal contacts</span><strong>{contacts.length}</strong><small>Saved directly by the school</small></div>
      <div><span>Follow-ups due</span><strong>{due}</strong><small>Due today or overdue</small></div>
      <div><span>Registered</span><strong>{registered}</strong><small>Converted to students</small></div>
      <div><span>Unassigned</span><strong>{contacts.filter((c) => !c.assignedToUid).length}</strong><small>Not assigned to a staff member</small></div>
    </div>
    <div className="personal-lead-card">
      <header className="personal-lead-heading">
        <div><h2>Personal Contacts</h2><p>Contacts received by phone, WhatsApp, walk-in or referral. Record every follow-up here.</p></div>
        <div className="personal-lead-buttons">
          <button type="button" onClick={refresh} disabled={loading}>Refresh</button>
          {owner && <button type="button" className="personal-primary" onClick={openAdd}>+ Add contact</button>}
        </div>
      </header>
      {notice && <p role="status" className="personal-notice">{notice}</p>}
      {error && <p role="alert" className="personal-error">{error}</p>}
      {formVisible && owner && <form className="personal-lead-form" onSubmit={save}>
        <div className="personal-form-title"><h3>{editing ? "Edit contact" : "Add personal contact"}</h3><button type="button" onClick={() => setFormVisible(false)}>Close</button></div>
        <div className="personal-field-grid">
          <label>Full name *<input required maxLength={120} value={form.name} onChange={(e) => change("name", e.target.value)} /></label>
          <label>Phone / WhatsApp *<input required type="tel" maxLength={24} value={form.phone} onChange={(e) => change("phone", e.target.value)} placeholder="+233..." /></label>
          <label>Location *<input required maxLength={120} value={form.location} onChange={(e) => change("location", e.target.value)} placeholder="City or area" /></label>
          <label>Email (optional)<input type="email" maxLength={254} value={form.email} onChange={(e) => change("email", e.target.value)} /></label>
          <label>Course language<select value={form.language} onChange={(e) => setForm((current) => ({ ...current, language: e.target.value, assignedToUid: "", assignedToName: "" }))}><option value="german">German</option><option value="swahili">Swahili</option></select></label>
          <label>Level<select value={form.level} onChange={(e) => change("level", e.target.value)}>{LEVELS.map((x) => <option key={x} value={x}>{x || "Not decided"}</option>)}</select></label>
          <label>How did they contact us?<select value={form.source} onChange={(e) => change("source", e.target.value)}>{SOURCES.map((x) => <option key={x}>{x}</option>)}</select></label>
          <label>Status<select value={form.status} onChange={(e) => change("status", e.target.value)}>{STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label>Assigned staff<select value={form.assignedToUid} onChange={(e) => change("assignedToUid", e.target.value)}>
            <option value="">Unassigned</option>{staff.filter((member) => member.languages?.includes(form.language)).map((member) => <option value={member.uid} key={member.uid}>{member.name || member.email}</option>)}
          </select></label>
          <label>Next follow-up date<input type="date" value={form.nextFollowUpAt} onChange={(e) => change("nextFollowUpAt", e.target.value)} /></label>
        </div>
        <label>Notes<textarea rows={3} maxLength={2000} value={form.notes} onChange={(e) => change("notes", e.target.value)} placeholder="Course interest, questions, preferred call time..." /></label>
        <button type="submit" className="personal-primary" disabled={busy}>{busy ? "Saving..." : editing ? "Save contact" : "Add contact"}</button>
      </form>}
      <div className="personal-lead-filters">
        <input type="search" aria-label="Search personal contacts" placeholder="Search by name, phone or location..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select aria-label="Filter by status" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="active">Active contacts</option><option value="closed">Closed contacts</option><option value="all">All statuses</option>{STATUSES.map(([v, label]) => <option value={v} key={v}>{label}</option>)}
        </select>
        <select aria-label="Filter by assignment" value={assignment} onChange={(e) => setAssignment(e.target.value)}>
          <option value="all">All assignments</option><option value="mine">Assigned to me</option><option value="unassigned">Unassigned</option>
        </select>
      </div>
      {loading ? <p>Loading personal contacts...</p> : <p className="personal-lead-count">Showing {filtered.length} contact(s) · Latest 250 contacts loaded</p>}
      {!loading && !filtered.length && <div className="personal-empty">No contacts match these filters. {owner ? "Add the first personal contact above." : ""}</div>}
      <div className="personal-lead-list">
        {filtered.map((contact) => {
          const overdue = contact.nextFollowUpAt && contact.nextFollowUpAt <= today() && !CLOSED_STATUSES.includes(contact.status);
          return <article className="personal-lead-row" key={contact.id}>
            <div className="personal-lead-main">
              <div className="personal-lead-name">{contact.name} <span className={"personal-status status-" + contact.status}>{badgeStatus(contact.status)}</span></div>
              <div>{contact.phone} · {contact.location} · {contact.language === "swahili" ? "Swahili" : "German"} {contact.level || ""}</div>
              <div className="personal-lead-meta">{contact.source || "Phone call"} · Assigned: {contact.assignedToName || "Unassigned"} · Last contacted: {dateText(contact.lastFollowUpAt)}</div>
              {contact.notes && <div className="personal-lead-meta">Note: {contact.notes}</div>}
              <div className={"personal-lead-next" + (overdue ? " is-overdue" : "")}>Next follow-up: {contact.nextFollowUpAt ? dateText(contact.nextFollowUpAt) : "Not scheduled"} {overdue ? "· Due" : ""}</div>
            </div>
            <div className="personal-lead-actions">
              {safeTel(contact.phone) && <a href={"tel:" + safeTel(contact.phone)}>Call</a>}
              {whatsappLink(contact.phone) && <a href={whatsappLink(contact.phone)} target="_blank" rel="noopener noreferrer">WhatsApp</a>}
              <button type="button" onClick={() => openFollow(contact)} disabled={busy || Boolean(deletingId)}>Record follow-up</button>
              {!CLOSED_STATUSES.includes(contact.status) && <button type="button" onClick={() => markDone(contact)} disabled={busy || Boolean(deletingId)}>Mark done</button>}
              <button type="button" onClick={() => openHistory(contact)}>History ({contact.followUpCount || 0})</button>
              {owner && <button type="button" onClick={() => openEdit(contact)} disabled={busy || Boolean(deletingId)}>Edit</button>}
              {owner && DELETABLE_STATUSES.includes(contact.status) && <button type="button" className="personal-danger" onClick={() => deleteClosedContact(contact)} disabled={busy || Boolean(deletingId)}>{deletingId === contact.id ? "Deleting..." : "Delete"}</button>}
            </div>
            {followId === contact.id && <form className="personal-follow-form" onSubmit={saveFollow}>
              <h3>Record contact with {contact.name}</h3>
              <div className="personal-field-grid">
                <label>Channel<select value={followForm.channel} onChange={(e) => setFollowForm((f) => ({ ...f, channel: e.target.value }))}>
                  <option value="call">Phone call</option><option value="whatsapp">WhatsApp</option><option value="other">Other</option>
                </select></label>
                <label>Outcome<select value={followForm.status} onChange={(e) => setFollowForm((f) => ({ ...f, status: e.target.value }))}>
                  {STATUSES.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                </select></label>
                <label>Next follow-up<input type="date" value={followForm.nextFollowUpAt} onChange={(e) => setFollowForm((f) => ({ ...f, nextFollowUpAt: e.target.value }))} /></label>
              </div>
              <label>Follow-up notes *<textarea required rows={2} maxLength={1000} value={followForm.note} onChange={(e) => setFollowForm((f) => ({ ...f, note: e.target.value }))} placeholder="What did the prospect say? What should happen next?" /></label>
              <div className="personal-lead-buttons"><button type="submit" className="personal-primary" disabled={busy}>{busy ? "Saving..." : "Save follow-up"}</button><button type="button" onClick={() => setFollowId("")}>Cancel</button></div>
            </form>}
            {historyId === contact.id && <div className="personal-history">
              <h3>Follow-up history</h3>
              {historyLoading ? <p>Loading history...</p> : activities.length ? activities.map((activity) =>
                <div key={activity.id}><strong>{dateText(activity.createdAt)} · {activity.channel} · {badgeStatus(activity.status)}</strong>
                  <p>{activity.note}</p><small>Recorded by {activity.recordedByName || "Staff"}</small></div>)
                : <p>No follow-up recorded yet.</p>}
            </div>}
          </article>;
        })}
      </div>
    </div>
  </section>;
}

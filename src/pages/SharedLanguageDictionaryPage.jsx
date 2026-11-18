import { useCallback, useEffect, useMemo, useState } from "react";
import { addDoc, collection, deleteDoc, doc, getDocs, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { db } from "../firebase.js";
import { useAuth } from "../context/AuthContext.jsx";

const LANGUAGES = [
  { id: "german", label: "German" },
  { id: "swahili", label: "Swahili" },
];
const COURSE_LEVELS = { german: ["A1", "A2", "B1", "B2", "C1", "C2"], swahili: ["A1", "A2"] };
const COURSE_DAYS = Array.from({ length: 60 }, (_, i) => i + 1);
const MAX_CONTENT_CHARACTERS = 100_000;
const cardStyle = { border: "1px solid #dbe3ec", borderRadius: 14, padding: 18, background: "#fff" };

export default function SharedLanguageDictionaryPage() {
  const { user, role, staffLanguages = [], staffPages = [] } = useAuth();
  const isAdmin = role === "admin";
  const languages = isAdmin ? LANGUAGES : LANGUAGES.filter(language => staffLanguages.includes(language.id));
  const [activeLanguage, setActiveLanguage] = useState(languages[0]?.id || "german");
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [courseLevel, setCourseLevel] = useState("A1");
  const [courseDay, setCourseDay] = useState(1);
  const [filterDay, setFilterDay] = useState("all");
  const [note, setNote] = useState("");
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async () => {
    if (!user) return;
    if (!isAdmin && !staffLanguages.length) { setItems([]); setError(""); return; }
    setBusy(true);
    setError("");
    try {
      const constraints = isAdmin ? [] : [where("language", "in", staffLanguages)];
      const result = await getDocs(query(collection(db, "sharedLanguageDictionary"), ...constraints));
      const allowed = new Set(isAdmin ? LANGUAGES.map(language => language.id) : staffLanguages);
      setItems(result.docs.map(snapshot => ({ id: snapshot.id, ...snapshot.data() }))
        .filter(item => allowed.has(item.language))
        .sort((left, right) => (right.updatedAt?.seconds || 0) - (left.updatedAt?.seconds || 0)));
    } catch (err) {
      setError(err?.message || "Could not load the shared dictionary.");
    } finally { setBusy(false); }
  }, [isAdmin, staffLanguages, user]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    if (languages.length && !languages.some(language => language.id === activeLanguage)) setActiveLanguage(languages[0].id);
  }, [activeLanguage, languages]);

  const visibleItems = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return items.filter(item => item.language === activeLanguage &&
      (filterDay === "all" || (item.courseLevel === courseLevel && Number(item.courseDay) === Number(filterDay))) &&
      (!term || `${item.title} ${item.content} ${item.note} ${item.authorName}`.toLocaleLowerCase().includes(term)));
  }, [activeLanguage, courseLevel, filterDay, items, search]);

  function resetForm() {
    setTitle(""); setContent(""); setNote(""); setEditing(null);
  }

  function editItem(item) {
    setEditing(item.id); setActiveLanguage(item.language);
    setTitle(item.title || ""); setContent(item.content || ""); setNote(item.note || "");
    setCourseLevel(item.courseLevel || "A1"); setCourseDay(item.courseDay || 1);
    setNotice(`Editing “${item.title}”.`); setError("");
  }


  async function save(event) {
    event.preventDefault();
    if (!title.trim() || !content.trim()) { setError("Add a title and paste some text before saving."); return; }
    setBusy(true); setError(""); setNotice("");
    const payload = {
      language: activeLanguage,
      courseLevel,
      courseDay: Number(courseDay),
      title: title.trim().slice(0, 160),
      content,
      note,
      authorUid: editing ? (items.find(item => item.id === editing)?.authorUid || user.uid) : user.uid,
      authorName: user.displayName || user.email || "Staff",
      updatedAt: serverTimestamp(),
    };
    try {
      if (editing) await updateDoc(doc(db, "sharedLanguageDictionary", editing), payload);
      else await addDoc(collection(db, "sharedLanguageDictionary"), payload);
      setNotice(editing ? "Changes saved." : "Saved to the shared dictionary.");
      resetForm(); await refresh();
    } catch (err) { setError(err?.message || "Could not save this text."); }
    finally { setBusy(false); }
  }

  async function removeItem(item) {
    if (item.authorUid !== user.uid && !isAdmin) return;
    if (!window.confirm(`Delete “${item.title}” from the shared dictionary?`)) return;
    setBusy(true); setError(""); setNotice("");
    try {
      await deleteDoc(doc(db, "sharedLanguageDictionary", item.id));
      if (editing === item.id) resetForm();
      setNotice("Entry deleted."); await refresh();
    } catch (err) { setError(err?.message || "Could not delete this entry."); }
    finally { setBusy(false); }
  }

  if (!isAdmin && !staffPages.includes("shared-dictionary")) {
    return <section style={{ padding: 24 }}><h1>Shared Dictionary</h1><p>This page has not been assigned to your staff account.</p></section>;
  }

  return <main style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px 48px" }}>
    <header style={{ marginBottom: 22 }}>
      <h1 style={{ marginBottom: 6 }}>Shared Course Notes</h1>
      <p style={{ marginTop: 0, color: "#536477" }}>Select a course day, paste a radio script or other lesson text, and save it for your colleagues to copy. No uploads.</p>
    </header>
    {error && <p role="alert" style={{ color: "#b42318" }}>{error}</p>}
    {notice && <p role="status" style={{ color: "#067647" }}>{notice}</p>}
    {languages.length === 0 ? <section style={cardStyle}><p>No language access is assigned to your account.</p></section> : <>
      <div role="tablist" aria-label="Dictionary language" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
        {languages.map(language => <button key={language.id} type="button" role="tab" aria-selected={activeLanguage === language.id} onClick={() => { setActiveLanguage(language.id); setCourseLevel("A1"); setFilterDay("all"); resetForm(); setNotice(""); }} style={{ padding: "10px 16px", borderRadius: 999, border: "1px solid #cbd5e1", background: activeLanguage === language.id ? "#0b5172" : "white", color: activeLanguage === language.id ? "white" : "#17324d", fontWeight: 700 }}>{language.label}</button>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))", gap: 18, alignItems: "start" }}>
        <form onSubmit={save} style={{ ...cardStyle, display: "grid", gap: 12 }}>
          <h2 style={{ margin: 0 }}>{editing ? "Edit shared note" : "Save course-day text"}</h2>
          <label>Course level<select value={courseLevel} onChange={event => { setCourseLevel(event.target.value); setFilterDay("all"); }} style={{ display: "block", width: "100%", marginTop: 5, padding: 10 }}>{COURSE_LEVELS[activeLanguage].map(level => <option key={level} value={level}>{level}</option>)}</select></label>
          <label>Course day<select value={courseDay} onChange={event => setCourseDay(Number(event.target.value))} style={{ display: "block", width: "100%", marginTop: 5, padding: 10 }}>{COURSE_DAYS.map(day => <option key={day} value={day}>Day {day}</option>)}</select></label>
          <label>Title<input value={title} onChange={event => setTitle(event.target.value)} maxLength={160} required style={{ display: "block", width: "100%", marginTop: 5, padding: 10, boxSizing: "border-box" }} placeholder="For example: Falowen Radio script" /></label>
          <label>Text<textarea value={content} onChange={event => setContent(event.target.value)} maxLength={MAX_CONTENT_CHARACTERS} rows={10} style={{ display: "block", width: "100%", marginTop: 5, padding: 10, boxSizing: "border-box", font: "inherit" }} placeholder="Paste the radio script or lesson note here…" /></label>
          <small>Text only, up to {MAX_CONTENT_CHARACTERS.toLocaleString()} characters. Nothing is uploaded.</small>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button type="submit" disabled={busy || !title.trim() || !content.trim()}>{busy ? "Saving…" : editing ? "Save changes" : "Save shared note"}</button>{editing && <button type="button" disabled={busy} onClick={resetForm}>Cancel edit</button>}</div>
        </form>
        <section style={{ ...cardStyle, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}><h2 style={{ margin: 0 }}>{LANGUAGES.find(language => language.id === activeLanguage)?.label} entries</h2><button type="button" disabled={busy} onClick={refresh}>Refresh</button></div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}><label>Level <select value={courseLevel} onChange={event => { setCourseLevel(event.target.value); setFilterDay("all"); }}>{COURSE_LEVELS[activeLanguage].map(level => <option key={level} value={level}>{level}</option>)}</select></label><label>Find day <select value={filterDay} onChange={event => setFilterDay(event.target.value)}><option value="all">All days</option>{COURSE_DAYS.map(day => <option key={day} value={day}>Day {day}</option>)}</select></label></div>
          <label style={{ display: "block", margin: "14px 0" }}>Search entries<input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search titles, text, notes, or authors" style={{ display: "block", width: "100%", marginTop: 5, padding: 10, boxSizing: "border-box" }} /></label>
          {busy && !items.length ? <p>Loading shared entries…</p> : null}
          {!busy && visibleItems.length === 0 ? <p>No saved entries yet. Add the first text or note for this language.</p> : null}
          <div style={{ display: "grid", gap: 12 }}>
            {visibleItems.map(item => <article key={item.id} style={{ borderTop: "1px solid #e2e8f0", paddingTop: 12 }}>
              <h3 style={{ margin: "0 0 4px", overflowWrap: "anywhere" }}>{item.title}</h3>
              <small>{item.courseLevel && item.courseDay ? `${item.courseLevel} · Day ${item.courseDay}` : "Unassigned course day"}</small>
              <small style={{ color: "#64748b" }}>Saved by {item.authorName || "Staff"}{item.updatedAt?.toDate ? ` · ${item.updatedAt.toDate().toLocaleString()}` : ""}</small>
              {item.content && <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", font: "inherit", background: "#f8fafc", borderRadius: 8, padding: 10, maxHeight: 300, overflow: "auto" }}>{item.content}</pre>}
              {item.note && <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", borderLeft: "3px solid #87b7ce", paddingLeft: 10 }}><strong>Note:</strong> {item.note}</p>}
              <button type="button" onClick={() => navigator.clipboard.writeText(item.content || "")}>Copy text</button>
              {(item.authorUid === user.uid || isAdmin) && <div style={{ display: "flex", gap: 8 }}><button type="button" disabled={busy} onClick={() => editItem(item)}>Edit</button><button type="button" disabled={busy} onClick={() => removeItem(item)}>Delete</button></div>}
            </article>)}
          </div>
        </section>
      </div>
    </>}
  </main>;
}

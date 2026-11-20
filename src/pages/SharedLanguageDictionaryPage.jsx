import { useCallback, useEffect, useMemo, useState } from "react";
import { addDoc, collection, deleteDoc, doc, getDocs, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { db } from "../firebase.js";
import { useAuth } from "../context/AuthContext.jsx";

const LANGUAGES = [
  { id: "german", label: "German" },
  { id: "swahili", label: "Swahili" },
];
const COURSE_LEVELS = { german: ["A1", "A2", "B1", "B2", "C1", "C2"], swahili: ["A1", "A2", "B1"] };
const RESOURCE_TYPES = [
  { id: "radio", label: "Falowen Radio" }, { id: "music", label: "Music lyrics" },
  { id: "grammar", label: "Grammar notes" }, { id: "vocabulary", label: "Vocabulary" },
  { id: "speaking", label: "Speaking" }, { id: "lesson", label: "Lesson notes" },
  { id: "answers", label: "Model answers" }, { id: "other", label: "Other" },
];
const RECENT_DAYS = [7, 30, 90];
function timestampMillis(value) {
  if (typeof value?.toMillis === "function") return value.toMillis();
  return typeof value?.seconds === "number" ? value.seconds * 1000 : 0;
}
// Render a small safe Markdown subset as React nodes, never as raw HTML.
function formattedText(value) {
  return String(value || "").split("\n").map((line, index) => {
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    const bullet = line.match(/^\s*[-*]\s+(.+)$/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.+)$/);
    const text = heading?.[2] || bullet?.[1] || numbered?.[1] || line;
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
      if (part.startsWith("*") && part.endsWith("*")) return <em key={i}>{part.slice(1, -1)}</em>;
      return part;
    });
    if (heading) return <div key={index} style={{ fontWeight: 700, fontSize: heading[1].length === 1 ? "1.35em" : "1.1em", marginTop: 10 }}>{parts}</div>;
    if (bullet || numbered) return <div key={index} style={{ paddingLeft: 16 }}>{bullet ? "• " : line.match(/^\s*\d+[.)]/)?.[0] + " "}{parts}</div>;
    return <div key={index} style={{ minHeight: "1.3em" }}>{parts}</div>;
  });
}
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
  const [resourceType, setResourceType] = useState("lesson");
  const [chapterId, setChapterId] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [recent, setRecent] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [preview, setPreview] = useState(false);
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
        .filter(item => allowed.has(item.language)));
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
    const cutoff = recent === "all" ? 0 : Date.now() - Number(recent) * 86400000;
    return items.filter(item => item.language === activeLanguage &&
      (filterLevel === "all" || item.courseLevel === filterLevel) &&
      (filterDay === "all" || Number(item.courseDay) === Number(filterDay)) &&
      (filterType === "all" || (item.resourceType || "lesson") === filterType) &&
      (!cutoff || timestampMillis(item.createdAt || item.updatedAt) >= cutoff) &&
      (!term || `${item.title} ${item.content} ${item.note} ${item.authorName} ${item.chapterId || ""}`.toLocaleLowerCase().includes(term)))
      .sort((a, b) => sortOrder === "oldest"
        ? timestampMillis(a.createdAt || a.updatedAt) - timestampMillis(b.createdAt || b.updatedAt)
        : timestampMillis(b.createdAt || b.updatedAt) - timestampMillis(a.createdAt || a.updatedAt));
  }, [activeLanguage, filterLevel, filterDay, filterType, items, recent, search, sortOrder]);

  function resetForm() {
    setTitle(""); setContent(""); setNote(""); setChapterId(""); setResourceType("lesson"); setPreview(false); setEditing(null);
  }

  function editItem(item) {
    setEditing(item.id); setActiveLanguage(item.language);
    setTitle(item.title || ""); setContent(item.content || ""); setNote(item.note || ""); setChapterId(item.chapterId || ""); setResourceType(item.resourceType || "lesson");
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
      chapterId: chapterId.trim().slice(0, 80),
      resourceType,
      title: title.trim().slice(0, 160),
      content,
      note,
      authorUid: editing ? (items.find(item => item.id === editing)?.authorUid || user.uid) : user.uid,
      authorName: user.displayName || user.email || "Staff",
      updatedAt: serverTimestamp(),
      ...(!editing ? { createdAt: serverTimestamp() } : {}),
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
        {languages.map(language => <button key={language.id} type="button" role="tab" aria-selected={activeLanguage === language.id} onClick={() => { setActiveLanguage(language.id); setCourseLevel("A1"); setFilterLevel("all"); setFilterDay("all"); setFilterType("all"); setRecent("all"); resetForm(); setNotice(""); }} style={{ padding: "10px 16px", borderRadius: 999, border: "1px solid #cbd5e1", background: activeLanguage === language.id ? "#0b5172" : "white", color: activeLanguage === language.id ? "white" : "#17324d", fontWeight: 700 }}>{language.label}</button>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))", gap: 18, alignItems: "start" }}>
        <form onSubmit={save} style={{ ...cardStyle, display: "grid", gap: 12 }}>
          <h2 style={{ margin: 0 }}>{editing ? "Edit shared note" : "Save course-day text"}</h2>
          <label>Course level<select value={courseLevel} onChange={event => { setCourseLevel(event.target.value); }} style={{ display: "block", width: "100%", marginTop: 5, padding: 10 }}>{COURSE_LEVELS[activeLanguage].map(level => <option key={level} value={level}>{level}</option>)}</select></label>
          <label>Resource type<select value={resourceType} onChange={event => setResourceType(event.target.value)} style={{ display: "block", width: "100%", marginTop: 5, padding: 10 }}>{RESOURCE_TYPES.map(type => <option key={type.id} value={type.id}>{type.label}</option>)}</select></label>
          <label>Chapter / assignment ID (optional)<input value={chapterId} maxLength={80} onChange={event => setChapterId(event.target.value)} placeholder="e.g. A1-14.1 or A2-10.27" style={{ display: "block", width: "100%", marginTop: 5, padding: 10 }} /></label>
          <label>Course day<select value={courseDay} onChange={event => setCourseDay(Number(event.target.value))} style={{ display: "block", width: "100%", marginTop: 5, padding: 10 }}>{COURSE_DAYS.map(day => <option key={day} value={day}>Day {day}</option>)}</select></label>
          <label>Title<input value={title} onChange={event => setTitle(event.target.value)} maxLength={160} required style={{ display: "block", width: "100%", marginTop: 5, padding: 10, boxSizing: "border-box" }} placeholder="For example: Falowen Radio script" /></label>
          <div aria-label="Text formatting" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[["Heading", "## Heading"], ["Bold", "**bold text**"], ["Italic", "*italic text*"], ["List", "- List item"], ["Numbered", "1. First item"]].map(([label, syntax]) => <button key={label} type="button" disabled={busy} onClick={() => setContent(text => text + (text && !text.endsWith("\n") ? "\n" : "") + syntax)}>{label}</button>)}
            <button type="button" onClick={() => setPreview(value => !value)}>{preview ? "Edit text" : "Preview formatting"}</button>
          </div>
          {preview && <div aria-label="Formatted text preview" style={{ border: "1px solid #dbe3ec", padding: 12, borderRadius: 8, overflowWrap: "anywhere" }}>{formattedText(content)}</div>}
          <label>Text<textarea value={content} onChange={event => setContent(event.target.value)} maxLength={MAX_CONTENT_CHARACTERS} rows={10} style={{ display: "block", width: "100%", marginTop: 5, padding: 10, boxSizing: "border-box", font: "inherit" }} placeholder="Paste the radio script or lesson note here…" /></label>
          <small>Plain text with simple Markdown formatting, up to {MAX_CONTENT_CHARACTERS.toLocaleString()} characters. Nothing is uploaded.</small>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button type="submit" disabled={busy || !title.trim() || !content.trim()}>{busy ? "Saving…" : editing ? "Save changes" : "Save shared note"}</button>{editing && <button type="button" disabled={busy} onClick={resetForm}>Cancel edit</button>}</div>
        </form>
        <section style={{ ...cardStyle, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}><h2 style={{ margin: 0 }}>{LANGUAGES.find(language => language.id === activeLanguage)?.label} entries</h2><button type="button" disabled={busy} onClick={refresh}>Refresh</button></div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
            <label>Level <select value={filterLevel} onChange={event => setFilterLevel(event.target.value)}><option value="all">All levels</option>{COURSE_LEVELS[activeLanguage].map(level => <option key={level} value={level}>{level}</option>)}</select></label>
            <label>Day <select value={filterDay} onChange={event => setFilterDay(event.target.value)}><option value="all">All days</option>{COURSE_DAYS.map(day => <option key={day} value={day}>Day {day}</option>)}</select></label>
            <label>Category <select value={filterType} onChange={event => setFilterType(event.target.value)}><option value="all">All categories</option>{RESOURCE_TYPES.map(type => <option key={type.id} value={type.id}>{type.label}</option>)}</select></label>
            <label>Recently added <select value={recent} onChange={event => setRecent(event.target.value)}><option value="all">Any time</option>{RECENT_DAYS.map(days => <option key={days} value={days}>Last {days} days</option>)}</select></label>
            <label>Order <select value={sortOrder} onChange={event => setSortOrder(event.target.value)}><option value="newest">Newest added first</option><option value="oldest">Oldest added first</option></select></label>
          </div>

          <label style={{ display: "block", margin: "14px 0" }}>Search entries<input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search titles, text, notes, or authors" style={{ display: "block", width: "100%", marginTop: 5, padding: 10, boxSizing: "border-box" }} /></label>
          {busy && !items.length ? <p>Loading shared entries…</p> : null}
          {!busy && visibleItems.length === 0 ? <p>No saved entries yet. Add the first text or note for this language.</p> : null}
          <div style={{ display: "grid", gap: 12 }}>
            {visibleItems.map(item => <article key={item.id} style={{ borderTop: "1px solid #e2e8f0", paddingTop: 12 }}>
              <h3 style={{ margin: "0 0 4px", overflowWrap: "anywhere" }}>{item.title}</h3>
              <div><small>{RESOURCE_TYPES.find(type => type.id === (item.resourceType || "lesson"))?.label || "Lesson notes"}{item.chapterId ? ` · ${item.chapterId}` : ""}</small></div>
              <small>{item.courseLevel && item.courseDay ? `${item.courseLevel} · Day ${item.courseDay}` : "Unassigned course day"}</small>
              <small style={{ color: "#64748b" }}>Saved by {item.authorName || "Staff"}{(item.createdAt || item.updatedAt)?.toDate ? ` · Added ${(item.createdAt || item.updatedAt).toDate().toLocaleString()}` : ""}{item.createdAt && item.updatedAt?.toDate ? ` · Updated ${item.updatedAt.toDate().toLocaleString()}` : ""}</small>
              {item.content && <div style={{ overflowWrap: "anywhere", font: "inherit", background: "#f8fafc", borderRadius: 8, padding: 10, maxHeight: 300, overflow: "auto" }}>{formattedText(item.content)}</div>}
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

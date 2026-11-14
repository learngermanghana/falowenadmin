import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const platforms = ["Instagram", "TikTok", "Facebook", "LinkedIn", "WhatsApp"];
export default function StaffSocialMediaPage({ language: explicitLanguage }) {
  const { user, workspaceLanguage } = useAuth();
  const language = explicitLanguage || workspaceLanguage;
  const storeKey = "falowen-staff-social-drafts:" + user.uid + ":" + language;
  const readDrafts = () => { try { const data = JSON.parse(localStorage.getItem(storeKey) || "[]"); return Array.isArray(data) ? data : []; } catch { return []; } };
  const [drafts, setDrafts] = useState(readDrafts);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [platform, setPlatform] = useState("Instagram");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState(null);
  useEffect(() => { localStorage.setItem(storeKey, JSON.stringify(drafts)); }, [drafts, storeKey]);
  const save = event => {
    event.preventDefault();
    if (!title.trim() || !caption.trim()) return;
    const next = { id: editing || crypto.randomUUID(), title: title.trim(), caption: caption.trim(), platform, language, updatedAt: new Date().toISOString() };
    setDrafts(previous => [next, ...previous.filter(item => item.id !== editing && item.id !== next.id)]);
    setTitle(""); setCaption(""); setEditing(null); setNotice("Draft saved in this browser. Publishing requires separate authorization.");
  };
  const edit = item => { setTitle(item.title); setCaption(item.caption); setPlatform(item.platform); setEditing(item.id); setNotice(""); };
  const copy = async item => { try { await navigator.clipboard.writeText(item.title + "\n\n" + item.caption); setNotice("Copied. Review before posting to a connected account."); } catch { setNotice("Copy is unavailable in this browser."); } };
  const remove = item => { if (window.confirm("Delete this draft from this browser?")) setDrafts(previous => previous.filter(row => row.id !== item.id)); };
  return <main style={{ maxWidth: 900, margin: "0 auto", padding: 20 }}>
    <h1>Social Media · {language === "swahili" ? "Swahili" : "German"}</h1>
    <p>Create and review {language === "swahili" ? "Kiswahili" : "German"} learning posts. Drafts are isolated by staff account and language.</p>
    <p><small>Drafts are saved locally on this device, not synced between devices. No post is automatically published to Falowen social accounts.</small></p>
    {notice && <p role="status">{notice}</p>}
    <form onSubmit={save} style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 20, display: "grid", gap: 12 }}>
      <h2>{editing ? "Edit draft" : "New post"}</h2>
      <label>Post title <input value={title} maxLength={160} required onChange={event => setTitle(event.target.value)} style={{ width: "100%", display: "block" }} /></label>
      <label>Platform <select value={platform} onChange={event => setPlatform(event.target.value)}>{platforms.map(name => <option key={name}>{name}</option>)}</select></label>
      <label>Caption and hashtags <textarea rows={7} maxLength={3500} required value={caption} onChange={event => setCaption(event.target.value)}
        placeholder={language === "swahili" ? "Write a natural Kiswahili learning tip, song or class update…" : "Write your German learning tip, song or class update…"} style={{ width: "100%", display: "block" }} /></label>
      <button type="submit">{editing ? "Update draft" : "Save draft"}</button>
      {editing && <button type="button" onClick={() => { setEditing(null); setTitle(""); setCaption(""); }}>Cancel editing</button>}
    </form>
    <section style={{ marginTop: 24 }}>
      <h2>Saved {language === "swahili" ? "Swahili" : "German"} drafts</h2>
      {!drafts.length && <p>No drafts yet.</p>}
      {drafts.map(item => <article key={item.id} style={{ borderBottom: "1px solid #e2e8f0", padding: 16 }}>
        <strong>{item.title}</strong> · {item.platform}<p style={{ whiteSpace: "pre-wrap" }}>{item.caption}</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" onClick={() => edit(item)}>Edit</button>
          <button type="button" onClick={() => copy(item)}>Copy caption</button>
          <button type="button" onClick={() => remove(item)}>Delete</button>
        </div>
      </article>)}
    </section>
  </main>;
}

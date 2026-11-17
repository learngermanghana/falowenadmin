import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

function Records({ user, page, language }) {
  const [rows, setRows] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [draft, setDraft] = useState(null);
  const [revision, setRevision] = useState(0);
  const results = page === "results";

  const request = useCallback(async payload => {
    const token = await user.getIdToken();
    const response = await fetch("/api/staff-records", {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ page, language, ...payload }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Request failed.");
    return data;
  }, [user, page, language]);

  useEffect(() => {
    let active = true;
    request({ action: "list" }).then(data => {
      if (active) { setRows(data.rows); setCursor(data.cursor); }
    }).catch(err => { if (active) setError(err.message); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [request, revision]);

  function refresh() {
    setBusy(true); setError(""); setDraft(null); setRows([]); setCursor(null);
    setRevision(value => value + 1);
  }

  async function more() {
    setBusy(true); setError("");
    try {
      const next = await request({ action: "list", cursor });
      setRows(previous => [...previous, ...next.rows]); setCursor(next.cursor);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  async function save(event) {
    event.preventDefault();
    setBusy(true); setError(""); setNotice("");
    try {
      const { id, version, score, comments } = draft;
      const { row } = await request({ action: "edit", id, version, score: Number(score), comments });
      setRows(previous => previous.map(old => old.id === id ? row : old));
      setDraft(null); setNotice("Result saved.");
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  return <>
    <button disabled={busy} onClick={refresh}>Refresh</button>
    {busy && <p role="status">Loading…</p>}
    {error && <p role="alert">{error}</p>}
    {notice && <p role="status">{notice}</p>}
    {!busy && !error && !rows.length && <p>{cursor ? "No matching records on this page." : `No ${page} found.`}</p>}
    {rows.length > 0 && <div style={{ overflowX: "auto" }}><table>
      <thead><tr>{(results ? ["Student", "Assignment", "Score", "Feedback", ""] : ["Student", "Student code", "Level", "Class"])
        .map(title => <th key={title} scope="col">{title}</th>)}</tr></thead>
      <tbody>{rows.map(row => <tr key={row.id}><td>{row.name || "—"}</td>
        {results ? <><td>{row.assignment}</td><td>{row.score}</td><td>{row.comments}</td>
          <td><button disabled={busy} onClick={() => { setDraft(row); setNotice(""); setError(""); }}>Edit result</button></td></>
          : <><td>{row.code}</td><td>{row.level}</td><td>{row.className}</td></>}
      </tr>)}</tbody>
    </table></div>}
    {cursor && <button disabled={busy} onClick={more}>Load more</button>}
    {draft && <form onSubmit={save}><fieldset disabled={busy}>
      <legend>{draft.name} · {draft.assignment}</legend>
      <label>Score out of 100 <input type="number" min="0" max="100" step="1" required value={draft.score}
        onChange={e => setDraft({ ...draft, score: e.target.value })} /></label>
      <label>Feedback <textarea value={draft.comments} maxLength={3000}
        onChange={e => setDraft({ ...draft, comments: e.target.value })} /></label>
      <button type="submit">Save result</button> <button type="button" onClick={() => setDraft(null)}>Cancel</button>
    </fieldset></form>}
  </>;
}

export default function StaffRecordsPage({ page }) {
  const { user, staffLanguages } = useAuth();
  const languages = staffLanguages || [];
  const [choice, setChoice] = useState("");
  const language = languages.includes(choice) ? choice : languages[0];
  return <section><h1>{page === "results" ? "Results" : "Students"}</h1>
    {languages.length > 1 && <label>Language <select value={language} onChange={e => setChoice(e.target.value)}>
      {languages.map(lang => <option key={lang} value={lang}>{lang === "swahili" ? "Swahili" : "German"}</option>)}
    </select></label>}
    {language ? <Records key={[user.uid, page, language].join("/")} user={user} page={page} language={language} />
      : <p role="alert">No teaching languages assigned.</p>}
  </section>;
}

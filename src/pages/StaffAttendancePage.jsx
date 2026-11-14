import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

export default function StaffAttendancePage() {
  const { user, workspaceLanguage } = useAuth();
  const language = workspaceLanguage;
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState("");
  const [detail, setDetail] = useState(null);
  const [sessionId, setSessionId] = useState("");
  const [marks, setMarks] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const api = useCallback(async (payload = null, query = {}) => {
    const token = await user.getIdToken();
    const params = new URLSearchParams({ language, ...query });
    const response = await fetch("/api/staff-attendance" + (payload ? "" : "?" + params), {
      method: payload ? "POST" : "GET",
      headers: { Authorization: `Bearer ${token}`, ...(payload ? { "Content-Type": "application/json" } : {}) },
      ...(payload ? { body: JSON.stringify({ ...payload, language }) } : {}),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body.ok) throw new Error(body.error || "Attendance is unavailable.");
    return body;
  }, [user, language]);

  useEffect(() => {
    let cancelled = false;
    setClassId(""); setDetail(null); setSessionId(""); setMarks({}); setError("");
    api().then(result => { if (!cancelled) setClasses(result.classes || []); })
      .catch(cause => { if (!cancelled) setError(cause.message); });
    return () => { cancelled = true; };
  }, [api]);

  useEffect(() => {
    if (!classId) return undefined;
    let cancelled = false;
    setBusy(true); setError(""); setNotice("");
    api(null, { classId })
      .then(result => {
        if (cancelled) return;
        setDetail(result);
        const today = new Date().toISOString().slice(0,10);
        const sessions = result.sessions || [];
        const selected = sessions.find(item => String(item.startsAt).slice(0, 10) === today)
          || sessions.find(item => item.status === "live") || sessions.find(item => item.status === "scheduled")
          || sessions.at(-1);
        setSessionId(selected?.id || "");
      })
      .catch(cause => { if (!cancelled) setError(cause.message); })
      .finally(() => { if (!cancelled) setBusy(false); });
    return () => { cancelled = true; };
  }, [api, classId]);

  useEffect(() => {
    if (!detail) return;
    const saved = detail.marked?.[sessionId] || {};
    setMarks(Object.fromEntries((detail.roster || []).map(student => [student.id, Boolean(saved[student.code]?.present)])));
  }, [detail, sessionId]);

  const roster = detail?.roster || [];
  const count = useMemo(() => roster.filter(item => marks[item.id]).length, [roster, marks]);
  const save = async () => {
    if (!detail || !sessionId || busy) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const result = await api({ action: "save", classId, sessionId, records: roster.map(student => ({ id: student.id, present: Boolean(marks[student.id]) })) });
      setDetail(old => ({ ...old, marked: { ...old.marked, [sessionId]: Object.fromEntries(roster.map(student => [student.code, { present: Boolean(marks[student.id]) }])) } }));
      setNotice(`Attendance saved for ${result.saved} learners.`);
    } catch (cause) { setError(cause.message); }
    finally { setBusy(false); }
  };

  return <main style={{ maxWidth: 980, padding: 18, margin: "0 auto" }}>
    <h1>Attendance · {language === "swahili" ? "Swahili" : "German"}</h1>
    <p>Only classes assigned to you by the Falowen administrator are shown. Your learner account is not affected.</p>
    {error && <p role="alert" style={{ color: "#b42318" }}>{error}</p>}
    {notice && <p role="status" style={{ color: "#067647" }}>{notice}</p>}
    <label>Assigned live class <select value={classId} onChange={event => setClassId(event.target.value)} style={{ display: "block", minWidth: 260, padding: 8 }}>
      <option value="">Choose a class</option>
      {classes.map(klass => <option key={klass.id} value={klass.id}>{klass.name}</option>)}
    </select></label>
    {!classes.length && <p>No {language} classes assigned. Ask the administrator to select your class under Staff → Edit access → Attendance.</p>}
    {busy && <p role="status">Loading or saving attendance…</p>}
    {detail && <section style={{ marginTop: 20, border: "1px solid #d9e2ef", borderRadius: 12, padding: 18 }}>
      <h2>{detail.className}</h2>
      <label>Class session <select value={sessionId} onChange={event => setSessionId(event.target.value)} style={{ display: "block", maxWidth: "100%", padding: 8 }}>
        <option value="">Choose a session</option>
        {(detail.sessions || []).map(session => <option key={session.id} value={session.id}>{session.title} · {String(session.startsAt).slice(0, 16)} · {session.status}</option>)}
      </select></label>
      {!detail.sessions?.length && <p>No sessions are scheduled for this class.</p>}
      <p><strong>{count} present</strong> out of {roster.length} enrolled learners.</p>
      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <button type="button" disabled={busy || !sessionId} onClick={() => setMarks(Object.fromEntries(roster.map(item => [item.id, true])))}>Mark all present</button>
        <button type="button" disabled={busy || !sessionId} onClick={() => setMarks(Object.fromEntries(roster.map(item => [item.id, false])))}>Mark all absent</button>
      </div>
      {roster.map(student => <label key={student.id} style={{ display: "flex", gap: 12, padding: 10, borderBottom: "1px solid #edf2f7" }}>
        <input type="checkbox" disabled={!sessionId || busy} checked={Boolean(marks[student.id])}
          onChange={event => setMarks(previous => ({ ...previous, [student.id]: event.target.checked }))} />
        <span>{student.name} <small>({student.code})</small></span>
      </label>)}
      <button type="button" style={{ marginTop: 16 }} disabled={!sessionId || busy} onClick={save}>Save attendance</button>
    </section>}
  </main>;
}
